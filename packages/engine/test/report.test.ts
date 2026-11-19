import { describe, expect, it } from 'vitest';
import { calculateReport } from '../src/report';
import { BR_RENDA_VARIAVEL_RULESETS } from '../src/rules/brRendaVariavel';
import type { RuleSet } from '../src/rules/types';
import type { Operation } from '../src/types';
import { buy, sell } from './helpers';

const JAN = '2024-01-10';
const FEB = '2024-02-10';
const DT = { category: 'DAY_TRADE' } as const;

interface MonthExpectation {
  readonly month: string;
  readonly swingResult: number;
  readonly dayTradeResult: number;
  readonly exempt: boolean;
  readonly swingLossAfter: number;
  readonly dayTradeLossAfter: number;
  readonly darf: number;
  readonly carry: number;
}

interface ReportCase {
  readonly name: string;
  readonly operations: readonly Operation[];
  readonly months: readonly MonthExpectation[];
}

const month = (partial: Partial<MonthExpectation> & Pick<MonthExpectation, 'month'>) => ({
  swingResult: 0,
  dayTradeResult: 0,
  exempt: false,
  swingLossAfter: 0,
  dayTradeLossAfter: 0,
  darf: 0,
  carry: 0,
  ...partial,
});

const cases: readonly ReportCase[] = [
  { name: 'zero operações', operations: [], months: [] },
  {
    name: 'somente compras não geram imposto',
    operations: [buy({ date: JAN })],
    months: [month({ month: '2024-01' })],
  },
  {
    name: 'lucro tributável com custos de compra e venda (vendas acima do limite)',
    operations: [
      buy({ date: JAN, quantity: 1000, unitPriceCents: 2000, feesCents: 1000 }),
      sell({ date: JAN, quantity: 1000, unitPriceCents: 2500, feesCents: 1200 }),
    ],
    months: [month({ month: '2024-01', swingResult: 497_800, darf: 74_670 })],
  },
  {
    name: 'lucro isento com vendas abaixo de R$ 20 mil',
    operations: [
      buy({ date: JAN, quantity: 100, unitPriceCents: 5000 }),
      sell({ date: JAN, quantity: 100, unitPriceCents: 6000 }),
    ],
    months: [month({ month: '2024-01', swingResult: 100_000, exempt: true })],
  },
  {
    name: 'vendas exatamente no limite ainda são isentas',
    operations: [
      buy({ date: JAN, quantity: 1000, unitPriceCents: 1000 }),
      sell({ date: JAN, quantity: 1000, unitPriceCents: 2000 }),
    ],
    months: [month({ month: '2024-01', swingResult: 1_000_000, exempt: true })],
  },
  {
    name: 'um centavo acima do limite tributa e arredonda o imposto',
    operations: [
      buy({ date: JAN, quantity: 1, unitPriceCents: 1_000_000 }),
      sell({ date: JAN, quantity: 1, unitPriceCents: 2_000_001 }),
    ],
    months: [month({ month: '2024-01', swingResult: 1_000_001, darf: 150_000 })],
  },
  {
    name: 'prejuízo acumulado compensa lucro do mês seguinte',
    operations: [
      buy({ date: JAN, quantity: 1000, unitPriceCents: 3000 }),
      sell({ date: JAN, quantity: 1000, unitPriceCents: 2500 }),
      buy({ date: FEB, quantity: 1000, unitPriceCents: 2000 }),
      sell({ date: FEB, quantity: 1000, unitPriceCents: 2800 }),
    ],
    months: [
      month({ month: '2024-01', swingResult: -500_000, swingLossAfter: 500_000 }),
      month({ month: '2024-02', swingResult: 800_000, darf: 45_000 }),
    ],
  },
  {
    name: 'prejuízo maior que o lucro deixa saldo a compensar',
    operations: [
      buy({ date: JAN, quantity: 1000, unitPriceCents: 3000 }),
      sell({ date: JAN, quantity: 1000, unitPriceCents: 2500 }),
      buy({ date: FEB, quantity: 1000, unitPriceCents: 2000 }),
      sell({ date: FEB, quantity: 1000, unitPriceCents: 2300 }),
    ],
    months: [
      month({ month: '2024-01', swingResult: -500_000, swingLossAfter: 500_000 }),
      month({ month: '2024-02', swingResult: 300_000, swingLossAfter: 200_000 }),
    ],
  },
  {
    name: 'day trade tributa a 20% sem isenção',
    operations: [
      buy({ date: JAN, ...DT, quantity: 100, unitPriceCents: 1000 }),
      sell({ date: JAN, ...DT, quantity: 100, unitPriceCents: 1200 }),
    ],
    months: [month({ month: '2024-01', dayTradeResult: 20_000, darf: 4000 })],
  },
  {
    name: 'prejuízo de day trade não compensa lucro de operações comuns',
    operations: [
      buy({ date: JAN, ...DT, quantity: 100, unitPriceCents: 1200 }),
      sell({ date: JAN, ...DT, quantity: 100, unitPriceCents: 1000 }),
      buy({ date: JAN, quantity: 1000, unitPriceCents: 2000 }),
      sell({ date: JAN, quantity: 1000, unitPriceCents: 2500 }),
    ],
    months: [
      month({
        month: '2024-01',
        swingResult: 500_000,
        dayTradeResult: -20_000,
        dayTradeLossAfter: 20_000,
        darf: 75_000,
      }),
    ],
  },
  {
    name: 'DARF abaixo do mínimo acumula para o mês seguinte',
    operations: [
      buy({ date: JAN, ...DT, quantity: 10, unitPriceCents: 1000 }),
      sell({ date: JAN, ...DT, quantity: 10, unitPriceCents: 1200 }),
      buy({ date: FEB, ...DT, quantity: 100, unitPriceCents: 1000 }),
      sell({ date: FEB, ...DT, quantity: 100, unitPriceCents: 1300 }),
    ],
    months: [
      month({ month: '2024-01', dayTradeResult: 2000, carry: 400 }),
      month({ month: '2024-02', dayTradeResult: 30_000, darf: 6400 }),
    ],
  },
  {
    name: 'prejuízo em mês isento é acumulado (premissa configurável)',
    operations: [
      buy({ date: JAN, quantity: 100, unitPriceCents: 5000 }),
      sell({ date: JAN, quantity: 100, unitPriceCents: 4000 }),
    ],
    months: [
      month({ month: '2024-01', swingResult: -100_000, exempt: true, swingLossAfter: 100_000 }),
    ],
  },
  {
    name: 'custos podem transformar operação no zero a zero em prejuízo',
    operations: [
      buy({ date: JAN, quantity: 100, unitPriceCents: 1000, feesCents: 500 }),
      sell({ date: JAN, quantity: 100, unitPriceCents: 1000, feesCents: 500 }),
    ],
    months: [month({ month: '2024-01', swingResult: -1000, exempt: true, swingLossAfter: 1000 })],
  },
  {
    name: 'operações fora de ordem são ordenadas por data',
    operations: [
      sell({ date: FEB, quantity: 100, unitPriceCents: 1500 }),
      buy({ date: JAN, quantity: 100, unitPriceCents: 1000 }),
    ],
    months: [
      month({ month: '2024-01' }),
      month({ month: '2024-02', swingResult: 50_000, exempt: true }),
    ],
  },
];

