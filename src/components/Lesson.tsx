import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, BookOpenText, Check, CheckCircle2, Circle, ClipboardCheck, FileText, Lightbulb, ListChecks, RotateCcw, Sparkles } from 'lucide-react'
import { getStage, type Week, type WeekProgress } from '@/data'
import { getLessonGuide } from '@/lessons'
import { canCompleteWeek } from '@/lib/progress'
import { makeWeekQuiz } from '@/lib/quiz'
import { LessonMaterial } from './LessonMaterial'
import { QuizRunner } from './QuizRunner'

type Tab = 'material' | 'plan' | 'concepts' | 'quiz' | 'notes'

export function Lesson({ week, progress, reviewLater, onChange, onToggleReview, onNavigate }: {
  week: Week
  progress: WeekProgress
  reviewLater: string[]
  onChange: (patch: Partial<WeekProgress>) => void
  onToggleReview: (key: string) => void
  onNavigate: (id: number) => void
}) {
  const [tab, setTab] = useState<Tab>('material')
  const stage = getStage(week.stageId)
  const quiz = makeWeekQuiz(week)
  const ready = canCompleteWeek(week, progress)
  const complete = Boolean(progress.completedAt)

  useEffect(() => setTab('material'), [week.id])

  const toggleStep = (index: number) => {
    const checked = progress.checkedSteps.includes(index)
    onChange({ checkedSteps: checked ? progress.checkedSteps.filter((item) => item !== index) : [...progress.checkedSteps, index], completedAt: undefined })
  }
  const toggleConcept = (key: string) => {
    const mastered = progress.masteredConcepts.includes(key)
    onChange({ masteredConcepts: mastered ? progress.masteredConcepts.filter((item) => item !== key) : [...progress.masteredConcepts, key] })
  }
  const finishWeek = () => {
    if (ready) onChange({ completedAt: new Date().toISOString() })
  }

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'material', label: 'Материал', icon: BookOpenText },
    { id: 'plan', label: 'План', icon: ListChecks },
    { id: 'concepts', label: `Понятия · ${week.concepts.length}`, icon: BookOpen },
    { id: 'quiz', label: 'Самопроверка', icon: ClipboardCheck },
    { id: 'notes', label: 'Заметки', icon: FileText },
  ]

  return (
    <article className="lesson" style={{ '--stage-color': stage.color, '--stage-soft': stage.softColor } as React.CSSProperties}>
      <header className="lesson__header">
        <div className="lesson__eyebrow"><span style={{ backgroundColor: stage.color }} /> {stage.title}</div>
        <div className="lesson__title-row">
          <div>
            <div className="week-number">Неделя {week.id} <span>·</span> {week.hours}</div>
            <h1>{week.title}</h1>
          </div>
          {complete && <div className="completed-stamp"><CheckCircle2 size={18} /> Завершено</div>}
        </div>
        <p className="lesson__goal">{week.goal}</p>
        <div className="lesson__progress-line"><span style={{ width: `${((progress.checkedSteps.length + Number(progress.taskDone) + Number(progress.outcomeDone)) / (week.steps.length + 2)) * 100}%` }} /></div>
      </header>

      <div className="lesson-tabs" role="tablist" aria-label="Разделы недели">
        {tabs.map((item) => {
          const Icon = item.icon
          return <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}><Icon size={16} /> {item.label}</button>
        })}
      </div>

      {tab === 'material' && <LessonMaterial week={week} guide={getLessonGuide(week.id)} onOpenPlan={() => setTab('plan')} onOpenConcepts={() => setTab('concepts')} onOpenQuiz={() => setTab('quiz')} />}

      {tab === 'plan' && (
        <div className="lesson-section">
          <div className="section-heading">
            <span>Пошаговый маршрут</span>
            <small>{progress.checkedSteps.length}/{week.steps.length} шагов</small>
          </div>
          <div className="step-list">
            {week.steps.map((step, index) => {
              const checked = progress.checkedSteps.includes(index)
              return (
                <label className={`study-step ${checked ? 'is-checked' : ''}`} key={step}>
                  <input type="checkbox" checked={checked} onChange={() => toggleStep(index)} />
                  <span className="study-step__number">{checked ? <Check size={17} /> : String(index + 1).padStart(2, '0')}</span>
                  <span>{step}</span>
                </label>
              )
            })}
          </div>

          <section className="practice-block">
            <div className="practice-block__label"><Lightbulb size={19} /> Практическое задание</div>
            <p>{week.task}</p>
            <button className={`check-action ${progress.taskDone ? 'is-checked' : ''}`} onClick={() => onChange({ taskDone: !progress.taskDone, completedAt: undefined })}>
              {progress.taskDone ? <CheckCircle2 size={19} /> : <Circle size={19} />}
              {progress.taskDone ? 'Задание выполнено' : 'Отметить задание выполненным'}
            </button>
          </section>

          <section className="outcome-block">
            <div className="outcome-block__label"><Sparkles size={18} /> Критерий готовности</div>
            <p>{week.outcome}</p>
            <button className={`check-action ${progress.outcomeDone ? 'is-checked' : ''}`} onClick={() => onChange({ outcomeDone: !progress.outcomeDone, completedAt: undefined })}>
              {progress.outcomeDone ? <CheckCircle2 size={19} /> : <Circle size={19} />}
              {progress.outcomeDone ? 'Могу подтвердить результат' : 'Я могу это сделать без подсказок'}
            </button>
          </section>

          <div className="week-completion">
            <div>
              <strong>{complete ? 'Неделя пройдена' : ready ? 'Все условия выполнены' : 'Чек-лист перед завершением'}</strong>
              <p>{complete ? 'Можно возвращаться к материалу и улучшать результат.' : `Шаги ${progress.checkedSteps.length}/${week.steps.length} · задание ${progress.taskDone ? 'готово' : 'не отмечено'} · тест ${progress.quizBest}/${quiz.length}`}</p>
            </div>
            {complete ? (
              <button className="button button--secondary" onClick={() => onChange({ completedAt: undefined })}><RotateCcw size={17} /> Вернуть в работу</button>
            ) : (
              <button className="button button--primary" disabled={!ready} onClick={finishWeek}><Check size={18} /> Завершить неделю</button>
            )}
          </div>
        </div>
      )}

      {tab === 'concepts' && (
        <div className="lesson-section">
          <div className="section-heading">
            <span>Понятия простыми словами</span>
            <small>{progress.masteredConcepts.length}/{week.concepts.length} выучено</small>
          </div>
          <p className="section-intro">Сначала объясни термин своими словами, затем сверься с определением. Отправляй сложные понятия в общую колоду повторения.</p>
          <div className="concept-list">
            {week.concepts.map((concept, index) => {
              const key = `${week.id}:${concept.term}`
              const mastered = progress.masteredConcepts.includes(key)
              const review = reviewLater.includes(key)
              return (
                <div className={`concept-row ${mastered ? 'is-mastered' : ''}`} key={key}>
                  <div className="concept-row__index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="concept-row__body"><h3>{concept.term}</h3><p>{concept.definition}</p></div>
                  <div className="concept-row__actions">
                    <button className={mastered ? 'is-active' : ''} onClick={() => toggleConcept(key)} title={mastered ? 'Отметить как невыученное' : 'Отметить выученным'}><Check size={16} /> <span>{mastered ? 'Знаю' : 'Выучено'}</span></button>
                    <button className={review ? 'is-active is-review' : ''} onClick={() => onToggleReview(key)} title="Добавить или убрать из повторения"><RotateCcw size={15} /> <span>{review ? 'В колоде' : 'Повторить'}</span></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'quiz' && (
        <div className="lesson-section">
          <div className="section-heading"><span>Проверь понимание</span><small>Лучший результат {progress.quizBest}/{quiz.length}</small></div>
          <p className="section-intro">Отвечай без конспекта. После выбора появится объяснение. Для завершения недели нужно правильно ответить на все вопросы.</p>
          <QuizRunner questions={quiz} bestScore={progress.quizBest} onComplete={(score) => onChange({ quizBest: Math.max(progress.quizBest, score) })} />
        </div>
      )}

      {tab === 'notes' && (
        <div className="lesson-section">
          <div className="section-heading"><span>Заметки недели</span><small>Сохраняются автоматически</small></div>
          <textarea className="notes-area" value={progress.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder={'Что осталось непонятным?\nКакие ошибки повторялись?\nЧто нужно повторить через неделю?'} />
          <p className="privacy-note">Заметки хранятся только в этом браузере. Экспортируйте прогресс для резервной копии.</p>
        </div>
      )}

      <footer className="lesson__footer">
        <button className="text-button" disabled={week.id === 0} onClick={() => onNavigate(week.id - 1)}><ArrowLeft size={17} /> Предыдущая неделя</button>
        <button className="text-button" disabled={week.id === 52} onClick={() => onNavigate(week.id + 1)}>Следующая неделя <ArrowRight size={17} /></button>
      </footer>
    </article>
  )
}
