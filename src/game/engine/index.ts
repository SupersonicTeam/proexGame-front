/** Barrel do motor puro do jogo (sem efeitos colaterais, testável). */
export { rollD6 } from './dice'
export { rollForOrder, resolveOrder } from './turnOrder'
export type { OrderRollResult } from './turnOrder'
export {
  applyDiceMove,
  advanceForCorrect,
  retreatForError,
  applyAdvance,
  applyRetreat,
} from './movement'
export { generateBoard } from './board'
export { selectQuestion, buildOptions } from './questionPool'
export { generateSessionCode } from './code'
