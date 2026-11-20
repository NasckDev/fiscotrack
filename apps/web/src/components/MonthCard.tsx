import {
  BR_RENDA_VARIAVEL_RULESETS,
  formatBRL,
  type CategoryResult,
  type ExplanationStep,
  type MonthlyResult,
} from '@fiscotrack/engine';
import { Link } from 'react-router';
import { formatMonthTitle } from '../domain/format';
import { monthResultCents, monthStatus } from '../domain/monthStatus';
import { Icon } from './Icon';
import { Money, StatusBadge } from './ui';

const SOURCES = new Map(
  BR_RENDA_VARIAVEL_RULESETS.flatMap((ruleSet) => ruleSet.sources).map((s) => [s.id, s]),
);

const CATEGORY_LABEL: Record<ExplanationStep['category'], string> = {
  SWING: 'Operações comuns',
  DAY_TRADE: 'Day trade',
  TOTAL: 'Total do mês',
};

/** "Lei nº 11.033/2004 — isenção…" → "Lei nº 11.033/2004". */
function shortSourceTitle(title: string): string {
  return title.split(' — ')[0] ?? title;
}

function StepItem({ step, index }: { readonly step: ExplanationStep; readonly index: number }) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      <span
        aria-hidden="true"
        className="relative z-10 flex size-6 flex-none items-center justify-center rounded-full bg-accent-surface text-xs font-bold text-accent"
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold leading-snug">{step.title}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">{CATEGORY_LABEL[step.category]}</p>
          </div>
          {step.kind !== 'EXEMPTION' && (
            <Money
              cents={step.amountCents}
              signed={step.kind === 'GROSS_RESULT'}
              className="flex-none text-sm font-semibold"
            />
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{step.detail}</p>
        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {step.sourceIds.map((id) => {
            const source = SOURCES.get(id);
            return source ? (
              <li key={id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={source.title}
                  className="link inline-flex items-center gap-1"
                >
                  Fonte: {shortSourceTitle(source.title)}
                  <Icon name="external" size={12} />
                </a>
              </li>
            ) : null;
          })}
        </ul>
      </div>
    </li>
  );
}

function ExemptionBar({ swing, limitCents }: { swing: CategoryResult; limitCents: number }) {
  const ratio = limitCents === 0 ? 0 : swing.salesTotalCents / limitCents;
  const exceeded = swing.salesTotalCents > limitCents;
  const width = Math.min(ratio, 1) * 100;
  const percent = Math.round(ratio * 100);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
        <span className="font-semibold">Isenção de vendas (operações comuns)</span>
        <span className="num text-muted">
          {formatBRL(swing.salesTotalCents)} de {formatBRL(limitCents)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Uso do limite mensal de isenção"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent, 100)}
        aria-valuetext={`${percent}% do limite de isenção${exceeded ? ', limite ultrapassado' : ''}`}
        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-skeleton"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${width}%`,
            background: exceeded ? 'var(--ft-chart-darf)' : 'var(--ft-chart-gain)',
          }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {exceeded
          ? 'Limite ultrapassado: o lucro do mês é tributado.'
          : `${percent}% do limite usado: lucros de operações comuns ficam isentos.`}
      </p>
    </div>
  );
}

function CategoryColumn({ label, result }: { label: string; result: CategoryResult }) {
  return (
    <div className="card-subtle p-4">
      <p className="text-xs font-bold text-muted">{label}</p>
      <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Resultado</dt>
          <dd className="font-semibold">
            <Money cents={result.grossResultCents} signed />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Imposto</dt>
          <dd className="font-semibold">
            <Money cents={result.taxCents} />
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted">Prejuízo a compensar</dt>
          <dd className="font-semibold">
            <Money cents={result.lossAfterCents} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function MonthCard({ month }: { readonly month: MonthlyResult }) {
  const status = monthStatus(month);
  const headingId = `mes-${month.month}`;
  const limitCents =
    BR_RENDA_VARIAVEL_RULESETS.find((ruleSet) => ruleSet.id === month.ruleSetId)
      ?.swingExemptionSalesLimitCents ?? 0;

  return (
    <article className="card overflow-hidden" aria-labelledby={headingId}>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id={headingId} className="text-lg font-extrabold">
            {formatMonthTitle(month.month)}
          </h3>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted">Resultado do mês</dt>
            <dd className="text-xl font-bold">
              <Money cents={monthResultCents(month)} signed />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">DARF estimado</dt>
            <dd className="text-xl font-bold">
              <Money cents={month.darfDueCents} />
            </dd>
          </div>
        </dl>
        {month.swing.salesTotalCents > 0 && (
          <ExemptionBar swing={month.swing} limitCents={limitCents} />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <CategoryColumn label="Operações comuns" result={month.swing} />
          <CategoryColumn label="Day trade" result={month.dayTrade} />
        </div>
      </div>
      <details className="border-t border-line-soft">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-accent hover:bg-card-subtle sm:px-5">
          Por que deu esse valor?
          <Icon name="chevron-down" size={18} className="chevron" />
        </summary>
        <div className="px-4 pt-2 pb-5 sm:px-5">
          <ol className="relative before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-line-soft">
            {month.steps.map((step, index) => (
              <StepItem key={`${step.kind}-${step.category}-${index}`} step={step} index={index} />
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">
            Regras aplicadas: {month.ruleSetId}.{' '}
            <Link to="/regras" className="link">
              Ver premissas
            </Link>
          </p>
        </div>
      </details>
    </article>
  );
}
