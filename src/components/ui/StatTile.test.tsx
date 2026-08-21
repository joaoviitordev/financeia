import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatTile } from '@/components/ui/StatTile';

describe('StatTile', () => {
  it('mostra rótulo e valor', () => {
    render(<StatTile label="Saldo total" value="R$ 12.480,00" />);

    expect(screen.getByText('Saldo total')).toBeInTheDocument();
    expect(screen.getByText('R$ 12.480,00')).toBeInTheDocument();
  });

  /**
   * O teste que importa de verdade: a direção não pode depender só da cor.
   * Daltonismo vermelho-verde é exatamente o eixo usado para ganho e perda,
   * então o sinal precisa sobreviver a uma renderização sem cor nenhuma.
   */
  it('codifica alta com sinal além da cor', () => {
    render(<StatTile label="Entradas" value="R$ 7.343,28" delta={0.082} />);

    expect(screen.getByText('+8,2%')).toBeInTheDocument();
  });

  it('codifica baixa com sinal de menos tipográfico', () => {
    render(<StatTile label="Saídas" value="R$ 2.926,80" delta={-0.118} />);

    // U+2212, não hífen: alinha em coluna com o "+".
    expect(screen.getByText('−11,8%')).toBeInTheDocument();
  });

  it('omite a variação quando não há delta', () => {
    const { container } = render(<StatTile label="Investido" value="R$ 38.210,00" />);

    expect(container.textContent).not.toContain('%');
  });

  it('mostra contra o que a variação é medida', () => {
    render(
      <StatTile label="Saldo" value="R$ 12.480,00" delta={0.082} deltaLabel="vs. mês anterior" />,
    );

    expect(screen.getByText('vs. mês anterior')).toBeInTheDocument();
  });
});
