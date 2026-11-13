import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpenCheck, Brain, RotateCcw, Shuffle } from 'lucide-react'
import { stages, weeks, type ProgressState } from '@/data'
import { makeMixedQuiz } from '@/lib/quiz'
import { QuizRunner } from './QuizRunner'

export function Review({ state, onResult }: {
  state: ProgressState
  onResult: (weekId: number, key: string, known: boolean) => void
}) {
  const [mode, setMode] = useState<'cards' | 'quiz'>('cards')
  const [stageId, setStageId] = useState('all')
  const [onlyMarked, setOnlyMarked] = useState(true)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [seed, setSeed] = useState(52)
  const [best, setBest] = useState(0)

  const sourceWeeks = stageId === 'all' ? weeks : weeks.filter((week) => week.stageId === stageId)
  const cards = useMemo(() => sourceWeeks.flatMap((week) => week.concepts
    .map((concept) => ({ ...concept, weekId: week.id, weekTitle: week.title, key: `${week.id}:${concept.term}` }))
    .filter((card) => !onlyMarked || state.reviewLater.includes(card.key))), [sourceWeeks, onlyMarked, state.reviewLater])
  const card = cards[index % Math.max(cards.length, 1)]
  const quiz = useMemo(() => makeMixedQuiz(sourceWeeks, seed, Math.min(10, sourceWeeks.reduce((sum, week) => sum + week.concepts.length, 0))), [sourceWeeks, seed])

  const answer = (known: boolean) => {
    if (!card) return
    onResult(card.weekId, card.key, known)
    setFlipped(false)
    setIndex((value) => cards.length ? (value + 1) % cards.length : 0)
  }
  const resetDeck = (nextStage: string) => {
    setStageId(nextStage)
    setIndex(0)
    setFlipped(false)
    setSeed((value) => value + 1)
  }

  return (
    <div className="review-page page-enter">
      <header className="page-heading">
        <div><span className="section-overline">Тренировка памяти</span><h1>Повторение без иллюзии знаний</h1><p>Сначала попытайся ответить, потом переворачивай карточку. Смешанный тест проверяет определения из разных недель.</p></div>
        <Brain size={52} />
      </header>
      <div className="review-toolbar">
        <div className="segmented-control">
          <button className={mode === 'cards' ? 'is-active' : ''} onClick={() => setMode('cards')}><BookOpenCheck size={17} /> Карточки</button>
          <button className={mode === 'quiz' ? 'is-active' : ''} onClick={() => setMode('quiz')}><Shuffle size={17} /> Смешанный тест</button>
        </div>
        <label className="select-label">Этап<select value={stageId} onChange={(event) => resetDeck(event.target.value)}><option value="all">Вся программа</option>{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.title}</option>)}</select></label>
      </div>

      {mode === 'cards' && (
        <section className="flashcard-section">
          <div className="deck-controls">
            <button className={onlyMarked ? 'toggle-filter is-active' : 'toggle-filter'} onClick={() => { setOnlyMarked((value) => !value); setIndex(0); setFlipped(false) }}><RotateCcw size={16} /> {onlyMarked ? 'Только отложенные' : 'Все понятия'}</button>
            <span>{cards.length} карточек в колоде</span>
          </div>
          {card ? (
            <>
              <button className={`flashcard ${flipped ? 'is-flipped' : ''}`} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? 'Показать термин' : 'Показать определение'}>
                <span className="flashcard__meta">Неделя {card.weekId} · {card.weekTitle}</span>
                <span className="flashcard__side">{flipped ? 'ОПРЕДЕЛЕНИЕ' : 'ТЕРМИН'}</span>
                <strong>{flipped ? card.definition : card.term}</strong>
                <span className="flashcard__hint">{flipped ? 'Нажми, чтобы вернуться к термину' : 'Нажми, когда будешь готов проверить ответ'}</span>
              </button>
              <div className="flashcard-actions">
                <button className="button button--secondary" onClick={() => answer(false)}><RotateCcw size={17} /> Повторить позже</button>
                <button className="button button--primary" disabled={!flipped} onClick={() => answer(true)}>Знаю ответ <ArrowRight size={17} /></button>
              </div>
              <div className="deck-position"><button className="icon-button" onClick={() => { setIndex((value) => (value - 1 + cards.length) % cards.length); setFlipped(false) }} aria-label="Предыдущая карточка"><ArrowLeft size={18} /></button><span>{(index % cards.length) + 1} / {cards.length}</span><button className="icon-button" onClick={() => { setIndex((value) => (value + 1) % cards.length); setFlipped(false) }} aria-label="Следующая карточка"><ArrowRight size={18} /></button></div>
            </>
          ) : (
            <div className="empty-state"><BookOpenCheck size={40} /><h2>Колода пуста</h2><p>Открой понятия любой недели и нажми «Повторить» у сложных терминов — или переключись на все понятия.</p><button className="button button--primary" onClick={() => setOnlyMarked(false)}>Показать все понятия</button></div>
          )}
        </section>
      )}

      {mode === 'quiz' && (
        <section className="mixed-quiz-section">
          <div className="section-heading"><span>10 случайных вопросов</span><button className="text-button" onClick={() => setSeed((value) => value + 1)}><Shuffle size={16} /> Новый набор</button></div>
          <QuizRunner key={seed} questions={quiz} bestScore={best} onComplete={(score) => setBest((value) => Math.max(value, score))} />
        </section>
      )}
    </div>
  )
}
