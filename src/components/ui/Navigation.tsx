import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/* ==========================================================================
 * Chrome de navegação — a única parte da interface que leva Liquid Glass.
 * O material só faz sentido quando há conteúdo rolando por baixo; sobre um
 * fundo estático ele vira apenas um retângulo acinzentado mais caro.
 * ========================================================================== */

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface ToolbarProps {
  title: string;
  children?: ReactNode;
}

/** Barra superior do macOS: título à esquerda, ações à direita. */
export function Toolbar({ title, children }: ToolbarProps) {
  return (
    <header
      className={cn(
        'material-regular sticky top-0 z-20',
        'flex h-[52px] items-center gap-4 border-x-0 border-t-0 px-5',
      )}
    >
      <h1 className="truncate text-headline text-label">{title}</h1>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}

interface SidebarProps {
  items: readonly NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Sidebar do macOS. Linhas de 28px — é navegação por ponteiro, não por toque,
 * e a altura menor é o que dá a densidade de app desktop.
 */
export function Sidebar({ items, activeId, onSelect }: SidebarProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'material-thin hidden w-[260px] shrink-0 border-y-0 border-l-0 p-3 md:block',
        'sticky top-0 h-dvh',
      )}
    >
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  onSelect(item.id);
                }}
                className={cn(
                  'flex h-7 w-full items-center gap-2.5 rounded-xs px-2.5 text-subheadline',
                  'transition-colors duration-150',
                  active
                    ? 'bg-accent font-medium text-label-on-accent'
                    : 'text-label hover:bg-fill-quaternary',
                )}
              >
                <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center">
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface TabBarProps {
  items: readonly NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Tab bar do iOS, só no mobile. Ícone acima, rótulo abaixo, alvo de 44px.
 * pb-[env(safe-area-inset-bottom)] mantém a barra acima do indicador de home
 * nos iPhones sem botão.
 */
export function TabBar({ items, activeId, onSelect }: TabBarProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'material-thick fixed inset-x-0 bottom-0 z-20 md:hidden',
        'flex border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              onSelect(item.id);
            }}
            className={cn(
              'flex min-h-[49px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5',
              'text-caption-2 transition-colors duration-150',
              active ? 'text-accent-text' : 'text-label-secondary',
            )}
          >
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center">
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
