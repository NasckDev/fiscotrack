# ADR 0006: testes E2E com Playwright + axe sobre o build portátil

**Status:** aceita

## Decisão

Os fluxos críticos (primeira visita, DARF pago, CRUD de operações com desfazer, paleta de comandos,
recarregar em rota interna) e a checagem de acessibilidade com axe (WCAG 2.2 AA, tema claro e escuro,
todas as telas) rodam em `apps/web/e2e` contra o `dist-portable` servido por `vite preview`. Assim o
teste exercita o mesmo artefato que o portfólio publica, com `base: './'` e rotas por hash.

O CI roda os E2E num job próprio, depois do job de qualidade. Localmente, `PW_CHANNEL=chrome` usa o
Chrome instalado.
