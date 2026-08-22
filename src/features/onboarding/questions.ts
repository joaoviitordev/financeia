import type { LucideIcon } from 'lucide-react';
import { Banknote, Clock, Heart, PiggyBank, Receipt } from 'lucide-react';

import type { FieldKind } from '@/features/onboarding/fields/types';

/** Identificadores das respostas. Cada um vira uma chave em Answers. */
export type QuestionId = 'renda' | 'gastosFixos' | 'guardado' | 'objetivo' | 'custoObjetivo';

export type Answers = Record<QuestionId, string>;

export interface Question {
  id: QuestionId;
  /** Rótulo curto acima da pergunta. */
  eyebrow: string;
  question: string;
  placeholder: string;
  kind: FieldKind;
  /** Explica por que estamos perguntando. Reduz a sensação de interrogatório. */
  help: string;
  /** Ícone do lucide desenhado ao lado da pergunta. */
  icon: LucideIcon;
}

/**
 * As cinco perguntas.
 *
 * Elas não são um questionário genérico: as respostas alimentam diretamente o
 * cálculo das metas em `goals.ts`. Renda menos gastos fixos dá a sobra mensal,
 * que é o que determina em quanto tempo cada meta fecha; sem essas duas não há
 * prazo a calcular. Ao mexer aqui, ajuste `goals.ts` junto.
 */
export const QUESTIONS: readonly Question[] = [
  {
    id: 'renda',
    eyebrow: 'Renda mensal',
    question: 'Quanto é depositado na sua conta todo mês, somando todas as fontes?',
    placeholder: 'ex: 5000',
    kind: 'currency',
    help: 'Salário, freelas, aluguéis, benefícios, tudo que entra.',
    icon: Banknote,
  },
  {
    id: 'gastosFixos',
    eyebrow: 'Gastos fixos',
    question: 'Quanto vai embora todo mês com contas que se repetem?',
    placeholder: 'ex: 2300',
    kind: 'currency',
    help: 'Aluguel, luz, água, internet, mensalidades e assinaturas.',
    icon: Receipt,
  },
  {
    id: 'guardado',
    eyebrow: 'Reserva atual',
    question: 'Quanto você já tem guardado hoje?',
    placeholder: 'ex: 8000',
    kind: 'currency',
    help: 'Conta poupança, CDB, caixinha, o que dá para acessar se precisar.',
    icon: PiggyBank,
  },
  {
    id: 'objetivo',
    eyebrow: 'Seu objetivo',
    question: 'Qual objetivo você quer conquistar primeiro?',
    placeholder: 'ex: Comprar um carro',
    kind: 'text',
    help: 'Dê um nome a ele. Vai aparecer na sua lista de metas.',
    icon: Heart,
  },
  {
    id: 'custoObjetivo',
    eyebrow: 'Custo do objetivo',
    question: 'Quanto custa esse objetivo?',
    placeholder: 'ex: 45000',
    kind: 'currency',
    help: 'Um valor aproximado já serve. Dá para ajustar depois.',
    icon: Clock,
  },
];

export const EMPTY_ANSWERS: Answers = {
  renda: '',
  gastosFixos: '',
  guardado: '',
  objetivo: '',
  custoObjetivo: '',
};
