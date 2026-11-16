import type { Stage } from './types'

export const stages: Stage[] = [
  {
    id: 'setup', number: 0, title: 'Репозиторий Neuro/52', shortTitle: 'Старт',
    description: 'Настраиваем рабочее место и создаём репозиторий, который постепенно превратится в полноценную нейросеть.',
    projectResult: 'Каркас проекта, первый скрипт и цель финального продукта.',
    range: 'Неделя 0', color: '#E48F15', softColor: '#FFF4D6',
  },
  {
    id: 'python', number: 1, title: 'Python-движок нейросети', shortTitle: 'Python',
    description: 'Пишем нейрон, матричные операции, модули, загрузку MNIST и первый сквозной inference без готового NN-фреймворка.',
    projectResult: 'NumPy-движок и проход изображения через собственный слой.',
    range: 'Недели 1–8', color: '#47A0A0', softColor: '#DDF3EF',
  },
  {
    id: 'ml', number: 2, title: 'Обучение сети с нуля', shortTitle: 'ML',
    description: 'Добавляем baseline, градиентный спуск, softmax, cross-entropy, preprocessing, метрики и воспроизводимые эксперименты.',
    projectResult: 'Neuro/52 v0.1 — первая обученная модель распознавания цифр.',
    range: 'Недели 9–16', color: '#4F86BB', softColor: '#E2EEFA',
  },
  {
    id: 'dl', number: 3, title: 'Своя библиотека Deep Learning', shortTitle: 'Deep Learning',
    description: 'Реализуем backpropagation, MLP, training loop, оптимизаторы, CNN, embeddings и attention на собственных операциях.',
    projectResult: 'Neuro/52 v1.0 — библиотека нейросетей и обученный checkpoint.',
    range: 'Недели 17–24', color: '#7E549F', softColor: '#EEE5F6',
  },
  {
    id: 'llm', number: 4, title: 'Ассистент и развитие модели', shortTitle: 'LLM',
    description: 'Подключаем ассистента для объяснений и диагностики, добавляем retrieval, tools, evaluation, distillation и безопасность.',
    projectResult: 'Ассистент работает с вашей сетью, но не заменяет её вычисления.',
    range: 'Недели 25–34', color: '#EA5150', softColor: '#FCE7E4',
  },
  {
    id: 'production', number: 5, title: 'Нейросеть как сервис', shortTitle: 'MLOps',
    description: 'Упаковываем собственный inference в FastAPI, Docker, очереди, CI/CD, облако, мониторинг и нагрузочные тесты.',
    projectResult: 'Публичный масштабируемый API с версионированными весами.',
    range: 'Недели 35–42', color: '#157A6E', softColor: '#DDF0E9',
  },
  {
    id: 'capstone', number: 6, title: 'Финальный продукт Neuro/52', shortTitle: 'Проект',
    description: 'Улучшаем checkpoint по ошибкам, создаём полотно для рисования цифр, проводим hardening и выпускаем релиз.',
    projectResult: 'Neuro/52 v2.0 — нейросеть, API, веб-приложение и case study.',
    range: 'Недели 43–48', color: '#D86A32', softColor: '#FBEADF',
  },
  {
    id: 'career', number: 7, title: 'Защита и развитие проекта', shortTitle: 'Карьера',
    description: 'Представляем Neuro/52 в портфолио, воспроизводим алгоритмы на интервью и развиваем проект после курса.',
    projectResult: 'Сильное портфолио и план развития собственной нейросети.',
    range: 'Недели 49–52', color: '#344C7A', softColor: '#E4E9F3',
  },
]

export const getStage = (id: string) => stages.find((stage) => stage.id === id) ?? stages[0]
