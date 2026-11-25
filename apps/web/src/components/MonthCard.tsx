import {
  BR_RENDA_VARIAVEL_RULESETS,
  formatBRL,
  type CategoryResult,
  type ExplanationStep,
  type MonthlyResult,
} from '@fiscotrack/engine';
import { formatMonthTitle } from '../domain/format';
import { monthResultCents, monthStatus } from '../domain/monthStatus';
import { shortSourceTitle } from '../domain/receipt';
import {
  AppCard,
  AppCol,
  AppCollapse,
  AppFlex,
  AppIcon,
  AppLink,
  AppMoney,
  AppProgress,
  AppRow,
  AppStatus,
  AppText,
  AppTitle,
  useAppColors,
} from '../ui';

const SOURCES = new Map(
  BR_RENDA_VARIAVEL_RULESETS.flatMap((ruleSet) => ruleSet.sources).map((s) => [s.id, s]),
);

const CATEGORY_LABEL: Record<ExplanationStep['category'], string> = {
  SWING: 'Operações comuns',
  DAY_TRADE: 'Day trade',
  TOTAL: 'Total do mês',
};

const TOTAL_KINDS: ReadonlySet<ExplanationStep['kind']> = new Set(['DARF_DUE', 'DARF_MINIMUM']);

function StepSources({ step }: { readonly step: ExplanationStep }) {
  const colors = useAppColors();
  return (
    <AppFlex wrap gap="small">
      {step.sourceIds.map((id) => {
        const source = SOURCES.get(id);
        return source ? (
          <a
            key={id}
            href={source.url}
            title={source.title}
            target="_blank"
            rel="noopener noreferrer"
            className="ft-chip"
            style={{ background: colors.bgSubtle, color: colors.text, gap: 6 }}
          >
            Fonte: {shortSourceTitle(source.title)} <AppIcon name="external" />
            <span className="sr-only"> (abre em outra aba)</span>
          </a>
        ) : null;
      })}
    </AppFlex>
  );
}

