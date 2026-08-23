import { vi } from 'vitest';

/**
 * O dublê do proxy `/api/gemini`, para os testes de tela e de cliente.
 *
 * Existe porque a fronteira do navegador mudou de lugar: antes cada teste
 * dublava o Gemini e uma chave de ambiente, e agora o que o navegador vê é o
 * nosso próprio servidor. Um dublê só, num arquivo só, é o que impede as sete
 * suítes de discordarem sobre o formato do contrato (ASM-031) e de continuarem
 * passando enquanto o produto quebra.
 *
 * Quem testa o proxy de verdade é `src/server/gemini-proxy.test.ts`. Aqui só
 * interessa o que atravessa a fronteira.
 */

/** O proxy respondendo com o texto que o modelo escreveu. */
export function proxyResponde(text: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ text }),
  });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

/** O proxy respondendo com uma causa nomeada, do jeito que ele nomeia. */
export function proxyFalha(kind: string, status = 502) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ kind }),
  });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

/** O servidor sem chave configurada: a causa vem do proxy, não de uma checagem local. */
export function proxySemChave() {
  return proxyFalha('missing-key', 503);
}

/** Uma resposta que só chega quando o teste mandar. */
export function proxyAdiado() {
  let liberar: (text: string) => void = () => undefined;
  const promessa = new Promise<string>((resolve) => {
    liberar = resolve;
  });

  const fetchMock = vi.fn().mockImplementation(async () => {
    const text = await promessa;
    return { ok: true, status: 200, json: () => Promise.resolve({ text }) };
  });
  vi.stubGlobal('fetch', fetchMock);

  return {
    fetchMock,
    liberar: (text: string) => {
      liberar(text);
    },
  };
}

/** O corpo que o navegador mandou ao proxy, na chamada de índice `n`. */
export function corpoEnviado(fetchMock: ReturnType<typeof vi.fn>, n = 0): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls[n] as [string, { body: string }];

  return JSON.parse(init.body) as Record<string, unknown>;
}

/** O endereço chamado na chamada de índice `n`. */
export function enderecoChamado(fetchMock: ReturnType<typeof vi.fn>, n = 0): string {
  const [url] = fetchMock.mock.calls[n] as [string];

  return url;
}
