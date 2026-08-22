import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getField } from '@/features/onboarding/fields/registry';
import type { Question } from '@/features/onboarding/questions';

interface QuestionStepProps {
  question: Question;
  value: string;
  canAdvance: boolean;
  step: number;
  total: number;
  isLast: boolean;
  onChange: (raw: string) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Um passo do questionário.
 *
 * Não conhece nenhum tipo de resposta em particular: pergunta ao registro qual
 * campo desenhar. Antes havia um ternário decidindo entre moeda e texto aqui,
 * o que obrigava a editar esta tela toda vez que surgisse um tipo novo.
 */
export function QuestionStep({
  question,
  value,
  canAdvance,
  step,
  total,
  isLast,
  onChange,
  onNext,
  onBack,
}: QuestionStepProps) {
  const { Component: Field } = getField(question.kind);
  const Icon = question.icon;

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-title-1 text-label">Vamos planejar seu futuro</h1>
        <p className="text-subheadline text-balance text-label-secondary">
          Responda algumas questões para montar suas metas.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <span className="text-footnote font-medium text-accent-text">
          Passo {step} de {total}
        </span>
        <ProgressBar current={step} total={total} />
      </div>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-label-on-accent"
          >
            <Icon className="h-6 w-6" strokeWidth={1.8} />
          </span>

          <div className="flex flex-col gap-2">
            <span className="text-footnote font-semibold tracking-wide text-accent-text uppercase">
              {question.eyebrow}
            </span>
            <h2 className="text-title-3 text-label">{question.question}</h2>
            <p className="text-footnote text-label-secondary">{question.help}</p>
          </div>

          {/* O tipo do evento vem inferido do JSX: FormEvent esta marcado como
              deprecated nos tipos do React 19. */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (canAdvance) {
                onNext();
              }
            }}
            className="flex flex-col gap-3"
          >
            {/* key remonta o campo a cada passo: sem isso o React reaproveita o
                no e o valor da pergunta anterior fica na tela. */}
            <Field
              key={question.id}
              label={question.question}
              value={value}
              onValueChange={onChange}
              placeholder={question.placeholder}
              autoFocus
            />

            <Button type="submit" size="lg" full disabled={!canAdvance}>
              {isLast ? 'Ver minhas metas' : 'Continuar'}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>

            {/* Sempre presente, inclusive no primeiro passo, de onde volta para
                a apresentação. Mudar de ideia não deve custar recomeçar. */}
            <Button type="button" variant="plain" size="lg" full onClick={onBack}>
              Voltar
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
