/**
 * Feature logica-programacao (PROG-09): o modal mostra o pseudocódigo da
 * pergunta em bloco monoespaçado, preservando quebras de linha e indentação, com
 * rolagem horizontal quando a linha não cabe. Sem `code`, nada muda.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QuestionModal } from './QuestionModal'
import type { QuestionPromptEvent } from '../../game/types'

vi.mock('../audio', () => ({ playSfx: () => {} }))

const CODE = 's <- 0\npara i de 1 ate 4 faca\n  s <- s + i\nfimpara\nescreva(s)'

function renderModal(question: QuestionPromptEvent) {
  return render(
    <QuestionModal
      question={question}
      lastAnswer={null}
      onSubmit={() => {}}
      onClose={() => {}}
    />,
  )
}

const BASE: QuestionPromptEvent = {
  questionId: 'laco-0013',
  subject: 'lacos-de-repeticao',
  statement: 'O que este algoritmo mostra?',
  options: ['15', '10', '5', '12345'],
}

describe('QuestionModal — pseudocódigo', () => {
  it('renderiza o code em <pre><code> com o texto exato (quebras e espaços)', () => {
    const { container } = renderModal({ ...BASE, code: CODE })
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    const code = pre!.querySelector('code')
    expect(code).not.toBeNull()
    expect(code!.textContent).toBe(CODE)
  })

  it('o bloco é monoespaçado, preserva espaços e rola na horizontal', () => {
    const { container } = renderModal({ ...BASE, code: CODE })
    const pre = container.querySelector('pre')!
    // Checagem por token: `whitespace-pre-wrap` quebraria as linhas do código
    // e passaria num `toContain('whitespace-pre')` de substring.
    expect(pre.classList.contains('font-mono')).toBe(true)
    expect(pre.classList.contains('whitespace-pre')).toBe(true)
    expect(pre.classList.contains('whitespace-pre-wrap')).toBe(false)
    expect(pre.classList.contains('whitespace-pre-line')).toBe(false)
    expect(pre.classList.contains('overflow-x-auto')).toBe(true)
    expect(pre.classList.contains('max-w-full')).toBe(true)
  })

  it('o bloco fica entre o enunciado e as alternativas', () => {
    const { container, getByText } = renderModal({ ...BASE, code: CODE })
    const statement = getByText('O que este algoritmo mostra?')
    const pre = container.querySelector('pre')!
    const firstOption = getByText('15')
    expect(
      statement.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      pre.compareDocumentPosition(firstOption) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('sem code, não renderiza bloco de código', () => {
    const { container, getByText } = renderModal(BASE)
    expect(container.querySelector('pre')).toBeNull()
    expect(getByText('O que este algoritmo mostra?')).toBeTruthy()
  })
})
