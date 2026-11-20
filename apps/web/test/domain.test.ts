import { calculateReport } from '@fiscotrack/engine';
import { describe, expect, it } from 'vitest';
import { parseBackup, serializeBackup } from '../src/domain/backup';
import {
  applyMapping,
  missingRequired,
  readCsvTable,
  suggestMapping,
} from '../src/domain/csvMapping';
import { operationsToCsv } from '../src/domain/csvExport';
import { buildDarfs, darfDueDate, darfStatus, daysBetween, nextDarf } from '../src/domain/darf';
import { buildExampleOperations } from '../src/domain/example';
import { buildPortfolio, totalInvestedCents } from '../src/domain/portfolio';
import { parseOperationsCsv } from '../src/domain/csv';

const NOW = new Date(2026, 10, 19);

describe('darf', () => {
  it.each([
    ['2026-10', '2026-11-30'],
    ['2026-09', '2026-10-30'],
    ['2026-11', '2026-12-31'],
    ['2026-12', '2027-01-29'],
    ['2024-01', '2024-02-29'],
  ])('vencimento da apuração %s é %s (último dia útil do mês seguinte)', (month, expected) => {
    expect(darfDueDate(month)).toBe(expected);
  });

  it('conta dias entre datas', () => {
    expect(daysBetween('2026-11-19', '2026-11-30')).toBe(11);
    expect(daysBetween('2026-11-30', '2026-11-19')).toBe(-11);
  });

  it('classifica o status e escolhe o próximo DARF em aberto', () => {
    const entries = [
      { month: '2026-08', dueDate: '2026-09-30', amountCents: 100, paid: true },
      { month: '2026-09', dueDate: '2026-10-30', amountCents: 200, paid: false },
      { month: '2026-10', dueDate: '2026-11-30', amountCents: 300, paid: false },
    ];
    const today = '2026-11-25';
    expect(darfStatus(entries[0]!, today)).toBe('paid');
    expect(darfStatus(entries[1]!, today)).toBe('overdue');
    expect(darfStatus(entries[2]!, today)).toBe('due-soon');
    expect(nextDarf(entries)?.month).toBe('2026-09');
    expect(nextDarf([entries[0]!])).toBeNull();
  });
});

describe('exemplo', () => {
  const operations = buildExampleOperations(NOW);
  const report = calculateReport(operations);

  it('gera operações coerentes, sem pendências no cálculo', () => {
    expect(operations.length).toBeGreaterThan(10);
    expect(report.issues).toEqual([]);
    expect(new Set(operations.map((operation) => operation.id)).size).toBe(operations.length);
  });

  it('inclui prejuízo, mês isento e DARFs, com o último vencendo depois de hoje', () => {
    const darfs = buildDarfs(report.months, new Set());
    expect(darfs.length).toBeGreaterThanOrEqual(2);
    expect(report.months.some((month) => month.swing.exempt)).toBe(true);
    expect(report.months.some((month) => month.swing.grossResultCents < 0)).toBe(true);
    expect(darfs[darfs.length - 1]!.dueDate > '2026-11-19').toBe(true);
  });
});

describe('portfolio', () => {
  it('calcula preço médio, custo e resultado realizado', () => {
    const holdings = buildPortfolio(buildExampleOperations(NOW));
    const petr = holdings.find((holding) => holding.ticker === 'PETR4')!;
    expect(petr.quantity).toBe(0);
    expect(petr.realizedCents).toBeGreaterThan(0);
    const mglu = holdings.find((holding) => holding.ticker === 'MGLU3')!;
    expect(mglu.quantity).toBe(800);
    expect(mglu.avgPriceCents).toBeCloseTo((800 * 980 + 590) / 800);
    expect(totalInvestedCents(holdings)).toBeGreaterThan(0);
    expect(petr.history.length).toBeGreaterThan(1);
  });
});

describe('backup', () => {
  const data = { operations: buildExampleOperations(NOW), paidDarfs: ['2026-09'] };

  it('faz ida e volta sem perder dados', () => {
    const result = parseBackup(serializeBackup(data, NOW));
    expect(result).toEqual({ ok: true, data });
  });

  it.each([
    'não é json',
    '{"app":"outro"}',
    '{"app":"fiscotrack","version":1,"exportedAt":"x","operations":[{"id":""}],"paidDarfs":[]}',
  ])('rejeita arquivo inválido: %s', (text) => {
    const result = parseBackup(text);
    expect(result.ok).toBe(false);
  });
});

describe('mapeamento de CSV', () => {
  const text =
    'Data da operação;Ativo;C/V;Qtd;Preço unitário\n15/03/2024;petr4;C;100;30,50\n16/03/2024;vale3;X;10;5';

  it('sugere colunas por nome, sem acento e sem diferenciar caixa', () => {
    const table = readCsvTable(text);
    const mapping = suggestMapping(table.headers);
    expect(mapping).toMatchObject({
      data: 0,
      ticker: 1,
      tipo: 2,
      quantidade: 3,
      preco: 4,
      taxas: null,
    });
    expect(missingRequired(mapping)).toEqual([]);
  });

  it('converte linhas válidas e aponta erros por linha', () => {
    const table = readCsvTable(text);
    const result = applyMapping(table, suggestMapping(table.headers), (line) => `t-${line}`);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({ ticker: 'PETR4', side: 'BUY', quantity: 100 });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.line).toBe(3);
  });

  it('acusa colunas obrigatórias ausentes', () => {
    const mapping = suggestMapping(['foo', 'bar']);
    expect(missingRequired(mapping)).toContain('data');
  });
});

describe('exportação de CSV', () => {
  it('gera um CSV que a importação lê de volta', () => {
    const operations = buildExampleOperations(NOW);
    const result = parseOperationsCsv(operationsToCsv(operations));
    expect(result.errors).toEqual([]);
    const withoutId = (list: readonly object[]) => list.map((item) => ({ ...item, id: '' }));
    expect(withoutId(result.operations)).toEqual(withoutId(operations));
  });
});
