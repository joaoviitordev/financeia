// Spec da feature historico (T-015).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/historico/.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { InsightData } from '@/features/insights/types';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import { HistoryList } from '@/features/simulations/HistoryList';
import { listSimulations, saveSimulation, updateSimulation } from '@/features/simulations/storage';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'Cabe no orçamento.' },
  diagnosis: { content: 'Sobra saudável.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

function simulacao(objetivo: string, custo = '45.000'): string {
  return saveSimulation({
    ...EMPTY_ANSWERS,
    renda: '5.000',
    gastosFixos: '2.000',
    dividas: '0',
    guardado: '3.000',
    objetivo,
    custoObjetivo: custo,
    prazo: '12',
  });
}

function renderList(props: Partial<Parameters<typeof HistoryList>[0]> = {}) {
  const onOpen = vi.fn();
  const onStart = vi.fn();
  const onDeleted = vi.fn();

  render(<HistoryList onOpen={onOpen} onStart={onStart} onDeleted={onDeleted} {...props} />);

  return { onOpen, onStart, onDeleted };
}

/** Os nomes das simulações, na ordem em que a lista os desenhou. */
function nomesNaTela(): string[] {
  return screen
    .getAllByRole('listitem')
    .map((item) => within(item).getByRole('button', { name: /^Excluir a simulação / }))
    .map((botao) => botao.getAttribute('aria-label')?.replace('Excluir a simulação ', '') ?? '');
}

describe('HistoryList', () => {
  // US-009 — Ver o que já simulei
  it('AC-027: A lista mostra as simulações, da mais recente para a mais antiga @spec:AC-027', () => {
    simulacao('Viagem', '10.000');
    simulacao('Carro', '45.000');
    simulacao('Casa', '300.000');

    renderList();

    expect(nomesNaTela()).toEqual(['Casa', 'Carro', 'Viagem']);

    // Cada uma com o objetivo, o custo da meta e a data em que foi criada.
    const [primeira] = screen.getAllByRole('listitem');
    expect(within(primeira!).getByText('Casa')).toBeInTheDocument();
    expect(within(primeira!).getByText(/R\$\s*300\.000,00/)).toBeInTheDocument();
    expect(within(primeira!).getByText(/de \d{4}$/)).toBeInTheDocument();
  });

  // US-009 — Ver o que já simulei
  it('AC-028: A lista diz quais já têm diagnóstico @spec:AC-028', () => {
    const comDiagnostico = simulacao('Viagem');
    updateSimulation(comDiagnostico, { insight: INSIGHT });
    simulacao('Carro');

    renderList();

    expect(screen.getByText('Diagnóstico pronto')).toBeInTheDocument();
    expect(screen.getByText('Sem diagnóstico ainda')).toBeInTheDocument();
  });

  // US-009 — Ver o que já simulei
  it('AC-029: Sem nada guardado, o histórico explica o que vai aparecer ali @spec:AC-029', async () => {
    const user = userEvent.setup();
    const { onStart } = renderList();

    expect(screen.getByText('Nenhuma simulação por aqui ainda')).toBeInTheDocument();
    expect(screen.getByText(/fica guardada neste dispositivo/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Começar uma simulação' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  // US-011 — Apagar o que não quero mais
  it('AC-032: Excluir pede confirmação antes @spec:AC-032', async () => {
    const user = userEvent.setup();
    simulacao('Viagem');
    const { onDeleted } = renderList();

    await user.click(screen.getByRole('button', { name: 'Excluir a simulação Viagem' }));

    // A confirmação avisa que não tem volta...
    const dialogo = screen.getByRole('dialog', { name: 'Apagar esta simulação?' });
    expect(within(dialogo).getByText(/não dá para desfazer/i)).toBeInTheDocument();

    // ...e desistir mantém a simulação guardada.
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));

    expect(listSimulations()).toHaveLength(1);
    expect(onDeleted).not.toHaveBeenCalled();
    expect(screen.getByText('Viagem')).toBeInTheDocument();
  });

  // US-011 — Apagar o que não quero mais
  it('confirmar exclusão tira da lista e avisa quem está usando', async () => {
    const user = userEvent.setup();
    simulacao('Viagem');
    const carro = simulacao('Carro');
    const { onDeleted } = renderList();

    await user.click(screen.getByRole('button', { name: 'Excluir a simulação Carro' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(nomesNaTela()).toEqual(['Viagem']);
    expect(listSimulations()).toHaveLength(1);
    expect(onDeleted).toHaveBeenCalledWith([carro]);
  });

  // US-011 — Apagar o que não quero mais
  it('apagar tudo passa pela mesma confirmação e esvazia a lista', async () => {
    const user = userEvent.setup();
    const viagem = simulacao('Viagem');
    const carro = simulacao('Carro');
    const { onDeleted } = renderList();

    await user.click(screen.getByRole('button', { name: 'Apagar todas as simulações' }));
    const dialogo = screen.getByRole('dialog', { name: 'Apagar todas as simulações?' });
    await user.click(within(dialogo).getByRole('button', { name: 'Apagar todas' }));

    expect(listSimulations()).toEqual([]);
    expect(screen.getByText('Nenhuma simulação por aqui ainda')).toBeInTheDocument();
    expect(onDeleted).toHaveBeenCalledWith(expect.arrayContaining([viagem, carro]));
  });

  // US-010 — Voltar a uma simulação guardada
  it('pede para abrir a simulação escolhida, sem decidir a rota por conta própria', async () => {
    const user = userEvent.setup();
    simulacao('Viagem');
    const carro = simulacao('Carro');
    const { onOpen } = renderList();

    const [primeiro] = screen.getAllByRole('listitem');
    await user.click(within(primeiro!).getByRole('button', { name: 'Ver detalhes' }));

    expect(onOpen).toHaveBeenCalledWith(carro);
  });
});
