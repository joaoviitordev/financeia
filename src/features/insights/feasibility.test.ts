// Spec da feature diagnostico-ia (T-006).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/diagnostico-ia/.
import { describe, expect, it } from 'vitest';

import { assessFeasibility } from '@/features/insights/feasibility';
import { buildPlan, type PlanInput } from '@/features/onboarding/goals';

/**
 * Reserva já completa (6 × gastos fixos) em todos os casos: assim a faixa
 * testada é a do objetivo, e não o efeito colateral da reserva.
 */
function planWith(overrides: Partial<PlanInput>) {
  const input: PlanInput = {
    income: 5000,
    fixedCosts: 1000,
    debts: 0,
    saved: 6000,
    goalName: 'Viagem',
    goalCost: 48000,
    desiredMonths: 12,
    ...overrides,
  };

  return buildPlan(input);
}

describe('assessFeasibility', () => {
  // US-006 — O texto conversa com os números que estão na tela
  it('AC-018: A viabilidade sai da conta, não da opinião da IA @spec:AC-018', () => {
    // Sobra 4.000/mês e o objetivo exige 4.000/mês: saldo zero ainda é viável.
    expect(assessFeasibility(planWith({})).status).toBe('viable');

    // Objetivo de 4.800/mês contra 4.000 de sobra: falta 800, ou seja, 16,6%
    // do necessário — dentro da tolerância de 20%.
    expect(assessFeasibility(planWith({ goalCost: 57600 })).status).toBe('needs_adjustment');

    // Objetivo de 6.000/mês: faltam 2.000, um terço do necessário.
    expect(assessFeasibility(planWith({ goalCost: 72000 })).status).toBe('unfeasible');
  });

  it('trata as duas bordas exatas da tolerância', () => {
    // Falta exatamente 20% do necessário (5.000/mês, sobra 4.000): ajuste.
    expect(assessFeasibility(planWith({ goalCost: 60000 })).status).toBe('needs_adjustment');

    // Um centavo além da borda já é inviável.
    expect(assessFeasibility(planWith({ goalCost: 60000.12 })).status).toBe('unfeasible');
  });

  it('cobra a reserva incompleta antes do objetivo', () => {
    // Sem nada guardado, a reserva de 6.000 pesa 500/mês em 12 meses, e o que
    // era saldo zero vira negativo.
    const semReserva = assessFeasibility(planWith({ saved: 0 }));

    expect(semReserva.reserveMonthly).toBe(500);
    expect(semReserva.balanceAfterReserve).toBe(-500);
  });

  it('não divide por zero quando o prazo vem corrompido do armazenamento', () => {
    const semPrazo = assessFeasibility(planWith({ desiredMonths: 0 }));

    expect(Number.isFinite(semPrazo.monthlyNeeded)).toBe(true);
    expect(semPrazo.status).toBe('unfeasible');
  });
});
