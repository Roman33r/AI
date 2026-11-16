import { foundationWeeks } from './weeks-foundations'
import { mlWeeks } from './weeks-ml'
import { dlWeeks } from './weeks-dl'
import { llmWeeks } from './weeks-llm'
import { productionWeeks } from './weeks-production'
import { finalWeeks } from './weeks-final'
import { projectWeeks } from './project-plan'
import type { Week } from './types'

const projectByWeek = new Map(projectWeeks.map((plan) => [plan.id, plan]))

export const weeks: Week[] = [
  ...foundationWeeks, ...mlWeeks, ...dlWeeks,
  ...llmWeeks, ...productionWeeks, ...finalWeeks,
].sort((a, b) => a.id - b.id).map((week) => {
  const plan = projectByWeek.get(week.id)
  if (!plan) throw new Error(`Проектная неделя ${week.id} не найдена`)
  return { ...week, ...plan }
})

export const totalConcepts = weeks.reduce((sum, week) => sum + week.concepts.length, 0)
export const totalSteps = weeks.reduce((sum, week) => sum + week.steps.length, 0)

export * from './types'
export * from './stages'
