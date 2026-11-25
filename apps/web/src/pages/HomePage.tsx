import { formatBRL, type MonthlyResult } from '@fiscotrack/engine';
import type { ReactNode } from 'react';
import { BackupReminder } from '../components/BackupReminder';
import { DataGate } from '../components/DataGate';
import { NextDarfCard } from '../components/NextDarfCard';
import { PageHeader } from '../components/PageHeader';
import { PartialNotice } from '../components/PartialNotice';
import { RECEIPT_HEADING_ID, ReceiptCard } from '../components/ReceiptCard';
import { nextDarf, todayIso, type DarfEntry } from '../domain/darf';
import {
  formatCompactBRL,
  formatMonth,
  formatMonthShort,
  formatMonthTitle,
  greeting,
  plural,
} from '../domain/format';
import { monthResultCents } from '../domain/monthStatus';
import type { Holding } from '../domain/portfolio';
import { receiptMonth } from '../domain/receipt';
import { useOperations } from '../state/OperationsContext';
import { useFinance } from '../state/useFinance';
import { useRunner } from '../state/useRunner';
import { AppLink, AppMoney, NUMERIC_STYLE, useAppColors, useToasts } from '../ui';
import { AppBarChart } from '../ui/charts';

const reais = (cents: number) => cents / 100;
const asBRL = (value: number) => formatBRL(Math.round(value * 100));

