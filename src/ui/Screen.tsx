import type { ReactNode } from 'react'

interface ScreenProps {
  children: ReactNode
  /** Quando true, ocupa toda a altura e centraliza o conteúdo. */
  center?: boolean
  className?: string
}

/** Fundo vibrante (gradiente) padrão de todas as telas. */
export function Screen({
  children,
  center = false,
  className = '',
}: ScreenProps) {
  return (
    <div
      className={
        'min-h-screen w-full bg-gradient-to-b from-sky via-brand-light to-brand ' +
        'px-4 py-6 ' +
        (center ? 'flex items-center justify-center ' : '') +
        className
      }
    >
      {children}
    </div>
  )
}
