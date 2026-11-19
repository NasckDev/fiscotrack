/** Valor monetário em centavos de real (sempre inteiro). */
export type Cents = number;

const BASIS_POINTS_DIVISOR = 10_000;

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Arredonda para o inteiro mais próximo; empates (.5) se afastam do zero. */
export function roundHalfUp(value: number): number {
  const rounded = Math.round(Math.abs(value));
  return value < 0 ? -rounded : rounded;
}

/** Converte reais (ex.: 32.5) em centavos inteiros, com arredondamento half-up. */
export function toCents(reais: number): Cents {
  return roundHalfUp(Number((reais * 100).toFixed(6)));
}

/** Aplica uma alíquota em pontos-base (1500 = 15%) com arredondamento half-up. */
export function applyRate(amount: Cents, rateBps: number): Cents {
  return roundHalfUp((amount * rateBps) / BASIS_POINTS_DIVISOR);
}

/** Rateia `total` proporcionalmente a `part / whole`, arredondando ao centavo. */
export function apportion(total: Cents, part: number, whole: number): Cents {
  if (whole === 0) return 0;
  if (part === whole) return total;
  return roundHalfUp((total * part) / whole);
}

export function formatBRL(amount: Cents): string {
  return brlFormatter.format(amount / 100);
}

export function formatRate(rateBps: number): string {
  return `${(rateBps / 100).toLocaleString('pt-BR')}%`;
}
