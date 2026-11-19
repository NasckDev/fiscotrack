import { formatBRL, formatRate } from './money';
import type { RuleSet } from './rules/types';
import type { CategoryResult, ExplanationStep, TradeCategory } from './types';

const CATEGORY_LABEL: Record<TradeCategory, string> = {
  SWING: 'Operações comuns',
  DAY_TRADE: 'Day trade',
};

const SOURCE_EXEMPTION = ['lei-11033'];
const SOURCE_TAX = ['in-rfb-1585'];
const SOURCE_DARF = ['rfb-renda-variavel'];

function step(result: CategoryResult, partial: Omit<ExplanationStep, 'category'>): ExplanationStep {
  return { ...partial, category: result.category };
}

function salesAndResultSteps(result: CategoryResult): readonly ExplanationStep[] {
  const label = CATEGORY_LABEL[result.category];
  const outcome = result.grossResultCents >= 0 ? 'lucro' : 'prejuízo';
  return [
    step(result, {
      kind: 'SALES_TOTAL',
      title: `${label}: total vendido`,
      detail: `Soma de quantidade × preço de todas as vendas do mês: ${formatBRL(result.salesTotalCents)}.`,
      amountCents: result.salesTotalCents,
      sourceIds: SOURCE_EXEMPTION,
    }),
    step(result, {
      kind: 'GROSS_RESULT',
      title: `${label}: resultado do mês`,
      detail: `Valor de venda menos custos de venda, menos o custo pelo preço médio: ${outcome} de ${formatBRL(Math.abs(result.grossResultCents))}.`,
      amountCents: result.grossResultCents,
      sourceIds: SOURCE_TAX,
    }),
  ];
}

function exemptionStep(result: CategoryResult, ruleSet: RuleSet): ExplanationStep {
  return step(result, {
    kind: 'EXEMPTION',
    title: 'Isenção para vendas de ações até o limite mensal',
    detail: `As vendas (${formatBRL(result.salesTotalCents)}) não passaram de ${formatBRL(ruleSet.swingExemptionSalesLimitCents)} no mês; o lucro de operações comuns é isento.`,
    amountCents: 0,
    sourceIds: SOURCE_EXEMPTION,
  });
}

function lossSteps(result: CategoryResult): readonly ExplanationStep[] {
  if (result.grossResultCents < 0) {
    return [
      step(result, {
        kind: 'LOSS_ACCUMULATED',
        title: 'Prejuízo acumulado para meses seguintes',
        detail: `Prejuízo a compensar passou de ${formatBRL(result.lossBeforeCents)} para ${formatBRL(result.lossAfterCents)}. Só compensa lucros da mesma categoria.`,
        amountCents: result.lossAfterCents,
        sourceIds: SOURCE_TAX,
      }),
    ];
  }
  if (result.lossCompensatedCents > 0) {
    return [
      step(result, {
        kind: 'LOSS_COMPENSATED',
        title: 'Compensação de prejuízo acumulado',
        detail: `${formatBRL(result.lossCompensatedCents)} de prejuízos anteriores abatidos do lucro. Saldo restante: ${formatBRL(result.lossAfterCents)}.`,
        amountCents: result.lossCompensatedCents,
        sourceIds: SOURCE_TAX,
      }),
    ];
  }
  return [];
}

function taxSteps(result: CategoryResult): readonly ExplanationStep[] {
  if (result.taxableBaseCents === 0) return [];
  return [
    step(result, {
      kind: 'TAXABLE_BASE',
      title: 'Base de cálculo',
      detail: `Lucro tributável após compensações: ${formatBRL(result.taxableBaseCents)}.`,
      amountCents: result.taxableBaseCents,
      sourceIds: SOURCE_TAX,
    }),
    step(result, {
      kind: 'TAX',
      title: `Imposto (${formatRate(result.rateBps)})`,
      detail: `${formatBRL(result.taxableBaseCents)} × ${formatRate(result.rateBps)} = ${formatBRL(result.taxCents)}, arredondado ao centavo.`,
      amountCents: result.taxCents,
      sourceIds: SOURCE_TAX,
    }),
  ];
}

/** Passo a passo legível de como uma categoria foi apurada no mês. */
export function explainCategory(
  result: CategoryResult,
  ruleSet: RuleSet,
): readonly ExplanationStep[] {
  if (result.salesTotalCents === 0) return [];
  const exemption =
    result.exempt && result.grossResultCents >= 0 ? [exemptionStep(result, ruleSet)] : [];
  return [...salesAndResultSteps(result), ...exemption, ...lossSteps(result), ...taxSteps(result)];
}

export interface DarfExplanationInput {
  readonly taxWithCarryCents: number;
  readonly carriedInCents: number;
  readonly darfDueCents: number;
  readonly ruleSet: RuleSet;
}

/** Passo final: consolida o DARF estimado e o saldo abaixo do mínimo. */
export function explainDarf(input: DarfExplanationInput): readonly ExplanationStep[] {
  const carryNote =
    input.carriedInCents > 0
      ? ` Inclui ${formatBRL(input.carriedInCents)} trazidos de meses anteriores.`
      : '';
  if (input.darfDueCents === 0 && input.taxWithCarryCents > 0) {
    return [
      {
        kind: 'DARF_MINIMUM',
        category: 'TOTAL',
        title: 'DARF abaixo do valor mínimo',
        detail: `Imposto de ${formatBRL(input.taxWithCarryCents)} é menor que ${formatBRL(input.ruleSet.minimumDarfCents)}; fica para somar no mês seguinte.${carryNote}`,
        amountCents: input.taxWithCarryCents,
        sourceIds: SOURCE_DARF,
      },
    ];
  }
  return [
    {
      kind: 'DARF_DUE',
      category: 'TOTAL',
      title: 'DARF estimado do mês',
      detail: `Imposto estimado a recolher: ${formatBRL(input.darfDueCents)}.${carryNote}`,
      amountCents: input.darfDueCents,
      sourceIds: SOURCE_DARF,
    },
  ];
}
