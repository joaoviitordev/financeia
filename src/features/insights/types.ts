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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasContent(value: unknown): boolean {
  return isRecord(value) && typeof value['content'] === 'string';
}

function hasItems(value: unknown): boolean {
  return (
    isRecord(value) &&
    Array.isArray(value['items']) &&
    value['items'].every((item) => typeof item === 'string')
  );
}

/**
 * O diagnóstico veio de um modelo probabilístico ou de um armazenamento que
 * outra aba pode ter mexido: em nenhum dos dois casos dá para confiar no
 * formato. Conferir as seis chaves aqui é o que separa "tente de novo" de uma
 * tela branca com `Cannot read properties of undefined`.
 *
 * O `status` não é validado contra os três valores conhecidos de propósito: um
 * status inesperado degrada o selo na tela (AC-015), e perder o diagnóstico
 * inteiro por causa dele seria pior.
 */
export function isInsightData(value: unknown): value is InsightData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasContent(value['feasibility']) &&
    isRecord(value['feasibility']) &&
    typeof value['feasibility']['status'] === 'string' &&
    hasContent(value['diagnosis']) &&
    hasItems(value['suggestions']) &&
    hasItems(value['extraIncome']) &&
    hasItems(value['investment']) &&
    hasContent(value['motivation'])
  );
}
