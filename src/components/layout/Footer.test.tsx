import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Footer } from '@/components/layout/Footer';

describe('Footer', () => {
  it('mostra o copyright com o nome do projeto e o ano corrente', () => {
    vi.setSystemTime(new Date('2027-03-04T12:00:00Z'));
    render(<Footer />);

    // O ano vem do relógio: fixá-lo no código quebraria na virada do ano.
    expect(screen.getByText('© 2027 Finance IA')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('credita o autor e o bootcamp de origem', () => {
    render(<Footer />);

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
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
