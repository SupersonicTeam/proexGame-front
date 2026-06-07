/**
 * Componente raiz: mede o contêiner, escolhe o número de colunas conforme a
 * proporção, calcula o layout sinuoso e renderiza o cenário, a trilha, as casas
 * e os tokens (agrupados quando dividem a mesma casa). Gerencia o destaque por
 * hover (desktop) e por toque (mobile).
 */
import { useId, useMemo, useState } from 'react'
import type { BoardDescriptor, TileType } from '../../../game/types'
import type { BoardSvgProps, PlayerView } from '../types'
import { useContainerSize } from '../hooks/useContainerSize'
import { pickColumns } from '../layout/pickColumns'
import { computeLayout, MARGIN_TOP, RADIUS } from '../layout/computeLayout'
import {
  computeClusterOffsets,
  tokenRadiusForCount,
} from '../layout/clusterOffsets'
import { PathConnector } from './PathConnector'
import { Tile } from './Tile'
import { PlayerToken } from './PlayerToken'
import { BoardScenery } from './BoardScenery'

/** Normaliza o tipo de uma casa a partir do descritor. */
function tileTypeOf(board: BoardDescriptor, i: number): TileType {
  return (
    board.tileTypeBySquare[i] ??
    (board.questionSquares.includes(i) ? 'question' : 'normal')
  )
}

/** Dispositivo tem mouse? (habilita destaque por hover; evita "grudar" no toque) */
function detectHover(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )
}

export function BoardSvg({
  board,
  players,
  currentTurnPlayerId,
  onTileClick,
}: BoardSvgProps) {
  const { ref, size } = useContainerSize<HTMLDivElement>()
  const uid = useId().replace(/:/g, '')
  const [selected, setSelected] = useState<number | null>(null)
  const canHover = useMemo(() => detectHover(), [])

  const tileCount = board.size + 1
  const aspect = size.height > 0 ? size.width / size.height : 1
  const cols = pickColumns(tileCount, aspect)

  const layout = useMemo(
    () => computeLayout(tileCount, cols),
    [tileCount, cols],
  )

  // Agrupa jogadores por casa para calcular os offsets de cluster.
  const playersBySquare = useMemo(() => {
    const map = new Map<number, PlayerView[]>()
    for (const p of players) {
      const list = map.get(p.square)
      if (list) list.push(p)
      else map.set(p.square, [p])
    }
    return map
  }, [players])

  return (
    <div ref={ref} className="h-full w-full">
      <svg
        viewBox={`0 0 ${layout.viewBox.w} ${layout.viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label="Tabuleiro do jogo da trilha"
      >
        <BoardScenery
          width={layout.viewBox.w}
          height={layout.viewBox.h}
          tilePoints={layout.points}
          seed={board.size * 7 + cols}
          skyHeight={MARGIN_TOP}
          uid={uid}
        />

        <PathConnector d={layout.pathD} uid={uid} />

        {layout.points.map((p) => {
          const type = tileTypeOf(board, p.index)
          return (
            <Tile
              key={p.index}
              index={p.index}
              cx={p.cx}
              cy={p.cy}
              radius={RADIUS}
              type={type}
              subject={board.subjectBySquare[p.index]}
              isStart={p.index === 0}
              isFinish={p.index === board.size}
              selected={selected === p.index}
              canHover={canHover}
              onActivate={(sq) => {
                setSelected((prev) => (prev === sq ? null : sq))
                onTileClick?.(sq)
              }}
            />
          )
        })}

        {[...playersBySquare.values()].map((group) => {
          const offsets = computeClusterOffsets(group.length)
          const tokenRadius = tokenRadiusForCount(group.length)
          return group.map((player, j) => (
            <PlayerToken
              key={player.id}
              player={player}
              points={layout.points}
              offset={offsets[j]}
              radius={tokenRadius}
              isCurrentTurn={player.id === currentTurnPlayerId}
            />
          ))
        })}
      </svg>
    </div>
  )
}
