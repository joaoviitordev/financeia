import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Nomes dos text styles do iOS declarados em `tokens/typography.css`.
 *
 * O tailwind-merge precisa desta lista. Sem ela não há como ele saber que
 * `text-body` é tamanho e `text-label` é cor: os dois caem no mesmo grupo de
 * conflito e, ao juntar variante com tamanho num botão, a classe de cor era
 * descartada em silêncio, deixando o texto na cor herdada.
 *
 * Ao acrescentar um text style novo, acrescente o nome aqui também.
 */
const TEXT_STYLES = [
  'large-title',
  'title-1',
  'title-2',
  'title-3',
  'headline',
  'body',
  'callout',
  'subheadline',
  'footnote',
  'caption-1',
  'caption-2',
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...TEXT_STYLES] }],
    },
  },
});

/**
 * Junta classes condicionais e resolve conflitos do Tailwind: a última vence.
 * Sem isso, `cn('p-2', 'p-4')` deixaria as duas no atributo e o vencedor
 * dependeria da ordem no CSS gerado, não da ordem na chamada.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
