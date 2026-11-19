import type { Cents } from '../money';

export interface RuleSource {
  readonly id: string;
  readonly title: string;
  readonly url: string;
}

/**
 * Conjunto de regras vigente em um intervalo de datas.
 * Valores marcados como configuráveis em `assumptions` são premissas do
 * projeto e devem ser conferidos na norma vigente antes de qualquer uso real.
 */
export interface RuleSet {
  readonly id: string;
  readonly label: string;
  /** Início da vigência (inclusive), `AAAA-MM-DD`. */
  readonly validFrom: string;
  /** Fim da vigência (inclusive) ou `null` se ainda vigente. */
  readonly validTo: string | null;
  /** Alíquota de operações comuns (swing trade) em pontos-base. */
  readonly swingRateBps: number;
  /** Alíquota de day trade em pontos-base. */
  readonly dayTradeRateBps: number;
  /** Limite mensal de vendas de ações (swing trade) para isenção. */
  readonly swingExemptionSalesLimitCents: Cents;
  /** Valor mínimo para recolhimento de DARF; abaixo disso o imposto acumula. */
  readonly minimumDarfCents: Cents;
  /** Se prejuízos apurados em meses isentos podem ser compensados depois. */
  readonly lossesInExemptMonthsAreCompensable: boolean;
  readonly sources: readonly RuleSource[];
  readonly assumptions: readonly string[];
}
