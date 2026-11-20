/** Tetos que barram digitação errada (um zero a mais) e evitam estouro de precisão. */
export const MAX_QUANTITY = 100_000_000;
export const MAX_MONEY_REAIS = 10_000_000;

const INTEGER_PLAIN = /^\d+$/;
const INTEGER_THOUSANDS = /^\d{1,3}(\.\d{3})+$/;
const DECIMAL_BR = /^\d{1,3}(\.\d{3})*,\d+$|^\d+,\d+$/;
const DECIMAL_DOT = /^\d+\.\d{1,2}$/;

export type ParsedNumber = { readonly ok: true; readonly value: number } | { readonly ok: false };

/** Inteiro: aceita "1000" e "1.000" (ponto de milhar). Rejeita "1e3", "0x10", "1,5" e sinais. */
export function parseInteger(raw: string): ParsedNumber {
  const text = raw.trim();
  if (INTEGER_PLAIN.test(text)) return { ok: true, value: Number(text) };
  if (INTEGER_THOUSANDS.test(text)) return { ok: true, value: Number(text.replace(/\./g, '')) };
  return { ok: false };
}

/**
 * Valor em reais no formato brasileiro: "1.234,56", "1234,56" e "32,5".
 * Sem vírgula, "1234.56" (até 2 casas) vale como decimal e "1.234" vale como milhar.
 */
export function parseMoney(raw: string): ParsedNumber {
  const text = raw.trim();
  if (INTEGER_PLAIN.test(text)) return { ok: true, value: Number(text) };
  if (INTEGER_THOUSANDS.test(text)) return { ok: true, value: Number(text.replace(/\./g, '')) };
  if (DECIMAL_BR.test(text))
    return { ok: true, value: Number(text.replace(/\./g, '').replace(',', '.')) };
  if (DECIMAL_DOT.test(text)) return { ok: true, value: Number(text) };
  return { ok: false };
}
