# ADR 0007: carteira e DARFs derivados, só o status de pagamento é salvo

**Status:** aceita

Carteira (preço médio, custo, resultado realizado) e a lista de DARFs são sempre calculadas a partir
das operações, com as mesmas funções do motor (`applyOperation`, `calculateReport`). O que o usuário
decide, e portanto precisa ser salvo, é apenas o status "pago" de cada DARF (store `paid` no
IndexedDB, versão 2 do banco). O vencimento é o último dia útil do mês seguinte, considerando só
fins de semana (feriados não são modelados e isso consta nas premissas).

O exemplo é gerado em código, ancorado na data atual, para o próximo DARF sempre vencer no futuro.
