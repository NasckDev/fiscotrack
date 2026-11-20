import { Drawer } from 'antd';
import type { ReactNode } from 'react';

interface AppDrawerProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  /** `bottom` é o padrão no celular, ao alcance do polegar. */
  readonly placement?: 'left' | 'right' | 'bottom';
  readonly size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 320, md: 420, lg: 560 } as const;

export function AppDrawer({
  open,
  title,
  onClose,
  children,
  footer,
  placement = 'right',
  size = 'md',
}: AppDrawerProps) {
  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      footer={footer}
      placement={placement}
      size={placement === 'bottom' ? 'min(88vh, 640px)' : SIZES[size]}
      destroyOnHidden
      closable={{ 'aria-label': 'Fechar' }}
    >
      {children}
    </Drawer>
  );
}
