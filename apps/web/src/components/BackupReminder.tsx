import { useState } from 'react';
import { Link } from 'react-router';
import { dismissBackupReminder, shouldRemindBackup } from '../state/backupMemory';
import { useOperations } from '../state/OperationsContext';
import { EXAMPLE_ID_PREFIX } from '../state/useExampleLoader';
import { Icon } from './Icon';

/** Lembrete discreto: os dados só existem neste navegador, então um backup protege contra perdas. */
export function BackupReminder() {
  const { operations } = useOperations();
  const [isVisible, setIsVisible] = useState(shouldRemindBackup);
  // Só dados de exemplo (fictícios) não precisam de backup.
  const hasOwnData = operations.some((operation) => !operation.id.startsWith(EXAMPLE_ID_PREFIX));
  if (!isVisible || !hasOwnData) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line-soft bg-card px-4 py-2.5 text-sm">
      <Icon name="shield" size={18} className="flex-none text-accent" />
      <p className="min-w-0 flex-1">
        Seus dados ficam só neste navegador.{' '}
        <Link to="/config" className="link">
          Faça um backup
        </Link>{' '}
        para não perdê-los.
      </p>
      <button
        type="button"
        className="icon-btn"
        aria-label="Dispensar lembrete de backup"
        onClick={() => {
          dismissBackupReminder();
          setIsVisible(false);
        }}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
