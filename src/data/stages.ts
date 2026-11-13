import type { Stage } from './types'

export const stages: Stage[] = [
  {
    id: 'setup', number: 0, title: 'Подготовка окружения', shortTitle: 'Старт',
    description: 'Компьютер, терминал, Python и Git. Настраиваем рабочее место и первый репозиторий.',
    range: 'Неделя 0', color: '#E48F15', softColor: '#FFF4D6',
  },
  {
    id: 'python', number: 1, title: 'Python и инженерная база', shortTitle: 'Python',
    description: 'Программирование, структуры данных, алгоритмы, SQL, API и первый завершённый сервис.',
    range: 'Недели 1–8', color: '#47A0A0', softColor: '#DDF3EF',
  },
  {
    id: 'ml', number: 2, title: 'Математика и классический ML', shortTitle: 'ML',
    description: 'От постановки задачи и baseline до валидации, метрик и end-to-end ML-сервиса.',
    range: 'Недели 9–16', color: '#4F86BB', softColor: '#E2EEFA',
  },
  {
    id: 'dl', number: 3, title: 'Deep Learning', shortTitle: 'Deep Learning',
    description: 'Тензоры, backpropagation, PyTorch, нейросети, embeddings и Transformer.',
    range: 'Недели 17–24', color: '#7E549F', softColor: '#EEE5F6',
  },
  {
    id: 'llm', number: 4, title: 'LLM-инжиниринг', shortTitle: 'LLM',
    description: 'LLM API, evaluation, RAG, tools, агенты, fine-tuning и безопасность.',
    range: 'Недели 25–34', color: '#EA5150', softColor: '#FCE7E4',
  },
  {
    id: 'production', number: 5, title: 'Production и MLOps', shortTitle: 'MLOps',
    description: 'FastAPI, Docker, облако, CI/CD, наблюдаемость и производительность.',
    range: 'Недели 35–42', color: '#157A6E', softColor: '#DDF0E9',
  },
  {
    id: 'capstone', number: 6, title: 'Дипломный проект', shortTitle: 'Проект',
    description: 'Продуктовые требования, архитектура, качество, production hardening и публичная защита.',
    range: 'Недели 43–48', color: '#D86A32', softColor: '#FBEADF',
  },
  {
    id: 'career', number: 7, title: 'Портфолио и трудоустройство', shortTitle: 'Карьера',
    description: 'Резюме, GitHub, технические интервью, System Design и систематические отклики.',
    range: 'Недели 49–52', color: '#344C7A', softColor: '#E4E9F3',
  },
]

export const getStage = (id: string) => stages.find((stage) => stage.id === id) ?? stages[0]
