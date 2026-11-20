import { Avatar, Badge, Dropdown, Menu, Popover, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';
import { useAppColors } from './theme/AppThemeProvider';

/* ---------- Tooltip e Popover ---------- */

export function AppTooltip({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children: ReactNode;
}) {
  return <Tooltip title={title}>{children}</Tooltip>;
}

interface AppPopoverProps {
  readonly title?: ReactNode;
  readonly content: ReactNode;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly placement?: 'bottom' | 'bottomRight' | 'top';
  readonly children: ReactNode;
}

export function AppPopover({ placement = 'bottomRight', ...props }: AppPopoverProps) {
  return <Popover {...props} placement={placement} trigger="click" />;
}

/* ---------- Avatar e Badge ---------- */

export function AppAvatar({
  initials,
  label,
  size = 'md',
}: {
  readonly initials: string;
  readonly label: string;
  readonly size?: 'sm' | 'md' | 'lg';
}) {
  const colors = useAppColors();
  return (
    <span role="img" aria-label={label} style={{ display: 'inline-flex' }}>
      <Avatar
        size={{ sm: 28, md: 36, lg: 48 }[size]}
        style={{ background: colors.primarySurface, color: colors.primary, fontWeight: 700 }}
      >
        {initials}
      </Avatar>
    </span>
  );
}

export function AppBadge({
  count,
  children,
  dot,
}: {
  readonly count?: number;
  readonly dot?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <Badge count={count} dot={dot} overflowCount={99} size="small">
      {children}
    </Badge>
  );
}

/* ---------- Menu e Dropdown ---------- */

export interface AppMenuItem {
  readonly key: string;
  readonly label: ReactNode;
  readonly icon?: AppIconName;
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
  /** Linha divisória antes do item. */
  readonly dividerBefore?: boolean;
}

function toMenuItems(items: readonly AppMenuItem[]): MenuProps['items'] {
  return items.flatMap((item) => [
    ...(item.dividerBefore ? [{ type: 'divider' as const, key: `${item.key}-divider` }] : []),
    {
      key: item.key,
      label: item.label,
      icon: item.icon ? <AppIcon name={item.icon} /> : undefined,
      danger: item.danger,
      disabled: item.disabled,
    },
  ]);
}

interface AppMenuProps {
  readonly items: readonly AppMenuItem[];
  readonly selectedKey?: string;
  readonly theme?: 'light' | 'dark';
  readonly collapsed?: boolean;
  readonly 'aria-label'?: string;
}

/** Menu de navegação vertical. */
export function AppMenu({
  items,
  selectedKey,
  theme = 'light',
  collapsed = false,
  ...props
}: AppMenuProps) {
  return (
    <Menu
      {...props}
      mode="inline"
      theme={theme}
      inlineCollapsed={collapsed}
      selectedKeys={selectedKey ? [selectedKey] : []}
      items={toMenuItems(items)}
      onClick={({ key }) => items.find((item) => item.key === key)?.onSelect?.()}
      style={{ border: 0, background: 'transparent' }}
    />
  );
}

interface AppDropdownProps {
  readonly items: readonly AppMenuItem[];
  readonly children: ReactNode;
  readonly placement?: 'bottomLeft' | 'bottomRight';
}

/** Menu suspenso aberto por clique. */
export function AppDropdown({ items, children, placement = 'bottomRight' }: AppDropdownProps) {
  return (
    <Dropdown
      trigger={['click']}
      placement={placement}
      menu={{
        items: toMenuItems(items),
        onClick: ({ key }) => items.find((item) => item.key === key)?.onSelect?.(),
      }}
    >
      {children}
    </Dropdown>
  );
}
