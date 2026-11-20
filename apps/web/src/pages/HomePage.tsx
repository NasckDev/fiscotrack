import { formatBRL, type MonthlyResult } from '@fiscotrack/engine';
import { Link } from 'react-router';
import { AllocationDonut } from '../components/charts/AllocationDonut';
import { LineSeries, type LinePoint } from '../components/charts/LineSeries';
import { MonthlyBars } from '../components/charts/MonthlyBars';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { DataGate } from '../components/DataGate';
import { Icon } from '../components/Icon';
import { NextDarfCard } from '../components/NextDarfCard';
import { PartialNotice } from '../components/PartialNotice';
import { Reveal } from '../components/Reveal';
import { useToasts } from '../components/Toasts';
import { Kpi, Money, PageHeader } from '../components/ui';
import {
  formatDate,
  formatMonth,
  formatMonthShort,
  formatMonthTitle,
  plural,
} from '../domain/format';
import { monthResultCents } from '../domain/monthStatus';
import { useFinance } from '../state/useFinance';

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
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);
  return (
    <section aria-labelledby="recentes" className="card flex h-full flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 id="recentes" className="text-base font-bold">
          Últimas operações
        </h3>
        <Link to="/operacoes" className="link text-sm">
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
  const { report, holdings, darfs, investedCents, operations, setDarfPaid } = useFinance();
  const toasts = useToasts();
  const lastMonth = report.months[report.months.length - 1];
  const year = lastMonth?.month.slice(0, 4);
  const yearResult = report.months
    .filter((month) => month.month.startsWith(year ?? ''))
    .reduce((sum, month) => sum + monthResultCents(month), 0);
  const openPositions = holdings.filter((holding) => holding.quantity > 0).length;
  const points = cumulativePoints(report.months);
  const lastPoint = points[points.length - 1];

  const markPaid = (month: string) => {
    void setDarfPaid(month, true).then(() =>
      toasts.show(`DARF de ${formatMonth(month)} marcado como pago.`, {
        action: { label: 'Desfazer', run: () => void setDarfPaid(month, false) },
      }),
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Início"
        description={`${plural(operations.length, 'operação', 'operações')} · dados salvos só neste navegador`}
      />
      <PartialNotice report={report} />
      <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        <Reveal index={0} className="col-span-2">
          <NextDarfCard darfs={darfs} onMarkPaid={markPaid} />
        </Reveal>
        <Reveal index={1}>
          <Kpi
            label="Patrimônio investido"
            icon="wallet"
            hint={`${plural(openPositions, 'ativo em carteira', 'ativos em carteira')}, ao custo`}
          >
            <AnimatedNumber value={investedCents} format={formatBRL} className="num" />
          </Kpi>
        </Reveal>
        <Reveal index={2}>
          <Kpi
            label={year ? `Resultado em ${year}` : 'Resultado do ano'}
            icon={yearResult < 0 ? 'trend-down' : 'trend-up'}
            hint="Lucro menos prejuízo, após custos"
          >
            <Money cents={yearResult} signed />
          </Kpi>
        </Reveal>
      </div>
      {report.months.length > 0 && (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <Reveal index={3} className="xl:col-span-2">
              <MonthlyBars months={report.months} />
            </Reveal>
            <Reveal index={4}>
              <AllocationDonut holdings={holdings} />
            </Reveal>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <Reveal index={5} className="xl:col-span-2">
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
            <Reveal index={6}>
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
