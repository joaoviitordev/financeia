import { describe, expect, it } from 'vitest';

import { formatSignedPercent, maskCurrencyInput, parseCurrencyInput } from '@/lib/format';

describe('maskCurrencyInput', () => {
  it('agrupa os milhares enquanto digita', () => {
    expect(maskCurrencyInput('5000')).toBe('5.000');
    expect(maskCurrencyInput('1234567')).toBe('1.234.567');
  });

  it('descarta qualquer caractere que não seja dígito ou vírgula', () => {
    expect(maskCurrencyInput('R$ 5.000abc')).toBe('5.000');
  });

  it('aceita uma vírgula e limita os centavos a duas casas', () => {
    expect(maskCurrencyInput('1500,999')).toBe('1.500,99');
  });

  it('colapsa vírgulas repetidas em uma só', () => {
    expect(maskCurrencyInput('10,,5')).toBe('10,5');
  });

  it('remove zeros à esquerda', () => {
    expect(maskCurrencyInput('007')).toBe('7');
  });

  it('devolve vazio quando não há dígito', () => {
    expect(maskCurrencyInput('abc')).toBe('');
  });
});

describe('parseCurrencyInput', () => {
  it('interpreta o texto mascarado como número', () => {
    expect(parseCurrencyInput('5.000')).toBe(5000);
    expect(parseCurrencyInput('1.500,50')).toBe(1500.5);
  });

  it('devolve null quando não há valor', () => {
    expect(parseCurrencyInput('')).toBeNull();
  });

  it('faz a volta completa a partir da máscara', () => {
    expect(parseCurrencyInput(maskCurrencyInput('45000'))).toBe(45000);
  });
});

describe('formatSignedPercent', () => {
  it('usa o sinal de menos tipográfico, não o hífen', () => {
    // U+2212 alinha em coluna com o "+", o hífen não.
    expect(formatSignedPercent(-0.118)).toBe('−11,8%');
    expect(formatSignedPercent(0.082)).toBe('+8,2%');
  });
});
