# 0009. Interface com Ant Design, ECharts e wrappers próprios

## Contexto

A primeira versão da interface foi desenhada à mão com Tailwind e Recharts. O dono do projeto
pediu para adotar o padrão de UI dele: Ant Design nos componentes, Apache ECharts nos gráficos,
tema central com os tokens da marca e Storybook.

## Decisão

- **Ant Design 6** (MIT) para os componentes e **ECharts 6** (Apache 2.0) para os gráficos, com
  `echarts/core` registrando só barras, linha, rosca, grade, tooltip, linha de marcação, aria e o
  renderizador SVG. `echarts-for-react` (MIT) cuida do ciclo de vida do gráfico.
- **Nenhuma tela importa `antd` ou `echarts`.** Tudo passa por `apps/web/src/ui/` (`AppButton`,
  `AppTable`, `AppCard`, `AppStatistic`, `AppForm`, `AppModal`, `AppDrawer`, `AppChart`...). Uma regra
  de lint (`no-restricted-imports`) barra `antd`, `@ant-design/*` e `echarts*` fora de `src/ui/`.
- **Tema central** em `src/ui/theme`: a paleta do FiscoTrack (`palette.ts`) vira tokens do Ant Design
  (`buildTheme.ts`), claro e escuro com `theme.darkAlgorithm`. O mesmo `palette.ts` alimenta os
  gráficos e o teste de contraste (`test/contrast.test.ts`, 90 pares WCAG 2.2 AA).
- **Valores em fonte mono tabular** (JetBrains Mono) em `AppMoney`, `AppStatistic` e colunas
  numéricas; interface em Manrope.
- **Tailwind, Recharts, lucide-react e motion saíram.** Ícones vêm de `@ant-design/icons` (MIT) e a
  animação dos números é um contador de ~20 linhas. Nada foi mantido por inércia.
- **Celular:** o menu lateral vira gaveta, há barra inferior, as tabelas viram listas de cards
  (`AppTable` com `renderCard`) e o formulário de operação abre numa gaveta inferior. Alvos de 44 px
  pelo token `controlHeight`.
- **Storybook 10** com o addon de acessibilidade, stories com estados e controles para todos os
  wrappers, e `build-storybook` no CI.

## Consequências

- O visual passa a ser o do Ant Design com a identidade do FiscoTrack aplicada pelos tokens; trocar
  a paleta é editar um arquivo.
- O bundle ficou maior no JavaScript (o Ant Design é pesado) e menor no CSS. `"sideEffects"` no
  `package.json`, componentes de sobreposição em `React.lazy` e `AppCard` próprio levaram o JS
  inicial de 455 para menos de 250 kB gzip; o histórico e a medição com o visualizer estão no README.
  Os gráficos carregam sob demanda e ficam fora do índice de `ui` (`ui/charts.ts`).
- Os testes de componente rodam com `motion: false` e `NODE_ENV=development` no `setup.ts`, porque
  o Ant Design usa um id fixo para diálogos quando `NODE_ENV=test`.
