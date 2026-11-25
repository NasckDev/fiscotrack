import { Modal } from 'antd';
import type { ReactNode } from 'react';

export type AppModalSize = 'sm' | 'md' | 'lg';

interface AppModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly size?: AppModalSize;
  /** Alinha o painel ao topo (paleta de comandos). */
  readonly placement?: 'center' | 'top';
  readonly loading?: boolean;
}

const WIDTHS: Record<AppModalSize, number> = { sm: 440, md: 560, lg: 720 };

/**
 * Diálogo modal: prende o foco, fecha com Esc e devolve o foco a quem abriu. O conteúdo é
 * desmontado ao fechar, então formulários começam limpos a cada abertura.
 */
export function AppModal({
  open,
  title,
  onClose,
  children,
  footer = null,
  size = 'md',
  placement = 'center',
  loading,
}: AppModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={footer}
      width={`min(${WIDTHS[size]}px, calc(100vw - 24px))`}
      centered={placement === 'center'}
      style={placement === 'top' ? { top: '12vh' } : undefined}
      destroyOnHidden
      loading={loading}
      closable={{ 'aria-label': 'Fechar' }}
      mask={{ closable: true }}
    >
      {children}
    </Modal>
  );
}
