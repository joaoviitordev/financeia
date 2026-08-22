import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/cn';

describe('cn', () => {
  it('resolve conflito real: a última classe do mesmo grupo vence', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  /**
   * Regressão: sem ensinar os text styles ao tailwind-merge, `text-body`
   * (tamanho) e `text-label-on-accent` (cor) caíam no mesmo grupo de conflito
   * e a cor era descartada. Na prática, todo botão preenchido perdia o texto
   * branco e ficava preto sobre azul.
   */
  it('não descarta a cor do texto quando há também um text style', () => {
    const result = cn('text-body', 'text-label-on-accent');

    expect(result).toContain('text-body');
    expect(result).toContain('text-label-on-accent');
  });

  it('mantém tamanho e cor independentes da ordem', () => {
    const result = cn('text-accent-text', 'text-footnote');

    expect(result).toContain('text-accent-text');
    expect(result).toContain('text-footnote');
  });

  it('ainda resolve conflito entre dois text styles', () => {
    expect(cn('text-body', 'text-headline')).toBe('text-headline');
  });

  it('ainda resolve conflito entre duas cores de texto', () => {
    expect(cn('text-label', 'text-label-secondary')).toBe('text-label-secondary');
  });

  it('aceita valores condicionais', () => {
    const ativo = [false, true][0];

    expect(cn('base', ativo && 'off', undefined, 'on')).toBe('base on');
  });
});
