import { type InsightData, isInsightData } from '@/features/insights/types';

/**
 * O cliente do proxy. HTTP puro, sem React.
 *
 * O navegador não fala mais com o Google e não conhece chave nenhuma: manda o
 * texto para `/api/gemini`, no próprio domínio, e quem guarda a chave é a
 * função do servidor (AC-049, AC-050). Antes desta mudança a chave tinha
 * prefixo `VITE_`, o que significa exatamente uma coisa: ela ia embutida no
 * pacote que qualquer pessoa baixa ao abrir o site.
 *
 * Como o endereço é relativo, ele funciona em qualquer domínio onde o site for
 * publicado, sem configuração e sem CORS.
 */
const PROXY_ENDPOINT = '/api/gemini';

/**
 * Cada causa tem nome próprio: chave errada e cota estourada são problemas de
 * configuração, e chamá-los de "erro inesperado" transforma cinco minutos de
 * conserto em meia hora de mistério.
 */
export type InsightErrorKind =
  'missing-key' | 'invalid-key' | 'quota' | 'network' | 'unexpected-response' | 'rate-limited';

export interface InsightFailure {
  kind: InsightErrorKind;
  message: string;
}

export type InsightResult = { ok: true; data: InsightData } | { ok: false; error: InsightFailure };

const MESSAGES: Record<InsightErrorKind, string> = {
  'missing-key':
    'Falta configurar a chave da API no servidor para gerar o diagnóstico. Defina GEMINI_API_KEY no ambiente.',
  'invalid-key': 'A chave da API foi recusada. Confira o valor de GEMINI_API_KEY no servidor.',
  quota: 'A cota da chave acabou por enquanto. Tente de novo daqui a pouco.',
  network: 'Não consegui falar com o serviço agora. Verifique a conexão e tente de novo.',
  'unexpected-response': 'A resposta veio fora do formato esperado. Tente gerar de novo.',
  // Texto próprio, e não o de `quota` (ASM-037): cota da API esgotada e rajada
  // contida pedem esperas de ordem de grandeza muito diferente, e um texto só
  // faria a pessoa esperar pela razão errada.
  'rate-limited': 'Você fez muitos pedidos em pouco tempo. Espere um instante e tente de novo.',
};

export function failure(kind: InsightErrorKind): InsightFailure {
  return { kind, message: MESSAGES[kind] };
}

const CONHECIDAS: readonly InsightErrorKind[] = [
  'missing-key',
  'invalid-key',
  'quota',
  'network',
  'unexpected-response',
  'rate-limited',
];

/**
 * A causa que o proxy nomeou.
 *
 * Uma causa que o cliente não conhece vira "resposta inesperada": é honesto,
 * porque de fato não sabemos, e é melhor que mostrar na tela um nome interno.
 * É onde caem o `bad-request` e o `forbidden-origin` do proxy, de propósito:
 * nenhum dos dois acontece com quem usa o site de verdade, e dar texto próprio
 * a eles seria escrever tela para um caso que ninguém vê.
 */
function readKind(payload: unknown): InsightErrorKind {
  if (typeof payload !== 'object' || payload === null) {
    return 'unexpected-response';
  }
  const kind = (payload as { kind?: unknown }).kind;

  return CONHECIDAS.find((conhecida) => conhecida === kind) ?? 'unexpected-response';
}

/** Remove a cerca de código (```json … ```) que o modelo às vezes insiste em pôr. */
function stripFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }
  return trimmed
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```$/, '')
    .trim();
}

/**
 * Lê o diagnóstico de um texto qualquer. Devolve null quando não é o que
 * pedimos — nunca um cast sobre o `JSON.parse`.
 */
export function parseInsight(text: string): InsightData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFence(text));
  } catch {
    return null;
  }

  return isInsightData(parsed) ? parsed : null;
}

export type AskResult = { ok: true; text: string } | { ok: false; error: InsightFailure };

/**
 * Pede um texto ao proxy.
 *
 * `json` pede ao modelo uma resposta em JSON, que o diagnóstico precisa e a
 * conversa não. Quem decide o que fazer com o texto é quem chamou: o proxy só
 * sabe pedir texto (ASM-031).
 */
export async function askGemini(prompt: string, json = false): Promise<AskResult> {
  let response: Response;
  try {
    response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json ? { prompt, json: true } : { prompt }),
    });
  } catch {
    return { ok: false, error: failure('network') };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: failure('unexpected-response') };
  }

  if (!response.ok) {
    return { ok: false, error: failure(readKind(payload)) };
  }

  const text =
    typeof payload === 'object' && payload !== null
      ? (payload as { text?: unknown }).text
      : undefined;

  return typeof text === 'string' && text.trim() !== ''
    ? { ok: true, text: text.trim() }
    : { ok: false, error: failure('unexpected-response') };
}

export async function generateInsight(prompt: string): Promise<InsightResult> {
  const resultado = await askGemini(prompt, true);
  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  const data = parseInsight(resultado.text);

  return data === null ? { ok: false, error: failure('unexpected-response') } : { ok: true, data };
}
