/**
 * Cena de prisão (item PRISÃO, 100% front). Dois usos do mesmo conjunto de
 * grades de aço:
 *
 *  - `PrisonAnnouncement`: anúncio dramático para TODOS — as grades CAEM do topo
 *    e travam, com "Fulano foi preso!". Transitório (o PlayScreen o desmonta).
 *  - `PrisonHeldOverlay`: tela de grades PERMANENTE do jogador preso, enquanto
 *    ele aguarda ser solto (perder a vez). Não bloqueia toques.
 *
 * Disparado pela camada de playback (`useDiceThrows.prisonAlert`), que só revela
 * a prisão quando o dado assenta — nunca durante a rolagem.
 */
import { motion } from 'framer-motion'

/** Quantidade de barras verticais da grade. */
const BAR_COUNT = 9

/** Uma barra de aço vertical com leve brilho central (degradê metálico). */
function bars(animated: boolean) {
  return Array.from({ length: BAR_COUNT }, (_, i) => (
    <motion.div
      key={i}
      className="h-full w-3 rounded-full bg-gradient-to-r from-slate-700 via-slate-300 to-slate-800 shadow-[0_0_12px_rgba(0,0,0,0.6)] sm:w-4"
      style={{ transformOrigin: 'top' }}
      initial={animated ? { y: '-110%' } : false}
      animate={{ y: '0%' }}
      transition={
        animated
          ? {
              type: 'spring',
              stiffness: 260,
              damping: 16,
              delay: i * 0.04,
            }
          : { duration: 0 }
      }
    />
  ))
}

interface PrisonAnnouncementProps {
  /** Nome de quem foi preso (ou "Você"). */
  name: string
  /** É o jogador local? Muda o texto. */
  isSelf: boolean
}

/** Anúncio para todos: grades caem e travam + "Fulano foi preso!". */
export function PrisonAnnouncement({ name, isSelf }: PrisonAnnouncementProps) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="alert"
      aria-live="assertive"
    >
      {/* Grade que desce e trava. */}
      <div className="absolute inset-0 flex items-stretch justify-between px-2 sm:px-4">
        {bars(true)}
      </div>

      <motion.div
        className="relative flex flex-col items-center gap-3 px-6 text-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 18,
          delay: 0.25,
        }}
      >
        <span className="text-6xl drop-shadow-lg">🔒</span>
        <p className="text-2xl font-black text-white drop-shadow sm:text-3xl">
          {isSelf ? 'Você foi preso!' : `${name} foi preso!`}
        </p>
        <p className="text-sm font-semibold text-slate-300">
          {isSelf ? 'Você perde a próxima jogada.' : 'Perde a próxima jogada.'}
        </p>
      </motion.div>
    </motion.div>
  )
}

/** Tela de grades permanente do preso, enquanto aguarda ser solto. */
export function PrisonHeldOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 flex items-end justify-center overflow-hidden bg-black/35 pb-[18vh]"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 flex items-stretch justify-between px-2 sm:px-4">
        {bars(false)}
      </div>
      <div className="relative rounded-2xl bg-slate-900/80 px-5 py-3 text-center shadow-xl">
        <p className="text-base font-black text-white">🔒 Você está preso</p>
        <p className="text-xs font-semibold text-slate-300">
          Aguarde sua vez para ser solto…
        </p>
      </div>
    </div>
  )
}
