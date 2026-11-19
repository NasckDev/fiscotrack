# FiscoTrack

[![CI](https://github.com/NasckDev/fiscotrack/actions/workflows/ci.yml/badge.svg)](https://github.com/NasckDev/fiscotrack/actions/workflows/ci.yml)
[![Deploy](https://github.com/NasckDev/fiscotrack/actions/workflows/deploy.yml/badge.svg)](https://github.com/NasckDev/fiscotrack/actions/workflows/deploy.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)

**Investment Tax Calculator & Reporting** — calculadora educacional de resultados de investimentos em
renda variável com **regras versionadas e explicáveis**.

> **Aviso:** projeto **educacional**. Usa regras brasileiras **simplificadas** e não é consultoria
> fiscal nem substitui os sistemas oficiais da Receita Federal. Confira sempre a legislação vigente.

App publicado: https://nasckdev.github.io/fiscotrack/

## Telas

Capturas com o arquivo de exemplo importado (desktop 1440x900 e celular 390x844).

![Painel mensal com gráfico de resultado e DARF estimado](docs/prints/fiscotrack-painel-mensal-desktop.webp)

![Explicação passo a passo do cálculo de um mês, com fontes](docs/prints/fiscotrack-explicacao-calculo-desktop.webp)

![Importação de CSV com erros apontados por linha](docs/prints/fiscotrack-importacao-csv-desktop.webp)

![Lista de operações e formulário manual](docs/prints/fiscotrack-operacoes-desktop.webp)

<img src="docs/prints/fiscotrack-painel-mensal-mobile.webp" alt="Painel mensal no celular" width="280">

## Problema

Investidores precisam organizar operações, calcular o resultado por mês e entender quais regras
foram aplicadas — sem depender de uma planilha opaca.

## O que faz

- Importa operações de **CSV** (com [arquivo de exemplo](apps/web/public/exemplo-operacoes.csv)) e
  mostra **erros por linha** sem descartar as linhas válidas.
- Lançamento manual de operações, validado pelo mesmo schema Zod da importação.
- **Painel mensal**: resultado, DARF estimado, prejuízo a compensar e **"Por que deu esse valor?"** —
  passo a passo com link para a fonte oficial.
- Gráfico com **alternativa em tabela**; estados de carregamento, vazio, erro e resultado parcial;
  tema claro/escuro; layout mobile-first; foco visível e link "pular para o conteúdo".
- **Dados locais** (IndexedDB). Nada é enviado a servidores; sem telemetria.

## Regras modeladas (simplificadas)

Ações no mercado à vista, pessoa física — detalhes e premissas em
[packages/engine/src/rules/brRendaVariavel.ts](packages/engine/src/rules/brRendaVariavel.ts):

| Regra                     | Valor no projeto                                        | Observação                                                 |
| ------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| Custo médio               | Preço médio ponderado, custos de compra incluídos       | Custos de venda reduzem o valor de venda                   |
| Alíquota operações comuns | 15%                                                     | configurável                                               |
| Alíquota day trade        | 20%                                                     | configurável                                               |
| Isenção                   | Vendas de ações (operações comuns) até R$ 20.000,00/mês | configurável; considera valor bruto de venda               |
| Compensação de prejuízo   | Por categoria (comum × day trade), sem prazo            | prejuízo em mês isento compensável (premissa configurável) |
| DARF mínimo               | R$ 10,00; abaixo disso acumula para o mês seguinte      | configurável                                               |

Fontes citadas: Lei nº 11.033/2004, IN RFB nº 1.585/2015 e orientações da Receita Federal.
**Fora do escopo:** IRRF ("dedo-duro"), FIIs, ETFs, BDRs, opções, eventos corporativos (desdobramento,
bonificação) e detecção automática de day trade (a modalidade vem do CSV).

## Arquitetura

```
packages/engine   TypeScript puro, sem dependências: preço médio, apuração mensal, isenção,
                  compensação de prejuízo, DARF estimado, explicação passo a passo, regras por data
apps/web          React 19 + Vite + React Router (HashRouter) + Zod + idb + Recharts + Tailwind 4
docs/adr          Decisões de arquitetura
```

- `calculateReport(operations, ruleSets?)` é uma função pura: dinheiro em **centavos inteiros**,
  alíquotas em **pontos-base**, arredondamento half-up explícito.
- Operações problemáticas (venda sem posição, data sem regra, dados inválidos) viram `issues` e o
  relatório é marcado como **parcial** — nunca um cálculo silencioso.

ADRs: [motor puro](docs/adr/0001-motor-de-calculo-puro.md) ·
[regras versionadas](docs/adr/0002-regras-versionadas-por-data.md) ·
[dados locais](docs/adr/0003-dados-locais-por-padrao.md) ·
[CSV com erros por linha](docs/adr/0004-importacao-csv-com-erros-por-linha.md)

## Como rodar

Requisitos: Node.js 20+.

```bash
npm install
npm run dev            # app em http://localhost:5173
npm test               # testes de todos os pacotes
npm run test:coverage  # cobertura (engine exige ≥ 90%)
npm run lint && npm run format:check && npm run typecheck && npm run build
```

### Build portátil (qualquer subcaminho)

```bash
npm run build:portable   # gera apps/web/dist-portable
```

A pasta usa caminhos relativos (`base: './'`) e rotas por hash, então funciona servida em qualquer
subcaminho, por exemplo `/projetos/fiscotrack/`, sem fallback de servidor.

### Formato do CSV

```csv
data;ticker;tipo;quantidade;preco;taxas;modalidade
2024-01-08;PETR4;compra;1000;30,00;8,50;comum
```

Separador `;` ou `,`; datas `AAAA-MM-DD` ou `DD/MM/AAAA`; `tipo` = `compra`|`venda`;
`modalidade` = `comum`|`daytrade`.

## Testes

Casos **table-driven** no engine: zero operações, somente compras, custos de compra e venda, isenção
(abaixo, exatamente no limite e um centavo acima), prejuízo acumulado e compensação, day trade
separado de operações comuns, DARF abaixo do mínimo, arredondamento, ordenação por data, regras
versionadas e relatório parcial. Na web: parser CSV (erros por linha) e fluxos com Testing Library.

## Licença

[MIT](LICENSE) © Alexandre Diogo Nascimento
