import type { Operation } from '../src/types';

let sequence = 0;

/** Cria uma operação de teste com valores padrão legíveis. */
export function op(partial: Partial<Operation> & Pick<Operation, 'side'>): Operation {
  sequence += 1;
  return {
    id: `op-${sequence}`,
    date: '2024-01-10',
    ticker: 'PETR4',
    quantity: 100,
    unitPriceCents: 1000,
    feesCents: 0,
    category: 'SWING',
    ...partial,
  };
}

export const buy = (partial: Partial<Operation> = {}): Operation => op({ ...partial, side: 'BUY' });
export const sell = (partial: Partial<Operation> = {}): Operation =>
  op({ ...partial, side: 'SELL' });