describe('calculateReport (table-driven)', () => {
  it.each(cases)('$name', ({ operations, months }) => {
    const report = calculateReport(operations);
    expect(report.issues).toEqual([]);
    expect(
      report.months.map((result) => ({
        month: result.month,
        swingResult: result.swing.grossResultCents,
        dayTradeResult: result.dayTrade.grossResultCents,
        exempt: result.swing.exempt,
        swingLossAfter: result.swing.lossAfterCents,
        dayTradeLossAfter: result.dayTrade.lossAfterCents,
        darf: result.darfDueCents,
        carry: result.taxCarriedForwardCents,
      })),
    ).toEqual(months);
  });
});

describe('calculateReport — problemas e relatório parcial', () => {
  it.each([
    {
      name: 'venda sem posição',
      operations: [sell({ date: JAN })],
      code: 'INSUFFICIENT_POSITION',
    },
    {
      name: 'data sem regra cadastrada',
      operations: [buy({ date: '2015-06-01' })],
      code: 'NO_RULESET_FOR_DATE',
    },
    { name: 'quantidade zero', operations: [buy({ quantity: 0 })], code: 'INVALID_OPERATION' },
    {
      name: 'quantidade fracionária',
      operations: [buy({ quantity: 1.5 })],
      code: 'INVALID_OPERATION',
    },
    { name: 'data inválida', operations: [buy({ date: '2024-02-30' })], code: 'INVALID_OPERATION' },
    { name: 'ticker vazio', operations: [buy({ ticker: '  ' })], code: 'INVALID_OPERATION' },
    {
      name: 'preço negativo',
      operations: [buy({ unitPriceCents: -1 })],
      code: 'INVALID_OPERATION',
    },
    { name: 'custos negativos', operations: [buy({ feesCents: -1 })], code: 'INVALID_OPERATION' },
  ])('$name gera problema $code e ignora a operação', ({ operations, code }) => {
    const report = calculateReport(operations);
    expect(report.issues.map((issue) => issue.code)).toEqual([code]);
    expect(report.issues[0]?.operationId).toBe(operations[0]?.id);
    expect(report.months).toEqual([]);
  });

  it('mantém o cálculo das operações válidas quando há problemas', () => {
    const report = calculateReport([
      buy({ date: JAN, quantity: 10 }),
      sell({ date: JAN, quantity: 20 }),
      sell({ date: JAN, quantity: 10, unitPriceCents: 1100 }),
    ]);
    expect(report.issues).toHaveLength(1);
    expect(report.months[0]?.swing.grossResultCents).toBe(1000);
    expect(report.positions).toEqual([]);
  });

  it('é determinístico e não muta a entrada', () => {
    const operations = Object.freeze([
      buy({ date: JAN }),
      sell({ date: JAN, unitPriceCents: 1100 }),
    ]);
    expect(calculateReport(operations)).toEqual(calculateReport(operations));
  });
});

