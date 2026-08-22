/**
 * A chave da API, como o resto do aplicativo enxerga: existe ou não existe.
 *
 * Devolver `null` em vez de string vazia obriga quem chama a decidir o que
 * fazer sem chave — no nosso caso, avisar em vez de tentar a rede e receber um
 * 403 disfarçado de erro de conexão (AC-022).
 *
 * A chave tem prefixo `VITE_`, ou seja, vai para o pacote que o navegador
 * baixa (ASM-007). Isso é aceitável enquanto o app roda local; antes de
 * publicar, ela precisa migrar para um proxy.
 */
export function getGeminiApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim();

  return key === undefined || key === '' ? null : key;
}

/** Sem chave o app inteiro continua de pé; só o diagnóstico não é gerado. */
export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey() !== null;
}
