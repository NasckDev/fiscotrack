import { calculateReport } from '@fiscotrack/engine';
import { useCallback, useState } from 'react';
import { buildDarfs, todayIso } from '../domain/darf';
import { buildExampleOperations } from '../domain/example';
import { useOperations } from './OperationsContext';

type LoaderState = 'idle' | 'working' | 'failed';

/**
 * Carrega operações fictícias ancoradas em hoje. DARFs que já venceram entram como pagos,
 * para o exemplo mostrar um histórico em dia e um DARF próximo de vencer.
 */
export function useExampleLoader() {
  const { addMany, setDarfPaid } = useOperations();
  const [state, setState] = useState<LoaderState>('idle');

  const load = useCallback(async (): Promise<boolean> => {
    setState('working');
    try {
      const operations = buildExampleOperations();
      await addMany(operations);
      const today = todayIso();
      const darfs = buildDarfs(calculateReport(operations).months, new Set());
      for (const entry of darfs.filter((darf) => darf.dueDate < today)) {
        await setDarfPaid(entry.month, true);
      }
      setState('idle');
      return true;
    } catch {
      setState('failed');
      return false;
    }
  }, [addMany, setDarfPaid]);

  return { load, isWorking: state === 'working', hasFailed: state === 'failed' };
}
