export type FormulaBlock = {
  expression: string
  explanation: string
}

export type DiagramBlock = {
  nodes: string[]
  caption: string
}

export type TableBlock = {
  headers: string[]
  rows: string[][]
  caption?: string
}

export type CodeBlock = {
  title: string
  language: string
  content: string
}

export type ChartBlock = {
  title: string
  kind: 'line' | 'bars'
  labels: string[]
  values: number[]
  yLabel: string
  caption: string
}

export type GuideSection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
  formula?: FormulaBlock
  diagram?: DiagramBlock
  table?: TableBlock
  code?: CodeBlock
  chart?: ChartBlock
  note?: string
}

export type WorkedExample = {
  title: string
  paragraphs: string[]
  code?: CodeBlock
  result: string
}

export type LessonGuide = {
  id: number
  essence: string[]
  mentalModel: string
  sections: GuideSection[]
  example: WorkedExample
  mistakes: string[]
  checkpoints: string[]
}
