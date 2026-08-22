// Spec da feature diagnostico-ia (T-011).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/diagnostico-ia/.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { InsightData } from '@/features/insights/types';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { listSimulations, updateSimulation } from '@/features/simulations/storage';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'Cabe no orçamento.' },
  diagnosis: { content: 'Sobra saudável.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

async function answer(user: ReturnType<typeof userEvent.setup>, label: RegExp, value: string) {
  await user.type(screen.getByLabelText(label), value);
  await user.click(screen.getByRole('button', { name: /continuar|ver minhas metas/i }));
}

async function responderTudo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Começar' }));
  await answer(user, /somando todas as fontes/i, '5000');
  await answer(user, /contas que se repetem/i, '2000');
  await answer(user, /parcelas e empréstimos/i, '0');
  await answer(user, /já tem guardado/i, '3000');
  await answer(user, /conquistar primeiro/i, 'Comprar um carro');
  await answer(user, /quanto custa esse objetivo/i, '45000');
  await answer(user, /quantos meses você quer chegar/i, '12');
}

describe('reconclusão da simulação', () => {
  // US-008 — Gerado uma vez, guardado com a simulação
  it('AC-026: Mudar uma resposta refaz o diagnóstico @spec:AC-026', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await responderTudo(user);

    // Dado: uma simulação com diagnóstico guardado
    const [primeira] = listSimulations();
    expect(primeira).toBeDefined();
    updateSimulation(primeira?.id ?? '', { insight: INSIGHT });

    // Quando: volto, altero uma resposta e concluo de novo
    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    await user.clear(screen.getByLabelText(/quantos meses você quer chegar/i));
    await answer(user, /quantos meses você quer chegar/i, '24');

    // Então: o diagnóstico guardado foi descartado — e não sobrou simulação
    // duplicada para o endereço antigo apontar.
    const guardadas = listSimulations();
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]?.id).toBe(primeira?.id);
    expect(guardadas[0]?.insight).toBeUndefined();
    expect(guardadas[0]?.answers.prazo).toBe('24');
  });
});
