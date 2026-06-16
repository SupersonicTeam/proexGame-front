> ⚠️ **ARQUIVADO — proposta NÃO adotada pelo backend.** O backend consolidou o
> contrato em **`CONTRACT.md`** (fonte da verdade) e seguiu outro caminho na Sprint 4.
> O breakdown de catch-up (`tier`/`baseAdvance`/`tierBonus`) ficou **só no mock**.
> Mantido aqui apenas como histórico.

# Contrato WebSocket — Sprint 3 (PROPOSTA — pendente de aceite do backend)

> Estende `CONTRACT-S2.md`. Tudo da S1/S2 continua valendo; aqui só o que a Sprint 3
> **propõe adicionar**. Transporte: Socket.IO, namespace `/`, CORS `origin: true`.
> Sala = `code` (5 dígitos). Identidade = `playerId` (UUIDv4 gerado pelo servidor).
>
> ⚠️ **Status: PROPOSTA.** Esta extensão ainda **não foi aceita** pelo backend. É
> **ADITIVA e OPCIONAL**: clientes antigos **ignoram** os campos novos; clientes
> novos, quando os campos chegam, **exibem o breakdown** do movimento. Enquanto não
> houver aceite, o backend continua emitindo o payload S2 puro e a UI usa o fallback.

## Mudança (S2 → S3)

Uma única mudança, **somente de payload** (nenhuma regra nova): o evento `answerResult`
ganha quatro campos opcionais que **detalham** o movimento de acerto da §4. O servidor
**já calcula** esses valores hoje (CONTRACT-S2 declara "balanceamento completo ativo");
a proposta é apenas **expô-los** no payload.

---

## server → client (extensão de `answerResult`)

| Campo (novo) | Tipo | Significado |
| ------------ | ---- | ----------- |
| `tier`        | `'leader' \| 'middle' \| 'last'` | Tier do jogador, **congelado no início do turno** (§3) e reutilizado nos encadeamentos do mesmo turno. Em partida de 2, só `leader`/`last`. |
| `baseAdvance` | `number` | Avanço-base por dificuldade aplicado (`C_d`): fácil 3 / normal 2 / difícil 1. **0 em recuo.** |
| `tierBonus`   | `number` | Bônus de catch-up por tier aplicado (`T_p`): leader 0 / middle 1 / last 2. **0 em recuo.** |
| `nudged`      | `boolean` | `true` se o **nudge anti-encadeamento** (§4, passo 2) deslocou a casa-alvo para fugir de uma casa-pergunta. |

Payload completo proposto (S2 + extensão):

```jsonc
{
  "playerId": "uuid",
  "correct": true,
  "errorType": "none",      // 'none' | 'proximal' | 'wrong'  (inalterado)
  "movement": 4,             // delta total de casas (inalterado; negativo no recuo)
  "fromSquare": 6,
  "toSquare": 10,
  // --- extensão S3 (aditiva, opcional) ---
  "tier": "last",
  "baseAdvance": 2,          // C_d
  "tierBonus": 2,            // T_p
  "nudged": false
}
```

### Semântica

- **`tier` é congelado no início do turno** (§3): classificado pela casa atual de cada
  jogador no `turnChanged` e mantido por todo o turno, inclusive nos acertos
  encadeados — não recalcula no meio do turno.
- **Avanço de acerto = `baseAdvance + tierBonus`** (`C_d + T_p`, §4). Em **recuo**
  (erro), `baseAdvance` e `tierBonus` são **0** e o sinal/magnitude ficam em `movement`.
- **`nudged`** sinaliza o **passo 2 do cálculo da §4**: após o avanço, se a casa-alvo
  era casa-pergunta, o servidor pode tê-la deslocado em ±1 (preferindo +1) para a
  casa não-pergunta mais próxima. É o mesmo movimento já refletido em `toSquare`;
  o campo só **explica** que houve deslocamento.

---

## Fallback (sem aceite / campos ausentes)

- Os quatro campos são **opcionais**. Quando **ausentes** (backend S2 atual), o cliente
  trata cada um como `undefined` e **não infere** nada a partir do total.
- Nesse caso a UI mostra **apenas `movement`** (texto atual: "Acertou! Avançou N
  casa(s)") — sem o breakdown de base + impulso.
- Quando **presentes**, a UI exibe o detalhamento (ex.: "Acertou! +2 base +2 impulso
  = +4 🎉"). Os badges de tier do painel "Posições" são **derivados das posições** e
  **independem** deste contrato (display puro disponível em qualquer modo).

---

## Nota de coordenação

Este documento é um **pedido ao backend (Murillo)** para **expor** dados que ele **já
calcula** — CONTRACT-S2 já declara "balanceamento completo ativo" (avanço por
tier/dificuldade, nudge anti-encadeamento). **Não há mudança de regra de jogo**, só de
**payload**: acrescentar `tier`, `baseAdvance`, `tierBonus` e `nudged` ao `answerResult`.
Por ser aditivo e opcional, o aceite **não quebra** clientes existentes e pode ser
liberado de forma incremental.
