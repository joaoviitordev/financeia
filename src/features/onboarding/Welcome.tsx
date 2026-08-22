import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

interface WelcomeProps {
  onStart: () => void;
}

const STEPS = [
  {
    title: 'Você responde cinco perguntas',
    body: 'Sobre o que entra, o que sai e o que você quer conquistar. Leva menos de dois minutos.',
  },
  {
    title: 'A gente calcula sua sobra mensal',
    body: 'É ela que financia tudo: sem saber quanto sobra, não dá para estimar prazo nenhum.',
  },
  {
    title: 'Você recebe sua lista de metas',
    body: 'Com quanto falta e em quantos meses cada uma fecha no seu ritmo atual.',
  },
] as const;

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <header className="flex max-w-xl flex-col items-center gap-3 text-center">
        <span aria-hidden="true" className="text-5xl">
          🐷
        </span>
        <h1 className="text-large-title text-label">Vamos planejar seu futuro</h1>
        <p className="text-body text-balance text-label-secondary">
          O Finance IA transforma algumas perguntas sobre a sua vida financeira em uma lista de
          metas com prazo não em mais um app de categorizar gastos.
        </p>
      </header>

      <Card className="w-full max-w-xl">
        <CardBody className="flex flex-col gap-5">
          {/* A numeração é honesta aqui: as etapas acontecem nesta ordem, uma
              depende da anterior. */}
          <ol className="flex flex-col gap-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-footnote font-semibold text-accent-text"
                >
                  {index + 1}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-headline text-label">{step.title}</span>
                  <span className="text-subheadline text-label-secondary">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <Button size="lg" full onClick={onStart}>
            Começar
          </Button>

          <p className="text-center text-footnote text-label-tertiary">
            Nada é enviado para lugar nenhum. Suas respostas ficam neste dispositivo.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
