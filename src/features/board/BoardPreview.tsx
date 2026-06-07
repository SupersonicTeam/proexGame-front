/**
 * Componente de desenvolvimento (sem backend) para revisar o tabuleiro:
 * troca de fixture de tabuleiro/jogadores, move um jogador +N para testar a
 * animação e alterna o viewport entre retrato (mobile) e desktop.
 */
import { useState } from 'react'
import type { PlayerView } from './types'
import { BoardSvg } from './components/BoardSvg'
import { boardFixtures } from './fixtures/boards'
import { playersFixtures } from './fixtures/players'

type Viewport = 'portrait' | 'desktop'

const VIEWPORT_STYLE: Record<Viewport, React.CSSProperties> = {
  portrait: { width: 360, height: 640 },
  desktop: { width: 900, height: 560 },
}

export function BoardPreview() {
  const [boardIdx, setBoardIdx] = useState(0)
  const [playersIdx, setPlayersIdx] = useState(1)
  const [viewport, setViewport] = useState<Viewport>('portrait')
  const [players, setPlayers] = useState<PlayerView[]>(
    playersFixtures[1].players,
  )

  const board = boardFixtures[boardIdx].board

  const selectPlayers = (idx: number) => {
    setPlayersIdx(idx)
    setPlayers(playersFixtures[idx].players)
  }

  const movePlayer = (delta: number) => {
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === 0
          ? {
              ...p,
              square: Math.max(0, Math.min(board.size, p.square + delta)),
            }
          : p,
      ),
    )
  }

  const btn =
    'rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-light'
  const btnAlt =
    'rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90'

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">Tabuleiro:</span>
        {boardFixtures.map((f, i) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setBoardIdx(i)}
            className={i === boardIdx ? btn : `${btn} opacity-50`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">Jogadores:</span>
        {playersFixtures.map((f, i) => (
          <button
            key={f.label}
            type="button"
            onClick={() => selectPlayers(i)}
            className={i === playersIdx ? btn : `${btn} opacity-50`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">Mover Ana:</span>
        <button type="button" onClick={() => movePlayer(1)} className={btnAlt}>
          +1
        </button>
        <button type="button" onClick={() => movePlayer(3)} className={btnAlt}>
          +3
        </button>
        <button type="button" onClick={() => movePlayer(-2)} className={btnAlt}>
          -2
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">Viewport:</span>
        <button
          type="button"
          onClick={() => setViewport('portrait')}
          className={viewport === 'portrait' ? btn : `${btn} opacity-50`}
        >
          Retrato
        </button>
        <button
          type="button"
          onClick={() => setViewport('desktop')}
          className={viewport === 'desktop' ? btn : `${btn} opacity-50`}
        >
          Desktop
        </button>
      </div>

      <div
        className="rounded-xl bg-grass shadow-lg"
        style={VIEWPORT_STYLE[viewport]}
      >
        <BoardSvg
          board={board}
          players={players}
          onTileClick={(sq) => console.log('clique na casa', sq)}
        />
      </div>
    </div>
  )
}
