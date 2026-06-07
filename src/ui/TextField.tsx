import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Classe extra no wrapper (margens etc.). */
  containerClassName?: string
}

const inputBase =
  'w-full rounded-xl border-2 border-slate-200 px-4 py-3.5 text-base ' +
  'text-slate-800 transition focus:border-brand focus:outline-none ' +
  'focus:ring-4 focus:ring-brand/20 placeholder:text-slate-400'

/** Campo de texto rotulado reutilizável (nome, código, etc.). */
export function TextField({
  label,
  className = '',
  containerClassName = '',
  id,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={containerClassName}>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <input id={inputId} className={`${inputBase} ${className}`} {...rest} />
    </div>
  )
}
