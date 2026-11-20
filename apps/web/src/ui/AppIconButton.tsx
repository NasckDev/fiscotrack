import { Button, Tooltip } from 'antd';
import type { MouseEventHandler } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';

interface AppIconButtonProps {
  readonly icon: AppIconName;
  /** Rótulo acessível e dica de ferramenta (obrigatório: o botão não tem texto). */
  readonly label: string;
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly onClick?: MouseEventHandler<HTMLElement>;
  readonly variant?: 'ghost' | 'secondary' | 'primary';
  readonly 'aria-haspopup'?: 'dialog' | 'menu' | boolean;
  readonly 'aria-pressed'?: boolean;
}

const SIZES = { sm: 'small', md: 'middle', lg: 'large' } as const;
const TYPES = { ghost: 'text', secondary: 'default', primary: 'primary' } as const;

export function AppIconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  ...props
}: AppIconButtonProps) {
  return (
    <Tooltip title={label}>
      <Button
        {...props}
        aria-label={label}
        type={TYPES[variant]}
        size={SIZES[size]}
        icon={<AppIcon name={icon} />}
      />
    </Tooltip>
  );
}
