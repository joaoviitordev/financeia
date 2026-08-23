// Spec da feature chave-no-servidor (T-021).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/chave-no-servidor/.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { esqueceRajada, handleGeminiRequest } from '@/server/gemini-proxy';

const CHAVE = 'chave-do-servidor';
const CASA = 'financeia.exemplo';

/**
 * Um pedido vindo do próprio site, que é o caso normal.
 *
 * `origin` e `host` batem: é o que a checagem de origem exige (ASM-033), e é o
 * que o navegador manda sozinho em todo POST.
 */
function pedido(
  body: unknown,
  { method = 'POST', origin = `https://${CASA}`, ip = '203.0.113.7' } = {},
): Request {
  const headers = new Headers({ 'Content-Type': 'application/json', host: CASA });
  if (origin !== '') {
    headers.set('origin', origin);
  }
  if (ip !== '') {
    headers.set('x-forwarded-for', ip);
  }

  return new Request(`https://${CASA}/api/gemini`, {
    method,
    headers,
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
}

/** O Gemini respondendo. */
function geminiResponde(texto: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: texto }] } }] }),
  });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function geminiFalha(status: number) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

async function corpo(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  // A rajada é estado de módulo, e estado vaza de um caso para o seguinte.
  esqueceRajada();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('handleGeminiRequest', () => {
  // US-018 — O proxy guarda a chave e responde pelo nome
  it('AC-051: O proxy fala com o Gemini usando a chave do ambiente @spec:AC-051', async () => {
    const fetchMock = geminiResponde('Corte o streaming.');

    const resposta = await handleGeminiRequest(pedido({ prompt: 'e agora?' }), CHAVE);

    // Então: repassou ao Gemini com a chave no cabeçalho...
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(init.headers['x-goog-api-key']).toBe(CHAVE);
    expect(JSON.parse(init.body)).toMatchObject({
      contents: [{ parts: [{ text: 'e agora?' }] }],
    });

    // ...e devolveu ao navegador só o texto, sem a chave em lugar nenhum.
    expect(resposta.status).toBe(200);
    const devolvido = await resposta.text();
    expect(JSON.parse(devolvido)).toEqual({ text: 'Corte o streaming.' });
    expect(devolvido).not.toContain(CHAVE);
  });

  it('pede JSON ao modelo só quando quem chamou pediu', async () => {
    const fetchMock = geminiResponde('{"ok":true}');

    await handleGeminiRequest(pedido({ prompt: 'p', json: true }), CHAVE);
    const [, comJson] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(comJson.body)).toMatchObject({
      generationConfig: { responseMimeType: 'application/json' },
    });

    vi.unstubAllGlobals();
    const outro = geminiResponde('prosa');
    await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);
    const [, semJson] = outro.mock.calls[0] as [string, { body: string }];
    const corpoSemJson = JSON.parse(semJson.body) as Record<string, unknown>;
    expect(corpoSemJson['generationConfig']).toBeUndefined();
  });

  // US-018 — O proxy guarda a chave e responde pelo nome
  it('AC-052: Sem a chave no ambiente, a tela continua explicando o que falta @spec:AC-052', async () => {
    const fetchMock = geminiResponde('nunca chamado');

    for (const semChave of [undefined, '', '   ']) {
      const resposta = await handleGeminiRequest(pedido({ prompt: 'p' }), semChave);

      expect(await corpo(resposta)).toEqual({ kind: 'missing-key' });
      expect(resposta.status).toBe(503);
    }
    // E não gastou cota tentando com chave vazia.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // US-018 — O proxy guarda a chave e responde pelo nome
  it.each([
    [401, 'invalid-key'],
    [403, 'invalid-key'],
    [429, 'quota'],
    [500, 'network'],
  ])('AC-053: status %i do Gemini chega à tela como %s @spec:AC-053', async (status, kind) => {
    geminiFalha(status);

    const resposta = await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);

    expect(await corpo(resposta)).toEqual({ kind });
  });

  // US-018 — O proxy guarda a chave e responde pelo nome
  it('AC-054: O proxy só atende o que ele existe para atender @spec:AC-054', async () => {
    const fetchMock = geminiResponde('nunca chamado');

    // Método errado.
    const get = await handleGeminiRequest(pedido(null, { method: 'GET' }), CHAVE);
    expect(await corpo(get)).toEqual({ kind: 'bad-request' });

    // Corpo sem prompt, prompt vazio, prompt que não é texto, json que não é booleano.
    for (const ruim of [
      {},
      { prompt: '' },
      { prompt: '   ' },
      { prompt: 42 },
      { prompt: 'p', json: 'sim' },
    ]) {
      const resposta = await handleGeminiRequest(pedido(ruim), CHAVE);
      expect(await corpo(resposta)).toEqual({ kind: 'bad-request' });
      expect(resposta.status).toBe(400);
    }

    // Nada disso encostou no Gemini: pedido malformado não custa cota.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('corpo que não é JSON é recusado sem chamar o Gemini', async () => {
    const fetchMock = geminiResponde('nunca chamado');
    // Vem do próprio site: senão a barreira de origem reprova antes, e o teste
    // passaria a provar outra coisa.
    const request = new Request(`https://${CASA}/api/gemini`, {
      method: 'POST',
      headers: new Headers({ host: CASA, origin: `https://${CASA}` }),
      body: 'isto não é json',
    });

    const resposta = await handleGeminiRequest(request, CHAVE);

    expect(await corpo(resposta)).toEqual({ kind: 'bad-request' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a rede caindo vira falha de rede, não exceção', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sem conexão')));

    const resposta = await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);

    expect(await corpo(resposta)).toEqual({ kind: 'network' });
  });

  it('resposta sem texto aproveitável vira erro tratado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) }),
    );

    const resposta = await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);

    expect(await corpo(resposta)).toEqual({ kind: 'unexpected-response' });
  });

  it('resposta só com espaços conta como vazia', async () => {
    geminiResponde('   ');

    const resposta = await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);

    expect(await corpo(resposta)).toEqual({ kind: 'unexpected-response' });
  });

  // A chave nunca pode sair na resposta, nem quando tudo dá errado.
  it('nenhuma resposta de erro carrega a chave', async () => {
    geminiFalha(401);

    const resposta = await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);

    expect(await resposta.text()).not.toContain(CHAVE);
  });
});

