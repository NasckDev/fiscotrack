import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Operation } from '@fiscotrack/engine';
import { createIndexedDbRepository } from '../src/storage/operationsRepository';

const op = (id: string, seq = 1): Operation => ({
  id,
  seq,
  date: '2026-01-10',
  ticker: 'PETR4',
  side: 'BUY',
  quantity: 10,
  unitPriceCents: 3000,
  feesCents: 0,
  category: 'SWING',
});

beforeEach(() => {
  // Banco novo a cada teste.
  globalThis.indexedDB = new IDBFactory();
});

describe('repositório IndexedDB', () => {
  it('grava, atualiza pelo id, remove e limpa tudo', async () => {
    const repository = createIndexedDbRepository();
    await repository.addMany([op('a'), op('b')]);
    await repository.addMany([{ ...op('a'), quantity: 99 }]);
    expect((await repository.list()).find((item) => item.id === 'a')?.quantity).toBe(99);
    await repository.removeMany(['a']);
    expect((await repository.list()).map((item) => item.id)).toEqual(['b']);
    await repository.markPaid('2026-01', 12345);
    await repository.clear();
    expect(await repository.list()).toEqual([]);
    expect(await repository.listPaid()).toEqual([]);
  });

  it('guarda o valor pago e lê marcas antigas (sem valor) como null', async () => {
    const legacy = await openDB('fiscotrack', 2, {
      upgrade(db) {
        db.createObjectStore('operations', { keyPath: 'id' });
        db.createObjectStore('paid', { keyPath: 'month' });
      },
    });
    await legacy.put('paid', { month: '2025-12' });
    legacy.close();
    const repository = createIndexedDbRepository();
    await repository.markPaid('2026-01', 500);
    expect(await repository.listPaid()).toEqual([
      { month: '2025-12', amountCents: null },
      { month: '2026-01', amountCents: 500 },
    ]);
  });

  it('replaceAll troca tudo de forma atômica e mergeAll só acrescenta', async () => {
    const repository = createIndexedDbRepository();
    await repository.addMany([op('velha')]);
    await repository.markPaid('2026-01', 1);
    await repository.replaceAll([op('nova')], [{ month: '2026-02', amountCents: 2 }]);
    expect((await repository.list()).map((item) => item.id)).toEqual(['nova']);
    expect(await repository.listPaid()).toEqual([{ month: '2026-02', amountCents: 2 }]);

    await repository.mergeAll(
      [op('volta')],
      [
        { month: '2026-02', amountCents: 999 },
        { month: '2026-03', amountCents: 3 },
      ],
    );
    expect((await repository.list()).map((item) => item.id).sort()).toEqual(['nova', 'volta']);
    expect(await repository.listPaid()).toEqual([
      { month: '2026-02', amountCents: 2 },
      { month: '2026-03', amountCents: 3 },
    ]);
  });

  it('tenta abrir o banco de novo depois de uma falha (o erro não fica em cache)', async () => {
    let attempts = 0;
    const real = globalThis.indexedDB;
    globalThis.indexedDB = {
      open: (...args: Parameters<IDBFactory['open']>) => {
        attempts += 1;
        if (attempts === 1) throw new DOMException('bloqueado', 'SecurityError');
        return real.open(...args);
      },
    } as unknown as IDBFactory;
    const repository = createIndexedDbRepository();
    await expect(repository.list()).rejects.toThrow();
    await expect(repository.list()).resolves.toEqual([]);
    expect(attempts).toBe(2);
  });
});
