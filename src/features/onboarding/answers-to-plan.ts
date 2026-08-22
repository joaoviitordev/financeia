import type { PlanInput } from '@/features/onboarding/goals';
import type { Answers } from '@/features/onboarding/questions';
import { parseCurrencyInput } from '@/lib/format';

/**
 * Fronteira entre o formulário e o cálculo.
 *
 * É o único lugar que sabe ao mesmo tempo que as respostas são texto mascarado
 * e quais campos alimentam o plano. Mudou a máscara, mudou aqui; o cálculo em
 * `goals.ts` continua intocado.
 */
export function toPlanInput(answers: Answers): PlanInput {
  const toNumber = (value: string): number => parseCurrencyInput(value) ?? 0;

  return {
    income: toNumber(answers.renda),
    fixedCosts: toNumber(answers.gastosFixos),
    saved: toNumber(answers.guardado),
    goalName: answers.objetivo,
    goalCost: toNumber(answers.custoObjetivo),
  };
}
