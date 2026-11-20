import { formatBRL } from '@fiscotrack/engine';
import { Link, useNavigate } from 'react-router';
import { DataGate } from '../components/DataGate';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { Kpi, Money, PageHeader, StatusBadge } from '../components/ui';
import { plural } from '../domain/format';
import type { Holding } from '../domain/portfolio';
import { useFinance } from '../state/useFinance';

const priceOf = (cents: number) => formatBRL(Math.round(cents));

function HoldingsTable({ holdings }: { readonly holdings: readonly Holding[] }) {
  const navigate = useNavigate();
  return (
    <table className="hidden w-full text-left text-sm md:table">
      <caption className="sr-only">Posições da carteira</caption>
      <thead className="text-xs text-muted">
        <tr className="border-b border-line-soft">
          <th scope="col" className="px-5 py-3 font-medium">
            Ativo
          </th>
          <th scope="col" className="px-3 py-3 text-right font-medium">
            Quantidade
          </th>
          <th scope="col" className="px-3 py-3 text-right font-medium">
            Preço médio
          </th>
          <th scope="col" className="px-3 py-3 text-right font-medium">
            Custo total
          </th>
          <th scope="col" className="px-3 py-3 text-right font-medium">
            Resultado realizado (comum)
          </th>
          <th scope="col" className="px-3 py-3">
            <span className="sr-only">Detalhe</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((holding) => (
          <tr
            key={holding.ticker}
            className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-card-subtle"
            onClick={() => void navigate(`/carteira/${holding.ticker}`)}
          >
            <th scope="row" className="px-5 py-3 text-left">
              <Link to={`/carteira/${holding.ticker}`} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent-surface text-xs font-extrabold text-accent">
                  {holding.ticker.slice(0, 2)}
                </span>
                <span className="font-extrabold">{holding.ticker}</span>
                {holding.quantity === 0 && <StatusBadge tone="neutral">Encerrada</StatusBadge>}
              </Link>
            </th>
            <td className="num px-3 py-3 text-right">{holding.quantity}</td>
            <td className="num px-3 py-3 text-right">
              {holding.quantity > 0 ? priceOf(holding.avgPriceCents) : '—'}
            </td>
            <td className="px-3 py-3 text-right">
              <Money cents={holding.totalCostCents} />
            </td>
            <td className="px-3 py-3 text-right">
              <Money cents={holding.realizedCents} signed />
              {holding.realizedDayTradeCents !== 0 && (
                <span className="block text-xs text-muted">
                  + day trade <Money cents={holding.realizedDayTradeCents} signed />
                </span>
              )}
            </td>
            <td className="px-3 py-3 text-right text-muted">
              <Icon name="chevron-right" size={16} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HoldingCards({ holdings }: { readonly holdings: readonly Holding[] }) {
  return (
    <ul className="divide-y divide-line-soft md:hidden" aria-label="Posições da carteira">
      {holdings.map((holding) => (
        <li key={holding.ticker}>
          <Link
            to={`/carteira/${holding.ticker}`}
            className="flex min-h-16 items-center gap-3 px-4 py-3"
            aria-label={`${holding.ticker}, ${holding.quantity} ações`}
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-accent-surface text-xs font-extrabold text-accent">
              {holding.ticker.slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-extrabold">
                {holding.ticker}
                {holding.quantity === 0 && <StatusBadge tone="neutral">Encerrada</StatusBadge>}
              </span>
              <span className="num block text-xs text-muted">
                {holding.quantity} ×{' '}
                {holding.quantity > 0 ? priceOf(holding.avgPriceCents) : 'posição encerrada'}
              </span>
            </span>
            <span className="text-right">
              <Money cents={holding.totalCostCents} className="block text-sm font-semibold" />
              <Money cents={holding.realizedCents} signed className="block text-xs" />
            </span>
            <Icon name="chevron-right" size={16} className="text-muted" />
          </Link>
        </li>
      ))}
    </ul>
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
    <div className="space-y-4">
      <PageHeader
        title="Carteira"
        description={`${plural(open.length, 'ativo em carteira', 'ativos em carteira')} · preço médio calculado pelo mesmo motor da apuração`}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Reveal index={0}>
          <Kpi label="Patrimônio ao custo" icon="wallet" hint="Soma do custo das posições abertas">
            <Money cents={investedCents} />
          </Kpi>
        </Reveal>
        <Reveal index={1}>
          <Kpi
            label="Resultado realizado"
            icon="trend-up"
            hint="Comum e day trade, líquido de custos"
          >
            <Money cents={realized} signed />
          </Kpi>
        </Reveal>
        <Reveal index={2} className="col-span-2 sm:col-span-1">
          <Kpi label="Ativos negociados" icon="operations" hint="Inclui posições encerradas">
            <span className="num">{holdings.length}</span>
          </Kpi>
        </Reveal>
      </div>
      <Reveal index={3}>
        <section aria-label="Posições" className="card overflow-hidden">
          <HoldingsTable holdings={holdings} />
          <HoldingCards holdings={holdings} />
        </section>
      </Reveal>
      <p className="text-xs text-muted">
        Sem cotação de mercado: os valores usam o custo de aquisição (preço médio com custos de
        compra).
      </p>
    </div>
  );
}

export function PortfolioPage() {
  return (
    <DataGate>
      <PortfolioContent />
    </DataGate>
  );
}
