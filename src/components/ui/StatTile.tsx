import { cn } from '@/lib/cn';
import { deltaDirection, formatSignedPercent } from '@/lib/format';

/**
 * `hero` é o número sozinho na tela; `grid` é o número que divide a linha com
 * outros — em coluna, o tamanho heroico atropela o vizinho em vez de destacar.
 */
export type StatTileSize = 'hero' | 'grid';

interface StatTileProps {
  label: string;
  /** Já formatado. A tile não decide moeda nem casas decimais. */
  value: string;
  /** Variação como fração: 0.082 é +8,2%. */
  delta?: number;
  /** Contra o que a variação é medida. Sem isso o número não significa nada. */
  deltaLabel?: string;
  size?: StatTileSize;
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
 * No tamanho de grade as figuras são tabulares: ali os números ficam mesmo em
 * coluna, e sem largura fixa por dígito as vírgulas não alinham entre linhas.
 */
const VALUE = {
  hero: 'text-large-title',
  grid: 'tabular-figures text-title-3',
} as const;

/**
 * Número em destaque com sua variação.
 *
 * A direção é codificada três vezes: cor, seta e sinal. Isso não é redundância
 * decorativa: cor sozinha não chega para quem tem daltonismo vermelho-verde,
 * que é justamente o eixo usado para ganho e perda. A seta e o sinal fazem a
 * informação sobreviver sem a cor.
 *
 * O tamanho `hero` (padrão) usa figuras proporcionais: número sozinho na tela
 * fica melhor assim, e não precisa alinhar em coluna com nada. Numa grade de
 * várias tiles, `size="grid"` — 34px lado a lado estouram a coluna e os
 * valores encostam uns nos outros em vez de se destacarem.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaLabel,
  size = 'hero',
  className,
}: StatTileProps) {
  const direction = delta === undefined ? undefined : deltaDirection(delta);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-subheadline text-label-secondary">{label}</span>

      <span className={cn(VALUE[size], 'text-label')}>{value}</span>

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
