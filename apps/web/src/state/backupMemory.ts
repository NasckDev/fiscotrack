const LAST_BACKUP_KEY = 'fiscotrack-last-backup';
const DISMISSED_KEY = 'fiscotrack-backup-reminder-dismissed';
export const BACKUP_REMINDER_DAYS = 30;
const DAY_MS = 86_400_000;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento: o lembrete simplesmente não é lembrado.
  }
}

export function getLastBackup(): Date | null {
  const value = read(LAST_BACKUP_KEY);
  return value === null ? null : new Date(value);
}

export function markBackupDone(now: Date = new Date()): void {
  write(LAST_BACKUP_KEY, now.toISOString());
}

export function dismissBackupReminder(now: Date = new Date()): void {
  write(DISMISSED_KEY, now.toISOString());
}

/** Lembra de fazer backup se nunca fez ou se passaram 30 dias, sem insistir mais de 1x por semana. */
export function shouldRemindBackup(now: Date = new Date()): boolean {
  const dismissed = read(DISMISSED_KEY);
  if (dismissed !== null && now.getTime() - new Date(dismissed).getTime() < 7 * DAY_MS)
    return false;
  const last = getLastBackup();
  return last === null || now.getTime() - last.getTime() > BACKUP_REMINDER_DAYS * DAY_MS;
}
