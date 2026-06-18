import { appearanceToSync, colorForIndex, emojiForIndex } from './playerViews'

describe('appearanceToSync', () => {
  it('não sincroniza quando não há escolha local (fallback por índice já bate)', () => {
    expect(appearanceToSync({}, { color: '', emoji: '' }, 2)).toBeNull()
  })

  it('sincroniza a escolha persistida ao entrar (host ainda não a conhece)', () => {
    // Regressão: aparência salva em localStorage precisa ir ao backend mesmo
    // sem o usuário mexer no seletor, senão o host vê o fallback por índice.
    expect(
      appearanceToSync({}, { color: '#ff0000', emoji: '🦊' }, 1),
    ).toEqual({ color: '#ff0000', emoji: '🦊' })
  })

  it('completa a parte ausente com o default por índice (contrato exige cor+emoji)', () => {
    expect(appearanceToSync({}, { color: '#ff0000', emoji: '' }, 3)).toEqual({
      color: '#ff0000',
      emoji: emojiForIndex(3),
    })
    expect(appearanceToSync({}, { color: '', emoji: '🚀' }, 3)).toEqual({
      color: colorForIndex(3),
      emoji: '🚀',
    })
  })

  it('não reenvia quando o backend já ecoou a mesma aparência (evita loop)', () => {
    const me = { color: '#ff0000', emoji: '🦊' }
    expect(appearanceToSync(me, { color: '#ff0000', emoji: '🦊' }, 1)).toBeNull()
  })

  it('reenvia quando o eco do backend difere da escolha local', () => {
    const me = { color: '#00ff00', emoji: '🐯' }
    expect(
      appearanceToSync(me, { color: '#ff0000', emoji: '🦊' }, 1),
    ).toEqual({ color: '#ff0000', emoji: '🦊' })
  })

  it('normaliza índice negativo para 0', () => {
    expect(appearanceToSync({}, { color: '', emoji: '⭐' }, -1)).toEqual({
      color: colorForIndex(0),
      emoji: '⭐',
    })
  })
})
