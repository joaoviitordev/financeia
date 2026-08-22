// Spec da feature diagnostico-ia (T-006).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/diagnostico-ia/.
import { describe, expect, it } from 'vitest';

import { buildInsightPrompt } from '@/features/insights/prompt';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import type { SimulationRecord } from '@/features/simulations/storage';

function record(overrides: Partial<SimulationRecord['answers']> = {}): SimulationRecord {
  return {
    id: 'sim-1',
    createdAt: '2026-08-22T12:00:00.000Z',
    answers: {
      ...EMPTY_ANSWERS,
      renda: '5.000',
      gastosFixos: '2.000',
      dividas: '500',
      guardado: '3.000',
      objetivo: 'Comprar um carro',
      custoObjetivo: '45.000',
      prazo: '12',
      ...overrides,
    },
  };
}

/**
 * O Intl do pt-BR separa "R$" do número com espaço insecável (U+00A0).
 * Achatar todo espaço em branco deixa as asserções legíveis.
 */
function flat(text: string): string {
  return text.replace(/\s/g, ' ');
}

describe('buildInsightPrompt', () => {
  // US-006 — O texto conversa com os números que estão na tela
  it('AC-017: O pedido à IA carrega os números da simulação @spec:AC-017', () => {
    const prompt = flat(buildInsightPrompt(record()));

    // Os dados que a pessoa respondeu...
    expect(prompt).toContain('R$ 5.000,00');
    expect(prompt).toContain('R$ 2.000,00');
    expect(prompt).toContain('R$ 500,00');
    expect(prompt).toContain('R$ 3.000,00');
    expect(prompt).toContain('Comprar um carro');
    expect(prompt).toContain('R$ 45.000,00');
    expect(prompt).toContain('12 meses');

    // ...os valores já calculados, que a IA não deve refazer...
    expect(prompt).toContain('não refaça nenhuma conta');
    expect(prompt).toContain('R$ 2.500,00'); // sobra: 5.000 − 2.000 − 500

    // ...e o formato de resposta esperado.
    expect(prompt).toContain('objeto JSON válido');
    for (const chave of [
      'feasibility',
      'diagnosis',
      'suggestions',
      'extraIncome',
      'investment',
      'motivation',
    ]) {
      expect(prompt).toContain(`"${chave}"`);
    }
  });

  // US-006 — O texto conversa com os números que estão na tela
  it('AC-017: mudar um valor da simulação muda o pedido @spec:AC-017', () => {
    const antes = buildInsightPrompt(record());
    const depois = buildInsightPrompt(record({ renda: '9.000' }));

    expect(depois).not.toBe(antes);
    expect(flat(depois)).toContain('R$ 9.000,00');
  });

  it('manda o veredito já decidido, para a IA não inventar outro', () => {
    // Sobra 2.500/mês, objetivo exige 3.750/mês e a reserva ainda cobra 750.
    const prompt = buildInsightPrompt(record());

    expect(prompt).toContain('"unfeasible"');
    expect(prompt).toContain('Use exatamente o veredito já decidido');
  });
});
