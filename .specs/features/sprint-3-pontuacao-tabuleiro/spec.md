# Spec — Sprint 3: Pontuação completa + sistema visual de catch-up (front-end)

Rastreável à SPEC §4 (balanceamento) e RFs 10/11/13. IDs locais: `S3-Fxx`.

## Objetivo

Trazer o loop local (mock) à paridade com a §4 completa e expor o mecanismo de
catch-up ao jogador por um sistema visual, mantendo o servidor como autoridade.

## Requisitos funcionais

### Lógica de jogo (engine + mock)

- **S3-F01 — Tiers de posição.** No início de cada turno, classificar cada jogador
  por casa atual: `leader` = mais à frente (empate → todos leaders); `last` = mais
  atrás (empate → todos last); demais = `middle`. Em partida de 2, só `leader`/`last`.
  Tier do jogador é **congelado no início do turno** e reutilizado em encadeamentos
  do mesmo turno. (SPEC §3 tiers)
- **S3-F02 — Avanço por tier.** Acerto avança `C_d + T_p`, com `C_d` por dificuldade
  (fácil 3 / normal 2 / difícil 1) e `T_p` por tier (leader 0 / middle 1 / last 2). (§4, RF-13)
- **S3-F03 — Recuo por erro.** Erro recua por tipo, **sem ajuste de posição**:
  proximal (1/2/3) e totalmente errada (2/3/4) por dificuldade. (§4, RF-10)
- **S3-F04 — Nudge anti-encadeamento.** Após o avanço, se a casa-alvo for casa-
  pergunta, com **P=0,7** deslocar para a casa não-pergunta mais próxima dentro de
  ±1 (preferir +1; se inviável, −1; se nenhuma viável, permanece). Só no caminho de
  **acerto**; recuo e dado não sofrem nudge. (§4, RF-11)
- **S3-F05 — Ordem de cálculo e clamp.** (1) `advance = C_d + T_p`; (2) nudge;
  (3) clamp: mínimo casa 1; alcançar/ultrapassar `size` = vitória. (§4, RF-12)
- **S3-F06 — Encadeamento preservado.** Acerto que pare em casa-pergunta (após nudge)
  dispara nova pergunta no mesmo turno; recuo nunca dispara. (RF-08, RF-11)

### Contrato / dados

- **S3-F07 — Extensão de `answerResult`.** `AnswerResultEvent` ganha campos opcionais
  `tier`, `baseAdvance` (C_d), `tierBonus` (T_p) e `nudged: boolean`. Opcionais para
  retrocompatibilidade com o backend atual. (decisão #2)
- **S3-F08 — Proposta CONTRACT-S3.** Documento `Contratos/CONTRACT-S3.md` propondo os
  novos campos ao backend, com fallback definido para quando ausentes.
- **S3-F09 — Mock emite breakdown.** O `MockGameClient` preenche os novos campos com
  os valores autoritativos que ele mesmo calcula.
- **S3-F10 — SocketGameClient tolerante.** O adapter repassa os campos quando o
  backend os enviar e degrada graciosamente (campos `undefined`) quando não.

### UI (sistema visual completo)

- **S3-F11 — Badges de tier ao vivo.** Indicador de tier (líder/meio/último) por
  jogador no painel "Posições" e/ou no token do tabuleiro, recalculado a cada turno.
  Derivado das posições (display puro).
- **S3-F12 — Feedback de bônus.** No `QuestionModal`, ao acertar, mostrar o breakdown
  do avanço: base + impulso de catch-up (ex.: "Acertou! +2 base +2 impulso = +4").
  Usa os campos do contrato; se ausentes, mostra só o total (`movement`).
- **S3-F13 — Nudge silencioso.** Nenhuma indicação textual do nudge; o token apenas
  para na casa final. (decisão #4)

### Qualidade

- **S3-F14 — Testes unitários.** Cobertura de tiers (incl. 2 jogadores, empates),
  avanço por tier, recuo, nudge (com RNG determinístico), clamp e vitória.
- **S3-F15 — Polish leve responsivo.** Ajustes pontuais de mobile-portrait/contraste
  só se a verificação apontar; sem rework de layout. (decisão #3)

## Fora de escopo

- Reconexão (RF-14/15) — depende de backend, adiada.
- Rework do tabuleiro ou das telas (já prontos).
- Autoria de conteúdo de perguntas (Sprint 4).
- Qualquer alteração no backend (só proposta de contrato).

## Critério de aceite

Partida local (hot-seat) demonstra catch-up: um jogador em último, ao acertar,
avança visivelmente mais que o líder; o breakdown aparece no feedback; o nudge
evita encadeamentos infinitos sem ruído na UI; testes unitários da §4 passam; build
e lint limpos. Modo backend real continua funcionando (campos novos degradam se ausentes).
