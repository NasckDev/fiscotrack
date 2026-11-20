import {
  BR_RENDA_VARIAVEL_RULESETS,
  formatBRL,
  type CategoryResult,
  type ExplanationStep,
  type MonthlyResult,
} from '@fiscotrack/engine';
import { formatMonthTitle } from '../domain/format';
import { monthResultCents, monthStatus } from '../domain/monthStatus';
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
  AppSteps,
  AppText,
  AppTitle,
} from '../ui';

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

function StepDescription({ step }: { readonly step: ExplanationStep }) {
  return (
    <AppFlex vertical gap="small">
      <AppText type="secondary">{CATEGORY_LABEL[step.category]}</AppText>
      <AppText>{step.detail}</AppText>
      <AppFlex wrap gap="middle">
        {step.sourceIds.map((id) => {
          const source = SOURCES.get(id);
          return source ? (
            <AppLink key={id} href={source.url} title={source.title}>
              Fonte: {shortSourceTitle(source.title)} <AppIcon name="external" />
            </AppLink>
          ) : null;
        })}
      </AppFlex>
    </AppFlex>
  );
}

function ExplanationSteps({ month }: { readonly month: MonthlyResult }) {
  return (
    <AppFlex vertical gap="middle">
      <AppSteps
        vertical
        aria-label={`Passo a passo de ${formatMonthTitle(month.month)}`}
        current={month.steps.length}
        items={month.steps.map((step) => ({
          status: 'process' as const,
          title: (
            <AppFlex gap="middle" justify="space-between" wrap>
              <span>{step.title}</span>
              {step.kind !== 'EXEMPTION' && (
                <AppMoney cents={step.amountCents} signed={step.kind === 'GROSS_RESULT'} strong />
              )}
            </AppFlex>
          ),
          description: <StepDescription step={step} />,
        }))}
      />
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
