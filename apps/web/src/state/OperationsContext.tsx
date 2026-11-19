import type { Operation } from '@fiscotrack/engine';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { OperationsRepository } from '../storage/operationsRepository';

export type LoadStatus = 'loading' | 'ready' | 'error';

interface OperationsState {
  readonly status: LoadStatus;
  readonly operations: readonly Operation[];
  readonly errorMessage: string | null;
}

export interface OperationsContextValue extends OperationsState {
  addMany(operations: readonly Operation[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  reload(): Promise<void>;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido ao acessar os dados locais.';
}

interface OperationsProviderProps {
  readonly repository: OperationsRepository;
  readonly children: ReactNode;
}

export function OperationsProvider({ repository, children }: OperationsProviderProps) {
  const [state, setState] = useState<OperationsState>({
    status: 'loading',
    operations: [],
    errorMessage: null,
  });

  const reload = useCallback(async () => {
    try {
      const operations = await repository.list();
      setState({ status: 'ready', operations, errorMessage: null });
    } catch (error: unknown) {
      setState({ status: 'error', operations: [], errorMessage: messageOf(error) });
    }
  }, [repository]);

  useEffect(() => {
    let cancelled = false;
    repository.list().then(
      (operations) => {
        if (!cancelled) setState({ status: 'ready', operations, errorMessage: null });
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', operations: [], errorMessage: messageOf(error) });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const mutate = useCallback(
    async (action: () => Promise<void>) => {
      await action();
      await reload();
    },
    [reload],
  );

  const value = useMemo<OperationsContextValue>(
    () => ({
      ...state,
      reload,
      addMany: (operations) => mutate(() => repository.addMany(operations)),
      remove: (id) => mutate(() => repository.remove(id)),
      clear: () => mutate(() => repository.clear()),
    }),
    [state, reload, mutate, repository],
  );

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations(): OperationsContextValue {
  const context = useContext(OperationsContext);
  if (context === null) throw new Error('useOperations precisa de <OperationsProvider>.');
  return context;
}
