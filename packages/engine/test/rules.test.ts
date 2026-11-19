import { describe, expect, it } from 'vitest';
import { BR_RENDA_VARIAVEL_RULESETS } from '../src/rules/brRendaVariavel';
import { getRuleSetFor } from '../src/rules/getRuleSet';
import type { RuleSet } from '../src/rules/types';

const base = BR_RENDA_VARIAVEL_RULESETS[0] as RuleSet;

const versioned: readonly RuleSet[] = [
  { ...base, id: 'old', validFrom: '2020-01-01', validTo: '2022-12-31' },
  { ...base, id: 'new', validFrom: '2023-01-01', validTo: null, swingRateBps: 1700 },
];

describe('getRuleSetFor', () => {
  it.each([
    { date: '2019-12-31', expected: undefined },
    { date: '2020-01-01', expected: 'old' },
    { date: '2022-12-31', expected: 'old' },
    { date: '2023-01-01', expected: 'new' },
    { date: '2099-06-15', expected: 'new' },
  ])('$date → $expected', ({ date, expected }) => {
    expect(getRuleSetFor(date, versioned)?.id).toBe(expected);
  });

  it('usa as regras padrão do projeto quando nenhuma lista é informada', () => {
    expect(getRuleSetFor('2024-05-01')?.id).toBe('br-acoes-v1');
    expect(getRuleSetFor('2015-12-31')).toBeUndefined();
  });
});

describe('dados das regras', () => {
  it.each(BR_RENDA_VARIAVEL_RULESETS.map((ruleSet) => [ruleSet.id, ruleSet] as const))(
    '%s tem fontes oficiais e premissas documentadas',
    (_id, ruleSet) => {
      expect(ruleSet.sources.length).toBeGreaterThan(0);
      expect(ruleSet.assumptions.length).toBeGreaterThan(0);
      ruleSet.sources.forEach((source) => expect(source.url).toMatch(/\.gov\.br/));
    },
  );
});
