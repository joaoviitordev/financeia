import type { ComponentType } from 'react';

export type FieldKind = 'currency' | 'text';

/** Contrato único que todo campo de resposta cumpre. */
export interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onValueChange: (value: string) => void;
}

/**
 * Tudo que o fluxo precisa saber sobre um tipo de resposta: como desenhar,
 * como normalizar o que foi digitado e como decidir se já dá para avançar.
 *
 * Manter os três juntos é o que permite trocar ou acrescentar um tipo sem
 * abrir o componente de passo. A regra de validação mora ao lado do campo que
 * a produz, e não espalhada em um `if` do outro lado da tela.
 */
export interface FieldDefinition {
  Component: ComponentType<FieldProps>;
  /** Aplica máscara ou limpeza antes de guardar a resposta. */
  normalize: (raw: string) => string;
  /** A resposta serve para o cálculo? */
  isComplete: (value: string) => boolean;
}
