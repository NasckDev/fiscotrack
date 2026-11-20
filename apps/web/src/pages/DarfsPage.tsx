import { formatBRL } from '@fiscotrack/engine';
import { DataGate } from '../components/DataGate';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { useToasts } from '../components/Toasts';
import { Money, Notice, PageHeader, StatusBadge } from '../components/ui';
import {
  DARF_REVENUE_CODE,
  daysBetween,
  darfStatus,
  todayIso,
  type DarfEntry,
  type DarfStatus,
} from '../domain/darf';
import { formatDate, formatMonth, formatMonthTitle, plural } from '../domain/format';
import { useFinance } from '../state/useFinance';

const STATUS_VIEW: Record<
  DarfStatus,
  { tone: 'success' | 'danger' | 'warning' | 'info'; label: string }
> = {
  paid: { tone: 'success', label: 'Pago' },
  overdue: { tone: 'danger', label: 'Vencido' },
  'due-soon': { tone: 'warning', label: 'Vence em breve' },
  pending: { tone: 'info', label: 'Pendente' },
};

function dueText(entry: DarfEntry, today: string): string {
  if (entry.paid) return `Venceu em ${formatDate(entry.dueDate)}`;
  const days = daysBetween(today, entry.dueDate);
  if (days < 0) return `Venceu há ${plural(-days, 'dia', 'dias')}`;
  if (days === 0) return 'Vence hoje';
  return `Vence em ${plural(days, 'dia', 'dias')}`;
}

function DarfRow({ entry, today }: { readonly entry: DarfEntry; readonly today: string }) {
  const { setDarfPaid } = useFinance();
  const toasts = useToasts();
  const status = STATUS_VIEW[darfStatus(entry, today)];

  const toggle = () => {
    const next = !entry.paid;
    void setDarfPaid(entry.month, next).then(() =>
      toasts.show(
        next
          ? `DARF de ${formatMonth(entry.month)} marcado como pago.`
          : `DARF de ${formatMonth(entry.month)} voltou para pendente.`,
        { action: { label: 'Desfazer', run: () => void setDarfPaid(entry.month, entry.paid) } },
      ),
    );
  };

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold">Apuração de {formatMonthTitle(entry.month)}</span>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        </p>
        <p className="mt-1 text-sm text-muted">
          Vencimento <span className="num">{formatDate(entry.dueDate)}</span> ·{' '}
          {dueText(entry, today)} · código {DARF_REVENUE_CODE}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <Money cents={entry.amountCents} className="text-lg font-bold" />
        <button
          type="button"
          className={`btn ${entry.paid ? 'btn-secondary' : 'btn-primary'}`}
          onClick={toggle}
        >
          <Icon name={entry.paid ? 'undo' : 'check'} size={16} />
          {entry.paid ? 'Marcar como pendente' : 'Marcar como pago'}
        </button>
      </div>
    </li>
  );
}

function DarfsContent() {
  const { darfs } = useFinance();
  const today = todayIso();
  const sorted = [...darfs].reverse();
  const openTotal = darfs
    .filter((entry) => !entry.paid)
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const paidTotal = darfs
    .filter((entry) => entry.paid)
    .reduce((sum, entry) => sum + entry.amountCents, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="DARFs"
        description="Vencimento no último dia útil do mês seguinte. O status é marcado por você; o app não consulta a Receita."
        actions={
          <button
            type="button"
            className="btn btn-secondary print:hidden"
            onClick={() => window.print()}
          >
            <Icon name="printer" size={16} />
            Imprimir resumo
          </button>
        }
      />
      {sorted.length === 0 ? (
        <Notice tone="success" title="Nenhum DARF a recolher">
          Nenhum mês apurado gerou imposto acima do mínimo. Se houver imposto abaixo de R$ 10,00,
          ele acumula para o mês seguinte.
        </Notice>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Reveal index={0}>
              <div className="card p-4 sm:p-5">
                <p className="text-sm font-semibold text-muted">Em aberto</p>
                <p className="mt-2 text-lg font-bold sm:text-2xl">
                  <Money cents={openTotal} />
                </p>
                <p className="mt-1 text-xs text-muted">
                  {plural(
                    darfs.filter((entry) => !entry.paid).length,
                    'DARF pendente',
                    'DARFs pendentes',
                  )}
                </p>
              </div>
            </Reveal>
            <Reveal index={1}>
              <div className="card p-4 sm:p-5">
                <p className="text-sm font-semibold text-muted">Já pago</p>
                <p className="mt-2 text-lg font-bold sm:text-2xl">
                  <Money cents={paidTotal} />
                </p>
                <p className="mt-1 text-xs text-muted">
                  Total marcado como pago: {formatBRL(paidTotal)}
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal index={2}>
            <section aria-label="Lista de DARFs" className="card overflow-hidden">
              <ul className="divide-y divide-line-soft">
                {sorted.map((entry) => (
                  <DarfRow key={entry.month} entry={entry} today={today} />
                ))}
              </ul>
            </section>
          </Reveal>
        </>
      )}
    </div>
  );
}

export function DarfsPage() {
  return (
    <DataGate>
      <DarfsContent />
    </DataGate>
  );
}
