import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Junta classes condicionais e resolve conflitos do Tailwind — a última vence.
 * Sem isso, `cn('p-2', 'p-4')` deixaria as duas no atributo e o vencedor
 * dependeria da ordem no CSS gerado, não da ordem na chamada.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
