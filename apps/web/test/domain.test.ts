import { calculateReport } from '@fiscotrack/engine';
import { describe, expect, it } from 'vitest';
import { parseBackup, serializeBackup } from '../src/domain/backup';
import {
  applyMapping,
  parseOperationsCsv,
  missingRequired,
  readCsvTable,
  suggestMapping,
} from '../src/domain/csvMapping';
import { operationsToCsv } from '../src/domain/csvExport';
import {
  buildDarfs,
  darfDueDate,
  darfStatus,
  daysBetween,
  dueBadge,
  nextDarf,
} from '../src/domain/darf';
import { buildExampleOperations } from '../src/domain/example';
import { buildPortfolio, totalInvestedCents } from '../src/domain/portfolio';
import { findDuplicates } from '../src/domain/csvMapping';
import { buildReceipt, receiptMonth, shortSourceTitle } from '../src/domain/receipt';

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
      {
        month: '2026-08',
        dueDate: '2026-09-30',
        amountCents: 100,
        paid: true,
        amountChanged: false,
      },
      {
        month: '2026-09',
        dueDate: '2026-10-30',
        amountCents: 200,
        paid: false,
        amountChanged: false,
      },
      {
        month: '2026-10',
        dueDate: '2026-11-30',
        amountCents: 300,
        paid: false,
        amountChanged: false,
      },
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
    const darfs = buildDarfs(report.months, new Map());
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
  const data = {
    operations: buildExampleOperations(NOW),
    paidDarfs: [{ month: '2026-09', amountCents: 12345 }],
  };

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
    const result = applyMapping(table, suggestMapping(table.headers), { seqBase: 1 });
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
    const withoutId = (list: readonly object[]) =>
      list.map((item) => ({ ...item, id: '', seq: 0 }));
    expect(withoutId(result.operations)).toEqual(withoutId(operations));
  });
});

describe('darf pago com valor alterado', () => {
  const months = calculateReport(buildExampleOperations(NOW)).months;
  const last = months[months.length - 1]!;

  it('continua pago quando o valor é o mesmo ou desconhecido (dado antigo)', () => {
    const same = buildDarfs(months, new Map([[last.month, last.darfDueCents]]));
    const legacy = buildDarfs(months, new Map([[last.month, null]]));
    expect(same.find((entry) => entry.month === last.month)?.paid).toBe(true);
    expect(legacy.find((entry) => entry.month === last.month)?.paid).toBe(true);
  });

  it('volta a pendente, com aviso, quando o valor mudou', () => {
    const changed = buildDarfs(months, new Map([[last.month, last.darfDueCents + 100]]));
    const entry = changed.find((item) => item.month === last.month)!;
    expect(entry.paid).toBe(false);
    expect(entry.amountChanged).toBe(true);
  });
});

describe('backup: robustez', () => {
  const valid = serializeBackup({ operations: [], paidDarfs: [] }, NOW);

  it('ignora BOM no início do arquivo', () => {
    expect(parseBackup(String.fromCharCode(0xfeff) + valid).ok).toBe(true);
  });

  it('lê a versão 1 (pagamentos sem valor)', () => {
    const v1 = JSON.stringify({
      app: 'fiscotrack',
      version: 1,
      exportedAt: 'x',
      operations: [],
      paidDarfs: ['2026-09'],
    });
    expect(parseBackup(v1)).toEqual({
      ok: true,
      data: { operations: [], paidDarfs: [{ month: '2026-09', amountCents: null }] },
    });
  });

  it('explica versão desconhecida, data inexistente e ids repetidos', () => {
    const op = {
      id: 'a',
      date: '2026-01-10',
      ticker: 'PETR4',
      side: 'BUY',
      quantity: 1,
      unitPriceCents: 1,
      feesCents: 0,
      category: 'SWING',
    };
    const base = { app: 'fiscotrack', exportedAt: 'x', paidDarfs: [] };
    const future = parseBackup(JSON.stringify({ ...base, version: 9, operations: [] }));
    expect(future.ok === false && future.message).toMatch(/versão 9/);
    const badDate = parseBackup(
      JSON.stringify({ ...base, version: 2, operations: [{ ...op, date: '2026-02-31' }] }),
    );
    expect(badDate.ok === false && badDate.message).toMatch(/data inexistente/);
    const duplicated = parseBackup(JSON.stringify({ ...base, version: 2, operations: [op, op] }));
    expect(duplicated.ok === false && duplicated.message).toMatch(/mais de uma vez/);
  });
});

describe('duplicatas na importação', () => {
  it('marca operações iguais (data, ativo, lado, quantidade e preço) às já salvas', () => {
    const saved = buildExampleOperations(NOW);
    const incoming = [
      { ...saved[0]!, id: 'novo-1' },
      { ...saved[0]!, id: 'novo-2', quantity: 7 },
    ];
    expect([...findDuplicates(incoming, saved)]).toEqual(['novo-1']);
  });
});

