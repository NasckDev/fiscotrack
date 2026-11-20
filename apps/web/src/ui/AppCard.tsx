import { Card, theme } from 'antd';
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

export function AppCard({
  tone = 'default',
  fullHeight = false,
  padding = 'md',
  ...props
}: AppCardProps) {
  const colors = useAppColors();
  const { token } = theme.useToken();
  const toneStyle: CSSProperties =
    tone === 'hero'
      ? {
          background: `linear-gradient(135deg, ${colors.heroFrom}, ${colors.heroTo})`,
          color: colors.heroText,
          borderColor: 'transparent',
        }
      : tone === 'subtle'
        ? { background: colors.bgSubtle }
        : {};
  const paddingValue = { none: 0, md: token.padding, lg: token.paddingLG }[padding];
  return (
    <Card
      {...props}
      variant={tone === 'hero' ? 'borderless' : 'outlined'}
      style={{ ...toneStyle, ...(fullHeight ? { height: '100%', width: '100%' } : {}) }}
      styles={{ body: { padding: paddingValue }, header: { minHeight: 0 } }}
    />
  );
}
