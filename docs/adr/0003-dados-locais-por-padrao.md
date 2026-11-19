# ADR 0003 — Dados locais por padrão (IndexedDB), sem telemetria

- Status: aceito
- Data: 2026-11-19

## Contexto

Operações financeiras são dados sensíveis. O projeto é educacional e não precisa de servidor.

## Decisão

- As operações ficam no **IndexedDB** do navegador, via `idb`, atrás da interface
  `OperationsRepository` (há também uma implementação em memória, usada em testes e como fallback).
- O CSV é lido no navegador (`File.text()`); nada é enviado a servidores.
- **Sem telemetria, analytics ou cookies.** O único `localStorage` é a preferência de tema.
- Deploy estático no GitHub Pages com `HashRouter`, para não depender de reescrita de rotas.

## Consequências

- Os dados não sincronizam entre dispositivos; limpar os dados do site apaga as operações.
- TanStack Query não foi adotado: não há estado de servidor para cachear. Um Context com estados
  `loading`/`ready`/`error` cobre a necessidade com menos dependências.
