import type { Concept, Week } from '../data/types'

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

function shuffled<T>(items: T[], seed: number): T[] {
  const result = [...items]
  let value = seed + 1
  for (let i = result.length - 1; i > 0; i -= 1) {
    value = (value * 9301 + 49297) % 233280
    const j = Math.floor((value / 233280) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function conceptQuestion(concept: Concept, pool: Concept[], key: string, seed: number): QuizQuestion {
  const distractors = shuffled(pool.filter((item) => item.term !== concept.term), seed).slice(0, 3)
  const options = shuffled([concept, ...distractors], seed + 17)
  return {
    id: key,
    question: `Что означает понятие «${concept.term}»?`,
    options: options.map((item) => item.definition),
    answer: options.findIndex((item) => item.term === concept.term),
    explanation: `${concept.term}: ${concept.definition}`,
  }
}

export function makeWeekQuiz(week: Week): QuizQuestion[] {
  const picks = shuffled(week.concepts, week.id * 31 + 7).slice(0, Math.min(3, week.concepts.length))
  return picks.map((concept, index) => conceptQuestion(concept, week.concepts, `${week.id}-${index}`, week.id * 43 + index))
}

export function makeMixedQuiz(weeks: Week[], seed = 52, count = 10): QuizQuestion[] {
  const all = weeks.flatMap((week) => week.concepts.map((concept) => ({ ...concept, week: week.id })))
  return shuffled(all, seed).slice(0, count).map((concept, index) => {
    const sameTopic = all.filter((item) => Math.abs(item.week - concept.week) <= 8)
    return conceptQuestion(concept, sameTopic.length >= 4 ? sameTopic : all, `mixed-${seed}-${index}`, seed * 17 + index)
  })
}
