import { BR_RENDA_VARIAVEL_RULESETS, formatBRL, formatRate } from '@fiscotrack/engine';

export function RulesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Regras e premissas</h2>
      <p className="text-slate-700 dark:text-slate-300">
        As regras são dados versionados por data de vigência. Cada conjunto lista as fontes oficiais
        e as premissas adotadas por este projeto educacional.
      </p>
      {BR_RENDA_VARIAVEL_RULESETS.map((ruleSet) => (
        <article key={ruleSet.id} className="card space-y-3">
          <h3 className="text-lg font-semibold">{ruleSet.label}</h3>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Vigência</dt>
              <dd>
                {ruleSet.validFrom} até {ruleSet.validTo ?? 'hoje'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Alíquotas</dt>
              <dd>
                {formatRate(ruleSet.swingRateBps)} comum · {formatRate(ruleSet.dayTradeRateBps)} day
                trade
              </dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Isenção mensal (vendas)</dt>
              <dd>{formatBRL(ruleSet.swingExemptionSalesLimitCents)}</dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">DARF mínimo</dt>
              <dd>{formatBRL(ruleSet.minimumDarfCents)}</dd>
            </div>
          </dl>
          <h4 className="font-semibold">Premissas</h4>
          <ul className="list-disc pl-5 text-sm">
            {ruleSet.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
          <h4 className="font-semibold">Fontes</h4>
          <ul className="list-disc pl-5 text-sm">
            {ruleSet.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="link">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
