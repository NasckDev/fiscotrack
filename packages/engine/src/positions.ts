import { apportion, type Cents } from './money';
import type { Operation, Position, TradeCategory } from './types';

export type PositionBook = ReadonlyMap<string, Position>;

export interface RealizedSale {
  readonly grossSaleCents: Cents;
  readonly netProceedsCents: Cents;
  readonly costBasisCents: Cents;
  readonly resultCents: Cents;
}

export type ApplyOutcome =
  | { readonly ok: true; readonly book: PositionBook; readonly sale: RealizedSale | null }
  | { readonly ok: false; readonly reason: string };

export function positionKey(ticker: string, category: TradeCategory): string {
  return `${category}:${ticker}`;
}

function emptyPosition(ticker: string, category: TradeCategory): Position {
  return { ticker, category, quantity: 0, totalCostCents: 0 };
}

function withPosition(book: PositionBook, position: Position): PositionBook {
  const next = new Map(book);
  const key = positionKey(position.ticker, position.category);
  if (position.quantity === 0) {
    next.delete(key);
  } else {
    next.set(key, position);
  }
  return next;
}

/** Preço médio unitário em centavos (pode ter fração de centavo). */
export function averagePriceCents(position: Position): number {
  return position.quantity === 0 ? 0 : position.totalCostCents / position.quantity;
}

function applyBuy(book: PositionBook, operation: Operation): ApplyOutcome {
  const key = positionKey(operation.ticker, operation.category);
  const current = book.get(key) ?? emptyPosition(operation.ticker, operation.category);
  const purchaseCost = operation.quantity * operation.unitPriceCents + operation.feesCents;
  const updated: Position = {
    ...current,
    quantity: current.quantity + operation.quantity,
    totalCostCents: current.totalCostCents + purchaseCost,
  };
  return { ok: true, book: withPosition(book, updated), sale: null };
}

function applySell(book: PositionBook, operation: Operation): ApplyOutcome {
  const key = positionKey(operation.ticker, operation.category);
  const current = book.get(key) ?? emptyPosition(operation.ticker, operation.category);
  if (operation.quantity > current.quantity) {
    return {
      ok: false,
      reason: `Venda de ${operation.quantity} ${operation.ticker} maior que a posição disponível (${current.quantity}).`,
    };
  }
  const costBasisCents = apportion(current.totalCostCents, operation.quantity, current.quantity);
  const grossSaleCents = operation.quantity * operation.unitPriceCents;
  const netProceedsCents = grossSaleCents - operation.feesCents;
  const updated: Position = {
    ...current,
    quantity: current.quantity - operation.quantity,
    totalCostCents: current.totalCostCents - costBasisCents,
  };
  const sale: RealizedSale = {
    grossSaleCents,
    netProceedsCents,
    costBasisCents,
    resultCents: netProceedsCents - costBasisCents,
  };
  return { ok: true, book: withPosition(book, updated), sale };
}

/** Aplica uma operação ao livro de posições sem mutar o livro original. */
export function applyOperation(book: PositionBook, operation: Operation): ApplyOutcome {
  return operation.side === 'BUY' ? applyBuy(book, operation) : applySell(book, operation);
}
