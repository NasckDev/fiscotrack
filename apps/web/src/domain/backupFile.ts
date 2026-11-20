import type { Operation } from '@fiscotrack/engine';
import type { PaidMark } from './darf';

export const BACKUP_VERSION = 2;

export interface BackupData {
  readonly operations: readonly Operation[];
  readonly paidDarfs: readonly PaidMark[];
}

/** Gera o arquivo de backup (JSON). Fica fora de `backup.ts` para não puxar o Zod para o início. */
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
