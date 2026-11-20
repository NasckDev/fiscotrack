import { BR_RENDA_VARIAVEL_RULESETS, formatBRL, formatRate } from '@fiscotrack/engine';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/ui';
import { formatDate } from '../domain/format';

function Fact({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="card-subtle p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num mt-1 text-lg font-semibold">{children}</dd>
    </div>
  );
}

export function RulesPage() {
  return (
    <div>
      <PageHeader
        title="Regras e premissas"
        description="As regras são dados versionados por data de vigência. Cada conjunto lista as fontes oficiais e as premissas adotadas por este projeto educacional."
      />
      <div className="space-y-5">
        {BR_RENDA_VARIAVEL_RULESETS.map((ruleSet) => (
          <article
            key={ruleSet.id}
            className="card overflow-hidden"
            aria-labelledby={`regra-${ruleSet.id}`}
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft p-5">
              <div className="min-w-0">
                <h2 id={`regra-${ruleSet.id}`} className="text-lg font-semibold">
                  {ruleSet.label}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Vigência: {formatDate(ruleSet.validFrom)} até{' '}
                  {ruleSet.validTo === null ? 'hoje' : formatDate(ruleSet.validTo)}
                </p>
              </div>
              <code className="badge badge-neutral">{ruleSet.id}</code>
            </header>
            <div className="space-y-6 p-5">
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Fact label="Alíquota (operações comuns)">{formatRate(ruleSet.swingRateBps)}</Fact>
                <Fact label="Alíquota (day trade)">{formatRate(ruleSet.dayTradeRateBps)}</Fact>
                <Fact label="Isenção mensal (vendas)">
                  {formatBRL(ruleSet.swingExemptionSalesLimitCents)}
                </Fact>
                <Fact label="DARF mínimo">{formatBRL(ruleSet.minimumDarfCents)}</Fact>
              </dl>
              <div className="grid gap-6 lg:grid-cols-2">
                <section aria-labelledby={`premissas-${ruleSet.id}`}>
                  <h3 id={`premissas-${ruleSet.id}`} className="eyebrow mb-3">
                    Premissas
                  </h3>
                  <ul className="space-y-2.5 text-sm">
                    {ruleSet.assumptions.map((assumption) => (
                      <li key={assumption} className="flex gap-2.5">
                        <Icon name="check" size={16} className="mt-0.5 flex-none text-accent" />
                        <span>{assumption}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby={`fontes-${ruleSet.id}`}>
                  <h3 id={`fontes-${ruleSet.id}`} className="eyebrow mb-3">
                    Fontes
                  </h3>
                  <ul className="space-y-2">
                    {ruleSet.sources.map((source) => (
                      <li key={source.id}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="card-subtle group flex items-start gap-3 p-3 text-sm transition-colors hover:border-line-strong"
                        >
                          <Icon name="file" size={18} className="mt-0.5 flex-none text-muted" />
                          <span className="min-w-0 flex-1">{source.title}</span>
                          <Icon
                            name="external"
                            size={14}
                            className="mt-1 flex-none text-muted group-hover:text-accent"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
