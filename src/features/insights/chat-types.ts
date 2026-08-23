/**
 * Contrato da conversa com o educador financeiro.
 *
 * Uma mensagem é texto puro: nada aqui entra em conta, e nada aqui é
 * interpretado como estrutura. Quem faz conta é o `buildPlan`, e o que a
 * conversa carrega é o resultado dele já pronto.
 */
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * A conversa vem do mesmo armazenamento hostil que o resto: outra aba, uma
 * extensão ou uma versão anterior do app podem ter deixado ali qualquer coisa.
 * Conferir os quatro campos é o que separa "a conversa começou vazia" de um
 * `Cannot read properties of undefined` no meio da lista.
 *
 * O `role` é validado contra os dois valores conhecidos, ao contrário do
 * `status` do diagnóstico: lá um valor inesperado só degrada um selo, aqui ele
 * decidiria de que lado da conversa a mensagem aparece — e errar isso põe na
 * boca do educador o que a pessoa escreveu.
 */
export function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['id'] === 'string' &&
    (value['role'] === 'user' || value['role'] === 'assistant') &&
    typeof value['content'] === 'string' &&
    typeof value['createdAt'] === 'string'
  );
}

/** Uma conversa é uma lista de mensagens válidas — qualquer outra coisa não é. */
export function isChatMessages(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.every(isChatMessage);
}
