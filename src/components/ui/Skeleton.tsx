import { cn } from '@/lib/cn';

interface SkeletonProps {
  /** Quantas linhas desenhar. Uma só, por padrão. */
  lines?: number;
  className?: string;
}

/** Larguras irregulares: bloco perfeitamente retangular não parece texto. */
const WIDTHS = ['w-full', 'w-11/12', 'w-10/12', 'w-full', 'w-9/12'];

/**
 * Espaço reservado enquanto o conteúdo não chega.
 *
 * É componente nosso, e não uma dependência: assim ele fala os tokens do
 * projeto e funciona nos dois temas. Quem prefere menos movimento já está
 * atendido — o `prefers-reduced-motion` é desligado globalmente no base.css.
 *
 * Fica escondido de leitores de tela: para quem não vê o pulso, o que importa
 * é o `aria-busy` de quem o contém, não cinco caixas cinzas.
 */
export function Skeleton({ lines = 1, className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('flex animate-pulse flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={cn('h-4 rounded-lg bg-fill-tertiary', WIDTHS[index % WIDTHS.length])}
        />
      ))}
    </div>
  );
}
