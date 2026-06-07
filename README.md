# Trilha do Saber — Frontend

Jogo de tabuleiro educativo multiplayer (até 4 jogadores, mobile + desktop).
Este repositório contém **apenas o frontend**. O backend (NestJS + Socket.IO +
Redis) é desenvolvido à parte e segue o contrato de eventos definido em
`src/game/types.ts` (§7 da SPEC).

## Status

**Sprint 1 — Núcleo jogável (concluída).** Como ainda não há backend, o jogo
roda em modo **hot-seat** (1 máquina): você cria a sessão e joga contra 2
oponentes simulados. Todo o loop é dirigido localmente pelo `MockGameClient`,
que implementa a mesma interface (`GameClient`) que o futuro cliente de socket
usará — a troca será de **uma linha** em `src/game/client/index.ts`.

Funcionalidades da Sprint 1: criar/entrar em sessão, lobby com código, rolagem
de ordem, turnos alternados, dado d6, movimento no tabuleiro serpentino
(20–30 casas, responsivo), vitória por chegar/ultrapassar a chegada e ranking
final. Sem perguntas e sem casas de presídio (Sprints 2/3).

## Como rodar

```bash
npm install
npm run dev        # ambiente de desenvolvimento (http://localhost:5173)
npm run build      # build de produção
npm run preview    # serve o build
```

## Qualidade

```bash
npm test           # testes (Vitest, modo watch)
npm run test:run   # testes uma vez
npm run typecheck  # checagem de tipos (tsc)
npm run lint       # ESLint
npm run format     # Prettier
```

## Arquitetura (resumo)

- `src/game/types.ts` — tipos de domínio + contrato de eventos (§6/§7).
- `src/game/client/` — interface `GameClient` + `MockGameClient` (loop local) +
  `index.ts` (factory; único ponto de troca para o backend real).
- `src/game/engine/` — regras puras e testáveis (dado, ordem, movimento,
  geração de tabuleiro).
- `src/game/store/` — store Zustand que liga os eventos do client à UI.
- `src/features/board/` — renderizador SVG procedural do tabuleiro (isolado,
  testável com fixtures: veja `BoardPreview`).
- `src/features/{lobby,play,result}/` — telas.
- `src/ui/` — componentes visuais reutilizáveis.

Convenção: **código em inglês, textos/documentação em PT-BR**.

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · Zustand · Vitest +
Testing Library.
