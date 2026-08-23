// Spec da feature chat-educador (T-020).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/chat-educador/.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatMessage } from '@/features/insights/chat-types';
import { proxyResponde } from '@/features/insights/proxy-double';
import type { InsightData } from '@/features/insights/types';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import {
  getSimulation,
  listSimulations,
  saveSimulation,
  updateSimulation,
} from '@/features/simulations/storage';
import { ResultPage } from '@/routes/ResultPage';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobra saudável todo mês.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

const MENSAGENS: ChatMessage[] = [
  { id: 'm1', role: 'user', content: 'E o prazo?', createdAt: '2026-08-23T12:00:00.000Z' },
  {
    id: 'm2',
    role: 'assistant',
    content: 'Dá para encurtar dois meses.',
    createdAt: '2026-08-23T12:00:05.000Z',
  },
];

function simulacao(): string {
  return saveSimulation({
    ...EMPTY_ANSWERS,
    renda: '5000',
    gastosFixos: '2000',
    dividas: '0',
    guardado: '3000',
    objetivo: 'Comprar um carro',
    custoObjetivo: '45000',
    prazo: '12',
  });
}

function renderResultado(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/resultado/${id}`]}>
      <Routes>
        <Route element={<p>Início da simulação</p>} path="/" />
        <Route element={<ResultPage />} path="/resultado/:id" />
      </Routes>
    </MemoryRouter>,
  );
}

/** O proxy respondendo texto livre. */
function respondeCom(texto: string) {
  proxyResponde(texto);
}

type ScrollIntoView = (arg?: boolean | ScrollIntoViewOptions) => void;

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn<ScrollIntoView>();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a conversa na página de resultado', () => {
  // US-015 — A conversa acompanha a simulação
  it('AC-045: A conversa sobrevive ao recarregar @spec:AC-045', async () => {
    const user = userEvent.setup();
    const id = simulacao();
    updateSimulation(id, { insight: INSIGHT });
    respondeCom('Cortando 300 por mês você chega dois meses antes.');

    // Dado: uma conversa com pergunta e resposta nesta simulação
    const { unmount } = renderResultado(id);
    await user.type(
      await screen.findByLabelText('Sua pergunta'),
      'E se eu cortar o aluguel?{Enter}',
    );
    expect(
      await screen.findByText('Cortando 300 por mês você chega dois meses antes.'),
    ).toBeInTheDocument();

    // A conversa foi parar no armazenamento, não só no estado do React.
    await waitFor(() => {
      expect(getSimulation(id)?.messages).toHaveLength(2);
    });

    // Quando: recarrego a página de resultado dela
    unmount();
    renderResultado(id);

    // Então: as mesmas mensagens estão lá, na mesma ordem.
    expect(await screen.findByText('E se eu cortar o aluguel?')).toBeInTheDocument();
    expect(
      screen.getByText('Cortando 300 por mês você chega dois meses antes.'),
    ).toBeInTheDocument();
    expect(getSimulation(id)?.messages?.map((m) => m.role)).toEqual(['user', 'assistant']);
  });

  // US-015 — A conversa acompanha a simulação
  it('AC-046: Mudar uma resposta descarta a conversa junto com o diagnóstico @spec:AC-046', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);

    // Dado: uma simulação com diagnóstico e conversa guardados
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    for (const [rotulo, valor] of [
      [/somando todas as fontes/i, '5000'],
      [/contas que se repetem/i, '2000'],
      [/parcelas e empréstimos/i, '0'],
      [/já tem guardado/i, '3000'],
      [/conquistar primeiro/i, 'Comprar um carro'],
      [/quanto custa esse objetivo/i, '45000'],
      [/quantos meses você quer chegar/i, '12'],
    ] as [RegExp, string][]) {
      await user.type(screen.getByLabelText(rotulo), valor);
      await user.click(screen.getByRole('button', { name: /continuar|ver minhas metas/i }));
    }

    const [primeira] = listSimulations();
    updateSimulation(primeira?.id ?? '', { insight: INSIGHT, messages: MENSAGENS });

    // Quando: volto, altero uma resposta e concluo de novo
    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    await user.clear(screen.getByLabelText(/quantos meses você quer chegar/i));
    await user.type(screen.getByLabelText(/quantos meses você quer chegar/i), '24');
    await user.click(screen.getByRole('button', { name: /continuar|ver minhas metas/i }));

    // Então: a conversa antiga não está mais lá, pela mesma razão que o
    // diagnóstico antigo também não.
    const guardadas = listSimulations();
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]?.id).toBe(primeira?.id);
    expect(guardadas[0]?.messages).toBeUndefined();
    expect(guardadas[0]?.insight).toBeUndefined();
    expect(guardadas[0]?.answers.prazo).toBe('24');
  });
});