/** Passo a passo do motor em formato de recibo: separador tracejado e total em 800. */
function ExplanationSteps({ month }: { readonly month: MonthlyResult }) {
  const colors = useAppColors();
  return (
    <AppFlex vertical gap="middle">
      <ol
        aria-label={`Passo a passo de ${formatMonthTitle(month.month)}`}
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {month.steps.map((step, index) => {
          const isTotal = TOTAL_KINDS.has(step.kind);
          return (
            <li
              key={`${step.kind}-${step.category}-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                gap: '4px 12px',
                padding: isTotal ? '16px 0 4px' : '12px 0',
                borderBottom: isTotal ? 'none' : `1.5px dashed ${colors.borderSoft}`,
              }}
            >
              <span style={{ fontWeight: isTotal ? 800 : 700, fontSize: isTotal ? 18 : 15 }}>
                {step.title}
              </span>
              <span style={{ fontSize: isTotal ? 18 : 15, textAlign: 'right' }}>
                {step.kind !== 'EXEMPTION' && (
                  <AppMoney cents={step.amountCents} signed={step.kind === 'GROSS_RESULT'} strong />
                )}
              </span>
              <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 6 }}>
                <AppText type="secondary" size="sm">
                  {CATEGORY_LABEL[step.category]} · {step.detail}
                </AppText>
                <StepSources step={step} />
              </div>
            </li>
          );
        })}
      </ol>
      <AppText type="secondary" size="sm">
        Regras aplicadas: {month.ruleSetId}. <AppLink to="/regras">Ver premissas</AppLink>
      </AppText>
    </AppFlex>
  );
}

function ExemptionBar({
  swing,
  limitCents,
}: {
  readonly swing: CategoryResult;
  readonly limitCents: number;
}) {
  const ratio = limitCents === 0 ? 0 : swing.salesTotalCents / limitCents;
  const exceeded = swing.salesTotalCents > limitCents;
  const percent = Math.round(ratio * 100);
  return (
    <div>
      <AppFlex justify="space-between" wrap gap="small">
        <AppText strong>Isenção de vendas (operações comuns)</AppText>
        <AppText type="secondary" mono size="sm">
          {formatBRL(swing.salesTotalCents)} de {formatBRL(limitCents)}
        </AppText>
      </AppFlex>
      <AppProgress
        percent={ratio * 100}
        label="Uso do limite mensal de isenção"
        tone={exceeded ? 'darf' : 'gain'}
        valueText={`${percent}% do limite de isenção${exceeded ? ', limite ultrapassado' : ''}`}
      />
      <AppText type="secondary" size="sm">
        {exceeded
          ? 'Limite ultrapassado: o lucro do mês é tributado.'
          : `${percent}% do limite usado: lucros de operações comuns ficam isentos.`}
      </AppText>
    </div>
  );
}

function CategoryColumn({
  label,
  result,
}: {
  readonly label: string;
  readonly result: CategoryResult;
}) {
  return (
    <AppCard tone="subtle" fullHeight>
      <AppText strong type="secondary">
        {label}
      </AppText>
      <AppRow gutter="small">
        <AppCol span={12}>
          <AppText type="secondary" size="sm" block>
            Resultado
          </AppText>
          <AppMoney cents={result.grossResultCents} signed strong />
        </AppCol>
        <AppCol span={12}>
          <AppText type="secondary" size="sm" block>
            Imposto
          </AppText>
          <AppMoney cents={result.taxCents} strong />
        </AppCol>
        <AppCol span={24}>
          <AppText type="secondary" size="sm" block>
            Prejuízo a compensar
          </AppText>
          <AppMoney cents={result.lossAfterCents} strong />
        </AppCol>
      </AppRow>
    </AppCard>
  );
}

function isEmptyMonth(month: MonthlyResult): boolean {
  return (
    month.swing.salesTotalCents === 0 &&
    month.dayTrade.salesTotalCents === 0 &&
    monthResultCents(month) === 0 &&
    month.darfDueCents === 0 &&
    month.swing.lossAfterCents === 0 &&
    month.dayTrade.lossAfterCents === 0
  );
}

export function MonthCard({ month }: { readonly month: MonthlyResult }) {
  const headingId = `mes-${month.month}`;
  if (isEmptyMonth(month)) {
    return (
      <article aria-labelledby={headingId}>
        <AppCard>
          <AppFlex justify="space-between" align="center" gap="small" wrap>
            <AppTitle level={2} id={headingId}>
              {formatMonthTitle(month.month)}
            </AppTitle>
            <AppText type="secondary">Sem vendas, sem imposto</AppText>
          </AppFlex>
        </AppCard>
      </article>
    );
  }
  const status = monthStatus(month);
  const limitCents =
    BR_RENDA_VARIAVEL_RULESETS.find((ruleSet) => ruleSet.id === month.ruleSetId)
      ?.swingExemptionSalesLimitCents ?? 0;

  return (
    <article aria-labelledby={headingId}>
      <AppCard padding="lg">
        <AppFlex vertical gap="large">
          <AppFlex justify="space-between" align="center" gap="small" wrap>
            <AppTitle level={2} id={headingId}>
              {formatMonthTitle(month.month)}
            </AppTitle>
            <AppStatus tone={status.tone}>{status.label}</AppStatus>
          </AppFlex>
          <AppRow>
            <AppCol xs={12}>
              <AppText type="secondary" block>
                Resultado do mês
              </AppText>
              <AppMoney cents={monthResultCents(month)} signed strong size="lg" />
            </AppCol>
            <AppCol xs={12}>
              <AppText type="secondary" block>
                DARF estimado
              </AppText>
              <AppMoney cents={month.darfDueCents} strong size="lg" />
            </AppCol>
          </AppRow>
          {month.swing.salesTotalCents > 0 && (
            <ExemptionBar swing={month.swing} limitCents={limitCents} />
          )}
          <AppRow>
            <AppCol xs={24} md={12}>
              <CategoryColumn label="Operações comuns" result={month.swing} />
            </AppCol>
            <AppCol xs={24} md={12}>
              <CategoryColumn label="Day trade" result={month.dayTrade} />
            </AppCol>
          </AppRow>
          <AppCollapse
            items={[
              {
                key: 'why',
                label: 'Por que deu esse valor?',
                children: <ExplanationSteps month={month} />,
              },
            ]}
          />
        </AppFlex>
      </AppCard>
    </article>
  );
}
