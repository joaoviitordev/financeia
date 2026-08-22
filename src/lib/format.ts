const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const PERCENT = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** R$ 12.480,00 */
export function formatBRL(value: number): string {
  return BRL.format(value);
}

/** R$ 12,5 mil. Para eixos e rótulos onde o valor cheio não cabe. */
export function formatBRLCompact(value: number): string {
  return BRL_COMPACT.format(value);
}

/** Recebe a fração (0.082), devolve "8,2%". */
export function formatPercent(fraction: number): string {
  return PERCENT.format(fraction);
}

export type DeltaDirection = 'up' | 'down' | 'flat';

export function deltaDirection(value: number): DeltaDirection {
  if (value > 0) {
    return 'up';
  }
  if (value < 0) {
    return 'down';
  }
  return 'flat';
}

/**
 * Percentual com sinal explícito: "+8,2%", "−3,1%".
 *
 * Usa o sinal de menos tipográfico (U+2212), não o hífen: ele tem a mesma
 * largura do "+" e alinha em coluna, o que o hífen não faz.
 */
export function formatSignedPercent(fraction: number): string {
  const formatted = PERCENT.format(Math.abs(fraction));
  if (fraction > 0) {
    return `+${formatted}`;
  }
  if (fraction < 0) {
    return `−${formatted}`;
  }
  return formatted;
}

/* --- Entrada de valores ---------------------------------------------------
 * O placeholder do formulário é "ex: 5000", ou seja, a pessoa digita reais
 * inteiros. Por isso NÃO usamos o padrão "centavos primeiro" (onde digitar
 * 5000 vira R$ 50,00): ali ele contrariaria o exemplo mostrado na tela. */

/**
 * Limpa o que foi digitado e agrupa os milhares enquanto a pessoa escreve.
 * Aceita uma única vírgula decimal e no máximo dois centavos.
 */
export function maskCurrencyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '');
  const [integerPart = '', ...rest] = cleaned.split(',');
  const digits = integerPart.replace(/^0+(?=\d)/, '');
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (rest.length === 0) {
    return grouped;
  }

  return `${grouped},${rest.join('').slice(0, 2)}`;
}

/** Converte o texto mascarado em número. Devolve null se não houver dígito. */
export function parseCurrencyInput(masked: string): number | null {
  const normalized = masked.replace(/\./g, '').replace(',', '.');

  if (normalized === '' || normalized === '.') {
    return null;
  }

  const value = Number(normalized);

  return Number.isFinite(value) ? value : null;
}
