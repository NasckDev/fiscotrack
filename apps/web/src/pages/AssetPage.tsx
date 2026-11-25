import { formatBRL } from '@fiscotrack/engine';
import { useParams } from 'react-router';
import { DataGate } from '../components/DataGate';
import { PageHeader } from '../components/PageHeader';
import { formatAxisBRL, formatDate, formatDateShort } from '../domain/format';
import { useFinance } from '../state/useFinance';
import {
  AppButton,
  AppCard,
  AppCol,
  AppEmpty,
  AppFlex,
  AppRow,
  AppStack,
  AppStatistic,
  AppStatus,
  AppText,
  AppTitle,
  useAppColors,
} from '../ui';
import { AppLineChart } from '../ui/charts';

const priceOf = (cents: number) => formatBRL(Math.round(cents));
const asBRL = (value: number) => formatBRL(Math.round(value * 100));

function AssetContent({ ticker }: { readonly ticker: string }) {
  const { holdings } = useFinance();
  const colors = useAppColors();
  const holding = holdings.find((item) => item.ticker === ticker.toUpperCase());

  if (holding === undefined) {
    return (
      <AppCard padding="lg">
        <AppEmpty
          titleAs="h1"
          icon="search"
          title="Ativo não encontrado"
          description={`Não há operações de ${ticker.toUpperCase()} neste navegador.`}
        >
          <AppButton variant="primary" to="/carteira">
            Voltar à carteira
          </AppButton>
        </AppEmpty>
      </AppCard>
    );
  }

  const points = holding.history.map((point) => ({
    label: formatDateShort(point.date),
    detail: formatDate(point.date),
    value: point.avgPriceCents / 100,
  }));

  return (
    <AppStack>
      <PageHeader
        title={holding.ticker}
        trail={[{ label: 'Carteira', to: '/carteira' }]}
        description={
          holding.quantity > 0 ? `${holding.quantity} ações em carteira` : 'Posição encerrada'
        }
        actions={
          <AppFlex gap="small" wrap>
            {holding.quantity === 0 && <AppStatus tone="neutral">Encerrada</AppStatus>}
            <AppButton
              variant="primary"
              icon="plus"
              to={`/operacoes?nova=1&ticker=${holding.ticker}`}
            >
              Nova operação de {holding.ticker}
            </AppButton>
          </AppFlex>
        }
      />
      <AppRow>
        <AppCol xs={24} sm={12} lg={6}>
          <AppCard fullHeight>
            <AppStatistic
              title="Preço médio"
              icon="calculator"
              value={holding.avgPriceCents}
              format={(value) => (holding.quantity > 0 ? priceOf(value) : '—')}
            />
          </AppCard>
        </AppCol>
        <AppCol xs={24} sm={12} lg={6}>
          <AppCard fullHeight>
            <AppStatistic title="Quantidade" icon="wallet" value={holding.quantity} />
          </AppCard>
        </AppCol>
        <AppCol xs={24} sm={12} lg={6}>
          <AppCard fullHeight>
            <AppStatistic
              title="Custo total"
              icon="receipt"
              value={holding.totalCostCents}
              format={formatBRL}
            />
          </AppCard>
        </AppCol>
        <AppCol xs={24} sm={12} lg={6}>
          <AppCard fullHeight>
            <AppStatistic
              title="Resultado realizado"
              icon="trend-up"
              value={holding.realizedCents + holding.realizedDayTradeCents}
              format={formatBRL}
              tone={
                holding.realizedCents + holding.realizedDayTradeCents < 0
                  ? 'loss'
                  : holding.realizedCents + holding.realizedDayTradeCents > 0
                    ? 'gain'
                    : 'default'
              }
              hint={holding.realizedDayTradeCents !== 0 ? 'Inclui day trade' : undefined}
            />
          </AppCard>
        </AppCol>
      </AppRow>
      {points.length <= 1 && (
        <AppCard aria-label="Evolução do preço médio" padding="lg">
          <AppEmpty
            icon="chart"
            title="A evolução do preço médio aparece a partir da 2ª operação"
            description={`Registre outra compra ou venda de ${holding.ticker} para acompanhar o preço médio.`}
          />
        </AppCard>
      )}
      {points.length > 1 && (
        <AppLineChart
          title="Evolução do preço médio"
          description={`Preço médio de ${holding.ticker} após cada operação, de ${points[0]?.detail ?? ''} a ${points[points.length - 1]?.detail ?? ''}.`}
          categories={points.map((point) => point.label)}
          tooltipTitles={points.map((point) => point.detail)}
          name="Preço médio"
          values={points.map((point) => point.value)}
          formatValue={asBRL}
          formatAxis={formatAxisBRL}
          table={{
            head: ['Data', 'Preço médio'],
            rows: points.map((point) => [
              point.detail,
              <AppText key="v" mono>
                {asBRL(point.value)}
              </AppText>,
            ]),
          }}
        />
      )}
      <section aria-labelledby="historico">
        <AppCard>
          <AppTitle level={3} id="historico">
            Histórico de operações
          </AppTitle>
          <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
            {[...holding.operations].reverse().map((operation) => (
              <li
                key={operation.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: `1px solid ${colors.borderSoft}`,
                }}
              >
                <div>
                  <AppText strong block>
                    {operation.side === 'BUY' ? 'Compra' : 'Venda'}
                    {operation.category === 'DAY_TRADE' && ' (day trade)'}
                  </AppText>
                  <AppText type="secondary" mono size="sm">
                    {formatDate(operation.date)}
                  </AppText>
                </div>
                <AppText mono>
                  {operation.quantity} × {formatBRL(operation.unitPriceCents)}
                </AppText>
              </li>
            ))}
          </ul>
        </AppCard>
      </section>
    </AppStack>
  );
}

export function AssetPage() {
  const { ticker = '' } = useParams();
  return (
    <DataGate>
      <AssetContent ticker={ticker} />
    </DataGate>
  );
}
