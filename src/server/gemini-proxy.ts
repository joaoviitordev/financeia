/**
 * O proxy que guarda a chave do Gemini.
 *
 * Este módulo mora em `src/` por conveniência de ferramental (typecheck, lint e
 * vitest já olham para cá), mas NUNCA é importado por código de tela: nada em
 * `src/features` ou `src/routes` deve encostar nele, ou a chave voltaria para o
 * pacote do navegador pela porta dos fundos.
 *
 * Escrito só com `Request` e `Response` do padrão web, sem nenhum tipo da
 * Vercel e sem nada do Node. É isso que permite ao mesmo arquivo servir três
 * lugares sem adaptação: a função publicada, o middleware do servidor de
 * desenvolvimento e o teste (AC-055, ASM-029). Um proxy de desenvolvimento
 * escrito à parte seria mais fácil e provaria menos: o erro que interessa é
 * justamente o que só aparece quando os dois divergem.
 */
const MODEL = 'gemini-flash-latest';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * O mesmo vocabulário de falhas que a tela já fala (ASM-032). Duplicado aqui de
 * propósito: importar do cliente amarraria o servidor a um módulo de navegador,
 * e o acoplamento certo entre os dois é o contrato, não o arquivo.
 */
export type ProxyErrorKind =
  | 'missing-key'
  | 'invalid-key'
  | 'quota'
  | 'network'
  | 'unexpected-response'
  | 'bad-request'
  | 'forbidden-origin'
  | 'rate-limited';

/** O que o navegador manda. Nada de chave: é justamente o ponto (ASM-031). */
interface ProxyRequestBody {
  prompt: string;
  /** Liga o `responseMimeType: application/json`, que o diagnóstico precisa e a conversa não. */
  json?: boolean;
}

const STATUS: Record<ProxyErrorKind, number> = {
  'missing-key': 503,
  'invalid-key': 502,
  quota: 429,
  network: 502,
  'unexpected-response': 502,
  'bad-request': 400,
  'forbidden-origin': 403,
  'rate-limited': 429,
};

/**
 * Teto de tamanho do texto enviado (ASM-035).
 *
 * A única das três barreiras que vale contra alguém decidido: ela limita o dano
 * POR CHAMADA, em vez de tentar contar chamadas. O maior texto que o produto
 * monta (o diagnóstico com a conversa cheia) fica bem abaixo disto; o teto
 * existe para o abuso, não para o uso.
 */
const TETO_DO_PROMPT = 8000;

/** Janela deslizante do limite de rajada (ASM-038). */
const JANELA_MS = 5 * 60 * 1000;
const CHAMADAS_POR_JANELA = 30;

/**
 * O contador de rajada, por endereço de rede.
 *
 * Vive em escopo de módulo, o que significa: por instância da função. Cada
 * instância conta só o que ela mesma viu, e instâncias nascem e morrem sozinhas
 * — logo isto é amortecedor, não tranca, exatamente como a ASM-036 admite. Um
 * limite de verdade precisaria de armazenamento durável, que a Q-010 deixou
 * fora desta etapa.
 */
const chamadas = new Map<string, number[]>();

/** Quem está chamando, do ponto de vista da rede. */
function identifica(request: Request): string {
  const encaminhado = request.headers.get('x-forwarded-for');
  // O primeiro da lista é o cliente; o resto são os proxies do caminho.
  const primeiro = encaminhado?.split(',')[0]?.trim();

  return primeiro === undefined || primeiro === '' ? 'sem-endereco' : primeiro;
}

/**
 * Registra a chamada e diz se ela passou do teto.
 *
 * Poda a cada passagem (ASM-039): um mapa que só cresce vira vazamento de
 * memória na instância, e o remédio não pode virar o problema.
 */
function estourouRajada(quem: string, agora: number): boolean {
  for (const [chave, marcas] of chamadas) {
    const vivas = marcas.filter((marca) => agora - marca < JANELA_MS);
    if (vivas.length === 0) {
      chamadas.delete(chave);
    } else {
      chamadas.set(chave, vivas);
    }
  }

  const minhas = chamadas.get(quem) ?? [];
  if (minhas.length >= CHAMADAS_POR_JANELA) {
    return true;
  }
  chamadas.set(quem, [...minhas, agora]);

  return false;
}

