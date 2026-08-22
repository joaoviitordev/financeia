import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Onboarding } from '@/features/onboarding/Onboarding';
import { QUESTIONS } from '@/features/onboarding/questions';

/** Preenche o passo atual e avança. */
async function answer(user: ReturnType<typeof userEvent.setup>, label: RegExp, value: string) {
  await user.type(screen.getByLabelText(label), value);
  await user.click(screen.getByRole('button', { name: /continuar|ver minhas metas/i }));
}

describe('Onboarding', () => {
  it('abre na apresentação explicando o que o Finance IA faz', () => {
    render(<Onboarding />);

    expect(
      screen.getByRole('heading', { name: 'Vamos planejar seu futuro', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/em uma lista de metas com prazo/i)).toBeInTheDocument();
  });

  // A promessa da abertura tem que bater com o fluxo: ela dizia "cinco" muito
  // depois de o questionário virar sete.
  it('anuncia a mesma quantidade de perguntas que o fluxo tem', () => {
    render(<Onboarding />);

    expect(
      screen.getByText(`Você responde ${String(QUESTIONS.length)} perguntas`),
    ).toBeInTheDocument();
  });

  it('vai da apresentação para a primeira pergunta', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: 'Começar' }));

    expect(screen.getByText('Passo 1 de 7')).toBeInTheDocument();
    // Por titulo: o texto da pergunta aparece tambem no <label> sr-only do campo.
    expect(
      screen.getByRole('heading', { level: 2, name: /somando todas as fontes/i }),
    ).toBeInTheDocument();
  });

  it('mantém Continuar desabilitado até a pergunta ser respondida', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: 'Começar' }));

    const continuar = screen.getByRole('button', { name: /continuar/i });
    expect(continuar).toBeDisabled();

    await user.type(screen.getByLabelText(/somando todas as fontes/i), '5000');
    expect(continuar).toBeEnabled();
  });

  it('formata o valor monetário enquanto a pessoa digita', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.type(screen.getByLabelText(/somando todas as fontes/i), '5000');

    expect(screen.getByLabelText(/somando todas as fontes/i)).toHaveValue('5.000');
  });

  it('permite voltar sem perder a resposta já dada', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await answer(user, /somando todas as fontes/i, '5000');

    expect(screen.getByText('Passo 2 de 7')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByText('Passo 1 de 7')).toBeInTheDocument();
    expect(screen.getByLabelText(/somando todas as fontes/i)).toHaveValue('5.000');
  });

  it('percorre as sete perguntas e entrega a lista de metas', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: 'Começar' }));

    await answer(user, /somando todas as fontes/i, '5000');
    await answer(user, /contas que se repetem/i, '2000');
    await answer(user, /parcelas e empréstimos/i, '0');
    await answer(user, /já tem guardado/i, '3000');
    await answer(user, /conquistar primeiro/i, 'Comprar um carro');
    await answer(user, /quanto custa esse objetivo/i, '45000');
    await answer(user, /quantos meses você quer chegar/i, '12');

    expect(screen.getByRole('heading', { name: 'Suas metas', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Reserva de emergência')).toBeInTheDocument();
    expect(screen.getByText('Comprar um carro')).toBeInTheDocument();
    expect(screen.getByText('Sobra por mês')).toBeInTheDocument();
    // A composicao completa e unica na tela; o valor "R$ 3.000,00" sozinho
    // tambem aparece como total guardado.
    expect(
      screen.getByText(/R\$\s*5\.000,00 de renda − R\$\s*2\.000,00 de gastos fixos/),
    ).toBeInTheDocument();
  });

  it('avisa quando os gastos consomem toda a renda, em vez de inventar prazo', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: 'Começar' }));

    await answer(user, /somando todas as fontes/i, '3000');
    await answer(user, /contas que se repetem/i, '3000');
    await answer(user, /parcelas e empréstimos/i, '0');
    await answer(user, /já tem guardado/i, '500');
    await answer(user, /conquistar primeiro/i, 'Viajar');
    await answer(user, /quanto custa esse objetivo/i, '10000');
    await answer(user, /quantos meses você quer chegar/i, '12');

    expect(screen.getByText(/consomem tudo que entra/i)).toBeInTheDocument();
    expect(screen.getAllByText('sem prazo estimável').length).toBeGreaterThan(0);
  });

  it('volta do primeiro passo para a apresentação', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.getByText('Passo 1 de 7')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByRole('button', { name: 'Começar' })).toBeInTheDocument();
  });

  it('volta do resumo para a última pergunta sem perder as respostas', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await answer(user, /somando todas as fontes/i, '5000');
    await answer(user, /contas que se repetem/i, '2000');
    await answer(user, /parcelas e empréstimos/i, '0');
    await answer(user, /já tem guardado/i, '3000');
    await answer(user, /conquistar primeiro/i, 'Comprar um carro');
    await answer(user, /quanto custa esse objetivo/i, '45000');
    await answer(user, /quantos meses você quer chegar/i, '12');

    expect(screen.getByRole('heading', { name: 'Suas metas', level: 1 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByText('Passo 7 de 7')).toBeInTheDocument();
    expect(screen.getByLabelText(/quantos meses você quer chegar/i)).toHaveValue('12');
  });
});
