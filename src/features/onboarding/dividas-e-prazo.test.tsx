// Esqueletos de spec da feature resultado-persistido (T-002).
// A tag @spec:AC-xxx no título liga o teste à especificação.
import { test } from 'vitest';

// US-002 — Dívidas e prazo entram na conversa
test('AC-003: O fluxo passa a ter sete perguntas @spec:AC-003', () => {
  // Dado: que inicio a simulação
  // Quando: a primeira pergunta aparece
  // Então: o indicador de progresso mostra que é o passo 1 de 7
  throw new Error('critério de aceite AC-003 ainda não provado — implemente este teste');
});

// US-002 — Dívidas e prazo entram na conversa
test('AC-004: Não ter dívida é uma resposta válida @spec:AC-004', () => {
  // Dado: que estou na pergunta sobre parcelas e empréstimos
  // Quando: informo zero
  // Então: consigo avançar para a pergunta seguinte
  throw new Error('critério de aceite AC-004 ainda não provado — implemente este teste');
});

// US-002 — Dívidas e prazo entram na conversa
test('AC-005: O prazo aceita de 1 a 120 meses @spec:AC-005', () => {
  // Dado: que estou na pergunta sobre o prazo da meta
  // Quando: informo 0 ou 121
  // Então: não consigo avançar; com 12, avanço normalmente
  throw new Error('critério de aceite AC-005 ainda não provado — implemente este teste');
});

// US-002 — Dívidas e prazo entram na conversa
test('AC-006: As dívidas reduzem a sobra mensal @spec:AC-006', () => {
  // Dado: renda de R$ 5.000, gastos fixos de R$ 2.000 e dívidas de R$ 500
  // Quando: o plano é montado
  // Então: a sobra mensal apresentada é de R$ 2.500
  throw new Error('critério de aceite AC-006 ainda não provado — implemente este teste');
});
