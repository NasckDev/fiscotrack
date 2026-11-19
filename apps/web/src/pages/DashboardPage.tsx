import {
  BR_RENDA_VARIAVEL_RULESETS,
  calculateReport,
  formatBRL,
  type ExplanationStep,
  type MonthlyResult,
} from '@fiscotrack/engine';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { MonthlyChart } from '../components/MonthlyChart';
import { formatMonth } from '../domain/format';
import { useOperations } from '../state/OperationsContext';

const SOURCES = new Map(
  BR_RENDA_VARIAVEL_RULESETS.flatMap((ruleSet) => ruleSet.sources).map((s) => [s.id, s]),
);

function StepItem({ step }: { readonly step: ExplanationStep }) {
  return (
    <li className="border-l-2 border-blue-500 pl-3">
      <p className="font-medium">{step.title}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300">{step.detail}</p>
      <ul className="mt-1 flex flex-wrap gap-2 text-xs">
        {step.sourceIds.map((id) => {
          const source = SOURCES.get(id);
          return source ? (
            <li key={id}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="link">
                Fonte: {source.title}
              </a>
            </li>
          ) : null;
        })}
      </ul>
    </li>
  );
}

function MonthCard({ month }: { readonly month: MonthlyResult }) {
  const result = month.swing.grossResultCents + month.dayTrade.grossResultCents;
  return (
    <article className="card" aria-labelledby={`mes-${month.month}`}>
      <h3 id={`mes-${month.month}`} className="text-lg font-semibold capitalize">
        {formatMonth(month.month)}
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-600 dark:text-slate-400">Resultado</dt>
          <dd className="font-semibold tabular-nums">{formatBRL(result)}</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-400">DARF estimado</dt>
          <dd className="font-semibold tabular-nums">{formatBRL(month.darfDueCents)}</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-400">Prejuízo a compensar (comum)</dt>
          <dd className="tabular-nums">{formatBRL(month.swing.lossAfterCents)}</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-400">Prejuízo a compensar (day trade)</dt>
          <dd className="tabular-nums">{formatBRL(month.dayTrade.lossAfterCents)}</dd>
        </div>
      </dl>
      <details className="mt-3">
        <summary className="cursor-pointer font-medium text-blue-700 dark:text-blue-300">
          Por que deu esse valor?
        </summary>
        <ol className="mt-2 space-y-3">
          {month.steps.map((step, index) => (
            <StepItem key={`${step.kind}-${step.category}-${index}`} step={step} />
          ))}
        </ol>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Regras aplicadas: {month.ruleSetId}.{' '}
          <Link to="/regras" className="link">
            Ver premissas
          </Link>
        </p>
      </details>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="card text-center">
      <h2 className="text-lg font-semibold">Nenhuma operação ainda</h2>
      <p className="mt-1 text-slate-700 dark:text-slate-300">
        Importe um CSV (há um arquivo de exemplo) ou lance uma operação manualmente.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to="/importar" className="btn-primary">
          Importar CSV
        </Link>
        <Link to="/operacoes" className="btn-secondary">
          Lançar operação
        </Link>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { status, operations, errorMessage, reload } = useOperations();
  const report = useMemo(() => calculateReport(operations), [operations]);

  if (status === 'loading') {
    return (
      <p role="status" aria-live="polite">
        Carregando operações salvas neste navegador…
      </p>
    );
  }
  if (status === 'error') {
    return (
      <div role="alert" className="card border-red-500">
        <p>Não foi possível ler os dados locais: {errorMessage}</p>
        <button type="button" className="btn-secondary mt-2" onClick={() => void reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }
  if (operations.length === 0) return <EmptyState />;

  const totalDarf = report.months.reduce((sum, month) => sum + month.darfDueCents, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Painel mensal</h2>
      {report.issues.length > 0 && (
        <div role="alert" className="card border-amber-500">
          <p className="font-semibold">
            Resultado parcial: {report.issues.length} operação(ões) ignorada(s).
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {report.issues.map((issue) => (
              <li key={issue.operationId}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}
      <p>
        {operations.length} operações · DARF estimado no período:{' '}
        <strong className="tabular-nums">{formatBRL(totalDarf)}</strong>
      </p>
      <MonthlyChart months={report.months} />
      <section aria-label="Resultados por mês" className="space-y-3">
        {report.months.map((month) => (
          <MonthCard key={month.month} month={month} />
        ))}
      </section>
    </div>
  );
}
