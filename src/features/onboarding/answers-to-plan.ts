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
  // Number.parseInt de string vazia dá NaN; "|| 0" evita que ele vaze para o cálculo.
  const toMonths = (value: string): number => Number.parseInt(value, 10) || 0;

  return {
    income: toNumber(answers.renda),
    fixedCosts: toNumber(answers.gastosFixos),
    debts: toNumber(answers.dividas),
    saved: toNumber(answers.guardado),
    goalName: answers.objetivo,
    goalCost: toNumber(answers.custoObjetivo),
    desiredMonths: toMonths(answers.prazo),
  };
}
