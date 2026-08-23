// Spec da feature resultado-persistido (T-004).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/resultado-persistido/.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InsightData } from '@/features/insights/types';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import { saveSimulation, updateSimulation } from '@/features/simulations/storage';
import { formatBRL } from '@/lib/format';
import { ResultPage } from '@/routes/ResultPage';

/**
 * `router.tsx` não faz parte dos arquivos desta tarefa: a rota real é
 * montada em T-001/T-005. Aqui a `ResultPage` é testada isolada, com as
 * mesmas duas rotas que ela precisa (a dela e a raiz, para provar que o
 * caminho de volta do AC-012 realmente navega).
 */
/**
 * `formatBRL` usa espaço fino insecável (U+00A0) entre "R$" e o número. O
 * normalizador padrão do `getByText` colapsa espaços apenas no texto do DOM,
 * não no texto buscado — comparar direto com a saída de `formatBRL` nunca
 * bate. Normaliza aqui do mesmo jeito que o normalizador padrão normaliza lá.
 */
function money(value: number): string {
  return formatBRL(value).replace(/\s+/g, ' ');
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<p>Início da simulação</p>} path="/" />
        <Route element={<ResultPage />} path="/resultado/:id" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResultPage', () => {
  // US-004 — Página de resultado com link permanente
  it('AC-011: O resultado mostra os números da simulação @spec:AC-011', () => {
    const id = saveSimulation({
      ...EMPTY_ANSWERS,
      renda: '5000',
      gastosFixos: '2000',
      dividas: '500',
      guardado: '1000',
      objetivo: 'Viagem',
      custoObjetivo: '45000',
      prazo: '12',
    });

    renderAt(`/resultado/${id}`);

    // Custo da meta
    expect(screen.getByText(money(45000))).toBeInTheDocument();
    // Prazo desejado
    expect(screen.getByText('12 meses')).toBeInTheDocument();
    // Sobra mensal (renda − gastos fixos − dívidas, vinda do buildPlan)
    expect(screen.getByText(money(2500))).toBeInTheDocument();
    // Renda
    expect(screen.getByText(money(5000))).toBeInTheDocument();
    // Gastos fixos
    expect(screen.getByText(money(2000))).toBeInTheDocument();
    // Dívidas
    expect(screen.getByText(money(500))).toBeInTheDocument();
  });

  // US-004 — Página de resultado com link permanente
  it('AC-012: Endereço de simulação inexistente é explicado @spec:AC-012', async () => {
    const user = userEvent.setup();
    renderAt('/resultado/nao-existe');

    // Aviso de que a simulação não foi encontrada...
    expect(screen.getByRole('heading', { name: 'Simulação não encontrada' })).toBeInTheDocument();

    // ...e um caminho para começar outra.
    const restart = screen.getByRole('button', { name: 'Começar uma nova simulação' });
    await user.click(restart);

    expect(screen.getByText('Início da simulação')).toBeInTheDocument();
  });
});

/* --- A conversa abaixo do diagnóstico (T-020) ---------------------------- */

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobra saudável todo mês.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

type ScrollIntoView = (arg?: boolean | ScrollIntoViewOptions) => void;

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

describe('a conversa na página de resultado', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn<ScrollIntoView>();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // US-013 — Perguntar sobre o meu plano
  it('AC-038: A conversa só abre quando há diagnóstico @spec:AC-038', async () => {
    // Dado: sem chave configurada, o diagnóstico nunca chega à tela
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const id = simulacao();

    const { unmount } = renderAt(`/resultado/${id}`);

    // Então: não há conversa nenhuma ali — nem campo, nem botão de enviar.
    expect(await screen.findByText(/Falta configurar a chave/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Sua pergunta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar pergunta' })).not.toBeInTheDocument();

    // E com o diagnóstico na tela, ela aparece.
    unmount();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'chave-de-teste');
    updateSimulation(id, { insight: INSIGHT });
    renderAt(`/resultado/${id}`);

    expect(await screen.findByText('A meta cabe no seu orçamento.')).toBeInTheDocument();
    expect(screen.getByLabelText('Sua pergunta')).toBeInTheDocument();
  });

  it('enquanto o diagnóstico está a caminho, também não há conversa', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'chave-de-teste');

    // Uma requisição adiada deixa o painel carregando. Ela é liberada no fim
    // do teste de propósito: promessa que nunca resolve trava o encerramento
    // do worker do vitest, e o teste passa a pendurar a suíte inteira.
    let liberar: () => void = () => undefined;
    const adiada = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        await adiada;
        return { ok: false, status: 500, json: () => Promise.resolve({}) };
      }),
    );
    const id = simulacao();

    renderAt(`/resultado/${id}`);

    expect(screen.queryByLabelText('Sua pergunta')).not.toBeInTheDocument();

    liberar();
    await adiada;
  });
});
