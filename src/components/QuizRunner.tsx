import { useEffect, useState } from 'react'
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react'
import type { QuizQuestion } from '@/lib/quiz'

export function QuizRunner({ questions, bestScore = 0, onComplete }: {
  questions: QuizQuestion[]
  bestScore?: number
  onComplete: (score: number) => void
}) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const signature = questions.map((question) => question.id).join('|')

  useEffect(() => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }, [signature])

  const choose = (option: number) => {
    if (selected !== null) return
    setSelected(option)
    if (option === questions[index].answer) setScore((value) => value + 1)
  }
  const next = () => {
    if (index === questions.length - 1) {
      setFinished(true)
      onComplete(score)
    } else {
      setIndex((value) => value + 1)
      setSelected(null)
    }
  }
  const restart = () => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="quiz-result">
        <div className={`quiz-result__score ${score === questions.length ? 'is-perfect' : ''}`}>
          <strong>{score}/{questions.length}</strong>
          <span>{score === questions.length ? 'Отлично: материал подтверждён тестом' : 'Повтори определения и попробуй ещё раз'}</span>
        </div>
        <p>Для завершения недели нужен результат {questions.length}/{questions.length}. Лучший результат: {Math.max(bestScore, score)}/{questions.length}.</p>
        <button className="button button--primary" onClick={restart}><RotateCcw size={17} /> Пройти ещё раз</button>
      </div>
    )
  }

  const question = questions[index]
  const correct = selected === question.answer
  return (
    <div className="quiz-shell">
      <div className="quiz-meta">
        <span>Вопрос {index + 1} из {questions.length}</span>
        <span>Счёт: {score}</span>
      </div>
      <div className="quiz-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <h3>{question.question}</h3>
      <div className="quiz-options">
        {question.options.map((option, optionIndex) => {
          const isCorrect = selected !== null && optionIndex === question.answer
          const isWrong = selected === optionIndex && optionIndex !== question.answer
          return (
            <button key={option} className={`quiz-option ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}`} onClick={() => choose(optionIndex)} disabled={selected !== null}>
              <span className="quiz-option__letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span>{option}</span>
              {isCorrect && <Check size={18} />}
              {isWrong && <X size={18} />}
            </button>
          )
        })}
      </div>
      {selected !== null && (
        <div className={`quiz-explanation ${correct ? 'is-correct' : 'is-wrong'}`} role="status">
          <strong>{correct ? 'Верно' : 'Разберём ошибку'}</strong>
          <p>{question.explanation}</p>
          <button className="button button--dark" onClick={next}>{index === questions.length - 1 ? 'Показать результат' : 'Следующий вопрос'} <ArrowRight size={17} /></button>
        </div>
      )}
    </div>
  )
}
