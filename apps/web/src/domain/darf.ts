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

/** Marca de pagamento feita pelo usuário. `amountCents` null vem de dados antigos (sem valor). */
export interface PaidMark {
  readonly month: string;
  readonly amountCents: number | null;
}

export interface DarfEntry {
  readonly month: string;
  readonly dueDate: string;
  readonly amountCents: number;
  readonly paid: boolean;
  /** Marcado como pago, mas o valor apurado mudou desde então: volta a pendente. */
  readonly amountChanged: boolean;
}

/** Um DARF por mês com imposto a recolher, do mais antigo para o mais recente. */
export function buildDarfs(
  months: readonly MonthlyResult[],
  paid: ReadonlyMap<string, number | null>,
): readonly DarfEntry[] {
  return months
    .filter((month) => month.darfDueCents > 0)
    .map((month) => {
      const mark = paid.has(month.month) ? paid.get(month.month) : undefined;
      const marked = mark !== undefined;
      const sameAmount = mark === null || mark === month.darfDueCents;
      return {
        month: month.month,
        dueDate: darfDueDate(month.month),
        amountCents: month.darfDueCents,
        paid: marked && sameAmount,
        amountChanged: marked && !sameAmount,
      };
    });
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

/** Texto de prazo: "Vence em 3 dias", "Vence hoje" ou "Venceu há 2 dias" (compara com hoje). */
export function dueCountdown(dueDate: string, today: string): { text: string; urgent: boolean } {
  const days = daysBetween(today, dueDate);
  const plural = (count: number) => (count === 1 ? '1 dia' : count + ' dias');
  if (days < 0) return { text: 'Venceu há ' + plural(-days), urgent: true };
  if (days === 0) return { text: 'Vence hoje', urgent: true };
  return { text: 'Vence em ' + plural(days), urgent: days <= DUE_SOON_DAYS };
}

/** Mapa de pagamentos → lista de marcas (para backup e desfazer). */
export function toPaidMarks(paid: ReadonlyMap<string, number | null>): readonly PaidMark[] {
  return [...paid].map(([month, amountCents]) => ({ month, amountCents }));
}

/** Selo do cartão herói: "Faltam 5 dias", "Falta 1 dia", "Vence hoje" ou "Venceu há 2 dias". */
export function dueBadge(dueDate: string, today: string): { text: string; overdue: boolean } {
  const days = daysBetween(today, dueDate);
  if (days < 0) return { text: dueCountdown(dueDate, today).text, overdue: true };
  if (days === 0) return { text: 'Vence hoje', overdue: false };
  return { text: days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`, overdue: false };
}
