interface TabOption<T extends string> {
  value: T
  label: string
}

interface TabsProps<T extends string> {
  value: T
  options: TabOption<T>[]
  onChange: (value: T) => void
  className?: string
}

/** Alternador segmentado reutilizável (ex.: Criar sessão / Entrar com código). */
export function Tabs<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: TabsProps<T>) {
  return (
    <div className={`flex rounded-2xl bg-brand/10 p-1 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              'flex-1 rounded-xl px-3 py-2.5 text-base font-bold transition ' +
              (active ? 'bg-white text-brand shadow' : 'text-brand/70')
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
