/**
 * Nomes divertidos (PT-BR) para os bots do modo hot-seat.
 * São strings voltadas ao usuário, portanto em português.
 */
export const BOT_NAMES: readonly string[] = [
  'Robô Zé',
  'Maria Byte',
  'Capivara Gamer',
  'Tião Turbo',
  'Dona Pixel',
  'Juca Jogador',
  'Tati Tática',
  'Beto Bot',
  'Nina Neon',
  'Chico Chip',
  'Lala Lógica',
  'Dudu Dados',
]

/**
 * Retorna `count` nomes de bot distintos, evitando colidir com `taken`
 * (nomes já em uso na sessão). `rng` injetável para testes.
 */
export function pickBotNames(
  count: number,
  taken: Set<string> = new Set(),
  rng: () => number = Math.random,
): string[] {
  const pool = BOT_NAMES.filter((name) => !taken.has(name))
  const chosen: string[] = []

  for (let i = 0; i < count; i++) {
    if (pool.length > 0) {
      const idx = Math.floor(rng() * pool.length)
      chosen.push(pool.splice(idx, 1)[0])
    } else {
      // Esgotou o pool: gera um nome numerado garantidamente único.
      chosen.push(`Bot ${taken.size + chosen.length + 1}`)
    }
  }

  return chosen
}
