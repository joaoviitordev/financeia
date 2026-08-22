import { describe, expect, it } from 'vitest';

import { toPlanInput } from '@/features/onboarding/answers-to-plan';
import { buildPlan, type PlanInput } from '@/features/onboarding/goals';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';

const input = (overrides: Partial<PlanInput> = {}): PlanInput => ({
  income: 5000,
  fixedCosts: 2000,
  debts: 0,
  saved: 3000,
  goalName: 'Comprar um carro',
  goalCost: 45000,
  desiredMonths: 12,
  ...overrides,
});

describe('buildPlan', () => {
  it('calcula a sobra mensal como renda menos gastos fixos', () => {
    expect(buildPlan(input()).monthlySurplus).toBe(3000);
  });

  it('desconta as dívidas da sobra mensal', () => {
    expect(buildPlan(input({ debts: 500 })).monthlySurplus).toBe(2500);
  });

  it('guarda o prazo desejado no plano', () => {
    expect(buildPlan(input({ desiredMonths: 24 })).desiredMonths).toBe(24);
  });

  it('dimensiona a reserva em 6 meses de gastos fixos', () => {
    const [reserva] = buildPlan(input()).goals;

    expect(reserva?.target).toBe(12000);
  });

  it('aloca o que já está guardado na reserva antes do objetivo', () => {
    const [reserva, objetivo] = buildPlan(input()).goals;

    expect(reserva?.saved).toBe(3000);
    expect(objetivo?.saved).toBe(0);
  });

  it('transborda para o objetivo o que passa da reserva', () => {
    const [reserva, objetivo] = buildPlan(input({ saved: 20000 })).goals;

    expect(reserva?.saved).toBe(12000);
    expect(objetivo?.saved).toBe(8000);
  });

  it('usa o nome que a pessoa deu ao objetivo', () => {
    const [, objetivo] = buildPlan(input()).goals;

    expect(objetivo?.name).toBe('Comprar um carro');
  });

  it('cai para um nome genérico quando o objetivo vem em branco', () => {
    const [, objetivo] = buildPlan(input({ goalName: '   ' })).goals;

    expect(objetivo?.name).toBe('Seu objetivo');
  });

  it('estima o prazo arredondando para cima', () => {
    // Faltam 9.000 na reserva, sobrando 3.000 por mês -> 3 meses.
    const [reserva] = buildPlan(input()).goals;

    expect(reserva?.months).toBe(3);
  });

  /**
   * Sem sobra não existe prazo. Devolver Infinity ou um número enorme daria
   * uma falsa sensação de plano. O null obriga a tela a dizer a verdade.
   */
  it('não estima prazo quando os gastos consomem toda a renda', () => {
    const [reserva] = buildPlan(input({ income: 2000, fixedCosts: 2000 })).goals;

    expect(reserva?.months).toBeNull();
  });

  it('marca como conquistada a meta que já está coberta', () => {
    const [reserva] = buildPlan(input({ saved: 50000 })).goals;

    expect(reserva?.months).toBe(0);
  });
});

describe('toPlanInput', () => {
  it('converte o texto mascarado do formulário em números', () => {
    expect(
      toPlanInput({
        renda: '5.000',
        gastosFixos: '2.000',
        dividas: '500',
        guardado: '3.000',
        objetivo: 'Comprar um carro',
        custoObjetivo: '45.000,50',
        prazo: '12',
      }),
    ).toEqual({
      income: 5000,
      fixedCosts: 2000,
      debts: 500,
      saved: 3000,
      goalName: 'Comprar um carro',
      goalCost: 45000.5,
      desiredMonths: 12,
    });
  });

  it('trata campo em branco como zero, sem virar NaN', () => {
    const result = toPlanInput(EMPTY_ANSWERS);

    expect(result.income).toBe(0);
    expect(result.debts).toBe(0);
    expect(result.desiredMonths).toBe(0);
    expect(Number.isNaN(result.goalCost)).toBe(false);
  });
});
