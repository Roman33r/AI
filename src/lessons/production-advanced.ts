import type { LessonGuide } from "./types"

export const productionAdvancedGuides: LessonGuide[] = [
  {
    id: 39,
    essence: [
      "Облачный deployment начинается не с выбора самого сложного сервиса, а с требований: регион, доступность, нагрузка, данные, бюджет и навыки команды. Управляемый контейнерный сервис часто проще Kubernetes и закрывает типовой AI API. Kubernetes оправдан, когда нужны оркестрация многих сервисов и явные политики масштабирования.",
      "Бессерверные функции уменьшают операционную работу, но имеют холодный старт, лимиты времени и памяти. Модель большого размера и долгий inference могут не подходить. IAM предоставляет минимальные права, секреты хранятся в Secret Manager, приватная сеть ограничивает доступ к БД.",
    ],
    mentalModel: "DNS/HTTPS → load balancer → stateless API replicas → managed DB + object storage + queue. Автоскейлинг по сигналу, бюджет и алерты — часть архитектуры.",
    sections: [
      {
        title: "Compute, сеть и IAM",
        paragraphs: [
          "Публичным обычно является load balancer или API gateway, а приложение и БД находятся в приватных подсетях. Сертификат TLS завершается на доверенной точке, security groups разрешают только необходимые направления.",
          "Service account приложения получает чтение конкретного секрета и запись в конкретный bucket, а не роль администратора. Секрет передаётся при запуске и не печатается в лог. Ключи имеют владельца, срок и процедуру ротации.",
        ],
        table: { headers: ["Вариант", "Сильная сторона", "Ограничение"], rows: [["Managed container", "Простой deploy и autoscale", "Меньше контроля"], ["VM", "Полный контроль", "Patching и capacity вручную"], ["Kubernetes", "Оркестрация и политики", "Высокая сложность"], ["Serverless", "События и оплата за вызов", "Timeout и cold start"]] },
        diagram: { nodes: ["Internet + TLS", "Load balancer", "Private API replicas", "Managed PostgreSQL", "Bucket + queue", "Secret Manager + IAM"], caption: "Трафик входит через контролируемую границу; данные не публикуются напрямую." },
      },
      {
        title: "Стоимость, доступность и Infrastructure as Code",
        paragraphs: [
          "Стоимость складывается из compute-времени, памяти, GPU, запросов, хранения и исходящего трафика. Дешёвый инстанс с неэффективным batch может стоить дороже. Бюджетный alert предупреждает о превышении, но не является жёстким ограничителем расходов, если провайдер не предоставляет такую функцию.",
          "Terraform или другой IaC описывает инфраструктуру воспроизводимо. State защищается, изменения проходят plan и ревью. Резервные копии БД проверяются восстановлением; одна доступная копия без restore-теста не доказывает готовность к аварии.",
        ],
        formula: { expression: "monthly_cost ≈ instances × hours × rate + storage + egress + managed_services + model_calls", explanation: "Оценка строится по реальным единицам потребления и сценариям нагрузки, а не только по цене одного инстанса." },
        code: { title: "Readiness и минимум реплик", language: "yaml", content: "readinessProbe:\n  httpGet: { path: /ready, port: 8000 }\nresources:\n  requests: { cpu: 500m, memory: 1Gi }\n  limits: { memory: 2Gi }\nminReplicas: 2\nmaxReplicas: 10" },
      },
    ],
    example: {
      title: "Managed container для AI API",
      paragraphs: ["Определите требования: две реплики, HTTPS, приватная БД, секреты через IAM, p95 меньше двух секунд и месячный бюджет. Разверните image по digest, настройте переменные окружения и health checks.", "Сымитируйте отказ одной реплики и восстановление БД в отдельное окружение. Рассчитайте стоимость при базовом и пиковом трафике и включите бюджетные уведомления."],
      result: "Сервис доступен по HTTPS, масштабируется без хранения состояния в инстансе, имеет least privilege, проверенный backup restore и понятную модель расходов.",
    },
    mistakes: ["Kubernetes без операционной необходимости.", "Публичная БД и широкая IAM-роль.", "Только одна реплика и состояние на локальном диске.", "Backup без проверки восстановления и стоимость без egress."],
    checkpoints: ["Могу обосновать выбор compute по требованиям.", "Понимаю приватную сеть и минимальные права.", "Рассчитываю стоимость по единицам потребления.", "Проверил отказ реплики и восстановление копии."],
  },
  {
    id: 40,
    essence: [
      "CI проверяет каждое изменение, CD доставляет проверенный артефакт. Сборка выполняется один раз, image получает digest и продвигается между окружениями без пересборки. Миграции, rollout и rollback планируются как совместимые шаги.",
      "ML lifecycle добавляет versioned datasets, tracking параметров и метрик, registry моделей и сравнение с текущей production. Новая модель не заменяет старую только потому, что локальная метрика выросла: сначала повторяемая проверка, затем shadow/canary и наблюдаемый rollout.",
    ],
    mentalModel: "Pull request → lint/test/security → build image + model artifact → registry → staging → gates → canary → production → monitor → rollback.",
    sections: [
      {
        title: "Pipeline и безопасная поставка",
        paragraphs: [
          "CI должен быть быстрым и детерминированным: зависимости кэшируются по lockfile, секреты не выводятся, permissions workflow минимальны. Branch protection требует проверки и ревью. Deployment использует отдельную identity с правом только на нужное окружение.",
          "Blue-green переключает трафик между двумя версиями, canary сначала отправляет небольшой процент. Rollback возвращает прежний image и model version, но несовместимая миграция БД может помешать, поэтому используют backward-compatible изменения.",
        ],
        diagram: { nodes: ["PR checks", "Build once + SBOM", "Image digest", "Staging + migration", "5% canary", "100% production"], caption: "Каждый этап имеет критерий перехода и возможность остановить распространение." },
        code: { title: "Минимальные этапы CI", language: "yaml", content: "steps:\n  - uses: actions/checkout@v4\n  - run: pip install -r requirements.txt\n  - run: ruff check .\n  - run: pytest -q\n  - run: docker build -t registry/app:${{ github.sha }} .\n  # push/deploy выполняются с минимальными permissions и без печати секретов" },
      },
      {
        title: "Experiment tracking и model registry",
        paragraphs: [
          "Run содержит git commit, config, data snapshot/hash, seed, dependencies, метрики и путь артефакта. Результат без этих данных трудно повторить. Registry хранит версии и статусы candidate/approved/archived, но сам не доказывает качество.",
          "Canary сравнивает не только accuracy, но и latency, ошибки, стоимость и качество на критичных сегментах. Для LLM offline suite выполняется до deploy, а online guardrails контролируют политику и пользовательские сигналы.",
        ],
        formula: { expression: "canary_decision = quality_gate AND safety_gate AND latency_gate AND cost_gate", explanation: "Все обязательные условия должны быть истинны; одна сильная метрика не компенсирует нарушение безопасности." },
        table: { headers: ["Артефакт", "Что фиксирует"], rows: [["Image digest", "Код и системные зависимости"], ["Model version", "Веса и preprocessing"], ["Data version", "Обучающий и eval snapshot"], ["Run ID", "Config, seed и метрики"], ["Release", "Связь image + model + config"]] },
      },
    ],
    example: {
      title: "Canary новой версии классификатора",
      paragraphs: ["Зафиксируйте dataset, параметры и golden batch. CI собирает image и запускает offline evaluation. Registry получает candidate только при прохождении quality/safety gates.", "Staging выполняет smoke и нагрузочный тест. Canary получает 5% трафика; автоматический анализ останавливает rollout при росте error rate или p95. Rollback возвращает прошлую связку image/model/config."],
      result: "Релиз воспроизводим, артефакт собран один раз, качество проверено до и во время rollout, откат не требует срочной пересборки.",
    },
    mistakes: ["Пересборка разных образов для staging и production.", "Deploy из локального ноутбука.", "Model registry без data/config версии.", "Несовместимая миграция перед canary без обратного пути."],
    checkpoints: ["Понимаю build once и promotion по digest.", "Могу описать canary gates и rollback.", "Run воспроизводит код, данные и конфигурацию.", "CI имеет минимальные права и не раскрывает секреты."],
  },
  {
    id: 41,
    essence: [
      "Observability помогает ответить на неожиданный вопрос о системе по её внешним сигналам. Метрики показывают распределения и тренды, логи — события с контекстом, traces — путь и длительность операции через сервисы. Они дополняют друг друга.",
      "SLI — измеряемый показатель, SLO — цель за период, SLA — внешнее обязательство с последствиями. Error budget допускает ограниченное количество плохих событий. Алерт должен требовать действия и быть связан с пользовательским влиянием, а не с любым колебанием CPU.",
    ],
    mentalModel: "RED: Rate, Errors, Duration + качество модели + стоимость → SLO → burn-rate alert → dashboard/trace/log → runbook.",
    sections: [
      {
        title: "Метрики, логи и traces",
        paragraphs: [
          "Средняя latency скрывает хвост, поэтому используют histogram и p50/p95/p99. labels должны иметь ограниченную кардинальность: route и status подходят, user_id и request_id — нет. Иначе база метрик переполняется.",
          "Structured log содержит timestamp, level, service, release, request_id и код ошибки, но не секреты и полный чувствительный prompt. Trace связывает API, retrieval, DB и LLM вызов; sampling уменьшает стоимость, ошибки можно сохранять чаще.",
        ],
        code: { title: "Структурированное событие", language: "json", content: "{\n  \"level\": \"error\",\n  \"service\": \"assistant-api\",\n  \"release\": \"a81f2c\",\n  \"request_id\": \"req_7d91\",\n  \"route\": \"/answer\",\n  \"upstream\": \"retrieval\",\n  \"error_code\": \"deadline_exceeded\",\n  \"duration_ms\": 2501\n}" },
        diagram: { nodes: ["API span", "Auth + DB", "Retrieval span", "Rerank", "LLM span", "Response + feedback"], caption: "Общий trace ID показывает, какой этап создал задержку или ошибку." },
      },
      {
        title: "SLO, error budget и качество AI",
        paragraphs: [
          "Если SLO доступности 99,9% за 30 дней, error budget около 43,2 минуты полной недоступности. Более точный SLO считает долю хороших запросов, а не только время. Burn rate показывает, насколько быстро расходуется бюджет относительно допустимого темпа.",
          "Для AI добавляют groundedness, refusal correctness, citation validity, toxicity blocks и user feedback. Drift входных признаков сравнивают с baseline; распределение может измениться до падения delayed labels.",
        ],
        formula: { expression: "availability SLI = good_requests / valid_requests;  error_budget = 1 − SLO;  burn_rate = observed_error_rate / allowed_error_rate", explanation: "При SLO 0,999 допустимая доля ошибок 0,001. Burn rate 2 означает расход бюджета вдвое быстрее." },
        table: { headers: ["Сигнал", "Действие"], rows: [["Высокий burn rate", "Страничить on-call и открыть runbook"], ["p95 retrieval", "Проверить DB/index и trace"], ["Рост hallucination eval", "Остановить rollout и исследовать"], ["Drift", "Проверить источник и сегменты"], ["Просто высокий CPU без влияния", "Наблюдать, не будить команду автоматически"]] },
      },
    ],
    example: {
      title: "Диагностика роста p95 ответа ассистента",
      paragraphs: ["Дашборд RED показывает рост p95 без роста входящего rate. Trace выделяет retrieval span. Метрика DB connections и slow query log помогают найти неэффективный запрос после нового фильтра.", "Инцидент фиксирует время, влияние, release и действие. После исправления добавляют индекс, regression load test и runbook. Алерт связывается с SLO burn rate, а не с одним пиком latency."],
      code: { title: "SLO на хорошие ответы", language: "text", content: "good = HTTP success AND deadline met AND policy pass\nSLI = good / все валидные запросы\nАлерт: быстрый и медленный burn rate на двух окнах" },
      result: "Причина локализована по traces и логам, пользовательский SLO измеряется, исправление получило регрессионную проверку и понятный runbook.",
    },
    mistakes: ["Только средняя latency и никаких перцентилей.", "request_id как label метрики.", "Чувствительные документы и ключи в логах.", "Алерты без действия, владельца и runbook."],
    checkpoints: ["Различаю метрики, логи и traces.", "Могу рассчитать SLI, error budget и burn rate.", "В observability есть качество AI, не только CPU.", "Каждый критичный алерт имеет действие и runbook."],
  },
  {
    id: 42,
    essence: [
      "Производительность оптимизируется по измерениям. Профилирование разделяет CPU, память, I/O и ожидание внешних сервисов. Нагрузочный тест моделирует реальные сценарии и проверяет latency, throughput, ошибки и деградацию зависимостей.",
      "Масштабирование бывает вертикальным и горизонтальным. Stateless API проще реплицировать, а узким местом становится БД или модель. Backpressure, очереди, кэширование, batching и autoscaling требуют ограничений, чтобы нагрузка не разрушила весь стек.",
    ],
    mentalModel: "Нагрузка → профиль → узкое место → гипотеза → оптимизация → повторный тест → capacity plan + лимиты + аварийная деградация.",
    sections: [
      {
        title: "Throughput, latency и закон очередей",
        paragraphs: [
          "Throughput — выполненные запросы в секунду, latency — время одного запроса. При concurrency C и средней latency L секунд закон Литтла связывает их с RPS: C = λ × W. Рост concurrency при насыщенном ресурсе увеличивает очередь и хвост, а не полезную работу.",
          "Load test должен включать warm-up, устойчивую нагрузку и spike. Смотрят p95/p99, saturation и ошибки. Coordinated omission может скрыть ожидание, если генератор не создаёт запросы по расписанию во время зависания.",
        ],
        formula: { expression: "L = λ × W;  concurrency = arrival_rate × response_time", explanation: "При λ=40 запросов/с и W=0,25 с в системе в среднем 10 запросов. Это средняя модель, не гарантия p99." },
        chart: { title: "Насыщение ресурса", kind: "line", labels: ["20 RPS", "40", "60", "80", "100"], values: [80, 120, 190, 480, 1400], yLabel: "p95, мс", caption: "После узкого места хвост растёт нелинейно. Простое добавление concurrency ухудшает очередь." },
      },
      {
        title: "Оптимизации и деградация",
        paragraphs: [
          "Индекс ускоряет подходящий запрос, но занимает память и замедляет запись. Кэш полезен при повторяемости и допустимой свежести. Batching повышает utilization модели, но добавляет время ожидания батча. Квантизация снижает память и иногда ускоряет inference, но требует оценки качества.",
          "Autoscaling реагирует с задержкой и не заменяет capacity plan. Rate limit, max queue, deadline, circuit breaker и load shedding ограничивают ущерб. При перегрузке можно отключить reranker или вернуть кэшированный ответ, если это заранее согласованная деградация.",
        ],
        diagram: { nodes: ["Load balancer", "Rate limit + admission", "Stateless replicas", "Model batcher + bounded queue", "DB/cache", "Graceful fallback"], caption: "Система отклоняет или упрощает часть работы до исчерпания памяти и каскадного сбоя." },
        code: { title: "Ограниченная очередь", language: "python", content: "try:\n    work_queue.put_nowait(request)\nexcept asyncio.QueueFull:\n    raise ServiceOverloaded(\"Попробуйте позже\")\n# worker имеет deadline; результат старше дедлайна не нужен" },
      },
    ],
    example: {
      title: "Оптимизация retrieval API",
      paragraphs: ["Baseline: 60 RPS, p95 700 мс, p99 1,4 с. Trace показывает 450 мс запроса PostgreSQL. EXPLAIN находит последовательное сканирование, а профиль показывает сериализацию лишних полей.", "Добавьте индекс по реальному фильтру, ограничьте select и измерьте заново тем же нагрузочным сценарием. Проверьте скорость записи и объём индекса. Установите bounded queue и деградацию для всплесков."],
      result: "Решение основано на профиле, сравнение выполнено на одинаковой нагрузке, p95/p99 улучшены без скрытого роста ошибок и неограниченной очереди.",
    },
    mistakes: ["Оптимизация до профилирования.", "Вывод по среднему RPS без p99 и ошибок.", "Неограниченная очередь как способ принять любую нагрузку.", "Autoscale без учёта внешних rate limits и cold start."],
    checkpoints: ["Могу рассчитать concurrency по закону Литтла.", "Load test включает p95/p99, ошибки и saturation.", "Оптимизация подтверждена повторным измерением.", "Есть backpressure, дедлайн и согласованная деградация."],
  },
]
