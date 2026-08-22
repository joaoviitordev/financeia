// Esqueletos de spec da feature resultado-persistido (T-003).
// A tag @spec:AC-xxx no título liga o teste à especificação.
import { test } from 'vitest';

// US-003 — A simulação sobrevive ao recarregar
test('AC-007: Guardar e reler devolve as mesmas respostas @spec:AC-007', () => {
  // Dado: um conjunto de respostas concluído
  // Quando: guardo a simulação e busco pelo identificador devolvido
  // Então: recupero exatamente as mesmas respostas
  throw new Error('critério de aceite AC-007 ainda não provado — implemente este teste');
});

// US-003 — A simulação sobrevive ao recarregar
test('AC-008: Cada simulação tem identificador próprio @spec:AC-008', () => {
  // Dado: que guardo duas simulações diferentes
  // Quando: listo o que está guardado
  // Então: as duas aparecem, com identificadores distintos
  throw new Error('critério de aceite AC-008 ainda não provado — implemente este teste');
});

// US-003 — A simulação sobrevive ao recarregar
test('AC-009: Armazenamento corrompido não derruba o app @spec:AC-009', () => {
  // Dado: que o armazenamento do navegador contém conteúdo inválido na chave da aplicação
  // Quando: listo as simulações guardadas
  // Então: recebo uma lista vazia, sem erro na tela
  throw new Error('critério de aceite AC-009 ainda não provado — implemente este teste');
});
