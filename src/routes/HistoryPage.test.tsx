// Spec da feature historico (T-016).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/historico/.
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import { saveSimulation } from '@/features/simulations/storage';
import { routes } from '@/router';
import { ThemeProvider } from '@/theme/ThemeProvider';

function simulacao(objetivo: string): string {
  return saveSimulation({
    ...EMPTY_ANSWERS,
    renda: '5.000',
    gastosFixos: '2.000',
    dividas: '0',
    guardado: '3.000',
    objetivo,
    custoObjetivo: '45.000',
    prazo: '12',
  });
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>,
  );

  return router;
}

describe('HistoryPage', () => {
  // US-012 — O histórico tem endereço próprio
  it('AC-036: /historico mostra a lista em página cheia @spec:AC-036', () => {
    simulacao('Viagem');
    simulacao('Comprar um carro');

    renderAt('/historico');

    // As duas simulações guardadas, com os controles de cada uma.
    expect(screen.getByRole('heading', { name: 'Suas simulações', level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Comprar um carro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir a simulação Viagem' })).toBeInTheDocument();

    // Dentro do cabeçalho e do rodapé da aplicação.
    const [appHeader] = screen.getAllByRole('banner');
    expect(within(appHeader!).getByText('Finance IA')).toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).getByText(/Finance IA$/)).toBeInTheDocument();
  });

  it('sem simulações guardadas, a página explica o que vai aparecer ali', () => {
    renderAt('/historico');

    expect(screen.getByText('Nenhuma simulação por aqui ainda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Começar uma simulação' })).toBeInTheDocument();
  });
});
