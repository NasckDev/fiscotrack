import { DataGate } from '../components/DataGate';
import { MonthCard } from '../components/MonthCard';
import { PartialNotice } from '../components/PartialNotice';
import { Reveal } from '../components/Reveal';
import { PageHeader } from '../components/ui';
import { plural } from '../domain/format';
import { useFinance } from '../state/useFinance';

function TaxContent() {
  const { report } = useFinance();
  const months = [...report.months].reverse();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Apuração mensal"
        description={`${plural(months.length, 'mês apurado', 'meses apurados')} · operações comuns separadas de day trade, com a conta explicada passo a passo`}
      />
      <PartialNotice report={report} />
      <section aria-label="Resultados por mês" className="space-y-4">
        {months.map((month, index) => (
          <Reveal key={month.month} index={index}>
            <MonthCard month={month} />
          </Reveal>
        ))}
      </section>
    </div>
  );
}

export function TaxPage() {
  return (
    <DataGate>
      <TaxContent />
    </DataGate>
  );
}
