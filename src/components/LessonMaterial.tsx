import { useState } from 'react'
import { ArrowRight, BookMarked, Check, CheckCircle2, ChevronRight, CircleAlert, Code2, Copy, FlaskConical, Sigma, ListChecks, Network, Route, Table2, Target, TriangleAlert } from 'lucide-react'
import type { Week } from '@/data'
import type { ChartBlock, CodeBlock, GuideSection, LessonGuide } from '@/lessons/types'

function CodeBlockView({ block }: { block: CodeBlock }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(block.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="guide-code">
      <div className="guide-code__header">
        <span><Code2 size={15} /> {block.title}</span>
        <div><small>{block.language}</small><button type="button" onClick={copy} aria-label={`Скопировать: ${block.title}`}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Скопировано' : 'Копировать'}</button></div>
      </div>
      <pre tabIndex={0}><code>{block.content}</code></pre>
    </div>
  )
}

function GuideChart({ chart }: { chart: ChartBlock }) {
  const width = 760
  const height = 290
  const left = 54
  const right = 24
  const top = 34
  const bottom = 64
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const maxValue = Math.max(...chart.values, 1)
  const x = (index: number) => left + (chart.values.length === 1 ? plotWidth / 2 : index * plotWidth / (chart.values.length - 1))
  const y = (value: number) => top + plotHeight - Math.max(0, value) / maxValue * plotHeight
  const points = chart.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
  const barWidth = Math.min(74, plotWidth / chart.values.length * 0.56)
  const description = `${chart.title}. ${chart.caption} Значения: ${chart.labels.map((label, index) => `${label} — ${chart.values[index]}`).join(', ')}.`

  return (
    <figure className="guide-chart">
      <figcaption><span>{chart.title}</span><small>{chart.yLabel}</small></figcaption>
      <div className="guide-chart__scroll">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={description} preserveAspectRatio="xMidYMid meet">
          <title>{chart.title}</title>
          <desc>{description}</desc>
          {[0, 0.5, 1].map((ratio) => {
            const lineY = top + plotHeight * (1 - ratio)
            return <g key={ratio}><line x1={left} x2={width - right} y1={lineY} y2={lineY} className="guide-chart__grid" /><text x={left - 10} y={lineY + 4} textAnchor="end" className="guide-chart__tick">{Number((maxValue * ratio).toFixed(2))}</text></g>
          })}
          {chart.kind === 'line' ? (
            <>
              <polyline points={points} className="guide-chart__line" />
              {chart.values.map((value, index) => <g key={`${chart.labels[index]}-${value}`}><circle cx={x(index)} cy={y(value)} r="5" className="guide-chart__point" /><text x={x(index)} y={y(value) - 13} textAnchor="middle" className="guide-chart__value">{value}</text></g>)}
            </>
          ) : chart.values.map((value, index) => (
            <g key={`${chart.labels[index]}-${value}`}>
              <rect x={x(index) - barWidth / 2} y={y(value)} width={barWidth} height={Math.max(1, top + plotHeight - y(value))} rx="5" className="guide-chart__bar" />
              <text x={x(index)} y={y(value) - 10} textAnchor="middle" className="guide-chart__value">{value}</text>
            </g>
          ))}
          {chart.labels.map((label, index) => <text key={label} x={x(index)} y={height - 31} textAnchor="middle" className="guide-chart__label">{label}</text>)}
        </svg>
      </div>
      <p>{chart.caption}</p>
    </figure>
  )
}

