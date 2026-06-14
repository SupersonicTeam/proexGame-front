import { useGameStore } from '../game/store/gameStore'
import type { GameStoreState } from '../game/store/gameStore'
import { HomeScreen } from '../features/lobby/HomeScreen'
import { LobbyScreen } from '../features/lobby/LobbyScreen'
import { PlayScreen } from '../features/play/PlayScreen'
import { ResultScreen } from '../features/result/ResultScreen'
import { SoundControls } from '../features/audio'

/** Tela atual conforme a FASE do jogo. */
function CurrentScreen({ phase }: { phase: GameStoreState['phase'] }) {
  switch (phase) {
    case 'lobby':
      return <LobbyScreen />
    case 'order':
    case 'playing':
      return <PlayScreen />
    case 'finished':
      return <ResultScreen />
    case 'idle':
    default:
      return <HomeScreen />
  }
}

/**
 * Roteamento por FASE do jogo (mock hot-seat, sem URL). Quando o backend
 * existir, este switch continua válido — a fase vem do mesmo store. O controle
 * de som fica montado globalmente, por cima de qualquer tela.
 */
export default function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <>
      <SoundControls />
      <CurrentScreen phase={phase} />
    </>
  )
}
