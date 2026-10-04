/**
 * Banco de perguntas do modo demonstração, em memória. Importa os 8 arquivos
 * JSON (um por categoria de lógica de programação — subconjunto do banco do
 * backend) e expõe coleções prontas para consumo pelo jogo.
 *
 * Os JSON inferem `subject` como `string` e `wrong` como `string[]`, então cada
 * import é convertido para `Question[]` via `as unknown as`. O conteúdo dos JSON
 * é a fonte da verdade; este módulo apenas agrega e indexa.
 */

import type { Question, Subject } from '../../game/types'

import algoritmos from './algoritmos.json'
import variaveisETipos from './variaveis-e-tipos.json'
import condicionais from './condicionais.json'
import operadoresLogicos from './operadores-logicos.json'
import lacosDeRepeticao from './lacos-de-repeticao.json'
import vetores from './vetores.json'
import funcoes from './funcoes.json'
import buscaEOrdenacao from './busca-e-ordenacao.json'

export const questionsBySubject: Record<Subject, Question[]> = {
  algoritmos: algoritmos as unknown as Question[],
  'variaveis-e-tipos': variaveisETipos as unknown as Question[],
  condicionais: condicionais as unknown as Question[],
  'operadores-logicos': operadoresLogicos as unknown as Question[],
  'lacos-de-repeticao': lacosDeRepeticao as unknown as Question[],
  vetores: vetores as unknown as Question[],
  funcoes: funcoes as unknown as Question[],
  'busca-e-ordenacao': buscaEOrdenacao as unknown as Question[],
}

export const allQuestions: Question[] = Object.values(questionsBySubject).flat()
