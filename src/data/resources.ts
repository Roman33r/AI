export type Resource = {
  title: string
  description: string
  url: string
  stage: string
}

export const resources: Resource[] = [
  { title: 'Python Tutorial', description: 'Официальное руководство по языку и стандартной библиотеке.', url: 'https://docs.python.org/3/tutorial/', stage: 'Python' },
  { title: 'Pro Git', description: 'Бесплатная книга о ветках, истории, совместной работе и внутреннем устройстве Git.', url: 'https://git-scm.com/book/en/v2', stage: 'Python' },
  { title: 'Mathematics for Machine Learning', description: 'Линейная алгебра, анализ, вероятность и оптимизация для ML.', url: 'https://mml-book.github.io/', stage: 'ML' },
  { title: 'An Introduction to Statistical Learning', description: 'Понятное введение в статистическое обучение с примерами.', url: 'https://www.statlearning.com/', stage: 'ML' },
  { title: 'scikit-learn User Guide', description: 'Справочник по моделям, pipelines, валидации и метрикам.', url: 'https://scikit-learn.org/stable/user_guide.html', stage: 'ML' },
  { title: 'PyTorch Tutorials', description: 'Официальные практические материалы по тензорам, обучению и deployment.', url: 'https://pytorch.org/tutorials/', stage: 'Deep Learning' },
  { title: 'Dive into Deep Learning', description: 'Интерактивная книга с математикой, кодом и объяснением архитектур.', url: 'https://d2l.ai/', stage: 'Deep Learning' },
  { title: 'Hugging Face LLM Course', description: 'Transformers, datasets, tokenizers, fine-tuning и публикация моделей.', url: 'https://huggingface.co/learn/llm-course/chapter1/1', stage: 'LLM' },
  { title: 'Full Stack Deep Learning', description: 'Практика создания полноценных ML/LLM-продуктов и их эксплуатации.', url: 'https://fullstackdeeplearning.com/', stage: 'LLM' },
  { title: 'FastAPI Tutorial', description: 'Пошаговое руководство по API, зависимостям, безопасности и тестированию.', url: 'https://fastapi.tiangolo.com/tutorial/', stage: 'Production' },
  { title: 'Docker Get Started', description: 'Официальное введение в контейнеры, images, volumes и Compose.', url: 'https://docs.docker.com/get-started/', stage: 'Production' },
  { title: 'MLOps Zoomcamp', description: 'Открытый практический курс по воспроизводимости, deployment и мониторингу.', url: 'https://github.com/DataTalksClub/mlops-zoomcamp', stage: 'Production' },
]

export const studyPrinciples = [
  { title: 'Изучи', text: 'Возьми один основной источник и запиши определения своими словами. Не собирай десять курсов одновременно.' },
  { title: 'Восстанови', text: 'Закрой материал и повтори ключевой пример самостоятельно. Узнавание кода не равно умению писать.' },
  { title: 'Измени', text: 'Поменяй условие задачи, добавь ошибку и проверь граничный случай. Так знание становится рабочим.' },
  { title: 'Докажи', text: 'Отметь практические шаги, выполни задание и набери 3 из 3 в тесте. Только после этого неделя завершена.' },
  { title: 'Повтори', text: 'Возвращайся к карточкам и ошибкам через несколько дней. Неудачный ответ — повод отправить понятие в повторение.' },
]
