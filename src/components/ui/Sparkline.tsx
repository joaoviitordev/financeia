import { useId } from 'react';

import { cn } from '@/lib/cn';

interface SparklineProps {
  data: readonly number[];
  /** Descrição do que a linha mostra. A curva sozinha não é legível por leitor de tela. */
  label: string;
  /** Token de série (1 a 8) da paleta validada. */
  series?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  className?: string;
}

const WIDTH = 240;
const HEIGHT = 56;
const PAD = 4;

/**
 * Linha de tendência compacta.
 *
 * Segue as especificações de marca da skill dataviz: traço de 2px, preenchimento
 * de área suave sob a linha e ponto final destacado. A área dá peso à direção
 * e o ponto final ancora onde a série *está agora*, que é o que se quer saber.
 *
 * Sem eixos e sem grade de propósito: uma sparkline mostra formato, não valor.
 * Quem precisa do número lê a StatTile ao lado.
 */
export function Sparkline({ data, label, series = 1, className }: SparklineProps) {
  const gradientId = useId();

  if (data.length < 2) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  // Série constante teria span 0 e dividiria por zero; nesse caso a linha fica no meio.
  const span = max - min || 1;

  // Sem padding horizontal: a linha ocupa a largura toda e a area fecha nas
  // mesmas bordas, sem deixar aresta nem diagonal. overflow-visible no <svg>
  // impede que o ponto final seja cortado pela metade.
  const stepX = WIDTH / (data.length - 1);
  const toX = (index: number) => index * stepX;
  const toY = (value: number) => PAD + (1 - (value - min) / span) * (HEIGHT - PAD * 2);

  const points = data.map((value, index) => `${String(toX(index))},${String(toY(value))}`);
  const linePath = `M ${points.join(' L ')}`;
  // Fecha a area em 0 e WIDTH, nao em toX(): parar no padding deixa uma
  // aresta vertical visivel onde o preenchimento termina.
  const areaPath = `${linePath} L ${String(WIDTH)},${String(HEIGHT)} L 0,${String(HEIGHT)} Z`;

  const lastValue = data[data.length - 1];
  const color = `var(--chart-${String(series)})`;

  return (
    <svg
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      className={cn('h-14 w-full overflow-visible', className)}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {lastValue !== undefined && (
        <circle
          cx={toX(data.length - 1)}
          cy={toY(lastValue)}
          r="3"
          fill={color}
          stroke="var(--chart-surface)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
