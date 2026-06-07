import { useState } from 'react'
import type { Difficulty } from '../../game/types'
import { useGameStore } from '../../game/store/gameStore'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Screen } from '../../ui/Screen'

const DIFFICULTIES: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'easy', label: 'Fácil', hint: 'Mais avanço, menos perguntas' },
  { value: 'normal', label: 'Normal', hint: 'Equilibrado' },
  { value: 'hard', label: 'Difícil', hint: 'Menos avanço, mais perguntas' },
]

type Mode = 'create' | 'join'

/** Tela inicial: criar uma nova sessão ou entrar por código. */
export function HomeScreen() {
  const createSession = useGameStore((s) => s.createSession)
  const joinSession = useGameStore((s) => s.joinSession)
  const error = useGameStore((s) => s.error)

  const [mode, setMode] = useState<Mode>('create')
  const [name, setName] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [code, setCode] = useState('')

  const trimmed = name.trim()
  const canCreate = trimmed.length >= 2
  const canJoin = canCreate && code.trim().length === 5

  return (
    <Screen center>
      <div className="w-full max-w-md">
        <header className="mb-6 text-center text-white drop-shadow">
          <h1 className="text-4xl font-black tracking-tight">
            Trilha do Saber
          </h1>
          <p className="mt-1 text-white/90">
            Jogo de tabuleiro educativo — responda e avance!
          </p>
        </header>

        <Card>
          <div className="mb-5 flex rounded-2xl bg-brand/10 p-1">
            <TabButton
              active={mode === 'create'}
              onClick={() => setMode('create')}
            >
              Criar sessão
            </TabButton>
            <TabButton active={mode === 'join'} onClick={() => setMode('join')}>
              Entrar com código
            </TabButton>
          </div>

          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Seu nome
          </label>
          <input
            className="mb-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como vão te chamar?"
            maxLength={16}
          />

          {mode === 'create' ? (
            <>
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Dificuldade
              </span>
              <div className="mb-5 grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={
                      'rounded-xl border-2 px-2 py-3 text-center transition ' +
                      (difficulty === d.value
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300')
                    }
                  >
                    <span className="block font-bold">{d.label}</span>
                    <span className="mt-1 block text-[11px] leading-tight opacity-70">
                      {d.hint}
                    </span>
                  </button>
                ))}
              </div>
              <Button
                className="w-full"
                disabled={!canCreate}
                onClick={() => createSession({ name: trimmed, difficulty })}
              >
                Criar sessão
              </Button>
              <p className="mt-3 text-center text-xs text-slate-500">
                Você jogará contra 2 oponentes simulados (modo demonstração).
              </p>
            </>
          ) : (
            <>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Código da sessão
              </label>
              <input
                className="mb-5 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-lg tracking-widest text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 5))
                }
                placeholder="00000"
                inputMode="numeric"
              />
              <Button
                variant="secondary"
                className="w-full"
                disabled={!canJoin}
                onClick={() =>
                  joinSession({ name: trimmed, code: code.trim() })
                }
              >
                Entrar
              </Button>
              <p className="mt-3 text-center text-xs text-slate-500">
                Entrar em sessão de outro jogador exige o servidor online (em
                breve).
              </p>
            </>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-coral/15 px-4 py-2 text-center text-sm font-semibold text-coral">
              {error}
            </p>
          )}
        </Card>
      </div>
    </Screen>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ' +
        (active ? 'bg-white text-brand shadow' : 'text-brand/70')
      }
    >
      {children}
    </button>
  )
}
