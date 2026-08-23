import { SearchX } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import type { ChatMessage } from '@/features/insights/chat-types';
import { InsightChat } from '@/features/insights/InsightChat';
import { InsightPanel } from '@/features/insights/InsightPanel';
import { toPlanInput } from '@/features/onboarding/answers-to-plan';
import { buildPlan } from '@/features/onboarding/goals';
import { SimulationCards } from '@/features/simulations/SimulationCards';
import { getSimulation, updateSimulation } from '@/features/simulations/storage';

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
 *
 * A conversa entra abaixo do diagnóstico e só quando ele já está na tela
 * (AC-038, ASM-021): carregando, erro e falta de chave não rendem conversa,
 * porque o pedido de acompanhamento precisa do diagnóstico para não responder
 * genérico.
 */
export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const record = id === undefined ? undefined : getSimulation(id);
  const [temDiagnostico, setTemDiagnostico] = useState(false);

  // `useCallback` porque o painel avisa dentro de um efeito: uma função nova a
  // cada render faria esse efeito rodar em loop.
  const guardarConversa = useCallback(
    (messages: ChatMessage[]) => {
      if (id !== undefined) {
        updateSimulation(id, { messages });
      }
    },
    [id],
  );

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

      <InsightPanel id={record.id} onInsightChange={setTemDiagnostico} />

      {/* `record` é relido do armazenamento a cada render, e quando o painel
          avisa que o diagnóstico chegou ele já está gravado ali. É por isso
          que a conversa recebe os três de que precisa (AC-040) sem que nada
          precise ser costurado à mão aqui. */}
      {temDiagnostico ? <InsightChat record={record} onMessagesChange={guardarConversa} /> : null}
    </div>
  );
}
