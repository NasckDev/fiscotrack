import { theme } from 'antd';
import type { ReactNode } from 'react';

interface AppListProps<T> {
  readonly items: readonly T[];
  readonly renderItem: (item: T) => ReactNode;
  readonly itemKey: (item: T) => string;
  readonly 'aria-label': string;
}

/** Lista de cards, usada no celular no lugar das tabelas. Cada item tem alvo mínimo de 44 px. */
export function AppList<T>({ items, renderItem, itemKey, ...props }: AppListProps<T>) {
  const { token } = theme.useToken();
  return (
    <ul
      {...props}
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: token.marginXS }}
    >
      {items.map((item) => (
        <li
          key={itemKey(item)}
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: `${token.paddingSM}px ${token.padding}px`,
            minHeight: 44,
          }}
        >
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}
