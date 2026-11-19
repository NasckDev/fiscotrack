import { applyRate, type Cents } from './money';
import type { RuleSet } from './rules/types';
import type { CategoryResult, TradeCategory } from './types';

export interface CategoryInput {
  readonly category: TradeCategory;
  readonly salesTotalCents: Cents;
  readonly grossResultCents: Cents;
  readonly lossBeforeCents: Cents;
  readonly ruleSet: RuleSet;
}

/** Mês de operações comuns com vendas dentro do limite de isenção. */
export function isExemptMonth(input: CategoryInput): boolean {
  return (
    input.category === 'SWING' &&
    input.salesTotalCents > 0 &&
    input.salesTotalCents <= input.ruleSet.swingExemptionSalesLimitCents
  );
}

function rateFor(category: TradeCategory, ruleSet: RuleSet): number {
  return category === 'SWING' ? ruleSet.swingRateBps : ruleSet.dayTradeRateBps;
}

function lossAfterNegativeResult(input: CategoryInput, exempt: boolean): Cents {
  const keepsLoss = !exempt || input.ruleSet.lossesInExemptMonthsAreCompensable;
  return keepsLoss ? input.lossBeforeCents - input.grossResultCents : input.lossBeforeCents;
}

/**
 * Apura uma categoria (comum ou day trade) em um mês:
 * isenção → acúmulo de prejuízo → compensação → base de cálculo → imposto.
 */
export function computeCategoryResult(input: CategoryInput): CategoryResult {
  const exempt = isExemptMonth(input);
  const rateBps = rateFor(input.category, input.ruleSet);
  const base = {
    category: input.category,
    salesTotalCents: input.salesTotalCents,
    grossResultCents: input.grossResultCents,
    exempt,
    lossBeforeCents: input.lossBeforeCents,
    rateBps,
  };

  if (input.grossResultCents <= 0 || exempt) {
    const lossAfterCents =
      input.grossResultCents < 0 ? lossAfterNegativeResult(input, exempt) : input.lossBeforeCents;
    return { ...base, lossCompensatedCents: 0, lossAfterCents, taxableBaseCents: 0, taxCents: 0 };
  }

  const lossCompensatedCents = Math.min(input.lossBeforeCents, input.grossResultCents);
  const taxableBaseCents = input.grossResultCents - lossCompensatedCents;
  return {
    ...base,
    lossCompensatedCents,
    lossAfterCents: input.lossBeforeCents - lossCompensatedCents,
    taxableBaseCents,
    taxCents: applyRate(taxableBaseCents, rateBps),
  };
}
