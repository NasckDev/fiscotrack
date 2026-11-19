import { computeCategoryResult } from './category';
import { explainCategory, explainDarf } from './explain';
import type { Cents } from './money';
import { applyOperation, type PositionBook, type RealizedSale } from './positions';
import { BR_RENDA_VARIAVEL_RULESETS } from './rules/brRendaVariavel';
import { getRuleSetFor } from './rules/getRuleSet';
import type { RuleSet } from './rules/types';
import type {
  CalculationIssue,
  CategoryResult,
  MonthlyResult,
  Operation,
  Report,
  TradeCategory,
} from './types';
import { validateOperation } from './validate';

interface CategoryTotals {
  readonly salesTotalCents: Cents;
  readonly grossResultCents: Cents;
}

interface MonthAccumulator {
  readonly month: string;
  readonly ruleSet: RuleSet;
  readonly swing: CategoryTotals;
  readonly dayTrade: CategoryTotals;
}

interface LedgerState {
  readonly book: PositionBook;
  readonly months: ReadonlyMap<string, MonthAccumulator>;
  readonly issues: readonly CalculationIssue[];
}

interface CarryState {
  readonly swingLossCents: Cents;
  readonly dayTradeLossCents: Cents;
  readonly taxCarryCents: Cents;
  readonly results: readonly MonthlyResult[];
}

const ZERO_TOTALS: CategoryTotals = { salesTotalCents: 0, grossResultCents: 0 };

function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** Ordena por data mantendo a ordem de entrada dentro do mesmo dia. */
function sortByDate(operations: readonly Operation[]): readonly Operation[] {
  return operations
    .map((operation, index) => ({ operation, index }))
    .sort((a, b) => a.operation.date.localeCompare(b.operation.date) || a.index - b.index)
    .map(({ operation }) => operation);
}

function addSale(totals: CategoryTotals, sale: RealizedSale | null): CategoryTotals {
  if (sale === null) return totals;
  return {
    salesTotalCents: totals.salesTotalCents + sale.grossSaleCents,
    grossResultCents: totals.grossResultCents + sale.resultCents,
  };
}

function updateMonth(
  current: MonthAccumulator,
  category: TradeCategory,
  sale: RealizedSale | null,
): MonthAccumulator {
  return category === 'SWING'
    ? { ...current, swing: addSale(current.swing, sale) }
    : { ...current, dayTrade: addSale(current.dayTrade, sale) };
}

function withIssue(
  state: LedgerState,
  operation: Operation,
  code: CalculationIssue['code'],
  message: string,
): LedgerState {
  return { ...state, issues: [...state.issues, { code, operationId: operation.id, message }] };
}

function applyToLedger(
  state: LedgerState,
  operation: Operation,
  ruleSets: readonly RuleSet[],
): LedgerState {
  const invalid = validateOperation(operation);
  if (invalid !== null) return withIssue(state, operation, 'INVALID_OPERATION', invalid);

  const month = monthOf(operation.date);
  const ruleSet = getRuleSetFor(`${month}-01`, ruleSets);
  if (ruleSet === undefined) {
    const message = `Não há regras cadastradas para ${month}.`;
    return withIssue(state, operation, 'NO_RULESET_FOR_DATE', message);
  }

  const outcome = applyOperation(state.book, operation);
  if (!outcome.ok) return withIssue(state, operation, 'INSUFFICIENT_POSITION', outcome.reason);

  const current = state.months.get(month) ?? {
    month,
    ruleSet,
    swing: ZERO_TOTALS,
    dayTrade: ZERO_TOTALS,
  };
  const months = new Map(state.months);
  months.set(month, updateMonth(current, operation.category, outcome.sale));
  return { ...state, book: outcome.book, months };
}

function resolveDarf(taxWithCarryCents: Cents, ruleSet: RuleSet): Cents {
  return taxWithCarryCents >= ruleSet.minimumDarfCents ? taxWithCarryCents : 0;
}

function closeMonth(state: CarryState, month: MonthAccumulator): CarryState {
  const { ruleSet } = month;
  const swing: CategoryResult = computeCategoryResult({
    category: 'SWING',
    ...month.swing,
    lossBeforeCents: state.swingLossCents,
    ruleSet,
  });
  const dayTrade: CategoryResult = computeCategoryResult({
    category: 'DAY_TRADE',
    ...month.dayTrade,
    lossBeforeCents: state.dayTradeLossCents,
    ruleSet,
  });
  const taxWithCarryCents = swing.taxCents + dayTrade.taxCents + state.taxCarryCents;
  const darfDueCents = resolveDarf(taxWithCarryCents, ruleSet);
  const steps = [
    ...explainCategory(swing, ruleSet),
    ...explainCategory(dayTrade, ruleSet),
    ...explainDarf({
      taxWithCarryCents,
      carriedInCents: state.taxCarryCents,
      darfDueCents,
      ruleSet,
    }),
  ];
  const result: MonthlyResult = {
    month: month.month,
    ruleSetId: ruleSet.id,
    swing,
    dayTrade,
    taxWithCarryCents,
    darfDueCents,
    taxCarriedForwardCents: taxWithCarryCents - darfDueCents,
    steps,
  };
  return {
    swingLossCents: swing.lossAfterCents,
    dayTradeLossCents: dayTrade.lossAfterCents,
    taxCarryCents: result.taxCarriedForwardCents,
    results: [...state.results, result],
  };
}

/**
 * Calcula o relatório mensal a partir das operações.
 * Função pura: mesma entrada, mesma saída; não acessa relógio, rede nem armazenamento.
 */
export function calculateReport(
  operations: readonly Operation[],
  ruleSets: readonly RuleSet[] = BR_RENDA_VARIAVEL_RULESETS,
): Report {
  const initial: LedgerState = { book: new Map(), months: new Map(), issues: [] };
  const ledger = sortByDate(operations).reduce(
    (state, operation) => applyToLedger(state, operation, ruleSets),
    initial,
  );
  const orderedMonths = [...ledger.months.values()].sort((a, b) => a.month.localeCompare(b.month));
  const carry = orderedMonths.reduce(closeMonth, {
    swingLossCents: 0,
    dayTradeLossCents: 0,
    taxCarryCents: 0,
    results: [],
  });
  return {
    months: carry.results,
    positions: [...ledger.book.values()],
    issues: ledger.issues,
  };
}
