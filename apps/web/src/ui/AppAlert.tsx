import { Alert } from 'antd';
import type { ReactNode } from 'react';

interface AppAlertProps {
  readonly tone: 'success' | 'info' | 'warning' | 'error';
  readonly title: ReactNode;
  readonly children?: ReactNode;
  readonly role?: 'alert' | 'status';
  readonly closable?: boolean;
  readonly onClose?: () => void;
  readonly action?: ReactNode;
}

/** Aviso na página (resultado parcial, erro de importação, confirmações). */
export function AppAlert({
  tone,
  title,
  children,
  role,
  closable,
  onClose,
  action,
}: AppAlertProps) {
  return (
    <Alert
      showIcon
      type={tone}
      title={title}
      description={children}
      role={role}
      action={action}
      closable={
        closable ? { onClose, closeIcon: true, 'aria-label': 'Dispensar aviso' } : undefined
      }
    />
  );
}
