// Spec da feature resultado-persistido (T-005).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/resultado-persistido/.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { listSimulations } from '@/features/simulations/storage';
import { routes } from '@/router';
import { ThemeProvider } from '@/theme/ThemeProvider';

/** Preenche o passo atual e confirma. */
async function answer(user: ReturnType<typeof userEvent.setup>, label: RegExp, value: string) {
  await user.type(screen.getByLabelText(label), value);
  await user.click(screen.getByRole('button', { name: /continuar|ver minhas metas/i }));
}

/**
 * A árvore de rotas real, num `createMemoryRouter`: o critério é sobre o
 * endereço para onde a conclusão leva, então testar com rotas de mentira não
 * provaria nada — é a rota de verdade que precisa existir e casar com o id.
 */
function renderApp() {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });

  render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );

  return router;
}

describe('conclusão da simulação', () => {
  // US-004 — Página de resultado com link permanente
  it('AC-010: Concluir leva ao resultado da simulação criada @spec:AC-010', async () => {
    const user = userEvent.setup();
    const router = renderApp();

    // Dado: que respondi todas as perguntas
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await answer(user, /somando todas as fontes/i, '5000');
    await answer(user, /contas que se repetem/i, '2000');
    await answer(user, /parcelas e empréstimos/i, '500');
    await answer(user, /já tem guardado/i, '3000');
    await answer(user, /conquistar primeiro/i, 'Comprar um carro');
    await answer(user, /quanto custa esse objetivo/i, '45000');

    // Quando: confirmo a última
    await answer(user, /quantos meses você quer chegar/i, '12');

    // Então: sou levada ao endereço de resultado da simulação recém-guardada.
    const [simulation, ...rest] = listSimulations();
    expect(simulation).toBeDefined();
    expect(rest).toHaveLength(0);
    expect(router.state.location.pathname).toBe(`/resultado/${simulation?.id ?? ''}`);

    // ...e o endereço mostra mesmo o resultado dela, com as respostas dadas.
    expect(
      screen.getByRole('heading', { name: 'Resultado da sua simulação', level: 1 }),
    ).toBeInTheDocument();
    // O que é guardado é a resposta normalizada pelo campo — a moeda com o
    // separador de milhar, do mesmo jeito que aparece na tela.
    expect(simulation?.answers.renda).toBe('5.000');
    expect(simulation?.answers.prazo).toBe('12');
    expect(screen.getByText('12 meses')).toBeInTheDocument();
  });

  it('recarregar o endereço do resultado devolve a mesma simulação', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await answer(user, /somando todas as fontes/i, '5000');
    await answer(user, /contas que se repetem/i, '2000');
    await answer(user, /parcelas e empréstimos/i, '0');
    await answer(user, /já tem guardado/i, '3000');
    await answer(user, /conquistar primeiro/i, 'Comprar um carro');
    await answer(user, /quanto custa esse objetivo/i, '45000');
    await answer(user, /quantos meses você quer chegar/i, '12');

    const [simulation] = listSimulations();
    expect(simulation).toBeDefined();

    // Uma aba nova, sem nenhum estado em memória, abrindo o mesmo endereço:
    // é isso que a gravação compra.
    const reopened = createMemoryRouter(routes, {
      initialEntries: [`/resultado/${simulation?.id ?? ''}`],
    });
    render(
      <ThemeProvider>
        <RouterProvider router={reopened} />
      </ThemeProvider>,
    );

    expect(
      screen.getAllByRole('heading', { name: 'Resultado da sua simulação', level: 1 }),
    ).not.toHaveLength(0);
  });
});
