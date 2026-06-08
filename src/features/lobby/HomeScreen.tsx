import { useState } from 'react'
import type { Difficulty } from '../../game/types'
import { useGameStore } from '../../game/store/gameStore'
import { usingBackend } from '../../game/client'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Screen } from '../../ui/Screen'
import { TextField } from '../../ui/TextField'
import { Tabs } from '../../ui/Tabs'
import { OptionGroup } from '../../ui/OptionGroup'

const DIFFICULTIES: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'easy', label: 'Fácil', hint: 'Mais avanço, menos perguntas' },
  { value: 'normal', label: 'Normal', hint: 'Equilibrado' },
  { value: 'hard', label: 'Difícil', hint: 'Menos avanço, mais perguntas' },
]

type Mode = 'create' | 'join'

const MODE_TABS: { value: Mode; label: string }[] = [
  { value: 'create', label: 'Criar sessão' },
  { value: 'join', label: 'Entrar com código' },
]

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
      <div className="w-full max-w-lg">
        <header className="mb-8 text-center text-white drop-shadow">
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            Trilha do Saber
          </h1>
          <p className="mt-2 text-lg text-white/90">
            Jogo de tabuleiro educativo — responda e avance!
          </p>
        </header>

        <Card size="lg">
          <Tabs
            className="mb-6"
            value={mode}
            options={MODE_TABS}
            onChange={setMode}
          />

          <TextField
            label="Seu nome"
            containerClassName="mb-5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como vão te chamar?"
            maxLength={16}
          />

          {mode === 'create' ? (
            <>
              <OptionGroup
                className="mb-6"
                label="Dificuldade"
                value={difficulty}
                options={DIFFICULTIES}
                onChange={setDifficulty}
              />
              <Button
                size="lg"
                className="w-full"
                disabled={!canCreate}
                onClick={() => createSession({ name: trimmed, difficulty })}
              >
                Criar sessão
              </Button>
              <p className="mt-4 text-center text-sm text-slate-500">
                {usingBackend
                  ? 'Compartilhe o código com os outros jogadores para começar (mín. 2).'
                  : 'Você jogará contra 2 oponentes simulados (modo demonstração).'}
              </p>
            </>
          ) : (
            <>
              <TextField
                label="Código da sessão"
                containerClassName="mb-6"
                className="font-mono text-xl tracking-[0.4em]"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 5))
                }
                placeholder="00000"
                inputMode="numeric"
              />
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={!canJoin}
                onClick={() =>
                  joinSession({ name: trimmed, code: code.trim() })
                }
              >
                Entrar
              </Button>
              <p className="mt-4 text-center text-sm text-slate-500">
                Entrar em sessão de outro jogador exige o servidor online (em
                breve).
              </p>
            </>
          )}

          {error && (
            <p className="mt-5 rounded-xl bg-coral/15 px-4 py-3 text-center text-sm font-semibold text-coral">
              {error}
            </p>
          )}
        </Card>
      </div>
    </Screen>
  )
}
