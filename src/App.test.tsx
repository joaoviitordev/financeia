import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { routes } from '@/router';
import { ThemeProvider } from '@/theme/ThemeProvider';

function renderApp(initialPath = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });

  return render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );
}

describe('App', () => {
  it('abre na apresentação do Finance IA', () => {
    renderApp();

    expect(
      screen.getByRole('heading', { name: 'Vamos planejar seu futuro', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Começar' })).toBeInTheDocument();
  });

  it('volta à apresentação, sem respostas, ao pedir nova simulação', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.type(screen.getByLabelText(/somando todas as fontes/i), '5000');

    await user.click(screen.getByRole('button', { name: 'Nova simulação' }));

    expect(screen.getByRole('button', { name: 'Começar' })).toBeInTheDocument();

    // O reinício acontece por remontagem: se a `key` da SimulationPage parar
    // de mudar entre navegações, a tela até volta mas o valor digitado
    // sobrevive, e é justamente isso que este passo pega.
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.getByLabelText(/somando todas as fontes/i)).toHaveValue('');
  });

  it('abre o histórico e explica que nada é guardado', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Ver histórico' }));

    expect(screen.getByRole('dialog', { name: 'Histórico' })).toBeInTheDocument();
    expect(screen.getByText('Nenhuma simulação guardada')).toBeInTheDocument();
  });
});
