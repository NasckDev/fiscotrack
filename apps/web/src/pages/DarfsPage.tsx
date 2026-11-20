import { formatBRL } from '@fiscotrack/engine';
import { DataGate } from '../components/DataGate';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { useToasts } from '../components/Toasts';
import { Money, Notice, PageHeader, StatusBadge } from '../components/ui';
import {
  DARF_REVENUE_CODE,
  darfStatus,
  daysBetween,
  dueCountdown,
  todayIso,
  type DarfEntry,
  type DarfStatus,
} from '../domain/darf';
import { formatDate, formatMonth, formatMonthTitle, plural } from '../domain/format';
import { useOperations } from '../state/OperationsContext';
import { useRunner } from '../state/useRunner';
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

/** Pago: só informa o vencimento (no passado ou no futuro). Em aberto: contagem até o prazo. */
function dueText(entry: DarfEntry, today: string): string {
  if (entry.paid) {
    return daysBetween(today, entry.dueDate) < 0
      ? `Venceu em ${formatDate(entry.dueDate)}`
      : `Vence em ${formatDate(entry.dueDate)}`;
  }
  return dueCountdown(entry.dueDate, today).text;
}

function DarfRow({ entry, today }: { readonly entry: DarfEntry; readonly today: string }) {
  const { markPaid, unmarkPaid } = useOperations();
  const toasts = useToasts();
  const run = useRunner();
  const status = STATUS_VIEW[darfStatus(entry, today)];
  const label = formatMonth(entry.month);

  const toggle = async () => {
    const next = !entry.paid;
    const ok = await run(
      () => (next ? markPaid(entry.month, entry.amountCents) : unmarkPaid(entry.month)),
      'Não foi possível atualizar o status do DARF.',
    );
    if (!ok) return;
    toasts.show(
      next ? `DARF de ${label} marcado como pago.` : `DARF de ${label} voltou para pendente.`,
      {
        action: {
          label: 'Desfazer',
          run: () =>
            void run(
              () => (next ? unmarkPaid(entry.month) : markPaid(entry.month, entry.amountCents)),
              'Não foi possível desfazer.',
            ),
        },
      },
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
        {entry.amountChanged && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-warning">
            <Icon name="alert" size={14} />O valor mudou desde o pagamento: confira e marque de
            novo.
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <Money cents={entry.amountCents} className="text-lg font-bold" />
        <button
          type="button"
          className={`btn ${entry.paid ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => void toggle()}
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
  const open = darfs.filter((entry) => !entry.paid);
  const openTotal = open.reduce((sum, entry) => sum + entry.amountCents, 0);
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
          <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4">
            <Reveal index={0} className="h-full">
              <div className="card h-full p-4 sm:p-5">
                <p className="text-sm font-semibold text-muted">Em aberto</p>
                <p className="mt-2 text-lg font-bold sm:text-2xl">
                  <Money cents={openTotal} />
                </p>
                <p className="mt-1 text-xs text-muted">
                  {plural(open.length, 'DARF pendente', 'DARFs pendentes')}
                </p>
              </div>
            </Reveal>
            <Reveal index={1} className="h-full">
              <div className="card h-full p-4 sm:p-5">
                <p className="text-sm font-semibold text-muted">Já pago</p>
                <p className="mt-2 text-lg font-bold sm:text-2xl">
                  <Money cents={paidTotal} />
                </p>
                <p className="mt-1 text-xs text-muted">
                  {plural(darfs.length - open.length, 'DARF pago', 'DARFs pagos')} ·{' '}
                  {formatBRL(paidTotal)}
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
