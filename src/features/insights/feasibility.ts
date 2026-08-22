import type { FeasibilityStatus } from '@/features/insights/types';
import type { Plan } from '@/features/onboarding/goals';

/**
 * A viabilidade da meta, decidida por conta e não por opinião.
 *
 * Um modelo de linguagem é probabilístico: perguntar a ele se a meta cabe no
 * orçamento renderia respostas diferentes para os mesmos números, e um selo
 * verde discordando dos cards logo acima. Então a conta é nossa — a IA só
 * escreve o texto que acompanha o veredito (ASM-010).
 *
 * A reserva de emergência entra antes do objetivo, como no resto do produto:
 * sem colchão, um imprevisto derruba a meta e a pessoa recomeça do zero.
 */
export interface Feasibility {
  /** Quanto o objetivo exige por mês para fechar no prazo desejado. */
  monthlyNeeded: number;
  /** Quanto a reserva ainda incompleta consome por mês no mesmo prazo. */
  reserveMonthly: number;
  /** O que sobra da sobra mensal depois da reserva e do objetivo. */
  balanceAfterReserve: number;
  status: FeasibilityStatus;
}

/** Até onde um saldo negativo ainda é "ajuste", e não "inviável". */
const ADJUSTMENT_TOLERANCE = 0.2;

function goalTarget(plan: Plan, id: string): number {
  return plan.goals.find((goal) => goal.id === id)?.target ?? 0;
}

function goalRemaining(plan: Plan, id: string): number {
  const goal = plan.goals.find((item) => item.id === id);
  if (goal === undefined) {
    return 0;
  }
  return Math.max(goal.target - goal.saved, 0);
}

export function assessFeasibility(plan: Plan): Feasibility {
  // O prazo é validado entre 1 e 120 na pergunta; o piso aqui existe para um
  // registro corrompido não virar divisão por zero.
  const months = Math.max(plan.desiredMonths, 1);

  const monthlyNeeded = goalTarget(plan, 'objetivo') / months;
  const reserveMonthly = goalRemaining(plan, 'reserva') / months;
  const balanceAfterReserve = plan.monthlySurplus - reserveMonthly - monthlyNeeded;

  if (balanceAfterReserve >= 0) {
    return { monthlyNeeded, reserveMonthly, balanceAfterReserve, status: 'viable' };
  }

  const gap = Math.abs(balanceAfterReserve);
  const status: FeasibilityStatus =
    gap <= monthlyNeeded * ADJUSTMENT_TOLERANCE ? 'needs_adjustment' : 'unfeasible';

  return { monthlyNeeded, reserveMonthly, balanceAfterReserve, status };
}
