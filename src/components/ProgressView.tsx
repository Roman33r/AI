import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { stages, totalConcepts, totalSteps, weeks, type ProgressState } from '@/data'
import { downloadProgress, getWeekProgress, isWeekComplete } from '@/lib/progress'
import { ProgressRing } from './ProgressRing'

export function ProgressView({ state, onGoal, onImport, onReset }: {
  state: ProgressState
  onGoal: (hours: number) => void
  onImport: (state: ProgressState) => void
  onReset: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState('')
  const completed = weeks.filter((week) => isWeekComplete(getWeekProgress(state, week.id))).length
  const mastered = Object.values(state.weeks).reduce((sum, week) => sum + week.masteredConcepts.length, 0)
  const steps = Object.values(state.weeks).reduce((sum, week) => sum + week.checkedSteps.length, 0)
  const totalMinutes = Object.values(state.activity).reduce((sum, value) => sum + value, 0)
  const quizResults = weeks.map((week) => getWeekProgress(state, week.id).quizBest).filter((score) => score > 0)
  const quizAverage = quizResults.length ? Math.round(quizResults.reduce((sum, score) => sum + score, 0) / quizResults.length * 10) / 10 : 0

  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as ProgressState
      if (parsed.version !== 1 || typeof parsed.weeks !== 'object') throw new Error('invalid')
      onImport(parsed)
      setMessage('Прогресс успешно импортирован.')
    } catch {
      setMessage('Не удалось прочитать файл. Выберите резервную копию, созданную этим сайтом.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="progress-page page-enter">
      <header className="page-heading"><div><span className="section-overline">Личная статистика</span><h1>Прогресс, который можно проверить</h1><p>Здесь учитываются практические шаги, задания, тесты и повторение — а не время просмотра материалов.</p></div><ProgressRing value={(completed / weeks.length) * 100} /></header>
      <section className="progress-metrics">
        <div><strong>{completed}</strong><span>завершено недель</span></div>
        <div><strong>{mastered}<small> / {totalConcepts}</small></strong><span>выучено понятий</span></div>
        <div><strong>{steps}<small> / {totalSteps}</small></strong><span>практических шагов</span></div>
        <div><strong>{Math.floor(totalMinutes / 60)} ч {totalMinutes % 60} мин</strong><span>в фокус-сессиях</span></div>
        <div><strong>{quizAverage}</strong><span>средний лучший тест</span></div>
      </section>

      <section className="stage-progress-section">
        <div className="section-title-row"><div><span className="section-overline">По этапам</span><h2>Где ты находишься</h2></div></div>
        <div className="stage-progress-list">
          {stages.map((stage) => {
            const stageWeeks = weeks.filter((week) => week.stageId === stage.id)
            const done = stageWeeks.filter((week) => isWeekComplete(getWeekProgress(state, week.id))).length
            const partial = stageWeeks.reduce((sum, week) => sum + getWeekProgress(state, week.id).checkedSteps.length, 0)
            const allSteps = stageWeeks.reduce((sum, week) => sum + week.steps.length, 0)
            return <div className="stage-progress-row" key={stage.id}><div><span className="stage-dot" style={{ backgroundColor: stage.color }} /><strong>{stage.title}</strong></div><div className="stage-progress-row__bar"><span style={{ width: `${(done / stageWeeks.length) * 100}%`, backgroundColor: stage.color }} /></div><span>{done}/{stageWeeks.length} недель · {partial}/{allSteps} шагов</span></div>
          })}
        </div>
      </section>

      <div className="settings-grid">
        <section className="settings-panel">
          <span className="section-overline">Недельная цель</span><h2>Темп обучения</h2><p>Ориентир по времени, а не дедлайн. Неделя завершается после практического результата.</p>
          <div className="goal-options">{[10, 15, 20, 30].map((hours) => <button key={hours} className={state.weeklyGoal === hours ? 'is-active' : ''} onClick={() => onGoal(hours)}>{hours} ч<small>{hours === 10 ? '18–24 мес.' : hours === 15 ? 'около 12 мес.' : hours === 20 ? '10–12 мес.' : '7–9 мес.'}</small></button>)}</div>
        </section>
        <section className="settings-panel">
          <span className="section-overline">Резервная копия</span><h2>Твои данные</h2><p>Прогресс и заметки сохраняются только в этом браузере. Экспортируй JSON, чтобы перенести их на другое устройство.</p>
          <div className="settings-actions"><button className="button button--primary" onClick={() => downloadProgress(state)}><Download size={17} /> Экспорт</button><button className="button button--secondary" onClick={() => fileRef.current?.click()}><Upload size={17} /> Импорт</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={(event) => importFile(event.target.files?.[0])} /></div>
          {message && <p className="settings-message" role="status">{message}</p>}
        </section>
      </div>
      <section className="danger-zone"><div><strong>Начать программу заново</strong><p>Удалит отметки, результаты тестов, заметки и активность в этом браузере.</p></div>{confirmReset ? <div className="danger-zone__confirm"><button className="button button--secondary" onClick={() => setConfirmReset(false)}>Отмена</button><button className="button button--danger" onClick={() => { onReset(); setConfirmReset(false) }}>Да, удалить</button></div> : <button className="button button--secondary" onClick={() => setConfirmReset(true)}><RotateCcw size={16} /> Сбросить</button>}</section>
    </div>
  )
}
