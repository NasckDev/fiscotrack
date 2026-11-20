import { formatBRL } from '@fiscotrack/engine';
import { useReducedMotion } from 'motion/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Holding } from '../../domain/portfolio';
import { ChartCard } from './ChartCard';
import { ChartTooltip, type TooltipRow } from './tooltip';

const PALETTE = [1, 2, 3, 4, 5, 6, 7].map((n) => `var(--ft-donut-${n})`);

interface Slice {
  readonly ticker: string;
  readonly cents: number;
  readonly share: number;
  readonly color: string;
}

function toSlices(holdings: readonly Holding[]): readonly Slice[] {
  const open = holdings.filter((holding) => holding.totalCostCents > 0);
  const total = open.reduce((sum, holding) => sum + holding.totalCostCents, 0);
  return [...open]
    .sort((a, b) => b.totalCostCents - a.totalCostCents)
    .map((holding, index) => ({
      ticker: holding.ticker,
      cents: holding.totalCostCents,
      share: total === 0 ? 0 : holding.totalCostCents / total,
      color: PALETTE[index % PALETTE.length] ?? PALETTE[0] ?? '',
    }));
}

const percent = (share: number) =>
  `${(share * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/** Alocação da carteira por ativo, ao custo de aquisição. */
export function AllocationDonut({ holdings }: { readonly holdings: readonly Holding[] }) {
  const reduceMotion = useReducedMotion() ?? false;
  const slices = toSlices(holdings);
  const top = slices[0];

  return (
    <ChartCard
      title="Alocação por ativo"
      description={`Rosca com a distribuição do patrimônio por ativo.${
        top ? ` Maior posição: ${top.ticker}, ${percent(top.share)}.` : ''
      }`}
      table={{
        head: ['Ativo', 'Custo', 'Participação'],
        rows: slices.map((slice) => [
          slice.ticker,
          <span key="c" className="num">
            {formatBRL(slice.cents)}
          </span>,
          <span key="s" className="num">
            {percent(slice.share)}
          </span>,
        ]),
      }}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
        <div className="h-44 w-44 flex-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer={false}>
              <Tooltip
                content={
                  <ChartTooltip<Slice>
                    title={(slice) => slice.ticker}
                    rows={(slice): readonly TooltipRow[] => [
                      { color: slice.color, label: 'Custo', value: formatBRL(slice.cents) },
                      { color: slice.color, label: 'Participação', value: percent(slice.share) },
                    ]}
                  />
                }
              />
              <Pie
                data={[...slices]}
                dataKey="cents"
                nameKey="ticker"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={!reduceMotion}
                animationDuration={800}
              >
                {slices.map((slice) => (
                  <Cell key={slice.ticker} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid w-full gap-1.5 text-sm">
          {slices.map((slice) => (
            <li key={slice.ticker} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ background: slice.color }}
                  aria-hidden="true"
                />
                {slice.ticker}
              </span>
              <span className="num text-xs text-muted">{percent(slice.share)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
