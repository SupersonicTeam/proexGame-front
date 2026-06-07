import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 ' +
  'font-bold tracking-wide transition-transform duration-150 active:scale-95 ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ' +
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-lg shadow-accent/30 hover:brightness-110',
  secondary:
    'bg-brand text-white shadow-lg shadow-brand/30 hover:brightness-110',
  ghost: 'bg-white/15 text-white hover:bg-white/25',
}

/** Botão padrão do app, com variantes vibrantes (público teen). */
export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
