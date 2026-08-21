import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label': string;
  disabled?: boolean;
  className?: string;
}

/**
 * Switch do iOS — 51×31pt, o botão desliza 20px.
 *
 * É um <button role="switch">, não uma checkbox estilizada: leitores de tela
 * anunciam "ativado/desativado" em vez de "marcado", que é o que a pessoa
 * espera ouvir de um switch.
 */
export function Switch({ checked, onChange, disabled, className, ...aria }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={aria['aria-label']}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
      }}
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full p-0.5',
        'transition-colors',
        checked ? 'bg-good' : 'bg-fill',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
      style={{
        transitionDuration: 'var(--duration-fast)',
        transitionTimingFunction: 'var(--ease-standard)',
      }}
    >
      <span
        aria-hidden="true"
        className="h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform"
        style={{
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transitionDuration: 'var(--duration-base)',
          transitionTimingFunction: 'var(--spring-snappy)',
        }}
      />
    </button>
  );
}
