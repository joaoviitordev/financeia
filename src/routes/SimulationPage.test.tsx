// Esqueletos de spec da feature resultado-persistido (T-001).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/resultado-persistido/.
import { test } from 'vitest';

// US-001 — Cada etapa tem endereço próprio
test('AC-001: O formulário abre na raiz @spec:AC-001', () => {
  // Dado: que abro o aplicativo em `/`
  // Quando: a página carrega
  // Então: vejo a apresentação da simulação dentro do cabeçalho e do rodapé da aplicação
  throw new Error('critério de aceite AC-001 ainda não provado — implemente este teste');
});

// US-001 — Cada etapa tem endereço próprio
test('AC-002: Recomeçar pelo cabeçalho limpa as respostas @spec:AC-002', () => {
  // Dado: que estou no meio das perguntas, com respostas já preenchidas
  // Quando: aciono "nova simulação" no cabeçalho
  // Então: volto para a apresentação e nenhuma resposta anterior permanece
  throw new Error('critério de aceite AC-002 ainda não provado — implemente este teste');
});
