import { CurrencyField, TextField } from '@/components/ui/Field';
import type { FieldDefinition, FieldKind } from '@/features/onboarding/fields/types';
import { maskCurrencyInput, parseCurrencyInput } from '@/lib/format';

/**
 * Registro de tipos de resposta.
 *
 * Acrescentar um tipo novo (percentual, data, escolha) é acrescentar uma
 * entrada aqui. Nenhum componente de tela precisa ser tocado, porque nenhum
 * deles decide o que fazer com base no tipo: todos consultam este mapa.
 *
 * CurrencyField e TextField são intercambiáveis por trás de FieldProps, então
 * o passo de pergunta nunca precisa saber qual dos dois está renderizando.
 */
export const FIELD_REGISTRY: Record<FieldKind, FieldDefinition> = {
  currency: {
    Component: CurrencyField,
    normalize: maskCurrencyInput,
    // Zero não é resposta: quebraria a divisão que estima o prazo.
    isComplete: (value) => (parseCurrencyInput(value) ?? 0) > 0,
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
