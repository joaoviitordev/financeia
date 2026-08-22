import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Superfície de conteúdo. Opaca por decisão de projeto: vidro fica restrito à
 * navegação, porque translucidez atrás de valores e gráficos torna o contraste
 * dependente do que passa por baixo.
 *
 * Sem sombra, como na Apple: a separação vem da diferença entre a cor do card
 * e a do fundo agrupado.
 */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      // A propriedade arbitrária publica o raio para filhos concêntricos
      // (ver .concentric em layout.css) sem precisar de style inline.
      className={cn('rounded-xl bg-surface [--radius-outer:16px]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  /** Rótulo curto acima do título. Use só quando disser algo verdadeiro. */
  eyebrow?: string;
  action?: ReactNode;
}

export function CardHeader({ title, eyebrow, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)} {...props}>
      <div className="flex flex-col gap-1">
        {eyebrow !== undefined && (
          <span className="text-caption-1 font-medium tracking-wide text-label-secondary uppercase">
            {eyebrow}
          </span>
        )}
        <h3 className="text-headline text-label">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5', className)} {...props} />;
}
