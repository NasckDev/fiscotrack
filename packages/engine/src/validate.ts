import type { Operation } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/** Retorna a mensagem do primeiro problema encontrado, ou `null` se a operação é válida. */
export function validateOperation(operation: Operation): string | null {
  if (!isValidIsoDate(operation.date)) return `Data inválida: "${operation.date}".`;
  if (operation.ticker.trim() === '') return 'Ticker vazio.';
  if (!Number.isInteger(operation.quantity) || operation.quantity <= 0) {
    return 'Quantidade deve ser um inteiro positivo.';
  }
  if (!isNonNegativeInteger(operation.unitPriceCents)) return 'Preço inválido.';
  if (!isNonNegativeInteger(operation.feesCents)) return 'Custos inválidos.';
  return null;
}
