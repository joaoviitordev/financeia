// Spec da feature historico (T-016).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/historico/.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InsightData } from '@/features/insights/types';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import { saveSimulation, updateSimulation } from '@/features/simulations/storage';
import { routes } from '@/router';
import { ThemeProvider } from '@/theme/ThemeProvider';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobra saudável todo mês.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('histórico e navegação', () => {
  // US-010 — Voltar a uma simulação guardada
  it('AC-030: Abrir uma simulação leva ao resultado dela @spec:AC-030', async () => {
    const user = userEvent.setup();
    const id = simulacao('Comprar um carro');
    updateSimulation(id, { insight: INSIGHT });
    vi.stubGlobal('fetch', vi.fn());

    const router = renderAt('/historico');
    await user.click(await screen.findByRole('button', { name: 'Ver detalhes' }));

    // Cheguei ao endereço de resultado dela, com os números na tela.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/resultado/${id}`);
    });
    expect(
      screen.getByRole('heading', { name: 'Resultado da sua simulação', level: 1 }),
    ).toBeInTheDocument();
  });

  // US-010 — Voltar a uma simulação guardada
  it('AC-031: Reabrir pelo histórico não custa uma nova geração @spec:AC-031', async () => {
    const user = userEvent.setup();
    const id = simulacao('Comprar um carro');
    updateSimulation(id, { insight: INSIGHT });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/historico');
    await user.click(await screen.findByRole('button', { name: 'Ver detalhes' }));

    // O diagnóstico guardado aparece...
    expect(await screen.findByText('A meta cabe no seu orçamento.')).toBeInTheDocument();
    // ...e nenhuma chamada foi feita.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // US-012 — O histórico tem endereço próprio
  it('AC-037: Voltar do histórico devolve a pessoa à tela em que estava @spec:AC-037', async () => {
    const user = userEvent.setup();
    const id = simulacao('Comprar um carro');
    updateSimulation(id, { insight: INSIGHT });
    vi.stubGlobal('fetch', vi.fn());

    // Cheguei ao histórico a partir do resultado, pelo botão do cabeçalho.
    const router = renderAt(`/resultado/${id}`);
    await user.click(screen.getByRole('button', { name: 'Suas simulações' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/historico');
    });

    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    // Estou de novo naquele resultado.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/resultado/${id}`);
    });
    expect(
      screen.getByRole('heading', { name: 'Resultado da sua simulação', level: 1 }),
    ).toBeInTheDocument();
  });

  // US-012 — O histórico tem endereço próprio
  it('AC-037: Sem tela anterior, voltar leva à apresentação @spec:AC-037', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn());

    // Link direto ou favorito: `/historico` é a primeira entrada da pilha.
    const router = renderAt('/historico');
    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
    expect(
      screen.getByRole('heading', { name: 'Vamos planejar seu futuro', level: 1 }),
    ).toBeInTheDocument();
  });
});