/* --- As três barreiras (T-024) ------------------------------------------- */

describe('as barreiras antes do Gemini', () => {
  // US-020 — O proxy atende só o meu site
  it('AC-056: Pedido de fora do site é recusado sem tocar no Gemini @spec:AC-056', async () => {
    const fetchMock = geminiResponde('nunca chamado');

    // Outro site.
    const deFora = await handleGeminiRequest(
      pedido({ prompt: 'p' }, { origin: 'https://outro-site.exemplo' }),
      CHAVE,
    );
    expect(await corpo(deFora)).toEqual({ kind: 'forbidden-origin' });
    expect(deFora.status).toBe(403);

    // Sem origem nenhuma: é o curl da vida (ASM-034).
    const semOrigem = await handleGeminiRequest(pedido({ prompt: 'p' }, { origin: '' }), CHAVE);
    expect(await corpo(semOrigem)).toEqual({ kind: 'forbidden-origin' });

    // Origem que nem é URL.
    const lixo = await handleGeminiRequest(pedido({ prompt: 'p' }, { origin: 'null' }), CHAVE);
    expect(await corpo(lixo)).toEqual({ kind: 'forbidden-origin' });

    // Nenhuma das três encostou no Gemini.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // US-020 — O proxy atende só o meu site
  it('AC-057: O site continua funcionando sem cadastrar domínio @spec:AC-057', async () => {
    geminiResponde('resposta');

    // O mesmo código atende qualquer casa, sem nada configurado: o que vale é
    // origem e host baterem entre si.
    for (const casa of ['localhost:5173', 'financeia.vercel.app', 'meu-dominio.com.br']) {
      esqueceRajada();
      const request = new Request(`https://${casa}/api/gemini`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          host: casa,
          // Esquema diferente do da URL de propósito: em desenvolvimento é http
          // e em produção é https, e exigir igualdade completa quebraria num
          // dos dois (ASM-033).
          origin: `http://${casa}`,
        }),
        body: JSON.stringify({ prompt: 'p' }),
      });

      const resposta = await handleGeminiRequest(request, CHAVE);

      expect(resposta.status, `${casa} deveria passar`).toBe(200);
    }
  });

  // US-021 — Nenhuma chamada custa mais que o teto
  it('AC-058: Prompt acima do teto é recusado antes do Gemini @spec:AC-058', async () => {
    const fetchMock = geminiResponde('nunca chamado');

    const gigante = 'a'.repeat(8001);
    const resposta = await handleGeminiRequest(pedido({ prompt: gigante }), CHAVE);

    expect(await corpo(resposta)).toEqual({ kind: 'bad-request' });
    expect(fetchMock).not.toHaveBeenCalled();

    // E o tamanho que o produto realmente usa passa com folga.
    esqueceRajada();
    const doProduto = 'a'.repeat(6000);
    const ok = await handleGeminiRequest(pedido({ prompt: doProduto }), CHAVE);
    expect(ok.status).toBe(200);
  });

  // US-022 — Rajada é contida e explicada
  it('AC-059: Passado o teto de chamadas na janela, o proxy recusa @spec:AC-059', async () => {
    const fetchMock = geminiResponde('resposta');

    // As 30 primeiras passam.
    for (let i = 0; i < 30; i += 1) {
      const resposta = await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);
      expect(resposta.status, `chamada ${String(i + 1)} deveria passar`).toBe(200);
    }
    expect(fetchMock).toHaveBeenCalledTimes(30);

    // A 31a é recusada, e sem custar cota.
    const excedente = await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);
    expect(await corpo(excedente)).toEqual({ kind: 'rate-limited' });
    expect(excedente.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(30);

    // Passada a janela, volta a ser atendido.
    vi.setSystemTime(Date.now() + 5 * 60 * 1000 + 1000);
    const depois = await handleGeminiRequest(pedido({ prompt: 'p' }), CHAVE);
    expect(depois.status).toBe(200);
    vi.useRealTimers();
  });

  // US-022 — Rajada é contida e explicada
  it('AC-060: O limite é de quem estourou, não de todo mundo @spec:AC-060', async () => {
    geminiResponde('resposta');

    // Um endereço estoura...
    for (let i = 0; i < 30; i += 1) {
      await handleGeminiRequest(pedido({ prompt: 'p' }, { ip: '198.51.100.1' }), CHAVE);
    }
    const estourado = await handleGeminiRequest(
      pedido({ prompt: 'p' }, { ip: '198.51.100.1' }),
      CHAVE,
    );
    expect(await corpo(estourado)).toEqual({ kind: 'rate-limited' });

    // ...e o outro continua atendido normalmente.
    const outro = await handleGeminiRequest(pedido({ prompt: 'p' }, { ip: '198.51.100.2' }), CHAVE);
    expect(outro.status).toBe(200);
  });

  // ASM-039: contador que só cresce é vazamento de memória na instância.
  it('esquece endereços cuja janela já passou', async () => {
    geminiResponde('resposta');

    await handleGeminiRequest(pedido({ prompt: 'p' }, { ip: '198.51.100.9' }), CHAVE);

    // Passada a janela, aquele endereço volta a ter a cota inteira.
    vi.setSystemTime(Date.now() + 5 * 60 * 1000 + 1000);
    for (let i = 0; i < 30; i += 1) {
      const resposta = await handleGeminiRequest(
        pedido({ prompt: 'p' }, { ip: '198.51.100.9' }),
        CHAVE,
      );
      expect(resposta.status, `chamada ${String(i + 1)} deveria passar`).toBe(200);
    }
    vi.useRealTimers();
  });

  // A ordem importa: recusar depois de chamar o Gemini não recusa nada.
  it('as barreiras vêm antes até da leitura da chave', async () => {
    const fetchMock = geminiResponde('nunca chamado');

    const semChaveEDeFora = await handleGeminiRequest(
      pedido({ prompt: 'p' }, { origin: 'https://outro-site.exemplo' }),
      undefined,
    );

    // A origem reprova primeiro: quem vem de fora nem descobre se há chave.
    expect(await corpo(semChaveEDeFora)).toEqual({ kind: 'forbidden-origin' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
