import { useGameStore } from '../game/store/gameStore'
import { HomeScreen } from '../features/lobby/HomeScreen'
import { LobbyScreen } from '../features/lobby/LobbyScreen'
import { PlayScreen } from '../features/play/PlayScreen'
import { ResultScreen } from '../features/result/ResultScreen'

/**
 * Roteamento por FASE do jogo (mock hot-seat, sem URL). Quando o backend
 * existir, este switch continua válido — a fase vem do mesmo store.
 */
export default function App() {
  const phase = useGameStore((s) => s.phase)

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