describe('carteira no mesmo dia', () => {
  it('usa seq e não o id para ordenar compra e venda do mesmo dia', () => {
    const base = {
      date: '2026-03-02',
      ticker: 'PETR4',
      quantity: 100,
      unitPriceCents: 3000,
      feesCents: 0,
      category: 'SWING' as const,
    };
    const holdings = buildPortfolio([
      { ...base, id: 'a-venda', side: 'SELL', seq: 2 },
      { ...base, id: 'z-compra', side: 'BUY', seq: 1 },
    ]);
    expect(holdings[0]?.quantity).toBe(0);
    expect(holdings[0]?.realizedCents).toBe(0);
  });

  it('separa o resultado de day trade do resultado comum', () => {
    const base = {
      date: '2026-03-02',
      ticker: 'BBAS3',
      quantity: 100,
      feesCents: 0,
      category: 'DAY_TRADE' as const,
    };
    const [holding] = buildPortfolio([
      { ...base, id: 'c', side: 'BUY', unitPriceCents: 2000, seq: 1 },
      { ...base, id: 'v', side: 'SELL', unitPriceCents: 2100, seq: 2 },
    ]);
    expect(holding?.realizedCents).toBe(0);
    expect(holding?.realizedDayTradeCents).toBe(10_000);
  });
});

describe('recibo "Por que deu esse valor?"', () => {
  const buy = {
    id: 'c',
    seq: 1,
    ticker: 'PETR4',
    side: 'BUY',
    feesCents: 0,
    category: 'SWING',
  } as const;
  const sell = { ...buy, id: 'v', seq: 2, side: 'SELL' } as const;

  it('mostra vendas, lucro, compensação e alíquota do motor, e fecha no DARF do mês', () => {
    const report = calculateReport([
      { ...buy, date: '2024-01-10', quantity: 1000, unitPriceCents: 2000 },
      { ...sell, date: '2024-01-20', quantity: 1000, unitPriceCents: 2500 },
    ]);
    const month = report.months[0]!;
    const receipt = buildReceipt(month);
    const text = (value: string) => value.replace(/\s/g, ' ');
    expect(receipt.lines.map((line) => line.label)).toEqual([
      'Vendas de ações em janeiro',
      'Lucro líquido',
      'Prejuízo compensado',
      'Alíquota (operações comuns)',
    ]);
    expect(text(receipt.lines[0]!.value)).toBe('R$ 25.000,00');
    expect(receipt.lines[0]!.note).toMatch(/Acima de R\$\s20\.000,00 no mês, sem isenção/);
    expect(text(receipt.lines[1]!.value)).toBe('R$ 5.000,00');
    expect(receipt.lines[3]!.value).toBe('15%');
    expect(receipt.totalCents).toBe(month.darfDueCents);
    expect(receipt.totalCents).toBe(75_000);
    expect(receipt.sources.map((source) => shortSourceTitle(source.title))).toContain(
      'Instrução Normativa RFB nº 1.585/2015',
    );
  });

  it('em mês isento para na isenção, sem alíquota', () => {
    const report = calculateReport([
      { ...buy, date: '2024-03-01', quantity: 100, unitPriceCents: 1000 },
      { ...sell, date: '2024-03-15', quantity: 100, unitPriceCents: 1500 },
    ]);
    const receipt = buildReceipt(report.months[0]!);
    expect(receipt.lines).toHaveLength(2);
    expect(receipt.lines[0]!.note).toMatch(/lucro isento/);
    expect(receipt.totalCents).toBe(0);
  });

  it('escolhe o mês do próximo DARF; sem ele, o último mês com DARF ou com vendas', () => {
    const report = calculateReport(buildExampleOperations(NOW));
    const withDarf = report.months.filter((month) => month.darfDueCents > 0);
    const first = withDarf[0]!.month;
    expect(receiptMonth(report.months, first)?.month).toBe(first);
    expect(receiptMonth(report.months, null)?.month).toBe(withDarf[withDarf.length - 1]!.month);
    expect(receiptMonth([], null)).toBeNull();
  });
});

describe('selo de prazo do próximo DARF', () => {
  it('conta os dias que faltam, o dia do vencimento e o atraso', () => {
    expect(dueBadge('2026-11-30', '2026-11-25')).toEqual({ text: 'Faltam 5 dias', overdue: false });
    expect(dueBadge('2026-11-30', '2026-11-29')).toEqual({ text: 'Falta 1 dia', overdue: false });
    expect(dueBadge('2026-11-30', '2026-11-30')).toEqual({ text: 'Vence hoje', overdue: false });
    expect(dueBadge('2026-11-30', '2026-12-02')).toEqual({
      text: 'Venceu há 2 dias',
      overdue: true,
    });
  });
});
