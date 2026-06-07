interface Option<T extends string> {
  value: T
  label: string
  hint?: string
}

interface OptionGroupProps<T extends string> {
  /** Rótulo da seção (opcional). */
  label?: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  /** Nº de colunas da grade (default = nº de opções). */
  columns?: number
  className?: string
}

/** Grade de cartões de escolha reutilizável (ex.: dificuldade). */
export function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  columns,
  className = '',
}: OptionGroupProps<T>) {
  const cols = columns ?? options.length
  return (
    <div className={className}>
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </span>
      )}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={
                'rounded-xl border-2 px-2 py-4 text-center transition ' +
                (active
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300')
              }
            >
              <span className="block text-base font-bold">{opt.label}</span>
              {opt.hint && (
                <span className="mt-1 block text-xs leading-tight opacity-70">
                  {opt.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
