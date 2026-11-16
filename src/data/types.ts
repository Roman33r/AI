export type Concept = {
  term: string
  definition: string
}

export type ProjectMilestone = {
  artifact: string
  files: string[]
}

export type Week = {
  id: number
  stageId: string
  title: string
  goal: string
  concepts: Concept[]
  steps: string[]
  task: string
  outcome: string
  hours: string
  project: ProjectMilestone
}

export type WeekBlueprint = Omit<Week, 'project'>
export type ProjectWeekPlan = Pick<Week, 'id' | 'goal' | 'steps' | 'task' | 'outcome' | 'project'>

export type Stage = {
  id: string
  number: number
  title: string
  shortTitle: string
  description: string
  projectResult: string
  range: string
  color: string
  softColor: string
}

export type WeekProgress = {
  checkedSteps: number[]
  masteredConcepts: string[]
  taskDone: boolean
  outcomeDone: boolean
  quizBest: number
  notes: string
  completedAt?: string
}

export type ProgressState = {
  version: 1
  weeks: Record<string, WeekProgress>
  reviewLater: string[]
  activity: Record<string, number>
  weeklyGoal: number
  theme: 'light' | 'dark'
}
