/**
 * Cálculo das metas.
 *
 * Este módulo só faz aritmética. Ele não sabe que as respostas chegam como
 * texto mascarado, nem que existe uma tela: recebe números, devolve um plano.
 * A conversão de texto para número mora em `answers-to-plan.ts`, na fronteira.
 *
 * Essa separação é o que torna o cálculo testável sem montar formulário e
 * permite trocar a origem dos dados (uma API, um import de extrato) sem tocar
 * em uma linha daqui.
 */

/** Entrada já normalizada: números, não texto de formulário. */
export interface PlanInput {
  income: number;
  fixedCosts: number;
  /** Soma de parcelas e empréstimos que saem todo mês. Zero é valor legítimo. */
  debts: number;
  saved: number;
  goalName: string;
  goalCost: number;
  /** Em quantos meses a pessoa quer chegar à meta. */
  desiredMonths: number;
}

export interface Goal {
  id: string;
  name: string;
  /** Quanto a meta custa. */
  target: number;
  /** Quanto já existe reservado para ela. */
  saved: number;
  /** Meses até fechar, ou null quando não sobra dinheiro para alocar. */
  months: number | null;
  note: string;
}

export interface Plan {
  income: number;
  fixedCosts: number;
  debts: number;
  /** Renda menos gastos fixos menos dívidas. É o que financia as metas. */
  monthlySurplus: number;
  /** Prazo desejado pela pessoa, guardado para a página de resultado. */
  desiredMonths: number;
  goals: readonly Goal[];
}

/** Assinatura de quem monta o plano, para o fluxo não depender desta função. */
export type Planner = (input: PlanInput) => Plan;

const EMERGENCY_MONTHS = 6;

function monthsToGoal(remaining: number, surplus: number): number | null {
  if (remaining <= 0) {
    return 0;
  }
  // Sem sobra mensal não existe prazo. Devolver Infinity ou um número enorme
  // seria pior que admitir que a conta não fecha.
  if (surplus <= 0) {
    return null;
  }
  return Math.ceil(remaining / surplus);
}

/**
 * Monta a lista de metas.
 *
 * A reserva de emergência vem primeiro de propósito, mesmo quando não foi ela
 * que a pessoa pediu: sem colchão, qualquer imprevisto derruba o objetivo
 * principal e a pessoa recomeça do zero. A reserva consome o que já está
 * guardado; o objetivo nomeado começa do que sobrar dela.
 */
export const buildPlan: Planner = (input) => {
  const { income, fixedCosts, debts, saved, goalCost, desiredMonths } = input;
  const goalName = input.goalName.trim() || 'Seu objetivo';

  const monthlySurplus = income - fixedCosts - debts;

  const emergencyTarget = fixedCosts * EMERGENCY_MONTHS;
  const emergencySaved = Math.min(saved, emergencyTarget);
  const leftoverForGoal = Math.max(saved - emergencyTarget, 0);

  const goals: Goal[] = [
    {
      id: 'reserva',
      name: 'Reserva de emergência',
      target: emergencyTarget,
      saved: emergencySaved,
      months: monthsToGoal(emergencyTarget - emergencySaved, monthlySurplus),
      note: `${String(EMERGENCY_MONTHS)} meses de gastos fixos`,
    },
    {
      id: 'objetivo',
      name: goalName,
      target: goalCost,
      saved: leftoverForGoal,
      // Só começa depois que a reserva fecha, por isso os prazos se somam
      // na tela em vez de correrem em paralelo.
      months: monthsToGoal(goalCost - leftoverForGoal, monthlySurplus),
      note: 'O que você definiu como prioridade',
    },
  ];

  return { income, fixedCosts, debts, monthlySurplus, desiredMonths, goals };
};
