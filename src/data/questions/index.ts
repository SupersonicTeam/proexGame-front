/**
 * Banco de perguntas em memória. Importa os 10 arquivos JSON (um por matéria)
 * e expõe coleções prontas para consumo pelo jogo.
 *
 * Os JSON inferem `subject` como `string` e `wrong` como `string[]`, então cada
 * import é convertido para `Question[]` via `as unknown as`. O conteúdo dos JSON
 * é a fonte da verdade; este módulo apenas agrega e indexa.
 */

import type { Question, Subject } from '../../game/types'

import matematica from './matematica.json'
import portugues from './portugues.json'
import historia from './historia.json'
import geografia from './geografia.json'
import ciencias from './ciencias.json'
import biologia from './biologia.json'
import fisica from './fisica.json'
import quimica from './quimica.json'
import ingles from './ingles.json'
import artes from './artes.json'

export const questionsBySubject: Record<Subject, Question[]> = {
  matematica: matematica as unknown as Question[],
  portugues: portugues as unknown as Question[],
  historia: historia as unknown as Question[],
  geografia: geografia as unknown as Question[],
  ciencias: ciencias as unknown as Question[],
  biologia: biologia as unknown as Question[],
  fisica: fisica as unknown as Question[],
  quimica: quimica as unknown as Question[],
  ingles: ingles as unknown as Question[],
  artes: artes as unknown as Question[],
}

export const allQuestions: Question[] = Object.values(questionsBySubject).flat()
