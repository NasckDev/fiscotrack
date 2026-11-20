import { toCents, type Operation } from '@fiscotrack/engine';
import { z } from 'zod';
import { todayIso } from './darf';
import { MAX_MONEY_REAIS, MAX_QUANTITY, parseInteger, parseMoney } from './numbers';

export interface ImportLineError {
  /** Número da linha no arquivo (1 = cabeçalho). */
  readonly line: number;
  readonly messages: readonly string[];
  /** Texto original da linha, para o usuário corrigir ali mesmo. */
  readonly raw?: string;
}

export interface ImportResult {
  readonly operations: readonly Operation[];
  readonly errors: readonly ImportLineError[];
}

export const CSV_COLUMNS = [
  'data',
  'ticker',
  'tipo',
  'quantidade',
  'preco',
  'taxas',
  'modalidade',
] as const;

const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDate(value: string): string {
  const match = BR_DATE.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

/** Data AAAA-MM-DD que existe no calendário (rejeita 31/02 e 99/99). */
export function isValidIsoDate(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(iso);
}

/** Aceita "1.234,56", "1234,56" e "1234.56"; devolve NaN quando não é um número válido. */
export function parseDecimal(raw: string): number {
  const parsed = parseMoney(raw);
  return parsed.ok ? parsed.value : Number.NaN;
}

const money = (label: string) =>
  z
    .string()
    .transform((raw, context) => {
      const parsed = parseMoney(raw);
      if (!parsed.ok) {
        context.addIssue({
          code: 'custom',
          message: label + ': digite um valor como 32,50 (use vírgula para os centavos).',
        });
        return z.NEVER;
      }
      return parsed.value;
    })
    .pipe(
      z
        .number()
        .max(MAX_MONEY_REAIS, label + ' acima do limite de R$ 10.000.000,00. Confira os zeros.'),
    );

export const csvRowSchema = z.object({
  data: z
    .string()
    .trim()
    .transform(normalizeDate)
    .superRefine((value, context) => {
      if (!isValidIsoDate(value)) {
        context.addIssue({
          code: 'custom',
          message: 'Informe a data como AAAA-MM-DD ou DD/MM/AAAA, por exemplo 15/03/2026.',
        });
      } else if (value > todayIso()) {
        context.addIssue({ code: 'custom', message: 'A data não pode ser futura.' });
      }
    }),
  ticker: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,12}$/, 'Informe o ticker, por exemplo PETR4 (4 a 12 letras ou números).'),
  tipo: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(['compra', 'venda'], { error: 'Escolha "compra" ou "venda".' })),
  quantidade: z
    .string()
    .transform((raw, context) => {
      const parsed = parseInteger(raw);
      if (!parsed.ok) {
        context.addIssue({
          code: 'custom',
          message: 'Quantidade: digite um número inteiro, como 100 ou 1.000.',
        });
        return z.NEVER;
      }
      return parsed.value;
    })
    .pipe(
      z
        .number()
        .positive('Quantidade deve ser maior que zero.')
        .max(MAX_QUANTITY, 'Quantidade acima do limite de 100.000.000. Confira os zeros.'),
    ),
  preco: money('Preço'),
  taxas: money('Custos'),
  modalidade: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(['comum', 'daytrade'], { error: 'Escolha "comum" ou "daytrade".' })),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export function rowToOperation(row: CsvRow, id: string, seq?: number): Operation {
  return {
    id,
    ...(seq === undefined ? {} : { seq }),
    date: row.data,
    ticker: row.ticker,
    side: row.tipo === 'compra' ? 'BUY' : 'SELL',
    quantity: row.quantidade,
    unitPriceCents: toCents(row.preco),
    feesCents: toCents(row.taxas),
    category: row.modalidade === 'comum' ? 'SWING' : 'DAY_TRADE',
  };
}
