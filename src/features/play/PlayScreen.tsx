import { useEffect, useMemo } from 'react'
import {
  useCurrentTurnPlayer,
  useGameStore,
  useIsMyTurn,
  useMyPlayer,
} from '../../game/store/gameStore'
import { BoardSvg } from '../board'
import { Button } from '../../ui/Button'
import { Dice3D } from '../../ui/Dice3D'
import { colorForIndex, toPlayerViews } from './playerViews'
import { useDiceThrows } from './useDiceThrows'
import { DiceThrowOverlay } from './DiceThrowOverlay'
import { QuestionModal } from './QuestionModal'

/** Tela de jogo: tabuleiro + HUD de turno. Cobre as fases 'order' e 'playing'. */
export function PlayScreen() {
  const session = useGameStore((s) => s.session)
  const phase = useGameStore((s) => s.phase)
  const lastDice = useGameStore((s) => s.lastDice)
  const order = useGameStore((s) => s.order)
  const rollForOrder = useGameStore((s) => s.rollForOrder)
  const rollDice = useGameStore((s) => s.rollDice)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const question = useGameStore((s) => s.question)
  const lastAnswer = useGameStore((s) => s.lastAnswer)
  const turnSkipped = useGameStore((s) => s.turnSkipped)
  const submitAnswer = useGameStore((s) => s.submitAnswer)
  const clearQuestion = useGameStore((s) => s.clearQuestion)
  const clearTurnSkipped = useGameStore((s) => s.clearTurnSkipped)

  const me = useMyPlayer()
  const currentPlayer = useCurrentTurnPlayer()
  const isMyTurn = useIsMyTurn()

  const { activeThrow, visualSquares, isThrowing, onThrowSettled } =
    useDiceThrows()

  // Some o aviso de "preso" sozinho.
  useEffect(() => {
    if (!turnSkipped) return
    const t = setTimeout(clearTurnSkipped, 1800)
    return () => clearTimeout(t)
  }, [turnSkipped, clearTurnSkipped])

  // Posições VISUAIS: o peão só anda depois que o dado assenta (visualSquares),
  // por isso usamos elas no lugar de `session.players.square`.
  const playerViews = useMemo(
    () =>
      session
        ? toPlayerViews(
            session.players.map((p) => ({
              ...p,
              square: visualSquares[p.id] ?? p.square,
            })),
            myPlayerId,
          )
        : [],
    [session, myPlayerId, visualSquares],
  )

  if (!session) return null

  const isOrderPhase = phase === 'order'
  const lastDicePlayer = lastDice
    ? session.players.find((p) => p.id === lastDice.playerId)
    : null

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-slate-100 to-slate-200 lg:flex-row">
      {/* Tabuleiro */}
      <div className="flex-1 p-3">
        <div className="h-[58vh] w-full lg:h-[calc(100vh-1.5rem)]">
          <BoardSvg
            board={session.board}
            players={playerViews}
            currentTurnPlayerId={currentPlayer?.id}
          />
        </div>
      </div>

      {/* HUD */}
      <aside className="w-full shrink-0 bg-white/95 p-5 shadow-2xl lg:w-96">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">Partida</h2>
          <span className="font-mono text-sm font-bold text-slate-400">
            #{session.code}
          </span>
        </div>

        {isOrderPhase ? (
          <OrderPanel
            hasRolls={!!order}
            rolls={order?.rolls ?? []}
            nameOf={(id) =>
              session.players.find((p) => p.id === id)?.name ?? '?'
            }
            onRoll={rollForOrder}
          />
        ) : (
          <section className="mb-5 rounded-2xl bg-slate-100 p-4 text-center">
            <p className="text-sm font-semibold text-slate-500">
              {isMyTurn ? 'Sua vez!' : 'Vez de'}
            </p>
            <p
              className="mb-3 text-lg font-black"
              style={{ color: tokenColorOf(session, currentPlayer?.id) }}
            >
              {isMyTurn ? me?.name : (currentPlayer?.name ?? '—')}
            </p>
            <div className="mb-3 flex justify-center">
              <Dice3D
                value={isThrowing ? null : (lastDice?.value ?? null)}
                size={64}
              />
            </div>
            <Button
              className="w-full"
              disabled={!isMyTurn || isThrowing}
              onClick={() => rollDice()}
            >
              {isMyTurn ? 'Rolar dado' : 'Aguarde…'}
            </Button>
            {!isThrowing && lastDicePlayer && lastDice && (
              <p className="mt-3 text-xs text-slate-500">
                {lastDicePlayer.name} tirou {lastDice.value} e foi para a casa{' '}
                {lastDice.toSquare}.
              </p>
            )}
          </section>
        )}

        {/* Classificação ao vivo */}
        <section>
          <p className="mb-2 text-sm font-semibold text-slate-700">Posições</p>
          <ul className="space-y-2">
            {standings(session.players).map(({ player, index }) => (
              <li
                key={player.id}
                className={
                  'flex items-center gap-3 rounded-xl px-3 py-2 ' +
                  (player.id === currentPlayer?.id
                    ? 'bg-accent/15 ring-2 ring-accent/40'
                    : 'bg-slate-100')
                }
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: colorForIndex(index) }}
                />
                <span className="flex-1 truncate font-semibold text-slate-800">
                  {player.name}
                  {player.id === myPlayerId && (
                    <span className="ml-1 text-xs text-brand">(você)</span>
                  )}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  Casa {player.square}/{session.board.size}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <DiceThrowOverlay active={activeThrow} onSettled={onThrowSettled} />

      {/* Pergunta do jogador local — só após o dado/peão assentarem. */}
      {question && !isThrowing && (
        <QuestionModal
          key={question.questionId}
          question={question}
          lastAnswer={lastAnswer}
          onSubmit={(optionIndex) =>
            submitAnswer({ questionId: question.questionId, optionIndex })
          }
          onClose={clearQuestion}
        />
      )}

      {/* Aviso de presídio (perde a vez). */}
      {turnSkipped && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-30 flex justify-center px-4">
          <div className="rounded-2xl bg-slate-800 px-5 py-3 text-center font-bold text-white shadow-xl">
            🔒{' '}
            {turnSkipped.playerId === myPlayerId
              ? 'Você está preso! Perde a vez.'
              : `${session.players.find((p) => p.id === turnSkipped.playerId)?.name ?? 'Jogador'} está preso e perde a vez.`}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderPanel({
  hasRolls,
  rolls,
  nameOf,
  onRoll,
}: {
  hasRolls: boolean
  rolls: { playerId: string; value: number }[]
  nameOf: (id: string) => string
  onRoll: () => void
}) {
  return (
    <section className="mb-5 rounded-2xl bg-slate-100 p-4 text-center">
      <p className="mb-1 text-lg font-black text-slate-800">Definir ordem</p>
      <p className="mb-3 text-sm text-slate-500">
        Todos rolam o dado. Quem tirar mais, começa (empate rola de novo).
      </p>
      {hasRolls && (
        <ul className="mb-3 space-y-1 text-left text-sm">
          {[...rolls]
            .sort((a, b) => b.value - a.value)
            .map((r) => (
              <li
                key={r.playerId}
                className="flex justify-between rounded-lg bg-white px-3 py-1.5"
              >
                <span className="font-semibold text-slate-700">
                  {nameOf(r.playerId)}
                </span>
                <span className="font-black text-brand">{r.value}</span>
              </li>
            ))}
        </ul>
      )}
      <Button className="w-full" onClick={onRoll}>
        Rolar para ordem
      </Button>
    </section>
  )
}

/** Jogadores ordenados por casa (desc), preservando índice original p/ cor. */
function standings(players: { id: string; name: string; square: number }[]) {
  return players
    .map((player, index) => ({ player, index }))
    .sort((a, b) => b.player.square - a.player.square)
}

function tokenColorOf(
  session: { players: { id: string }[] },
  playerId: string | undefined,
): string {
  if (!playerId) return '#334155'
  const idx = session.players.findIndex((p) => p.id === playerId)
  return colorForIndex(idx < 0 ? 0 : idx)
}
