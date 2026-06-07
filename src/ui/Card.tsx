import type { ReactNode } from 'react'

type Size = 'md' | 'lg'

interface CardProps {
  children: ReactNode
  size?: Size
  className?: string
}

const paddings: Record<Size, string> = {
  md: 'p-6',
  lg: 'p-8',
}

/** Cartão branco sobre o fundo vibrante. */
export function Card({ children, size = 'md', className = '' }: CardProps) {
  return (
    <div
      className={`rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 ${paddings[size]} ${className}`}
    >
      {children}
    </div>
  )
}
