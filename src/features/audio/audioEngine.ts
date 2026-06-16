/**
 * Motor de áudio via Web Audio API — tudo SINTETIZADO (sem arquivos nem
 * licenças). Mantém um único `AudioContext` (criado só após um gesto do usuário,
 * exigência de autoplay dos navegadores).
 *
 *  - Ambiente: progressão lenta de acordes suaves em loop (clima tranquilo).
 *  - SFX: dado (chacoalhar), acerto (sino ascendente), erro (zumbido grave),
 *    prisão (grade metálica fechando + tranca), vitória (arpejo).
 *
 * Tudo roteia por um `master` gain (volume/mute). O ambiente tem um gain próprio
 * mais baixo para ficar ao fundo. Singleton exportado em `audio`.
 */

export type SfxName = 'dice' | 'correct' | 'wrong' | 'prison' | 'victory'

/** Construtor do AudioContext (guardado para ambientes sem Web Audio: testes/SSR). */
const Ctor: typeof AudioContext | undefined =
  typeof window !== 'undefined' ? window.AudioContext : undefined

/** Progressão de acordes do ambiente (Hz). Tons suaves, sensação calma. */
const AMBIENT_CHORDS: number[][] = [
  [220.0, 277.18, 329.63], // Lá menor
  [196.0, 246.94, 293.66], // Sol
  [174.61, 220.0, 261.63], // Fá
  [196.0, 261.63, 329.63], // Dó/Sol
]

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGain: GainNode | null = null
  private ambientTimer: ReturnType<typeof setInterval> | null = null
  private chordIndex = 0
  private volume = 0.5
  private muted = false
  private ambientOn = false

  /** Cria o contexto na primeira vez e o destrava (resume) se suspenso. */
  private ensure(): boolean {
    if (!Ctor) return false
    if (!this.ctx) {
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume
      this.master.connect(this.ctx.destination)
      this.ambientGain = this.ctx.createGain()
      this.ambientGain.gain.value = 0.22 // ambiente bem ao fundo
      this.ambientGain.connect(this.master)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return true
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.master && !this.muted) this.master.gain.value = this.volume
  }

  setMuted(m: boolean): void {
    this.muted = m
    if (this.master) this.master.gain.value = m ? 0 : this.volume
    if (m) this.stopAmbient()
  }

  /** Chamar num gesto do usuário: destrava o contexto e inicia o ambiente. */
  unlock(): void {
    if (!this.ensure()) return
    if (!this.muted) this.startAmbient()
  }

  startAmbient(): void {
    if (!this.ctx || !this.ambientGain || this.ambientOn) return
    this.ambientOn = true
    this.playChord()
    this.ambientTimer = setInterval(() => this.playChord(), 3500)
  }

  stopAmbient(): void {
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer)
      this.ambientTimer = null
    }
    this.ambientOn = false
  }

  /** Toca um acorde do ambiente com ataque/release lentos (sem cliques). */
  private playChord(): void {
    if (!this.ctx || !this.ambientGain) return
    const now = this.ctx.currentTime
    const notes = AMBIENT_CHORDS[this.chordIndex % AMBIENT_CHORDS.length]
    this.chordIndex += 1
    for (let idx = 0; idx < notes.length; idx++) {
      const osc = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      const lp = this.ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 900
      osc.type = 'sine'
      osc.frequency.value = notes[idx]
      osc.detune.value = idx * 3
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.18, now + 1.6) // ataque lento
      g.gain.linearRampToValueAtTime(0, now + 3.8) // release lento
      osc.connect(g)
      g.connect(lp)
      lp.connect(this.ambientGain)
      osc.start(now)
      osc.stop(now + 4)
    }
  }

  /** Toca um efeito sonoro pontual. */
  playSfx(name: SfxName): void {
    if (this.muted || !this.ensure() || !this.ctx || !this.master) return
    const ctx = this.ctx
    const out = this.master
    const now = ctx.currentTime

    const tone = (
      freq: number,
      start: number,
      dur: number,
      type: OscillatorType,
      peak: number,
    ): void => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, now + start)
      g.gain.linearRampToValueAtTime(peak, now + start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(g)
      g.connect(out)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.02)
    }

    /** Estouro de ruído filtrado (chacoalhar/raspar metálico). */
    const noise = (
      start: number,
      dur: number,
      filter: BiquadFilterType,
      freq: number,
      q: number,
      peak: number,
    ): void => {
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let k = 0; k < len; k++) {
        data[k] = (Math.random() * 2 - 1) * (1 - k / len)
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const bq = ctx.createBiquadFilter()
      bq.type = filter
      bq.frequency.value = freq
      bq.Q.value = q
      const g = ctx.createGain()
      g.gain.value = peak
      src.connect(bq)
      bq.connect(g)
      g.connect(out)
      src.start(now + start)
      src.stop(now + start + dur)
    }

    switch (name) {
      case 'dice': {
        // Ruído curto e decrescente (chacoalhar do dado), filtrado.
        noise(0, 0.25, 'bandpass', 1200, 0.8, 0.25)
        break
      }
      case 'correct': {
        tone(659.25, 0, 0.18, 'triangle', 0.3) // Mi5
        tone(987.77, 0.12, 0.32, 'triangle', 0.28) // Si5
        break
      }
      case 'wrong': {
        tone(196.0, 0, 0.2, 'sawtooth', 0.22) // Sol3
        tone(146.83, 0.14, 0.32, 'sawtooth', 0.2) // Ré3 (desce)
        break
      }
      case 'prison': {
        // Portão de grade fechando: chocalho metálico das barras → batida grave
        // da tranca. Partais inarmônicos dão o timbre de aço.
        tone(330, 0, 0.16, 'square', 0.1) // clang
        tone(437, 0, 0.16, 'square', 0.08) // razão ~1.32 (inarmônico)
        tone(523, 0, 0.12, 'triangle', 0.06)
        noise(0, 0.22, 'bandpass', 2600, 1.2, 0.16) // raspar das barras
        // Tranca: thud grave fechando no fim do movimento.
        tone(72, 0.2, 0.34, 'sine', 0.32)
        tone(110, 0.2, 0.18, 'triangle', 0.16)
        noise(0.2, 0.08, 'lowpass', 400, 0.7, 0.18) // impacto seco
        break
      }
      case 'victory': {
        const notes = [523.25, 659.25, 783.99, 1046.5] // Dó-Mi-Sol-Dó
        for (let n = 0; n < notes.length; n++) {
          tone(notes[n], n * 0.12, 0.42, 'triangle', 0.28)
        }
        break
      }
    }
  }
}

/** Instância única do motor de áudio. */
export const audio = new AudioEngine()
