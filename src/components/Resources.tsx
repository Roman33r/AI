import { ArrowUpRight, Download, ExternalLink } from 'lucide-react'
import { weeks } from '@/data'
import { resources, studyPrinciples } from '@/data/resources'
import { downloadPlan } from '@/lib/progress'

export function Resources() {
  return (
    <div className="resources-page page-enter">
      <header className="page-heading"><div><span className="section-overline">Библиотека</span><h1>Один основной источник на этап</h1><p>Не проходи всё подряд. Используй материал как опору для практики, а документацию — как справочник при возникновении вопросов.</p></div><ExternalLink size={48} /></header>
      <section className="resource-download"><div><strong>Вся программа в Markdown</strong><p>53 недели, понятия, шаги, задания и критерии готовности — для офлайн-доступа или собственной системы заметок.</p></div><button className="button button--primary" onClick={() => downloadPlan(weeks)}><Download size={17} /> Скачать план</button></section>
      <div className="resource-grid">
        {resources.map((resource) => <a key={resource.title} href={resource.url} target="_blank" rel="noreferrer" className="resource-link"><span>{resource.stage}</span><h2>{resource.title}</h2><p>{resource.description}</p><ArrowUpRight size={21} /></a>)}
      </div>
      <section className="ai-help-section"><span className="section-overline">AI-помощник</span><h2>Используй для обучения, а не вместо него</h2><div className="ai-help-grid"><div><h3>Полезно</h3><ul><li>Просить подсказку, а не готовое решение.</li><li>Проводить code review после собственной реализации.</li><li>Генерировать граничные случаи и дополнительные вопросы.</li><li>Объяснять каждый изменённый участок кода.</li></ul></div><div><h3>Опасно</h3><ul><li>Копировать проект, который не можешь объяснить.</li><li>Добавлять зависимости и API без проверки документации.</li><li>Отправлять секреты и чувствительные данные.</li><li>Считать сгенерированные тесты доказательством качества.</li></ul></div></div></section>
      <section className="principles-section"><span className="section-overline">Короткий протокол</span><h2>Каждую неделю</h2>{studyPrinciples.map((item, index) => <div className="principle-line" key={item.title}><span>{index + 1}</span><strong>{item.title}</strong><p>{item.text}</p></div>)}</section>
    </div>
  )
}
