/**
 * Controle de som = um único botão que liga/desliga o som (sem painel nem
 * ajuste de volume).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SoundControls } from './SoundControls'
import { useAudioStore } from './useAudioStore'

describe('SoundControls — botão de mudo', () => {
  beforeEach(() => {
    useAudioStore.setState({ muted: false })
    localStorage.clear()
  })

  it('mostra um único botão, sem controle de volume', () => {
    render(<SoundControls />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.queryByLabelText('Volume')).toBeNull()
  })

  it('um clique silencia e outro clique reativa o som', () => {
    render(<SoundControls />)
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-label')).toBe('Silenciar som')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.textContent).toBe('🔊')

    fireEvent.click(button)
    expect(useAudioStore.getState().muted).toBe(true)
    expect(button.getAttribute('aria-label')).toBe('Ativar som')
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.textContent).toBe('🔇')

    fireEvent.click(button)
    expect(useAudioStore.getState().muted).toBe(false)
    expect(button.textContent).toBe('🔊')
  })

  it('a escolha de mudo fica salva entre visitas', () => {
    render(<SoundControls />)
    fireEvent.click(screen.getByRole('button'))
    expect(JSON.parse(localStorage.getItem('tds-audio') ?? '{}')).toEqual({
      muted: true,
    })
  })
})

describe('useAudioStore — som desligado por padrão', () => {
  it('primeira visita (sem preferência salva) começa no mudo', async () => {
    localStorage.clear()
    vi.resetModules()
    const { useAudioStore: fresh } = await import('./useAudioStore')
    expect(fresh.getState().muted).toBe(true)
  })

  it('respeita quem já ligou o som antes', async () => {
    localStorage.setItem('tds-audio', JSON.stringify({ muted: false }))
    vi.resetModules()
    const { useAudioStore: fresh } = await import('./useAudioStore')
    expect(fresh.getState().muted).toBe(false)
  })

  it('preferência ilegível volta ao padrão mudo', async () => {
    localStorage.setItem('tds-audio', '{quebrado')
    vi.resetModules()
    const { useAudioStore: fresh } = await import('./useAudioStore')
    expect(fresh.getState().muted).toBe(true)
  })
})
