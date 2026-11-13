type ProgressRingProps = {
  value: number
  size?: 'small' | 'large'
  label?: string
}

export function ProgressRing({ value, size = 'large', label = 'пройдено' }: ProgressRingProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={`progress-ring progress-ring--${size}`} style={{ '--progress': `${normalized * 3.6}deg` } as React.CSSProperties}>
      <div className="progress-ring__inner">
        <strong>{normalized}%</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
