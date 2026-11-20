import { describe, expect, it } from 'vitest';
import {
  formatCompactBRL,
  formatMonth,
  formatMonthShort,
  formatMonthTitle,
  plural,
} from '../src/domain/format';

describe('format', () => {
  it('formata o mês por extenso com só a primeira letra maiúscula', () => {
    expect(formatMonth('2024-01')).toBe('janeiro de 2024');
    expect(formatMonthTitle('2024-01')).toBe('Janeiro de 2024');
  });

  it('abrevia o mês como jan/24', () => {
    expect(formatMonthShort('2024-01')).toBe('jan/24');
    expect(formatMonthShort('2025-12')).toBe('dez/25');
  });

  it('formata moeda compacta para os eixos', () => {
    expect(formatCompactBRL(6000).replace(/\s/g, ' ')).toBe('R$ 6 mil');
  });

  it('faz plural de verdade', () => {
    expect(plural(1, 'operação', 'operações')).toBe('1 operação');
    expect(plural(2, 'operação', 'operações')).toBe('2 operações');
    expect(plural(0, 'operação', 'operações')).toBe('0 operações');
  });
});
