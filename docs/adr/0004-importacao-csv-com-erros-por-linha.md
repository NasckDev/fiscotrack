# ADR 0004 — Importação CSV validada com Zod e erros por linha

- Status: aceito
- Data: 2026-11-19

## Contexto

Arquivos exportados de corretoras e planilhas variam (separador `;` ou `,`, decimais com vírgula,
datas em DD/MM/AAAA). Rejeitar o arquivo inteiro por uma linha ruim é frustrante; aceitar dados
inválidos em silêncio é perigoso.

## Decisão

- Cada linha é validada por um schema Zod (`csvRowSchema`) que normaliza datas, decimais, ticker,
  tipo e modalidade.
- Linhas válidas são importadas; linhas inválidas voltam em `errors` com **número da linha** e
  mensagens em português, exibidas numa lista acessível.
- O mesmo schema valida o formulário de lançamento manual (uma única fonte de verdade).
- O engine revalida as operações (`validateOperation`) e reporta inconsistências de negócio
  (ex.: venda maior que a posição) como relatório parcial.

## Consequências

- Importação parcial é explícita na UI ("N linhas com erro").
- O parser de CSV é simples (sem campos entre aspas com separador interno); suficiente para o
  formato documentado.
