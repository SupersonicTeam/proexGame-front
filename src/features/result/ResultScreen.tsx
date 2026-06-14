import { useEffect, useState } from 'react'
import { useGameStore } from '../../game/store/gameStore'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Screen } from '../../ui/Screen'
import { Confetti } from '../../ui/Confetti'
import { playSfx } from '../audio'

const MEDALS = ['🥇', '🥈', '🥉']

/** Tela final: vencedor em destaque + ranking completo (RF-12). */
export function ResultScreen() {
  const winner = useGameStore((s) => s.winner)
  const ranking = useGameStore((s) => s.ranking)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const reset = useGameStore((s) => s.reset)

  // Chuva de confete ao abrir a tela; some após alguns segundos para liberar o DOM.
  const [showConfetti, setShowConfetti] = useState(true)
  useEffect(() => {
    playSfx('victory')
    const t = setTimeout(() => setShowConfetti(false), 6000)
    return () => clearTimeout(t)
  }, [])

  return (
    <Screen center>
      {showConfetti && <Confetti />}
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center text-white drop-shadow">
          <p className="text-7xl">🎉</p>
          <h1 className="mt-2 text-4xl font-black">Fim de jogo!</h1>
          {winner && (
            <p className="mt-2 text-xl">
              <span className="font-black">{winner.name}</span> venceu a
              partida!
            </p>
          )}
        </div>

        <Card size="lg">
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Classificação final
          </p>
          <ul className="space-y-2.5">
            {ranking.map((entry) => (
              <li
                key={entry.playerId}
                className={
                  'flex items-center gap-3 rounded-xl px-4 py-3 ' +
                  (entry.position === 1
                    ? 'bg-accent/15 ring-2 ring-accent/40'
                    : 'bg-slate-100')
                }
              >
                <span className="w-8 text-center text-xl">
                  {MEDALS[entry.position - 1] ?? entry.position}
                </span>
                <span className="flex-1 truncate text-lg font-semibold text-slate-800">
                  {entry.name}
                  {entry.playerId === myPlayerId && (
                    <span className="ml-1 text-sm text-brand">(você)</span>
                  )}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  Casa {entry.square}
                </span>
              </li>
            ))}
          </ul>

          <Button size="lg" className="mt-6 w-full" onClick={() => reset()}>
            Jogar novamente
          </Button>
        </Card>
      </div>
    </Screen>
  )
}
