import { useEffect, useRef, useState } from 'react';

import { generateInsight, type InsightFailure } from '@/features/insights/gemini';
import { buildInsightPrompt } from '@/features/insights/prompt';
import type { InsightData } from '@/features/insights/types';
import { getSimulation, updateSimulation } from '@/features/simulations/storage';

export interface InsightState {
  insight: InsightData | null;
  isLoading: boolean;
  error: InsightFailure | null;
  /** Refaz a geração ignorando o que estiver guardado. */
  retry: () => void;
}

/** O que voltou de uma tentativa específica. */
interface Outcome {
  key: string;
  insight?: InsightData;
  error?: InsightFailure;
}

/**
 * O diagnóstico de uma simulação: guardado, se já existir; gerado, se não.
 *
 * Duas travas moram aqui, e as duas custam dinheiro se faltarem. A primeira é
 * o cache: um diagnóstico já gravado no registro nunca é regerado, e é isso
 * que faz reabrir o endereço sair de graça (AC-024). A segunda é a `ref` de
 * requisição em voo: em desenvolvimento o StrictMode monta o componente duas
 * vezes, e sem ela cada simulação pagaria duas chamadas (AC-023).
 *
 * A chave de controle é `id + tentativa`, não um booleano: assim o `retry`
 * abre uma requisição nova sem que a anterior, ainda voando, sobrescreva o
 * resultado ao chegar atrasada. E só existe um estado de verdade — o que
 * voltou da rede; "carregando" é dedução, não mais uma variável para
 * dessincronizar.
 */
export function useInsight(id: string | undefined): InsightState {
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const inFlight = useRef<string | null>(null);

  const key = `${id ?? ''}#${String(attempt)}`;
  const record = id === undefined ? undefined : getSimulation(id);

  const cached = attempt === 0 ? (record?.insight ?? null) : null;
  const needsRequest = record !== undefined && cached === null;

  useEffect(() => {
    if (!needsRequest || id === undefined) {
      return;
    }
    if (inFlight.current === key) {
      return;
    }
    // Relido aqui, e não do render: o `retry` precisa das respostas como elas
    // estão agora, não como estavam quando a tela montou.
    const fresh = getSimulation(id);
    if (fresh === undefined) {
      return;
    }
    inFlight.current = key;

    void generateInsight(buildInsightPrompt(fresh)).then((result) => {
      // Outra tentativa assumiu enquanto esta voava: a resposta velha morre aqui.
      if (inFlight.current !== key) {
        return;
      }
      if (result.ok) {
        updateSimulation(id, { insight: result.data });
        setOutcome({ key, insight: result.data });
      } else {
        setOutcome({ key, error: result.error });
      }
    });
  }, [id, key, needsRequest]);

  const current = outcome?.key === key ? outcome : null;

  return {
    insight: current?.insight ?? cached,
    isLoading: needsRequest && current === null,
    error: current?.error ?? null,
    retry: () => {
      setAttempt((value) => value + 1);
    },
  };
}
