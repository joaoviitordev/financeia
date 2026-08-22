import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { Footer } from '@/components/layout/Footer';

/** O rodapé tem um link de rota: fora de um Router, o react-router lança. */
function renderFooter() {
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it('mostra o copyright com o nome do projeto e o ano corrente', () => {
    vi.setSystemTime(new Date('2027-03-04T12:00:00Z'));
    renderFooter();

    // O ano vem do relógio: fixá-lo no código quebraria na virada do ano.
    expect(screen.getByText('© 2027 Finance IA')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('credita o autor e o bootcamp de origem', () => {
    renderFooter();

    // Matcher por função: o texto é quebrado em vários nós pelas interpolações,
    // e getByText com string exata não atravessa essa fronteira.
    expect(
      screen.getByText((_, element) =>
        element?.textContent ===
        'Desenvolvido por João Vitor a partir do Bootcamp da DIO Santander 2026 — AI React Front-end'
          ? element.tagName === 'P'
          : false,
      ),
    ).toBeInTheDocument();
  });

  it('é um landmark contentinfo', () => {
    renderFooter();

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  // Sem este link, /historico existiria sem porta de entrada: o botão do
  // cabeçalho abre a sheet, não a página.
  it('leva ao histórico em página cheia', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Suas simulações' })).toHaveAttribute(
      'href',
      '/historico',
    );
  });
});
