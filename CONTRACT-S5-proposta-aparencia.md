# Proposta de contrato — Aparência do peão (cor + emoji)

> **PROPOSTA do front pro backend.** Aditiva e retrocompatível ao `CONTRACT.md`
> consolidado. Objetivo: cada jogador escolhe a **cor e o emoji** do próprio peão e
> **todos os outros enxergam** essa escolha. Puramente **cosmético** — não afeta
> nenhuma regra de jogo (movimento, ordem, perguntas, prisão).

## Por que precisa do backend

Os clientes só trocam dados **pelo servidor**. Hoje o front aplica a escolha só no
peão do próprio jogador (na tela dele) e usa um **emoji/cor determinístico por índice**
como fallback para os demais. Para o jogador B ver a cor/emoji que o jogador A
escolheu, o servidor precisa **guardar** e **repassar** essa escolha.

## Mudança 1 — `playerView` ganha `color` e `emoji` (aditivo)

O objeto `PlayerView` (usado em `lobbyState`, `playerJoined`, `gameState`) ganha dois
campos **opcionais**:

```ts
interface PlayerView {
  id: string
  name: string
  connected: boolean
  isHost: boolean
  square: number
  color?: string   // hex "#rrggbb" escolhido pelo jogador (ausente = sem escolha)
  emoji?: string   // 1 emoji escolhido pelo jogador (ausente = sem escolha)
}
```

Clientes antigos ignoram; o front novo usa esses campos para pintar/emoji TODOS os
peões. Quando ausentes, o front cai no fallback determinístico (não quebra).

## Mudança 2 — novo evento `setAppearance` (client → server)

| Evento | Payload | Efeito |
| --- | --- | --- |
| `setAppearance` | `{ color: string, emoji: string }` | Define a aparência do jogador (lê o `playerId` do `socket.data`, como os demais comandos). Atualiza o estado e **rebroadcast** `lobbyState` (no lobby) ou `gameState` (em jogo) para a sala refletir. |

- Pode ser enviado **no lobby** (mais comum) e idealmente também **em jogo** (troca em tempo real). Se preferir restringir ao lobby, tudo bem — o front se adapta.
- **Validação sugerida (server):** `color` deve casar `^#[0-9a-fA-F]{6}$`; `emoji` deve ser um único grafema curto (ex.: limitar a ~8 bytes / 1 emoji) — recusar payload malformado com `error{INVALID_PAYLOAD}` (já existe na S4). Sem necessidade de paleta fixa, mas pode restringir se quiser.
- **Sem impacto em RF-16 / regras:** é só cosmético; nenhum dado sensível.

### Sequência

```
(lobby)  client → setAppearance{color,emoji}
                              sala ← lobbyState (playerView agora com color/emoji)
(em jogo) client → setAppearance{color,emoji}
                              sala ← gameState (players[].color/emoji atualizados)
```

## O que o front faz quando isso existir

- Envia `setAppearance` quando o jogador mexe no seletor (cor/emoji) no lobby.
- Lê `playerView.color`/`playerView.emoji` e aplica em **todos** os peões (sobrepondo o
  fallback determinístico por índice).
- Até o backend implementar: o front já funciona com o **fallback determinístico**
  (peões distintos e com emoji), só não reflete a escolha exata dos outros.

---

## Nota — Prisão (item já pronto no backend)

A animação de "grade caindo" e o estado de preso são feitos **100% no front**, a partir
dos eventos que o backend **já emite**: `diceResult` (quando `toSquare` é uma casa de
presídio, via `tileTypeBySquare`) marca quem foi preso; `turnSkipped{playerId,remaining}`
marca quem perde a vez; o peão volta ao normal quando `remaining` zera. **Nenhuma
mudança de backend é necessária para a prisão** — só confirmamos que `tileTypeBySquare`
inclui `'prison'` e que `turnSkipped` é emitido (ambos já no `CONTRACT.md`).
