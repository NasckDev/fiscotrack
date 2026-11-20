const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const MONTH_ABBREVIATIONS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

const COMPACT_BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** '2024-03' → 'março de 2024'. */
export function formatMonth(month: string): string {
  return MONTH_FORMATTER.format(new Date(`${month}-01T00:00:00Z`));
}

/** '2024-03' → 'Março de 2024' (só a primeira letra em maiúscula). */
export function formatMonthTitle(month: string): string {
  const text = formatMonth(month);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** '2024-03' → 'mar/24'. */
export function formatMonthShort(month: string): string {
  const [year = '', monthNumber = ''] = month.split('-');
  const abbreviation = MONTH_ABBREVIATIONS[Number(monthNumber) - 1] ?? monthNumber;
  return `${abbreviation}/${year.slice(-2)}`;
}

/** '2024-03-15' → '15/03/2024'. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** '2024-03-15' → '15/03/24'. */
export function formatDateShort(isoDate: string): string {
  const [year = '', month, day] = isoDate.split('-');
  return `${day}/${month}/${year.slice(-2)}`;
}

/** Reais (não centavos) em moeda compacta: 6000 → 'R$ 6 mil'. */
export function formatCompactBRL(reais: number): string {
  return COMPACT_BRL_FORMATTER.format(reais);
}

/** '1 operação' / '2 operações'. */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** 'importada' / 'importadas' conforme a quantidade (só a palavra, sem o número). */
export function pluralWord(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
