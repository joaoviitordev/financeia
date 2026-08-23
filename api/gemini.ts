import { handleGeminiRequest } from '../src/server/gemini-proxy';

/**
 * O proxy publicado, como função da Vercel (ASM-028).
 *
 * Este arquivo é adaptador e nada mais: toda a lógica mora em
 * `src/server/gemini-proxy.ts`, e é o mesmo módulo que o servidor de
 * desenvolvimento monta em `vite.config.ts` (AC-055). Se alguma regra começar a
 * aparecer aqui, ela passa a existir só em produção, e o erro só aparece depois
 * de publicar, que é exatamente o que esta divisão evita.
 *
 * A chave vem de `GEMINI_API_KEY`, sem prefixo `VITE_`. O prefixo não é
 * decoração: é o mecanismo que faria a variável ser embutida no pacote que o
 * navegador baixa.
 *
 * O import não leva a extensão `.ts`, e o `tsconfig.api.json` existe por causa
 * disso: quem compila este arquivo é a Vercel, com a configuração dela, e ela
 * recusou a extensão. A regra aqui é que este arquivo precisa compilar sob a
 * configuração DELA, não sob a nossa.
 */
export const config = { runtime: 'edge' };

/**
 * A variável de ambiente, lida sem nomear `process` diretamente.
 *
 * Parece rebuscado e não é: no runtime de borda o `process` existe e funciona,
 * mas os tipos daquele ambiente não o declaram, e o build quebrou com "Cannot
 * find name 'process'". Declarar `process` aqui colidiria com os tipos do Node
 * onde eles existem. Passar pelo `globalThis` atravessa os dois mundos e não
 * depende de qual configuração de TypeScript compila este arquivo.
 */
function variavelDeAmbiente(nome: string): string | undefined {
  const ambiente = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;

  return ambiente?.[nome];
}

export default async function handler(request: Request): Promise<Response> {
  return handleGeminiRequest(request, variavelDeAmbiente('GEMINI_API_KEY'));
}
