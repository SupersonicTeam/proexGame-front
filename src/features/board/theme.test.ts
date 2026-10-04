import { describe, expect, it } from 'vitest'
import { BACKEND_SUBJECTS } from '../../game/types'
import { subjectColor, subjectIcon, subjectLabel, subjectName } from './theme'

/**
 * Feature logica-programacao (PROG-10): cada categoria do backend tem nome,
 * rótulo curto, ícone e cor explícitos — nunca o fallback genérico.
 */

const EXPECTED: Record<string, { name: string; label: string; icon: string }> =
  {
    algoritmos: { name: 'Algoritmos', label: 'Algo', icon: '🧭' },
    'variaveis-e-tipos': {
      name: 'Variáveis e Tipos',
      label: 'Var',
      icon: '📦',
    },
    condicionais: { name: 'Condicionais', label: 'Se', icon: '🔀' },
    'operadores-logicos': {
      name: 'Operadores Lógicos',
      label: 'E/OU',
      icon: '🧩',
    },
    'lacos-de-repeticao': {
      name: 'Laços de Repetição',
      label: 'Laço',
      icon: '🔁',
    },
    vetores: { name: 'Vetores', label: 'Vetor', icon: '🗃️' },
    funcoes: { name: 'Funções', label: 'Func', icon: '🧱' },
    'busca-e-ordenacao': {
      name: 'Busca e Ordenação',
      label: 'Busca',
      icon: '🔍',
    },
  }

describe('theme — categorias de lógica de programação', () => {
  it.each([...BACKEND_SUBJECTS])(
    '%s tem nome, rótulo e ícone explícitos',
    (slug) => {
      expect(subjectName(slug)).toBe(EXPECTED[slug].name)
      expect(subjectLabel(slug)).toBe(EXPECTED[slug].label)
      expect(subjectIcon(slug)).toBe(EXPECTED[slug].icon)
    },
  )

  it('rótulos curtos cabem na casa (≤ 6 caracteres)', () => {
    for (const slug of BACKEND_SUBJECTS) {
      expect([...subjectLabel(slug)].length).toBeLessThanOrEqual(6)
    }
  })

  it('as 8 categorias têm cores hex distintas', () => {
    const colors = BACKEND_SUBJECTS.map(subjectColor)
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/)
    expect(new Set(colors).size).toBe(BACKEND_SUBJECTS.length)
  })

  it('slug desconhecido continua caindo no fallback', () => {
    expect(subjectName('estruturas-de-dados')).toBe('Estruturas De Dados')
    expect(subjectLabel('estruturas-de-dados')).toBe('Est')
    expect(subjectIcon('estruturas-de-dados')).toBe('📚')
  })

  it('matérias escolares antigas não têm mais entrada própria', () => {
    expect(subjectName('matematica')).toBe('Matematica')
    expect(subjectIcon('historia')).toBe('📚')
  })
})
