/** Ponto de entrada do áudio: UI, store e o disparador de efeitos. */
import { audio } from './audioEngine'
import type { SfxName } from './audioEngine'

export { SoundControls } from './SoundControls'
export { useAudioStore } from './useAudioStore'
export type { SfxName }

/** Toca um efeito sonoro (no-op se mudo ou sem Web Audio). */
export function playSfx(name: SfxName): void {
  audio.playSfx(name)
}
