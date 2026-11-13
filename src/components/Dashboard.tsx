import { ArrowRight, BookOpen, CheckCircle2, Clock3, Flame, Layers3, Target } from 'lucide-react'
import { getStage, stages, totalConcepts, totalSteps, weeks, type ProgressState } from '@/data'
import { getWeekProgress, isWeekComplete } from '@/lib/progress'
import { studyPrinciples } from '@/data/resources'
import { ProgressRing } from './ProgressRing'
import { FocusTimer } from './FocusTimer'

export function Dashboard({ state, onContinue, onOpenWeek, onTimerFinish }: {
  state: ProgressState
  onContinue: () => void
  onOpenWeek: (id: number) => void
  onTimerFinish: (minutes: number) => void
}) {
  const completed = weeks.filter((week) => isWeekComplete(getWeekProgress(state, week.id))).length
  const current = weeks.find((week) => !isWeekComplete(getWeekProgress(state, week.id))) ?? weeks[weeks.length - 1]
  const currentStage = getStage(current.stageId)
  const mastered = Object.values(state.weeks).reduce((sum, week) => sum + week.masteredConcepts.length, 0)
  const steps = Object.values(state.weeks).reduce((sum, week) => sum + week.checkedSteps.length, 0)
  const ratio = (completed / weeks.length) * 100
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return { key, day: date.toLocaleDateString('ru-RU', { weekday: 'short' }), value: state.activity[key] ?? 0 }
  })
  const maxActivity = Math.max(45, ...recentDays.map((day) => day.value))

  return (
    <div className="dashboard page-enter">
      <section className="dashboard-hero" style={{ '--stage-color': currentStage.color } as React.CSSProperties}>
        <div className="dashboard-hero__copy">
          <div className="dashboard-kicker"><span /> Твой следующий шаг</div>
          <h1>AI-инженеринг.<br /><em>Без пропусков.</em></h1>
          <p>От первой Python-программы до защищённого AI-сервиса: теория простыми словами, практика и проверяемый результат каждую неделю.</p>
          <button className="button button--hero" onClick={onContinue}>Продолжить неделю {current.id} <ArrowRight size={19} /></button>
        </div>
        <div className="dashboard-hero__visual" aria-hidden="true">
          <span className="giant-number">52</span>
          <div className="orbit orbit--one" /><div className="orbit orbit--two" />
          <span className="visual-label">WEEKS<br />TO SHIP</span>
        </div>
        <div className="dashboard-hero__current">
          <span>{currentStage.shortTitle}</span>
          <strong>Неделя {current.id}. {current.title}</strong>
          <p>{current.goal}</p>
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="dashboard-stats__ring"><ProgressRing value={ratio} /><div><strong>{completed} из {weeks.length}</strong><span>недель завершено</span></div></div>
        <div className="stat-item"><BookOpen size={20} /><strong>{mastered}<small> / {totalConcepts}</small></strong><span>понятий выучено</span></div>
        <div className="stat-item"><CheckCircle2 size={20} /><strong>{steps}<small> / {totalSteps}</small></strong><span>шагов выполнено</span></div>
        <div className="stat-item"><Target size={20} /><strong>{state.weeklyGoal} ч</strong><span>недельная цель</span></div>
      </section>

      <div className="dashboard-grid">
        <section className="roadmap-section">
          <div className="section-title-row"><div><span className="section-overline">Маршрут</span><h2>8 этапов. Один работающий путь.</h2></div><Layers3 size={28} /></div>
          <div className="roadmap-list">
            {stages.map((stage) => {
              const stageWeeks = weeks.filter((week) => week.stageId === stage.id)
              const done = stageWeeks.filter((week) => isWeekComplete(getWeekProgress(state, week.id))).length
              const first = stageWeeks[0]
              return (
                <button className="roadmap-row" key={stage.id} onClick={() => onOpenWeek(first.id)}>
                  <span className="roadmap-row__number" style={{ color: stage.color }}>{String(stage.number).padStart(2, '0')}</span>
                  <span className="roadmap-row__main"><strong>{stage.title}</strong><small>{stage.description}</small><span className="roadmap-row__bar"><i style={{ width: `${(done / stageWeeks.length) * 100}%`, backgroundColor: stage.color }} /></span></span>
                  <span className="roadmap-row__meta"><strong>{done}/{stageWeeks.length}</strong><small>{stage.range}</small></span>
                  <ArrowRight size={18} />
                </button>
              )
            })}
          </div>
        </section>

        <aside className="dashboard-aside">
          <FocusTimer onFinish={onTimerFinish} />
          <section className="activity-panel">
            <div className="section-label"><Flame size={16} /> Минуты фокуса · 7 дней</div>
            <div className="activity-chart">
              {recentDays.map((day) => <div key={day.key} className="activity-day"><div className="activity-day__bar"><span style={{ height: `${Math.max(day.value ? 8 : 2, (day.value / maxActivity) * 100)}%` }} title={`${day.value} минут`} /></div><small>{day.day}</small></div>)}
            </div>
            <p><Clock3 size={14} /> Время добавляется после завершения таймера.</p>
          </section>
        </aside>
      </div>

      <section className="method-section">
        <div className="section-title-row"><div><span className="section-overline">Метод</span><h2>Не просмотреть. Научиться.</h2></div></div>
        <div className="method-list">
          {studyPrinciples.map((principle, index) => <div className="method-item" key={principle.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{principle.title}</h3><p>{principle.text}</p></div></div>)}
        </div>
      </section>
    </div>
  )
}
