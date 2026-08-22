import { SearchX } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { InsightPanel } from '@/features/insights/InsightPanel';
import { toPlanInput } from '@/features/onboarding/answers-to-plan';
import { buildPlan } from '@/features/onboarding/goals';
import { SimulationCards } from '@/features/simulations/SimulationCards';
import { getSimulation } from '@/features/simulations/storage';

/**
 * Tela de resultado (`/resultado/:id`).
 *
 * O id vem da rota, não de estado em memória — é isso que torna o endereço
 * compartilhável e sobrevivente a recarregar (US-004). Os números exibidos
 * nunca são recalculados aqui: passam por `buildPlan`, o mesmo cálculo do
 * fim do questionário, para as duas telas nunca divergirem entre si.
 *
 * Um id que não existe no armazenamento (apagado, digitado à mão, de outro
 * dispositivo) não é um bug — é um estado esperado, com um caminho de volta
 * em vez de tela em branco ou erro (AC-012).
 */
export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const record = id === undefined ? undefined : getSimulation(id);

  if (record === undefined) {
    return (
      <div className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <SearchX aria-hidden="true" className="h-9 w-9 text-label-tertiary" strokeWidth={1.5} />
        <h1 className="text-title-1 text-label">Simulação não encontrada</h1>
        <p className="text-body text-balance text-label-secondary">
          O endereço que você abriu não corresponde a nenhuma simulação guardada neste dispositivo.
        </p>
        <Button
          size="lg"
          onClick={() => {
            void navigate('/');
          }}
        >
          Começar uma nova simulação
        </Button>
      </div>
    );
  }

  const plan = buildPlan(toPlanInput(record.answers));

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-title-1 text-label">Resultado da sua simulação</h1>
        <p className="text-body text-balance text-label-secondary">
          Os números que você informou, guardados neste dispositivo.
        </p>
      </header>

      <SimulationCards plan={plan} />

      <InsightPanel id={record.id} />
    </div>
  );
}
