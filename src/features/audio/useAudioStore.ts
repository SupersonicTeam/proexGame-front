/**
 * Estado de áudio (mudo) com persistência em localStorage. Espelha as mudanças
 * no motor (`audio`) imperativo. A UI (`SoundControls`) consome este store; o
 * motor só toca som depois do primeiro gesto (ver `unlock`). Começa no mudo na
 * primeira visita; o volume é fixo (definido no motor): o jogador só
 * liga/desliga o som.
 */
import { create } from 'zustand'
import { audio } from './audioEngine'

const STORAGE_KEY = 'tds-audio'

/** Sem preferência salva (1ª visita) ou ilegível, o jogo começa SEM som. */
const DEFAULT_MUTED = true

function loadMuted(): boolean {
  if (typeof window === 'undefined') return DEFAULT_MUTED
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return typeof raw.muted === 'boolean' ? raw.muted : DEFAULT_MUTED
  } catch {
    return DEFAULT_MUTED
  }
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted }))
  } catch {
    /* localStorage indisponível: ignora (preferência não persiste). */
  }
}

const initialMuted = loadMuted()
// Aplica a preferência no motor já no boot (antes de qualquer som tocar).
audio.setMuted(initialMuted)

interface AudioState {
  muted: boolean
  toggleMuted: () => void
  /** Destrava o áudio num gesto do usuário e inicia o ambiente (se não mudo). */
  unlock: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  muted: initialMuted,
  toggleMuted: () => {
    const muted = !get().muted
    audio.setMuted(muted)
    if (!muted) audio.unlock()
    saveMuted(muted)
    set({ muted })
  },
  unlock: () => audio.unlock(),
}))
