import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from '@/App';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('App', () => {
  it('abre na apresentação do Finance IA', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Vamos planejar seu futuro', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Começar' })).toBeInTheDocument();
  });

  it('volta à apresentação, sem respostas, ao pedir nova simulação', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.type(screen.getByLabelText(/somando todas as fontes/i), '5000');

    await user.click(screen.getByRole('button', { name: 'Nova simulação' }));

    expect(screen.getByRole('button', { name: 'Começar' })).toBeInTheDocument();

    // O reinício acontece por remontagem: se a `key` do Onboarding parar de
    // mudar, a tela até volta mas o valor digitado sobrevive, e é justamente
    // isso que este passo pega.
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.getByLabelText(/somando todas as fontes/i)).toHaveValue('');
  });

  it('abre o histórico e explica que nada é guardado', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Ver histórico' }));

    expect(screen.getByRole('dialog', { name: 'Histórico' })).toBeInTheDocument();
    expect(screen.getByText('Nenhuma simulação guardada')).toBeInTheDocument();
  });
});
