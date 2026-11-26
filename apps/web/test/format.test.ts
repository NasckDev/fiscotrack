import { describe, expect, it } from 'vitest';
import {
  formatAxisBRL,
  formatCompactBRL,
  formatMonth,
  formatMonthShort,
  formatMonthTitle,
  greeting,
  plural,
} from '../src/domain/format';
import { describeLastBackup } from '../src/state/backupMemory';

describe('format', () => {
  it('formata o mês por extenso com só a primeira letra maiúscula', () => {
    expect(formatMonth('2024-01')).toBe('janeiro de 2024');
    expect(formatMonthTitle('2024-01')).toBe('Janeiro de 2024');
  });

  it('abrevia o mês como jan/24', () => {
    expect(formatMonthShort('2024-01')).toBe('jan/24');
    expect(formatMonthShort('2025-12')).toBe('dez/25');
  });

  it('formata moeda compacta para os eixos', () => {
    expect(formatCompactBRL(6000).replace(/\s/g, ' ')).toBe('R$ 6 mil');
  });

  it('mostra centavos no eixo de preço abaixo de R$ 1.000 para não repetir rótulos', () => {
    const text = (value: string) => value.replace(/\s/g, ' ');
    expect(text(formatAxisBRL(61.4))).toBe('R$ 61,40');
    expect(text(formatAxisBRL(61.45))).not.toBe(text(formatAxisBRL(61.4)));
    expect(text(formatAxisBRL(6000))).toBe('R$ 6 mil');
  });

  it('faz plural de verdade', () => {
    expect(plural(1, 'operação', 'operações')).toBe('1 operação');
    expect(plural(2, 'operação', 'operações')).toBe('2 operações');
    expect(plural(0, 'operação', 'operações')).toBe('0 operações');
  });

  it('cumprimenta conforme a hora local', () => {
    expect(greeting(new Date(2026, 10, 25, 5, 0))).toBe('Bom dia');
    expect(greeting(new Date(2026, 10, 25, 11, 59))).toBe('Bom dia');
    expect(greeting(new Date(2026, 10, 25, 12, 0))).toBe('Boa tarde');
    expect(greeting(new Date(2026, 10, 25, 17, 59))).toBe('Boa tarde');
    expect(greeting(new Date(2026, 10, 25, 18, 0))).toBe('Boa noite');
    expect(greeting(new Date(2026, 10, 25, 4, 59))).toBe('Boa noite');
  });
});

describe('aviso do último backup', () => {
  const now = new Date(2026, 10, 25, 9, 0);

  it('diz quando ainda não há backup', () => {
    expect(describeLastBackup(null, now)).toBe(
      'Seus dados ficam neste navegador. Nenhum backup feito ainda.',
    );
    expect(describeLastBackup(new Date('data inválida'), now)).toMatch(/Nenhum backup/);
  });

  it('conta dias de calendário: hoje, ontem e há N dias', () => {
    expect(describeLastBackup(new Date(2026, 10, 25, 0, 5), now)).toMatch(/Último backup hoje\.$/);
    expect(describeLastBackup(new Date(2026, 10, 24, 23, 50), now)).toMatch(/ontem\.$/);
    expect(describeLastBackup(new Date(2026, 10, 23, 8, 0), now)).toMatch(/há 2 dias\.$/);
  });
});
