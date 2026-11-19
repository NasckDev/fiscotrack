import { describe, expect, it } from 'vitest';
import {
  applyOperation,
  averagePriceCents,
  positionKey,
  type PositionBook,
} from '../src/positions';
import type { Operation } from '../src/types';
import { buy, sell } from './helpers';

function run(operations: readonly Operation[]): PositionBook {
  return operations.reduce<PositionBook>((book, operation) => {
    const outcome = applyOperation(book, operation);
    if (!outcome.ok) throw new Error(outcome.reason);
    return outcome.book;
  }, new Map());
}

describe('preço médio', () => {
  it.each([
    {
      name: 'uma compra sem custos',
      operations: [buy({ quantity: 100, unitPriceCents: 1000 })],
      quantity: 100,
      totalCost: 100_000,
    },
    {
      name: 'duas compras com preços diferentes',
      operations: [
        buy({ quantity: 100, unitPriceCents: 1000 }),
        buy({ quantity: 100, unitPriceCents: 2000 }),
      ],
      quantity: 200,
      totalCost: 300_000,
    },
    {
      name: 'custos de compra entram no custo de aquisição',
      operations: [buy({ quantity: 10, unitPriceCents: 1000, feesCents: 500 })],
      quantity: 10,
      totalCost: 10_500,
    },
    {
      name: 'venda parcial preserva o preço médio',
      operations: [
        buy({ quantity: 3, unitPriceCents: 1000, feesCents: 1 }),
        sell({ quantity: 1, unitPriceCents: 1000 }),
      ],
      quantity: 2,
      totalCost: 2001,
    },
  ])('$name', ({ operations, quantity, totalCost }) => {
    const position = run(operations).get(positionKey('PETR4', 'SWING'));
    expect(position?.quantity).toBe(quantity);
    expect(position?.totalCostCents).toBe(totalCost);
  });

  it('remove a posição quando zerada', () => {
    const book = run([buy({ quantity: 5 }), sell({ quantity: 5 })]);
    expect(book.size).toBe(0);
  });

  it('separa posições de day trade e operações comuns', () => {
    const book = run([buy({ quantity: 5 }), buy({ quantity: 7, category: 'DAY_TRADE' })]);
    expect(book.get(positionKey('PETR4', 'SWING'))?.quantity).toBe(5);
    expect(book.get(positionKey('PETR4', 'DAY_TRADE'))?.quantity).toBe(7);
  });

  it('calcula preço médio unitário com fração de centavo', () => {
    expect(
      averagePriceCents({ ticker: 'X', category: 'SWING', quantity: 3, totalCostCents: 1000 }),
    ).toBeCloseTo(333.333, 3);
    expect(
      averagePriceCents({ ticker: 'X', category: 'SWING', quantity: 0, totalCostCents: 0 }),
    ).toBe(0);
  });
});

describe('venda', () => {
  it('não muta o livro original', () => {
    const original = run([buy({ quantity: 10 })]);
    const outcome = applyOperation(original, sell({ quantity: 4 }));
    expect(outcome.ok).toBe(true);
    expect(original.get(positionKey('PETR4', 'SWING'))?.quantity).toBe(10);
  });

  it('rejeita venda maior que a posição', () => {
    const outcome = applyOperation(new Map(), sell({ quantity: 1 }));
    expect(outcome.ok).toBe(false);
  });

  it('calcula resultado líquido de custos', () => {
    const book = run([buy({ quantity: 100, unitPriceCents: 1000, feesCents: 500 })]);
    const outcome = applyOperation(
      book,
      sell({ quantity: 100, unitPriceCents: 1100, feesCents: 500 }),
    );
    expect(outcome.ok && outcome.sale).toEqual({
      grossSaleCents: 110_000,
      netProceedsCents: 109_500,
      costBasisCents: 100_500,
      resultCents: 9000,
    });
  });
});
