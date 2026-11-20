import type { Operation } from '@fiscotrack/engine';
import { CSV_COLUMNS } from './csv';

/** Centavos → "32,50" (formato que a importação aceita). */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** Exporta operações no mesmo formato aceito pela importação (separador `;`). */
export function operationsToCsv(operations: readonly Operation[]): string {
  const rows = operations.map((operation) =>
    [
      operation.date,
      operation.ticker,
      operation.side === 'BUY' ? 'compra' : 'venda',
      String(operation.quantity),
      centsToInput(operation.unitPriceCents),
      centsToInput(operation.feesCents),
      operation.category === 'SWING' ? 'comum' : 'daytrade',
    ].join(';'),
  );
  return [CSV_COLUMNS.join(';'), ...rows].join('\n');
}
