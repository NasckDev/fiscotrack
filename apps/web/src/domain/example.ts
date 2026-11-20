import type { Operation } from '@fiscotrack/engine';

type Draft = Omit<Operation, 'id' | 'date'> & { readonly monthsAgo: number; readonly day: number };

function isoFor(now: Date, monthsAgo: number, day: number): string {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthsAgo, day));
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function trade(
  monthsAgo: number,
  day: number,
  side: 'BUY' | 'SELL',
  ticker: string,
  quantity: number,
  price: number,
  fees: number,
  category: Operation['category'] = 'SWING',
): Draft {
  return {
    monthsAgo,
    day,
    side,
    ticker,
    quantity,
    unitPriceCents: Math.round(price * 100),
    feesCents: Math.round(fees * 100),
    category,
  };
}

/** Roteiro fictício: um prejuízo, um mês isento, meses tributados e um day trade. */
const SCRIPT: readonly Draft[] = [
  trade(5, 6, 'BUY', 'PETR4', 1000, 38.2, 9.9),
  trade(5, 13, 'BUY', 'ITUB4', 300, 33.5, 6.9),
  trade(4, 10, 'SELL', 'PETR4', 400, 41.8, 7.9),
  trade(4, 17, 'BUY', 'VALE3', 800, 61, 8.9),
  trade(3, 9, 'SELL', 'VALE3', 200, 57.4, 6.9),
  trade(3, 20, 'BUY', 'WEGE3', 400, 41.2, 7.5),
  trade(2, 12, 'SELL', 'PETR4', 600, 46.9, 9.9),
  trade(2, 19, 'SELL', 'ITUB4', 300, 36.1, 6.9),
  trade(2, 24, 'BUY', 'BBAS3', 500, 27.2, 3.9, 'DAY_TRADE'),
  trade(2, 24, 'SELL', 'BBAS3', 500, 27.95, 3.9, 'DAY_TRADE'),
  trade(1, 8, 'SELL', 'WEGE3', 400, 47.6, 7.5),
  trade(1, 15, 'SELL', 'VALE3', 300, 66.5, 8.9),
  trade(1, 22, 'BUY', 'MGLU3', 800, 9.8, 5.9),
  trade(1, 26, 'BUY', 'BBAS3', 200, 28.1, 3.9),
];

/** Operações de exemplo ancoradas na data atual, para o painel nunca parecer desatualizado. */
export function buildExampleOperations(now: Date = new Date()): readonly Operation[] {
  return SCRIPT.map(({ monthsAgo, day, ...rest }, index) => ({
    ...rest,
    id: `exemplo-${String(index + 1).padStart(2, '0')}`,
    date: isoFor(now, monthsAgo, day),
  }));
}
