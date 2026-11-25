# ADR 0010: identidade "livro-caixa moderno"

**Status:** aceita (substitui a paleta e as fontes das ADRs 0005 e 0009; o resto delas continua valendo)

## Contexto

O pacote de redesign pediu uma identidade mais calma para um app de imposto: números grandes, poucos
elementos por cartão e a conta sempre à vista. A interface anterior (menu lateral, creme, menta,
rosa e dourado, valores em JetBrains Mono) ficava parecida com um painel administrativo genérico.

## Decisão

- **Tokens** de `src/ui/theme/palette.ts`, espelhados como variáveis `--ft-*` em `src/index.css`:
  tinta `#0F2A1F`, verde-floresta `#123D2C` (cartão herói e cor primária), lima `#D4F25A` (só sobre
  o verde escuro ou como fundo de selo), laranja-terra `#C2662D` para prejuízo, fundo `#EEF1EC`.
  No escuro a primária vira lima com texto em tinta. Texto colorido usa tons mais escuros que os
  preenchimentos de gráfico; `test/contrast.test.ts` confere os pares nos dois temas.
- **Ant Design:** `colorPrimary` = verde-floresta, `borderRadius` 14, botões em pílula, Manrope.
- **Tipografia:** só Manrope (`@fontsource-variable/manrope`), com `font-variant-numeric:
tabular-nums` em todo valor. A dependência de JetBrains Mono foi removida.
- **Casca:** barra superior em pílula (logo, abas, busca, avisos, tema, conta, seletor de mês e
  "Nova operação"), sem menu lateral. No celular a barra fica compacta e a navegação vai para uma
  barra inferior flutuante. O seletor de mês abre a apuração em `?mes=AAAA-MM`.
- **Início:** cartão herói com o próximo DARF em lima, patrimônio com barra de alocação, resultado
  do ano, resultado por mês em barras (lucro em verde, prejuízo em laranja, legenda em texto e
  tabela) e o recibo "Por que deu esse valor?", que só reorganiza o que o motor calculou
  (`src/domain/receipt.ts`).
- **Cartões** com raio de 28 px e sem sombra; o tom herói é reservado ao número que pede ação.

## Consequências

O motor de cálculo, as rotas e os contratos não mudaram. A rosca de alocação e a linha do resultado
acumulado saíram do início (a alocação virou a barra do cartão de patrimônio); os componentes de
gráfico continuam disponíveis (a linha é usada no detalhe do ativo).
