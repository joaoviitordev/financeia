import { useCallback, useMemo, useRef, useState } from 'react';

import { toPlanInput } from '@/features/onboarding/answers-to-plan';
import { getField } from '@/features/onboarding/fields/registry';
import { buildPlan, type Plan, type Planner } from '@/features/onboarding/goals';
import {
  type Answers,
  EMPTY_ANSWERS,
  type Question,
  QUESTIONS,
} from '@/features/onboarding/questions';
import { saveSimulation, updateSimulation } from '@/features/simulations/storage';

export type Stage =
  { name: 'welcome' } | { name: 'questions'; index: number } | { name: 'summary' };

export interface OnboardingState {
  stage: Stage;
  /** A pergunta do passo atual, ou null fora da etapa de perguntas. */
  question: Question | null;
  value: string;
  /** A resposta atual já serve para avançar? */
  canAdvance: boolean;
  step: number;
  total: number;
  isLast: boolean;
  plan: Plan;
  start: () => void;
  answer: (raw: string) => void;
  next: () => void;
  back: () => void;
  restart: () => void;
}

/**
 * Máquina de estados do onboarding.
 *
 * Fica fora dos componentes de propósito: as telas passam a só desenhar o que
 * recebem, e a navegação pode ser testada sem renderizar nada. O passo atual é
 * uma união discriminada, não um par de booleanos, então o estado impossível
 * de "está no resumo e no passo 3" não existe.
 *
 * O `planner` entra por parâmetro para o fluxo não ficar preso a um algoritmo
 * de metas específico.
 *
 * Concluir a última pergunta guarda a simulação e devolve o identificador por
 * `onConcluded` (AC-010). O hook não conhece rotas de propósito: quem decide
 * para onde ir com esse identificador é a tela que o chama.
 */
export function useOnboarding(
  planner: Planner = buildPlan,
  onConcluded?: (id: string) => void,
): OnboardingState {
  const [stage, setStage] = useState<Stage>({ name: 'welcome' });
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  // Voltar do resumo e confirmar de novo corrige a mesma simulação em vez de
  // criar outra: senão cada ida e volta deixaria um registro órfão no
  // armazenamento, e o endereço da primeira conclusão ficaria desatualizado.
  const savedId = useRef<string | null>(null);

  const plan = useMemo(() => planner(toPlanInput(answers)), [answers, planner]);

  const index = stage.name === 'questions' ? stage.index : -1;
  const question = index >= 0 ? (QUESTIONS[index] ?? null) : null;
  const value = question ? answers[question.id] : '';
  const canAdvance = question ? getField(question.kind).isComplete(value) : false;
  const isLast = index === QUESTIONS.length - 1;

  const start = useCallback(() => {
    setStage({ name: 'questions', index: 0 });
  }, []);

  const answer = useCallback(
    (raw: string) => {
      if (!question) {
        return;
      }
      const normalized = getField(question.kind).normalize(raw);
      setAnswers((current) => ({ ...current, [question.id]: normalized }));
    },
    [question],
  );

  const next = useCallback(() => {
    if (stage.name !== 'questions') {
      return;
    }
    if (stage.index < QUESTIONS.length - 1) {
      setStage({ name: 'questions', index: stage.index + 1 });
      return;
    }

    // Última pergunta confirmada: a simulação vira um registro com endereço
    // próprio antes de qualquer tela aparecer.
    // `insight: undefined` apaga o diagnóstico da conclusão anterior: ele
    // falava dos números antigos, e texto velho ao lado de card novo é o pior
    // resultado possível (ASM-012). `messages: undefined` leva a conversa pelo
    // mesmo motivo e no mesmo movimento (ASM-022, AC-046): ela discutia esses
    // mesmos números, e sobreviver a eles seria deixar conselho errado na tela.
    const previous = savedId.current;
    const id =
      previous !== null &&
      updateSimulation(previous, { answers, insight: undefined, messages: undefined })
        ? previous
        : saveSimulation(answers);
    savedId.current = id;

    setStage({ name: 'summary' });
    onConcluded?.(id);
  }, [stage, answers, onConcluded]);

  // Voltar sempre existe: do primeiro passo cai na apresentação, e do resumo
  // volta para a última pergunta. Mudar de ideia não deve custar recomeçar.
  const back = useCallback(() => {
    setStage((current) => {
      if (current.name === 'summary') {
        return { name: 'questions', index: QUESTIONS.length - 1 };
      }
      if (current.name !== 'questions') {
        return current;
      }
      return current.index === 0
        ? { name: 'welcome' }
        : { name: 'questions', index: current.index - 1 };
    });
  }, []);

  const restart = useCallback(() => {
    setAnswers(EMPTY_ANSWERS);
    savedId.current = null;
    setStage({ name: 'welcome' });
  }, []);

  return {
    stage,
    question,
    value,
    canAdvance,
    step: index + 1,
    total: QUESTIONS.length,
    isLast,
    plan,
    start,
    answer,
    next,
    back,
    restart,
  };
}
