import { Empty } from 'antd';
import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';
import { useAppColors } from './theme/AppThemeProvider';

interface AppEmptyProps {
  readonly title: string;
  readonly description?: ReactNode;
  /** Ícone no lugar da ilustração padrão. */
  readonly icon?: AppIconName;
  /** Mostra a ilustração de gráficos da marca. */
  readonly illustration?: boolean;
  /** Elemento do título: use h1 quando o estado vazio é a página inteira. */
  readonly titleAs?: 'strong' | 'h1' | 'h2';
  /** Ações: o próximo passo para o usuário. */
  readonly children?: ReactNode;
}

function Illustration() {
  const c = useAppColors();
  return (
    <svg
      width="200"
      height="140"
      viewBox="0 0 200 140"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="100" cy="126" rx="78" ry="8" fill={c.primarySurface} />
      <rect x="22" y="16" width="156" height="104" rx="18" fill={c.primarySurface} />
      <rect
        x="36"
        y="30"
        width="128"
        height="76"
        rx="12"
        fill={c.bgContainer}
        stroke={c.borderSoft}
      />
      <rect x="48" y="42" width="44" height="6" rx="3" fill={c.borderSoft} />
      <rect x="48" y="54" width="28" height="4" rx="2" fill={c.borderSoft} />
      <rect x="52" y="76" width="14" height="20" rx="4" fill={c.gainFill} opacity="0.4" />
      <rect x="74" y="66" width="14" height="30" rx="4" fill={c.gainFill} opacity="0.65" />
      <rect x="96" y="72" width="14" height="24" rx="4" fill={c.lossFill} opacity="0.7" />
      <rect x="118" y="54" width="14" height="42" rx="4" fill={c.gainFill} />
      <circle cx="148" cy="46" r="8" fill={c.lime} />
      <path
        d="M144.5 46l2.4 2.4 4.2-4.6"
        stroke={c.onLime}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Estado vazio: o que aconteceu e qual é o próximo passo. */
export function AppEmpty({
  title,
  description,
  icon,
  illustration = false,
  titleAs = 'strong',
  children,
}: AppEmptyProps) {
  const c = useAppColors();
  const Title = titleAs;
  const image = illustration ? (
    <Illustration />
  ) : icon ? (
    <span style={{ fontSize: 40, color: c.primary }}>
      <AppIcon name={icon} />
    </span>
  ) : (
    Empty.PRESENTED_IMAGE_SIMPLE
  );
  return (
    <Empty
      image={image}
      styles={{ image: { height: 'auto' } }}
      description={
        <div>
          <Title
            style={{
              display: 'block',
              fontSize: titleAs === 'h1' ? 'clamp(28px, 4vw, 36px)' : 16,
              fontWeight: 800,
              letterSpacing: titleAs === 'h1' ? '-0.03em' : undefined,
              margin: titleAs === 'h1' ? '8px 0 6px' : 0,
              color: c.text,
            }}
          >
            {title}
          </Title>
          {description !== undefined && <span style={{ color: c.textMuted }}>{description}</span>}
        </div>
      }
    >
      {children}
    </Empty>
  );
}