function SectionView({ section, index, anchor }: { section: GuideSection; index: number; anchor: string }) {
  return (
    <section className="guide-chapter" id={anchor}>
      <div className="guide-chapter__heading"><span>{String(index + 1).padStart(2, '0')}</span><h2>{section.title}</h2></div>
      {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {section.bullets && <ul className="guide-bullets">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
      {section.formula && <div className="guide-formula"><div><Sigma size={19} /><strong>Формула и смысл</strong></div><code>{section.formula.expression}</code><p>{section.formula.explanation}</p></div>}
      {section.diagram && <figure className="guide-diagram"><div className="guide-diagram__title"><Network size={17} /> Схема процесса</div><div className="guide-diagram__nodes">{section.diagram.nodes.map((node, nodeIndex) => <div className="guide-diagram__item" key={`${node}-${nodeIndex}`}><span>{node}</span>{nodeIndex < section.diagram!.nodes.length - 1 && <ChevronRight size={18} aria-hidden="true" />}</div>)}</div><figcaption>{section.diagram.caption}</figcaption></figure>}
      {section.table && <div className="guide-table-wrap"><div className="guide-table__label"><Table2 size={16} /> Сравнение и ориентиры</div><div className="guide-table__scroll" tabIndex={0}><table>{section.table.caption && <caption>{section.table.caption}</caption>}<thead><tr>{section.table.headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{section.table.rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div></div>}
      {section.code && <CodeBlockView block={section.code} />}
      {section.chart && <GuideChart chart={section.chart} />}
      {section.note && <aside className="guide-note"><CircleAlert size={19} /><p>{section.note}</p></aside>}
    </section>
  )
}

function scrollToSection(id: string) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

export function LessonMaterial({ week, guide, onOpenPlan, onOpenConcepts, onOpenQuiz }: {
  week: Week
  guide: LessonGuide
  onOpenPlan: () => void
  onOpenConcepts: () => void
  onOpenQuiz: () => void
}) {
  return (
    <div className="lesson-section lesson-guide">
      <section className="project-milestone" aria-labelledby={`project-week-${week.id}`}>
        <div className="project-milestone__label"><Network size={18} /> Сквозной проект · Neuro/52 <span>Шаг {week.id + 1} / 53</span></div>
        <h2 id={`project-week-${week.id}`}>{week.project.artifact}</h2>
        <p>{week.goal}</p>
        <div className="project-milestone__files" aria-label="Файлы проектного шага">
          {week.project.files.map((file) => <code key={file}>{file}</code>)}
        </div>
      </section>
      <header className="guide-intro">
        <div className="guide-intro__label"><BookMarked size={18} /> Полный учебный материал</div>
        <h2>Сначала понять модель,<br />затем воспроизвести практику</h2>
        <div className="guide-essence">{guide.essence.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </header>

      <section className="mental-model">
        <span>Мысленная модель недели</span>
        <p>{guide.mentalModel}</p>
      </section>

      <nav className="guide-toc" aria-label="Оглавление учебного материала">
        <strong>На этой странице</strong>
        <div>
          {guide.sections.map((section, index) => <button type="button" key={section.title} onClick={() => scrollToSection(`guide-${week.id}-${index}`)}><span>{index + 1}</span>{section.title}</button>)}
          <button type="button" onClick={() => scrollToSection(`guide-${week.id}-example`)}><FlaskConical size={14} />Разобранный пример</button>
          <button type="button" onClick={() => scrollToSection(`guide-${week.id}-glossary`)}><BookMarked size={14} />Словарь</button>
          <button type="button" onClick={() => scrollToSection(`guide-${week.id}-practice`)}><Route size={14} />Практика</button>
          <button type="button" onClick={() => scrollToSection(`guide-${week.id}-check`)}><Target size={14} />Итоговая проверка</button>
        </div>
      </nav>

      <div className="guide-reading-note"><span>Как работать</span><p>Читайте последовательно, запускайте код и самостоятельно воспроизводите вычисления. Схема отвечает «как связано», формула — «как посчитать», пример — «как применить», контрольные вопросы — «что я действительно понял».</p></div>

      {guide.sections.map((section, index) => <SectionView key={section.title} section={section} index={index} anchor={`guide-${week.id}-${index}`} />)}

      <section className="guide-example" id={`guide-${week.id}-example`}>
        <div className="guide-example__label"><FlaskConical size={19} /> Сквозной разобранный пример</div>
        <h2>{guide.example.title}</h2>
        {guide.example.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {guide.example.code && <CodeBlockView block={guide.example.code} />}
        <div className="guide-example__result"><CheckCircle2 size={21} /><div><strong>Что должно получиться</strong><p>{guide.example.result}</p></div></div>
      </section>

      <section className="guide-glossary" id={`guide-${week.id}-glossary`}>
        <div className="guide-chapter__heading"><span><BookMarked size={20} /></span><h2>Понятия недели в контексте</h2></div>
        <p className="guide-section-lead">Это краткий словарь для повторения после подробных разделов. Попробуйте сначала раскрыть термин самостоятельно, а затем сверить формулировку.</p>
        <dl>{week.concepts.map((concept) => <div key={concept.term}><dt>{concept.term}</dt><dd>{concept.definition}</dd></div>)}</dl>
        <button className="button button--secondary" type="button" onClick={onOpenConcepts}>Открыть карточки понятий <ArrowRight size={16} /></button>
      </section>

      <section className="guide-practice" id={`guide-${week.id}-practice`}>
        <div className="guide-chapter__heading"><span><ListChecks size={20} /></span><h2>Практический маршрут</h2></div>
        <ol>{week.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol>
        <div className="guide-task"><strong>Практическое задание</strong><p>{week.task}</p><small>Результат: {week.outcome}</small></div>
        <button className="button button--secondary" type="button" onClick={onOpenPlan}>Выполнять по интерактивному плану <ArrowRight size={16} /></button>
      </section>

      <section className="guide-mistakes">
        <div className="guide-chapter__heading"><span><TriangleAlert size={20} /></span><h2>Типичные ошибки</h2></div>
        <div>{guide.mistakes.map((mistake, index) => <article key={mistake}><span>{String(index + 1).padStart(2, '0')}</span><p>{mistake}</p></article>)}</div>
      </section>

      <section className="guide-checkpoints" id={`guide-${week.id}-check`}>
        <div className="guide-checkpoints__label"><Target size={20} /> Контроль перед переходом дальше</div>
        <h2>Можете ли вы это сделать без подсказки?</h2>
        <p>Отвечайте вслух и подкрепляйте ответ кодом, вычислением или схемой. Если ответ остаётся только знакомой формулировкой, вернитесь к соответствующему разделу.</p>
        <ul>{guide.checkpoints.map((checkpoint) => <li key={checkpoint}><span /><p>{checkpoint}</p></li>)}</ul>
        <button className="button button--primary" type="button" onClick={onOpenQuiz}>Перейти к самопроверке <ArrowRight size={17} /></button>
      </section>
    </div>
  )
}
