import type { FeasibilityStatus, InsightData } from '@/features/insights/types';

interface InsightContentProps {
  insight: InsightData;
}

/**
 * O selo carrega rótulo em texto, não só cor — pela mesma razão que o
 * `StatTile` codifica direção três vezes: cor sozinha não chega para quem não
 * a distingue. A cor entra como reforço, num ponto, e o texto diz o veredito.
 */
const SEAL: Record<FeasibilityStatus, { label: string; dot: string }> = {
  viable: { label: 'Meta viável no prazo', dot: 'bg-good' },
  needs_adjustment: { label: 'Ajuste necessário', dot: 'bg-warning' },
  unfeasible: { label: 'Meta inviável no prazo', dot: 'bg-critical' },
};

function isKnownStatus(status: string): status is FeasibilityStatus {
  return status in SEAL;
}

function Section({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-headline text-label">
        <span aria-hidden="true">{emoji} </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-body text-label-secondary">{children}</p>;
}

/** Lista que não existe quando está vazia: título sem itens é ruído (AC-016). */
function ListSection({ emoji, title, items }: { emoji: string; title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Section emoji={emoji} title={title}>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {items.map((item) => (
          <li key={item} className="text-body text-label-secondary">
            {item}
          </li>
        ))}
      </ol>
    </Section>
  );
}

/**
 * O diagnóstico escrito pela IA, em seis seções.
 *
 * Nada aqui decide nada: recebe o texto pronto e desenha. Um status que não
 * conhecemos (o modelo pode inventar) perde o selo e mantém o resto — degradar
 * é melhor que sumir com o diagnóstico inteiro (AC-015).
 */
export function InsightContent({ insight }: InsightContentProps) {
  const seal = isKnownStatus(insight.feasibility.status)
    ? SEAL[insight.feasibility.status]
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Section emoji="🎯" title="Viabilidade">
        {seal !== undefined && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-fill-tertiary px-3 py-1">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${seal.dot}`} />
            <span className="text-footnote font-medium text-label">{seal.label}</span>
          </span>
        )}
        <Paragraph>{insight.feasibility.content}</Paragraph>
      </Section>

      <Section emoji="💰" title="Diagnóstico">
        <Paragraph>{insight.diagnosis.content}</Paragraph>
      </Section>

      <ListSection emoji="📋" title="Sugestões" items={insight.suggestions.items} />
      <ListSection emoji="💡" title="Renda extra" items={insight.extraIncome.items} />
      <ListSection emoji="🏦" title="Investimentos" items={insight.investment.items} />

      <Section emoji="🚀" title="Mensagem final">
        <Paragraph>{insight.motivation.content}</Paragraph>
      </Section>
    </div>
  );
}
