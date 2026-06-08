import type { Difficulty } from '../../game/types'
import { useGameStore, useMyPlayer } from '../../game/store/gameStore'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Screen } from '../../ui/Screen'
import { colorForIndex } from '../play/playerViews'

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

  if (!session) return null

  const isHost = me?.isHost ?? false
  const canStart = session.players.length >= MIN_PLAYERS

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
              {session.players.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3"
                >
                  <span
                    className="h-7 w-7 shrink-0 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: colorForIndex(i) }}
                  />
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
              ))}
            </ul>
          </div>

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