/**
 * A origem do pedido é o próprio site? (AC-056, ASM-033)
 *
 * Compara o HOST, e não a URL inteira: esquema e porta mudam entre
 * desenvolvimento e produção, e exigir igualdade completa quebraria em um dos
 * dois. Ausência de origem também reprova (ASM-034): o navegador manda o
 * cabeçalho em todo POST, e quem não manda é ferramenta de linha de comando,
 * que é justamente o alvo desta barreira.
 */
function daMesmaCasa(request: Request): boolean {
  const origem = request.headers.get('origin');
  if (origem === null) {
    return false;
  }

  try {
    const host = request.headers.get('host') ?? new URL(request.url).host;

    return new URL(origem).host === host;
  } catch {
    return false;
  }
}

/** Só para o teste poder começar do zero: rajada é estado, e estado vaza entre casos. */
export function esqueceRajada(): void {
  chamadas.clear();
}

function fail(kind: ProxyErrorKind): Response {
  return new Response(JSON.stringify({ kind }), {
    status: STATUS[kind],
    headers: { 'Content-Type': 'application/json' },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** O corpo que o navegador mandou, ou null quando não é o que combinamos. */
function readBody(value: unknown): ProxyRequestBody | null {
  if (!isRecord(value)) {
    return null;
  }
  const prompt = value['prompt'];
  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return null;
  }
  // Escrito em dois passos, e não numa condição composta: partindo de
  // `unknown`, nem toda versão do TypeScript estreita o tipo através de um
  // `&&`, e o build da Vercel recusou o que o build local aceitava.
  const json = value['json'];
  if (json === undefined) {
    return { prompt };
  }
  if (typeof json !== 'boolean') {
    return null;
  }

  return { prompt, json };
}

/** O texto que o Gemini devolve, sem confiar em nenhum nível da estrutura. */
function extractText(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }
  const candidates = payload['candidates'];
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }
  const first: unknown = candidates[0];
  const content = isRecord(first) ? first['content'] : null;
  const parts = isRecord(content) ? content['parts'] : null;
  if (!Array.isArray(parts) || parts.length === 0) {
    return null;
  }
  const part: unknown = parts[0];
  const text = isRecord(part) ? part['text'] : null;

  return typeof text === 'string' ? text : null;
}

/**
 * Atende um pedido do navegador e responde com o texto do Gemini.
 *
 * A chave entra por parâmetro, não lida do ambiente aqui dentro: quem sabe ler
 * o ambiente é o adaptador de cada lugar (`process.env` na Vercel, `loadEnv` no
 * Vite), e essa fronteira é o que torna esta função testável sem dublar ambiente
 * nenhum.
 *
 * Pedido malformado é recusado ANTES de qualquer chamada ao Gemini (AC-054):
 * corpo inválido não pode custar cota de ninguém.
 */
export async function handleGeminiRequest(
  request: Request,
  apiKey: string | undefined,
): Promise<Response> {
  if (request.method !== 'POST') {
    return fail('bad-request');
  }

  // As três barreiras vêm ANTES de tudo, inclusive antes de ler a chave: recusa
  // que custa cota não é recusa.
  if (!daMesmaCasa(request)) {
    return fail('forbidden-origin');
  }

  if (estourouRajada(identifica(request), Date.now())) {
    return fail('rate-limited');
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail('bad-request');
  }

  const body = readBody(payload);
  if (body === null) {
    return fail('bad-request');
  }

  if (body.prompt.length > TETO_DO_PROMPT) {
    return fail('bad-request');
  }

  const key = apiKey?.trim();
  if (key === undefined || key === '') {
    return fail('missing-key');
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: body.prompt }] }],
        ...(body.json === true
          ? { generationConfig: { responseMimeType: 'application/json' } }
          : {}),
      }),
    });
  } catch {
    return fail('network');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return fail('invalid-key');
    }
    if (response.status === 429) {
      return fail('quota');
    }
    return fail('network');
  }

  let geminiPayload: unknown;
  try {
    geminiPayload = await response.json();
  } catch {
    return fail('unexpected-response');
  }

  const text = extractText(geminiPayload);
  if (text === null || text.trim() === '') {
    return fail('unexpected-response');
  }

  // Só o texto atravessa. O corpo original do Gemini fica aqui: ele carrega
  // metadados de cota e de modelo que o navegador não precisa saber.
  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
