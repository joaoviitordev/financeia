// Spec da feature diagnostico-ia (T-013).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/diagnostico-ia/.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InsightPanel } from '@/features/insights/InsightPanel';
import {
  proxyAdiado,
  proxyFalha,
  proxyResponde,
  proxySemChave,
} from '@/features/insights/proxy-double';
import type { InsightData } from '@/features/insights/types';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import { saveSimulation } from '@/features/simulations/storage';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobra saudável todo mês.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

function novaSimulacao(): string {
  return saveSimulation({
    ...EMPTY_ANSWERS,
    renda: '5.000',
    gastosFixos: '2.000',
    dividas: '0',
    guardado: '3.000',
    objetivo: 'Comprar um carro',
    custoObjetivo: '45.000',
    prazo: '12',
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InsightPanel', () => {
  // US-007 — A espera e a falha são explicadas
  it('AC-019: Enquanto o diagnóstico não chega, a tela mostra que está vindo @spec:AC-019', () => {
    // Uma resposta adiada congela a tela no estado de carregamento.
    proxyAdiado();

    render(<InsightPanel id={novaSimulacao()} />);

    // O título já está lá antes da resposta, para o layout não pular depois.
    expect(
      screen.getByRole('heading', { name: /Insight financeiro personalizado/ }),
    ).toBeInTheDocument();

    // E o painel se anuncia como ocupado para quem não vê o esqueleto.
    const painel = screen.getByRole('status');
    expect(painel).toHaveAttribute('aria-busy', 'true');
    expect(painel.querySelector('.animate-pulse')).not.toBeNull();
  });

  // US-007 — A espera e a falha são explicadas
  it('AC-020: Cada falha é dita pelo nome, com caminho de volta @spec:AC-020', async () => {
    const user = userEvent.setup();
    // As causas agora vêm nomeadas pelo proxy, não deduzidas de um status.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.resolve({ kind: 'invalid-key' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ kind: 'quota' }),
      })
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    render(<InsightPanel id={novaSimulacao()} />);

    // Chave recusada diz que é a chave...
    expect(await screen.findByText(/chave da API foi recusada/i)).toBeInTheDocument();

    // ...e o botão de tentar de novo realmente refaz a chamada.
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText(/cota da chave acabou/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText(/Verifique a conexão/i)).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  // US-007 — A espera e a falha são explicadas
  it('AC-021: Nunca dois estados ao mesmo tempo @spec:AC-021', async () => {
    proxyResponde(JSON.stringify(INSIGHT));

    render(<InsightPanel id={novaSimulacao()} />);

    // Carregando: sem conteúdo e sem erro na tela.
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('A meta cabe no seu orçamento.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();

    // Conteúdo: sem esqueleto e sem erro.
    await waitFor(() => {
      expect(screen.getByText('A meta cabe no seu orçamento.')).toBeInTheDocument();
    });
    const painel = screen.getByRole('status');
    expect(painel).toHaveAttribute('aria-busy', 'false');
    expect(painel.querySelector('.animate-pulse')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  // US-007 — A espera e a falha são explicadas
  it('AC-022: Sem chave configurada, o aplicativo continua de pé @spec:AC-022', async () => {
    // A falta da chave é do SERVIDOR agora, e chega nomeada na resposta: o
    // navegador não tem mais como saber disso sozinho.
    proxySemChave();

    render(<InsightPanel id={novaSimulacao()} />);

    expect(await screen.findByText(/Falta configurar a chave/i)).toBeInTheDocument();
    // Nada de erro de rede na tela: a causa foi dita pelo nome.
    expect(screen.queryByText(/Verifique a conexão/i)).not.toBeInTheDocument();
  });
  // US-022 — Rajada é contida e explicada
  it('AC-061: A tela diz que foi limite de uso, e não erro @spec:AC-061', async () => {
    proxyFalha('rate-limited', 429);

    render(<InsightPanel id={novaSimulacao()} />);

    // Diz que foram muitos pedidos em pouco tempo, e que é para tentar de novo
    // em seguida.
    expect(await screen.findByText(/muitos pedidos em pouco tempo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();

    // E com texto DIFERENTE do da cota da API esgotada: as duas esperas são de
    // ordem de grandeza diferente, e um texto só faria a pessoa esperar pela
    // razão errada (ASM-037).
    expect(screen.queryByText(/cota da chave acabou/i)).not.toBeInTheDocument();
  });
});
