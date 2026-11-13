import { BookMarked, Download, GraduationCap, Info } from 'lucide-react'
import { stages, weeks } from '@/data'
import { downloadPlan } from '@/lib/progress'

export function CurriculumNav({ selectedStage, onStage, onDashboard }: {
  selectedStage: string
  onStage: (id: string) => void
  onDashboard: () => void
}) {
  return (
    <aside className="curriculum-nav">
      <button className="brand brand--sidebar" onClick={onDashboard} aria-label="На главную">
        <span className="brand__mark"><GraduationCap size={22} /></span>
        <span><strong>AI / 52</strong><small>engineering school</small></span>
      </button>
      <div className="curriculum-nav__label">Этапы программы</div>
      <nav aria-label="Фильтр этапов">
        <button className={selectedStage === 'all' ? 'is-active' : ''} onClick={() => onStage('all')}>
          <span className="stage-dot stage-dot--all"><BookMarked size={14} /></span>
          <span>Вся программа</span><small>{weeks.length}</small>
        </button>
        {stages.map((stage) => {
          const count = weeks.filter((week) => week.stageId === stage.id).length
          return (
            <button key={stage.id} className={selectedStage === stage.id ? 'is-active' : ''} onClick={() => onStage(stage.id)}>
              <span className="stage-dot" style={{ backgroundColor: stage.color }} />
              <span>{stage.shortTitle}</span><small>{count}</small>
            </button>
          )
        })}
      </nav>
      <div className="curriculum-nav__bottom">
        <button className="sidebar-download" onClick={() => downloadPlan(weeks)}><Download size={16} /> Скачать план .md</button>
        <p><Info size={14} /> Прогресс хранится в этом браузере.</p>
      </div>
    </aside>
  )
}
