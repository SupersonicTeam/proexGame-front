/**
 * Modal de pergunta do jogador local. Mostra enunciado + 4 alternativas já
 * embaralhadas; ao escolher, submete e exibe o feedback (acerto/erro) por um
 * instante antes de fechar. A alternativa correta só é conhecida APÓS a
 * submissão (vem em `lastAnswer.correctIndex`, RF-16).
 */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AnswerResultEvent, QuestionPromptEvent } from '../../game/types'
import { subjectColor, subjectName } from '../board/theme'

interface QuestionModalProps {
  question: QuestionPromptEvent
  lastAnswer: AnswerResultEvent | null
  onSubmit: (optionIndex: number) => void
  onClose: () => void
}

const LETTERS = ['A', 'B', 'C', 'D']
const FEEDBACK_MS = 1600

export function QuestionModal({
  question,
  lastAnswer,
  onSubmit,
  onClose,
}: QuestionModalProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = lastAnswer !== null

  // Fecha automaticamente após mostrar o feedback.
  useEffect(() => {
    if (!answered) return
    const t = setTimeout(onClose, FEEDBACK_MS)
    return () => clearTimeout(t)
  }, [answered, onClose])

  const subjColor = subjectColor(question.subject)

  function optionClass(i: number): string {
    if (!answered) {
      return 'border-slate-200 bg-white hover:border-brand hover:bg-brand/5'
    }
    if (i === lastAnswer!.correctIndex) {
      return 'border-emerald-500 bg-emerald-50 text-emerald-800'
    }
    if (i === selected) {
      return 'border-rose-500 bg-rose-50 text-rose-800'
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
          {answered && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                'mt-5 rounded-xl px-4 py-3 text-center font-bold ' +
                (lastAnswer!.correct
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800')
              }
            >
              {feedbackText(lastAnswer!)}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function feedbackText(answer: AnswerResultEvent): string {
  const steps = Math.abs(answer.movement)
  if (answer.correct) {
    return steps > 0 ? `Acertou! Avançou ${steps} casa(s) 🎉` : 'Acertou! 🎉'
  }
  const prefix = answer.errorType === 'proximal' ? 'Quase!' : 'Errou.'
  return steps > 0 ? `${prefix} Recuou ${steps} casa(s)` : `${prefix}`
}
