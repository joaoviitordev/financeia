import { cn } from '@/lib/cn';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Hairline. role="none" porque é decoração: um separador anunciado por leitor
 * de tela só adiciona ruído a uma lista que já tem estrutura semântica.
 */
export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return (
    <div
      role="none"
      className={cn(
        'shrink-0 bg-separator',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}
