import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, CheckCircle2, ChevronRight, Code2, Github, GraduationCap, Home, Library, ListFilter, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { getStage, stages, weeks, type ProgressState, type WeekProgress } from '@/data'
import { getWeekProgress, initialProgress, isWeekComplete, loadProgress, registerActivity, saveProgress, weekCompletionRatio } from '@/lib/progress'
import { Dashboard } from '@/components/Dashboard'
import { CurriculumNav } from '@/components/CurriculumNav'
import { Lesson } from '@/components/Lesson'
import { Review } from '@/components/Review'
import { ProgressView } from '@/components/ProgressView'
import { Resources } from '@/components/Resources'
import './App.css'

type View = 'dashboard' | 'curriculum' | 'review' | 'progress' | 'resources'
type StatusFilter = 'all' | 'active' | 'done'

function getInitialLocation(): { view: View; week: number } {
  const match = window.location.hash.match(/^#week-(\d+)$/)
  if (match) return { view: 'curriculum', week: Math.max(0, Math.min(52, Number(match[1]))) }
  const views: View[] = ['dashboard', 'curriculum', 'review', 'progress', 'resources']
  const hash = window.location.hash.slice(1) as View
  return { view: views.includes(hash) ? hash : 'dashboard', week: 0 }
}

export default function App() {
  const initial = getInitialLocation()
  const [state, setState] = useState<ProgressState>(loadProgress)
  const [view, setView] = useState<View>(initial.view)
  const [selectedWeek, setSelectedWeek] = useState(initial.week)
  const [selectedStage, setSelectedStage] = useState('all')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [weeksOpen, setWeeksOpen] = useState(false)

  useEffect(() => {
    saveProgress(state)
    document.documentElement.dataset.theme = state.theme
    document.documentElement.style.colorScheme = state.theme
  }, [state])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setWeeksOpen(false)
    }
    const onHashChange = () => {
      const location = getInitialLocation()
      setView(location.view)
      if (location.view === 'curriculum') setSelectedWeek(location.week)
      setWeeksOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  const navigate = (next: View) => {
    setView(next)
    window.location.hash = next === 'dashboard' ? '' : next
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openWeek = (id: number) => {
    setSelectedWeek(id)
    setView('curriculum')
    setWeeksOpen(false)
    window.location.hash = `week-${id}`
    window.scrollTo({ top: 0 })
  }
  const currentWeek = weeks.find((week) => !isWeekComplete(getWeekProgress(state, week.id))) ?? weeks[52]
  const week = weeks[selectedWeek]
  const progress = getWeekProgress(state, selectedWeek)

  const updateWeek = (id: number, patch: Partial<WeekProgress>) => {
    setState((previous) => {
      const before = getWeekProgress(previous, id)
      const after = { ...before, ...patch }
      if (!before.completedAt && after.completedAt) toast.success(`Неделя ${id} завершена. Отличный результат!`)
      return { ...previous, weeks: { ...previous.weeks, [String(id)]: after } }
    })
  }
  const toggleReview = (key: string) => {
    setState((previous) => ({ ...previous, reviewLater: previous.reviewLater.includes(key) ? previous.reviewLater.filter((item) => item !== key) : [...previous.reviewLater, key] }))
  }
  const reviewResult = (weekId: number, key: string, known: boolean) => {
    setState((previous) => {
      const before = getWeekProgress(previous, weekId)
      const mastered = known ? Array.from(new Set([...before.masteredConcepts, key])) : before.masteredConcepts.filter((item) => item !== key)
      const reviewLater = known ? previous.reviewLater.filter((item) => item !== key) : Array.from(new Set([...previous.reviewLater, key]))
      return { ...previous, reviewLater, weeks: { ...previous.weeks, [String(weekId)]: { ...before, masteredConcepts: mastered } } }
    })
  }
  const onTimerFinish = useCallback((minutes: number) => {
    setState((previous) => registerActivity(previous, minutes))
    toast.success(`Фокус-сессия завершена: ${minutes} минут.`)
  }, [])

  const filteredWeeks = useMemo(() => weeks.filter((item) => {
    if (selectedStage !== 'all' && item.stageId !== selectedStage) return false
    const itemProgress = getWeekProgress(state, item.id)
    if (status === 'done' && !isWeekComplete(itemProgress)) return false
    if (status === 'active' && isWeekComplete(itemProgress)) return false
    if (!query.trim()) return true
    const haystack = `${item.id} ${item.title} ${item.goal} ${item.concepts.map((concept) => `${concept.term} ${concept.definition}`).join(' ')}`.toLocaleLowerCase('ru')
    return haystack.includes(query.trim().toLocaleLowerCase('ru'))
  }), [selectedStage, status, query, state])

  const navItems: { id: View; label: string; icon: typeof Home }[] = [
    { id: 'dashboard', label: 'Обзор', icon: Home },
    { id: 'curriculum', label: 'Программа', icon: BookOpen },
    { id: 'review', label: 'Повторение', icon: GraduationCap },
    { id: 'progress', label: 'Прогресс', icon: CheckCircle2 },
    { id: 'resources', label: 'Библиотека', icon: Library },
  ]

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">К содержанию</a>
      <header className="topbar">
        <button className="brand" onClick={() => navigate('dashboard')} aria-label="AI 52 — на главную">
          <span className="brand__mark"><Code2 size={21} /></span><span><strong>AI / 52</strong><small>интерактивная программа</small></span>
        </button>
        <nav className="topbar__nav" aria-label="Основная навигация">
          {navItems.map((item) => <button key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => navigate(item.id)}>{item.label}{view === item.id && <span />}</button>)}
        </nav>
        <div className="topbar__actions">
          <a className="icon-button" href="https://github.com/Roman33r/AI" target="_blank" rel="noreferrer" aria-label="Открыть репозиторий GitHub"><Github size={19} /></a>
          <button className="icon-button" onClick={() => setState((previous) => ({ ...previous, theme: previous.theme === 'light' ? 'dark' : 'light' }))} aria-label={state.theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}>{state.theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button>
          <button className="button button--small button--primary topbar__continue" onClick={() => openWeek(currentWeek.id)}>Неделя {currentWeek.id} <ChevronRight size={16} /></button>
        </div>
      </header>

      <main id="main-content">
        {view === 'dashboard' && <Dashboard state={state} onContinue={() => openWeek(currentWeek.id)} onOpenWeek={openWeek} onTimerFinish={onTimerFinish} />}
        {view === 'review' && <div className="page-container"><Review state={state} onResult={reviewResult} /></div>}
        {view === 'progress' && <div className="page-container"><ProgressView state={state} onGoal={(weeklyGoal) => setState((previous) => ({ ...previous, weeklyGoal }))} onImport={(imported) => { setState({ ...initialProgress(), ...imported }); toast.success('Резервная копия загружена.') }} onReset={() => { setState({ ...initialProgress(), theme: state.theme }); setSelectedWeek(0); toast.success('Прогресс сброшен.') }} /></div>}
        {view === 'resources' && <div className="page-container"><Resources /></div>}
        {view === 'curriculum' && (
          <div className="curriculum-layout">
            <CurriculumNav selectedStage={selectedStage} onStage={(id) => { setSelectedStage(id); setQuery(''); setStatus('all') }} onDashboard={() => navigate('dashboard')} />
            <button className={`week-index-backdrop ${weeksOpen ? 'is-open' : ''}`} onClick={() => setWeeksOpen(false)} aria-label="Закрыть список недель" />
            <aside className={`week-index ${weeksOpen ? 'is-open' : ''}`}>
              <div className="week-index__top"><div><span>Учебный план</span><strong>{filteredWeeks.length} недель</strong></div><button className="icon-button week-index__close" onClick={() => setWeeksOpen(false)} aria-label="Закрыть"><X size={19} /></button></div>
              <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Тема или понятие…" aria-label="Поиск по программе" />{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={15} /></button>}</label>
              <div className="status-filter"><ListFilter size={15} /><button className={status === 'all' ? 'is-active' : ''} onClick={() => setStatus('all')}>Все</button><button className={status === 'active' ? 'is-active' : ''} onClick={() => setStatus('active')}>В работе</button><button className={status === 'done' ? 'is-active' : ''} onClick={() => setStatus('done')}>Готово</button></div>
              <div className="week-list">
                {filteredWeeks.length === 0 && <div className="week-list-empty"><Search size={28} /><p>Ничего не найдено</p><button onClick={() => { setQuery(''); setStatus('all'); setSelectedStage('all') }}>Сбросить фильтры</button></div>}
                {stages.map((stage) => {
                  const items = filteredWeeks.filter((item) => item.stageId === stage.id)
                  if (!items.length) return null
                  return <section key={stage.id} className="week-group"><h2><span style={{ backgroundColor: stage.color }} />{stage.shortTitle}<small>{stage.range}</small></h2>{items.map((item) => {
                    const itemProgress = getWeekProgress(state, item.id)
                    const complete = isWeekComplete(itemProgress)
                    const ratio = weekCompletionRatio(item, itemProgress)
                    return <button key={item.id} className={`week-list-item ${selectedWeek === item.id ? 'is-current' : ''} ${complete ? 'is-complete' : ''}`} onClick={() => openWeek(item.id)}><span className="week-list-item__number">{complete ? <Check size={15} /> : String(item.id).padStart(2, '0')}</span><span><strong>{item.title}</strong><i><b style={{ width: `${ratio * 100}%`, backgroundColor: getStage(item.stageId).color }} /></i></span></button>
                  })}</section>
                })}
              </div>
            </aside>
            <div className="lesson-container">
              <button className="mobile-weeks-button" onClick={() => setWeeksOpen(true)}><Menu size={17} /> Программа и поиск <span>Неделя {selectedWeek}</span></button>
              <Lesson week={week} progress={progress} reviewLater={state.reviewLater} onChange={(patch) => updateWeek(selectedWeek, patch)} onToggleReview={toggleReview} onNavigate={openWeek} />
            </div>
          </div>
        )}
      </main>

      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => navigate(item.id)}><Icon size={20} /><span>{item.label}</span></button> })}
      </nav>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
