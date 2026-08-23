import { getGeminiApiKey } from '@/features/insights/config';
import { type InsightData, isInsightData } from '@/features/insights/types';

/**
 * A conversa com o Gemini. HTTP puro, sem React.
 *
 * A chave viaja no header `x-goog-api-key`, e não na query string: assim ela
 * não aparece em URL, em histórico nem em log de proxy.
 *
 * O `responseMimeType` reduz muito a chance de a resposta vir embrulhada em
 * cerca de código — mas não elimina, e por isso a limpeza continua aqui.
 */
const MODEL = 'gemini-flash-latest';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Cada causa tem nome próprio: chave errada e cota estourada são problemas de
 * configuração, e chamá-los de "erro inesperado" transforma cinco minutos de
 * conserto em meia hora de mistério.
 */
export type InsightErrorKind =
  'missing-key' | 'invalid-key' | 'quota' | 'network' | 'unexpected-response';

export interface InsightFailure {
  kind: InsightErrorKind;
  message: string;
}

export type InsightResult = { ok: true; data: InsightData } | { ok: false; error: InsightFailure };

const MESSAGES: Record<InsightErrorKind, string> = {
  'missing-key':
    'Falta configurar a chave da API para gerar o diagnóstico. Copie o .env.example para .env.local e preencha a chave.',
  'invalid-key':
    'A chave da API foi recusada. Confira o valor de VITE_GEMINI_API_KEY no seu .env.local.',
  quota: 'A cota da chave acabou por enquanto. Tente de novo daqui a pouco.',
  network: 'Não consegui falar com o serviço agora. Verifique a conexão e tente de novo.',
  'unexpected-response': 'A resposta veio fora do formato esperado. Tente gerar de novo.',
};

function fail(kind: InsightErrorKind): InsightResult {
  return { ok: false, error: { kind, message: MESSAGES[kind] } };
}

/** Remove a cerca de código (```json … ```) que o modelo às vezes insiste em pôr. */
function stripFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }
  return trimmed
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```$/, '')
    .trim();
}

/**
 * Lê o diagnóstico de um texto qualquer. Devolve null quando não é o que
 * pedimos — nunca um cast sobre o `JSON.parse`.
 */
export function parseInsight(text: string): InsightData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFence(text));
  } catch {
    return null;
  }

  return isInsightData(parsed) ? parsed : null;
}

/**
 * O texto que o Gemini devolve, sem confiar em nenhum nível da estrutura.
 *
 * Exportado porque a conversa (`chat.ts`) lê a resposta do mesmo endpoint e
 * pela mesma casca: o que muda entre os dois é o que se faz com o texto, não
 * como se chega até ele.
 */
export function extractText(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }
  const parts = (candidates[0] as { content?: { parts?: unknown } }).content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return null;
  }
  const text = (parts[0] as { text?: unknown }).text;

  return typeof text === 'string' ? text : null;
}

export async function generateInsight(prompt: string): Promise<InsightResult> {
  const key = getGeminiApiKey();
  if (key === null) {
    return fail('missing-key');
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
  } catch {
    return fail('network');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return fail('invalid-key');
    }
    if (response.status === 429) {
      return fail('quota');
    }
    return fail('network');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return fail('unexpected-response');
  }

  const text = extractText(payload);
  if (text === null) {
    return fail('unexpected-response');
  }

  const data = parseInsight(text);

  return data === null ? fail('unexpected-response') : { ok: true, data };
}
