import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';

export interface ChartTable {
  readonly head: readonly string[];
  readonly rows: readonly (readonly ReactNode[])[];
}

interface ChartCardProps {
  readonly title: string;
  /** Descrição textual do gráfico, lida por leitores de tela. */
  readonly description: string;
  readonly legend?: ReactNode;
  readonly table: ChartTable;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Moldura de gráfico: título, legenda, descrição textual e alternativa em tabela. */
export function ChartCard({
  title,
  description,
  legend,
  table,
  className = '',
  children,
}: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const captionId = useId();

  return (
    <figure className={`card h-full p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <figcaption id={captionId} className="text-base font-bold">
            {title}
          </figcaption>
          {legend}
        </div>
        <button
          type="button"
          className="btn btn-secondary shrink-0"
          aria-pressed={showTable}
          onClick={() => setShowTable((value) => !value)}
        >
          <Icon name={showTable ? 'chart' : 'table'} size={16} />
          {showTable ? 'Ver gráfico' : 'Ver como tabela'}
        </button>
      </div>
      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-describedby={captionId}>
            <thead>
              <tr className="border-b border-line-soft text-xs text-muted">
                {table.head.map((label, index) => (
                  <th
                    key={label}
                    scope="col"
                    className={`py-2 font-medium ${index === 0 ? 'pr-4' : 'pr-4 text-right'}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-line-soft last:border-0">
                  {row.map((cell, cellIndex) =>
                    cellIndex === 0 ? (
                      <th key={cellIndex} scope="row" className="py-2.5 pr-4 font-normal">
                        {cell}
                      </th>
                    ) : (
                      <td key={cellIndex} className="py-2.5 pr-4 text-right">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label={description}>
          {children}
        </div>
      )}
    </figure>
  );
}

export function LegendItem({ color, label }: { readonly color: string; readonly label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ background: color }} aria-hidden="true" />
      {label}
    </li>
  );
}

export function Legend({ children }: { readonly children: ReactNode }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legenda">
      {children}
    </ul>
  );
}
