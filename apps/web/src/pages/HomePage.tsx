import { formatBRL, type MonthlyResult } from '@fiscotrack/engine';
import { Link } from 'react-router';
import { AllocationDonut } from '../components/charts/AllocationDonut';
import { LineSeries, type LinePoint } from '../components/charts/LineSeries';
import { MonthlyBars } from '../components/charts/MonthlyBars';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { BackupReminder } from '../components/BackupReminder';
import { DataGate } from '../components/DataGate';
import { Icon } from '../components/Icon';
import { NextDarfCard } from '../components/NextDarfCard';
import { PartialNotice } from '../components/PartialNotice';
import { Reveal } from '../components/Reveal';
import { useToasts } from '../components/Toasts';
import { Kpi, Money, PageHeader } from '../components/ui';
import { todayIso, type DarfEntry } from '../domain/darf';
import {
  formatDate,
  formatMonth,
  formatMonthShort,
  formatMonthTitle,
  plural,
} from '../domain/format';
import { monthResultCents } from '../domain/monthStatus';
import { useOperations } from '../state/OperationsContext';
import { useFinance } from '../state/useFinance';
import { useRunner } from '../state/useRunner';

function cumulativePoints(months: readonly MonthlyResult[]): readonly LinePoint[] {
  let running = 0;
  return months.map((month) => {
    running += monthResultCents(month);
    return {
      label: formatMonthShort(month.month),
      detail: formatMonthTitle(month.month),
      value: running / 100,
    };
  });
}

function RecentOperations() {
  const { operations } = useFinance();
  const recent = [...operations]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.seq ?? 0) - (a.seq ?? 0))
    .slice(0, 5);
  return (
    <section aria-labelledby="recentes" className="card flex h-full flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="recentes" className="text-base font-bold">
          Últimas operações
        </h2>
        <Link to="/operacoes" className="link inline-flex min-h-11 items-center text-sm">
          Ver todas
        </Link>
      </div>
      <ul className="divide-y divide-line-soft">
        {recent.map((operation) => (
          <li key={operation.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex size-9 flex-none items-center justify-center rounded-xl ${
                  operation.side === 'BUY'
                    ? 'bg-info-surface text-info'
                    : 'bg-accent-surface text-accent'
                }`}
              >
                <Icon name={operation.side === 'BUY' ? 'wallet' : 'trend-up'} size={16} />
              </span>
              <div className="min-w-0">
                <p className="font-bold">
                  {operation.side === 'BUY' ? 'Compra' : 'Venda'} {operation.ticker}
                </p>
                <p className="num text-xs text-muted">{formatDate(operation.date)}</p>
              </div>
            </div>
            <p className="num flex-none text-sm font-semibold">
              {formatBRL(operation.quantity * operation.unitPriceCents)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HomeContent() {
  const { report, holdings, darfs, investedCents, operations } = useFinance();
  const { markPaid, unmarkPaid } = useOperations();
  const toasts = useToasts();
  const run = useRunner();
  const year = todayIso().slice(0, 4);
  const yearResult = report.months
    .filter((month) => month.month.startsWith(year))
    .reduce((sum, month) => sum + monthResultCents(month), 0);
  const openPositions = holdings.filter((holding) => holding.quantity > 0).length;
  const points = cumulativePoints(report.months);
  const lastPoint = points[points.length - 1];

  const handleMarkPaid = async (entry: DarfEntry) => {
    const ok = await run(
      () => markPaid(entry.month, entry.amountCents),
      'Não foi possível marcar o DARF como pago.',
    );
    if (!ok) return;
    toasts.show(`DARF de ${formatMonth(entry.month)} marcado como pago.`, {
      action: {
        label: 'Desfazer',
        run: () => void run(() => unmarkPaid(entry.month), 'Não foi possível desfazer.'),
      },
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Início"
        description={`${plural(operations.length, 'operação', 'operações')} · dados salvos só neste navegador`}
      />
      <PartialNotice report={report} />
      <BackupReminder />
      <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        <Reveal index={0} className="col-span-2 h-full">
          <NextDarfCard darfs={darfs} onMarkPaid={(entry) => void handleMarkPaid(entry)} />
        </Reveal>
        <div className="col-span-2 grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-1 xl:grid-rows-2">
          <Reveal index={1} className="h-full">
            <Kpi
              label="Patrimônio investido"
              icon="wallet"
              hint={`${plural(openPositions, 'ativo em carteira', 'ativos em carteira')}, ao custo`}
            >
              <AnimatedNumber value={investedCents} format={formatBRL} className="num" />
            </Kpi>
          </Reveal>
          <Reveal index={2} className="h-full">
            <Kpi
              label={`Resultado em ${year}`}
              icon={yearResult < 0 ? 'trend-down' : 'trend-up'}
              hint="Lucro menos prejuízo, após custos"
            >
              <Money cents={yearResult} signed />
            </Kpi>
          </Reveal>
        </div>
      </div>
      {report.months.length > 0 && (
        <>
          <div className="grid items-stretch gap-4 xl:grid-cols-3">
            <Reveal index={3} className="h-full xl:col-span-2">
              <MonthlyBars months={report.months} />
            </Reveal>
            <Reveal index={4} className="h-full">
              <AllocationDonut holdings={holdings} />
            </Reveal>
          </div>
          <div className="grid items-stretch gap-4 xl:grid-cols-3">
            <Reveal index={5} className="h-full xl:col-span-2">
              <LineSeries
                title="Resultado acumulado"
                description={`Linha do resultado acumulado mês a mês${
                  lastPoint ? `, chegando a ${formatBRL(Math.round(lastPoint.value * 100))}` : ''
                }.`}
                seriesLabel="Acumulado"
                points={points}
                formatValue={(value) => formatBRL(Math.round(value * 100))}
                table={{
                  head: ['Mês', 'Acumulado'],
                  rows: points.map((point) => [
                    point.detail,
                    <span key="v" className="num">
                      {formatBRL(Math.round(point.value * 100))}
                    </span>,
                  ]),
                }}
              />
            </Reveal>
            <Reveal index={6} className="h-full">
              <RecentOperations />
            </Reveal>
          </div>
        </>
      )}
    </div>
  );
}

export function HomePage() {
  return (
    <DataGate>
      <HomeContent />
    </DataGate>
  );
}
