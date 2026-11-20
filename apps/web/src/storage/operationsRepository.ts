import type { Operation } from '@fiscotrack/engine';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/** Persistência de operações e de DARFs pagos. Os dados ficam só no navegador do usuário. */
export interface OperationsRepository {
  list(): Promise<readonly Operation[]>;
  /** Insere ou atualiza (pelo id). */
  addMany(operations: readonly Operation[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  /** Meses (AAAA-MM) cujo DARF o usuário marcou como pago. */
  listPaid(): Promise<readonly string[]>;
  setPaid(month: string, paid: boolean): Promise<void>;
  /** Troca todo o conteúdo (restauração de backup). */
  replaceAll(operations: readonly Operation[], paidMonths: readonly string[]): Promise<void>;
}

interface FiscoTrackDB extends DBSchema {
  operations: { key: string; value: Operation };
  paid: { key: string; value: { month: string } };
}

const DB_NAME = 'fiscotrack';
const DB_VERSION = 2;

function openDatabase(): Promise<IDBPDatabase<FiscoTrackDB>> {
  return openDB<FiscoTrackDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('operations')) {
        db.createObjectStore('operations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('paid')) {
        db.createObjectStore('paid', { keyPath: 'month' });
      }
    },
  });
}

export function createIndexedDbRepository(): OperationsRepository {
  const dbPromise = openDatabase();
  return {
    async list() {
      const db = await dbPromise;
      return db.getAll('operations');
    },
    async addMany(operations) {
      const db = await dbPromise;
      const tx = db.transaction('operations', 'readwrite');
      await Promise.all([...operations.map((operation) => tx.store.put(operation)), tx.done]);
    },
    async remove(id) {
      const db = await dbPromise;
      await db.delete('operations', id);
    },
    async clear() {
      const db = await dbPromise;
      const tx = db.transaction(['operations', 'paid'], 'readwrite');
      await Promise.all([
        tx.objectStore('operations').clear(),
        tx.objectStore('paid').clear(),
        tx.done,
      ]);
    },
    async listPaid() {
      const db = await dbPromise;
      return (await db.getAll('paid')).map((entry) => entry.month);
    },
    async setPaid(month, paid) {
      const db = await dbPromise;
      if (paid) await db.put('paid', { month });
      else await db.delete('paid', month);
    },
    async replaceAll(operations, paidMonths) {
      const db = await dbPromise;
      const tx = db.transaction(['operations', 'paid'], 'readwrite');
      const operationStore = tx.objectStore('operations');
      const paidStore = tx.objectStore('paid');
      await Promise.all([operationStore.clear(), paidStore.clear()]);
      await Promise.all([
        ...operations.map((operation) => operationStore.put(operation)),
        ...paidMonths.map((month) => paidStore.put({ month })),
        tx.done,
      ]);
    },
  };
}

/** Implementação em memória, útil em testes e quando o IndexedDB não está disponível. */
export function createMemoryRepository(
  initial: readonly Operation[] = [],
  initialPaid: readonly string[] = [],
): OperationsRepository {
  let items: readonly Operation[] = initial;
  let paid: ReadonlySet<string> = new Set(initialPaid);
  return {
    list: () => Promise.resolve(items),
    addMany: (operations) => {
      const ids = new Set(operations.map((operation) => operation.id));
      items = [...items.filter((item) => !ids.has(item.id)), ...operations];
      return Promise.resolve();
    },
    remove: (id) => {
      items = items.filter((item) => item.id !== id);
      return Promise.resolve();
    },
    clear: () => {
      items = [];
      paid = new Set();
      return Promise.resolve();
    },
    listPaid: () => Promise.resolve([...paid]),
    setPaid: (month, isPaid) => {
      const next = new Set(paid);
      if (isPaid) next.add(month);
      else next.delete(month);
      paid = next;
      return Promise.resolve();
    },
    replaceAll: (operations, paidMonths) => {
      items = operations;
      paid = new Set(paidMonths);
      return Promise.resolve();
    },
  };
}
