/**
 * Regressão do modal de resultado (acerto/erro). O bug: no backend real o turno
 * avança IMEDIATAMENTE após a resposta (`turnChanged` zera `question` no store),
 * então o modal — antes acoplado à presença de `question` — desmontava antes de
 * revelar o feedback. O mock mascarava o problema por adiar o `turnChanged` 1,5s.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { PlayScreen } from './PlayScreen'
import { useGameStore } from '../../game/store/gameStore'
import type {
  AnswerResultEvent,
  QuestionPromptEvent,
  SessionState,
} from '../../game/types'

// Áudio: no-op (sem Web Audio em jsdom).
vi.mock('../audio', () => ({ playSfx: () => {} }))

// Tabuleiro: irrelevante aqui e usa ResizeObserver (ausente no jsdom).
vi.mock('../board', () => ({ BoardSvg: () => null }))

// Sem camada de playback do dado: o foco é o gating do modal de pergunta.
vi.mock('./useDiceThrows', () => ({
  useDiceThrows: () => ({
    activeThrow: null,
    visualSquares: {},
    isThrowing: false,
    onThrowSettled: () => {},
    prisonAlert: null,
  }),
}))

// framer-motion como passthrough determinístico (anima nada, renderiza filhos).
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const passthrough = (props: { className?: string; children?: unknown }) =>
    React.createElement(
      'div',
      { className: props.className },
      props.children as React.ReactNode,
    )
  return {
    AnimatePresence: (props: { children?: unknown }) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
    motion: new Proxy({}, { get: () => passthrough }),
  }
})

function makeSession(): SessionState {
  return {
    code: 'ABC123',
    status: 'playing',
    difficulty: 'normal',
    board: {
      size: 20,
      questionSquares: [3],
      subjectBySquare: { 3: 'matematica' },
      tileTypeBySquare: { 3: 'question' },
    },
    players: [
      { id: 'me', name: 'Eu', square: 3, connected: true, usedQuestionIds: [], skipTurns: 0, isHost: true },
      { id: 'bot', name: 'Bot', square: 0, connected: true, usedQuestionIds: [], skipTurns: 0, isHost: false },
    ],
    turnOrder: ['me', 'bot'],
    currentTurnIndex: 0,
    ordering: null,
    winner: null,
    createdAt: 0,
    lastActivityAt: 0,
  }
}

const question: QuestionPromptEvent = {
  questionId: 'q1',
  subject: 'matematica',
  statement: 'Quanto é 2+2?',
  options: ['3', '4', '5', '6'],
}

beforeEach(() => {
  useGameStore.setState({
    session: makeSession(),
    myPlayerId: 'me',
    phase: 'playing',
    lastDice: null,
    ordering: null,
    orderRolls: [],
    question,
    lastAnswer: null,
    turnSkipped: null,
    spectatorNote: null,
  })
})

describe('PlayScreen — modal de resultado', () => {
  it('revela o acerto mesmo quando o turno avança logo após a resposta', async () => {
    render(<PlayScreen />)
    expect(screen.getByText('Quanto é 2+2?')).toBeInTheDocument()

    // Backend real: answerResult (lastAnswer) + turnChanged (question=null) juntos.
    act(() => {
      const answer: AnswerResultEvent = {
        playerId: 'me',
        correct: true,
        errorType: null,
        movement: 2,
        fromSquare: 3,
        toSquare: 5,
      }
      useGameStore.setState({ lastAnswer: answer, question: null })
    })

    // O modal NÃO pode sumir: o reveal de acerto precisa aparecer.
    await waitFor(() =>
      expect(screen.getByText('Acertou! 🎉')).toBeInTheDocument(),
    )
  })

  it('revela o erro mesmo quando o turno avança logo após a resposta', async () => {
    render(<PlayScreen />)

    act(() => {
      const answer: AnswerResultEvent = {
        playerId: 'me',
        correct: false,
        errorType: 'wrong',
        movement: -2,
        fromSquare: 3,
        toSquare: 1,
      }
      useGameStore.setState({ lastAnswer: answer, question: null })
    })

    await waitFor(() => expect(screen.getByText('Errou 😕')).toBeInTheDocument())
  })

  it('não exibe modal de resultado para resposta de OUTRO jogador', () => {
    // Sem pergunta local e com resultado de um bot: nada de modal do jogador local.
    useGameStore.setState({ question: null })
    render(<PlayScreen />)

    act(() => {
      const botAnswer: AnswerResultEvent = {
        playerId: 'bot',
        correct: true,
        errorType: null,
        movement: 2,
        fromSquare: 0,
        toSquare: 2,
      }
      useGameStore.setState({ lastAnswer: botAnswer })
    })

    expect(screen.queryByText('Acertou! 🎉')).not.toBeInTheDocument()
  })
})
