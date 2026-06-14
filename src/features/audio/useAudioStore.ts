/**
 * Estado de áudio (volume/mudo) com persistência em localStorage. Espelha as
 * mudanças no motor (`audio`) imperativo. A UI (`SoundControls`) consome este
 * store; o motor só toca som depois do primeiro gesto (ver `unlock`).
 */
import { create } from 'zustand'
import { audio } from './audioEngine'

const STORAGE_KEY = 'tds-audio'

interface Persisted {
  volume: number
  muted: boolean
}

function loadPrefs(): Persisted {
  if (typeof window === 'undefined') return { volume: 0.5, muted: false }
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      volume: typeof raw.volume === 'number' ? raw.volume : 0.5,
      muted: Boolean(raw.muted),
    }
  } catch {
    return { volume: 0.5, muted: false }
  }
}

function savePrefs(prefs: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* localStorage indisponível: ignora (preferência não persiste). */
  }
}

const initial = loadPrefs()
// Aplica a preferência no motor já no boot (antes de qualquer som tocar).
audio.setVolume(initial.volume)
audio.setMuted(initial.muted)

interface AudioState {
  volume: number
  muted: boolean
  setVolume: (v: number) => void
  toggleMuted: () => void
  /** Destrava o áudio num gesto do usuário e inicia o ambiente (se não mudo). */
  unlock: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  volume: initial.volume,
  muted: initial.muted,
  setVolume: (v) => {
    audio.setVolume(v)
    savePrefs({ volume: v, muted: get().muted })
    set({ volume: v })
  },
  toggleMuted: () => {
    const muted = !get().muted
    audio.setMuted(muted)
    if (!muted) audio.unlock()
    savePrefs({ volume: get().volume, muted })
    set({ muted })
  },
  unlock: () => audio.unlock(),
}))
