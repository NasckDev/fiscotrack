import { formatBRL } from '@fiscotrack/engine';
import { DataGate } from '../components/DataGate';
import { PageHeader } from '../components/PageHeader';
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
import { useFinance } from '../state/useFinance';
import { useRunner } from '../state/useRunner';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppCol,
  AppFlex,
  AppIcon,
  AppMoney,
  AppRow,
  AppStack,
  AppStatistic,
  AppStatus,
  AppTable,
  AppText,
  useToasts,
  type AppStatusTone,
  type AppTableColumn,
} from '../ui';

const STATUS_VIEW: Record<DarfStatus, { tone: AppStatusTone; label: string }> = {
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

function useToggleDarf() {
  const { markPaid, unmarkPaid } = useOperations();
  const toasts = useToasts();
  const run = useRunner();
  return async (entry: DarfEntry) => {
    const next = !entry.paid;
    const label = formatMonth(entry.month);
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
}

function EntryDetails({ entry, today }: { readonly entry: DarfEntry; readonly today: string }) {
  const status = STATUS_VIEW[darfStatus(entry, today)];
  return (
    <div>
      <AppFlex gap="small" align="center" wrap>
        <AppText strong>Apuração de {formatMonthTitle(entry.month)}</AppText>
        <AppStatus tone={status.tone}>{status.label}</AppStatus>
      </AppFlex>
      <AppText type="secondary" block>
        Vencimento{' '}
        <AppText type="secondary" mono>
          {formatDate(entry.dueDate)}
        </AppText>{' '}
        · {dueText(entry, today)} · código {DARF_REVENUE_CODE}
      </AppText>
      {entry.amountChanged && (
        <AppText tone="darf" strong block>
          <AppIcon name="alert" /> O valor mudou desde o pagamento: confira e marque de novo.
        </AppText>
      )}
    </div>
  );
}

function ToggleButton({
  entry,
  onToggle,
}: {
  readonly entry: DarfEntry;
  readonly onToggle: (entry: DarfEntry) => void;
}) {
  return (
    <AppButton
      variant={entry.paid ? 'secondary' : 'primary'}
      icon={entry.paid ? 'undo' : 'check'}
      onClick={() => onToggle(entry)}
    >
      {entry.paid ? 'Marcar como pendente' : 'Marcar como pago'}
    </AppButton>
  );
}

function DarfsContent() {
  const { darfs } = useFinance();
  const toggle = useToggleDarf();
  const today = todayIso();
  const sorted = [...darfs].reverse();
  const open = darfs.filter((entry) => !entry.paid);
  const openTotal = open.reduce((sum, entry) => sum + entry.amountCents, 0);
  const paidTotal = darfs
    .filter((entry) => entry.paid)
    .reduce((sum, entry) => sum + entry.amountCents, 0);

  const columns: readonly AppTableColumn<DarfEntry>[] = [
    {
      title: 'Apuração',
      key: 'entry',
      render: (_, entry) => <EntryDetails entry={entry} today={today} />,
    },
    {
      title: 'Valor',
      key: 'amount',
      align: 'right',
      sorter: (a, b) => a.amountCents - b.amountCents,
      render: (_, entry) => <AppMoney cents={entry.amountCents} strong size="lg" />,
    },
    {
      title: <span className="sr-only">Ação</span>,
      key: 'action',
      align: 'right',
      render: (_, entry) => <ToggleButton entry={entry} onToggle={(item) => void toggle(item)} />,
    },
  ];

  return (
    <AppStack>
      <PageHeader
        title="DARFs"
        trail={[]}
        description="Vencimento no último dia útil do mês seguinte. O status é marcado por você; o app não consulta a Receita."
        actions={
          <AppButton icon="printer" onClick={() => window.print()}>
            Imprimir resumo
          </AppButton>
        }
      />
      {sorted.length === 0 ? (
        <AppAlert tone="success" title="Nenhum DARF a recolher">
          Nenhum mês apurado gerou imposto acima do mínimo. Se houver imposto abaixo de R$ 10,00,
          ele acumula para o mês seguinte.
        </AppAlert>
      ) : (
        <>
          <AppRow>
            <AppCol xs={12}>
              <AppCard fullHeight>
                <AppStatistic
                  title="Em aberto"
                  value={openTotal}
                  format={formatBRL}
                  tone={open.length > 0 ? 'darf' : 'default'}
                  hint={plural(open.length, 'DARF pendente', 'DARFs pendentes')}
                />
              </AppCard>
            </AppCol>
            <AppCol xs={12}>
              <AppCard fullHeight>
                <AppStatistic
                  title="Já pago"
                  value={paidTotal}
                  format={formatBRL}
                  hint={plural(darfs.length - open.length, 'DARF pago', 'DARFs pagos')}
                />
              </AppCard>
            </AppCol>
          </AppRow>
          <section aria-label="Lista de DARFs">
            <AppCard padding="none">
              <AppTable
                ariaLabel="Lista de DARFs"
                columns={columns}
                data={sorted}
                rowKey={(entry) => entry.month}
                renderCard={(entry) => (
                  <AppStack gap="small">
                    <EntryDetails entry={entry} today={today} />
                    <AppFlex justify="space-between" align="center" gap="small" wrap>
                      <AppMoney cents={entry.amountCents} strong size="lg" />
                      <ToggleButton entry={entry} onToggle={(item) => void toggle(item)} />
                    </AppFlex>
                  </AppStack>
                )}
              />
            </AppCard>
          </section>
        </>
      )}
    </AppStack>
  );
}

export function DarfsPage() {
  return (
    <DataGate>
      <DarfsContent />
    </DataGate>
  );
}
