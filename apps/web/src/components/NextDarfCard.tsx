import { formatBRL } from '@fiscotrack/engine';
import type { CSSProperties, ReactNode } from 'react';
import { DARF_REVENUE_CODE, dueBadge, nextDarf, todayIso, type DarfEntry } from '../domain/darf';
import { formatDate, formatMonth } from '../domain/format';
import { Link } from 'react-router';
import { AppIcon, NUMERIC_STYLE, useAppColors } from '../ui';
import { useCountUp } from '../ui/useCountUp';

interface NextDarfCardProps {
  readonly darfs: readonly DarfEntry[];
  readonly onMarkPaid: (entry: DarfEntry) => void;
  /** Leva ao recibo "Por que deu esse valor?" da mesma tela. */
  readonly onExplain?: () => void;
}

function HeroFrame({ children }: { readonly children: ReactNode }) {
  const colors = useAppColors();
  return (
    <section
      aria-labelledby="proximo-darf"
      className="ft-on-hero"
      style={{
        background: colors.hero,
        color: colors.heroText,
        border: '1px solid var(--ft-hero-border)',
        borderRadius: 'var(--ft-radius-card)',
        padding: 'clamp(22px, 3vw, 30px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        minHeight: 300,
        height: '100%',
        minWidth: 0,
        containerType: 'inline-size',
      }}
    >
      {children}
    </section>
  );
}

function Title() {
  const colors = useAppColors();
  return (
    <h2
      id="proximo-darf"
      style={{
        margin: 0,
        fontSize: 16,
        fontWeight: 700,
        color: colors.heroMuted,
        letterSpacing: 0,
      }}
    >
      Próximo DARF
    </h2>
  );
}

function Amount({ cents }: { readonly cents: number }) {
  const colors = useAppColors();
  const shown = useCountUp(cents, true);
  // O tamanho acompanha a largura do cartão (unidade cqi): até 112 px, sem estourar em 320 px.
  const chars = formatBRL(cents).length;
  return (
    <span
      style={{
        ...NUMERIC_STYLE,
        fontSize: `clamp(32px, calc(100cqi / ${(chars * 0.56).toFixed(2)}), 112px)`,
        whiteSpace: 'nowrap',
        lineHeight: 0.9,
        fontWeight: 800,
        letterSpacing: '-0.04em',
        color: colors.lime,
      }}
    >
      {formatBRL(shown)}
    </span>
  );
}

const HERO_BUTTON: CSSProperties = {
  minHeight: 48,
  padding: '0 20px',
  borderRadius: 999,
  font: 'inherit',
  fontSize: 15,
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
};

/** Destaque do início: o próximo DARF em aberto, em lima sobre verde-floresta. */
export function NextDarfCard({ darfs, onMarkPaid, onExplain }: NextDarfCardProps) {
  const colors = useAppColors();
  const entry = nextDarf(darfs);

  if (entry === null) {
    return (
      <HeroFrame>
        <Title />
        <span style={{ fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 800, lineHeight: 1 }}>
          Nada a pagar agora
        </span>
        <span style={{ fontSize: 15, color: colors.heroSoft }}>
          {darfs.length === 0
            ? 'Nenhum mês apurado gerou imposto a recolher.'
            : 'Todos os DARFs apurados estão marcados como pagos.'}
        </span>
        <div style={{ marginTop: 'auto' }}>
          <Link
            to="/darfs"
            style={{
              ...HERO_BUTTON,
              fontWeight: 700,
              border: `1.5px solid ${colors.heroLine}`,
              color: colors.heroText,
              textDecoration: 'none',
            }}
          >
            Ver DARFs
          </Link>
        </div>
      </HeroFrame>
    );
  }

  const badge = dueBadge(entry.dueDate, todayIso());
  return (
    <HeroFrame>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Title />
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 800,
            borderRadius: 999,
            padding: '6px 14px',
            background: badge.overdue ? colors.lossSurface : colors.lime,
            color: badge.overdue ? colors.loss : colors.onLime,
          }}
        >
          {badge.overdue && <AppIcon name="alert" />}
          {badge.text}
        </span>
      </div>
      <Amount cents={entry.amountCents} />
      <span style={{ fontSize: 15, color: colors.heroSoft }}>
        Apuração de {formatMonth(entry.month)}, vence em{' '}
        <span style={NUMERIC_STYLE}>{formatDate(entry.dueDate)}</span>, código de receita{' '}
        {DARF_REVENUE_CODE}
      </span>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={() => onMarkPaid(entry)}
          style={{ ...HERO_BUTTON, border: 0, background: colors.lime, color: colors.onLime }}
        >
          Marcar como pago
        </button>
        {onExplain && (
          <button
            type="button"
            onClick={onExplain}
            style={{
              ...HERO_BUTTON,
              fontWeight: 700,
              border: `1.5px solid ${colors.heroLine}`,
              background: 'transparent',
              color: colors.heroText,
            }}
          >
            Por que deu esse valor?
          </button>
        )}
      </div>
    </HeroFrame>
  );
}
