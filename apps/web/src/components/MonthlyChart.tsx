import { formatBRL, type MonthlyResult } from '@fiscotrack/engine';
import { useId, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMonth } from '../domain/format';

interface MonthlyChartProps {
  readonly months: readonly MonthlyResult[];
}

function toChartData(months: readonly MonthlyResult[]) {
  return months.map((month) => ({
    month: month.month,
    resultado: (month.swing.grossResultCents + month.dayTrade.grossResultCents) / 100,
    darf: month.darfDueCents / 100,
  }));
}

function MonthlyTable({ months, captionId }: MonthlyChartProps & { readonly captionId: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" aria-describedby={captionId}>
        <thead>
          <tr className="border-b border-slate-300 dark:border-slate-600">
            <th scope="col" className="py-2 pr-4">
              Mês
            </th>
            <th scope="col" className="py-2 pr-4 text-right">
              Resultado
            </th>
            <th scope="col" className="py-2 text-right">
              DARF estimado
            </th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month.month} className="border-b border-slate-200 dark:border-slate-700">
              <th scope="row" className="py-2 pr-4 font-normal">
                {formatMonth(month.month)}
              </th>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatBRL(month.swing.grossResultCents + month.dayTrade.grossResultCents)}
              </td>
              <td className="py-2 text-right tabular-nums">{formatBRL(month.darfDueCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Gráfico de resultado mensal com alternativa textual (tabela) sempre disponível. */
export function MonthlyChart({ months }: MonthlyChartProps) {
  const [showTable, setShowTable] = useState(false);
  const captionId = useId();

  return (
    <figure className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <figcaption id={captionId} className="font-semibold">
          Resultado e DARF estimado por mês
        </figcaption>
        <button
          type="button"
          className="btn-secondary"
          aria-pressed={showTable}
          onClick={() => setShowTable((value) => !value)}
        >
          {showTable ? 'Ver gráfico' : 'Ver como tabela'}
        </button>
      </div>
      {showTable ? (
        <MonthlyTable months={months} captionId={captionId} />
      ) : (
        <div className="h-64" role="img" aria-label="Gráfico de barras; use “Ver como tabela” para os valores.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={toChartData(months)}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => formatBRL(Math.round(Number(value) * 100))} />
              <Bar dataKey="resultado" name="Resultado" fill="#2563eb" />
              <Bar dataKey="darf" name="DARF" fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
