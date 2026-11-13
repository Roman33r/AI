import type { LessonGuide } from './types'
import { foundationGuides } from './foundations'
import { pythonProjectGuides } from './python-project'
import { mlGuides } from './ml'
import { mlAdvancedGuides } from './ml-advanced'
import { dlGuides } from './dl'
import { dlAdvancedGuides } from './dl-advanced'
import { llmGuides } from './llm'
import { llmAdvancedGuides } from './llm-advanced'
import { productionGuides } from './production'
import { productionAdvancedGuides } from './production-advanced'
import { capstoneGuides } from './capstone'
import { careerGuides } from './career'

export const lessonGuides: LessonGuide[] = [
  ...foundationGuides,
  ...pythonProjectGuides,
  ...mlGuides,
  ...mlAdvancedGuides,
  ...dlGuides,
  ...dlAdvancedGuides,
  ...llmGuides,
  ...llmAdvancedGuides,
  ...productionGuides,
  ...productionAdvancedGuides,
  ...capstoneGuides,
  ...careerGuides,
].sort((a, b) => a.id - b.id)

const guidesById = new Map(lessonGuides.map((guide) => [guide.id, guide]))

export function getLessonGuide(id: number): LessonGuide {
  const guide = guidesById.get(id)
  if (!guide) throw new Error(`Учебный материал недели ${id} не найден`)
  return guide
}

export type { LessonGuide } from './types'
