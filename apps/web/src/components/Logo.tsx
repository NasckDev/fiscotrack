import { useAppColors, useTheme } from '../ui';

interface LogoMarkProps {
  readonly size?: number;
}

/** Marca do FiscoTrack: um "F" de livro-caixa em lima, com o ponto do saldo, sobre verde-floresta. */
export function LogoMark({ size = 30 }: LogoMarkProps) {
  const colors = useAppColors();
  const isDark = useTheme() === 'dark';
  // No escuro o quadrado verde some no fundo; a marca inverte para lima com traço floresta.
  const box = isDark ? colors.lime : colors.hero;
  const ink = isDark ? colors.onLime : colors.lime;
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <rect width="30" height="30" rx="10" fill={box} />
      <path
        d="M9 20.5V9.5h9M9 15h6.5"
        stroke={ink}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="21" cy="20" r="2.2" fill={ink} />
    </svg>
  );
}

export function Logo({ compact = false }: { readonly compact?: boolean }) {
  const colors = useAppColors();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoMark />
      {!compact && (
        <span
          className="ft-logo-text"
          style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: colors.text }}
        >
          FiscoTrack
        </span>
      )}
    </span>
  );
}
