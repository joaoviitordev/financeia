import type { Planner } from '@/features/onboarding/goals';
import { GoalsSummary } from '@/features/onboarding/GoalsSummary';
import { QuestionStep } from '@/features/onboarding/QuestionStep';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { Welcome } from '@/features/onboarding/Welcome';

interface OnboardingProps {
  /** Trocável para testar o fluxo com outro algoritmo de metas. */
  planner?: Planner;
  /** Recebe o identificador da simulação guardada ao confirmar a última pergunta. */
  onConcluded?: (id: string) => void;
}

/**
 * Liga a máquina de estados às telas.
 *
 * Só decide o que renderizar. Estado, validação e cálculo vivem em
 * `useOnboarding`, e por isso esta função não tem nenhum `if` de regra de
 * negócio dentro.
 */
export function Onboarding({ planner, onConcluded }: OnboardingProps) {
  const flow = useOnboarding(planner, onConcluded);

  if (flow.stage.name === 'welcome') {
    return <Welcome onStart={flow.start} />;
  }

  if (flow.stage.name === 'summary') {
    return <GoalsSummary plan={flow.plan} onBack={flow.back} onRestart={flow.restart} />;
  }

  if (!flow.question) {
    return null;
  }

  return (
    <QuestionStep
      question={flow.question}
      value={flow.value}
      canAdvance={flow.canAdvance}
      step={flow.step}
      total={flow.total}
      isLast={flow.isLast}
      onChange={flow.answer}
      onNext={flow.next}
      onBack={flow.back}
    />
  );
}
