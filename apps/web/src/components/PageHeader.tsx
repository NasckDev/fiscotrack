import type { ReactNode } from 'react';
import { describeLastBackup, getLastBackup } from '../state/backupMemory';
import { AppBreadcrumb, AppFlex, AppText, useAppColors, type AppMenuItem } from '../ui';

interface PageHeaderProps {
  readonly title: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  /** Trilha até aqui, sem o título atual. O início é implícito. */
  readonly trail?: readonly { readonly label: string; readonly to?: string }[];
}

export type { AppMenuItem };

/** "Seus dados ficam neste navegador. Último backup há N dias." */
export function PrivacyNote() {
  const colors = useAppColors();
  return (
    <span style={{ fontSize: 14, color: colors.textMuted }}>
      {describeLastBackup(getLastBackup())}
    </span>
  );
}

/**
 * Cabeçalho de página: trilha, título (h1 de 44 px em 800), descrição e ações. Sem ações, mostra o
 * aviso discreto de privacidade com a data do último backup.
 */
export function PageHeader({ title, description, actions, trail }: PageHeaderProps) {
  const items =
    trail && trail.length > 0 ? [{ label: 'Início', to: '/' }, ...trail, { label: title }] : null;
  return (
    <header style={{ marginBottom: 22 }}>
      {items && (
        <div style={{ marginBottom: 10 }}>
          <AppBreadcrumb items={items} />
        </div>
      )}
      <AppFlex justify="space-between" align="flex-end" gap="middle" wrap>
        <div style={{ minWidth: 0, flex: '1 1 320px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(34px, 5vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>
          {description !== undefined && (
            <div style={{ marginTop: 8, maxWidth: 720 }}>
              <AppText type="secondary">{description}</AppText>
            </div>
          )}
        </div>
        {actions ?? <PrivacyNote />}
      </AppFlex>
    </header>
  );
}
