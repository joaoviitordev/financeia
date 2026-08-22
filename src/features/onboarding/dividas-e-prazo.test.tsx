// Esqueletos de spec da feature resultado-persistido (T-002).
// A tag @spec:AC-xxx no título liga o teste à especificação.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { toPlanInput } from '@/features/onboarding/answers-to-plan';
import { buildPlan } from '@/features/onboarding/goals';
import { Onboarding } from '@/features/onboarding/Onboarding';

/** Preenche o passo atual e avança. Espelha o helper de Onboarding.test.tsx. */
async function answer(user: ReturnType<typeof userEvent.setup>, label: RegExp, value: string) {
  await user.type(screen.getByLabelText(label), value);
  await user.click(screen.getByRole('button', { name: /continuar|ver minhas metas/i }));
}

/** Começa a simulação e responde renda e gastos fixos, parando na pergunta de dívidas. */
async function goToDividas(user: ReturnType<typeof userEvent.setup>) {
  render(<Onboarding />);
  await user.click(screen.getByRole('button', { name: 'Começar' }));
  await answer(user, /somando todas as fontes/i, '5000');
  await answer(user, /contas que se repetem/i, '2000');
}

/** Responde todas as perguntas até a de prazo, a última do fluxo. */
async function goToPrazo(user: ReturnType<typeof userEvent.setup>) {
  await goToDividas(user);
  await answer(user, /parcelas e empréstimos/i, '0');
  await answer(user, /já tem guardado/i, '3000');
  await answer(user, /conquistar primeiro/i, 'Comprar um carro');
  await answer(user, /quanto custa esse objetivo/i, '45000');
}

// US-002 — Dívidas e prazo entram na conversa
test('AC-003: O fluxo passa a ter sete perguntas @spec:AC-003', async () => {
  const user = userEvent.setup();
  render(<Onboarding />);

  // Dado: que inicio a simulação
  // Quando: a primeira pergunta aparece
  await user.click(screen.getByRole('button', { name: 'Começar' }));

  // Então: o indicador de progresso mostra que é o passo 1 de 7
  expect(screen.getByText('Passo 1 de 7')).toBeInTheDocument();
});

// US-002 — Dívidas e prazo entram na conversa
test('AC-004: Não ter dívida é uma resposta válida @spec:AC-004', async () => {
  const user = userEvent.setup();
  // Dado: que estou na pergunta sobre parcelas e empréstimos
  await goToDividas(user);
  expect(screen.getByText('Passo 3 de 7')).toBeInTheDocument();

  // Quando: informo zero
  await user.type(screen.getByLabelText(/parcelas e empréstimos/i), '0');
  await user.click(screen.getByRole('button', { name: /continuar/i }));

  // Então: consigo avançar para a pergunta seguinte
  expect(screen.getByText('Passo 4 de 7')).toBeInTheDocument();
});

// US-002 — Dívidas e prazo entram na conversa
test('AC-005: O prazo aceita de 1 a 120 meses @spec:AC-005', async () => {
  const user = userEvent.setup();
  // Dado: que estou na pergunta sobre o prazo da meta
  await goToPrazo(user);
  expect(screen.getByText('Passo 7 de 7')).toBeInTheDocument();

  const continuar = screen.getByRole('button', { name: /ver minhas metas/i });
  const campo = screen.getByLabelText(/quantos meses você quer chegar/i);

  // Quando: informo 0 ou 121
  await user.type(campo, '0');
  // Então: não consigo avançar
  expect(continuar).toBeDisabled();

  await user.clear(campo);
  await user.type(campo, '121');
  expect(continuar).toBeDisabled();

  // com 12, avanço normalmente
  await user.clear(campo);
  await user.type(campo, '12');
  expect(continuar).toBeEnabled();

  await user.click(continuar);
  expect(screen.getByRole('heading', { name: 'Suas metas', level: 1 })).toBeInTheDocument();
});

// US-002 — Dívidas e prazo entram na conversa
test('AC-006: As dívidas reduzem a sobra mensal @spec:AC-006', () => {
  // Dado: renda de R$ 5.000, gastos fixos de R$ 2.000 e dívidas de R$ 500
  const plan = buildPlan(
    toPlanInput({
      renda: '5.000',
      gastosFixos: '2.000',
      dividas: '500',
      guardado: '',
      objetivo: '',
      custoObjetivo: '',
      prazo: '',
    }),
  );

  // Quando: o plano é montado
  // Então: a sobra mensal apresentada é de R$ 2.500
  expect(plan.monthlySurplus).toBe(2500);
});
