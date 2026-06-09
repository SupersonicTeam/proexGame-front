# Tasks — Sprint 3 (front-end)

Gate de cada tarefa: `npm run lint` + `npx tsc --noEmit` + `npm test` limpos.
`[P]` = paralelizável (sem dependência de arquivo com outra `[P]` simultânea).
Commits atômicos por tarefa, conventional commits, **na branch atual (nunca main)**.

## Camada 1 — Engine (núcleo §4)

### T01 — `tiers.ts` + testes  `[P]`
- **O quê:** `computeTiers(players)` e `tierBonus(tier)`.
- **Onde:** `src/game/engine/tiers.ts`, `tiers.test.ts`.
- **Done when:** classifica leader/middle/last; casos 2 jogadores, empate topo,
  empate base, todos na mesma casa (→ todos leader, T_p=0).
- **Tests:** unit determinístico. Cobre S3-F01.

### T02 — Helper `isQuestionSquare` + movimento por tier
- **O quê:** extrair `isQuestionSquare(board, sq)`; reescrever `advanceForCorrect`
  para `(difficulty, tier) → {amount, baseAdvance, tierBonus}`.
- **Onde:** `src/game/engine/movement.ts`.
- **Depends on:** T01 (usa `Tier`/`tierBonus`).
- **Done when:** valores batem a tabela §4 (leader/middle/last × fácil/normal/difícil).
- **Tests:** estender `movement.test.ts`. Cobre S3-F02, S3-F03 (recuo inalterado).

### T03 — `applyNudge` + `applyCorrectMovement`
- **O quê:** nudge P=0,7 (±1, prefere +1) e pipeline acerto→nudge→clamp/vitória.
- **Onde:** `src/game/engine/movement.ts`.
- **Depends on:** T02.
- **Done when:** nudge só em casa-pergunta; respeita limites; vitória por chega-ou-passa;
  RNG injetável torna o 0,7 determinístico no teste.
- **Tests:** casos nudge dispara/+1/−1/inviável/não-dispara; clamp ≥1; vitória.
  Cobre S3-F04, S3-F05, S3-F06.

### T04 — Exportar símbolos  `[P]` (após T03)
- **O quê:** `src/game/engine/index.ts` exporta `computeTiers`, `tierBonus`,
  `applyNudge`, `applyCorrectMovement`, `isQuestionSquare`, tipo `Tier`.
- **Depends on:** T01, T03.

## Camada 2 — Contrato e clients

### T05 — Estender `AnswerResultEvent`  `[P]`
- **O quê:** campos opcionais `tier`, `baseAdvance`, `tierBonus`, `nudged`.
- **Onde:** `src/game/types.ts`.
- **Done when:** `tsc` limpo; campos opcionais. Cobre S3-F07.

### T06 — `MockGameClient` à paridade §4
- **O quê:** congelar tier do jogador da vez no início do turno; usar
  `applyCorrectMovement` no acerto; emitir os 4 campos novos.
- **Onde:** `src/game/client/MockGameClient.ts`.
- **Depends on:** T04, T05.
- **Done when:** loop local roda; encadeamento usa tier congelado; recuo sem tier.
  Cobre S3-F09. **Tests:** se houver teste de loop do mock, estender; senão, smoke manual.

### T07 — `SocketGameClient` repassa campos  `[P]`
- **O quê:** repassar `tier/baseAdvance/tierBonus/nudged` se presentes; `undefined` se não.
- **Onde:** `src/game/client/SocketGameClient.ts`.
- **Depends on:** T05.
- **Done when:** sem quebra com payload S2 atual. Cobre S3-F10.

### T08 — `CONTRACT-S3.md` (proposta backend)  `[P]`
- **O quê:** documento aditivo propondo os campos + fallback.
- **Onde:** `Contratos/CONTRACT-S3.md` (e cópia em raiz se o padrão exigir).
- **Depends on:** T05 (forma final dos campos).
- **Done when:** delta claro sobre S2, marcado opcional/aditivo. Cobre S3-F08.
- **Saída:** avisar o usuário para alinhar com o Murillo (item de coordenação).

## Camada 3 — UI (sistema visual)

### T09 — Badges de tier ao vivo
- **O quê:** chip líder/meio/último por jogador no painel "Posições"; recalcula por turno.
- **Onde:** `src/features/play/PlayScreen.tsx` (+ helper `tierLabel` em `playerViews.ts`).
- **Depends on:** T04 (usa `computeTiers`).
- **Done when:** badges corretos e atualizam a cada `turnChanged`; 2 jogadores só leader/last.
  Cobre S3-F11. **Verify:** preview hot-seat.

### T10 — Breakdown de bônus no `QuestionModal`
- **O quê:** `feedbackText` mostra base + impulso quando `tierBonus > 0`; fallback ao total.
- **Onde:** `src/features/play/QuestionModal.tsx`.
- **Depends on:** T05 (campos), T06 (mock os emite).
- **Done when:** acerto de jogador `last` mostra "+base +impulso = +total"; sem campos → texto atual.
  Cobre S3-F12, S3-F13 (nudge sem texto). **Verify:** preview.

## Camada 4 — Verificação

### T11 — Verificação integrada (preview + e2e mock)
- **O quê:** rodar o app, jogar uma partida hot-seat, confirmar catch-up visível,
  breakdown no feedback, sem encadeamento infinito, console limpo.
- **Depends on:** T09, T10.
- **Done when:** screenshot do catch-up + feedback; `npm test`/lint/tsc verdes.
  Cobre S3-F14, S3-F15 (polish só se a verificação apontar).

## Ordem sugerida / paralelismo

```
T01 ─┬─ T02 ── T03 ── T04 ─┬─ T06 ── T10 ─┐
     │                     ├─ T09 ────────┤
T05 ─┴─ T07 (P)            │              ├─ T11
     └─ T08 (P)            └──────────────┘
```
Subagentes: T01/T05/T07/T08 podem iniciar em paralelo; engine (T02→T03→T04) é o
caminho crítico; UI (T09/T10) depois do engine + tipos.

## Notas de execução

- Manter RNG injetável em tudo que usa aleatoriedade (nudge) — exigência de teste.
- Não commitar na `main`. Um commit por tarefa.
- Verificação preview só onde há mudança observável (T09/T10/T11); engine/contrato
  validam por `npm test`/`tsc`.
