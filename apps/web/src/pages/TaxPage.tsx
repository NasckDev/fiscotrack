import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { DataGate } from '../components/DataGate';
import { MonthCard } from '../components/MonthCard';
import { PageHeader } from '../components/PageHeader';
import { PartialNotice } from '../components/PartialNotice';
import { plural } from '../domain/format';
import { useFinance } from '../state/useFinance';
import { AppStack } from '../ui';

/** `?mes=AAAA-MM` (seletor de mês da barra superior): rola até o mês e põe o foco no título. */
function useScrollToMonth(available: readonly string[]) {
  const [params] = useSearchParams();
  const requested = params.get('mes');
  const isAvailable = requested !== null && available.includes(requested);
  useEffect(() => {
    if (!isAvailable) return;
    const frame = window.requestAnimationFrame(() => {
      const heading = document.getElementById(`mes-${requested}`);
      if (heading === null) return;
      heading.setAttribute('tabindex', '-1');
      heading.scrollIntoView?.({ block: 'start' });
      heading.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [requested, isAvailable]);
}

function TaxContent() {
  const { report } = useFinance();
  const months = [...report.months].reverse();
  useScrollToMonth(months.map((month) => month.month));

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
