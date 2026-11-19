import { describe, expect, it } from 'vitest';
import { apportion, applyRate, formatBRL, formatRate, roundHalfUp, toCents } from '../src/money';

describe('roundHalfUp', () => {
  it.each([
    [0, 0],
    [1.4, 1],
    [1.5, 2],
    [2.5, 3],
    [-1.5, -2],
    [-1.4, -1],
  ])('roundHalfUp(%d) = %d', (input, expected) => {
    expect(roundHalfUp(input)).toBe(expected);
  });
});

describe('toCents', () => {
  it.each([
    [0, 0],
    [0.1 + 0.2, 30],
    [32.5, 3250],
    [19.999, 2000],
    [1.005, 101],
  ])('toCents(%d) = %d', (input, expected) => {
    expect(toCents(input)).toBe(expected);
  });
});

describe('applyRate', () => {
  it.each([
    { amount: 100_000, bps: 1500, expected: 15_000 },
    { amount: 1, bps: 1500, expected: 0 },
    { amount: 4, bps: 1500, expected: 1 },
    { amount: 10, bps: 2000, expected: 2 },
    { amount: 0, bps: 2000, expected: 0 },
  ])('$amount × $bps bps = $expected', ({ amount, bps, expected }) => {
    expect(applyRate(amount, bps)).toBe(expected);
  });
});

describe('apportion', () => {
  it.each([
    { total: 3001, part: 1, whole: 3, expected: 1000 },
    { total: 3002, part: 1, whole: 3, expected: 1001 },
    { total: 3001, part: 3, whole: 3, expected: 3001 },
    { total: 500, part: 0, whole: 0, expected: 0 },
  ])('apportion($total, $part/$whole) = $expected', ({ total, part, whole, expected }) => {
    expect(apportion(total, part, whole)).toBe(expected);
  });
});

describe('formatação', () => {
  it('formata reais no padrão brasileiro', () => {
    expect(formatBRL(123_456)).toMatch(/R\$\s1\.234,56/);
  });

  it('formata alíquota em pontos-base', () => {
    expect(formatRate(1500)).toBe('15%');
    expect(formatRate(2000)).toBe('20%');
  });
});
