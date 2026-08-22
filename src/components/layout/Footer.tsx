import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

const PROJECT_NAME = 'Finance IA';
const AUTHOR = 'João Vitor';
const COURSE = 'Bootcamp da DIO Santander 2026 — AI React Front-end';

interface FooterProps {
  className?: string;
}

/**
 * Rodapé de crédito, presente em todas as telas.
 *
 * O ano vem do relógio na renderização, não fixo no código: um ano digitado à
 * mão fica desatualizado na virada e ninguém lembra de trocar.
 *
 * A linha de autoria diz "a partir do" e não "para": o projeto nasceu do
 * bootcamp, mas o que está aqui passou disso. Trocar por "projeto do curso"
 * seria mais curto e menos verdadeiro nas duas direções.
 */
export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn('flex w-full flex-col items-center gap-1 py-6 text-center', className)}>
      {/* O botão do cabeçalho abre a sheet; sem este link a página /historico
          existiria sem porta de entrada. */}
      <Link to="/historico" className="text-caption-1 text-accent-text hover:underline">
        Suas simulações
      </Link>
      <p className="text-caption-1 text-label-tertiary">
        © {year} {PROJECT_NAME}
      </p>
      {/* text-balance porque a linha quebra no mobile, e quebrada ao meio ela
          lê melhor do que com uma órfã de duas palavras embaixo. */}
      <p className="max-w-xs text-caption-2 text-balance text-label-tertiary sm:max-w-none">
        Desenvolvido por {AUTHOR} a partir do {COURSE}
      </p>
    </footer>
  );
}
