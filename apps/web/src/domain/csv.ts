import { toCents, type Operation } from '@fiscotrack/engine';
import { z } from 'zod';

export interface ImportLineError {
  /** Número da linha no arquivo (1 = cabeçalho). */
  readonly line: number;
  readonly messages: readonly string[];
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

function isRealDate(iso: string): boolean {
  const parsed = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(iso);
}

/** Aceita "1.234,56", "1234,56" e "1234.56". */
export function parseDecimal(raw: string): number {
  const trimmed = raw.trim();
  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  return normalized === '' ? Number.NaN : Number(normalized);
}

const decimal = (label: string) =>
  z
    .string()
    .transform(parseDecimal)
    .pipe(
      z
        .number({ error: `${label} não é um número.` })
        .refine(Number.isFinite, `${label} não é um número.`)
        .refine((value) => value >= 0, `${label} não pode ser negativo.`),
    );

export const csvRowSchema = z.object({
  data: z
    .string()
    .trim()
    .transform(normalizeDate)
    .refine((value) => ISO_DATE.test(value) && isRealDate(value), {
      message: 'Data inválida (use AAAA-MM-DD ou DD/MM/AAAA).',
    }),
  ticker: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,12}$/, 'Ticker inválido.'),
  tipo: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(['compra', 'venda'], { error: 'Tipo deve ser "compra" ou "venda".' })),
  quantidade: z
    .string()
    .trim()
    .transform(Number)
    .pipe(
      z
        .number({ error: 'Quantidade não é um número.' })
        .int('Quantidade deve ser inteira.')
        .positive('Quantidade deve ser maior que zero.'),
    ),
  preco: decimal('Preço'),
  taxas: decimal('Taxas'),
  modalidade: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.enum(['comum', 'daytrade'], { error: 'Modalidade deve ser "comum" ou "daytrade".' }),
    ),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export function rowToOperation(row: CsvRow, id: string): Operation {
  return {
    id,
    date: row.data,
    ticker: row.ticker,
    side: row.tipo === 'compra' ? 'BUY' : 'SELL',
    quantity: row.quantidade,
    unitPriceCents: toCents(row.preco),
    feesCents: toCents(row.taxas),
    category: row.modalidade === 'comum' ? 'SWING' : 'DAY_TRADE',
  };
}

function detectSeparator(header: string): string {
  return header.includes(';') ? ';' : ',';
}

function toRecord(header: readonly string[], cells: readonly string[]): Record<string, string> {
  return Object.fromEntries(header.map((column, index) => [column, cells[index] ?? '']));
}

function missingColumns(header: readonly string[]): readonly string[] {
  return CSV_COLUMNS.filter((column) => !header.includes(column));
}

type IdFactory = (line: number) => string;

const defaultId: IdFactory = (line) => `csv-${Date.now()}-${line}`;

/**
 * Lê um CSV de operações. Linhas inválidas não interrompem a importação:
 * são devolvidas em `errors` com o número da linha e as mensagens.
 */
export function parseOperationsCsv(text: string, makeId: IdFactory = defaultId): ImportResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const headerLine = lines[0] ?? '';
  const separator = detectSeparator(headerLine);
  const header = headerLine.split(separator).map((cell) => cell.trim().toLowerCase());
  const missing = missingColumns(header);
  if (missing.length > 0) {
    return {
      operations: [],
      errors: [{ line: 1, messages: [`Colunas ausentes no cabeçalho: ${missing.join(', ')}.`] }],
    };
  }

  return lines.slice(1).reduce<ImportResult>(
    (result, rawLine, index) => {
      const lineNumber = index + 2;
      if (rawLine.trim() === '') return result;
      const parsed = csvRowSchema.safeParse(toRecord(header, rawLine.split(separator)));
      if (!parsed.success) {
        const messages = parsed.error.issues.map((issue) => issue.message);
        return { ...result, errors: [...result.errors, { line: lineNumber, messages }] };
      }
      const operation = rowToOperation(parsed.data, makeId(lineNumber));
      return { ...result, operations: [...result.operations, operation] };
    },
    { operations: [], errors: [] },
  );
}
