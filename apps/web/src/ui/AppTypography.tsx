import { theme, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import { MONO_STYLE } from './monoStyle';
import { useAppColors } from './theme/AppThemeProvider';

type Tone = 'gain' | 'loss' | 'darf' | 'primary';

function useToneColor(tone: Tone | undefined): string | undefined {
  const colors = useAppColors();
  if (tone === undefined) return undefined;
  return { gain: colors.gain, loss: colors.loss, darf: colors.darf, primary: colors.primary }[tone];
}

interface AppTextProps {
  readonly children?: ReactNode;
  readonly type?: 'secondary' | 'success' | 'warning' | 'danger';
  readonly tone?: Tone;
  readonly strong?: boolean;
  /** Fonte mono tabular, para valores e datas. */
  readonly mono?: boolean;
  readonly block?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly ellipsis?: boolean;
  readonly id?: string;
  readonly role?: string;
  readonly 'aria-live'?: 'polite' | 'assertive';
}

const SIZES = { sm: 13, md: undefined, lg: 17 } as const;

export function AppText({ tone, mono, size = 'md', block, ...props }: AppTextProps) {
  const color = useToneColor(tone);
  const style: CSSProperties = {
    ...(mono ? MONO_STYLE : {}),
    ...(color ? { color } : {}),
    ...(size !== 'md' ? { fontSize: SIZES[size] } : {}),
    ...(block ? { display: 'block' } : {}),
  };
  return <Typography.Text {...props} style={style} />;
}

interface AppTitleProps {
  readonly children: ReactNode;
  readonly level?: 1 | 2 | 3 | 4 | 5;
  readonly id?: string;
}

export function AppTitle({ level = 2, children, id }: AppTitleProps) {
  return (
    <Typography.Title level={level} id={id} style={{ margin: 0 }}>
      {children}
    </Typography.Title>
  );
}

export function AppParagraph({
  children,
  type,
}: {
  readonly children: ReactNode;
  readonly type?: 'secondary';
}) {
  return (
    <Typography.Paragraph type={type} style={{ margin: 0 }}>
      {children}
    </Typography.Paragraph>
  );
}

interface AppLinkProps {
  readonly children: ReactNode;
  /** Rota interna (HashRouter). */
  readonly to?: string;
  /** Endereço externo: abre em outra aba. */
  readonly href?: string;
  readonly title?: string;
  readonly onClick?: () => void;
}

function InternalLink({
  to,
  children,
  onClick,
}: { readonly to: string } & Pick<AppLinkProps, 'children' | 'onClick'>) {
  const { token } = theme.useToken();
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{ color: token.colorLink, textDecoration: 'underline', textUnderlineOffset: 3 }}
    >
      {children}
    </Link>
  );
}

/** Link com o estilo do tema: rota interna com `to`, endereço externo com `href`. */
export function AppLink({ to, href, children, title, onClick }: AppLinkProps) {
  if (to !== undefined)
    return (
      <InternalLink to={to} onClick={onClick}>
        {children}
      </InternalLink>
    );
  return (
    <Typography.Link href={href} title={title} target="_blank" rel="noopener noreferrer">
      {children}
    </Typography.Link>
  );
}
