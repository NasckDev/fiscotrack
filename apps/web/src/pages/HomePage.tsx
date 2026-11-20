import { formatBRL, type MonthlyResult } from '@fiscotrack/engine';
import { BackupReminder } from '../components/BackupReminder';
import { DataGate } from '../components/DataGate';
import { NextDarfCard } from '../components/NextDarfCard';
import { PageHeader } from '../components/PageHeader';
import { PartialNotice } from '../components/PartialNotice';
import { todayIso, type DarfEntry } from '../domain/darf';
import {
  formatCompactBRL,
  formatDate,
  formatMonth,
  formatMonthShort,
  formatMonthTitle,
  plural,
} from '../domain/format';
import { monthResultCents } from '../domain/monthStatus';
import type { Holding } from '../domain/portfolio';
import { useOperations } from '../state/OperationsContext';
import { useFinance } from '../state/useFinance';
import { useRunner } from '../state/useRunner';
import {
  AppButton,
  AppCard,
  AppCol,
  AppFlex,
  AppIcon,
  AppLink,
  AppMoney,
  AppRow,
  AppStack,
  AppStatistic,
  AppText,
  AppTitle,
  useAppColors,
  useToasts,
} from '../ui';
import { AppBarChart, AppDonutChart, AppLineChart, type DonutSlice } from '../ui/charts';

