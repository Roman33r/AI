import type { ProgressState, Week, WeekProgress } from '@/data/types'

const STORAGE_KEY = 'ai-engineering-roadmap-progress-v1'

export const emptyWeekProgress = (): WeekProgress => ({
  checkedSteps: [], masteredConcepts: [], taskDone: false,
  outcomeDone: false, quizBest: 0, notes: '',
})

export const initialProgress = (): ProgressState => ({
  version: 1, weeks: {}, reviewLater: [], activity: {}, weeklyGoal: 15, theme: 'light',
})

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialProgress()
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    return {
      ...initialProgress(), ...parsed,
      weeks: parsed.weeks ?? {}, reviewLater: parsed.reviewLater ?? [],
      activity: parsed.activity ?? {},
    }
  } catch {
    return initialProgress()
  }
}

export function saveProgress(state: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getWeekProgress(state: ProgressState, id: number): WeekProgress {
  return { ...emptyWeekProgress(), ...state.weeks[String(id)] }
}

export function isWeekComplete(progress: WeekProgress) {
  return Boolean(progress.completedAt)
}

export function canCompleteWeek(week: Week, progress: WeekProgress) {
  const requiredQuiz = Math.min(3, week.concepts.length)
  return progress.checkedSteps.length === week.steps.length && progress.taskDone &&
    progress.outcomeDone && progress.quizBest >= requiredQuiz
}

export function weekCompletionRatio(week: Week, progress: WeekProgress) {
  if (progress.completedAt) return 1
  const requiredQuiz = Math.min(3, week.concepts.length)
  const units = week.steps.length + 3
  const done = progress.checkedSteps.length + Number(progress.taskDone) +
    Number(progress.outcomeDone) + Number(progress.quizBest >= requiredQuiz)
  return done / units
}

export function registerActivity(state: ProgressState, minutes = 1): ProgressState {
  const day = new Date().toISOString().slice(0, 10)
  return { ...state, activity: { ...state.activity, [day]: (state.activity[day] ?? 0) + minutes } }
}

export function downloadProgress(state: ProgressState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ai-roadmap-progress-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadPlan(weeks: Week[]) {
  const text = ['# AI Engineering — 52 недели', '', ...weeks.flatMap((week) => [
    `## Неделя ${week.id}. ${week.title}`, '', `**Цель:** ${week.goal}`, '',
    '### Понятия', ...week.concepts.map((item) => `- **${item.term}** — ${item.definition}`), '',
    '### Порядок выполнения', ...week.steps.map((step, index) => `${index + 1}. ${step}`), '',
    `**Практика:** ${week.task}`, '', `**Критерий готовности:** ${week.outcome}`, '',
  ])].join('\n')
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'AI-Engineering-52-weeks.md'
  link.click()
  URL.revokeObjectURL(url)
}
