// Spec da feature diagnostico-ia (T-008).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/diagnostico-ia/.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateInsight, parseInsight } from '@/features/insights/gemini';
import {
  corpoEnviado,
  enderecoChamado,
  proxyFalha,
  proxyResponde,
  proxySemChave,
} from '@/features/insights/proxy-double';
import type { InsightData } from '@/features/insights/types';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobram R$ 2.500 por mês.' },
  suggestions: { items: ['Automatize o aporte no dia do salário.'] },
  extraIncome: { items: ['Freelas no fim de semana.'] },
  investment: { items: ['Tesouro Selic para a reserva.'] },
  motivation: { content: 'Você está mais perto do que imagina.' },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateInsight', () => {
  // US-017 — A chave não vai para o navegador
  it('AC-050: O cliente pede ao próprio domínio, sem chave @spec:AC-050', async () => {
    const fetchMock = proxyResponde(JSON.stringify(INSIGHT));

    const result = await generateInsight('prompt');

    expect(result).toEqual({ ok: true, data: INSIGHT });

    // O pedido vai para o próprio domínio, e não para o Google.
    expect(enderecoChamado(fetchMock)).toBe('/api/gemini');
    expect(enderecoChamado(fetchMock)).not.toContain('googleapis.com');

    // O corpo leva o texto e o pedido de JSON. Chave, nenhuma.
    expect(corpoEnviado(fetchMock)).toEqual({ prompt: 'prompt', json: true });

    // E nenhum cabeçalho de chave sobrou.
    const [, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(init.headers['x-goog-api-key']).toBeUndefined();
  });

  // US-008 — Gerado uma vez, guardado com a simulação
  it('AC-025: Resposta fora do formato vira erro tratado, não tela branca @spec:AC-025', async () => {
    // A cerca de código ainda aparece mesmo pedindo JSON: ela é removida...
    proxyResponde('```json\n' + JSON.stringify(INSIGHT) + '\n```');
    await expect(generateInsight('prompt')).resolves.toEqual({ ok: true, data: INSIGHT });

    // ...e o que não é o formato esperado vira erro, não exceção.
    proxyResponde('desculpe, não posso ajudar');
    const texto = await generateInsight('prompt');
    expect(texto).toEqual({
      ok: false,
      error: { kind: 'unexpected-response', message: expect.stringContaining('formato esperado') },
    });

    // JSON válido com as chaves erradas também não passa.
    proxyResponde('{"feasibility":{}}');
    const incompleto = await generateInsight('prompt');
    expect(incompleto.ok).toBe(false);
  });

  // A causa agora é NOMEADA pelo proxy; o cliente repassa o nome à tela.
  it('dá nome a cada falha em vez de um erro genérico', async () => {
    for (const kind of ['invalid-key', 'quota', 'network', 'missing-key'] as const) {
      proxyFalha(kind);
      const result = await generateInsight('prompt');

      expect(result.ok).toBe(false);
      expect(result.ok ? null : result.error.kind).toBe(kind);
    }
  });

  // Nome que o cliente não conhece não pode virar texto interno na tela.
  it('causa desconhecida do servidor vira resposta inesperada', async () => {
    proxyFalha('bad-request', 400);

    const result = await generateInsight('prompt');

    expect(result.ok ? null : result.error.kind).toBe('unexpected-response');
  });

  it('trata queda de rede como queda de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await generateInsight('prompt');

    expect(result.ok ? null : result.error.kind).toBe('network');
  });

  // A falta da chave deixou de ser decisão local: quem sabe é o servidor.
  it('a falta de chave chega como resposta do servidor', async () => {
    proxySemChave();

    const result = await generateInsight('prompt');

    expect(result.ok ? null : result.error.kind).toBe('missing-key');
    expect(result.ok ? null : result.error.message).toContain('GEMINI_API_KEY');
  });
});

describe('parseInsight', () => {
  it('devolve null para texto que não é JSON', () => {
    expect(parseInsight('{ isso não fecha')).toBeNull();
  });

  it('aceita um status que não conhecemos, para a tela decidir o que fazer', () => {
    const estranho = { ...INSIGHT, feasibility: { status: 'talvez', content: 'texto' } };

    expect(parseInsight(JSON.stringify(estranho))).not.toBeNull();
  });
});
