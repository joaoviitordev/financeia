import { Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { toPlanInput } from '@/features/onboarding/answers-to-plan';
import { buildPlan } from '@/features/onboarding/goals';
import {
  clearSimulations,
  deleteSimulation,
  listSimulations,
  type SimulationRecord,
} from '@/features/simulations/storage';
import { formatBRL } from '@/lib/format';

interface HistoryListProps {
  /** Abrir uma simulação. Quem conhece rotas é quem usa a lista, não ela. */
  onOpen: (id: string) => void;
  /** Sair para uma simulação nova, a partir do estado vazio. */
  onStart: () => void;
  /** Quais simulações deixaram de existir — quem estiver mostrando uma delas que se resolva. */
  onDeleted?: (ids: string[]) => void;
}

/** O que está esperando confirmação. Nada de `window.confirm` (ASM-014). */
type Pending = { kind: 'one'; record: SimulationRecord } | { kind: 'all' } | null;

const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

function formatDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? 'data desconhecida' : DATE.format(date);
}

/**
 * A ordem que a pessoa entende por "mais recente" é a da data de criação
 * (ASM-018), não a da posição no armazenamento. O `reverse` antes do `sort`
 * resolve o empate de duas simulações gravadas no mesmo milissegundo: como o
 * `sort` é estável, quem foi guardada por último aparece primeiro.
 */
function newestFirst(records: readonly SimulationRecord[]): SimulationRecord[] {
  return [...records].reverse().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function goalOf(record: SimulationRecord) {
  const plan = buildPlan(toPlanInput(record.answers));

  return plan.goals.find((goal) => goal.id === 'objetivo');
}

/**
 * As simulações guardadas neste dispositivo.
 *
 * O mesmo componente serve a sheet do cabeçalho e a página `/historico`
 * (ASM-013): a lista não sabe onde está, só avisa quem a usa quando alguém
 * pede para abrir ou some com um registro.
 *
 * Excluir é irreversível e não tem lixeira — daí a confirmação obrigatória,
 * numa sheet do próprio produto, e não no diálogo do navegador, que ignora
 * tema, foco e idioma daqui.
 */
export function HistoryList({ onOpen, onStart, onDeleted }: HistoryListProps) {
  const [records, setRecords] = useState<SimulationRecord[]>(() => newestFirst(listSimulations()));
  const [pending, setPending] = useState<Pending>(null);

  const confirm = () => {
    if (pending === null) {
      return;
    }
    const removed = pending.kind === 'all' ? records.map((item) => item.id) : [pending.record.id];

    if (pending.kind === 'all') {
      clearSimulations();
    } else {
      deleteSimulation(pending.record.id);
    }

    setRecords(newestFirst(listSimulations()));
    setPending(null);
    onDeleted?.(removed);
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-headline text-label">Nenhuma simulação por aqui ainda</p>
        <p className="text-subheadline text-balance text-label-secondary">
          Ao concluir uma simulação, ela fica guardada neste dispositivo e aparece nesta lista — e
          você pode apagá-la quando quiser.
        </p>
        <Button size="lg" onClick={onStart}>
          Começar uma simulação
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {records.map((record) => {
          const goal = goalOf(record);
          const name = goal?.name ?? 'Seu objetivo';

          return (
            <li key={record.id}>
              <Card>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-headline text-label">{name}</span>
                      <span className="text-footnote text-label-secondary">
                        {formatDate(record.createdAt)}
                      </span>
                    </div>
                    <span className="tabular-figures shrink-0 text-body font-medium text-label">
                      {formatBRL(goal?.target ?? 0)}
                    </span>
                  </div>

                  {/* Texto, não só cor: o mesmo motivo do selo de viabilidade. */}
                  <span className="flex items-center gap-1.5 text-footnote text-label-secondary">
                    <Sparkles
                      aria-hidden="true"
                      className={
                        record.insight === undefined ? 'h-4 w-4' : 'h-4 w-4 text-accent-text'
                      }
                    />
                    {record.insight === undefined ? 'Sem diagnóstico ainda' : 'Diagnóstico pronto'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="gray"
                      onClick={() => {
                        onOpen(record.id);
                      }}
                    >
                      Ver detalhes
                    </Button>
                    <Button
                      variant="plain"
                      aria-label={`Excluir a simulação ${name}`}
                      onClick={() => {
                        setPending({ kind: 'one', record });
                      }}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>

      {/* Discreto de propósito: apagar tudo é raro e não deve competir com o resto. */}
      <Button
        variant="plain"
        size="sm"
        onClick={() => {
          setPending({ kind: 'all' });
        }}
      >
        Apagar todas as simulações
      </Button>

      <Sheet
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
          }
        }}
        title={pending?.kind === 'all' ? 'Apagar todas as simulações?' : 'Apagar esta simulação?'}
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button variant="destructive" size="lg" full onClick={confirm}>
              {pending?.kind === 'all' ? 'Apagar todas' : 'Apagar'}
            </Button>
            <Button
              variant="plain"
              size="lg"
              full
              onClick={() => {
                setPending(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        }
      >
        <p className="text-body text-balance text-label-secondary">
          {pending?.kind === 'all'
            ? 'Todas as simulações guardadas neste dispositivo serão apagadas. Não dá para desfazer.'
            : 'Esta simulação e o diagnóstico dela serão apagados deste dispositivo. Não dá para desfazer.'}
        </p>
      </Sheet>
    </div>
  );
}
