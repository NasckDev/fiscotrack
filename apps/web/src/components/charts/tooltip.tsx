import type { ReactNode } from 'react';

export const AXIS_TICK = { fill: 'var(--ft-color-text-muted)', fontSize: 12 } as const;

export interface TooltipRow {
  readonly color: string;
  readonly label: string;
  readonly value: ReactNode;
}

interface ChartTooltipProps<T> {
  readonly title: (datum: T) => string;
  readonly rows: (datum: T) => readonly TooltipRow[];
  // Injetadas pelo Recharts:
  readonly active?: boolean;
  readonly payload?: readonly { readonly payload?: T }[];
}

/** Tooltip único para todos os gráficos: título, linhas coloridas e valores tabulares. */
export function ChartTooltip<T>({ title, rows, active, payload }: ChartTooltipProps<T>) {
  const datum = payload?.[0]?.payload;
  if (!active || datum === undefined) return null;
  return (
    <div className="min-w-44 rounded-xl border border-line-soft bg-card px-3 py-2.5 text-sm shadow-lg">
      <p className="mb-1.5 font-bold">{title(datum)}</p>
      <dl className="space-y-1">
        {rows(datum).map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted">
              <span
                className="size-2.5 rounded-sm"
                style={{ background: row.color }}
                aria-hidden="true"
              />
              {row.label}
            </dt>
            <dd className="num text-xs font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
