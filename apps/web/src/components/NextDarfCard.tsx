import { formatBRL } from '@fiscotrack/engine';
import { Link } from 'react-router';
import { dueCountdown, nextDarf, todayIso, type DarfEntry } from '../domain/darf';
import { formatDate, formatMonth } from '../domain/format';
import { AppButton, AppCard, AppFlex, AppIcon, MONO_STYLE, useAppColors } from '../ui';
import { useCountUp } from '../ui/useCountUp';

interface NextDarfCardProps {
  readonly darfs: readonly DarfEntry[];
  readonly onMarkPaid: (entry: DarfEntry) => void;
}

function Eyebrow({ children }: { readonly children: React.ReactNode }) {
  const colors = useAppColors();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 600,
        color: colors.heroMuted,
      }}
    >
      {children}
    </span>
  );
}

function Amount({ cents }: { readonly cents: number }) {
  const colors = useAppColors();
  const shown = useCountUp(cents, true);
  return (
    <div
      style={{
        ...MONO_STYLE,
        fontSize: 'clamp(2rem, 6vw, 3rem)',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: colors.darfFill,
        lineHeight: 1.15,
      }}
    >
      {formatBRL(shown)}
    </div>
  );
}

/** Destaque do início: o próximo DARF em aberto, com contagem até o vencimento. */
export function NextDarfCard({ darfs, onMarkPaid }: NextDarfCardProps) {
  const colors = useAppColors();
  const entry = nextDarf(darfs);

  if (entry === null) {
    return (
      <AppCard tone="hero" fullHeight padding="lg" aria-label="Próximo DARF" role="region">
        <AppFlex vertical gap="small">
          <Eyebrow>
            <AppIcon name="check-circle" /> Próximo DARF
          </Eyebrow>
          <div style={{ fontSize: 28, fontWeight: 800, color: colors.heroText }}>
            Nada a pagar agora
          </div>
          <div style={{ color: colors.heroMuted }}>
            {darfs.length === 0
              ? 'Nenhum mês apurado gerou imposto a recolher.'
              : 'Todos os DARFs apurados estão marcados como pagos.'}
          </div>
          <div style={{ marginTop: 12 }}>
            <AppButton to="/darfs">Ver DARFs</AppButton>
          </div>
        </AppFlex>
      </AppCard>
    );
  }

  const { text, urgent } = dueCountdown(entry.dueDate, todayIso());
  return (
    <AppCard tone="hero" fullHeight padding="lg" aria-label="Próximo DARF" role="region">
      <AppFlex vertical gap="small">
        <AppFlex justify="space-between" align="center" gap="small" wrap>
          <Eyebrow>
            <AppIcon name="receipt" /> Próximo DARF · apuração de {formatMonth(entry.month)}
          </Eyebrow>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              background: urgent ? colors.darfFill : 'rgb(255 255 255 / 0.14)',
              color: urgent ? '#1f1500' : colors.heroText,
            }}
          >
            <AppIcon name="clock" /> {text}
          </span>
        </AppFlex>
        <Amount cents={entry.amountCents} />
        <div style={{ color: colors.heroMuted }}>
          Vencimento em <span style={MONO_STYLE}>{formatDate(entry.dueDate)}</span> · código de
          receita 6015
        </div>
        <AppFlex gap="small" wrap>
          <div style={{ marginTop: 12 }}>
            <AppButton icon="check" onClick={() => onMarkPaid(entry)}>
              Marcar como pago
            </AppButton>
          </div>
          <div style={{ marginTop: 12 }}>
            <Link
              to="/darfs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 40,
                color: colors.heroText,
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: 4,
              }}
            >
              Ver todos os DARFs
            </Link>
          </div>
        </AppFlex>
      </AppFlex>
    </AppCard>
  );
}
