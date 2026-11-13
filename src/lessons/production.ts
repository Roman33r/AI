import type { LessonGuide } from "./types"

export const productionGuides: LessonGuide[] = [
  {
    id: 35,
    essence: [
      "Чистый код делает поведение и границы изменения понятными. Архитектура проекта группирует код по ответственности: domain содержит правила, application — сценарии, infrastructure — базы и внешние API, interfaces — HTTP/CLI. Зависимости направлены к правилам, а не наоборот.",
      "Технический долг не всегда плох, но должен быть осознанным. Рефакторинг улучшает структуру без изменения наблюдаемого поведения и выполняется под защитой тестов небольшими шагами. Новый функционал и перестановку кода лучше разделять в ревью.",
    ],
    mentalModel: "HTTP/CLI → application use case → domain → порты → adapters БД/API. Детали можно заменить без переписывания бизнес-правил.",
    sections: [
      {
        title: "Слоистые границы и dependency inversion",
        paragraphs: [
          "Use case получает зависимости через конструктор и вызывает интерфейс репозитория. SQLAlchemy адаптер реализует этот интерфейс. Domain не импортирует FastAPI или requests, поэтому его можно тестировать без сети и сервера.",
          "Не каждый файл требует собственный интерфейс. Абстракция оправдана реальной вариацией или необходимостью изоляции. Иначе появляется слой передач, который усложняет чтение, не добавляя гибкости.",
        ],
        diagram: { nodes: ["api/routes.py", "application/services.py", "domain/models.py", "ports/repository.py", "infrastructure/db.py"], caption: "Route собирает зависимости и преобразует HTTP; сервис не знает о JSON и SQL." },
        code: { title: "Сценарий с портом", language: "python", content: "class CreateTicket:\n    def __init__(self, tickets: TicketRepository, clock: Clock):\n        self.tickets = tickets\n        self.clock = clock\n\n    def execute(self, text: str) -> Ticket:\n        ticket = Ticket.create(text=text, now=self.clock.now())\n        self.tickets.save(ticket)\n        return ticket" },
        table: { headers: ["Слой", "Может знать", "Не должен знать"], rows: [["Domain", "Правила и типы", "FastAPI, SQL"], ["Application", "Сценарии и порты", "Детали framework"], ["Infrastructure", "БД и провайдеров", "HTTP-ответы"], ["Interface", "HTTP/CLI и сборку", "Сложные бизнес-правила"]] },
      },
      {
        title: "Ошибки, конфигурация и качество",
        paragraphs: [
          "Конфигурация читается из окружения и валидируется при старте. Секреты не создают объектов domain. Ошибки образуют иерархию: NotFound, Validation, Conflict, InfrastructureError; interface переводит их в единый HTTP-контракт.",
          "Линтер, formatter, type checking и тесты запускаются одной командой. Покрытие полезно как сигнал непроверенных областей, но 100% не доказывает качество. Важнее критичные сценарии и мутационное мышление: сломается ли тест при реальной ошибке?",
        ],
        code: { title: "Единый перевод доменной ошибки", language: "python", content: "@app.exception_handler(TicketNotFound)\ndef not_found(request, error):\n    return JSONResponse(\n        status_code=404,\n        content={\"error\": {\"code\": \"ticket_not_found\", \"message\": str(error)}},\n    )" },
        note: "Правило ревью: читатель должен найти сценарий, внешние зависимости и обработку ошибки без поиска по десяти не связанным файлам.",
      },
    ],
    example: {
      title: "Вынос бизнес-правила из route",
      paragraphs: ["Исходный route валидирует JSON, открывает DB, рассчитывает скидку и пишет лог. Сначала тестами фиксируем поведение, затем выносим calculate_discount в domain и use case в application. Route остаётся адаптером.", "После каждого шага запускаются те же тесты. Если ожидание меняется, это уже не рефакторинг: изменение поведения оформляется отдельно и обсуждается явно."],
      code: { title: "Тонкий обработчик", language: "python", content: "@app.post(\"/tickets\", status_code=201)\ndef create_ticket(payload: TicketInput, service=Depends(get_service)):\n    ticket = service.execute(payload.text)\n    return TicketOutput.from_domain(ticket)" },
      result: "Правило тестируется без FastAPI, route занимается только HTTP, зависимости собираются в одном месте.",
    },
    mistakes: ["Domain импортирует framework и теряет независимость.", "Интерфейс на каждый класс без реальной вариации.", "Одновременный рефакторинг и изменение поведения.", "Погоня за покрытием без проверки силы тестов."],
    checkpoints: ["Могу показать направление зависимостей проекта.", "Use case тестируется без сети и БД.", "Ошибки имеют единый перевод на interface.", "Рефакторинг подтверждается неизменными тестами."],
  },
  {
    id: 36,
    essence: [
      "FastAPI строит HTTP API на типах Python и Pydantic. Dependency Injection собирает сессии, пользователя и сервисы, response_model ограничивает выход, а middleware выполняет сквозные действия. Production API требует предсказуемых ошибок, таймаутов, ограничения тела и корректного жизненного цикла.",
      "Синхронная блокирующая операция в async endpoint не становится неблокирующей от ключевого слова async. CPU-heavy работу выносят в процессы, долгие задачи — в очередь, внешние вызовы ограничивают дедлайнами. Health и readiness имеют разное назначение.",
    ],
    mentalModel: "Request ID → middleware → auth → validated input → use case → response_model → единый error format → metrics. Background task не заменяет надёжную очередь.",
    sections: [
      {
        title: "Схемы, зависимости и ошибки",
        paragraphs: [
          "Input и Output модели разделяются, чтобы внутреннее поле или секрет не утекло наружу. response_model фильтрует ответ и документирует его. Пагинация ограничена максимальным limit, фильтры проверяются по allowlist.",
          "Dependency с yield управляет ресурсом: создаёт сессию, передаёт в endpoint и закрывает после запроса. Для обязательной операции транзакция commit выполняется явно; при ошибке rollback не должен скрывать исходное исключение.",
        ],
        code: { title: "Схема и зависимость", language: "python", content: "class PredictionInput(BaseModel):\n    text: str = Field(min_length=1, max_length=4000)\n\nclass PredictionOutput(BaseModel):\n    label: str\n    model_version: str\n\n@app.post(\"/predict\", response_model=PredictionOutput)\ndef predict(payload: PredictionInput, service=Depends(get_service)):\n    return service.predict(payload.text)" },
        diagram: { nodes: ["Request", "Request ID + size limit", "Auth + rate limit", "Pydantic", "Service", "Typed response"], caption: "Общие правила выполняются до бизнес-логики и одинаково журналируются." },
      },
      {
        title: "Конкурентность, readiness и graceful shutdown",
        paragraphs: [
          "Liveness отвечает, жив ли процесс, readiness — способен ли он обслуживать трафик и загружена ли модель. При shutdown сервер перестаёт принимать новые запросы и завершает текущие в пределах grace period.",
          "Для внешнего LLM вызова ставят timeout и ограничение одновременных запросов через semaphore. Очередь с подтверждением сохраняет долгие задачи после перезапуска; in-memory BackgroundTasks подходит только для некритичной короткой работы.",
        ],
        formula: { expression: "concurrency ≤ min(внутренний лимит, лимит внешнего API);  queue_delay = время ожидания до начала задачи", explanation: "Увеличение workers без учёта внешнего rate limit только создаёт очередь и 429." },
        code: { title: "Ограничение одновременных вызовов", language: "python", content: "llm_slots = asyncio.Semaphore(8)\n\nasync def call_llm(payload):\n    async with llm_slots:\n        return await asyncio.wait_for(client.generate(payload), timeout=25)" },
        table: { headers: ["Проверка", "Что должна делать"], rows: [["/live", "Подтверждать работу event loop"], ["/ready", "Проверять модель и критичные зависимости"], ["SIGTERM", "Прекратить приём и завершить работу"], ["Большой body", "Отклонять до дорогой обработки"], ["Долгая задача", "Использовать очередь и task ID"]] },
      },
    ],
    example: {
      title: "Prediction API с контролируемой нагрузкой",
      paragraphs: ["Добавьте request ID, Pydantic input/output, единый errors, auth и ограничение тела. Модель загружается при lifespan. Внешний вызов ограничивается semaphore и дедлайном, ошибка возвращается как 503 с повторяемым request ID.", "Проведите тесты: неверное поле, большой текст, timeout, неготовая модель и SIGTERM. Нагрузочный тест показывает p95 и число 429, а не только успешные средние ответы."],
      code: { title: "Единый формат ошибки", language: "python", content: "return JSONResponse(\n    status_code=503,\n    content={\"error\": {\n        \"code\": \"upstream_timeout\",\n        \"message\": \"Сервис временно недоступен\",\n        \"request_id\": request.state.request_id,\n    }},\n)" },
      result: "API имеет строгий контракт, ограниченную конкурентность, готовность, контролируемые ошибки и корректное завершение.",
    },
    mistakes: ["Секретное внутреннее поле без response_model.", "Блокирующий requests внутри async endpoint.", "Readiness всегда 200 независимо от модели.", "Критичная долгая работа в in-memory background task."],
    checkpoints: ["Вход и выход описаны отдельными схемами.", "Понимаю async, блокировку и semaphore.", "Liveness и readiness проверяют разное.", "Есть deadline, error contract и graceful shutdown."],
  },
  {
    id: 37,
    essence: [
      "Docker image — неизменяемый пакет файловой системы и метаданных, container — запущенный экземпляр image. Слои кэшируются, поэтому сначала копируют dependency manifests, устанавливают зависимости, затем исходный код. Контейнерная файловая система временна; данные сохраняют в volumes или внешних сервисах.",
      "Compose описывает набор сервисов, сети и volumes для локального окружения. Healthcheck не позволяет зависимому сервису считаться готовым просто потому, что контейнер БД запущен. Production требует non-root пользователя, ограничений ресурсов, secrets вне image и повторяемого build.",
    ],
    mentalModel: "Dockerfile → layers → image digest → container + config + network + volume. Image одинаковый, окружение задаёт адреса и секреты.",
    sections: [
      {
        title: "Эффективный Dockerfile и .dockerignore",
        paragraphs: [
          "Каждая инструкция создаёт слой. Объединение apt-get update, install и очистки уменьшает мусор. .dockerignore исключает .git, .venv, node_modules, data и секреты из build context. Это ускоряет передачу и уменьшает риск утечки.",
          "Multi-stage build собирает зависимости в builder и копирует только необходимое в runtime. CMD задаёт команду по умолчанию, ENTRYPOINT — основной исполняемый путь. Для Python важно корректно передавать сигналы процессу и не прятать его за лишний shell.",
        ],
        code: { title: "Минимальный production Dockerfile", language: "dockerfile", content: "FROM python:3.12-slim AS runtime\nENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY src ./src\nRUN useradd --uid 10001 --create-home appuser\nUSER appuser\nEXPOSE 8000\nCMD [\"python\", \"-m\", \"uvicorn\", \"src.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]" },
        note: "Проверяйте image по digest в критичном deployment. Тег latest не является воспроизводимой версией.",
      },
      {
        title: "Compose, volumes и сетевая диагностика",
        paragraphs: [
          "Внутри compose network сервис обращается к postgres:5432, а не localhost. localhost внутри контейнера означает сам контейнер. Проброс ports нужен для доступа с хоста, но не требуется для связи контейнеров между собой.",
          "depends_on с condition: service_healthy ждёт healthcheck. Однако приложение всё равно должно повторять подключение при временном сбое. Named volume сохраняет данные БД, а код не монтируется в production image.",
        ],
        diagram: { nodes: ["Host :8000", "API container", "Compose network", "postgres:5432", "Named volume", "redis:6379"], caption: "Имена сервисов — DNS внутри сети; постоянные данные живут вне контейнерной FS." },
        code: { title: "Готовность PostgreSQL", language: "yaml", content: "services:\n  postgres:\n    image: postgres:16\n    healthcheck:\n      test: [\"CMD-SHELL\", \"pg_isready -U app\"]\n      interval: 5s\n      timeout: 3s\n      retries: 10\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:" },
      },
    ],
    example: {
      title: "Локальный стек API + PostgreSQL + Redis",
      paragraphs: ["Соберите API image, опишите три сервиса и named volume. Проверьте, что API использует DATABASE_URL с hostname postgres. Выполните миграцию отдельной командой, затем smoke test.", "Остановите и удалите контейнеры без -v: данные должны сохраниться. Затем пересоберите только изменённый код и убедитесь, что dependency layer кэшировался. Проверьте процесс от non-root пользователя."],
      code: { title: "Приёмочные команды", language: "bash", content: "docker compose build\ndocker compose up -d\ndocker compose ps\ndocker compose run --rm api python -m alembic upgrade head\ncurl --fail http://localhost:8000/ready\ndocker compose down\ndocker compose up -d  # pgdata сохранился" },
      result: "Стек поднимается одной командой, готовность проверяется, данные переживают пересоздание, image не содержит секретов и работает не от root.",
    },
    mistakes: ["localhost для обращения к другому контейнеру.", "COPY . . до установки зависимостей и потеря кэша.", "Секреты через COPY или ARG в image.", "docker compose down -v и неожиданное удаление production-подобных данных."],
    checkpoints: ["Различаю image, container, volume и network.", "Могу объяснить кэш слоёв и .dockerignore.", "Настраиваю healthcheck и retry подключения.", "Image воспроизводим, non-root и без секретов."],
  },
  {
    id: 38,
    essence: [
      "PostgreSQL хранит долговременные транзакционные данные, Redis — быстрые эфемерные структуры и кэш, очередь отделяет принятие задачи от её выполнения, object storage хранит большие файлы. Выбор зависит от требований к долговечности, консистентности и доступу.",
      "Транзакция обеспечивает атомарность связанных изменений. Кэш требует правил инвалидации и защиты от stampede. Worker подтверждает задачу после обработки, повторяет с ограничением и использует идемпотентность, потому что доставка обычно at-least-once.",
    ],
    mentalModel: "API → транзакция PostgreSQL → outbox/job → очередь → worker → объектное хранилище/БД → ack. Redis ускоряет, но не является единственным источником истины.",
    sections: [
      {
        title: "Транзакции, блокировки и миграции",
        paragraphs: [
          "ACID означает атомарность, согласованность, изоляцию и долговечность. Изоляция определяет, какие аномалии конкурентных чтений допустимы. Для ограниченного ресурса используют атомарный UPDATE с условием или SELECT FOR UPDATE в короткой транзакции.",
          "Миграции версионируются и применяются до переключения кода с учётом совместимости. Expand-migrate-contract сначала добавляет поле, затем переносит данные и только позже удаляет старое. Деструктивная миграция без обратной совместимости может сломать старые инстансы.",
        ],
        code: { title: "Атомарное списание лимита", language: "sql", content: "UPDATE accounts\nSET quota = quota - 1\nWHERE id = :account_id AND quota > 0\nRETURNING quota;\n-- Если строка не возвращена, лимит исчерпан; условие и запись атомарны." },
        diagram: { nodes: ["Начать транзакцию", "Проверить/изменить данные", "Записать outbox", "COMMIT", "Отдельный publisher", "Очередь"], caption: "Outbox не даёт БД сохранить заказ, а событие потеряться между commit и publish." },
      },
      {
        title: "Кэш, очередь и объектные файлы",
        paragraphs: [
          "Cache-aside сначала читает Redis, при miss загружает БД и записывает значение с TTL. Инвалидация по событию обновления уменьшает устаревание. Для горячего ключа используют lock или request coalescing, чтобы тысячи запросов одновременно не пошли в БД.",
          "Worker получает job_id и idempotency_key. Если операция завершена, повтор возвращает прежний результат. После нескольких ошибок задача попадает в DLQ с контекстом. Файл загружается в object storage, а в БД хранятся key, size, checksum, owner и статус антивирусной проверки.",
        ],
        formula: { expression: "cache_hit_rate = hits/(hits+misses);  throughput_worker = завершённые задачи / секунды", explanation: "Высокий hit rate не компенсирует неправильную инвалидацию; корректность важнее процента попаданий." },
        table: { headers: ["Хранилище", "Подходит", "Не использовать как"], rows: [["PostgreSQL", "Источник истины, связи", "Большие бинарные файлы"], ["Redis", "TTL cache, rate limit", "Единственную долговечную БД"], ["Queue", "Асинхронные задачи", "Синхронный ответ пользователю"], ["Object storage", "Файлы и артефакты", "Транзакционные метаданные"]] },
      },
    ],
    example: {
      title: "Асинхронная обработка документа",
      paragraphs: ["API сохраняет метаданные файла и outbox-запись в одной транзакции, возвращает task_id и выдаёт signed upload URL. После загрузки worker проверяет checksum, статус и тип, обрабатывает документ и атомарно отмечает результат.", "Повторная доставка той же задачи не создаёт второй результат. Постоянная ошибка отправляется в DLQ, а интерфейс показывает failed с безопасной причиной и возможностью повторить."],
      code: { title: "Идемпотентный worker", language: "python", content: "if results.exists(job.idempotency_key):\n    queue.ack(job)\n    return\nwith database.transaction():\n    result = process(job)\n    results.save(job.idempotency_key, result)\n    queue.ack(job)" },
      result: "Данные, событие и задача согласованы, повторы безопасны, файлы хранятся отдельно, ошибки видимы и попадают в DLQ.",
    },
    mistakes: ["Запись в БД и publish без outbox в двух независимых действиях.", "Кэш без TTL и правил инвалидации.", "Ack до обработки и потеря задачи при сбое.", "Байты больших файлов в обычной строке PostgreSQL."],
    checkpoints: ["Объясняю транзакцию и атомарное условие.", "Понимаю outbox и at-least-once delivery.", "Кэш имеет TTL, инвалидацию и защиту от stampede.", "Worker идемпотентен, DLQ и файлы имеют явный жизненный цикл."],
  },
]
