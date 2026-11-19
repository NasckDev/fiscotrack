import { describe, expect, it } from 'vitest';
import { parseDecimal, parseOperationsCsv } from '../src/domain/csv';

const HEADER = 'data;ticker;tipo;quantidade;preco;taxas;modalidade';
const ids = (line: number) => `id-${line}`;

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

describe('parseOperationsCsv', () => {
  it('converte linhas válidas em operações do engine', () => {
    const result = parseOperationsCsv(
      `${HEADER}\n15/03/2024;petr4;compra;100;32,50;4,90;comum`,
      ids,
    );
    expect(result.errors).toEqual([]);
    expect(result.operations).toEqual([
      {
        id: 'id-2',
        date: '2024-03-15',
        ticker: 'PETR4',
        side: 'BUY',
        quantity: 100,
        unitPriceCents: 3250,
        feesCents: 490,
        category: 'SWING',
      },
    ]);
  });

  it('aceita separador vírgula com decimais em ponto', () => {
    const csv =
      'data,ticker,tipo,quantidade,preco,taxas,modalidade\n2024-03-15,VALE3,venda,10,60.10,0,daytrade';
    const [operation] = parseOperationsCsv(csv, ids).operations;
    expect(operation).toMatchObject({ side: 'SELL', unitPriceCents: 6010, category: 'DAY_TRADE' });
  });

  it.each([
    { row: '2024-02-30;PETR4;compra;1;1;0;comum', message: /Data inválida/ },
    { row: '2024-02-01;PE;compra;1;1;0;comum', message: /Ticker inválido/ },
    { row: '2024-02-01;PETR4;troca;1;1;0;comum', message: /Tipo deve ser/ },
    { row: '2024-02-01;PETR4;compra;0;1;0;comum', message: /maior que zero/ },
    { row: '2024-02-01;PETR4;compra;1,5;1;0;comum', message: /Quantidade/ },
    { row: '2024-02-01;PETR4;compra;1;abc;0;comum', message: /Preço não é um número/ },
    { row: '2024-02-01;PETR4;compra;1;1;-2;comum', message: /Taxas não pode ser negativo/ },
    { row: '2024-02-01;PETR4;compra;1;1;0;opcao', message: /Modalidade deve ser/ },
  ])('reporta erro por linha: $row', ({ row, message }) => {
    const result = parseOperationsCsv(`${HEADER}\n${row}`, ids);
    expect(result.operations).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.line).toBe(2);
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
    const result = parseOperationsCsv(csv, ids);
    expect(result.operations.map((operation) => operation.id)).toEqual(['id-2', 'id-5']);
    expect(result.errors.map((error) => error.line)).toEqual([3]);
  });

  it('rejeita cabeçalho sem colunas obrigatórias', () => {
    const result = parseOperationsCsv('data;ticker\n2024-01-01;PETR4', ids);
    expect(result.operations).toEqual([]);
    expect(result.errors[0]?.messages[0]).toMatch(/Colunas ausentes.*tipo/);
  });

  it('ignora BOM no início do arquivo', () => {
    const result = parseOperationsCsv(`\uFEFF${HEADER}\n2024-01-02;PETR4;compra;1;1;0;comum`, ids);
    expect(result.operations).toHaveLength(1);
  });
});
