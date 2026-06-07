import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

/** Cartão translúcido sobre o fundo vibrante. */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={
        'rounded-3xl bg-white/95 p-6 shadow-2xl ring-1 ring-black/5 ' +
        className
      }
    >
      {children}
    </div>
  )
}
