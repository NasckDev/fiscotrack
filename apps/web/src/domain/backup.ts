import type { Operation } from '@fiscotrack/engine';
import { z } from 'zod';

const BACKUP_VERSION = 1;

const operationSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  ticker: z.string().regex(/^[A-Z0-9]{4,12}$/, 'Ticker inválido.'),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  feesCents: z.number().int().nonnegative(),
  category: z.enum(['SWING', 'DAY_TRADE']),
});

const backupSchema = z.object({
  app: z.literal('fiscotrack'),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  operations: z.array(operationSchema),
  paidDarfs: z.array(z.string().regex(/^\d{4}-\d{2}$/)),
});

export interface BackupData {
  readonly operations: readonly Operation[];
  readonly paidDarfs: readonly string[];
}

export type BackupParseResult =
  | { readonly ok: true; readonly data: BackupData }
  | { readonly ok: false; readonly message: string };

export function serializeBackup(data: BackupData, now: Date = new Date()): string {
  return JSON.stringify(
    {
      app: 'fiscotrack',
      version: BACKUP_VERSION,
      exportedAt: now.toISOString(),
      operations: data.operations,
      paidDarfs: data.paidDarfs,
    },
    null,
    2,
  );
}

export function parseBackup(text: string): BackupParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: 'O arquivo não é um JSON válido.' };
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first && first.path.length > 0 ? first.path.join('.') : 'arquivo';
    return {
      ok: false,
      message: `Este não parece um backup do FiscoTrack (problema em "${where}").`,
    };
  }
  const { operations, paidDarfs } = parsed.data;
  return { ok: true, data: { operations, paidDarfs } };
}
