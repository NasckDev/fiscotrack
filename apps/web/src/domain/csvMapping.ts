import { CSV_COLUMNS, csvRowSchema, rowToOperation, type ImportResult } from './csv';

export type ColumnKey = (typeof CSV_COLUMNS)[number];

/** Índice da coluna do arquivo que alimenta cada campo (null = não informado). */
export type ColumnMapping = Readonly<Record<ColumnKey, number | null>>;

export interface CsvTable {
  readonly headers: readonly string[];
  readonly rows: readonly { readonly line: number; readonly cells: readonly string[] }[];
}

export const REQUIRED_COLUMNS: readonly ColumnKey[] = [
  'data',
  'ticker',
  'tipo',
  'quantidade',
  'preco',
];

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  data: 'Data',
  ticker: 'Ativo (ticker)',
  tipo: 'Compra ou venda',
  quantidade: 'Quantidade',
  preco: 'Preço unitário',
  taxas: 'Custos (opcional)',
  modalidade: 'Modalidade (opcional)',
};

const ALIASES: Record<ColumnKey, readonly string[]> = {
  data: ['data', 'date', 'dt', 'data operacao', 'data da operacao'],
  ticker: ['ticker', 'ativo', 'papel', 'codigo', 'symbol', 'codigo de negociacao'],
  tipo: ['tipo', 'operacao', 'c/v', 'cv', 'side', 'natureza', 'compra/venda'],
  quantidade: ['quantidade', 'qtd', 'qtde', 'quantity', 'qty'],
  preco: ['preco', 'preco unitario', 'valor unitario', 'price', 'preco medio'],
  taxas: ['taxas', 'custos', 'corretagem', 'fees', 'emolumentos'],
  modalidade: ['modalidade', 'categoria', 'tipo de operacao'],
};

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** Lê o CSV como tabela (separador `;` ou `,`), preservando o número da linha no arquivo. */
export function readCsvTable(text: string): CsvTable {
  const lines = stripBom(text).split(/\r?\n/);
  const headerLine = lines[0] ?? '';
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map((cell) => cell.trim());
  const rows = lines
    .slice(1)
    .map((raw, index) => ({ line: index + 2, cells: raw.split(separator), raw }))
    .filter((row) => row.raw.trim() !== '')
    .map(({ line, cells }) => ({ line, cells }));
  return { headers, rows };
}

/** Sugere a coluna de cada campo pelo nome do cabeçalho (sem acento e sem diferenciar caixa). */
export function suggestMapping(headers: readonly string[]): ColumnMapping {
  const normalized = headers.map(normalize);
  const taken = new Set<number>();
  const entries = CSV_COLUMNS.map((key) => {
    const index = normalized.findIndex(
      (header, position) => !taken.has(position) && ALIASES[key].includes(header),
    );
    if (index >= 0) taken.add(index);
    return [key, index >= 0 ? index : null] as const;
  });
  return Object.fromEntries(entries) as ColumnMapping;
}

export function missingRequired(mapping: ColumnMapping): readonly ColumnKey[] {
  return REQUIRED_COLUMNS.filter((key) => mapping[key] === null);
}

const SIDE_ALIASES: Record<string, string> = {
  c: 'compra',
  v: 'venda',
  buy: 'compra',
  sell: 'venda',
};

function cellFor(cells: readonly string[], index: number | null, fallback: string): string {
  if (index === null) return fallback;
  return (cells[index] ?? '').trim();
}

/** Converte as linhas em operações usando o mapeamento; linhas inválidas viram erros por linha. */
export function applyMapping(
  table: CsvTable,
  mapping: ColumnMapping,
  makeId: (line: number) => string,
): ImportResult {
  return table.rows.reduce<ImportResult>(
    (result, row) => {
      const tipo = cellFor(row.cells, mapping.tipo, '').toLowerCase();
      const record = {
        data: cellFor(row.cells, mapping.data, ''),
        ticker: cellFor(row.cells, mapping.ticker, ''),
        tipo: SIDE_ALIASES[tipo] ?? tipo,
        quantidade: cellFor(row.cells, mapping.quantidade, ''),
        preco: cellFor(row.cells, mapping.preco, ''),
        taxas: cellFor(row.cells, mapping.taxas, '0') || '0',
        modalidade: cellFor(row.cells, mapping.modalidade, 'comum') || 'comum',
      };
      const parsed = csvRowSchema.safeParse(record);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((issue) => issue.message);
        return { ...result, errors: [...result.errors, { line: row.line, messages }] };
      }
      const operation = rowToOperation(parsed.data, makeId(row.line));
      return { ...result, operations: [...result.operations, operation] };
    },
    { operations: [], errors: [] },
  );
}

const BOM = String.fromCharCode(0xfeff);

function stripBom(text: string): string {
  return text.startsWith(BOM) ? text.slice(1) : text;
}
