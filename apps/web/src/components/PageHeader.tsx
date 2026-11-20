import type { ReactNode } from 'react';
import { AppBreadcrumb, AppFlex, AppText, AppTitle, type AppMenuItem } from '../ui';

interface PageHeaderProps {
  readonly title: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  /** Trilha até aqui, sem o título atual. O início é implícito. */
  readonly trail?: readonly { readonly label: string; readonly to?: string }[];
}

export type { AppMenuItem };

/** Cabeçalho de página: trilha de navegação, título (h1), descrição e ações. */
export function PageHeader({ title, description, actions, trail }: PageHeaderProps) {
  const items = trail ? [{ label: 'Início', to: '/' }, ...trail, { label: title }] : null;
  return (
    <header style={{ marginBottom: 24 }}>
      {items && (
        <div style={{ marginBottom: 8 }}>
          <AppBreadcrumb items={items} />
        </div>
      )}
      <AppFlex justify="space-between" align="flex-end" gap="middle" wrap>
        <div style={{ minWidth: 0, flex: '1 1 320px' }}>
          <AppTitle level={1}>{title}</AppTitle>
          {description !== undefined && (
            <div style={{ marginTop: 4 }}>
              <AppText type="secondary">{description}</AppText>
            </div>
          )}
        </div>
        {actions}
      </AppFlex>
    </header>
  );
}
