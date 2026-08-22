import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatTile } from '@/components/ui/StatTile';
import type { Plan } from '@/features/onboarding/goals';
import { formatBRL } from '@/lib/format';

interface GoalsSummaryProps {
  plan: Plan;
  /** Volta para a última pergunta, preservando as respostas. */
  onBack: () => void;
  onRestart: () => void;
}

function formatMonths(months: number | null): string {
  if (months === null) {
    return 'sem prazo estimável';
  }
  if (months === 0) {
    return 'já conquistada';
  }
  if (months === 1) {
    return 'em 1 mês';
  }
  if (months < 12) {
    return `em ${String(months)} meses`;
  }

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearLabel = years === 1 ? '1 ano' : `${String(years)} anos`;

  return rest === 0 ? `em ${yearLabel}` : `em ${yearLabel} e ${String(rest)} meses`;
}

export function GoalsSummary({ plan, onBack, onRestart }: GoalsSummaryProps) {
  const noSurplus = plan.monthlySurplus <= 0;

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <span aria-hidden="true" className="text-5xl">
          🎯
        </span>
        <h1 className="text-title-1 text-label">Suas metas</h1>
        <p className="text-body text-balance text-label-secondary">
          Montadas a partir das suas respostas, no seu ritmo atual de poupança.
        </p>
      </header>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <StatTile label="Sobra por mês" value={formatBRL(plan.monthlySurplus)} />
            {/* Detalhamento, não comparação, por isso fica fora do StatTile, cujo
                deltaLabel só existe para dizer contra o que a variação é medida. */}
            <p className="tabular-figures text-footnote text-label-tertiary">
              {formatBRL(plan.income)} de renda − {formatBRL(plan.fixedCosts)} de gastos fixos
            </p>
          </div>
          {noSurplus && (
            <p className="text-footnote text-loss">
              Seus gastos fixos consomem tudo que entra. Enquanto isso não mudar, não há como
              estimar prazo. O primeiro passo é abrir espaço no orçamento, não guardar mais.
            </p>
          )}
        </CardBody>
      </Card>

      <ol className="flex flex-col gap-4">
        {plan.goals.map((goal) => {
          const remaining = Math.max(goal.target - goal.saved, 0);
          const percent = goal.target === 0 ? 0 : Math.min((goal.saved / goal.target) * 100, 100);

          return (
            <li key={goal.id}>
              <Card>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-headline text-label">{goal.name}</span>
                      <span className="text-footnote text-label-secondary">{goal.note}</span>
                    </div>
                    <span className="tabular-figures shrink-0 text-body font-medium text-label">
                      {formatBRL(goal.target)}
                    </span>
                  </div>

                  <ProgressBar current={percent} total={100} />

                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="tabular-figures text-footnote text-label-secondary">
                      {formatBRL(goal.saved)} guardados · faltam {formatBRL(remaining)}
                    </span>
                    <span className="text-footnote font-medium text-accent-text">
                      {formatMonths(goal.months)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3">
        <Button variant="gray" size="lg" full onClick={onRestart}>
          Refazer as perguntas
        </Button>
        {/* Ajustar uma resposta nao deveria exigir responder as cinco de novo. */}
        <Button variant="plain" size="lg" full onClick={onBack}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
