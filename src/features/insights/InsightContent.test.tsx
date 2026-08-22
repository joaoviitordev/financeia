// Spec da feature diagnostico-ia (T-012).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/diagnostico-ia/.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InsightContent } from '@/features/insights/InsightContent';
import type { InsightData } from '@/features/insights/types';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobram R$ 2.500 por mês depois das contas.' },
  suggestions: { items: ['Automatize o aporte no dia do salário.', 'Revise as assinaturas.'] },
  extraIncome: { items: ['Freelas no fim de semana.'] },
  investment: { items: ['Tesouro Selic para a reserva.'] },
  motivation: { content: 'Você está mais perto do que imagina.' },
};

function titles() {
  return screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent.trim());
}

describe('InsightContent', () => {
  // US-005 — Um diagnóstico que fala a minha língua
  it('AC-013: O diagnóstico chega em seis seções @spec:AC-013', () => {
    render(<InsightContent insight={INSIGHT} />);

    expect(titles()).toEqual([
      '🎯 Viabilidade',
      '💰 Diagnóstico',
      '📋 Sugestões',
      '💡 Renda extra',
      '🏦 Investimentos',
      '🚀 Mensagem final',
    ]);

    expect(screen.getByText('A meta cabe no seu orçamento.')).toBeInTheDocument();
    expect(screen.getByText('Sobram R$ 2.500 por mês depois das contas.')).toBeInTheDocument();
    expect(screen.getByText('Freelas no fim de semana.')).toBeInTheDocument();
    expect(screen.getByText('Você está mais perto do que imagina.')).toBeInTheDocument();
  });

  // US-005 — Um diagnóstico que fala a minha língua
  it('AC-014: O selo de viabilidade diz em texto o que a cor diz @spec:AC-014', () => {
    const rotulos = {
      viable: 'Meta viável no prazo',
      needs_adjustment: 'Ajuste necessário',
      unfeasible: 'Meta inviável no prazo',
    } as const;

    for (const [status, rotulo] of Object.entries(rotulos)) {
      const { unmount } = render(
        <InsightContent
          insight={{
            ...INSIGHT,
            feasibility: { status: status as keyof typeof rotulos, content: 'texto' },
          }}
        />,
      );

      expect(screen.getByText(rotulo)).toBeInTheDocument();
      unmount();
    }
  });

  // US-005 — Um diagnóstico que fala a minha língua
  it('AC-015: Viabilidade desconhecida não quebra a tela @spec:AC-015', () => {
    render(
      <InsightContent
        insight={{
          ...INSIGHT,
          // A IA pode devolver qualquer string; o tipo mente aqui de propósito.
          feasibility: { status: 'talvez' as never, content: 'Depende de alguns fatores.' },
        }}
      />,
    );

    // Sem selo...
    expect(screen.queryByText('Meta viável no prazo')).not.toBeInTheDocument();
    expect(screen.queryByText('Ajuste necessário')).not.toBeInTheDocument();
    expect(screen.queryByText('Meta inviável no prazo')).not.toBeInTheDocument();

    // ...e o resto do diagnóstico intacto.
    expect(screen.getByText('Depende de alguns fatores.')).toBeInTheDocument();
    expect(titles()).toHaveLength(6);
  });

  // US-005 — Um diagnóstico que fala a minha língua
  it('AC-016: Seção sem itens não deixa título órfão @spec:AC-016', () => {
    render(<InsightContent insight={{ ...INSIGHT, extraIncome: { items: [] } }} />);

    expect(titles()).not.toContain('💡 Renda extra');
    // As outras seções continuam de pé.
    expect(titles()).toContain('📋 Sugestões');
    expect(titles()).toHaveLength(5);
  });
});
