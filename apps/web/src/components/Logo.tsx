import { useAppColors } from '../ui';

interface LogoMarkProps {
  readonly size?: number;
  /** Cores sobre fundo escuro (Sider). */
  readonly onDark?: boolean;
}

/** Marca do FiscoTrack: linha de resultado ascendente sobre um quadrado verde-floresta. */
export function LogoMark({ size = 32, onDark = false }: LogoMarkProps) {
  const colors = useAppColors();
  const box = onDark ? colors.heroText : colors.primary;
  const stroke = onDark ? '#0e3b2e' : colors.onPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill={box} />
      <path
        d="M7 24h18"
        stroke={stroke}
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 19l6-6 4 4 8-8"
        fill="none"
        stroke={stroke}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="9" r="2.6" fill={colors.darfFill} />
    </svg>
  );
}

export function Logo({
  onDark = false,
  compact = false,
}: {
  readonly onDark?: boolean;
  readonly compact?: boolean;
}) {
  const colors = useAppColors();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoMark onDark={onDark} />
      {!compact && (
        <span
          style={{
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: onDark ? colors.siderSelectedText : colors.text,
          }}
        >
          Fisco<span style={{ color: onDark ? colors.darfFill : colors.primary }}>Track</span>
        </span>
      )}
    </span>
  );
}
