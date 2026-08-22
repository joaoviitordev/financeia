/**
 * Contrato entre o prompt e a tela.
 *
 * As seis seções são o formato que pedimos à IA e o formato que o painel
 * desenha — os dois lados mudam juntos, nunca um só. Tudo é texto pronto para
 * exibição: nenhum valor daqui entra em conta.
 */
export type FeasibilityStatus = 'viable' | 'needs_adjustment' | 'unfeasible';

export interface InsightData {
  feasibility: { status: FeasibilityStatus; content: string };
  diagnosis: { content: string };
  suggestions: { items: string[] };
  extraIncome: { items: string[] };
  investment: { items: string[] };
  motivation: { content: string };
}
