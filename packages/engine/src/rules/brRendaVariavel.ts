import type { RuleSet } from './types';

/**
 * Regras simplificadas de renda variável (ações, mercado à vista) para pessoa física.
 *
 * Fontes oficiais listadas em `sources`. O projeto é EDUCACIONAL: os valores
 * abaixo refletem o entendimento do autor sobre a legislação e estão
 * documentados como premissas em `assumptions` e em docs/regras.md.
 */
export const BR_RENDA_VARIAVEL_RULESETS: readonly RuleSet[] = [
  {
    id: 'br-acoes-v1',
    label: 'Ações — mercado à vista (simplificado)',
    validFrom: '2016-01-01',
    validTo: null,
    swingRateBps: 1500,
    dayTradeRateBps: 2000,
    swingExemptionSalesLimitCents: 2_000_000,
    minimumDarfCents: 1000,
    lossesInExemptMonthsAreCompensable: true,
    sources: [
      {
        id: 'lei-11033',
        title: 'Lei nº 11.033/2004 — isenção de ganhos em vendas de ações até R$ 20 mil/mês',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm',
      },
      {
        id: 'in-rfb-1585',
        title:
          'Instrução Normativa RFB nº 1.585/2015 — tributação de operações em bolsa (alíquotas, custos e compensação de prejuízos)',
        url: 'http://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action',
      },
      {
        id: 'rfb-renda-variavel',
        title: 'Receita Federal — orientações sobre renda variável e DARF (código 6015)',
        url: 'https://www.gov.br/receitafederal/pt-br',
      },
    ],
    assumptions: [
      'A data inicial de vigência (2016-01-01) é um recorte do projeto: períodos anteriores não foram modelados.',
      'Alíquotas de 15% (operações comuns) e 20% (day trade) — configuráveis neste arquivo.',
      'Limite de isenção de R$ 20.000,00 em vendas de ações por mês, só para operações comuns — configurável.',
      'O limite de isenção considera o valor bruto das vendas (quantidade × preço), sem descontar custos.',
      'DARF abaixo de R$ 10,00 não é recolhido e se soma ao imposto do mês seguinte — valor configurável.',
      'Prejuízo de mês isento pode ser compensado em meses seguintes — premissa configurável.',
      'Custos de compra integram o custo de aquisição; custos de venda reduzem o valor de venda.',
      'Não modela IRRF ("dedo-duro"), FIIs, ETFs, BDRs, opções, eventos corporativos nem day trade automático.',
    ],
  },
];
