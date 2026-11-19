# ADR 0002 — Regras versionadas por data, como dados, com fonte

- Status: aceito
- Data: 2026-11-19

## Contexto

Alíquotas, limites de isenção e valores mínimos mudam com a legislação. Um cálculo "de planilha"
esconde qual regra foi usada e quando.

## Decisão

- Regras são **dados** (`packages/engine/src/rules/brRendaVariavel.ts`), não `if`s espalhados.
- Cada `RuleSet` tem `validFrom`/`validTo`, valores (alíquotas, limite de isenção, DARF mínimo,
  política de prejuízo em mês isento), `sources` (fontes oficiais) e `assumptions` (premissas).
- O mês é apurado com a regra vigente no primeiro dia do mês (`getRuleSetFor`). Mudanças de regra
  devem começar no dia 1.
- Operações em datas sem regra cadastrada viram `CalculationIssue` (`NO_RULESET_FOR_DATE`), nunca
  um cálculo silencioso com regra errada.
- Valores sobre os quais o autor não tem certeza absoluta são tratados como **configuráveis** e
  documentados em `assumptions` e em [docs/regras.md](../regras.md).

## Consequências

- Adicionar uma nova versão de regra é uma mudança de dados + caso de teste.
- A UI mostra a regra aplicada e as premissas (página "Regras").
