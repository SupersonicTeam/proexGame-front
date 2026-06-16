/**
 * Modal de pergunta do jogador local. Mostra enunciado + 4 alternativas já
 * embaralhadas; ao escolher, faz um SUSPENSE curto e então REVELA, com animação,
 * quantas casas o jogador andou (avanço no acerto / recuo no erro). A alternativa
 * correta só é conhecida APÓS a submissão (vem em `lastAnswer.correctIndex`, RF-16).
 */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AnswerResultEvent, QuestionPromptEvent } from '../../game/types'
import { subjectColor, subjectName } from '../board/theme'
import { playSfx } from '../audio'

interface QuestionModalProps {
  question: QuestionPromptEvent
  lastAnswer: AnswerResultEvent | null
  onSubmit: (optionIndex: number) => void
  onClose: () => void
}

const LETTERS = ['A', 'B', 'C', 'D']
/**
 * Tensão antes de revelar o resultado. Curto de propósito: o servidor/mock
 * avança o turno ~1,5s após a resposta (fecha/remonta o modal), então suspense
 * + reveal precisam caber nessa janela.
 */
const SUSPENSE_MS = 500
/** Fechamento de segurança (o store normalmente fecha antes, ao trocar de turno). */
const REVEAL_HOLD_MS = 3000

type Phase = 'choosing' | 'suspense' | 'reveal'

export function QuestionModal({
  question,
  lastAnswer,
  onSubmit,
  onClose,
}: QuestionModalProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const answered = lastAnswer !== null
  // Fase é DERIVADA (sem setState síncrono no efeito): choosing → suspense → reveal.
  const phase: Phase = !answered ? 'choosing' : revealed ? 'reveal' : 'suspense'

  // Ao responder: após o suspense, revela (com som) e agenda o fechamento.
  useEffect(() => {
    if (!answered || !lastAnswer) return
    const toReveal = setTimeout(() => {
      setRevealed(true)
      playSfx(lastAnswer.correct ? 'correct' : 'wrong')
    }, SUSPENSE_MS)
    const toClose = setTimeout(onClose, SUSPENSE_MS + REVEAL_HOLD_MS)
    return () => {
      clearTimeout(toReveal)
      clearTimeout(toClose)
    }
  }, [answered, lastAnswer, onClose])

  const subjColor = subjectColor(question.subject)

  function optionClass(i: number): string {
    if (!answered) {
      return 'border-slate-200 bg-white hover:border-brand hover:bg-brand/5'
    }
    if (i === selected) {
      // No suspense, a opção escolhida fica "pensando" (sem revelar acerto/erro);
      // no reveal, vira verde/vermelho. RF-16: não revela qual era a correta.
      if (phase !== 'reveal') {
        return 'border-brand bg-brand/5 text-slate-700'
      }
      return lastAnswer!.correct
        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
        : 'border-rose-500 bg-rose-50 text-rose-800'
    }
    return 'border-slate-200 bg-white opacity-60'
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <span
          className="inline-block rounded-full px-3 py-1 text-sm font-bold text-white"
          style={{ backgroundColor: subjColor }}
        >
          {subjectName(question.subject)}
        </span>

        <h2 className="mt-4 text-xl font-black leading-snug text-slate-800">
          {question.statement}
        </h2>

        <div className="mt-5 grid gap-2.5">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => {
                if (answered) return
                setSelected(i)
                onSubmit(i)
              }}
              className={
                'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left ' +
                'font-semibold text-slate-700 transition disabled:cursor-default ' +
                optionClass(i)
              }
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600">
                {LETTERS[i]}
              </span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {phase === 'suspense' && (
            <motion.div
              key="suspense"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 rounded-2xl bg-slate-100 px-4 py-4 text-center"
            >
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="text-base font-black tracking-wide text-slate-500"
              >
                Calculando o resultado…
              </motion.p>
            </motion.div>
          )}

          {phase === 'reveal' && lastAnswer && (
            <MovementReveal key="reveal" answer={lastAnswer} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/** Reveal animado das casas andadas (avanço/recuo) — o "clímax" da resposta. */
function MovementReveal({ answer }: { answer: AnswerResultEvent }) {
  const steps = Math.abs(answer.movement)
  const advanced = answer.movement > 0
  const correct = answer.correct

  const headline = correct
    ? 'Acertou! 🎉'
    : answer.errorType === 'proximal'
      ? 'Quase! 😬'
      : 'Errou 😕'

  // Subtítulo com o breakdown de catch-up, quando base+impulso == total (§4).
  const { baseAdvance, tierBonus } = answer
  const showBreakdown =
    correct &&
    typeof baseAdvance === 'number' &&
    typeof tierBonus === 'number' &&
    tierBonus > 0 &&
    baseAdvance + tierBonus === steps
  const breakdownSub = showBreakdown
    ? `${baseAdvance} base + ${tierBonus} de impulso 🚀`
    : null

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 13 }}
      className={
        'mt-5 rounded-2xl px-4 py-4 text-center ' +
        (correct ? 'bg-emerald-50' : 'bg-rose-50')
      }
    >
      <p
        className={
          'text-base font-black ' +
          (correct ? 'text-emerald-700' : 'text-rose-700')
        }
      >
        {headline}
      </p>

      {steps > 0 ? (
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.1 }}
          className="mt-1 flex items-baseline justify-center gap-2"
        >
          <span
            className={
              'text-4xl font-black ' +
              (advanced ? 'text-emerald-600' : 'text-rose-600')
            }
          >
            {advanced ? '▲ +' : '▼ −'}
            {steps}
          </span>
          <span className="text-lg font-bold text-slate-500">
            {steps === 1 ? 'casa' : 'casas'}
          </span>
        </motion.div>
      ) : (
        <p className="mt-1 text-lg font-bold text-slate-500">
          Ficou na mesma casa
        </p>
      )}

      {breakdownSub && (
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {breakdownSub}
        </p>
      )}
    </motion.div>
  )
}
