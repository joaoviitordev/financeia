import { cn } from '@/lib/cn';

interface ProgressBarProps {
  /** Passo atual, começando em 1. */
  current: number;
  total: number;
  className?: string;
}

/**
 * Progresso de etapas.
 *
 * O trilho é `role="progressbar"` com os valores ARIA preenchidos, então a
 * posição é anunciada por leitor de tela. O rótulo "Passo 2 de 5" acima é
 * para quem enxerga, e sozinho não bastaria.
 */
export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const clamped = Math.min(Math.max(current, 0), total);
  const percent = total === 0 ? 0 : (clamped / total) * 100;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={clamped}
      aria-valuetext={`Passo ${String(clamped)} de ${String(total)}`}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-accent-muted', className)}
    >
      <div
        className="h-full rounded-full bg-accent"
        style={{
          width: `${String(percent)}%`,
          transitionProperty: 'width',
          transitionDuration: 'var(--duration-slow)',
          transitionTimingFunction: 'var(--spring-snappy)',
        }}
      />
    </div>
  );
}
