// Spec da feature resultado-persistido (T-001).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/resultado-persistido/.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { routes } from '@/router';
import { ThemeProvider } from '@/theme/ThemeProvider';

function renderAt(initialPath: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });

  return render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );
}

describe('SimulationPage', () => {
  // US-001 — Cada etapa tem endereço próprio
  it('AC-001: O formulário abre na raiz @spec:AC-001', () => {
    renderAt('/');

    // A apresentação da simulação...
    expect(
      screen.getByRole('heading', { name: 'Vamos planejar seu futuro', level: 1 }),
    ).toBeInTheDocument();

    // ...dentro do cabeçalho... (a Welcome tem um <header> próprio, aninhado
    // dentro do <main>, que a árvore de acessibilidade também expõe como
    // "banner" — o cabeçalho da aplicação é sempre o primeiro do documento).
    const [appHeader] = screen.getAllByRole('banner');
    expect(within(appHeader).getByText('Finance IA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nova simulação' })).toBeInTheDocument();

    // ...e do rodapé da aplicação.
    expect(within(screen.getByRole('contentinfo')).getByText(/Finance IA$/)).toBeInTheDocument();
    expect(screen.getByText(/Desenvolvido por/)).toBeInTheDocument();
  });

  // US-001 — Cada etapa tem endereço próprio
  it('AC-002: Recomeçar pelo cabeçalho limpa as respostas @spec:AC-002', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.type(screen.getByLabelText(/somando todas as fontes/i), '5000');

    await user.click(screen.getByRole('button', { name: 'Nova simulação' }));

    // Volto para a apresentação...
    expect(
      screen.getByRole('heading', { name: 'Vamos planejar seu futuro', level: 1 }),
    ).toBeInTheDocument();

    // ...e nenhuma resposta anterior permanece.
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.getByLabelText(/somando todas as fontes/i)).toHaveValue('');
  });
});
