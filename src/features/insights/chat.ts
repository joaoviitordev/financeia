import type { ChatMessage } from '@/features/insights/chat-types';
import { getGeminiApiKey } from '@/features/insights/config';
import { assessFeasibility } from '@/features/insights/feasibility';
import {
  extractText,
  type InsightErrorKind,
  type InsightFailure,
} from '@/features/insights/gemini';
import { toPlanInput } from '@/features/onboarding/answers-to-plan';
import { buildPlan } from '@/features/onboarding/goals';
import type { SimulationRecord } from '@/features/simulations/storage';
import { formatBRL } from '@/lib/format';

/**
 * A conversa de acompanhamento com o educador.
 *
 * Mesmo endpoint e mesma chave do diagnóstico, com uma diferença que decide o
 * desenho: aqui a resposta é prosa, não JSON (ASM-024). Por isso esta chamada
 * NÃO reusa `generateInsight`, que força `responseMimeType: application/json`
 * e só devolve `InsightData` — reaproveitá-la faria o modelo responder um
 * objeto onde a tela espera uma frase.
 *
 * As causas de falha são as mesmas do diagnóstico e usam o mesmo vocabulário
 * (`InsightErrorKind`): inventar nomes novos para chave recusada e cota
 * estourada só faria o mesmo problema ter dois nomes no mesmo produto.
 */
const MODEL = 'gemini-flash-latest';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Teto de mensagens que viajam no pedido (ASM-023).
 *
 * Conversa longa cresce o pedido sem limite, e custo e demora crescem junto.
 * O corte mora aqui, e não no componente, porque é uma regra do pedido: quem
 * desenha a tela não deveria precisar saber quanto contexto a IA aguenta.
 */
export const CHAT_CONTEXT_LIMIT = 10;

export type ChatResult = { ok: true; content: string } | { ok: false; error: InsightFailure };

const MESSAGES: Record<InsightErrorKind, string> = {
  'missing-key':
    'Falta configurar a chave da API para conversar. Copie o .env.example para .env.local e preencha a chave.',
  'invalid-key':
    'A chave da API foi recusada. Confira o valor de VITE_GEMINI_API_KEY no seu .env.local.',
  quota: 'A cota da chave acabou por enquanto. Tente enviar de novo daqui a pouco.',
  network: 'Não consegui falar com o serviço agora. Verifique a conexão e envie de novo.',
  'unexpected-response': 'A resposta veio vazia. Envie a pergunta de novo.',
};

function fail(kind: InsightErrorKind): ChatResult {
  return { ok: false, error: { kind, message: MESSAGES[kind] } };
}

const QUEM_FALA: Record<ChatMessage['role'], string> = {
  user: 'Pessoa',
  assistant: 'Você',
};

/**
 * O pedido de acompanhamento.
 *
 * Carrega os três (AC-040): os números da simulação, o diagnóstico já gerado e
 * a conversa até aqui. Sem os três a resposta perde o fio — sem os números ela
 * vira conselho de revista, sem o diagnóstico ela contradiz o texto logo acima
 * na tela, e sem a conversa ela responde de novo o que já foi respondido.
 *
 * Os valores chegam prontos do `buildPlan`, como no `buildInsightPrompt`: a IA
 * nunca faz conta, senão diverge dos cards que a pessoa está lendo ao lado.
 *
 * A pergunta nova entra na contagem do teto (AC-041): é ela que menos pode
 * faltar, e deixá-la fora do corte faria o teto significar coisas diferentes
 * conforme o tamanho da conversa.
 */
export function buildChatPrompt(record: SimulationRecord, question: string): string {
  const plan = buildPlan(toPlanInput(record.answers));
  const feasibility = assessFeasibility(plan);
  const objetivo = plan.goals.find((goal) => goal.id === 'objetivo');
  const reserva = plan.goals.find((goal) => goal.id === 'reserva');
  const insight = record.insight;

  const nova: ChatMessage = { id: 'nova', role: 'user', content: question, createdAt: '' };
  const recentes = [...(record.messages ?? []), nova].slice(-CHAT_CONTEXT_LIMIT);

  const conversa = recentes
    .map((message) => `${QUEM_FALA[message.role]}: ${message.content}`)
    .join('\n');

  return `Você é um educador financeiro especializado em finanças pessoais brasileiras, conversando
com uma pessoa sobre a simulação dela.

O texto que você escrever vai direto para a tela, sem revisão. Fale com ela em segunda pessoa, em
português do Brasil, com frases curtas e sem jargão. Não use markdown.

DADOS DA SIMULAÇÃO
- Renda mensal: ${formatBRL(plan.income)}
- Gastos fixos mensais: ${formatBRL(plan.fixedCosts)}
- Dívidas e parcelas por mês: ${formatBRL(plan.debts)}
- Já guardado hoje: ${formatBRL(reserva?.saved ?? 0)}
- Objetivo: ${objetivo?.name ?? 'Seu objetivo'}
- Custo do objetivo: ${formatBRL(objetivo?.target ?? 0)}
- Prazo desejado: ${String(plan.desiredMonths)} meses

VALORES JÁ CALCULADOS (use estes; não refaça nenhuma conta)
- Sobra mensal (renda − gastos fixos − dívidas): ${formatBRL(plan.monthlySurplus)}
- Economia mensal necessária para o objetivo: ${formatBRL(feasibility.monthlyNeeded)}
- Reserva de emergência ideal: ${formatBRL(reserva?.target ?? 0)}
- Saldo mensal depois da reserva e do objetivo: ${formatBRL(feasibility.balanceAfterReserve)}

DIAGNÓSTICO QUE VOCÊ JÁ DEU A ESTA PESSOA
- Viabilidade: ${insight?.feasibility.content ?? '—'}
- Diagnóstico: ${insight?.diagnosis.content ?? '—'}
- Sugestões: ${insight?.suggestions.items.join(' | ') ?? '—'}
- Renda extra: ${insight?.extraIncome.items.join(' | ') ?? '—'}
- Investimento: ${insight?.investment.items.join(' | ') ?? '—'}

CONVERSA ATÉ AQUI (a última linha é a pergunta que você precisa responder agora)
${conversa}

REGRAS
- Responda só a última pergunta, em no máximo 4 frases.
- Não repita o diagnóstico: a pessoa acabou de lê-lo na mesma tela.
- Cite os valores em reais quando eles ajudarem a pessoa a se situar.
- Se a pergunta fugir de finanças pessoais, diga isso em uma frase e traga de volta para o plano.
- Responda apenas com o texto da resposta, sem títulos, sem listas e sem cerca de código.`;
}

/** Manda a pergunta e devolve a resposta em prosa. Nunca lança. */
export async function sendChatMessage(prompt: string): Promise<ChatResult> {
  const key = getGeminiApiKey();
  if (key === null) {
    return fail('missing-key');
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      // Sem `responseMimeType`: a resposta aqui é prosa, e pedir JSON faria o
      // modelo embrulhar a frase num objeto que ninguém vai desembrulhar.
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
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

  const text = extractText(payload)?.trim();

  return text === undefined || text === ''
    ? fail('unexpected-response')
    : { ok: true, content: text };
}
