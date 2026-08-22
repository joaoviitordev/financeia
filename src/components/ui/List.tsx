import { ChevronRight } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface ListGroupProps extends HTMLAttributes<HTMLElement> {
  /** Cabeçalho da seção. Em maiúsculas, como no iOS. */
  header?: string;
  /** Texto explicativo abaixo do grupo. */
  footer?: string;
  children: ReactNode;
}

/**
 * Lista agrupada inset, o padrão de lista do iOS.
 *
 * Os separadores começam recuados e alinhados ao conteúdo, não à borda do
 * card, e o último some. É um detalhe pequeno que, se errado, é a primeira
 * coisa que denuncia uma imitação de iOS.
 */
export function ListGroup({ header, footer, children, className, ...props }: ListGroupProps) {
  return (
    <section className={cn('flex flex-col gap-2', className)} {...props}>
      {header !== undefined && (
        <h3 className="px-4 text-footnote font-medium tracking-wide text-label-secondary uppercase">
          {header}
        </h3>
      )}
      <div className="overflow-hidden rounded-xl bg-surface">
        <ul className="[&>li:last-child>*]:after:hidden">{children}</ul>
      </div>
      {footer !== undefined && <p className="px-4 text-footnote text-label-secondary">{footer}</p>}
    </section>
  );
}

interface ListRowProps {
  label: string;
  /** Segunda linha, para contexto. */
  caption?: string;
  /** Valor à direita. */
  value?: ReactNode;
  leading?: ReactNode;
  /** Mostra o chevron e torna a linha acionável. */
  onSelect?: () => void;
}

export function ListRow({ label, caption, value, leading, onSelect }: ListRowProps) {
  const interactive = onSelect !== undefined;

  const content = (
    <>
      {leading !== undefined && <span className="shrink-0">{leading}</span>}
      <span className="flex min-w-0 flex-col text-left">
        <span className="truncate text-body text-label">{label}</span>
        {caption !== undefined && (
          <span className="truncate text-footnote text-label-secondary">{caption}</span>
        )}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {value !== undefined && <span className="text-body text-label-secondary">{value}</span>}
        {interactive && (
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-label-tertiary"
            strokeWidth={2.5}
          />
        )}
      </span>
    </>
  );

  // O separador é um ::after recuado à esquerda, alinhado ao texto, e não uma
  // borda, que iria de ponta a ponta do card.
  const rowClass = cn(
    'relative flex min-h-11 w-full items-center gap-3 px-4 py-2.5',
    'after:absolute after:right-0 after:bottom-0 after:left-4 after:h-px after:bg-separator after:content-[""]',
  );

  return (
    <li>
      {interactive ? (
        <button
          type="button"
          onClick={onSelect}
          className={cn(rowClass, 'active:bg-fill-tertiary')}
        >
          {content}
        </button>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
}
