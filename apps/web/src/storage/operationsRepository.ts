import type { Operation } from '@fiscotrack/engine';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PaidMark } from '../domain/darf';

/** Persistência de operações e de DARFs pagos. Os dados ficam só no navegador do usuário. */
export interface OperationsRepository {
  list(): Promise<readonly Operation[]>;
  /** Insere ou atualiza (pelo id). */
  addMany(operations: readonly Operation[]): Promise<void>;
  remove(id: string): Promise<void>;
  removeMany(ids: readonly string[]): Promise<void>;
  /** Apaga operações e marcas de pagamento. */
  clear(): Promise<void>;
  listPaid(): Promise<readonly PaidMark[]>;
  markPaid(month: string, amountCents: number): Promise<void>;
  unmarkPaid(month: string): Promise<void>;
  /** Troca todo o conteúdo (restauração de backup). Atômico. */
  replaceAll(operations: readonly Operation[], paid: readonly PaidMark[]): Promise<void>;
  /** Junta operações e marcas ao que já existe, sem apagar nada (desfazer "apagar tudo"). */
  mergeAll(operations: readonly Operation[], paid: readonly PaidMark[]): Promise<void>;
}

interface FiscoTrackDB extends DBSchema {
  operations: { key: string; value: Operation };
  paid: { key: string; value: { month: string; amountCents?: number } };
}

const DB_NAME = 'fiscotrack';
const DB_VERSION = 2;

/** Evento global para avisar a interface de problemas de conexão com o banco. */
export const DB_ISSUE_EVENT = 'fiscotrack:db-issue';

function announce(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_ISSUE_EVENT, { detail: message }));
  }
}

export function createIndexedDbRepository(): OperationsRepository {
  let connection: Promise<IDBPDatabase<FiscoTrackDB>> | null = null;

  /** Abre sob demanda; se falhar, a próxima chamada tenta de novo (o erro não fica em cache). */
  const database = (): Promise<IDBPDatabase<FiscoTrackDB>> => {
    if (connection === null) {
      const opening = openDB<FiscoTrackDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('operations')) {
            db.createObjectStore('operations', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('paid')) {
            db.createObjectStore('paid', { keyPath: 'month' });
          }
        },
        blocked() {
          announce('Feche as outras abas do FiscoTrack para concluir a atualização dos dados.');
        },
        blocking() {
          connection = null;
          announce('O FiscoTrack foi atualizado em outra aba. Atualize a página.');
          void opening.then((db) => db.close());
        },
        terminated() {
          connection = null;
          announce('A conexão com os dados locais foi encerrada. Atualize a página.');
        },
      });
      connection = opening;
      opening.catch(() => {
        if (connection === opening) connection = null;
      });
    }
    return connection;
  };

  const toMark = (entry: { month: string; amountCents?: number }): PaidMark => ({
    month: entry.month,
    amountCents: entry.amountCents ?? null,
  });
  const toRecord = (mark: PaidMark) =>
    mark.amountCents === null
      ? { month: mark.month }
      : { month: mark.month, amountCents: mark.amountCents };

  return {
    async list() {
      return (await database()).getAll('operations');
    },
    async addMany(operations) {
      const tx = (await database()).transaction('operations', 'readwrite');
      await Promise.all([...operations.map((operation) => tx.store.put(operation)), tx.done]);
    },
    async remove(id) {
      await (await database()).delete('operations', id);
    },
    async removeMany(ids) {
      const tx = (await database()).transaction('operations', 'readwrite');
      await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
    },
    async clear() {
      const tx = (await database()).transaction(['operations', 'paid'], 'readwrite');
      await Promise.all([
        tx.objectStore('operations').clear(),
        tx.objectStore('paid').clear(),
        tx.done,
      ]);
    },
    async listPaid() {
      return (await (await database()).getAll('paid')).map(toMark);
    },
    async markPaid(month, amountCents) {
      await (await database()).put('paid', { month, amountCents });
    },
    async unmarkPaid(month) {
      await (await database()).delete('paid', month);
    },
    async replaceAll(operations, paid) {
      const tx = (await database()).transaction(['operations', 'paid'], 'readwrite');
      const operationStore = tx.objectStore('operations');
      const paidStore = tx.objectStore('paid');
      await Promise.all([operationStore.clear(), paidStore.clear()]);
      await Promise.all([
        ...operations.map((operation) => operationStore.put(operation)),
        ...paid.map((mark) => paidStore.put(toRecord(mark))),
        tx.done,
      ]);
    },
    async mergeAll(operations, paid) {
      const tx = (await database()).transaction(['operations', 'paid'], 'readwrite');
      const paidStore = tx.objectStore('paid');
      const existing = new Set(await paidStore.getAllKeys());
      await Promise.all([
        ...operations.map((operation) => tx.objectStore('operations').put(operation)),
        ...paid
          .filter((mark) => !existing.has(mark.month))
          .map((mark) => paidStore.put(toRecord(mark))),
        tx.done,
      ]);
    },
  };
}

/** Implementação em memória, útil em testes e quando o IndexedDB não está disponível. */
export function createMemoryRepository(
  initial: readonly Operation[] = [],
  initialPaid: readonly PaidMark[] = [],
): OperationsRepository {
  let items: readonly Operation[] = initial;
  let paid = new Map<string, number | null>(
    initialPaid.map((mark) => [mark.month, mark.amountCents]),
  );
  const upsert = (operations: readonly Operation[]) => {
    const ids = new Set(operations.map((operation) => operation.id));
    items = [...items.filter((item) => !ids.has(item.id)), ...operations];
  };
  return {
    list: () => Promise.resolve(items),
    addMany: (operations) => {
      upsert(operations);
      return Promise.resolve();
    },
    remove: (id) => {
      items = items.filter((item) => item.id !== id);
      return Promise.resolve();
    },
    removeMany: (ids) => {
      const drop = new Set(ids);
      items = items.filter((item) => !drop.has(item.id));
      return Promise.resolve();
    },
    clear: () => {
      items = [];
      paid = new Map();
      return Promise.resolve();
    },
    listPaid: () =>
      Promise.resolve([...paid].map(([month, amountCents]) => ({ month, amountCents }))),
    markPaid: (month, amountCents) => {
      paid = new Map(paid).set(month, amountCents);
      return Promise.resolve();
    },
    unmarkPaid: (month) => {
      const next = new Map(paid);
      next.delete(month);
      paid = next;
      return Promise.resolve();
    },
    replaceAll: (operations, marks) => {
      items = operations;
      paid = new Map(marks.map((mark) => [mark.month, mark.amountCents]));
      return Promise.resolve();
    },
    mergeAll: (operations, marks) => {
      upsert(operations);
      const next = new Map(paid);
      for (const mark of marks) if (!next.has(mark.month)) next.set(mark.month, mark.amountCents);
      paid = next;
      return Promise.resolve();
    },
  };
}
