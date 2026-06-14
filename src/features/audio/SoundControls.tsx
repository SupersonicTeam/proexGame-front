/**
 * Controle de som flutuante (canto superior direito): botão que abre um painel
 * com mudo e volume. Também destrava o áudio no PRIMEIRO gesto do usuário em
 * qualquer lugar da página (exigência de autoplay), iniciando o ambiente.
 */
import { useEffect, useState } from 'react'
import { useAudioStore } from './useAudioStore'

export function SoundControls() {
  const volume = useAudioStore((s) => s.volume)
  const muted = useAudioStore((s) => s.muted)
  const setVolume = useAudioStore((s) => s.setVolume)
  const toggleMuted = useAudioStore((s) => s.toggleMuted)
  const [open, setOpen] = useState(false)

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

  const silent = muted || volume === 0

  return (
    <div className="fixed right-3 top-3 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Configurações de som"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xl shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
      >
        {silent ? '🔇' : '🔊'}
      </button>

      {open && (
        <div className="w-52 rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-black/5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Som</span>
            <button
              type="button"
              onClick={toggleMuted}
              className={
                'rounded-full px-3 py-1 text-xs font-bold transition ' +
                (muted
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200')
              }
            >
              {muted ? 'Ativar' : 'Silenciar'}
            </button>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-base">🔈</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              disabled={muted}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-2 flex-1 cursor-pointer accent-brand disabled:opacity-40"
            />
            <span className="text-base">🔊</span>
          </label>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Trilha tranquila + efeitos do jogo
          </p>
        </div>
      )}
    </div>
  )
}
