import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Os cinco estilos de botão do HIG. A diferença entre eles é o *peso* que o
 * botão tem na tela, não a decoração: filled é a ação principal e só deve
 * haver um por contexto; plain é a mais leve, para ações secundárias em barra.
 */
const button = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium select-none',
    'transition-[transform,background-color,opacity] duration-150',
    'active:scale-[0.96]',
    'disabled:pointer-events-none disabled:opacity-40',
  ],
  {
    variants: {
      variant: {
        filled: 'bg-accent text-label-on-accent hover:bg-accent-hover',
        tinted: 'bg-accent-muted text-accent-text hover:brightness-95',
        gray: 'bg-fill-secondary text-label hover:bg-fill',
        plain: 'bg-transparent text-accent-text hover:bg-fill-quaternary',
        destructive: 'bg-loss text-label-on-accent hover:brightness-95',
      },
      size: {
        sm: 'h-7 rounded-xs px-3 text-footnote',
        md: 'h-8.5 rounded-md px-4 text-subheadline',
        lg: 'h-11 rounded-md px-5 text-body',
      },
      full: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'md',
      full: false,
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  children: ReactNode;
}

export function Button({ className, variant, size, full, type, ...props }: ButtonProps) {
  return (
    <button
      // Sem type explícito, um botão dentro de <form> vira submit por padrão
      // do HTML e envia o formulário sem querer.
      type={type ?? 'button'}
      className={cn(button({ variant, size, full }), className)}
      {...props}
    />
  );
}
