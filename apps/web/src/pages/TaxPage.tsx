import { DataGate } from '../components/DataGate';
import { MonthCard } from '../components/MonthCard';
import { PageHeader } from '../components/PageHeader';
import { PartialNotice } from '../components/PartialNotice';
import { plural } from '../domain/format';
import { useFinance } from '../state/useFinance';
import { AppStack } from '../ui';

function TaxContent() {
  const { report } = useFinance();
  const months = [...report.months].reverse();

  return (
    <AppStack>
      <PageHeader
        title="Apuração mensal"
        trail={[]}
        description={`${plural(months.length, 'mês apurado', 'meses apurados')} · operações comuns separadas de day trade, com a conta explicada passo a passo`}
      />
      <PartialNotice report={report} />
      <section aria-label="Resultados por mês">
        <AppStack>
          {months.map((month) => (
            <MonthCard key={month.month} month={month} />
          ))}
        </AppStack>
      </section>
    </AppStack>
  );
}

export function TaxPage() {
  return (
    <DataGate>
      <TaxContent />
    </DataGate>
  );
}
