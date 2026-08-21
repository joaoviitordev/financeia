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

/** R$ 12,5 mil — para eixos e rótulos onde o valor cheio não cabe. */
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
