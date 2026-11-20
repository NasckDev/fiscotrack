import type { Cents } from './money';

export type OperationSide = 'BUY' | 'SELL';

/**
 * Categoria de apuração. Prejuízos só compensam lucros da mesma categoria.
 * - SWING: operações comuns (compra e venda em dias diferentes).
 * - DAY_TRADE: compra e venda do mesmo ativo no mesmo dia.
 */
export type TradeCategory = 'SWING' | 'DAY_TRADE';

export interface Operation {
  readonly id: string;
  /**
   * Sequência de criação (opcional). Desempata operações do mesmo dia: a de menor `seq` vem antes.
   * Sem `seq`, vale a ordem de entrada.
   */
  readonly seq?: number;
  /** Data no formato ISO `AAAA-MM-DD`. */
  readonly date: string;
  readonly ticker: string;
  readonly side: OperationSide;
  /** Quantidade inteira e positiva de ações. */
  readonly quantity: number;
  readonly unitPriceCents: Cents;
  /** Corretagem, emolumentos e demais custos da nota atribuídos à operação. */
  readonly feesCents: Cents;
  readonly category: TradeCategory;
}

export interface Position {
  readonly ticker: string;
  readonly category: TradeCategory;
  readonly quantity: number;
  /** Custo total de aquisição (inclui custos de compra). */
  readonly totalCostCents: Cents;
}

export type ExplanationKind =
  | 'SALES_TOTAL'
  | 'GROSS_RESULT'
  | 'EXEMPTION'
  | 'LOSS_ACCUMULATED'
  | 'LOSS_COMPENSATED'
  | 'TAXABLE_BASE'
  | 'TAX'
  | 'DARF_MINIMUM'
  | 'DARF_DUE';

export interface ExplanationStep {
  readonly kind: ExplanationKind;
  readonly category: TradeCategory | 'TOTAL';
  readonly title: string;
  readonly detail: string;
  readonly amountCents: Cents;
  /** Identificadores de `RuleSource` que fundamentam o passo. */
  readonly sourceIds: readonly string[];
}

export interface CategoryResult {
  readonly category: TradeCategory;
  /** Soma dos valores brutos de venda (quantidade × preço). */
  readonly salesTotalCents: Cents;
  /** Lucro (positivo) ou prejuízo (negativo) do mês, já líquido de custos. */
  readonly grossResultCents: Cents;
  readonly exempt: boolean;
  readonly lossBeforeCents: Cents;
  readonly lossCompensatedCents: Cents;
  readonly lossAfterCents: Cents;
  readonly taxableBaseCents: Cents;
  readonly rateBps: number;
  readonly taxCents: Cents;
}

export interface MonthlyResult {
  /** Mês no formato `AAAA-MM`. */
  readonly month: string;
  readonly ruleSetId: string;
  readonly swing: CategoryResult;
  readonly dayTrade: CategoryResult;
  /** Imposto do mês somado ao saldo inferior ao mínimo trazido de meses anteriores. */
  readonly taxWithCarryCents: Cents;
  /** Valor estimado do DARF a pagar neste mês (0 se abaixo do mínimo). */
  readonly darfDueCents: Cents;
  /** Imposto abaixo do mínimo que fica para o mês seguinte. */
  readonly taxCarriedForwardCents: Cents;
  readonly steps: readonly ExplanationStep[];
}

export type CalculationIssueCode =
  'INSUFFICIENT_POSITION' | 'NO_RULESET_FOR_DATE' | 'INVALID_OPERATION';

export interface CalculationIssue {
  readonly code: CalculationIssueCode;
  readonly operationId: string;
  readonly message: string;
}

export interface Report {
  readonly months: readonly MonthlyResult[];
  readonly positions: readonly Position[];
  /** Operações ignoradas no cálculo. Se houver itens, o relatório é parcial. */
  readonly issues: readonly CalculationIssue[];
}
