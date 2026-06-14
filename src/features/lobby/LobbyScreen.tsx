import type { Difficulty } from '../../game/types'
import { useGameStore, useMyPlayer } from '../../game/store/gameStore'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Screen } from '../../ui/Screen'
import { colorForIndex } from '../play/playerViews'
import {
  PAWN_COLORS,
  PAWN_EMOJIS,
  usePlayerCustomization,
} from './usePlayerCustomization'

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Fácil',
  normal: 'Normal',
  hard: 'Difícil',
}

const MAX_PLAYERS = 4
const MIN_PLAYERS = 2

/** Sala de espera: mostra o código, jogadores e o botão de iniciar. */
export function LobbyScreen() {
  const session = useGameStore((s) => s.session)
  const startGame = useGameStore((s) => s.startGame)
  const leaveSession = useGameStore((s) => s.leaveSession)
  const reset = useGameStore((s) => s.reset)
  const me = useMyPlayer()
  const pawnColor = usePlayerCustomization((s) => s.color)
  const pawnEmoji = usePlayerCustomization((s) => s.emoji)

  if (!session) return null

  const isHost = me?.isHost ?? false
  const canStart = session.players.length >= MIN_PLAYERS
  const myIndex = session.players.findIndex((p) => p.id === me?.id)
  const myDefaultColor = colorForIndex(myIndex < 0 ? 0 : myIndex)

  return (
    <Screen center>
      <div className="w-full max-w-lg">
        <header className="mb-6 text-center text-white drop-shadow">
          <h1 className="text-3xl font-black tracking-tight">Sala de espera</h1>
        </header>

        <Card size="lg">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Código da sessão
            </p>
            <p className="font-mono text-5xl font-black tracking-[0.3em] text-brand">
              #{session.code}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Dificuldade: {DIFFICULTY_LABEL[session.difficulty]}
              {session.board.size > 0 &&
                ` · Tabuleiro com ${session.board.size} casas`}
            </p>
          </div>

          <div className="mb-6">
            <p className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Jogadores</span>
              <span className="text-slate-400">
                {session.players.length}/{MAX_PLAYERS}
              </span>
            </p>
            <ul className="space-y-2.5">
              {session.players.map((p, i) => {
                const isMe = p.id === me?.id
                const swatchColor =
                  isMe && pawnColor ? pawnColor : colorForIndex(i)
                const swatchEmoji = isMe ? pawnEmoji : ''
                return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ring-2 ring-white"
                    style={{ backgroundColor: swatchColor }}
                  >
                    {swatchEmoji}
                  </span>
                  <span className="flex-1 text-lg font-semibold text-slate-800">
                    {p.name}
                    {p.id === me?.id && (
                      <span className="ml-2 text-sm text-brand">(você)</span>
                    )}
                  </span>
                  {p.isHost && (
                    <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent">
                      Host
                    </span>
                  )}
                </li>
                )
              })}
            </ul>
          </div>

          <PawnCustomizer defaultColor={myDefaultColor} name={me?.name ?? ''} />

          {isHost ? (
            <Button
              size="lg"
              className="w-full"
              disabled={!canStart}
              onClick={() => startGame()}
            >
              {canStart ? 'Iniciar partida' : 'Aguardando jogadores…'}
            </Button>
          ) : (
            <p className="rounded-xl bg-slate-100 py-4 text-center text-base font-semibold text-slate-500">
              Aguardando o host iniciar…
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              leaveSession()
              reset()
            }}
            className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600"
          >
            Sair da sessão
          </button>
        </Card>
      </div>
    </Screen>
  )
}

/**
 * Customizador do peão local: prévia ao vivo + seleção de cor e emoji. A escolha
 * vale só para o próprio cliente (sincronização entre jogadores é proposta S4).
 */
function PawnCustomizer({
  defaultColor,
  name,
}: {
  defaultColor: string
  name: string
}) {
  const color = usePlayerCustomization((s) => s.color)
  const emoji = usePlayerCustomization((s) => s.emoji)
  const setColor = usePlayerCustomization((s) => s.setColor)
  const setEmoji = usePlayerCustomization((s) => s.setEmoji)
  const effective = color || defaultColor
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-semibold text-slate-700">Seu peão</p>
      <div className="flex items-center gap-4 rounded-xl bg-slate-100 p-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white shadow-inner ring-4 ring-white"
          style={{ backgroundColor: effective }}
        >
          {emoji || initial}
        </span>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {PAWN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(color === c ? '' : c)}
                aria-label={`Cor ${c}`}
                aria-pressed={effective === c}
                className={
                  'h-7 w-7 rounded-full outline-none ring-2 transition ' +
                  'focus-visible:ring-4 focus-visible:ring-brand ' +
                  (effective === c
                    ? 'scale-110 ring-slate-800'
                    : 'ring-white hover:scale-105')
                }
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {PAWN_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-label={`Emoji ${e}`}
                aria-pressed={emoji === e}
                className={
                  'flex h-7 w-7 items-center justify-center rounded-lg text-base outline-none transition ' +
                  'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ' +
                  (emoji === e
                    ? 'bg-brand/20 ring-2 ring-brand'
                    : 'hover:bg-slate-200')
                }
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
