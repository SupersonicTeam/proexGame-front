/**
 * Overlay dramático do arremesso: escurece a tela e mostra o dado 3D grande
 * sendo "lançado". Não bloqueia toques (pointer-events-none). Aparece enquanto
 * há um arremesso ativo e some ao assentar.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { Dice3D } from '../../ui/Dice3D'
import type { ThrowItem } from './useDiceThrows'

interface DiceThrowOverlayProps {
  active: ThrowItem | null
  onSettled: () => void
}

export function DiceThrowOverlay({ active, onSettled }: DiceThrowOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-5">
            <Dice3D
              key={active.id}
              value={active.value}
              rollKey={active.id}
              size={144}
              onSettled={onSettled}
            />
            <p className="text-base font-black tracking-wide text-white drop-shadow">
              {active.kind === 'order' ? 'Definindo ordem…' : 'Rolando o dado…'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
