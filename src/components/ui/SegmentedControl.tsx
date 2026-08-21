import { useId } from 'react';

import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Rótulo acessível do grupo — obrigatório, o controle não tem texto próprio. */
  'aria-label': string;
  className?: string;
}

/**
 * Controle segmentado do iOS: pílula deslizante sobre um trilho.
 *
 * A pílula é um único elemento que se move com transform, e não um fundo que
 * pula de segmento em segmento — é isso que produz o deslize da Apple. Usa a
 * mola snappy, com o overshoot discreto.
 *
 * Semântica de tablist: setas navegam, e só o segmento ativo entra na ordem de
 * tabulação (roving tabindex).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const id = useId();
  const activeIndex = options.findIndex((option) => option.value === value);
  const count = options.length;

  const move = (delta: number) => {
    const next = options[(activeIndex + delta + count) % count];
    if (next) {
      onChange(next.value);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('relative flex h-8 rounded-md bg-fill-tertiary p-0.5', className)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          move(1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {activeIndex >= 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 left-0.5 rounded-[7px] bg-surface shadow-sm transition-transform"
          style={{
            width: `calc((100% - 4px) / ${String(count)})`,
            transform: `translateX(${String(activeIndex * 100)}%)`,
            transitionDuration: 'var(--duration-base)',
            transitionTimingFunction: 'var(--spring-snappy)',
          }}
        />
      )}

      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            id={`${id}-${option.value}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              onChange(option.value);
            }}
            className={cn(
              'relative z-10 flex-1 rounded-[7px] px-3 text-subheadline font-medium',
              'whitespace-nowrap',
              'transition-colors duration-150',
              selected ? 'text-label' : 'text-label-secondary hover:text-label',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
