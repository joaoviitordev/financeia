/// <reference types="vite/client" />

/**
 * As variáveis de ambiente do projeto, declaradas.
 *
 * Sem esta declaração o `noPropertyAccessFromIndexSignature` recusa
 * `import.meta.env.VITE_GEMINI_API_KEY` — e é bom que recuse: o erro obriga a
 * registrar aqui toda variável nova, que é onde alguém procura para saber o
 * que o app espera do ambiente.
 */
interface ImportMetaEnv {
  /** Chave do Gemini. Ausente ou vazia: o app roda e o diagnóstico não é gerado. */
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
