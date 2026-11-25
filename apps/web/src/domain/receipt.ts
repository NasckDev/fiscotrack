import {
  BR_RENDA_VARIAVEL_RULESETS,
  formatBRL,
  formatRate,
  type CategoryResult,
  type MonthlyResult,
  type RuleSource,
} from '@fiscotrack/engine';
import { formatMonth } from './format';

export interface ReceiptLine {
  readonly label: string;
  /** Valor já formatado (moeda ou alíquota). */
  readonly value: string;
  /** Observação curta logo abaixo da linha. */
  readonly note?: string;
}

export interface Receipt {
  readonly month: string;
  readonly lines: readonly ReceiptLine[];
  readonly totalLabel: string;
  readonly totalCents: number;
  readonly totalNote?: string;
  readonly sources: readonly RuleSource[];
}

const SOURCES = new Map(
  BR_RENDA_VARIAVEL_RULESETS.flatMap((ruleSet) => ruleSet.sources).map((s) => [s.id, s]),
);

function categoryLines(
  result: CategoryResult,
  monthLabel: string,
  limitCents: number,
): readonly ReceiptLine[] {
  if (result.salesTotalCents === 0) return [];
  const isSwing = result.category === 'SWING';
  const suffix = isSwing ? '' : ' em day trade';
  const lines: ReceiptLine[] = [
    {
      label: isSwing ? `Vendas de ações em ${monthLabel}` : `Vendas em day trade em ${monthLabel}`,
      value: formatBRL(result.salesTotalCents),
      note: isSwing
        ? result.exempt
          ? `Até ${formatBRL(limitCents)} no mês: lucro isento`
          : `Acima de ${formatBRL(limitCents)} no mês, sem isenção`
        : undefined,
    },
    {
      label: result.grossResultCents < 0 ? `Prejuízo do mês${suffix}` : `Lucro líquido${suffix}`,
      value: formatBRL(result.grossResultCents),
    },
  ];
  if (result.exempt && result.grossResultCents >= 0) return lines;
  lines.push({
    label: `Prejuízo compensado${suffix}`,
    value: formatBRL(result.lossCompensatedCents),
  });
  if (result.taxableBaseCents > 0) {
    lines.push({
      label: isSwing ? 'Alíquota (operações comuns)' : 'Alíquota (day trade)',
      value: formatRate(result.rateBps),
    });
  }
  return lines;
}

/**
 * "Por que deu esse valor?" em formato de recibo: só reorganiza o que o motor já calculou
 * (vendas, resultado, compensação, alíquota e DARF), sem refazer nenhuma conta de imposto.
 */
export function buildReceipt(month: MonthlyResult): Receipt {
  const label = formatMonth(month.month).split(' de ')[0] ?? month.month;
  const limitCents =
    BR_RENDA_VARIAVEL_RULESETS.find((ruleSet) => ruleSet.id === month.ruleSetId)
      ?.swingExemptionSalesLimitCents ?? 0;
  const minimumCents =
    BR_RENDA_VARIAVEL_RULESETS.find((ruleSet) => ruleSet.id === month.ruleSetId)
      ?.minimumDarfCents ?? 0;
  const carriedIn = month.taxWithCarryCents - month.swing.taxCents - month.dayTrade.taxCents;
  const lines = [
    ...categoryLines(month.swing, label, limitCents),
    ...categoryLines(month.dayTrade, label, limitCents),
    ...(carriedIn > 0
      ? [{ label: 'Imposto trazido de meses anteriores', value: formatBRL(carriedIn) }]
      : []),
  ];
  const sourceIds = [...new Set(month.steps.flatMap((step) => step.sourceIds))];
  return {
    month: month.month,
    lines,
    totalLabel: 'IR devido',
    totalCents: month.darfDueCents,
    totalNote:
      month.darfDueCents === 0 && month.taxCarriedForwardCents > 0
        ? `Abaixo de ${formatBRL(minimumCents)}: fica para somar no mês seguinte`
        : undefined,
    sources: sourceIds.flatMap((id) => {
      const source = SOURCES.get(id);
      return source ? [source] : [];
    }),
  };
}

/**
 * Mês explicado no início: o do próximo DARF em aberto; sem ele, o último mês com DARF; sem
 * DARF, o último mês com vendas.
 */
export function receiptMonth(
  months: readonly MonthlyResult[],
  nextDarfMonth: string | null,
): MonthlyResult | null {
  const byMonth = (target: string) => months.find((month) => month.month === target) ?? null;
  if (nextDarfMonth !== null) {
    const found = byMonth(nextDarfMonth);
    if (found) return found;
  }
  const reversed = [...months].reverse();
  return (
    reversed.find((month) => month.darfDueCents > 0) ??
    reversed.find((month) => month.swing.salesTotalCents + month.dayTrade.salesTotalCents > 0) ??
    null
  );
}

/** "Lei nº 11.033/2004 — isenção…" → "Lei nº 11.033/2004". */
export function shortSourceTitle(title: string): string {
  return title.split(' — ')[0] ?? title;
}
