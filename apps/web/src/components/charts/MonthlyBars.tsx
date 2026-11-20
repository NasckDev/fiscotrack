import { formatBRL, type MonthlyResult } from '@fiscotrack/engine';
import { useReducedMotion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactBRL, formatMonthShort, formatMonthTitle } from '../../domain/format';
import { monthResultCents } from '../../domain/monthStatus';
import { Money } from '../ui';
import { ChartCard, Legend, LegendItem } from './ChartCard';
import { AXIS_TICK, ChartTooltip, type TooltipRow } from './tooltip';

interface Datum {
  readonly month: string;
  readonly label: string;
  readonly resultado: number;
  readonly darf: number;
}

function toData(months: readonly MonthlyResult[]): readonly Datum[] {
  return months.map((month) => ({
    month: month.month,
    label: formatMonthShort(month.month),
    resultado: monthResultCents(month) / 100,
    darf: month.darfDueCents / 100,
  }));
}

function barColor(value: number): string {
  return value < 0 ? 'var(--ft-chart-loss)' : 'var(--ft-chart-gain)';
}

export function MonthlyBars({ months }: { readonly months: readonly MonthlyResult[] }) {
  const reduceMotion = useReducedMotion() ?? false;
  const data = toData(months);
  const best = [...months].sort((a, b) => monthResultCents(b) - monthResultCents(a))[0];
  const description = `Barras de resultado e DARF estimado por mês, de ${data[0]?.label ?? ''} a ${
    data[data.length - 1]?.label ?? ''
  }.${best ? ` Melhor mês: ${formatMonthTitle(best.month)}, ${formatBRL(monthResultCents(best))}.` : ''}`;

  return (
    <ChartCard
      title="Resultado por mês"
      description={description}
      legend={
        <Legend>
          <LegendItem color="var(--ft-chart-gain)" label="Lucro" />
          <LegendItem color="var(--ft-chart-loss)" label="Prejuízo" />
          <LegendItem color="var(--ft-chart-darf)" label="DARF estimado" />
        </Legend>
      }
      table={{
        head: ['Mês', 'Resultado', 'DARF estimado'],
        rows: months.map((month) => [
          formatMonthTitle(month.month),
          <Money key="r" cents={monthResultCents(month)} signed />,
          <Money key="d" cents={month.darfDueCents} />,
        ]),
      }}
    >
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...data]} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--ft-chart-grid)" />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--ft-chart-grid)' }}
              tickMargin={8}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value: number) => formatCompactBRL(value)}
            />
            <Tooltip
              cursor={{ fill: 'var(--ft-color-accent-surface)', opacity: 0.7 }}
              content={
                <ChartTooltip<Datum>
                  title={(datum) => formatMonthTitle(datum.month)}
                  rows={(datum): readonly TooltipRow[] => [
                    {
                      color: barColor(datum.resultado),
                      label: datum.resultado < 0 ? 'Prejuízo' : 'Lucro',
                      value: formatBRL(Math.round(datum.resultado * 100)),
                    },
                    {
                      color: 'var(--ft-chart-darf)',
                      label: 'DARF estimado',
                      value: formatBRL(Math.round(datum.darf * 100)),
                    },
                  ]}
                />
              }
            />
            <Bar
              dataKey="resultado"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
              isAnimationActive={!reduceMotion}
              animationDuration={700}
            >
              {data.map((datum) => (
                <Cell key={datum.month} fill={barColor(datum.resultado)} />
              ))}
            </Bar>
            <Bar
              dataKey="darf"
              fill="var(--ft-chart-darf)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
              isAnimationActive={!reduceMotion}
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
