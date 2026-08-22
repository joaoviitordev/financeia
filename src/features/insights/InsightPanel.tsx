import { KeyRound, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { InsightContent } from '@/features/insights/InsightContent';
import { useInsight } from '@/features/insights/useInsight';

interface InsightPanelProps {
  /** Simulação cujo diagnóstico será lido ou gerado. */
  id: string;
}

const TITLE = 'Insight financeiro personalizado';

/**
 * O painel do diagnóstico e seus quatro estados.
 *
 * Eles são mutuamente exclusivos por construção — uma cadeia de `return`, não
 * quatro `&&` que podem se sobrepor (AC-021). O título aparece desde o
 * primeiro instante, inclusive carregando: ele não depende da resposta, e
 * mostrá-lo cedo evita o pulo de layout quando o texto chega.
 *
 * `role="status"` com `aria-busy` cobre quem usa leitor de tela: o esqueleto
 * não existe para essa pessoa, e sem isso a chegada do diagnóstico seria
 * silenciosa.
 */
export function InsightPanel({ id }: InsightPanelProps) {
  const { insight, isLoading, error, retry } = useInsight(id);

  return (
    <Card>
      <CardBody className="flex flex-col gap-4" aria-busy={isLoading} role="status">
        <h2 className="text-title-3 text-label">
          <span aria-hidden="true">✨ </span>
          {TITLE}
        </h2>

        {isLoading ? (
          <Skeleton lines={8} />
        ) : error?.kind === 'missing-key' ? (
          <div className="flex flex-col items-start gap-2">
            <KeyRound aria-hidden="true" className="h-5 w-5 text-label-tertiary" />
            <p className="text-body text-label-secondary">{error.message}</p>
          </div>
        ) : error !== null ? (
          <div className="flex flex-col items-start gap-3">
            <p className="flex items-start gap-2 text-body text-critical">
              <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              {error.message}
            </p>
            <Button variant="gray" onClick={retry}>
              Tentar novamente
            </Button>
          </div>
        ) : insight !== null ? (
          <InsightContent insight={insight} />
        ) : null}
      </CardBody>
    </Card>
  );
}
