# ADR 0001 — Motor de cálculo em funções puras, fora da UI

- Status: aceito
- Data: 2026-11-19

## Contexto

O valor do FiscoTrack está no cálculo (preço médio, isenção, compensação de prejuízo, DARF) e na
explicação de cada passo. Misturar essa lógica com componentes React tornaria o cálculo difícil de
testar, de auditar e de reaproveitar (CLI, outro front-end, servidor).

## Decisão

- O cálculo vive em `packages/engine`, um pacote TypeScript **sem dependências de runtime**.
- A API pública é `calculateReport(operations, ruleSets?)`: função pura, determinística, sem relógio,
  rede ou armazenamento.
- Estado é tratado de forma imutável (`reduce` sobre operações; `Map` copiado a cada passo).
- Valores monetários são **inteiros em centavos**; alíquotas em **pontos-base**. Arredondamento
  half-up explícito em `money.ts`.
- Cada mês carrega `steps`: a explicação estruturada, com IDs das fontes que fundamentam o passo.

## Consequências

- Testes table-driven rápidos e sem mocks (cobertura ≥ 90% exigida no Vitest).
- A UI só formata e exibe o relatório; não decide regras.
- Custo: textos da explicação ficam no engine (pt-BR). Internacionalizar exigiria mover os textos
  para a UI a partir de `kind` + valores — o formato estruturado já permite isso.
