import { Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/cn';
import type { ThemePreference } from '@/theme/theme-context';
import { useTheme } from '@/theme/useTheme';

/**
 * Um clique avança para a próxima preferência, em ciclo.
 *
 * Não é um interruptor de dois estados. O `ThemeToggle` segmentado já explica
 * por que "sistema" precisa continuar alcançável: sem ela, quem escolhe uma vez
 * fica preso e o tema para de acompanhar o horário do dia. Um botão de ícone
 * cabe na barra, mas não pode custar essa terceira opção — daí o ciclo.
 */
const NEXT: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const ICON = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const NAME: Record<ThemePreference, string> = {
  light: 'claro',
  dark: 'escuro',
  system: 'sistema',
};

interface ThemeToggleButtonProps {
  className?: string;
}

export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { preference, setPreference } = useTheme();

  const next = NEXT[preference];
  const Icon = ICON[preference];
  // O rótulo diz o estado atual *e* o que o próximo clique faz. Um ícone que
  // cicla é ambíguo sozinho: só a lua não conta se o próximo toque leva ao
  // claro ou ao sistema.
  const label = `Aparência: ${NAME[preference]}. Trocar para ${NAME[next]}.`;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        setPreference(next);
      }}
      className={cn(
        'flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md',
        'text-label-secondary select-none',
        'transition-[transform,background-color,color] duration-150',
        'hover:bg-fill-quaternary hover:text-label active:scale-[0.96]',
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </button>
  );
}
