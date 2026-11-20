# ADR 0008: ordem estável no mesmo dia, ids determinísticos e escritas que não falham em silêncio

**Status:** aceita (resposta à revisão independente)

## Decisões

- **Ordem no mesmo dia.** `Operation` ganhou o campo opcional `seq` (sequência de criação). O motor
  exporta `sortOperations` (data, depois `seq`, depois ordem de entrada) e a carteira usa a mesma
  função, para que os dois concordem. Antes, a ordem dependia do id (aleatório) e uma venda podia ser
  rejeitada por "posição insuficiente" mesmo com a compra do mesmo dia.
- **Ids de CSV determinísticos.** O id vem de um hash do conteúdo da linha (mais a ocorrência entre
  linhas idênticas). Importar o mesmo arquivo de novo atualiza as mesmas operações. Além disso, a
  prévia avisa sobre possíveis repetidas (mesma data, ativo, lado, quantidade e preço) e as ignora
  por padrão.
- **Escritas com resposta.** Toda gravação passa por `useRunner`: se falhar, o usuário vê um aviso
  que diz o que fazer (cota cheia pede backup) e a interface não finge sucesso. Erro de gravação num
  diálogo aparece dentro dele, sem perder o que foi digitado.
- **Banco aberto sob demanda.** A abertura do IndexedDB não fica em cache quando falha, e os eventos
  `blocked`, `blocking` e `terminated` avisam o usuário.
- **DARF pago guarda o valor.** Se o valor apurado muda, o status volta a pendente com aviso.
- **Desfazer "apagar tudo" faz merge**, sem apagar o que foi criado depois; o backup é a garantia real.
- **Dados pedidos ao navegador:** `navigator.storage.persist()` após a primeira gravação, uso de
  espaço nas Configurações, lembrete de backup e sincronização entre abas (`BroadcastChannel`).
