import { Link } from 'react-router';
import { daysBetween, nextDarf, todayIso, type DarfEntry } from '../domain/darf';
import { formatBRL } from '@fiscotrack/engine';
import { formatDate, formatMonth, plural } from '../domain/format';
import { AnimatedNumber } from './AnimatedNumber';
import { Icon } from './Icon';

function countdown(entry: DarfEntry): { text: string; urgent: boolean } {
  const days = daysBetween(todayIso(), entry.dueDate);
  if (days < 0) return { text: `Venceu há ${plural(-days, 'dia', 'dias')}`, urgent: true };
  if (days === 0) return { text: 'Vence hoje', urgent: true };
  return { text: `Vence em ${plural(days, 'dia', 'dias')}`, urgent: days <= 10 };
}

interface NextDarfCardProps {
  readonly darfs: readonly DarfEntry[];
  readonly onMarkPaid: (month: string) => void;
}

/** Destaque do início: o próximo DARF em aberto, com contagem até o vencimento. */
export function NextDarfCard({ darfs, onMarkPaid }: NextDarfCardProps) {
  const entry = nextDarf(darfs);

  if (entry === null) {
    return (
      <section aria-label="Próximo DARF" className="hero flex flex-col justify-between p-5 sm:p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-hero-muted">
          <Icon name="check-circle" size={18} />
          Próximo DARF
        </p>
        <p className="mt-4 text-3xl font-extrabold tracking-tight">Nada a pagar agora</p>
        <p className="mt-1 text-sm text-hero-muted">
          {darfs.length === 0
            ? 'Nenhum mês apurado gerou imposto a recolher.'
            : 'Todos os DARFs apurados estão marcados como pagos.'}
        </p>
        <Link to="/darfs" className="btn btn-hero mt-5 w-fit">
          Ver DARFs
        </Link>
      </section>
    );
  }

  const { text, urgent } = countdown(entry);
  return (
    <section aria-label="Próximo DARF" className="hero flex flex-col justify-between p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-hero-muted">
          <Icon name="receipt" size={18} />
          Próximo DARF · apuração de {formatMonth(entry.month)}
        </p>
        <span className={`hero-pill ${urgent ? 'hero-pill-urgent' : ''}`}>
          <Icon name="clock" size={14} />
          {text}
        </span>
      </div>
      <p className="num mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
        <AnimatedNumber value={entry.amountCents} format={formatBRL} />
      </p>
      <p className="mt-1 text-sm text-hero-muted">
        Vencimento em {formatDate(entry.dueDate)} · código de receita 6015
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-hero" onClick={() => onMarkPaid(entry.month)}>
          <Icon name="check" size={16} />
          Marcar como pago
        </button>
        <Link to="/darfs" className="btn btn-hero-ghost">
          Ver todos os DARFs
        </Link>
      </div>
    </section>
  );
}
