import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'

export function FocusTimer({ onFinish }: { onFinish: (minutes: number) => void }) {
  const [duration, setDuration] = useState(25)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          setRunning(false)
          onFinish(duration)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, duration, onFinish])

  const chooseDuration = (minutes: number) => {
    setDuration(minutes)
    setRemaining(minutes * 60)
    setRunning(false)
  }
  const reset = () => {
    setRemaining(duration * 60)
    setRunning(false)
  }
  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0')
  const seconds = (remaining % 60).toString().padStart(2, '0')

  return (
    <section className="focus-timer" aria-label="Таймер фокуса">
      <div className="section-label"><Timer size={16} /> Фокус-сессия</div>
      <div className="focus-timer__row">
        <div className="focus-timer__time" aria-live="polite">{minutes}:{seconds}</div>
        <div className="focus-timer__actions">
          <button className="icon-button icon-button--light" onClick={() => setRunning((value) => !value)} aria-label={running ? 'Поставить на паузу' : 'Запустить таймер'}>
            {running ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <button className="icon-button icon-button--light" onClick={reset} aria-label="Сбросить таймер"><RotateCcw size={18} /></button>
        </div>
      </div>
      <div className="focus-timer__presets">
        {[15, 25, 45].map((value) => (
          <button key={value} className={duration === value ? 'is-active' : ''} onClick={() => chooseDuration(value)}>{value} мин</button>
        ))}
      </div>
    </section>
  )
}
