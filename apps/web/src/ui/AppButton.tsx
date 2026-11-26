import { Button } from 'antd';
import type { MouseEventHandler, ReactNode } from 'react';
import { useHref, useNavigate } from 'react-router';
import { AppIcon, type AppIconName } from './AppIcon';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'dashed';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  readonly children?: ReactNode;
  readonly variant?: AppButtonVariant;
  readonly size?: AppButtonSize;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  /** Nome de um ícone do tema ou um elemento. */
  readonly icon?: AppIconName | ReactNode;
  readonly danger?: boolean;
  /** Ocupa toda a largura. */
  readonly block?: boolean;
  readonly htmlType?: 'button' | 'submit' | 'reset';
  /** Id do formulário que o botão envia quando fica fora dele (rodapé de gaveta ou modal). */
  readonly form?: string;
  readonly onClick?: MouseEventHandler<HTMLElement>;
  /** Rota interna: o botão vira um link (HashRouter). */
  readonly to?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-pressed'?: boolean;
  readonly 'aria-haspopup'?: 'dialog' | 'menu' | boolean;
  readonly autoFocus?: boolean;
}

const TYPES = {
  primary: 'primary',
  secondary: 'default',
  ghost: 'text',
  link: 'link',
  dashed: 'dashed',
} as const;

const SIZES = { sm: 'small', md: 'middle', lg: 'large' } as const;

export function renderIcon(icon: AppButtonProps['icon']): ReactNode {
  if (typeof icon === 'string') return <AppIcon name={icon as AppIconName} />;
  return icon;
}

function BaseButton({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  href,
  ...rest
}: AppButtonProps & { readonly href?: string }) {
  return (
    <Button {...rest} href={href} type={TYPES[variant]} size={SIZES[size]} icon={renderIcon(icon)}>
      {children}
    </Button>
  );
}

function RouterButton({ to, onClick, ...rest }: AppButtonProps & { readonly to: string }) {
  const navigate = useNavigate();
  const href = useHref(to);
  return (
    <BaseButton
      {...rest}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || rest.disabled) return;
        event.preventDefault();
        void navigate(to);
      }}
    />
  );
}

/** Botão do tema. Com `to`, navega pela rota interna e mantém a semântica de link. */
export function AppButton({ to, ...props }: AppButtonProps) {
  if (to !== undefined) return <RouterButton {...props} to={to} />;
  return <BaseButton {...props} />;
}
