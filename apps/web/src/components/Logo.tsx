interface LogoMarkProps {
  readonly size?: number;
}

/** Marca do FiscoTrack: linha de resultado ascendente sobre um quadrado com a cor de destaque. */
export function LogoMark({ size = 32 }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--ft-color-accent)" />
      <path
        d="M7 24h18"
        stroke="var(--ft-color-text-on-accent)"
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 19l6-6 4 4 8-8"
        fill="none"
        stroke="var(--ft-color-text-on-accent)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="9" r="2.6" fill="#c8961c" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-ink">
        Fisco<span className="text-accent">Track</span>
      </span>
    </span>
  );
}
