import { describe, expect, it } from 'vitest';
import { parseDecimal } from '../src/domain/csv';
import { parseCsvRecords, parseOperationsCsv, readCsvTable } from '../src/domain/csvMapping';
import { parseInteger, parseMoney } from '../src/domain/numbers';

const BOM = String.fromCharCode(0xfeff);
const HEADER = 'data;ticker;tipo;quantidade;preco;taxas;modalidade';

describe('parseDecimal', () => {
  it.each([
    ['32,50', 32.5],
    ['1.234,56', 1234.56],
    ['1234.56', 1234.56],
    ['', Number.NaN],
  ])('"%s" → %d', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });
});

describe('parseInteger', () => {
  it.each([
    ['100', 100],
    ['1.000', 1000],
    ['12.345.678', 12345678],
  ])('aceita "%s"', (input, expected) => {
    expect(parseInteger(input)).toEqual({ ok: true, value: expected });
  });

  it.each(['1e3', '0x10', '1,5', '-3', '1.00', '1.0000', ' ', 'abc'])('rejeita "%s"', (input) => {
    expect(parseInteger(input).ok).toBe(false);
  });
});

describe('parseMoney', () => {
  it.each([
    ['32,5', 32.5],
    ['1.234,56', 1234.56],
    ['1234.56', 1234.56],
    ['1.234', 1234],
    ['10', 10],
  ])('aceita "%s"', (input, expected) => {
    expect(parseMoney(input)).toEqual({ ok: true, value: expected });
  });

  it.each(['1e3', '0x10', '1,2,3', '-1', '1.2.3', 'R$ 10'])('rejeita "%s"', (input) => {
    expect(parseMoney(input).ok).toBe(false);
  });
});

describe('parseCsvRecords (RFC 4180)', () => {
  it('lê campos com aspas, separador e quebra de linha dentro do campo', () => {
    const rows = parseCsvRecords('a;"b;c";"d\ne"\n"x ""y""";2;3', ';');
    expect(rows.map((row) => row.cells)).toEqual([
      ['a', 'b;c', 'd\ne'],
      ['x "y"', '2', '3'],
    ]);
    expect(rows.map((row) => row.line)).toEqual([1, 3]);
  });

  it('detecta o separador fora das aspas e ignora BOM', () => {
    const table = readCsvTable(`${BOM}data,"ativo, papel",qtd\n1,2,3`);
    expect(table.separator).toBe(',');
    expect(table.headers).toEqual(['data', 'ativo, papel', 'qtd']);
  });
});

describe('parseOperationsCsv', () => {
  it('converte linhas válidas em operações do engine com id determinístico', () => {
    const csv = `${HEADER}\n15/03/2024;petr4;compra;100;32,50;4,90;comum`;
    const first = parseOperationsCsv(csv, { seqBase: 10 });
    const again = parseOperationsCsv(csv, { seqBase: 99 });
    expect(first.errors).toEqual([]);
    expect(first.operations).toEqual([
      {
        id: first.operations[0]?.id,
        seq: 10,
        date: '2024-03-15',
        ticker: 'PETR4',
        side: 'BUY',
        quantity: 100,
        unitPriceCents: 3250,
        feesCents: 490,
        category: 'SWING',
      },
    ]);
    expect(again.operations[0]?.id).toBe(first.operations[0]?.id);
  });

  it('linhas idênticas no mesmo arquivo recebem ids diferentes', () => {
    const row = '15/03/2024;PETR4;compra;100;32,50;0;comum';
    const result = parseOperationsCsv(`${HEADER}\n${row}\n${row}`);
    expect(new Set(result.operations.map((operation) => operation.id)).size).toBe(2);
  });

  it('entende milhar na quantidade e campos entre aspas', () => {
    const csv = `${HEADER}\n"15/03/2024";"PETR4";"compra";"1.000";"32,50";"0";"comum"`;
    expect(parseOperationsCsv(csv).operations[0]).toMatchObject({ quantity: 1000 });
  });

  it('aceita separador vírgula com decimais em ponto', () => {
    const csv =
      'data,ticker,tipo,quantidade,preco,taxas,modalidade\n2024-03-15,VALE3,venda,10,60.10,0,daytrade';
    const [operation] = parseOperationsCsv(csv).operations;
    expect(operation).toMatchObject({ side: 'SELL', unitPriceCents: 6010, category: 'DAY_TRADE' });
  });

  it.each([
    { row: '2024-02-30;PETR4;compra;1;1;0;comum', message: /Informe a data/ },
    { row: '2999-01-01;PETR4;compra;1;1;0;comum', message: /não pode ser futura/ },
    { row: '2024-02-01;PE;compra;1;1;0;comum', message: /Informe o ticker/ },
    { row: '2024-02-01;PETR4;troca;1;1;0;comum', message: /Escolha "compra" ou "venda"/ },
    { row: '2024-02-01;PETR4;compra;0;1;0;comum', message: /maior que zero/ },
    { row: '2024-02-01;PETR4;compra;1,5;1;0;comum', message: /número inteiro/ },
    { row: '2024-02-01;PETR4;compra;1e3;1;0;comum', message: /número inteiro/ },
    { row: '2024-02-01;PETR4;compra;1;abc;0;comum', message: /Preço: digite um valor/ },
    { row: '2024-02-01;PETR4;compra;1;1;-2;comum', message: /Custos: digite um valor/ },
    { row: '2024-02-01;PETR4;compra;1;99.999.999,00;0;comum', message: /acima do limite/ },
    { row: '2024-02-01;PETR4;compra;1;1;0;opcao', message: /Escolha "comum" ou "daytrade"/ },
  ])('reporta erro por linha: $row', ({ row, message }) => {
    const result = parseOperationsCsv(`${HEADER}\n${row}`);
    expect(result.operations).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.line).toBe(2);
    expect(result.errors[0]?.raw).toBe(row);
    expect(result.errors[0]?.messages.join(' ')).toMatch(message);
  });

  it('importa linhas válidas mesmo com linhas inválidas (importação parcial)', () => {
    const csv = [
      HEADER,
      '2024-01-02;PETR4;compra;1;1;0;comum',
      'x;y;z',
      '',
      '2024-01-03;PETR4;venda;1;2;0;comum',
    ].join('\r\n');
    const result = parseOperationsCsv(csv);
    expect(result.operations).toHaveLength(2);
    expect(result.errors.map((error) => error.line)).toEqual([3]);
  });

  it('atribui seq crescente na ordem do arquivo', () => {
    const csv = [
      HEADER,
      '2024-01-02;PETR4;compra;1;1;0;comum',
      '2024-01-02;PETR4;venda;1;2;0;comum',
    ].join('\n');
    const [first, second] = parseOperationsCsv(csv, { seqBase: 100 }).operations;
    expect(first?.seq).toBeLessThan(second?.seq ?? 0);
  });

  it('rejeita cabeçalho sem colunas obrigatórias', () => {
    const result = parseOperationsCsv('data;ticker\n2024-01-01;PETR4');
    expect(result.operations).toEqual([]);
    expect(result.errors[0]?.messages[0]).toMatch(/Colunas ausentes.*tipo/);
  });

  it('ignora BOM no início do arquivo', () => {
    const result = parseOperationsCsv(`${BOM}${HEADER}\n2024-01-02;PETR4;compra;1;1;0;comum`);
    expect(result.operations).toHaveLength(1);
  });
});
