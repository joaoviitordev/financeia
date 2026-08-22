import { cn } from '@/lib/cn';
import { deltaDirection, formatSignedPercent } from '@/lib/format';

interface StatTileProps {
  label: string;
  /** Já formatado. A tile não decide moeda nem casas decimais. */
  value: string;
  /** Variação como fração: 0.082 é +8,2%. */
  delta?: number;
  /** Contra o que a variação é medida. Sem isso o número não significa nada. */
  deltaLabel?: string;
  className?: string;
}

const ARROW = {
  up: '▲',
  down: '▼',
  flat: '=',
} as const;

const TONE = {
  up: 'text-gain',
  down: 'text-loss',
  flat: 'text-flat',
} as const;

/**
 * Número em destaque com sua variação.
 *
 * A direção é codificada três vezes: cor, seta e sinal. Isso não é redundância
 * decorativa: cor sozinha não chega para quem tem daltonismo vermelho-verde,
 * que é justamente o eixo usado para ganho e perda. A seta e o sinal fazem a
 * informação sobreviver sem a cor.
 *
 * O valor grande usa figuras proporcionais (o padrão), não tabulares: números
 * heroicos ficam melhores assim, e não precisam alinhar em coluna com nada.
 */
export function StatTile({ label, value, delta, deltaLabel, className }: StatTileProps) {
  const direction = delta === undefined ? undefined : deltaDirection(delta);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-subheadline text-label-secondary">{label}</span>

      <span className="text-large-title text-label">{value}</span>

      {delta !== undefined && direction !== undefined && (
        <span className="flex items-baseline gap-1.5">
          <span className={cn('inline-flex items-baseline gap-1 text-footnote', TONE[direction])}>
            <span aria-hidden="true" className="text-[0.6em]">
              {ARROW[direction]}
            </span>
            <span className="tabular-figures font-medium">{formatSignedPercent(delta)}</span>
          </span>
          {deltaLabel !== undefined && (
            <span className="text-footnote text-label-tertiary">{deltaLabel}</span>
          )}
        </span>
      )}
    </div>
  );
}
