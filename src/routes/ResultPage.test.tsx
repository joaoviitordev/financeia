// Esqueletos de spec da feature resultado-persistido (T-004).
// A tag @spec:AC-xxx no título liga o teste à especificação.
import { test } from 'vitest';

// US-004 — Página de resultado com link permanente
test('AC-011: O resultado mostra os números da simulação @spec:AC-011', () => {
  // Dado: uma simulação guardada
  // Quando: abro o endereço de resultado dela
  // Então: vejo custo da meta, prazo desejado, sobra mensal, renda, gastos fixos e dívidas, em reais
  throw new Error('critério de aceite AC-011 ainda não provado — implemente este teste');
});

// US-004 — Página de resultado com link permanente
test('AC-012: Endereço de simulação inexistente é explicado @spec:AC-012', () => {
  // Dado: um endereço de resultado cujo identificador não existe
  // Quando: abro esse endereço
  // Então: vejo um aviso de que a simulação não foi encontrada e um caminho para começar outra
  throw new Error('critério de aceite AC-012 ainda não provado — implemente este teste');
});
