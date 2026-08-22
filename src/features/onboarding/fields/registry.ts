import { CurrencyField, MonthsField, TextField } from '@/components/ui/Field';
import type { FieldDefinition, FieldKind } from '@/features/onboarding/fields/types';
import { maskCurrencyInput, parseCurrencyInput } from '@/lib/format';

const MIN_MONTHS = 1;
const MAX_MONTHS = 120;

/** Só dígitos, sem zero à esquerda: prazo não tem casa decimal nem separador de milhar. */
function normalizeMonthsInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.replace(/^0+(?=\d)/, '');
}

function isValidMonths(value: string): boolean {
  if (value === '') {
    return false;
  }
  const months = Number(value);
  return Number.isInteger(months) && months >= MIN_MONTHS && months <= MAX_MONTHS;
}

/**
 * Registro de tipos de resposta.
 *
 * Acrescentar um tipo novo (percentual, data, escolha) é acrescentar uma
 * entrada aqui. Nenhum componente de tela precisa ser tocado, porque nenhum
 * deles decide o que fazer com base no tipo: todos consultam este mapa.
 *
 * CurrencyField, MonthsField e TextField são intercambiáveis por trás de
 * FieldProps, então o passo de pergunta nunca precisa saber qual deles está
 * renderizando.
 */
export const FIELD_REGISTRY: Record<FieldKind, FieldDefinition> = {
  currency: {
    Component: CurrencyField,
    normalize: maskCurrencyInput,
    // Zero não é resposta: quebraria a divisão que estima o prazo.
    isComplete: (value) => (parseCurrencyInput(value) ?? 0) > 0,
  },
  currencyOptional: {
    Component: CurrencyField,
    normalize: maskCurrencyInput,
    // Diferente de "currency": não ter dívida é resposta válida, então zero e
    // o campo em branco (que o cálculo trata como zero) também avançam.
    isComplete: (value) => value.trim() === '' || (parseCurrencyInput(value) ?? 0) >= 0,
  },
  months: {
    Component: MonthsField,
    normalize: normalizeMonthsInput,
    isComplete: isValidMonths,
  },
  text: {
    Component: TextField,
    normalize: (raw) => raw,
    isComplete: (value) => value.trim().length > 0,
  },
};

export function getField(kind: FieldKind): FieldDefinition {
  return FIELD_REGISTRY[kind];
}
