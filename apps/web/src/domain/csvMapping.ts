import type { Operation } from '@fiscotrack/engine';
import {
  CSV_COLUMNS,
  csvRowSchema,
  rowToOperation,
  type ImportLineError,
  type ImportResult,
} from './csv';

export type ColumnKey = (typeof CSV_COLUMNS)[number];

/** Índice da coluna do arquivo que alimenta cada campo (null = não informado). */
export type ColumnMapping = Readonly<Record<ColumnKey, number | null>>;

export interface CsvRow {
  /** Linha onde o registro começa no arquivo (1 = cabeçalho). */
  readonly line: number;
  readonly cells: readonly string[];
  /** Texto original do registro, para corrigir ali mesmo. */
  readonly raw: string;
}

export interface CsvTable {
  readonly headers: readonly string[];
  readonly rows: readonly CsvRow[];
  readonly separator: string;
}

/** Limites da importação, para o app nunca travar com um arquivo gigante. */
export const MAX_IMPORT_ROWS = 5000;
export const MAX_IMPORT_BYTES = 2_000_000;

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

const BOM = String.fromCharCode(0xfeff);

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** Separador mais frequente (fora de aspas) na primeira linha. */
function detectSeparator(text: string): string {
  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
  let inQuotes = false;
  for (const char of text) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (char === '\n' || char === '\r')) break;
    else if (!inQuotes && char in counts) counts[char] = (counts[char] ?? 0) + 1;
  }
  const best = (Object.entries(counts) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ';';
}

/** Leitor de CSV no padrão RFC 4180: aspas, aspas duplas escapadas e quebra de linha em campo. */
export function parseCsvRecords(text: string, separator: string): readonly CsvRow[] {
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let startLine = 1;
  let startIndex = 0;

  const endRecord = (endIndex: number) => {
    cells.push(field);
    const raw = text.slice(startIndex, endIndex);
    if (cells.some((cell) => cell.trim() !== '')) rows.push({ line: startLine, cells, raw });
    cells = [];
    field = '';
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (inQuotes) {
      if (char === '"' && text.charAt(index + 1) === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        if (char === '\n') line += 1;
        field += char;
      }
    } else if (char === '"' && field === '') {
      inQuotes = true;
    } else if (char === separator) {
      cells.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      endRecord(index);
      if (char === '\r' && text.charAt(index + 1) === '\n') index += 1;
      line += 1;
      startLine = line;
      startIndex = index + 1;
    } else {
      field += char;
    }
  }
  if (startIndex < text.length) endRecord(text.length);
  return rows;
}

/** Lê o CSV como tabela, detectando o separador e preservando o número da linha. */
export function readCsvTable(text: string): CsvTable {
  const clean = text.startsWith(BOM) ? text.slice(1) : text;
  const separator = detectSeparator(clean);
  const [header, ...rows] = parseCsvRecords(clean, separator);
  return {
    headers: (header?.cells ?? []).map((cell) => cell.trim()),
    rows,
    separator,
  };
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

/** Hash de 53 bits (cyrb53): barato e estável, suficiente para ids determinísticos. */
function hashText(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export interface ApplyOptions {
  /** Linhas corrigidas pelo usuário (número da linha → texto do registro). */
  readonly edits?: Readonly<Record<number, string>>;
  /** Base da sequência de criação; a linha i recebe `seqBase + i`. */
  readonly seqBase?: number;
}

function cellsOf(row: CsvRow, table: CsvTable, edits: ApplyOptions['edits']): readonly string[] {
  const edited = edits?.[row.line];
  if (edited === undefined) return row.cells;
  return parseCsvRecords(edited, table.separator)[0]?.cells ?? [];
}

/**
 * Converte as linhas em operações usando o mapeamento. Linhas inválidas viram erros por linha
 * (com o texto original). O id vem de um hash do conteúdo: importar o mesmo arquivo de novo
 * atualiza as mesmas operações em vez de duplicá-las.
 */
export function applyMapping(
  table: CsvTable,
  mapping: ColumnMapping,
  options: ApplyOptions = {},
): ImportResult {
  const operations: Operation[] = [];
  const errors: ImportLineError[] = [];
  const occurrences = new Map<string, number>();
  const seqBase = options.seqBase ?? Date.now() * 1000;

  table.rows.forEach((row, position) => {
    const cells = cellsOf(row, table, options.edits);
    const tipo = cellFor(cells, mapping.tipo, '').toLowerCase();
    const record = {
      data: cellFor(cells, mapping.data, ''),
      ticker: cellFor(cells, mapping.ticker, ''),
      tipo: SIDE_ALIASES[tipo] ?? tipo,
      quantidade: cellFor(cells, mapping.quantidade, ''),
      preco: cellFor(cells, mapping.preco, ''),
      taxas: cellFor(cells, mapping.taxas, '0') || '0',
      modalidade: cellFor(cells, mapping.modalidade, 'comum') || 'comum',
    };
    const parsed = csvRowSchema.safeParse(record);
    if (!parsed.success) {
      const messages = [...new Set(parsed.error.issues.map((issue) => issue.message))];
      errors.push({ line: row.line, messages, raw: options.edits?.[row.line] ?? row.raw });
      return;
    }
    const draft = rowToOperation(parsed.data, 'pendente', seqBase + position);
    const key = [
      draft.date,
      draft.ticker,
      draft.side,
      draft.quantity,
      draft.unitPriceCents,
      draft.feesCents,
      draft.category,
    ].join('|');
    const count = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, count);
    operations.push({ ...draft, id: `csv-${hashText(key)}-${count}` });
  });
  return { operations, errors };
}

/** Chave que identifica "a mesma operação" para o aviso de duplicatas. */
function duplicateKey(operation: Operation): string {
  return [
    operation.date,
    operation.ticker,
    operation.side,
    operation.quantity,
    operation.unitPriceCents,
  ].join('|');
}

/** Ids das operações novas que repetem (data, ativo, lado, quantidade e preço) uma já salva. */
export function findDuplicates(
  incoming: readonly Operation[],
  existing: readonly Operation[],
): ReadonlySet<string> {
  const known = new Set(existing.map(duplicateKey));
  return new Set(
    incoming
      .filter((operation) => known.has(duplicateKey(operation)))
      .map((operation) => operation.id),
  );
}

/** Leitura simples: o cabeçalho precisa trazer exatamente os nomes das 7 colunas padrão. */
export function parseOperationsCsv(text: string, options: ApplyOptions = {}): ImportResult {
  const table = readCsvTable(text);
  const header = table.headers.map((cell) => cell.toLowerCase());
  const missing = CSV_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return {
      operations: [],
      errors: [{ line: 1, messages: [`Colunas ausentes no cabeçalho: ${missing.join(', ')}.`] }],
    };
  }
  const mapping = Object.fromEntries(
    CSV_COLUMNS.map((column) => [column, header.indexOf(column)]),
  ) as ColumnMapping;
  return applyMapping(table, mapping, options);
}
