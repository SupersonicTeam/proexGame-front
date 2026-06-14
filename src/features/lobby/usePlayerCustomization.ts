/**
 * Customização LOCAL do peão do jogador (cor + emoji), persistida em
 * localStorage. É só do cliente local: enquanto o backend não guardar/propagar
 * essas escolhas, os outros jogadores continuam com a cor por índice. A
 * sincronização entre clientes fica como proposta de contrato (S4).
 */
import { create } from 'zustand'

/** Paleta de cores selecionáveis para o peão. */
export const PAWN_COLORS: string[] = [
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
]

/** Emojis selecionáveis para diferenciar o peão. */
export const PAWN_EMOJIS: string[] = [
  '🦊',
  '🐯',
  '🚀',
  '⭐',
  '🐸',
  '🦄',
  '⚡',
  '🎯',
  '🐱',
  '🔥',
  '🍀',
  '👾',
]

const STORAGE_KEY = 'tds-pawn'

interface Persisted {
  /** Cor escolhida; vazio = usar a cor padrão por índice. */
  color: string
  /** Emoji escolhido; vazio = usar a inicial do nome. */
  emoji: string
}

function load(): Persisted {
  if (typeof window === 'undefined') return { color: '', emoji: '' }
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      color: typeof raw.color === 'string' ? raw.color : '',
      emoji: typeof raw.emoji === 'string' ? raw.emoji : '',
    }
  } catch {
    return { color: '', emoji: '' }
  }
}

function save(prefs: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* localStorage indisponível: ignora. */
  }
}

interface CustomizationState {
  color: string
  emoji: string
  setColor: (color: string) => void
  setEmoji: (emoji: string) => void
}

const initial = load()

export const usePlayerCustomization = create<CustomizationState>((set, get) => ({
  color: initial.color,
  emoji: initial.emoji,
  setColor: (color) => {
    save({ color, emoji: get().emoji })
    set({ color })
  },
  setEmoji: (emoji) => {
    // Toca de novo no mesmo emoji desmarca (volta para a inicial).
    const next = get().emoji === emoji ? '' : emoji
    save({ color: get().color, emoji: next })
    set({ emoji: next })
  },
}))
