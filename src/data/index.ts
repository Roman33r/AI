import { foundationWeeks } from './weeks-foundations'
import { mlWeeks } from './weeks-ml'
import { dlWeeks } from './weeks-dl'
import { llmWeeks } from './weeks-llm'
import { productionWeeks } from './weeks-production'
import { finalWeeks } from './weeks-final'

export const weeks = [
  ...foundationWeeks, ...mlWeeks, ...dlWeeks,
  ...llmWeeks, ...productionWeeks, ...finalWeeks,
].sort((a, b) => a.id - b.id)

export const totalConcepts = weeks.reduce((sum, week) => sum + week.concepts.length, 0)
export const totalSteps = weeks.reduce((sum, week) => sum + week.steps.length, 0)

export * from './types'
export * from './stages'
