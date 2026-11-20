import type { MonthlyResult } from '@fiscotrack/engine';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface MonthStatus {
  readonly label: string;
  readonly tone: StatusTone;
}

/** Resultado bruto do mês somando operações comuns e day trade, em centavos. */
export function monthResultCents(month: MonthlyResult): number {
  return month.swing.grossResultCents + month.dayTrade.grossResultCents;
}

/** Rótulo curto que resume a situação fiscal do mês. */
export function monthStatus(month: MonthlyResult): MonthStatus {
  if (month.darfDueCents > 0) return { label: 'DARF a pagar', tone: 'warning' };
  if (month.taxCarriedForwardCents > 0) return { label: 'Abaixo do mínimo', tone: 'info' };
  if (monthResultCents(month) < 0) return { label: 'Prejuízo', tone: 'danger' };
  if (month.swing.exempt && month.swing.salesTotalCents > 0 && month.swing.grossResultCents > 0) {
    return { label: 'Isento', tone: 'success' };
  }
  return { label: 'Sem imposto', tone: 'neutral' };
}
