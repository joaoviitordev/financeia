import { assessFeasibility } from '@/features/insights/feasibility';
import type { FeasibilityStatus } from '@/features/insights/types';
import { toPlanInput } from '@/features/onboarding/answers-to-plan';
import { buildPlan } from '@/features/onboarding/goals';
import type { SimulationRecord } from '@/features/simulations/storage';
import { formatBRL } from '@/lib/format';

/**
 * O pedido que vai para a IA.
 *
 * É a interface do produto com o modelo: mudança silenciosa aqui é regressão
 * de produto, e por isso o conteúdo dele é testado.
 *
 * Todos os números chegam prontos, calculados por `buildPlan` — a IA nunca faz
 * conta. Se ela refizesse, divergiria dos cards que a pessoa está lendo na
 * mesma tela, e quem pareceria errada seria ela.
 */
const VEREDITO: Record<FeasibilityStatus, string> = {
  viable: 'a meta cabe no orçamento dentro do prazo',
  needs_adjustment: 'a meta quase cabe: falta pouco por mês',
  unfeasible: 'a meta não cabe no orçamento dentro do prazo',
};

const SCHEMA = `{
  "feasibility": { "status": "viable" | "needs_adjustment" | "unfeasible", "content": "texto" },
  "diagnosis": { "content": "texto" },
  "suggestions": { "items": ["texto"] },
  "extraIncome": { "items": ["texto"] },
  "investment": { "items": ["texto"] },
  "motivation": { "content": "texto" }
}`;

export function buildInsightPrompt(record: SimulationRecord): string {
  const plan = buildPlan(toPlanInput(record.answers));
  const feasibility = assessFeasibility(plan);
  const objetivo = plan.goals.find((goal) => goal.id === 'objetivo');
  const reserva = plan.goals.find((goal) => goal.id === 'reserva');

  return `Você é um educador financeiro especializado em finanças pessoais brasileiras.

O texto que você escrever vai direto para a tela de uma pessoa, sem revisão. Fale com ela em
segunda pessoa, em português do Brasil, com frases curtas e sem jargão. Não use markdown.

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
- Veredito já decidido: "${feasibility.status}" — ${VEREDITO[feasibility.status]}

FORMATO DA RESPOSTA
Responda apenas com um objeto JSON válido, sem nenhum texto antes ou depois, sem cerca de código.

SCHEMA
${SCHEMA}

REGRAS
- Use exatamente o veredito já decidido em "feasibility.status". Ele vem de uma conta, não de opinião.
- No máximo 4 itens por lista, cada um com uma frase.
- Não repita a mesma informação entre seções.
- Nada de markdown dentro dos valores: sem asteriscos, sem listas, sem títulos.
- Cite os valores em reais quando eles ajudarem a pessoa a se situar.`;
}
