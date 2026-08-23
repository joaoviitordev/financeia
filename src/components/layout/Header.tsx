import { ChartLine, History, Plus } from 'lucide-react';

import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const PROJECT_NAME = 'Finance IA';

interface HeaderProps {
  onNewSimulation: () => void;
  onShowHistory: () => void;
  className?: string;
}

/**
 * Barra superior fixa: marca à esquerda, controles à direita.
 *
 * Leva Liquid Glass porque é chrome de navegação com conteúdo rolando por
 * baixo, que é a única situação em que o material se justifica.
 *
 * A marca é um <span>, não um <h1>: cada tela já tem o seu próprio h1, e um
 * segundo título de mesmo nível em toda página desarruma a árvore de cabeçalhos
 * por onde leitores de tela navegam.
 */
export function Header({ onNewSimulation, onShowHistory, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'material-regular sticky top-0 z-20 border-x-0 border-t-0',
        'flex h-[52px] items-center gap-3 px-4',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-accent text-label-on-accent"
      >
        <ChartLine className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="truncate text-headline text-label">{PROJECT_NAME}</span>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggleButton />

        {/* aria-label fixo, e não o texto do <span>: abaixo de sm o rótulo some
            para os três controles caberem, e sem ele o botão viraria um ícone
            sem nome para leitor de tela justamente no mobile. */}
        <Button aria-label="Nova simulação" onClick={onNewSimulation}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Nova simulação</span>
        </Button>

        <Button variant="gray" aria-label="Suas simulações" onClick={onShowHistory}>
          <History aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Suas simulações</span>
        </Button>
      </div>
    </header>
  );
}
