# Sprint 3 — Contexto e decisões (front-end)

> Decisões tomadas com o usuário antes do planejamento. Fonte da verdade para
> resolver ambiguidades durante a implementação.

## Escopo confirmado

Sprint 3 do **front-end apenas**. O backend (terceiro) **já implementa** a §4
completa (ver `Contratos/CONTRACT-S2.md`, "Balanceamento completo ativo"), mas o
payload `answerResult` expõe só o `movement` líquido — **sem o detalhamento**
`C_d + T_p` nem o tier. O `MockGameClient` do front está **atrás**: usa valores-
base da §4 sem tiers/nudge.

Portanto a Sprint 3 do front faz três coisas:
1. **Paridade do mock** com a §4 (tiers de catch-up, nudge anti-encadeamento, clamp).
2. **Proposta de extensão de contrato** (CONTRACT-S3) para o backend expor o
   detalhamento do movimento.
3. **Sistema visual de catch-up** consumindo esses dados.

## Decisões (4 perguntas respondidas)

| # | Tema | Decisão | Implicação |
|---|------|---------|------------|
| 1 | UX catch-up | **Sistema visual completo** | Badges de tier (líder/meio/último) ao vivo no placar e no token + feedback de resposta com o breakdown do bônus. |
| 2 | Fonte do dado | **Estender o contrato** | Propor CONTRACT-S3 adicionando `tier`, `baseAdvance`, `tierBonus`, `nudged` ao `answerResult`. Front consome com fallback enquanto o backend não envia. Requer coordenação com o Murillo. |
| 3 | Board/telas | **Polish leve** | Tabuleiro sinuoso (Sprint 1.5) e telas de pergunta/resultado (Sprints 1/2) tratados como prontos. Só ajustes pontuais (mobile-portrait, contraste) se a verificação apontar. |
| 4 | Nudge | **Silencioso** | Quando o nudge desloca ±1, o peão só para na casa final; sem explicação na UI. |

## Restrições de processo

- **Não commitar na `main`.** Trabalho na branch atual (`claude/jolly-swirles-a5cfaa`).
- Trabalho gated por sprint: só avançar para a Sprint 4 com autorização explícita.
- Padrões existentes: TypeScript estrito, Vitest, RNG injetável para determinismo,
  componentes em `src/ui/`, lógica de jogo em `src/game/engine/`.

## Risco-chave de fidelidade (decisão #2)

O backend é autoritativo (RF-16). Se o front **derivasse** o tier/bônus de forma
independente, poderia divergir do backend caso a regra difira. Ao **estender o
contrato**, o front exibe o número autoritativo. Enquanto o campo não chega:
- O **breakdown** do bônus no feedback usa fallback derivado client-side, marcado
  internamente como estimativa (não muda o `movement`, que é sempre o do servidor).
- Os **badges de tier ao vivo** são display puro (função das posições atuais) e não
  precisam de autoridade — derivados client-side sempre.
