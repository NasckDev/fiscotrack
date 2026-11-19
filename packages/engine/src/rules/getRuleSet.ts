import { BR_RENDA_VARIAVEL_RULESETS } from './brRendaVariavel';
import type { RuleSet } from './types';

function isWithin(ruleSet: RuleSet, isoDate: string): boolean {
  const startsBefore = ruleSet.validFrom <= isoDate;
  const endsAfter = ruleSet.validTo === null || isoDate <= ruleSet.validTo;
  return startsBefore && endsAfter;
}

/** Retorna o conjunto de regras vigente na data, ou `undefined` se não houver. */
export function getRuleSetFor(
  isoDate: string,
  ruleSets: readonly RuleSet[] = BR_RENDA_VARIAVEL_RULESETS,
): RuleSet | undefined {
  return ruleSets.find((ruleSet) => isWithin(ruleSet, isoDate));
}
