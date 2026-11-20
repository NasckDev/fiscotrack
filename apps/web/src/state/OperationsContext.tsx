import type { Operation } from '@fiscotrack/engine';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PaidMark } from '../domain/darf';
import type { OperationsRepository } from '../storage/operationsRepository';

export type LoadStatus = 'loading' | 'ready' | 'error';

interface DataState {
  readonly status: LoadStatus;
  readonly operations: readonly Operation[];
  /** Mês (AAAA-MM) → valor do DARF no momento em que foi marcado como pago (null = dado antigo). */
  readonly paid: ReadonlyMap<string, number | null>;
  readonly errorMessage: string | null;
}

export interface OperationsContextValue extends DataState {
  /** Insere ou atualiza (pelo id). */
  addMany(operations: readonly Operation[]): Promise<void>;
  remove(id: string): Promise<void>;
  removeMany(ids: readonly string[]): Promise<void>;
  clear(): Promise<void>;
  markPaid(month: string, amountCents: number): Promise<void>;
  unmarkPaid(month: string): Promise<void>;
  /** Troca tudo (restauração de backup). */
  restore(operations: readonly Operation[], paid: readonly PaidMark[]): Promise<void>;
  /** Junta ao que existe sem apagar nada (desfazer "apagar tudo"). */
  merge(operations: readonly Operation[], paid: readonly PaidMark[]): Promise<void>;
  reload(): Promise<void>;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido ao acessar os dados locais.';
}

const INITIAL_STATE: DataState = {
  status: 'loading',
  operations: [],
  paid: new Map(),
  errorMessage: null,
};

async function readAll(repository: OperationsRepository): Promise<DataState> {
  const [operations, paidMarks] = await Promise.all([repository.list(), repository.listPaid()]);
  return {
    status: 'ready',
    operations,
    paid: new Map(paidMarks.map((mark) => [mark.month, mark.amountCents])),
    errorMessage: null,
  };
}

function failure(error: unknown): DataState {
  return { ...INITIAL_STATE, status: 'error', errorMessage: messageOf(error) };
}

/** Pede ao navegador que não despeje os dados locais (uma vez, depois da primeira gravação). */
function requestPersistence(): void {
  void navigator.storage?.persist?.().catch(() => undefined);
}

interface OperationsProviderProps {
  readonly repository: OperationsRepository;
  readonly children: ReactNode;
}

export function OperationsProvider({ repository, children }: OperationsProviderProps) {
  const [state, setState] = useState<DataState>(INITIAL_STATE);
  const channel = useRef<BroadcastChannel | null>(null);
  const persisted = useRef(false);

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

  // Sincroniza abas: uma gravação em outra aba dispara a releitura aqui.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const bc = new BroadcastChannel('fiscotrack');
    channel.current = bc;
    bc.onmessage = () => void reload();
    return () => {
      bc.close();
      channel.current = null;
    };
  }, [reload]);

  const mutate = useCallback(
    async (action: () => Promise<void>) => {
      await action();
      if (!persisted.current) {
        persisted.current = true;
        requestPersistence();
      }
      channel.current?.postMessage('changed');
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
      removeMany: (ids) => mutate(() => repository.removeMany(ids)),
      clear: () => mutate(() => repository.clear()),
      markPaid: (month, amountCents) => mutate(() => repository.markPaid(month, amountCents)),
      unmarkPaid: (month) => mutate(() => repository.unmarkPaid(month)),
      restore: (operations, paid) => mutate(() => repository.replaceAll(operations, paid)),
      merge: (operations, paid) => mutate(() => repository.mergeAll(operations, paid)),
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
