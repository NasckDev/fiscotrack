import { Skeleton } from 'antd';
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
  readonly id?: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly role?: string;
}

/** Respiro interno: menor no celular (320 px) para o conteúdo não espremer. */
const PADDING = {
  none: 0,
  md: 'clamp(16px, 4vw, 24px)',
  lg: 'clamp(18px, 4.5vw, 28px)',
} as const;
const SUBTLE_PADDING = 'clamp(14px, 4vw, 18px)';

/**
 * Cartão da identidade "livro-caixa": raio de 28 px, sem sombra, superfície lisa sobre o fundo.
 * O tom `hero` (verde-floresta) é reservado ao número que pede ação; `subtle` agrupa dentro de
 * outro cartão. Não usa o `Card` do Ant Design: ele puxa as abas inteiras para o pacote inicial.
 */
export function AppCard({
  tone = 'default',
  fullHeight = false,
  padding = 'md',
  title,
  extra,
  loading = false,
  className,
  children,
  ...aria
}: AppCardProps) {
  const colors = useAppColors();
  const toneStyle: CSSProperties = {
    hero: {
      background: colors.hero,
      color: colors.heroText,
      border: '1px solid var(--ft-hero-border)',
      borderRadius: 'var(--ft-radius-card)',
    },
    subtle: {
      background: colors.bgSubtle,
      color: colors.text,
      border: '1px solid transparent',
      borderRadius: 20,
    },
    default: {
      background: colors.bgContainer,
      color: colors.text,
      border: '1px solid transparent',
      borderRadius: 'var(--ft-radius-card)',
    },
  }[tone];
  const bodyPadding = tone === 'subtle' && padding !== 'none' ? SUBTLE_PADDING : PADDING[padding];
  const hasHeader = title !== undefined || extra !== undefined;
  const classes = [tone === 'hero' ? 'ft-on-hero' : '', className ?? ''].join(' ').trim();

  return (
    <div
      {...aria}
      className={classes || undefined}
      style={{
        ...toneStyle,
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        // Sem respiro interno (tabelas), o conteúdo segue a curva do cartão.
        ...(padding === 'none' ? { overflow: 'hidden' } : {}),
        ...(fullHeight ? { height: '100%' } : {}),
      }}
    >
      {hasHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: `${PADDING.lg} ${PADDING.lg} 0`,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.01em',
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
