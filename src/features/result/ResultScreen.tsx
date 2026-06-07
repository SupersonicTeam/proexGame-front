import { useGameStore } from '../../game/store/gameStore'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Screen } from '../../ui/Screen'

const MEDALS = ['🥇', '🥈', '🥉']

/** Tela final: vencedor em destaque + ranking completo (RF-12). */
export function ResultScreen() {
  const winner = useGameStore((s) => s.winner)
  const ranking = useGameStore((s) => s.ranking)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const reset = useGameStore((s) => s.reset)

  return (
    <Screen center>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white drop-shadow">
          <p className="text-6xl">🎉</p>
          <h1 className="mt-2 text-3xl font-black">Fim de jogo!</h1>
          {winner && (
            <p className="mt-1 text-lg">
              <span className="font-black">{winner.name}</span> venceu a
              partida!
            </p>
          )}
        </div>

        <Card>
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Classificação final
          </p>
          <ul className="space-y-2">
            {ranking.map((entry) => (
              <li
                key={entry.playerId}
                className={
                  'flex items-center gap-3 rounded-xl px-3 py-2 ' +
                  (entry.position === 1
                    ? 'bg-accent/15 ring-2 ring-accent/40'
                    : 'bg-slate-100')
                }
              >
                <span className="w-7 text-center text-lg">
                  {MEDALS[entry.position - 1] ?? entry.position}
                </span>
                <span className="flex-1 truncate font-semibold text-slate-800">
                  {entry.name}
                  {entry.playerId === myPlayerId && (
                    <span className="ml-1 text-xs text-brand">(você)</span>
                  )}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  Casa {entry.square}
                </span>
              </li>
            ))}
          </ul>

          <Button className="mt-6 w-full" onClick={() => reset()}>
            Jogar novamente
          </Button>
        </Card>
      </div>
    </Screen>
  )
}
