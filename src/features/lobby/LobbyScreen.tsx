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
      <div className="w-full max-w-md">
        <Card>
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Código da sessão
            </p>
            <p className="font-mono text-4xl font-black tracking-[0.3em] text-brand">
              #{session.code}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Dificuldade: {DIFFICULTY_LABEL[session.difficulty]} · Tabuleiro
              com {session.board.size} casas
            </p>
          </div>

          <div className="mb-5">
            <p className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Jogadores</span>
              <span className="text-slate-400">
                {session.players.length}/{MAX_PLAYERS}
              </span>
            </p>
            <ul className="space-y-2">
              {session.players.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2"
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: colorForIndex(i) }}
                  />
                  <span className="flex-1 font-semibold text-slate-800">
                    {p.name}
                    {p.id === me?.id && (
                      <span className="ml-2 text-xs text-brand">(você)</span>
                    )}
                  </span>
                  {p.isHost && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
                      Host
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isHost ? (
            <Button
              className="w-full"
              disabled={!canStart}
              onClick={() => startGame()}
            >
              {canStart ? 'Iniciar partida' : 'Aguardando jogadores…'}
            </Button>
          ) : (
            <p className="rounded-xl bg-slate-100 py-3 text-center text-sm font-semibold text-slate-500">
              Aguardando o host iniciar…
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              leaveSession()
              reset()
            }}
            className="mt-3 w-full text-center text-sm text-slate-400 hover:text-slate-600"
          >
            Sair da sessão
          </button>
        </Card>
      </div>
    </Screen>
  )
}
