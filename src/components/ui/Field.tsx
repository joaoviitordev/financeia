import { type InputHTMLAttributes, useId } from 'react';

import { cn } from '@/lib/cn';

const FIELD_SHELL = [
  'flex items-center gap-2 rounded-xl px-4',
  'min-h-14 bg-fill-quaternary',
  'border border-separator',
  'transition-[border-color,box-shadow] duration-150',
  'focus-within:border-accent focus-within:shadow-[0_0_0_3.5px_var(--focus-ring)]',
].join(' ');

const FIELD_INPUT = [
  'w-full bg-transparent text-body text-label',
  'placeholder:text-label-tertiary',
  'outline-none',
  // O anel de foco e desenhado pelo shell (focus-within). Sem isto, a regra
  // global :focus-visible de base.css desenharia um segundo anel no proprio
  // input, e apareceriam dois aneis concentricos.
  'focus-visible:shadow-none',
].join(' ');

type BaseInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'className'
>;

interface CurrencyFieldProps extends BaseInputProps {
  label: string;
  value: string;
  onValueChange: (masked: string) => void;
}

/**
 * Campo monetário com o "R$" como prefixo fixo do campo, não como texto
 * digitável. Assim a pessoa nunca precisa apagá-lo nem consegue quebrá-lo.
 *
 * inputMode="decimal" abre o teclado numérico no celular; o type continua
 * "text" porque type="number" rejeita a vírgula decimal do pt-BR e ainda
 * traz as setinhas de incremento, que não fazem sentido para dinheiro.
 */
export function CurrencyField({ label, value, onValueChange, ...props }: CurrencyFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className={FIELD_SHELL}>
        <span aria-hidden="true" className="shrink-0 text-body font-medium text-label-secondary">
          R$
        </span>
        <input
          {...props}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
          }}
          className={cn(FIELD_INPUT, 'tabular-figures')}
        />
      </div>
    </div>
  );
}

interface TextFieldProps extends BaseInputProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function TextField({ label, value, onValueChange, ...props }: TextFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className={FIELD_SHELL}>
        <input
          {...props}
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
          }}
          className={FIELD_INPUT}
        />
      </div>
    </div>
  );
}