/** Cartão branco da grade do início (raio 28, título pequeno em cinza-verde). */
function HomeCard({
  title,
  id,
  basis,
  children,
}: {
  readonly title: string;
  readonly id: string;
  readonly basis: string;
  readonly children: ReactNode;
}) {
  const colors = useAppColors();
  return (
    <section
      aria-labelledby={id}
      style={{
        flex: basis,
        minWidth: 0,
        background: colors.bgContainer,
        borderRadius: 'var(--ft-radius-card)',
        padding: 'clamp(18px, 4.5vw, 26px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <h2 id={id} style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.textMuted }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function BigValue({ cents, tone }: { readonly cents: number; readonly tone?: 'loss' }) {
  const colors = useAppColors();
  return (
    <span
      style={{
        ...NUMERIC_STYLE,
        fontSize: 'clamp(32px, 4vw, 40px)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
        color: tone === 'loss' ? colors.loss : colors.text,
      }}
    >
      {formatBRL(cents)}
    </span>
  );
}

/** Participação de cada ativo no custo total, em ordem decrescente e em pontos percentuais. */
function allocation(holdings: readonly Holding[]) {
  const open = holdings.filter((holding) => holding.quantity > 0 && holding.totalCostCents > 0);
  const total = open.reduce((sum, holding) => sum + holding.totalCostCents, 0);
  return [...open]
    .sort((a, b) => b.totalCostCents - a.totalCostCents)
    .map((holding) => ({
      ticker: holding.ticker,
      share: total === 0 ? 0 : Math.round((holding.totalCostCents / total) * 100),
    }));
}

function PatrimonyCard({
  holdings,
  investedCents,
}: {
  readonly holdings: readonly Holding[];
  readonly investedCents: number;
}) {
  const colors = useAppColors();
  const slices = allocation(holdings);
  const colorAt = (index: number) =>
    colors.categorical[index % colors.categorical.length] ?? colors.primary;
  const summary = slices.map((slice) => `${slice.ticker} ${slice.share}%`).join(', ');
  return (
    <HomeCard title="Patrimônio investido" id="patrimonio" basis="1 1 300px">
      <BigValue cents={investedCents} />
      <span style={{ fontSize: 14, color: colors.textMuted }}>
        {plural(slices.length, 'ativo em carteira', 'ativos em carteira')}, ao custo de aquisição
      </span>
      {slices.length > 0 && (
        <>
          <div
            role="img"
            aria-label={`Alocação ao custo: ${summary}`}
            style={{
              display: 'flex',
              height: 14,
              borderRadius: 999,
              overflow: 'hidden',
              gap: 3,
              marginTop: 'auto',
            }}
          >
            {slices.map((slice, index) => (
              <span key={slice.ticker} style={{ flex: slice.share, background: colorAt(index) }} />
            ))}
          </div>
          <ul
            aria-hidden="true"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {slices.map((slice, index) => (
              <li key={slice.ticker} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{ width: 8, height: 8, borderRadius: 3, background: colorAt(index) }}
                />
                <span style={NUMERIC_STYLE}>
                  {slice.ticker} {slice.share}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: slices.length > 0 ? 4 : 'auto' }}>
        <AppLink to="/carteira">Ver carteira</AppLink>
      </div>
    </HomeCard>
  );
}

function YearResultCard({ months }: { readonly months: readonly MonthlyResult[] }) {
  const colors = useAppColors();
  const year = todayIso().slice(0, 4);
  const inYear = months.filter((month) => month.month.startsWith(year));
  const total = inYear.reduce((sum, month) => sum + monthResultCents(month), 0);
  const first = inYear[0];
  const last = inYear[inYear.length - 1];
  const range =
    first && last
      ? first.month === last.month
        ? `em ${formatMonth(first.month).split(' de ')[0]}`
        : `de ${formatMonth(first.month).split(' de ')[0]} a ${formatMonth(last.month).split(' de ')[0]}`
      : '';
  const hint =
    inYear.length === 0
      ? `Nenhuma venda apurada em ${year}`
      : `${total < 0 ? 'Prejuízo líquido' : 'Lucro líquido'} ${range}, após custos`;
  return (
    <HomeCard title={`Resultado em ${year}`} id="resultado-ano" basis="1 1 300px">
      <BigValue cents={total} tone={total < 0 ? 'loss' : undefined} />
      <span style={{ fontSize: 14, color: colors.textMuted }}>{hint}</span>
      <div style={{ marginTop: 'auto', paddingTop: 12, fontSize: 14, fontWeight: 700 }}>
        <AppLink to="/apuracao">Ver apuração mensal</AppLink>
      </div>
    </HomeCard>
  );
}

function MonthlyResultChart({ months }: { readonly months: readonly MonthlyResult[] }) {
  const colors = useAppColors();
  const results = months.map(monthResultCents);
  const losses = months.filter((month) => monthResultCents(month) < 0);
  const lossText =
    losses.length === 0
      ? 'sem meses de prejuízo'
      : `com prejuízo em ${losses.map((month) => formatMonth(month.month).split(' de ')[0]).join(', ')}`;
  return (
    <AppBarChart
      title="Resultado por mês"
      minimal
      height={230}
      description={`Resultado mensal de ${formatMonth(months[0]?.month ?? '')} a ${formatMonth(
        months[months.length - 1]?.month ?? '',
      )}, ${lossText}. Lucro em verde-floresta, prejuízo em laranja; a tabela traz os valores.`}
      categories={months.map((month) => formatMonthShort(month.month).split('/')[0] ?? '')}
      tooltipTitles={months.map((month) => formatMonthTitle(month.month))}
      series={[
        {
          name: 'Resultado',
          values: results.map(reais),
          color: results.map((value) => (value < 0 ? colors.lossFill : colors.gainFill)),
          labelAt: (index) => ((results[index] ?? 0) < 0 ? 'Prejuízo' : 'Lucro'),
        },
      ]}
      legend={[
        { color: colors.gainFill, label: 'Lucro' },
        { color: colors.lossFill, label: 'Prejuízo' },
      ]}
      formatValue={asBRL}
      formatAxis={formatCompactBRL}
      table={{
        head: ['Mês', 'Resultado', 'DARF estimado'],
        rows: months.map((month) => [
          formatMonthTitle(month.month),
          <AppMoney key="r" cents={monthResultCents(month)} signed />,
          <AppMoney key="d" cents={month.darfDueCents} />,
        ]),
      }}
    />
  );
}

/** Leva ao recibo e põe o foco no título dele (leitor de tela anuncia onde chegou). */
function focusReceipt() {
  const heading = document.getElementById(RECEIPT_HEADING_ID);
  if (heading === null) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  heading.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  heading.focus({ preventScroll: true });
}

function HomeContent() {
  const { report, holdings, darfs, investedCents } = useFinance();
  const { markPaid, unmarkPaid } = useOperations();
  const toasts = useToasts();
  const run = useRunner();
  const explained = receiptMonth(report.months, nextDarf(darfs)?.month ?? null);

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
    <div>
      <PageHeader title={greeting()} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PartialNotice report={report} />
        <BackupReminder />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 4 }}>
        <div style={{ flex: '2 1 620px', minWidth: 0 }}>
          <NextDarfCard
            darfs={darfs}
            onMarkPaid={(entry) => void handleMarkPaid(entry)}
            onExplain={explained ? focusReceipt : undefined}
          />
        </div>
        <PatrimonyCard holdings={holdings} investedCents={investedCents} />
        <YearResultCard months={report.months} />
        {report.months.length > 0 && (
          <div style={{ flex: '2 1 620px', minWidth: 0 }}>
            <MonthlyResultChart months={report.months} />
          </div>
        )}
        {explained && (
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <ReceiptCard month={explained} />
          </div>
        )}
      </div>
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
