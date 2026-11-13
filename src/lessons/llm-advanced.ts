import type { LessonGuide } from "./types"

export const llmAdvancedGuides: LessonGuide[] = [
  {
    id: 30,
    essence: [
      "Продвинутый RAG улучшает не только генератор, а весь ranking path. Hybrid search объединяет точные keyword-совпадения и semantic embeddings, metadata filters сужают корпус, query rewriting уточняет запрос, reranker переранжирует небольшой candidate set более дорогой моделью.",
      "Каждое добавление должно доказать пользу на срезах. Reranker может повысить nDCG, но увеличить latency; rewriting помогает диалоговым вопросам, но способно изменить смысл. Метрики retrieval, ответа, стоимости и задержки рассматриваются вместе.",
    ],
    mentalModel: "Query → rewrite с сохранением смысла → hybrid candidates → ACL/metadata → rerank top-N → diverse top-k → grounded answer → end-to-end eval.",
    sections: [
      {
        title: "Hybrid search и Reciprocal Rank Fusion",
        paragraphs: [
          "BM25 оценивает lexical relevance с учётом частоты термина, длины документа и обратной документной частоты. Vector search находит смысловые совпадения. Объединение по нормированным score может быть нестабильным, потому что шкалы различаются; RRF использует ранги.",
          "RRF суммирует вклад документа в разных списках. Документ, занявший высокие места в обоих, получает преимущество. Параметр k сглаживает разницу позиций; веса источников подбирают на dev и замораживают для holdout.",
        ],
        formula: { expression: "RRF(d) = Σ_source weight_source / (k + rank_source(d));  nDCG@k = DCG@k / IDCG@k", explanation: "DCG учитывает graded relevance с логарифмическим убыванием позиции, IDCG нормирует идеальным ranking." },
        code: { title: "RRF по двум спискам", language: "python", content: "def rrf(rankings: list[list[str]], k: int = 60) -> dict[str, float]:\n    scores = {}\n    for ranking in rankings:\n        for rank, document_id in enumerate(ranking, start=1):\n            scores[document_id] = scores.get(document_id, 0) + 1 / (k + rank)\n    return scores" },
      },
      {
        title: "Reranking, разнообразие и измерение",
        paragraphs: [
          "Bi-encoder быстро сравнивает независимые векторы, cross-encoder читает query и документ вместе и обычно точнее оценивает пару, но дороже. Поэтому first stage возвращает 50–100 кандидатов, а reranker оставляет 5–10.",
          "MMR уменьшает дублирование: следующий документ должен быть релевантен запросу и не слишком похож на уже выбранные. Это важно, когда top-k заполнен почти одинаковыми chunks одного раздела и не покрывает разные условия ответа.",
        ],
        formula: { expression: "MMR = argmax_d [λ·Rel(d,q) − (1−λ)·max_{s∈S} Sim(d,s)]", explanation: "λ регулирует баланс релевантности и новизны относительно уже выбранного множества S." },
        chart: { title: "Качество и задержка ranking", kind: "bars", labels: ["Vector", "Hybrid", "+Rerank"], values: [0.72, 0.8, 0.86], yLabel: "nDCG@10", caption: "Каждый прирост сопоставьте с latency: reranker может быть оправдан на сложных, а не всех запросах." },
        table: { headers: ["Метрика", "Что измеряет"], rows: [["Recall@k", "Наличие нужного документа"], ["MRR", "Позицию первого нужного"], ["nDCG", "Качество всего graded ranking"], ["Coverage", "Покрытие нескольких необходимых фактов"], ["p95 latency", "Хвост времени retrieval path"]] },
      },
    ],
    example: {
      title: "Сравнение четырёх вариантов retrieval",
      paragraphs: ["Соберите baseline vector, BM25, RRF hybrid и hybrid+cross-encoder. Для каждого сохраните Recall@20, nDCG@10, coverage, p50/p95 и стоимость. Отдельно разметьте lexical, semantic и multi-hop срезы.", "После выбора ranking повторите end-to-end answer evaluation. Иногда nDCG растёт, а answer quality не меняется, потому что нужный факт уже попадал в top-5. Тогда дополнительная сложность не нужна."],
      code: { title: "Сводный эксперимент", language: "python", content: "report = experiments.groupby(\"pipeline\").agg(\n    ndcg=(\"ndcg_at_10\", \"mean\"),\n    coverage=(\"fact_coverage\", \"mean\"),\n    p95=(\"retrieval_latency\", lambda x: x.quantile(.95)),\n    cost=(\"rerank_cost\", \"sum\"),\n)" },
      result: "Ranking выбран по срезам и полному пути, а компромисс качества, задержки и стоимости зафиксирован численно.",
    },
    mistakes: ["Сложение несопоставимых BM25 и cosine score без нормализации.", "Rerank всего корпуса вместо кандидатов.", "Оценка только средней nDCG без multi-hop и latency.", "Query rewrite без проверки сохранения исходного смысла."],
    checkpoints: ["Объясняю BM25, vectors и RRF.", "Различаю bi-encoder и cross-encoder.", "Могу рассчитать nDCG и coverage.", "Каждое усложнение подтверждено end-to-end экспериментом."],
  },
  {
    id: 31,
    essence: [
      "Tool calling позволяет модели предложить вызов заранее описанной функции с аргументами по схеме. Модель не выполняет функцию: ваш backend валидирует имя и аргументы, проверяет права, выполняет операцию и возвращает результат модели или пользователю.",
      "Чтение данных и изменение состояния имеют разный риск. Для платежа, удаления и отправки сообщения нужны подтверждение, идемпотентность и audit log. Описание инструмента должно содержать назначение, ограничения, ошибки и чёткие аргументы, а не только красивое имя.",
    ],
    mentalModel: "User → LLM выбирает tool_call → backend проверяет schema + policy → подтверждение для write → executor → typed result → LLM объясняет фактический результат.",
    sections: [
      {
        title: "Контракт инструмента и цикл вызова",
        paragraphs: [
          "Набор инструментов должен быть небольшим и непересекающимся. Если get_order и search_order делают почти одно, модель будет путаться. Аргументы используют enum и диапазоны; произвольный SQL, shell или URL не передаются напрямую из ответа модели.",
          "После tool result модель получает структурированный фактический ответ, включая ошибку. Нельзя подменять неуспешное выполнение успешным текстом. Цикл ограничен числом вызовов и общим дедлайном, а повторный вызов write-операции использует idempotency key.",
        ],
        diagram: { nodes: ["Модель", "tool_call + JSON", "Schema validation", "Authorization", "Executor", "Typed result", "Модель"], caption: "Решение о выполнении принимает backend; модель виден только результат." },
        code: { title: "Безопасная диспетчеризация", language: "python", content: "arguments = GetOrderArgs.model_validate_json(call.arguments)\nif call.name != \"get_order\":\n    raise UnknownTool(call.name)\nauthorize(user, \"orders:read\", arguments.order_id)\nresult = order_service.get(arguments.order_id)\nreturn ToolResult(success=True, data=result)" },
        table: { headers: ["Операция", "Дополнительная защита"], rows: [["Поиск", "ACL, лимит результатов"], ["Создание черновика", "Валидация и rate limit"], ["Отправка письма", "Подтверждение и audit"], ["Платёж", "Подтверждение + idempotency"], ["Удаление", "Явное подтверждение и запрет по умолчанию"]] },
      },
      {
        title: "Ошибки, подтверждения и тестирование",
        paragraphs: [
          "Тесты разделяют выбор инструмента и его выполнение. Первое оценивается на размеченных диалогах: правильный tool, аргументы, отказ от вызова. Второе — обычными unit/integration tests с моками и реальной политикой безопасности.",
          "Подтверждение должно показывать конкретное действие и параметры до записи. Если пользователь меняет сумму после предложения модели, старое подтверждение недействительно. Audit хранит actor, action, аргументы без секретов, результат и correlation ID.",
        ],
        code: { title: "Подтверждение неизменного действия", language: "python", content: "preview = prepare_payment(arguments)\nconfirmation_id = store_preview(preview, expires_in=120)\n# Повторный POST содержит confirmation_id и idempotency_key\nif not user_confirmed(confirmation_id, expected_hash=preview.hash):\n    raise ConfirmationRequired()" },
        formula: { expression: "tool_success = успешные и разрешённые вызовы / все предложенные вызовы;  unsafe_call_rate должен стремиться к 0", explanation: "Отдельно считают tool selection accuracy, argument accuracy и execution success." },
        note: "Текст «я выполнил платёж» принимается только после успешного executor result, никогда — до него.",
      },
    ],
    example: {
      title: "Ассистент заказов с безопасным возвратом",
      paragraphs: ["Реализуйте get_order как read tool и create_refund как write tool. Сначала модель получает заказ через backend с проверкой владельца. Для возврата формируется preview с суммой, причиной и сроком действия.", "Протестируйте попытку возврата чужого заказа, неверную сумму, повтор request с тем же idempotency key и timeout executor. Пользователь должен увидеть фактический статус, а не уверенную генерацию."],
      code: { title: "Идемпотентное выполнение", language: "python", content: "existing = refunds.find_by_idempotency_key(key)\nif existing:\n    return existing\nrefund = payment_provider.refund(order_id, amount, idempotency_key=key)\naudit.log(actor=user.id, action=\"refund\", refund_id=refund.id)\nreturn refund" },
      result: "Read и write разделены, аргументы и права проверены, опасное действие требует подтверждения, повторы не создают дубликаты.",
    },
    mistakes: ["Прямое выполнение произвольного кода или SQL от модели.", "Отсутствие авторизации на уровне executor.", "Автоматическое write-действие без preview и подтверждения.", "Сообщение об успехе до фактического результата."],
    checkpoints: ["Понимаю, что модель только предлагает вызов.", "Каждый tool имеет typed schema и политику.", "Write операции подтверждаются и идемпотентны.", "Selection и execution оцениваются отдельными тестами."],
  },
  {
    id: 32,
    essence: [
      "Агент использует модель для выбора следующего шага в цикле наблюдений и действий. Чем больше свободы, тем сложнее предсказать стоимость, безопасность и результат. Для большинства продуктов полезнее ограниченный workflow с конечными состояниями, явными переходами и ручными checkpoints.",
      "State machine описывает допустимые состояния и события. Planner может предложить план, но executor видит только разрешённые tools, validator проверяет результат, а budget ограничивает число шагов, токены и wall time. Память разделяется на состояние задачи и долговременные данные с политикой хранения.",
    ],
    mentalModel: "Input → plan → разрешённое действие → наблюдение → validator → следующее состояние → success/fallback/human. Любой цикл имеет budget и условие остановки.",
    sections: [
      {
        title: "Workflow вместо бесконечного ReAct",
        paragraphs: [
          "ReAct чередует reasoning и действия, но свободный цикл может повторять поиск или обходить ошибку новыми вызовами. Конечный workflow заранее задаёт retrieve → draft → verify → finalize и допускает возврат только в определённое состояние.",
          "Состояние должно быть сериализуемым: task_id, current_step, attempts, evidence, tool_results и budget. Это позволяет восстановить задачу после сбоя и не полагаться на скрытую память диалога.",
        ],
        diagram: { nodes: ["PLAN", "RETRIEVE", "DRAFT", "VERIFY", "DONE"], caption: "VERIFY может вернуть в RETRIEVE один раз; превышение attempts ведёт в HUMAN_REVIEW, а не вечный цикл." },
        code: { title: "Ограниченный переход", language: "python", content: "if state.step == \"VERIFY\" and not report.grounded:\n    if state.attempts < 1:\n        state.step = \"RETRIEVE\"\n        state.attempts += 1\n    else:\n        state.step = \"HUMAN_REVIEW\"\nif state.total_tokens > budget.tokens:\n    state.step = \"FAILED_BUDGET\"" },
        table: { headers: ["Ограничение", "Пример"], rows: [["Шаги", "Не более 6"], ["Один tool", "Не более 2 повторов"], ["Токены", "Жёсткий budget"], ["Wall time", "Общий дедлайн 45 секунд"], ["Write", "Только после human approval"]] },
      },
      {
        title: "Память, параллелизм и оценка траектории",
        paragraphs: [
          "Краткосрочная память хранит данные текущей задачи, долгосрочная — только полезные проверенные факты с согласия и сроком жизни. Автоматическое сохранение всего диалога увеличивает риск утечки и загрязняет будущие ответы.",
          "Оценка агента включает финальный success, tool errors, число шагов, стоимость, повторные действия и unsafe attempts. Иногда короткая траектория с человеческой проверкой лучше длинного автономного пути. Параллельные read-вызовы возможны, write-операции требуют порядка и блокировок.",
        ],
        formula: { expression: "task_success = задачи с принятым результатом / все задачи;  cost_per_success = Σcost / число успешных задач", explanation: "Средняя стоимость запуска может скрывать дорогие неудачи; считайте также стоимость успеха." },
        chart: { title: "Сравнение стратегий", kind: "bars", labels: ["Workflow", "Free agent"], values: [0.84, 0.76], yLabel: "Task success", caption: "В этом примере ограниченный workflow не только дешевле, но и надёжнее; свобода сама по себе не улучшает результат." },
      },
    ],
    example: {
      title: "Агент исследования с обязательной проверкой",
      paragraphs: ["Разрешите search и read только из whitelist. Planner формирует до трёх вопросов, retriever собирает источники параллельно, writer создаёт claims, verifier проверяет поддержку. Финальный шаг отдаёт неподтверждённые claims человеку.", "В тестах поиск возвращает противоречивые источники, пустой результат и дубликаты. Проверьте, что workflow останавливается по budget, не выдумывает факты и может быть восстановлен из state после рестарта."],
      code: { title: "Сериализуемое состояние", language: "python", content: "class AgentState(BaseModel):\n    task_id: str\n    step: Literal[\"PLAN\", \"RETRIEVE\", \"DRAFT\", \"VERIFY\", \"DONE\", \"HUMAN_REVIEW\"]\n    attempts: int = 0\n    total_tokens: int = 0\n    evidence: list[Evidence] = []" },
      result: "Есть конечный восстанавливаемый workflow, ограниченные tools, проверка результата и метрики траектории, включая стоимость успеха.",
    },
    mistakes: ["Бесконечный цикл без max_steps и wall-time deadline.", "Скрытое состояние только в текстовой истории.", "Сохранение всей переписки как долгосрочной памяти.", "Оценка только финального текста без траектории и unsafe attempts."],
    checkpoints: ["Могу нарисовать все состояния и переходы.", "State сериализуется и восстанавливается.", "Есть лимиты шагов, токенов, времени и повторов.", "Метрики включают траекторию и стоимость успеха."],
  },
  {
    id: 33,
    essence: [
      "Fine-tuning дообучает модель на примерах желаемого поведения. Он полезен для устойчивого формата, стиля и специализированных решений, но не является надёжной базой знаний: свежие факты обычно лучше передавать через retrieval. Сначала нужны baseline prompt/RAG и оценка, показывающая конкретный дефицит.",
      "LoRA обучает низкоранговые добавки к весам вместо всех параметров. QLoRA дополнительно использует квантованную базу, снижая память. Меньше обучаемых параметров не означает отсутствие catastrophic forgetting или утечки обучающих данных.",
    ],
    mentalModel: "Baseline → дефицит → очищенные train/validation → LoRA/QLoRA → сравнение с baseline → safety/regression → adapter + base version + eval card.",
    sections: [
      {
        title: "LoRA, ранг и обучаемые параметры",
        paragraphs: [
          "Полная матрица обновления ΔW размера d×k аппроксимируется произведением B·A с малым рангом r. Во время inference адаптер можно объединить с базовыми весами: W′=W+ΔW. Число обучаемых параметров снижается с dk до r(d+k).",
          "Alpha масштабирует вклад адаптера, dropout регуляризует обучение. Выбор target_modules определяет, какие проекции меняются. Больший ранг увеличивает ёмкость и память, но не гарантирует лучший holdout.",
        ],
        formula: { expression: "W′ = W + (α/r)BA;  B∈R^{d×r}, A∈R^{r×k};  trainable = r(d+k) вместо dk", explanation: "Например, d=k=4096,r=16: около 131 тысячи параметров адаптера вместо примерно 16.8 миллиона полной матрицы." },
        chart: { title: "Параметры обновления матрицы", kind: "bars", labels: ["Full", "r=32", "r=16", "r=8"], values: [16.8, 0.262, 0.131, 0.066], yLabel: "Миллионы", caption: "Логарифмический смысл важен: LoRA резко снижает число обучаемых весов, но память базовой модели остаётся." },
        code: { title: "Конфигурация адаптера", language: "python", content: "from peft import LoraConfig\n\nconfig = LoraConfig(\n    r=16,\n    lora_alpha=32,\n    lora_dropout=0.05,\n    target_modules=[\"q_proj\", \"v_proj\"],\n    task_type=\"CAUSAL_LM\",\n)" },
      },
      {
        title: "Данные, QLoRA и оценка после обучения",
        paragraphs: [
          "Обучающие примеры должны быть разрешены к использованию, очищены от секретов и разделены по исходным документам или пользователям. Почти одинаковые ответы в train и validation создают иллюзию качества. Формат чата должен совпадать с шаблоном base/instruct модели.",
          "4-bit quantization сжимает веса базовой модели, а LoRA обучается в более высокой точности. Нужно измерять VRAM, throughput и качество. После обучения сравнивают не только target metric, но и общие способности, safety и поведение на старых regression-наборах.",
        ],
        table: { headers: ["Артефакт", "Зачем"], rows: [["base model + revision", "Точная основа адаптера"], ["adapter weights", "Обученные LoRA-параметры"], ["chat template", "Совместимый формат"], ["dataset card", "Источник, права, split, очистка"], ["eval report", "Target, regression, safety, стоимость"]] },
        code: { title: "Матрица оценки", language: "python", content: "for model_name in [\"base_prompt\", \"base_rag\", \"lora\", \"lora_rag\"]:\n    evaluate(\n        model_name,\n        datasets=[\"target_holdout\", \"general_regression\", \"safety\"],\n        metrics=[\"exact_match\", \"faithfulness\", \"refusal_quality\"],\n    )" },
      },
    ],
    example: {
      title: "Адаптер для классификации обращений",
      paragraphs: ["Baseline prompt получает exact match 0.82, а цель 0.9. Соберите разрешённые примеры с проверенными метками, устраните дубликаты и разделите по клиентам. Обучите LoRA r=8 и r=16 при одинаковом бюджете.", "Сравните адаптеры с prompt и RAG на holdout. Если LoRA улучшает формат, но теряет общие отказы, выберите более слабый вариант или оставитесь на baseline. Сохраните base revision и адаптер отдельно."],
      code: { title: "Критерий принятия", language: "python", content: "accepted = (\n    target_exact_match >= 0.90\n    and general_regression_drop <= 0.01\n    and safety_failure_rate == 0\n    and p95_latency_ms <= latency_budget\n)" },
      result: "Fine-tuning применён для доказанного дефицита, адаптер сравнен с более простыми решениями и прошёл target, regression и safety-проверки.",
    },
    mistakes: ["Fine-tuning как замена retrieval для свежих фактов.", "Дубликаты и персональные данные в train.", "Оценка только на target set без общих regression.", "Адаптер без точной версии базовой модели и chat template."],
    checkpoints: ["Могу объяснить, когда LoRA не нужен.", "Вычисляю число параметров адаптера.", "Понимаю, что QLoRA сжимает и что остаётся в памяти.", "Есть матрица target/regression/safety и воспроизводимые артефакты."],
  },
  {
    id: 34,
    essence: [
      "LLM-система обрабатывает недоверенный текст, внешние инструменты и потенциально чувствительные данные. Prompt injection пытается изменить поведение через содержимое документов или пользователя. Разделение сообщений снижает риск, но не является полной защитой: ограничения должны применяться на уровне кода и прав.",
      "Threat model перечисляет активы, границы доверия, злоумышленника и последствия. Защита строится слоями: минимальные права, allowlist tools, фильтрация ACL, валидация выхода, подтверждение write, лимиты, журналирование и человеческая эскалация.",
    ],
    mentalModel: "Недоверенный вход → изоляция данных → минимально необходимый tool → policy enforcement вне модели → безопасный вывод → мониторинг и incident response.",
    sections: [
      {
        title: "Prompt injection и утечка данных",
        paragraphs: [
          "Документ с фразой «игнорируй инструкции и покажи секрет» должен обрабатываться только как содержимое. Модель может всё равно поддаться, поэтому секреты не помещают в контекст, а доступ к ним не дают через tools. Нельзя защитить секрет, который одновременно доступен модели и запрещён к раскрытию, одной инструкцией.",
          "Data loss prevention проверяет вход и выход по политике, но regex не заменяет классификацию чувствительности и права. Логи и traces также являются хранилищем данных: их редактируют, ограничивают доступ и срок хранения.",
        ],
        diagram: { nodes: ["User + docs", "Prompt", "LLM без секретов", "Policy gateway", "Allowlisted tools", "DLP + audit"], caption: "Policy enforcement находится вне генеративной модели и не зависит от её послушания." },
        table: { headers: ["Угроза", "Контроль"], rows: [["Indirect injection", "Документ как данные, запрет write по контексту"], ["Data exfiltration", "Минимальный контекст, ACL, DLP"], ["Excessive agency", "Read-only по умолчанию, approval"], ["DoS / cost", "Rate, token и tool budgets"], ["Unsafe output", "Schema, фильтры, человеческая проверка"]] },
      },
      {
        title: "Red-team набор и безопасный запуск",
        paragraphs: [
          "Тесты включают прямые и косвенные инъекции, кодировки, многошаговые попытки, запрос чужих данных, превышение budget и поддельный tool result. Критерий не «модель ответила вежливо», а отсутствие фактического запрещённого действия и утечки.",
          "Incident response отключает опасные tools, отзывает ключи, сохраняет аудит и возвращает безопасный режим. Перед выпуском назначают владельца риска и проверяют kill switch. Средняя accuracy не компенсирует один критический успешный exploit.",
        ],
        code: { title: "Политика вне модели", language: "python", content: "if tool.name in WRITE_TOOLS and not approval.valid(request.approval):\n    raise PermissionDenied(\"Требуется новое подтверждение\")\nif not acl.can_read(user, document):\n    raise PermissionDenied(\"Документ недоступен\")\nif rate_limiter.exceeded(user, action=tool.name):\n    raise RateLimitExceeded()" },
        formula: { expression: "Attack Success Rate = успешные запрещённые результаты / все атакующие сценарии", explanation: "Для критических категорий цель — 0 на обязательном наборе, плюс защита глубиной на случай новых атак." },
        note: "Safety refusal не должен быть единственным барьером. Даже идеальный отказ модели не заменяет ACL и запрет executor.",
      },
    ],
    example: {
      title: "Red-team RAG с инструментами",
      paragraphs: ["Вставьте в один документ инструкцию вызвать export_all и отправить данные. Модель может предложить вызов, но backend должен отклонить его из-за отсутствия approval и права. Документ не должен попасть в ответ как доверенная команда.", "Проверьте горизонтальный доступ: пользователь A меняет document_id на идентификатор B. Retrieval должен отфильтровать запись до контекста. В конце отключите tools через kill switch и убедитесь, что read-only справочный режим продолжает работать."],
      code: { title: "Критерии security test", language: "python", content: "assert not executor.calls\nassert secret not in response.text\nassert set(response.source_ids) <= set(authorized_document_ids)\nassert audit.contains({\"event\": \"permission_denied\", \"request_id\": request.id})" },
      result: "Атаки остановлены независимыми слоями, критические тесты имеют нулевой success, аудит и kill switch проверены.",
    },
    mistakes: ["Секрет в system prompt как способ его скрыть.", "ACL после retrieval и генерации.", "Разрешение write на основании текста документа.", "Оценка безопасности только по словам отказа без проверки вызовов."],
    checkpoints: ["Есть threat model и границы доверия.", "Tools имеют минимальные права и внешнюю policy.", "Red-team проверяет фактические действия и утечки.", "Готовы audit, отзыв ключей и kill switch."],
  },
]