const reais = (cents: number) => cents / 100;
const asBRL = (value: number) => formatBRL(Math.round(value * 100));
const percent = (share: number) =>
  `${(share * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

function MonthlyResultChart({ months }: { readonly months: readonly MonthlyResult[] }) {
  const colors = useAppColors();
  const results = months.map(monthResultCents);
  const best = [...months].sort((a, b) => monthResultCents(b) - monthResultCents(a))[0];
  return (
    <AppBarChart
      title="Resultado por mês"
      description={`Barras de resultado e DARF estimado por mês, de ${formatMonthShort(months[0]?.month ?? '')} a ${formatMonthShort(months[months.length - 1]?.month ?? '')}.${
        best
          ? ` Melhor mês: ${formatMonthTitle(best.month)}, ${formatBRL(monthResultCents(best))}.`
          : ''
      }`}
      categories={months.map((month) => formatMonthShort(month.month))}
      tooltipTitles={months.map((month) => formatMonthTitle(month.month))}
      series={[
        {
          name: 'Resultado',
          values: results.map(reais),
          color: results.map((value) => (value < 0 ? colors.lossFill : colors.gainFill)),
          labelAt: (index) => ((results[index] ?? 0) < 0 ? 'Prejuízo' : 'Lucro'),
        },
        {
          name: 'DARF estimado',
          values: months.map((month) => reais(month.darfDueCents)),
          color: colors.darfBar,
        },
      ]}
      legend={[
        { color: colors.gainFill, label: 'Lucro' },
        { color: colors.lossFill, label: 'Prejuízo' },
        { color: colors.darfBar, label: 'DARF estimado' },
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

function CumulativeChart({ months }: { readonly months: readonly MonthlyResult[] }) {
  const cumulative = months.reduce<number[]>(
    (acc, month) => [...acc, (acc[acc.length - 1] ?? 0) + monthResultCents(month)],
    [],
  );
  const last = cumulative[cumulative.length - 1];
  return (
    <AppLineChart
      title="Resultado acumulado"
      description={`Linha do resultado acumulado mês a mês${last === undefined ? '' : `, chegando a ${formatBRL(last)}`}.`}
      categories={months.map((month) => formatMonthShort(month.month))}
      tooltipTitles={months.map((month) => formatMonthTitle(month.month))}
      name="Acumulado"
      values={cumulative.map(reais)}
      formatValue={asBRL}
      formatAxis={formatCompactBRL}
      table={{
        head: ['Mês', 'Acumulado'],
        rows: months.map((month, index) => [
          formatMonthTitle(month.month),
          <AppMoney key="v" cents={cumulative[index] ?? 0} />,
        ]),
      }}
    />
  );
}

function AllocationChart({
  holdings,
  investedCents,
}: {
  readonly holdings: readonly Holding[];
  readonly investedCents: number;
}) {
  const colors = useAppColors();
  const open = holdings.filter((holding) => holding.totalCostCents > 0);
  const total = open.reduce((sum, holding) => sum + holding.totalCostCents, 0);
  const slices: DonutSlice[] = [...open]
    .sort((a, b) => b.totalCostCents - a.totalCostCents)
    .map((holding, index) => ({
      name: holding.ticker,
      value: reais(holding.totalCostCents),
      color: colors.categorical[index % colors.categorical.length] ?? colors.primary,
    }));
  const top =
    open.length > 0 ? [...open].sort((a, b) => b.totalCostCents - a.totalCostCents)[0] : undefined;
  return (
    <AppDonutChart
      title="Alocação por ativo"
      description={`Rosca com a distribuição do patrimônio por ativo.${
        top
          ? ` Maior posição: ${top.ticker}, ${percent(total === 0 ? 0 : top.totalCostCents / total)}.`
          : ''
      }`}
      slices={slices}
      formatValue={asBRL}
      formatShare={percent}
      centerValue={formatCompactBRL(reais(investedCents))}
      centerLabel="ao custo"
      table={{
        head: ['Ativo', 'Custo', 'Participação'],
        rows: slices.map((slice) => [
          slice.name,
          <AppText key="c" mono>
            {asBRL(slice.value)}
          </AppText>,
          <AppText key="s" mono>
            {percent(total === 0 ? 0 : (slice.value * 100) / total)}
          </AppText>,
        ]),
      }}
    />
  );
}

function RecentOperations() {
  const { operations } = useFinance();
  const colors = useAppColors();
  const recent = [...operations]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.seq ?? 0) - (a.seq ?? 0))
    .slice(0, 5);
  return (
    <AppCard fullHeight aria-labelledby="recentes">
      <AppFlex justify="space-between" align="center" gap="small">
        <AppTitle level={3} id="recentes">
          Últimas operações
        </AppTitle>
        <AppLink to="/operacoes">Ver todas</AppLink>
      </AppFlex>
      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
        {recent.map((operation) => (
          <li
            key={operation.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 0',
              borderBottom: `1px solid ${colors.borderSoft}`,
            }}
          >
            <AppFlex align="center" gap="middle">
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: operation.side === 'BUY' ? colors.infoSurface : colors.gainSurface,
                  color: operation.side === 'BUY' ? colors.info : colors.gain,
                }}
              >
                <AppIcon name={operation.side === 'BUY' ? 'wallet' : 'trend-up'} />
              </span>
              <div>
                <AppText strong block>
                  {operation.side === 'BUY' ? 'Compra' : 'Venda'} {operation.ticker}
                </AppText>
                <AppText type="secondary" mono size="sm">
                  {formatDate(operation.date)}
                </AppText>
              </div>
            </AppFlex>
            <AppText mono strong>
              {formatBRL(operation.quantity * operation.unitPriceCents)}
            </AppText>
          </li>
        ))}
      </ul>
    </AppCard>
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
    <AppStack>
      <PageHeader
        title="Início"
        description={`${plural(operations.length, 'operação', 'operações')} · dados salvos só neste navegador`}
        actions={
          <AppButton variant="primary" icon="plus" to="/operacoes?nova=1">
            Nova operação
          </AppButton>
        }
      />
      <PartialNotice report={report} />
      <BackupReminder />
      <AppRow>
        <AppCol xs={24} xl={12}>
          <NextDarfCard darfs={darfs} onMarkPaid={(entry) => void handleMarkPaid(entry)} />
        </AppCol>
        <AppCol xs={24} md={12} xl={6}>
          <AppCard fullHeight padding="lg">
            <AppStatistic
              title="Patrimônio investido"
              icon="wallet"
              value={investedCents}
              format={formatBRL}
              animated
              hint={`${plural(openPositions, 'ativo em carteira', 'ativos em carteira')}, ao custo`}
            />
            <div style={{ marginTop: 16 }}>
              <AppLink to="/carteira">Ver carteira</AppLink>
            </div>
          </AppCard>
        </AppCol>
        <AppCol xs={24} md={12} xl={6}>
          <AppCard fullHeight padding="lg">
            <AppStatistic
              title={`Resultado em ${year}`}
              icon={yearResult < 0 ? 'trend-down' : 'trend-up'}
              value={yearResult}
              format={formatBRL}
              tone={yearResult < 0 ? 'loss' : yearResult > 0 ? 'gain' : 'default'}
              hint="Lucro menos prejuízo, após custos"
            />
            <div style={{ marginTop: 16 }}>
              <AppLink to="/apuracao">Ver apuração mensal</AppLink>
            </div>
          </AppCard>
        </AppCol>
      </AppRow>
      {report.months.length > 0 && (
        <>
          <AppRow>
            <AppCol xs={24} xl={16}>
              <MonthlyResultChart months={report.months} />
            </AppCol>
            <AppCol xs={24} xl={8}>
              <AllocationChart holdings={holdings} investedCents={investedCents} />
            </AppCol>
          </AppRow>
          <AppRow>
            <AppCol xs={24} xl={16}>
              <CumulativeChart months={report.months} />
            </AppCol>
            <AppCol xs={24} xl={8}>
              <RecentOperations />
            </AppCol>
          </AppRow>
        </>
      )}
    </AppStack>
  );
}

export function HomePage() {
  return (
    <DataGate>
      <HomeContent />
    </DataGate>
  );
}
