// Spec da feature historico (T-016).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/historico/.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InsightData } from '@/features/insights/types';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import { listSimulations, saveSimulation, updateSimulation } from '@/features/simulations/storage';
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

beforeEach(() => {
  // Com chave configurada, uma simulação sem diagnóstico chamaria a API — é o
  // que dá sentido a contar zero chamadas quando ela já tem um.
  vi.stubEnv('VITE_GEMINI_API_KEY', 'chave-de-teste');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('histórico e navegação', () => {
  // US-010 — Voltar a uma simulação guardada
  it('AC-030: Abrir uma simulação leva ao resultado dela @spec:AC-030', async () => {
    const user = userEvent.setup();
    const id = simulacao('Comprar um carro');
    updateSimulation(id, { insight: INSIGHT });
    vi.stubGlobal('fetch', vi.fn());

    const router = renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Suas simulações' }));

    const sheet = screen.getByRole('dialog', { name: 'Histórico' });
    await user.click(within(sheet).getByRole('button', { name: 'Ver detalhes' }));

    // Cheguei ao endereço de resultado dela...
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/resultado/${id}`);
    });
    expect(
      screen.getByRole('heading', { name: 'Resultado da sua simulação', level: 1 }),
    ).toBeInTheDocument();

    // ...e o histórico se fechou.
    expect(screen.queryByRole('dialog', { name: 'Histórico' })).not.toBeInTheDocument();
  });

  // US-010 — Voltar a uma simulação guardada
  it('AC-031: Reabrir pelo histórico não custa uma nova geração @spec:AC-031', async () => {
    const user = userEvent.setup();
    const id = simulacao('Comprar um carro');
    updateSimulation(id, { insight: INSIGHT });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Suas simulações' }));
    const sheet = screen.getByRole('dialog', { name: 'Histórico' });
    await user.click(within(sheet).getByRole('button', { name: 'Ver detalhes' }));

    // O diagnóstico guardado aparece...
    expect(await screen.findByText('A meta cabe no seu orçamento.')).toBeInTheDocument();
    // ...e nenhuma chamada foi feita.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // US-011 — Apagar o que não quero mais
  it('AC-035: Apagar a simulação aberta devolve a pessoa ao início @spec:AC-035', async () => {
    const user = userEvent.setup();
    const id = simulacao('Comprar um carro');
    updateSimulation(id, { insight: INSIGHT });
    vi.stubGlobal('fetch', vi.fn());

    const router = renderAt(`/resultado/${id}`);
    expect(
      screen.getByRole('heading', { name: 'Resultado da sua simulação', level: 1 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Suas simulações' }));
    const sheet = screen.getByRole('dialog', { name: 'Histórico' });
    await user.click(
      within(sheet).getByRole('button', { name: 'Excluir a simulação Comprar um carro' }),
    );
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    // Volto para a apresentação, sem passar por "simulação não encontrada".
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
    expect(
      screen.getByRole('heading', { name: 'Vamos planejar seu futuro', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Simulação não encontrada')).not.toBeInTheDocument();
    expect(listSimulations()).toEqual([]);
  });
});
