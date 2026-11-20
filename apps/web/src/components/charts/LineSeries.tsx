import { useReducedMotion } from 'motion/react';
import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactBRL } from '../../domain/format';
import { ChartCard, type ChartTable } from './ChartCard';
import { AXIS_TICK, ChartTooltip, type TooltipRow } from './tooltip';

export interface LinePoint {
  readonly label: string;
  /** Valor em reais. */
  readonly value: number;
  readonly detail: string;
}

interface LineSeriesProps {
  readonly title: string;
  readonly description: string;
  readonly seriesLabel: string;
  readonly points: readonly LinePoint[];
  readonly table: ChartTable;
  readonly formatValue: (value: number) => string;
  readonly className?: string;
}

/** Linha com área suave em gradiente (resultado acumulado, preço médio). */
export function LineSeries({
  title,
  description,
  seriesLabel,
  points,
  table,
  formatValue,
  className,
}: LineSeriesProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const gradientId = useId();

  return (
    <ChartCard
      title={title}
      description={description}
      table={table}
      className={className}
      legend={
        <p className="text-xs text-muted">
          <span
            className="mr-1.5 inline-block size-2.5 rounded-sm align-middle"
            style={{ background: 'var(--ft-chart-line)' }}
            aria-hidden="true"
          />
          {seriesLabel}
        </p>
      }
    >
      <div className="h-60 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            accessibilityLayer={false}
            data={[...points]}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ft-chart-line)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--ft-chart-line)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--ft-chart-grid)" />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--ft-chart-grid)' }}
              tickMargin={8}
              minTickGap={16}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value: number) => formatCompactBRL(value)}
            />
            <Tooltip
              content={
                <ChartTooltip<LinePoint>
                  title={(point) => point.detail}
                  rows={(point): readonly TooltipRow[] => [
                    {
                      color: 'var(--ft-chart-line)',
                      label: seriesLabel,
                      value: formatValue(point.value),
                    },
                  ]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--ft-chart-line)"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={{ r: 3, fill: 'var(--ft-chart-line)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={!reduceMotion}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
