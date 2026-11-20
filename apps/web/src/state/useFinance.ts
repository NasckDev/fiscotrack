import { calculateReport } from '@fiscotrack/engine';
import { useMemo } from 'react';
import { buildDarfs } from '../domain/darf';
import { buildPortfolio, totalInvestedCents } from '../domain/portfolio';
import { useOperations } from './OperationsContext';

/** Visão derivada dos dados: relatório do motor, carteira e DARFs (tudo calculado, nada salvo). */
export function useFinance() {
  const data = useOperations();
  const { operations, paidMonths } = data;
  const report = useMemo(() => calculateReport(operations), [operations]);
  const holdings = useMemo(() => buildPortfolio(operations), [operations]);
  const darfs = useMemo(() => buildDarfs(report.months, paidMonths), [report, paidMonths]);
  const investedCents = useMemo(() => totalInvestedCents(holdings), [holdings]);
  return { ...data, report, holdings, darfs, investedCents };
}
