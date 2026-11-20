import { AppButton } from './AppButton';
import { AppFlex } from './AppLayout';
import { AppModal } from './AppModal';
import { AppParagraph } from './AppTypography';

interface AppConfirmProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  /** O rótulo diz exatamente o que vai acontecer ("Apagar tudo"). */
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly danger?: boolean;
}

/** Confirmação de ação destrutiva. O foco começa em "Cancelar". */
export function AppConfirm({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = true,
}: AppConfirmProps) {
  return (
    <AppModal open={open} title={title} onClose={onCancel} size="sm">
      <AppParagraph type="secondary">{message}</AppParagraph>
      <div style={{ marginTop: 24 }}>
        <AppFlex gap="small" justify="flex-end" wrap>
          <AppButton autoFocus onClick={onCancel}>
            Cancelar
          </AppButton>
          <AppButton variant="primary" danger={danger} onClick={onConfirm}>
            {confirmLabel}
          </AppButton>
        </AppFlex>
      </div>
    </AppModal>
  );
}
