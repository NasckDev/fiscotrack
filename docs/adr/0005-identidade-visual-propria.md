# ADR 0005: identidade visual própria, sem biblioteca de componentes

**Status:** aceita

## Contexto

O app precisa parecer um produto financeiro sério e ter identidade distinta dos demais projetos do
portfólio. Uma primeira versão usava os tokens do design system Nasck UI, mas o resultado era
genérico e dividia a aparência com outro projeto.

## Decisão

- Tokens próprios em `apps/web/src/styles/theme.css` (verde-floresta, creme, menta para ganho, rosa
  para perda, dourado para DARF) mapeados para os tokens do tema (hoje o do Ant Design, ver ADR 0009).
- Manrope na interface e JetBrains Mono nos valores, auto-hospedadas via `@fontsource-variable`.
- Texto colorido usa tons mais escuros que as cores de preenchimento dos gráficos, para manter
  contraste AA. o teste `apps/web/test/contrast.test.ts` calcula os pares nos dois temas (substituiu o antigo `scripts/contrast.mjs`; ver [ADR 0009](0009-ui-com-ant-design-echarts-e-wrappers.md)).
- Ícones `lucide-react`; animações com `motion`, todas desligadas com `prefers-reduced-motion`.
- Diálogos usam o elemento nativo `<dialog>` (foco preso, Esc e retorno de foco pelo navegador).

## Consequências

Nenhuma dependência de biblioteca de componentes. O custo é manter os componentes visuais (cartões,
selos, diálogos) no próprio repositório.
