// Spec da feature diagnostico-ia (T-008).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/diagnostico-ia/.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateInsight, parseInsight } from '@/features/insights/gemini';
import type { InsightData } from '@/features/insights/types';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobram R$ 2.500 por mês.' },
  suggestions: { items: ['Automatize o aporte no dia do salário.'] },
  extraIncome: { items: ['Freelas no fim de semana.'] },
  investment: { items: ['Tesouro Selic para a reserva.'] },
  motivation: { content: 'Você está mais perto do que imagina.' },
};

/** Resposta do Gemini com o texto que o modelo escreveu. */
function geminiOk(text: string) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text }] }, index: 0 }] }),
  };
}

function httpError(status: number) {
  return { ok: false, status, json: () => Promise.resolve({}) };
}

beforeEach(() => {
  vi.stubEnv('VITE_GEMINI_API_KEY', 'chave-de-teste');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('generateInsight', () => {
  it('lê o diagnóstico de uma resposta boa e manda a chave no header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiOk(JSON.stringify(INSIGHT)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateInsight('prompt');

    expect(result).toEqual({ ok: true, data: INSIGHT });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain('chave-de-teste'); // fora da URL, sempre
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('chave-de-teste');
  });

  // US-008 — Gerado uma vez, guardado com a simulação
  it('AC-025: Resposta fora do formato vira erro tratado, não tela branca @spec:AC-025', async () => {
    // A cerca de código ainda aparece mesmo pedindo JSON: ela é removida...
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(geminiOk('```json\n' + JSON.stringify(INSIGHT) + '\n```')),
    );
    await expect(generateInsight('prompt')).resolves.toEqual({ ok: true, data: INSIGHT });

    // ...e o que não é o formato esperado vira erro, não exceção.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiOk('desculpe, não posso ajudar')));
    const texto = await generateInsight('prompt');
    expect(texto).toEqual({
      ok: false,
      error: { kind: 'unexpected-response', message: expect.stringContaining('formato esperado') },
    });

    // JSON válido com as chaves erradas também não passa.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiOk('{"feasibility":{}}')));
    const incompleto = await generateInsight('prompt');
    expect(incompleto.ok).toBe(false);
  });

  it('dá nome a cada falha em vez de um erro genérico', async () => {
    const casos = [
      { status: 401, kind: 'invalid-key' },
      { status: 403, kind: 'invalid-key' },
      { status: 429, kind: 'quota' },
      { status: 500, kind: 'network' },
    ] as const;

    for (const caso of casos) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(httpError(caso.status)));
      const result = await generateInsight('prompt');

      expect(result.ok).toBe(false);
      expect(result.ok ? null : result.error.kind).toBe(caso.kind);
    }
  });

  it('trata queda de rede como queda de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await generateInsight('prompt');

    expect(result.ok ? null : result.error.kind).toBe('network');
  });

  it('não tenta a rede sem chave configurada', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateInsight('prompt');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.ok ? null : result.error.kind).toBe('missing-key');
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
