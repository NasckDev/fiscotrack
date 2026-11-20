import { useState } from 'react';
import { dismissBackupReminder, shouldRemindBackup } from '../state/backupMemory';
import { useOperations } from '../state/OperationsContext';
import { EXAMPLE_ID_PREFIX } from '../state/useExampleLoader';
import { AppAlert, AppButton } from '../ui';

/** Lembrete discreto: os dados só existem neste navegador, então um backup protege contra perdas. */
export function BackupReminder() {
  const { operations } = useOperations();
  const [isVisible, setIsVisible] = useState(shouldRemindBackup);
  // Só dados de exemplo (fictícios) não precisam de backup.
  const hasOwnData = operations.some((operation) => !operation.id.startsWith(EXAMPLE_ID_PREFIX));
  if (!isVisible || !hasOwnData) return null;
  return (
    <AppAlert
      tone="info"
      title="Seus dados ficam só neste navegador. Faça um backup para não perdê-los."
      closable
      onClose={() => {
        dismissBackupReminder();
        setIsVisible(false);
      }}
      action={
        <AppButton size="sm" to="/config">
          Fazer backup
        </AppButton>
      }
    />
  );
}
