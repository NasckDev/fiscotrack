import { formatBRL } from '@fiscotrack/engine';
import { Link, useParams } from 'react-router';
import { LineSeries } from '../components/charts/LineSeries';
import { DataGate } from '../components/DataGate';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { Kpi, Money, PageHeader, StatusBadge } from '../components/ui';
import { formatDate, formatDateShort } from '../domain/format';
import { useFinance } from '../state/useFinance';

const priceOf = (cents: number) => formatBRL(Math.round(cents));

function AssetContent({ ticker }: { readonly ticker: string }) {
  const { holdings } = useFinance();
  const holding = holdings.find((item) => item.ticker === ticker.toUpperCase());

  if (holding === undefined) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <h2 className="text-xl font-extrabold">Ativo não encontrado</h2>
        <p className="mt-1 text-muted">
          Não há operações de {ticker.toUpperCase()} neste navegador.
        </p>
        <Link to="/carteira" className="btn btn-primary mt-5">
          Voltar à carteira
        </Link>
      </div>
    );
  }

  const points = holding.history.map((point) => ({
    label: formatDateShort(point.date),
    detail: formatDate(point.date),
    value: point.avgPriceCents / 100,
  }));

  return (
    <div className="space-y-4">
      <Link to="/carteira" className="btn btn-ghost -ml-3 w-fit">
        <Icon name="arrow-left" size={16} />
        Carteira
      </Link>
      <PageHeader
        title={holding.ticker}
        description={
          holding.quantity > 0 ? `${holding.quantity} ações em carteira` : 'Posição encerrada'
        }
        actions={
          holding.quantity === 0 ? <StatusBadge tone="neutral">Encerrada</StatusBadge> : undefined
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Reveal index={0}>
          <Kpi label="Preço médio" icon="calculator">
            {holding.quantity > 0 ? (
              <span className="num">{priceOf(holding.avgPriceCents)}</span>
            ) : (
              '—'
            )}
          </Kpi>
        </Reveal>
        <Reveal index={1}>
          <Kpi label="Quantidade" icon="wallet">
            <span className="num">{holding.quantity}</span>
          </Kpi>
        </Reveal>
        <Reveal index={2}>
          <Kpi label="Custo total" icon="receipt">
            <Money cents={holding.totalCostCents} />
          </Kpi>
        </Reveal>
        <Reveal index={3}>
          <Kpi label="Resultado realizado" icon="trend-up">
            <Money cents={holding.realizedCents} signed />
          </Kpi>
        </Reveal>
      </div>
      {points.length > 1 && (
        <Reveal index={4}>
          <LineSeries
            title="Evolução do preço médio"
            description={`Preço médio de ${holding.ticker} após cada operação, de ${points[0]?.detail ?? ''} a ${
              points[points.length - 1]?.detail ?? ''
            }.`}
            seriesLabel="Preço médio"
            points={points}
            formatValue={(value) => formatBRL(Math.round(value * 100))}
            table={{
              head: ['Data', 'Preço médio'],
              rows: points.map((point) => [
                point.detail,
                <span key="v" className="num">
                  {formatBRL(Math.round(point.value * 100))}
                </span>,
              ]),
            }}
          />
        </Reveal>
      )}
      <Reveal index={5}>
        <section aria-labelledby="historico" className="card p-4 sm:p-5">
          <h3 id="historico" className="mb-3 text-base font-bold">
            Histórico de operações
          </h3>
          <ul className="divide-y divide-line-soft">
            {[...holding.operations].reverse().map((operation) => (
              <li key={operation.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold">
                    {operation.side === 'BUY' ? 'Compra' : 'Venda'}
                    {operation.category === 'DAY_TRADE' && ' (day trade)'}
                  </p>
                  <p className="num text-xs text-muted">{formatDate(operation.date)}</p>
                </div>
                <p className="num text-right text-sm">
                  {operation.quantity} × {formatBRL(operation.unitPriceCents)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
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
