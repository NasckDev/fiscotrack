import type { Operation } from '@fiscotrack/engine';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/** Persistência das operações. Os dados ficam só no navegador do usuário. */
export interface OperationsRepository {
  list(): Promise<readonly Operation[]>;
  addMany(operations: readonly Operation[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

interface FiscoTrackDB extends DBSchema {
  operations: { key: string; value: Operation };
}

const DB_NAME = 'fiscotrack';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBPDatabase<FiscoTrackDB>> {
  return openDB<FiscoTrackDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('operations', { keyPath: 'id' });
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
      await db.clear('operations');
    },
  };
}

/** Implementação em memória, útil em testes e quando o IndexedDB não está disponível. */
export function createMemoryRepository(initial: readonly Operation[] = []): OperationsRepository {
  let items: readonly Operation[] = initial;
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
      return Promise.resolve();
    },
  };
}
