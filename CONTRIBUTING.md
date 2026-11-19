# Contribuindo

1. Abra uma issue descrevendo o problema ou a regra (com a **fonte oficial** e a data de vigência).
2. Regras novas entram como dados em `packages/engine/src/rules/` com `sources` e `assumptions`,
   acompanhadas de casos table-driven em `packages/engine/test/`.
3. Antes do PR: `npm run lint && npm run typecheck && npm test && npm run build`.
4. Commits em inglês, uma linha, com prefixo convencional (`feat:`, `fix:`, `docs:`...).
5. Não adicione telemetria nem envio de dados a servidores (ver ADR 0003).
