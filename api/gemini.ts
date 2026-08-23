import { handleGeminiRequest } from '../src/server/gemini-proxy.ts';

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
 */
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  return handleGeminiRequest(request, process.env.GEMINI_API_KEY);
}
