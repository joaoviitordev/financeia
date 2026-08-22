import { Card, CardBody } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import type { Plan } from '@/features/onboarding/goals';
import { formatBRL } from '@/lib/format';

interface SimulationCardsProps {
  plan: Plan;
}

function formatMonths(months: number): string {
  return months === 1 ? '1 mês' : `${String(months)} meses`;
}

/**
 * Números da simulação, num único card (AC-011).
 *
 * Todo valor vem pronto do `Plan` que a `ResultPage` monta com `buildPlan` —
 * este componente só formata e desenha, nunca soma nem subtrai. O custo da
 * meta não está no `Plan` como campo solto: é o `target` da meta `objetivo`,
 * a mesma lista usada na tela de metas do questionário.
 */
export function SimulationCards({ plan }: SimulationCardsProps) {
  const goal = plan.goals.find((item) => item.id === 'objetivo');
  const goalCost = goal?.target ?? 0;

  return (
    <Card>
      <CardBody className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <StatTile size="grid" label="Custo da meta" value={formatBRL(goalCost)} />
        <StatTile size="grid" label="Prazo desejado" value={formatMonths(plan.desiredMonths)} />
        <StatTile size="grid" label="Sobra mensal" value={formatBRL(plan.monthlySurplus)} />
        <StatTile size="grid" label="Renda" value={formatBRL(plan.income)} />
        <StatTile size="grid" label="Gastos fixos" value={formatBRL(plan.fixedCosts)} />
        <StatTile size="grid" label="Dívidas" value={formatBRL(plan.debts)} />
      </CardBody>
    </Card>
  );
}