describe('calculateReport — regras versionadas', () => {
  const base = BR_RENDA_VARIAVEL_RULESETS[0] as RuleSet;
  const strict: readonly RuleSet[] = [
    { ...base, id: 'sem-compensacao-isenta', lossesInExemptMonthsAreCompensable: false },
  ];

  it('respeita a premissa de não compensar prejuízo de mês isento', () => {
    const report = calculateReport(
      [
        buy({ date: JAN, quantity: 100, unitPriceCents: 5000 }),
        sell({ date: JAN, quantity: 100, unitPriceCents: 4000 }),
      ],
      strict,
    );
    expect(report.months[0]?.ruleSetId).toBe('sem-compensacao-isenta');
    expect(report.months[0]?.swing.lossAfterCents).toBe(0);
  });

  it('aplica a regra vigente em cada mês', () => {
    const versioned: readonly RuleSet[] = [
      { ...base, id: 'v1', validFrom: '2024-01-01', validTo: '2024-01-31' },
      { ...base, id: 'v2', validFrom: '2024-02-01', validTo: null, dayTradeRateBps: 2500 },
    ];
    const report = calculateReport(
      [
        buy({ date: FEB, ...DT, quantity: 100, unitPriceCents: 1000 }),
        sell({ date: FEB, ...DT, quantity: 100, unitPriceCents: 1200 }),
        buy({ date: JAN }),
      ],
      versioned,
    );
    expect(report.months.map((result) => result.ruleSetId)).toEqual(['v1', 'v2']);
    expect(report.months[1]?.darfDueCents).toBe(5000);
  });
});

describe('calculateReport — explicação passo a passo', () => {
  const kinds = (operations: readonly Operation[]) =>
    calculateReport(operations).months.map((result) => result.steps.map((s) => s.kind));

  it.each([
    {
      name: 'mês isento',
      operations: [buy({ date: JAN }), sell({ date: JAN, unitPriceCents: 1100 })],
      expected: [['SALES_TOTAL', 'GROSS_RESULT', 'EXEMPTION', 'DARF_DUE']],
    },
    {
      name: 'lucro tributável',
      operations: [
        buy({ date: JAN, quantity: 1000, unitPriceCents: 2000 }),
        sell({ date: JAN, quantity: 1000, unitPriceCents: 2500 }),
      ],
      expected: [['SALES_TOTAL', 'GROSS_RESULT', 'TAXABLE_BASE', 'TAX', 'DARF_DUE']],
    },
    {
      name: 'prejuízo e compensação',
      operations: [
        buy({ date: JAN, quantity: 1000, unitPriceCents: 3000 }),
        sell({ date: JAN, quantity: 1000, unitPriceCents: 2500 }),
        buy({ date: FEB, quantity: 1000, unitPriceCents: 2000 }),
        sell({ date: FEB, quantity: 1000, unitPriceCents: 2800 }),
      ],
      expected: [
        ['SALES_TOTAL', 'GROSS_RESULT', 'LOSS_ACCUMULATED', 'DARF_DUE'],
        ['SALES_TOTAL', 'GROSS_RESULT', 'LOSS_COMPENSATED', 'TAXABLE_BASE', 'TAX', 'DARF_DUE'],
      ],
    },
    {
      name: 'DARF abaixo do mínimo',
      operations: [
        buy({ date: JAN, ...DT, quantity: 10 }),
        sell({ date: JAN, ...DT, quantity: 10, unitPriceCents: 1200 }),
      ],
      expected: [['SALES_TOTAL', 'GROSS_RESULT', 'TAXABLE_BASE', 'TAX', 'DARF_MINIMUM']],
    },
  ])('$name', ({ operations, expected }) => {
    expect(kinds(operations)).toEqual(expected);
  });

  it('cada passo referencia fontes existentes no conjunto de regras', () => {
    const sourceIds = new Set(BR_RENDA_VARIAVEL_RULESETS[0]?.sources.map((s) => s.id));
    const report = calculateReport([
      buy({ date: JAN, quantity: 1000, unitPriceCents: 2000 }),
      sell({ date: JAN, quantity: 1000, unitPriceCents: 2500 }),
    ]);
    report.months[0]?.steps.forEach((s) =>
      s.sourceIds.forEach((id) => expect(sourceIds.has(id)).toBe(true)),
    );
  });

  it('explica o saldo trazido de meses anteriores', () => {
    const report = calculateReport([
      buy({ date: JAN, ...DT, quantity: 10 }),
      sell({ date: JAN, ...DT, quantity: 10, unitPriceCents: 1200 }),
      buy({ date: FEB, ...DT, quantity: 100 }),
      sell({ date: FEB, ...DT, quantity: 100, unitPriceCents: 1300 }),
    ]);
    const last = report.months[1]?.steps.at(-1);
    expect(last?.kind).toBe('DARF_DUE');
    expect(last?.detail).toMatch(/trazidos de meses anteriores/);
  });
});
