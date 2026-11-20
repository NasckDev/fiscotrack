import {
  applyOperation,
  averagePriceCents,
  type Operation,
  type Position,
} from '@fiscotrack/engine';

export interface HoldingPoint {
  readonly date: string;
  readonly quantity: number;
  /** Preço médio após a operação, em centavos. */
  readonly avgPriceCents: number;
}

export interface Holding {
  readonly ticker: string;
  /** Quantidade em carteira (operações comuns). Zero quando a posição foi encerrada. */
  readonly quantity: number;
  readonly totalCostCents: number;
  readonly avgPriceCents: number;
  /** Resultado realizado em vendas deste ativo, líquido de custos. */
  readonly realizedCents: number;
  readonly operations: readonly Operation[];
  readonly history: readonly HoldingPoint[];
}

function byDate(a: Operation, b: Operation): number {
  return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
}

/**
 * Reconstrói a carteira a partir das operações, usando as mesmas funções do motor de cálculo.
 * Operações inconsistentes (venda sem posição) são ignoradas aqui e aparecem no relatório mensal.
 */
export function buildPortfolio(operations: readonly Operation[]): readonly Holding[] {
  const sorted = [...operations].sort(byDate);
  const realized = new Map<string, number>();
  const history = new Map<string, HoldingPoint[]>();
  let book = new Map<string, Position>();

  for (const operation of sorted) {
    const outcome = applyOperation(book, operation);
    if (!outcome.ok) continue;
    book = new Map(outcome.book);
    if (outcome.sale) {
      realized.set(
        operation.ticker,
        (realized.get(operation.ticker) ?? 0) + outcome.sale.resultCents,
      );
    }
    if (operation.category === 'SWING') {
      const position = book.get(`SWING:${operation.ticker}`);
      const point: HoldingPoint = {
        date: operation.date,
        quantity: position?.quantity ?? 0,
        avgPriceCents: position ? averagePriceCents(position) : 0,
      };
      history.set(operation.ticker, [...(history.get(operation.ticker) ?? []), point]);
    }
  }

  const tickers = [...new Set(sorted.map((operation) => operation.ticker))].sort();
  return tickers.map((ticker) => {
    const position = book.get(`SWING:${ticker}`);
    return {
      ticker,
      quantity: position?.quantity ?? 0,
      totalCostCents: position?.totalCostCents ?? 0,
      avgPriceCents: position ? averagePriceCents(position) : 0,
      realizedCents: realized.get(ticker) ?? 0,
      operations: sorted.filter((operation) => operation.ticker === ticker),
      history: history.get(ticker) ?? [],
    };
  });
}

/** Patrimônio investido ao custo de aquisição (o app não tem cotação de mercado). */
export function totalInvestedCents(holdings: readonly Holding[]): number {
  return holdings.reduce((sum, holding) => sum + holding.totalCostCents, 0);
}
