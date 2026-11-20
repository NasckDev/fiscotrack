import { BR_RENDA_VARIAVEL_RULESETS, formatBRL, formatRate } from '@fiscotrack/engine';
import { PageHeader } from '../components/PageHeader';
import { formatDate } from '../domain/format';
import {
  AppCard,
  AppCol,
  AppFlex,
  AppIcon,
  AppRow,
  AppStack,
  AppTag,
  AppText,
  AppTitle,
  useAppColors,
} from '../ui';

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <AppCard tone="subtle" fullHeight>
      <AppText type="secondary" size="sm" block>
        {label}
      </AppText>
      <AppText mono strong size="lg">
        {value}
      </AppText>
    </AppCard>
  );
}

export function RulesPage() {
  const colors = useAppColors();
  return (
    <AppStack>
      <PageHeader
        title="Regras e premissas"
        trail={[]}
        description="As regras são dados versionados por data de vigência. Cada conjunto lista as fontes oficiais e as premissas adotadas por este projeto educacional."
      />
      {BR_RENDA_VARIAVEL_RULESETS.map((ruleSet) => (
        <article key={ruleSet.id} aria-labelledby={`regra-${ruleSet.id}`}>
          <AppCard padding="lg">
            <AppStack gap="large">
              <AppFlex justify="space-between" align="flex-start" gap="middle" wrap>
                <div>
                  <AppTitle level={2} id={`regra-${ruleSet.id}`}>
                    {ruleSet.label}
                  </AppTitle>
                  <AppText type="secondary">
                    Vigência: {formatDate(ruleSet.validFrom)} até{' '}
                    {ruleSet.validTo === null ? 'hoje' : formatDate(ruleSet.validTo)}
                  </AppText>
                </div>
                <AppTag>{ruleSet.id}</AppTag>
              </AppFlex>
              <AppRow>
                <AppCol xs={12} lg={6}>
                  <Fact
                    label="Alíquota (operações comuns)"
                    value={formatRate(ruleSet.swingRateBps)}
                  />
                </AppCol>
                <AppCol xs={12} lg={6}>
                  <Fact label="Alíquota (day trade)" value={formatRate(ruleSet.dayTradeRateBps)} />
                </AppCol>
                <AppCol xs={12} lg={6}>
                  <Fact
                    label="Isenção mensal (vendas)"
                    value={formatBRL(ruleSet.swingExemptionSalesLimitCents)}
                  />
                </AppCol>
                <AppCol xs={12} lg={6}>
                  <Fact label="DARF mínimo" value={formatBRL(ruleSet.minimumDarfCents)} />
                </AppCol>
              </AppRow>
              <AppRow gutter="large">
                <AppCol xs={24} lg={12}>
                  <section aria-labelledby={`premissas-${ruleSet.id}`}>
                    <AppTitle level={3} id={`premissas-${ruleSet.id}`}>
                      Premissas
                    </AppTitle>
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: '12px 0 0',
                        padding: 0,
                        display: 'grid',
                        gap: 10,
                      }}
                    >
                      {ruleSet.assumptions.map((assumption) => (
                        <li key={assumption} style={{ display: 'flex', gap: 10 }}>
                          <span style={{ color: colors.gain, marginTop: 2 }}>
                            <AppIcon name="check" />
                          </span>
                          <AppText>{assumption}</AppText>
                        </li>
                      ))}
                    </ul>
                  </section>
                </AppCol>
                <AppCol xs={24} lg={12}>
                  <section aria-labelledby={`fontes-${ruleSet.id}`}>
                    <AppTitle level={3} id={`fontes-${ruleSet.id}`}>
                      Fontes
                    </AppTitle>
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: '12px 0 0',
                        padding: 0,
                        display: 'grid',
                        gap: 8,
                      }}
                    >
                      {ruleSet.sources.map((source) => (
                        <li key={source.id}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              minHeight: 44,
                              padding: '8px 12px',
                              borderRadius: 12,
                              border: `1px solid ${colors.borderSoft}`,
                              background: colors.bgSubtle,
                              color: colors.text,
                              textDecoration: 'none',
                            }}
                          >
                            <AppIcon name="file" />
                            <span style={{ flex: 1 }}>{source.title}</span>
                            <AppIcon name="external" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                </AppCol>
              </AppRow>
            </AppStack>
          </AppCard>
        </article>
      ))}
    </AppStack>
  );
}
