// Spec da feature chave-no-servidor (T-021).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/chave-no-servidor/.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { handleGeminiRequest } from '@/server/gemini-proxy';

const CHAVE = 'chave-do-servidor';

function pedido(body: unknown, method = 'POST'): Request {
  return new Request('http://localhost/api/gemini', {
    method,
    headers: { 'Content-Type': 'application/json' },
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
    const get = await handleGeminiRequest(pedido(null, 'GET'), CHAVE);
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
    const request = new Request('http://localhost/api/gemini', {
      method: 'POST',
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
