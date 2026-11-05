/**
 * Controle de som flutuante (canto superior direito): um único botão que liga e
 * desliga o som. Também destrava o áudio no PRIMEIRO gesto do usuário em
 * qualquer lugar da página (exigência de autoplay), iniciando o ambiente.
 */
import { useEffect } from 'react'
import { useAudioStore } from './useAudioStore'

export function SoundControls() {
  const muted = useAudioStore((s) => s.muted)
  const toggleMuted = useAudioStore((s) => s.toggleMuted)

  // Destrava o áudio no primeiro gesto (clique/tecla) em qualquer lugar.
  useEffect(() => {
    const unlock = () => useAudioStore.getState().unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? 'Ativar som' : 'Silenciar som'}
      aria-pressed={muted}
      title={muted ? 'Ativar som' : 'Silenciar som'}
      className="fixed right-3 top-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xl shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:bg-white active:scale-95"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
