// Spec da feature diagnostico-ia (T-010).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/diagnostico-ia/.
import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InsightData } from '@/features/insights/types';
import { useInsight } from '@/features/insights/useInsight';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import { getSimulation, saveSimulation, updateSimulation } from '@/features/simulations/storage';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'Cabe no orçamento.' },
  diagnosis: { content: 'Sobra saudável.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

function novaSimulacao(): string {
  return saveSimulation({
    ...EMPTY_ANSWERS,
    renda: '5.000',
    gastosFixos: '2.000',
    dividas: '0',
    guardado: '3.000',
    objetivo: 'Comprar um carro',
    custoObjetivo: '45.000',
    prazo: '12',
  });
}

function fetchOk(data: InsightData = INSIGHT) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({ candidates: [{ content: { parts: [{ text: JSON.stringify(data) }] } }] }),
  });
}

beforeEach(() => {
  vi.stubEnv('VITE_GEMINI_API_KEY', 'chave-de-teste');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('useInsight', () => {
  // US-008 — Gerado uma vez, guardado com a simulação
  it('AC-023: Uma conclusão, uma chamada @spec:AC-023', async () => {
    const id = novaSimulacao();
    const fetchMock = fetchOk();
    vi.stubGlobal('fetch', fetchMock);

    // StrictMode monta duas vezes de propósito: é o cenário que a trava existe
    // para cobrir.
    const { result } = renderHook(() => useInsight(id), { wrapper: StrictMode });

    await waitFor(() => {
      expect(result.current.insight).toEqual(INSIGHT);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // E o que chegou fica guardado com a simulação.
    expect(getSimulation(id)?.insight).toEqual(INSIGHT);
  });

  // US-008 — Gerado uma vez, guardado com a simulação
  it('AC-024: Reabrir a simulação não chama a API @spec:AC-024', async () => {
    const id = novaSimulacao();
    updateSimulation(id, { insight: INSIGHT });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useInsight(id), { wrapper: StrictMode });

    await waitFor(() => {
      expect(result.current.insight).toEqual(INSIGHT);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('expõe a falha pelo nome e refaz a chamada no retry', async () => {
    const id = novaSimulacao();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, json: () => Promise.resolve({}) })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: JSON.stringify(INSIGHT) }] } }],
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useInsight(id));

    await waitFor(() => {
      expect(result.current.error?.kind).toBe('quota');
    });
    expect(result.current.insight).toBeNull();

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.insight).toEqual(INSIGHT);
    });
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sem chave configurada, nem tenta a rede', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const id = novaSimulacao();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useInsight(id));

    await waitFor(() => {
      expect(result.current.error?.kind).toBe('missing-key');
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('id inexistente não gera nada nem quebra', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useInsight('nao-existe'));

    expect(result.current.insight).toBeNull();
    expect(result.current.error).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
