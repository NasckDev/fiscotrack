import type { MonthlyResult } from '@fiscotrack/engine';

/** Código de receita do DARF de ganhos líquidos em renda variável (pessoa física). */
export const DARF_REVENUE_CODE = '6015';
/** Janela em que o vencimento é destacado como próximo. */
export const DUE_SOON_DAYS = 10;

const DAY_MS = 86_400_000;

function toUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Data de hoje no fuso local, no formato AAAA-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Vencimento do DARF: último dia útil do mês seguinte à apuração.
 * Premissa: só considera fins de semana (feriados nacionais não são modelados).
 */
export function darfDueDate(month: string): string {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  // Dia 0 do segundo mês seguinte = último dia do mês seguinte à apuração.
  const lastDay = new Date(Date.UTC(year, monthNumber + 1, 0));
  while (lastDay.getUTCDay() === 0 || lastDay.getUTCDay() === 6) {
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
  }
  return lastDay.toISOString().slice(0, 10);
}

/** Dias inteiros de `from` até `to` (negativo quando `to` já passou). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS);
}

export type DarfStatus = 'paid' | 'overdue' | 'due-soon' | 'pending';

export interface DarfEntry {
  readonly month: string;
  readonly dueDate: string;
  readonly amountCents: number;
  readonly paid: boolean;
}

/** Um DARF por mês com imposto a recolher, do mais antigo para o mais recente. */
export function buildDarfs(
  months: readonly MonthlyResult[],
  paidMonths: ReadonlySet<string>,
): readonly DarfEntry[] {
  return months
    .filter((month) => month.darfDueCents > 0)
    .map((month) => ({
      month: month.month,
      dueDate: darfDueDate(month.month),
      amountCents: month.darfDueCents,
      paid: paidMonths.has(month.month),
    }));
}

export function darfStatus(entry: DarfEntry, today: string): DarfStatus {
  if (entry.paid) return 'paid';
  const days = daysBetween(today, entry.dueDate);
  if (days < 0) return 'overdue';
  return days <= DUE_SOON_DAYS ? 'due-soon' : 'pending';
}

/** O DARF em aberto mais antigo (vencidos aparecem antes dos que ainda vão vencer). */
export function nextDarf(darfs: readonly DarfEntry[]): DarfEntry | null {
  return darfs.find((entry) => !entry.paid) ?? null;
}
