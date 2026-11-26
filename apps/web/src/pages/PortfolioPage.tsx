import { formatBRL } from '@fiscotrack/engine';
import { useNavigate } from 'react-router';
import { DataGate } from '../components/DataGate';
import { PageHeader } from '../components/PageHeader';
import { plural } from '../domain/format';
import type { Holding } from '../domain/portfolio';
import { useFinance } from '../state/useFinance';
import {
  AppCard,
  AppCol,
  AppFlex,
  AppIcon,
  AppLink,
  AppMoney,
  AppRow,
  AppStack,
  AppStatistic,
  AppStatus,
  AppTable,
  AppText,
  useAppColors,
  type AppTableColumn,
} from '../ui';

const priceOf = (cents: number) => formatBRL(Math.round(cents));

function TickerBadge({ ticker, size }: { readonly ticker: string; readonly size: number }) {
  const colors = useAppColors();
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        background: colors.primarySurface,
        color: colors.primary,
      }}
    >
      {ticker.slice(0, 2)}
    </span>
  );
}

const COLUMNS: readonly AppTableColumn<Holding>[] = [
  {
    title: 'Ativo',
    key: 'ticker',
    sorter: (a, b) => a.ticker.localeCompare(b.ticker),
    render: (_, holding) => (
      <AppFlex align="center" gap="middle">
        <TickerBadge ticker={holding.ticker} size={36} />
        <AppLink to={`/carteira/${holding.ticker}`}>
          <strong>{holding.ticker}</strong>
        </AppLink>
        {holding.quantity === 0 && <AppStatus tone="neutral">Encerrada</AppStatus>}
      </AppFlex>
    ),
  },
  {
    title: 'Quantidade',
    key: 'quantity',
    align: 'right',
    sorter: (a, b) => a.quantity - b.quantity,
    render: (_, holding) => <AppText mono>{holding.quantity}</AppText>,
  },
  {
    title: 'Preço médio',
    key: 'avg',
    align: 'right',
    render: (_, holding) => (
      <AppText mono>{holding.quantity > 0 ? priceOf(holding.avgPriceCents) : '—'}</AppText>
    ),
  },
  {
    title: 'Custo total',
    key: 'cost',
    align: 'right',
    sorter: (a, b) => a.totalCostCents - b.totalCostCents,
    render: (_, holding) => <AppMoney cents={holding.totalCostCents} />,
  },
  {
    title: 'Resultado realizado',
    key: 'realized',
    align: 'right',
    sorter: (a, b) => a.realizedCents - b.realizedCents,
    render: (_, holding) => (
      <div>
        <AppMoney cents={holding.realizedCents} signed />
        {holding.realizedDayTradeCents !== 0 && (
          <AppText type="secondary" size="sm" block>
            + day trade <AppMoney cents={holding.realizedDayTradeCents} signed size="sm" />
          </AppText>
        )}
      </div>
    ),
  },
];

function HoldingCard({ holding }: { readonly holding: Holding }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => void navigate(`/carteira/${holding.ticker}`)}
      aria-label={`${holding.ticker}, ${holding.quantity} ações`}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        minHeight: 56,
        boxSizing: 'border-box',
      }}
    >
      <TickerBadge ticker={holding.ticker} size={40} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <AppFlex align="center" gap="small">
          <AppText strong>{holding.ticker}</AppText>
          {holding.quantity === 0 && <AppStatus tone="neutral">Encerrada</AppStatus>}
        </AppFlex>
        <AppText type="secondary" mono size="sm" block>
          {holding.quantity} ×{' '}
          {holding.quantity > 0 ? priceOf(holding.avgPriceCents) : 'posição encerrada'}
        </AppText>
      </span>
      <span style={{ textAlign: 'right' }}>
        <AppMoney cents={holding.totalCostCents} strong block />
        <AppMoney cents={holding.realizedCents} signed size="sm" block />
      </span>
      <AppIcon name="chevron-right" />
    </button>
  );
}

function PortfolioContent() {
  const { holdings, investedCents } = useFinance();
  const open = holdings.filter((holding) => holding.quantity > 0);
  const realized = holdings.reduce(
    (sum, holding) => sum + holding.realizedCents + holding.realizedDayTradeCents,
    0,
  );

  return (
    <AppStack>
      <PageHeader
        title="Carteira"
        trail={[]}
        description={`${plural(open.length, 'ativo em carteira', 'ativos em carteira')} · preço médio calculado pelo mesmo motor da apuração`}
      />
      <AppRow>
        <AppCol xs={24} md={8}>
          <AppCard fullHeight>
            <AppStatistic
              title="Patrimônio ao custo"
              icon="wallet"
              value={investedCents}
              format={formatBRL}
              hint="Soma do custo das posições abertas"
            />
          </AppCard>
        </AppCol>
        <AppCol xs={24} md={8}>
          <AppCard fullHeight>
            <AppStatistic
              title="Resultado realizado"
              icon="trend-up"
              value={realized}
              format={formatBRL}
              tone={realized < 0 ? 'loss' : realized > 0 ? 'gain' : 'default'}
              hint="Comum e day trade, líquido de custos"
            />
          </AppCard>
        </AppCol>
        <AppCol xs={24} md={8}>
          <AppCard fullHeight>
            <AppStatistic
              title="Ativos negociados"
              icon="operations"
              value={holdings.length}
              hint="Inclui posições encerradas"
            />
          </AppCard>
        </AppCol>
      </AppRow>
      <section aria-label="Posições">
        <AppCard padding="none">
          <AppTable
            ariaLabel="Posições da carteira"
            columns={COLUMNS}
            data={holdings}
            rowKey={(holding) => holding.ticker}
            cardsBelow={1024}
            renderCard={(holding) => <HoldingCard holding={holding} />}
          />
        </AppCard>
      </section>
      <AppText type="secondary" size="sm">
        Sem cotação de mercado: os valores usam o custo de aquisição (preço médio com custos de
        compra).
      </AppText>
    </AppStack>
  );
}

export function PortfolioPage() {
  return (
    <DataGate>
      <PortfolioContent />
    </DataGate>
  );
}
