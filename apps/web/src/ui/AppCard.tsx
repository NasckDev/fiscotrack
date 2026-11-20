import { Skeleton, theme } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { useAppColors } from './theme/AppThemeProvider';

export type AppCardTone = 'default' | 'subtle' | 'hero';

interface AppCardProps {
  readonly children?: ReactNode;
  readonly title?: ReactNode;
  readonly extra?: ReactNode;
  readonly loading?: boolean;
  readonly tone?: AppCardTone;
  /** Ocupa a altura da linha da grade. */
  readonly fullHeight?: boolean;
  readonly padding?: 'none' | 'md' | 'lg';
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly role?: string;
}

/**
 * Cartão do tema. Não usa o `Card` do Ant Design: ele puxa o componente de abas inteiro para o
 * pacote inicial, e aqui só precisamos de moldura, título e ações.
 */
export function AppCard({
  tone = 'default',
  fullHeight = false,
  padding = 'md',
  title,
  extra,
  loading = false,
  children,
  ...aria
}: AppCardProps) {
  const colors = useAppColors();
  const { token } = theme.useToken();
  const toneStyle: CSSProperties =
    tone === 'hero'
      ? {
          background: `linear-gradient(135deg, ${colors.heroFrom}, ${colors.heroTo})`,
          color: colors.heroText,
          border: '1px solid transparent',
        }
      : {
          background: tone === 'subtle' ? colors.bgSubtle : colors.bgContainer,
          color: colors.text,
          border: `1px solid ${colors.borderSoft}`,
        };
  const bodyPadding = { none: 0, md: token.padding, lg: token.paddingLG }[padding];
  const hasHeader = title !== undefined || extra !== undefined;

  return (
    <div
      {...aria}
      style={{
        ...toneStyle,
        borderRadius: token.borderRadiusLG,
        boxShadow: tone === 'hero' ? 'none' : token.boxShadowTertiary,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...(fullHeight ? { height: '100%' } : {}),
      }}
    >
      {hasHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: `${token.paddingSM}px ${bodyPadding || token.padding}px`,
            borderBottom: `1px solid ${colors.borderSoft}`,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <div>{title}</div>
          <div>{extra}</div>
        </div>
      )}
      <div style={{ padding: bodyPadding, flex: 1, minWidth: 0 }}>
        {loading ? <Skeleton active paragraph={{ rows: 2 }} /> : children}
      </div>
    </div>
  );
}
