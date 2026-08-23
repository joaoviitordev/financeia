/// <reference types="vite/client" />

/**
 * As variáveis de ambiente do projeto, declaradas.
 *
 * Está vazia de propósito, e isso é o resultado da feature chave-no-servidor: a
 * única variável que existia aqui era a chave do Gemini, com prefixo `VITE_`, e
 * prefixo `VITE_` significa que a variável é embutida no pacote que o navegador
 * baixa. Ela virou `GEMINI_API_KEY`, sem prefixo, lida só no servidor.
 *
 * Ao acrescentar uma variável nova, pergunte antes se ela pode ser lida por
 * qualquer pessoa que abra as ferramentas de desenvolvedor. Se não puder, ela
 * não pertence a este arquivo.
 */
interface ImportMetaEnv {
  readonly _vazio?: never;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
