# Design — Sprint 3 (front-end)

## Visão geral

Três camadas, de baixo para cima:

```
engine/  ── tiers + movimento §4 (puro, testável, RNG injetável)
   │
client/  ── MockGameClient usa o engine e emite answerResult estendido
   │        SocketGameClient repassa campos do backend (ou undefined)
   │
ui/      ── badges de tier (derivados) + breakdown no QuestionModal
```

Princípio: **uma única função de tiers** (`computeTiers`) serve tanto a autoridade
do mock quanto o display da UI — sem duplicar a regra.

## 1. Engine (`src/game/engine/`)

### `tiers.ts` (novo)
```ts
export type Tier = 'leader' | 'middle' | 'last'

/** Tier por jogador a partir das casas atuais (§3). 2 jogadores → só leader/last. */
export function computeTiers(
  players: { id: string; square: number }[],
): Record<string, Tier>

/** T_p numérico por tier: leader 0, middle 1, last 2 (§4). */
export function tierBonus(tier: Tier): number
```
Regras de empate:
- `max === min` (todos na mesma casa) → todos `leader`, `T_p = 0` (ninguém atrás → sem catch-up).
- Empate no topo → todos `leader`; empate na base → todos `last`; resto `middle`.
- 2 jogadores: o de trás é `last`, o da frente `leader`; empate → ambos `leader`.

### `movement.ts` (estender)
Substituir `advanceForCorrect(difficulty)` por versão com tier e adicionar o
pipeline de acerto:
```ts
const C_D: Record<Difficulty, number> = { easy: 3, normal: 2, hard: 1 }

export function advanceForCorrect(difficulty: Difficulty, tier: Tier): {
  amount: number; baseAdvance: number; tierBonus: number
}

/** Nudge anti-encadeamento (§4 passo 2). rng injetável. */
export function applyNudge(
  targetSquare: number, board: BoardDescriptor, rng: () => number,
): { square: number; nudged: boolean }

/** Pipeline de acerto: advance → nudge → clamp/vitória. */
export function applyCorrectMovement(args: {
  fromSquare: number; difficulty: Difficulty; tier: Tier;
  board: BoardDescriptor; rng: () => number;
}): { toSquare: number; won: boolean; baseAdvance: number; tierBonus: number; nudged: boolean }
```
`applyRetreat`/`retreatForError` permanecem (recuo não usa tier nem nudge).
`isQuestionSquare(board, sq)` — helper compartilhado (já há lógica inline em vários
lugares; extrair para reuso).

Nudge detalhado: se `target` é casa-pergunta e `rng() < 0.7` →
- candidato `+1`: se `target+1 <= size` e não é casa-pergunta → usa `target+1`
  (se `target+1 === size` é vitória — aceita);
- senão candidato `−1`: se `target-1 >= 1` e não é casa-pergunta → usa `target-1`;
- senão permanece em `target` (encadeia normalmente).
Clamp/vitória aplicados depois.

## 2. Client

### `MockGameClient.ts`
- No `announceTurn` (início do turno), calcular e **congelar** o tier do jogador da
  vez: `this.currentTier = computeTiers(players)[playerId]`. Reutilizado em todos os
  acertos do turno (encadeamento).
- Em `resolveAnswer`, caminho de acerto: trocar `advanceForCorrect/applyAdvance` por
  `applyCorrectMovement({ tier: this.currentTier, board, rng })`.
- Emitir `answerResult` com `tier`, `baseAdvance`, `tierBonus`, `nudged`.

### `types.ts` — `AnswerResultEvent` (estender, campos opcionais)
```ts
tier?: 'leader' | 'middle' | 'last'
baseAdvance?: number   // C_d
tierBonus?: number     // T_p
nudged?: boolean
```
(`correctIndex?` já existe e continua só no mock.)

### `SocketGameClient.ts`
Repassar os campos se presentes no payload do backend; caso contrário `undefined`.
Sem quebra: o backend atual não envia → UI usa fallback.

## 3. Contrato proposto — `Contratos/CONTRACT-S3.md`

Delta sobre S2 (proposta ao backend):
```
answerResult: { ...S2,
  tier: 'leader'|'middle'|'last',   // tier congelado no início do turno
  baseAdvance: number,              // C_d aplicado
  tierBonus: number,                // T_p aplicado (0 em recuo)
  nudged: boolean                   // houve deslocamento anti-encadeamento
}
```
Marcado como **aditivo e opcional** — clientes antigos ignoram; novos exibem o
breakdown. Fallback documentado: sem os campos, a UI mostra só `movement`.

## 4. UI

### Badges de tier — `src/features/play/`
- Util `tierLabel(tier)` → `{ text: 'Líder'|'Meio'|'Último', icon, color }`.
- No painel "Posições" do `PlayScreen`, adicionar um chip de tier por jogador,
  recalculado via `computeTiers(session.players)` (memoizado por posições).
- Opcional leve: realce do token do tabuleiro do jogador `last` (display).
- Recalcula a cada `turnChanged` (posições mudam) — derivado, sem estado novo no store.

### Breakdown — `QuestionModal.tsx`
`feedbackText` passa a usar `lastAnswer.baseAdvance`/`tierBonus` quando presentes:
- com bônus (`tierBonus > 0`): "Acertou! +{base} base +{bonus} impulso = +{total} 🎉"
- sem bônus ou sem campos: texto atual ("Acertou! Avançou N casa(s)").

## Arquivos tocados

| Arquivo | Ação |
|---|---|
| `src/game/engine/tiers.ts` | novo |
| `src/game/engine/tiers.test.ts` | novo |
| `src/game/engine/movement.ts` | estender (tier, nudge, pipeline) |
| `src/game/engine/movement.test.ts` | estender |
| `src/game/engine/index.ts` | exportar novos símbolos |
| `src/game/types.ts` | estender `AnswerResultEvent` |
| `src/game/client/MockGameClient.ts` | congelar tier + pipeline + emitir campos |
| `src/game/client/SocketGameClient.ts` | repassar campos novos |
| `src/features/play/PlayScreen.tsx` | badges de tier no painel Posições |
| `src/features/play/QuestionModal.tsx` | breakdown no feedback |
| `src/features/play/playerViews.ts` | (talvez) helper tierLabel |
| `Contratos/CONTRACT-S3.md` | novo (proposta backend) |

## Decisões de design

- **Tier congelado por turno** (não por resposta): fiel à §3 e evita que um acerto
  encadeado recalcule o tier no meio do turno.
- **Badges derivados, breakdown do contrato**: badge é display puro (sempre
  disponível); o número do bônus vem da autoridade (mock hoje, backend depois).
- **Campos opcionais**: zero quebra com o backend atual; nudge silencioso não exige
  UI dedicada (só o campo `nudged`, hoje sem uso visual — reservado).
