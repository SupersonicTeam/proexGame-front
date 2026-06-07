/**
 * Observa o tamanho de um elemento via ResizeObserver, com debounce (~100ms)
 * para evitar recomputar o layout a cada pixel durante o redimensionamento.
 * Retorna a ref a ser anexada e o tamanho atual.
 */
import { useEffect, useRef, useState } from 'react'

export interface Size {
  width: number
  height: number
}

export function useContainerSize<T extends HTMLElement>(
  debounceMs = 100,
): { ref: React.RefObject<T | null>; size: Size } {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout> | undefined

    const apply = (rect: { width: number; height: number }) => {
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height },
      )
    }

    // Mede imediatamente na montagem.
    apply(el.getBoundingClientRect())

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => apply({ width, height }), debounceMs)
    })

    observer.observe(el)

    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
    }
  }, [debounceMs])

  return { ref, size }
}
