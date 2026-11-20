import { z } from 'zod';
import { isValidIsoDate } from './csv';
import type { PaidMark } from './darf';
import { BACKUP_VERSION, type BackupData } from './backupFile';

export { BACKUP_VERSION, serializeBackup, type BackupData } from './backupFile';

const BOM = String.fromCharCode(0xfeff);

const operationSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int().nonnegative().optional(),
  date: z.string().refine(isValidIsoDate, 'data inexistente'),
  ticker: z.string().regex(/^[A-Z0-9]{4,12}$/, 'ticker inválido'),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  feesCents: z.number().int().nonnegative(),
  category: z.enum(['SWING', 'DAY_TRADE']),
});

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'mês inválido');

const paidSchema = z.union([
  monthSchema.transform((month): PaidMark => ({ month, amountCents: null })),
  z.object({ month: monthSchema, amountCents: z.number().int().nonnegative().nullable() }),
]);

const backupSchema = z.object({
  app: z.literal('fiscotrack'),
  version: z.number().int(),
  exportedAt: z.string(),
  operations: z.array(operationSchema),
  paidDarfs: z.array(paidSchema),
});

export type BackupParseResult =
  | { readonly ok: true; readonly data: BackupData }
  | { readonly ok: false; readonly message: string };

const fail = (message: string): BackupParseResult => ({ ok: false, message });

export function parseBackup(text: string): BackupParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.startsWith(BOM) ? text.slice(1) : text);
  } catch {
    return fail('O arquivo não é um JSON válido. Escolha um backup exportado pelo FiscoTrack.');
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== 'fiscotrack') {
    return fail('Este arquivo não é um backup do FiscoTrack.');
  }
  const version = (raw as { version?: unknown }).version;
  if (version !== 1 && version !== BACKUP_VERSION) {
    return fail(
      `Este backup é da versão ${String(version)}, que este app não lê (aceita 1 e ${BACKUP_VERSION}). Atualize o app ou exporte de novo.`,
    );
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first && first.path.length > 0 ? first.path.join('.') : 'arquivo';
    return fail(
      `Backup inválido em "${where}": ${first?.message ?? 'formato inesperado'}. O arquivo pode estar corrompido.`,
    );
  }
  const ids = new Set<string>();
  for (const operation of parsed.data.operations) {
    if (ids.has(operation.id)) {
      return fail(`Backup inválido: o id "${operation.id}" aparece mais de uma vez.`);
    }
    ids.add(operation.id);
  }
  return {
    ok: true,
    data: { operations: parsed.data.operations, paidDarfs: parsed.data.paidDarfs },
  };
}
