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

interface DataState {
  readonly status: LoadStatus;
  readonly operations: readonly Operation[];
  readonly paidMonths: ReadonlySet<string>;
  readonly errorMessage: string | null;
}

export interface OperationsContextValue extends DataState {
  /** Insere ou atualiza (pelo id). */
  addMany(operations: readonly Operation[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  setDarfPaid(month: string, paid: boolean): Promise<void>;
  restore(operations: readonly Operation[], paidMonths: readonly string[]): Promise<void>;
  reload(): Promise<void>;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido ao acessar os dados locais.';
}

const INITIAL_STATE: DataState = {
  status: 'loading',
  operations: [],
  paidMonths: new Set(),
  errorMessage: null,
};

async function readAll(repository: OperationsRepository): Promise<DataState> {
  const [operations, paid] = await Promise.all([repository.list(), repository.listPaid()]);
  return { status: 'ready', operations, paidMonths: new Set(paid), errorMessage: null };
}

function failure(error: unknown): DataState {
  return { ...INITIAL_STATE, status: 'error', errorMessage: messageOf(error) };
}

interface OperationsProviderProps {
  readonly repository: OperationsRepository;
  readonly children: ReactNode;
}

export function OperationsProvider({ repository, children }: OperationsProviderProps) {
  const [state, setState] = useState<DataState>(INITIAL_STATE);

  const reload = useCallback(async () => {
    try {
      setState(await readAll(repository));
    } catch (error: unknown) {
      setState(failure(error));
    }
  }, [repository]);

  useEffect(() => {
    let cancelled = false;
    readAll(repository).then(
      (next) => {
        if (!cancelled) setState(next);
      },
      (error: unknown) => {
        if (!cancelled) setState(failure(error));
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
      setDarfPaid: (month, paid) => mutate(() => repository.setPaid(month, paid)),
      restore: (operations, paidMonths) =>
        mutate(() => repository.replaceAll(operations, paidMonths)),
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
