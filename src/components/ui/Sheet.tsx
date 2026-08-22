import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Some visualmente, mas continua disponível para leitores de tela. */
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Sheet modal do iOS: sobe de baixo no mobile, aparece centralizada no desktop.
 *
 * Construída sobre o Dialog do Radix por um motivo específico: focus trap,
 * devolução do foco ao elemento que abriu, marcação aria-modal e o inert no
 * resto da página são fáceis de errar à mão, e um erro aí quebra a navegação
 * por teclado e por leitor de tela de forma silenciosa.
 *
 * O material é o único ponto de vidro dentro de conteúdo, e aqui ele se
 * justifica: a sheet flutua sobre a página e a translucidez comunica a
 * profundidade e mantém o contexto visível por trás.
 */
export function Sheet({ open, onOpenChange, title, description, children, footer }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
          style={{
            animation: 'sheet-fade var(--duration-base) var(--ease-standard)',
          }}
        />
        <Dialog.Content
          className={cn(
            'material-thick fixed z-50 flex flex-col',
            // Mobile: encostada embaixo, cantos arredondados só em cima.
            'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-b-0',
            // Desktop: centralizada, com largura contida.
            'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(30rem,calc(100vw-3rem))]',
            'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border-b',
          )}
          style={{
            boxShadow: 'var(--shadow-sheet)',
            animation: 'sheet-in var(--duration-slow) var(--ease-standard)',
          }}
        >
          {/* Grabber: a alça de arrastar do iOS. Decorativa aqui, mas é o sinal
              visual que diz "isto se fecha puxando para baixo". */}
          <div aria-hidden="true" className="flex justify-center pt-2 sm:hidden">
            <span className="h-1 w-9 rounded-full bg-fill" />
          </div>

          <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-title-3 text-label">{title}</Dialog.Title>
              {description !== undefined && (
                <Dialog.Description className="text-subheadline text-label-secondary">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Fechar"
              className={cn(
                'flex h-7 w-7 shrink-0 bg-fill-secondary text-label-secondary',
                'items-center justify-center rounded-full',
                'transition-colors duration-150 hover:bg-fill',
              )}
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>

          {footer !== undefined && (
            <footer className="flex gap-2 border-t border-separator px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
