import type { LessonGuide } from "./types"

export const dlAdvancedGuides: LessonGuide[] = [
  {
    id: 21,
    essence: [
      "Computer Vision преобразует пиксели в признаки. Свёртка применяет один небольшой фильтр по пространственным позициям, уменьшая число параметров и используя локальность изображения. Глубокие слои комбинируют простые детекторы в более абстрактные представления.",
      "Transfer learning начинает с модели, обученной на большом наборе. Backbone извлекает признаки, новая классификационная голова учится под вашу задачу. Сначала можно заморозить backbone, затем постепенно разморозить последние блоки с меньшим learning rate.",
    ],
    mentalModel: "Изображение → нормализация и augmentation → CNN backbone → embedding → classifier → logits. Обучаем сначала голову, затем аккуратно часть backbone.",
    sections: [
      {
        title: "Свёртка, каналы и размер выхода",
        paragraphs: [
          "Фильтр имеет форму [out_channels,in_channels,kH,kW]. Один фильтр производит одну выходную карту признаков, а весь набор — out_channels карт. Padding сохраняет пространственный размер, stride уменьшает его, pooling или свёртка со stride агрегирует neighbourhood.",
          "Для квадратного входа размер выхода зависит от kernel K, padding P, stride S и dilation D. Проверка формы особенно важна перед flatten: неправильный порядок NCHW/NHWC может остаться незамеченным до полносвязного слоя.",
        ],
        formula: { expression: "H_out = floor((H + 2P − D(K−1) − 1)/S + 1);  параметров фильтра = C_out·C_in·K·K + C_out", explanation: "Последнее слагаемое — bias на каждый выходной канал. При K=3,P=1,S=1,D=1 размер сохраняется." },
        diagram: { nodes: ["[B,3,224,224]", "Conv 3→32", "ReLU + pooling", "Conv 32→64", "Global pooling", "Classifier"], caption: "Пространственный размер обычно уменьшается, а число каналов растёт." },
        code: { title: "Проверка формы свёртки", language: "python", content: "layer = torch.nn.Conv2d(3, 32, kernel_size=3, padding=1)\nx = torch.randn(8, 3, 224, 224)\ny = layer(x)\nassert y.shape == (8, 32, 224, 224)" },
      },
      {
        title: "Augmentation и fine-tuning",
        paragraphs: [
          "Augmentation применяется только к train и должна сохранять смысл метки. Горизонтальное отражение естественно для многих объектов, но меняет смысл дорожных знаков или текста. Validation и test используют детерминированный resize и нормализацию.",
          "Нормализация должна соответствовать pretrained backbone. При заморозке backbone переводят в eval, чтобы BatchNorm не обновлял статистики. При разморозке используют discriminative learning rates: новая голова обучается быстрее, предобученные слои медленнее.",
        ],
        code: { title: "Разные learning rates", language: "python", content: "for parameter in model.backbone.parameters():\n    parameter.requires_grad = False\noptimizer = torch.optim.AdamW(model.head.parameters(), lr=1e-3)\n# После обучения головы разморозьте последний блок и используйте lr=1e-5" },
        table: { headers: ["Размер данных", "Стартовая стратегия"], rows: [["Очень мало", "Заморозить backbone, сильная проверка overfit"], ["Средне", "Голова + постепенная разморозка"], ["Много и домен похож", "Fine-tuning большей части"], ["Домен сильно другой", "Проверить preprocessing и более ранние слои"]] },
      },
    ],
    example: {
      title: "Классификатор дефектов на маленьком наборе",
      paragraphs: ["Сформируйте split по партиям производства, чтобы почти одинаковые кадры не попали в train и test. Используйте pretrained ResNet, замените голову на число классов, обучайте сначала только её.", "Сравните с baseline по простым признакам, постройте confusion matrix и просмотрите все FP/FN. Затем разморозьте последний блок и проверьте, даёт ли он устойчивое улучшение на нескольких запусках."],
      code: { title: "Детерминированный validation transform", language: "python", content: "valid_transform = transforms.Compose([\n    transforms.Resize((224, 224)),\n    transforms.ToTensor(),\n    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),\n])" },
      result: "Модель сравнивается с baseline, изображения разделены по независимым группам, transfer learning улучшает результат без утечки похожих кадров.",
    },
    mistakes: ["Случайный split почти дублирующих кадров.", "Augmentation, меняющая смысл класса.", "Другая нормализация относительно pretrained модели.", "Разморозка всей сети с большим LR на крошечном наборе."],
    checkpoints: ["Вычисляю форму выхода свёртки.", "Объясняю каналы и число параметров.", "Выбираю augmentation по смыслу данных.", "Провожу поэтапный fine-tuning и анализирую ошибки визуально."],
  },
  {
    id: 22,
    essence: [
      "NLP преобразует текст в последовательность токенов, а embedding отображает токен или фрагмент в числовой вектор. Токен не обязан быть словом: subword-модели разбивают редкие слова на части и ограничивают размер словаря.",
      "Embedding хранит распределённые признаки: близкие по использованию элементы могут иметь близкие векторы, но направление нельзя всегда интерпретировать как отдельное человеческое свойство. Косинусная близость сравнивает угол, евклидово расстояние — длину и направление.",
    ],
    mentalModel: "Текст → tokenizer → token IDs + attention mask → embedding [B,T,D] → pooling/модель → представление для классификации или поиска.",
    sections: [
      {
        title: "Токенизация, padding и attention mask",
        paragraphs: [
          "Tokenizer возвращает input_ids и attention_mask. Padding выравнивает длину последовательностей в батче, а mask сообщает модели, какие позиции настоящие. Truncation ограничивает длину и может удалить важный конец документа, поэтому стратегия усечения должна быть осознанной.",
          "OOV для subword почти исчезает, но стоимость последовательности остаётся. Нужно измерять распределение токенов на реальных документах, а не считать символы или слова приблизительным эквивалентом.",
        ],
        code: { title: "Батч токенов", language: "python", content: "batch = tokenizer(\n    texts,\n    padding=True,\n    truncation=True,\n    max_length=512,\n    return_tensors=\"pt\",\n)\nassert batch[\"input_ids\"].shape == batch[\"attention_mask\"].shape" },
        table: { headers: ["Элемент", "Назначение"], rows: [["input_ids", "Индексы токенов словаря"], ["attention_mask", "1 для реального токена, 0 для padding"], ["token_type_ids", "Разделение сегментов у некоторых моделей"], ["special tokens", "Начало, разделитель, конец по правилам модели"]] },
      },
      {
        title: "Сходство и pooling",
        paragraphs: [
          "Word embedding имеет форму [vocab,D], а после lookup батч становится [B,T,D]. Для получения одного вектора последовательности применяют CLS, mean pooling или специальную pooling-голову. Mean pooling должен усреднять только реальные токены с учётом mask.",
          "Косинус равен скалярному произведению нормированных векторов. Для него сначала нормализуют embeddings, затем матричное умножение даёт попарное сходство. Близость не означает одинаковый смысл во всех контекстах и проверяется на размеченных парах.",
        ],
        formula: { expression: "cos(a,b) = (a·b)/(||a||₂·||b||₂);  mean_pool = Σ(maskₜ·hₜ)/Σmaskₜ", explanation: "Для нулевого вектора косинус не определён; численная реализация добавляет маленький ε к норме." },
        diagram: { nodes: ["Текст", "Token IDs [B,T]", "Embeddings [B,T,D]", "Masked pooling [B,D]", "Normalize", "Similarity matrix"], caption: "Нормализация превращает dot product в косинусное сходство." },
        code: { title: "Косинусное сходство", language: "python", content: "a = torch.nn.functional.normalize(vector_a, dim=-1)\nb = torch.nn.functional.normalize(vector_b, dim=-1)\nsimilarity = a @ b.T\nbest_match = similarity.argmax(dim=-1)" },
      },
    ],
    example: {
      title: "Семантический поиск по вопросам поддержки",
      paragraphs: ["Разметьте 50–100 пар вопросов: релевантные, частично похожие и разные. Сравните embeddings с keyword-поиском по Recall@5. Проверьте синонимы, опечатки и случаи, где общие слова создают ложную близость.", "Сохраните модель tokenizer и pooling-конфигурацию вместе с индексом. Если при обучении использовался CLS, а в inference mean pooling, поисковые векторы окажутся в другом пространстве."],
      code: { title: "Recall@k", language: "python", content: "def recall_at_k(ranked_relevance: list[list[bool]], k: int) -> float:\n    hits = [any(row[:k]) for row in ranked_relevance]\n    return sum(hits) / len(hits)" },
      result: "Поиск имеет воспроизводимый tokenizer/pooling, нормированные векторы и численную оценку на сложных парах, а не только красивую демонстрацию.",
    },
    mistakes: ["Оценка длины документа словами вместо токенов.", "Mean pooling по padding без attention mask.", "Разные embedding-модели для индекса и запроса.", "Вывод о качестве по нескольким удачным примерам без Recall@k."],
    checkpoints: ["Объясняю IDs, padding, truncation и mask.", "Записываю форму embeddings батча.", "Вычисляю cosine и masked pooling.", "Сравниваю поиск с keyword baseline на размеченных парах."],
  },
  {
    id: 23,
    essence: [
      "Transformer обрабатывает последовательность через self-attention, позиционную информацию, feed-forward слои, residual connections и normalization. Attention позволяет каждому токену взвесить другие токены по их релевантности вместо передачи всей информации через одно рекуррентное состояние.",
      "Queries, Keys и Values получаются линейными проекциями одного представления. Сходство QK определяет веса по V. Масштабирование на √dₖ не даёт большим скалярным произведениям загонять softmax в области маленьких градиентов. Multi-head attention выполняет несколько таких проекций параллельно.",
    ],
    mentalModel: "Tokens + positions → Q,K,V → scaled scores → mask → softmax weights → weighted V → concat heads → residual + FFN → следующий блок.",
    sections: [
      {
        title: "Scaled dot-product attention",
        paragraphs: [
          "Q и K имеют размерность dₖ, V — dᵥ. Матрица scores имеет [B,heads,T,T]: каждый запрос-токен получает оценку каждого ключ-токена. При autoregressive decoding causal mask запрещает смотреть вперёд, attention mask дополнительно убирает padding.",
          "Softmax выполняется по последнему измерению ключей, не по запросам. Веса каждой строки суммируются в 1. После умножения на V получаем [B,heads,T,dᵥ], heads объединяются и проецируются обратно в размер модели.",
        ],
        formula: { expression: "Attention(Q,K,V) = softmax(QKᵀ/√dₖ + mask)V", explanation: "Большое отрицательное значение mask до softmax делает соответствующие веса почти нулевыми." },
        diagram: { nodes: ["Q [B,T,d]", "K [B,T,d]", "Scores [B,T,T]", "Mask + softmax", "Weights × V", "Context [B,T,d]"], caption: "Для каждого токена формируется взвешенная смесь значений всей разрешённой последовательности." },
        code: { title: "Устойчивый attention", language: "python", content: "scores = Q @ K.transpose(-2, -1) / math.sqrt(d_k)\nscores = scores.masked_fill(mask == 0, float(\"-inf\"))\nweights = torch.softmax(scores, dim=-1)\ncontext = weights @ V" },
      },
      {
        title: "Позиции, residual и стоимость",
        paragraphs: [
          "Self-attention сам по себе не знает порядок: перестановка токенов переставит и результаты. Позиционные embeddings или относительные механизмы вроде RoPE возвращают информацию о позиции. Residual connection облегчает прохождение градиента, normalization стабилизирует распределения.",
          "Стандартное attention требует O(T²) памяти для scores и O(T²d) вычислений, поэтому длинный контекст дорог. На практике применяют ограничение контекста, efficient attention, KV cache при генерации и сжатие документов.",
        ],
        formula: { expression: "FFN(x)=W₂·activation(W₁x+b₁)+b₂;  память scores ∝ B·H·T²", explanation: "B — batch, H — число голов. Удвоение длины даёт примерно четырёхкратную матрицу attention." },
        chart: { title: "Рост матрицы attention", kind: "line", labels: ["128", "256", "512", "1024"], values: [1, 4, 16, 64], yLabel: "Относительная память", caption: "При увеличении T вдвое число элементов scores увеличивается вчетверо." },
        table: { headers: ["Компонент", "Роль"], rows: [["Multi-head attention", "Разные подпространства связей"], ["Residual", "Путь для сигнала и градиента"], ["LayerNorm", "Стабилизация активаций"], ["FFN", "Нелинейное преобразование каждой позиции"], ["Position/RoPE", "Информация о порядке"]] },
      },
    ],
    example: {
      title: "Attention для одной короткой фразы",
      paragraphs: ["Возьмите T=4, dₖ=2 и задайте небольшие Q,K,V. Вычислите QKᵀ, поделите на √2, примените causal mask и softmax. Для первой позиции вес только на себе равен 1, для последующих распределение включает прошлое.", "Проверьте, что каждая строка весов суммируется в 1, а будущие позиции имеют нулевой вес после softmax. Затем сравните результат с torch.nn.functional.scaled_dot_product_attention."],
      code: { title: "Проверки весов", language: "python", content: "assert torch.allclose(weights.sum(dim=-1), torch.ones_like(weights.sum(dim=-1)), atol=1e-6)\ncausal = torch.triu(torch.ones(T, T, dtype=torch.bool), diagonal=1)\nassert weights.masked_select(causal).abs().max() < 1e-6" },
      result: "Вы можете вычислить attention вручную, объяснить каждую размерность и доказать корректность causal mask и нормировки.",
    },
    mistakes: ["Softmax по неверной оси.", "Отсутствие масштабирования на √dₖ.", "Маска после softmax вместо добавления к scores до него.", "Игнорирование O(T²) стоимости при увеличении контекста."],
    checkpoints: ["Записываю формы Q,K,V,scores и context.", "Вычисляю scaled attention для короткого примера.", "Объясняю mask, heads, residual и позиции.", "Оцениваю память attention при росте длины."],
  },
  {
    id: 24,
    essence: [
      "Завершённый DL-проект объединяет данные, baseline, обучение, анализ ошибок и inference в один воспроизводимый продукт. Ценность создаёт не сложность архитектуры, а доказанное качество на независимых данных и понятный способ использовать модель.",
      "Финальный артефакт включает конфигурацию, preprocessing, веса, метрики, model card, ограничения и демонстрацию. Отдельно документируются вычислительные требования, лицензии данных и сценарии, в которых модель не должна применяться.",
    ],
    mentalModel: "Задача → данные и split → простой baseline → обучение → ошибки → лучший checkpoint → оптимизация inference → демо и model card.",
    sections: [
      {
        title: "От эксперимента к пакету модели",
        paragraphs: [
          "Код обучения отделяется от кода inference, но обе части используют одну конфигурацию преобразований. Экспорт фиксирует архитектуру, state_dict, классы, normalization и версии библиотек. Загрузка в чистом процессе должна дать идентичный результат на золотом батче.",
          "Для ускорения измеряют latency до оптимизации, затем проверяют batch inference, mixed precision, TorchScript/ONNX или quantization там, где это поддерживается. Любое ускорение сравнивают по качеству и численным расхождениям.",
        ],
        diagram: { nodes: ["Train config", "Best checkpoint", "Export + preprocessing", "Golden batch", "Inference service/demo", "Model card"], caption: "Экспорт считается готовым только после проверки в новом окружении." },
        table: { headers: ["Артефакт", "Минимальное содержание"], rows: [["weights.pt / ONNX", "Веса и архитектура"], ["preprocess.json", "Resize, normalization, tokenizer"], ["metrics.json", "Test, сегменты, latency, hardware"], ["model-card.md", "Назначение, данные, ограничения"], ["demo", "Нормальный и ошибочный сценарии"]] },
      },
      {
        title: "Анализ ошибок и защита проекта",
        paragraphs: [
          "Ошибки разбивают по причинам: неверная разметка, неоднозначность, нехватка данных, сдвиг домена, ограничение модели. Случайный просмотр нескольких картинок или текстов не заменяет стратифицированную выборку самых уверенных ошибок и представителей сегментов.",
          "На защите сначала показывают задачу и baseline, затем честную метрику, одну содержательную ошибку и компромисс стоимости/качества. Не следует скрывать ограничения: умение назвать их показывает инженерную зрелость.",
        ],
        formula: { expression: "throughput = число примеров / секунды;  p95 = задержка, ниже которой 95% запросов", explanation: "Средняя latency скрывает хвост. В отчёт включают p50, p95, p99 и условия замера." },
        chart: { title: "Задержка inference по batch size", kind: "bars", labels: ["1", "4", "8", "16"], values: [18, 32, 51, 88], yLabel: "мс на батч", caption: "Батч растит время одного батча, но может увеличивать throughput; обе метрики нужны." },
      },
    ],
    example: {
      title: "Финальная проверка перед публикацией",
      paragraphs: ["Создайте новую виртуальную среду, установите зависимости из lock/requirements, загрузите модель и запустите golden batch. Сверьте предсказания и метрики с сохранёнными. Затем выполните демо на данных, которых не было в разработке.", "Подготовьте короткое видео или интерактивное демо, но обязательно добавьте текстовый запуск. Репозиторий должен позволять проверить проект без доступа к вашему компьютеру и скрытым файлам."],
      code: { title: "Smoke test артефакта", language: "bash", content: "python -m venv .venv-check\n# Активировать окружение и установить зависимости\npython -m pytest tests/test_inference.py\npython predict.py --input examples/sample.json\npython evaluate.py --checkpoint artifacts/best.pt --data data/test" },
      result: "Проект воспроизводится в чистой среде, качество и скорость измерены, ошибки разобраны, демо и model card соответствуют реальному поведению.",
    },
    mistakes: ["Публикация весов без preprocessing и списка классов.", "Демо на обучающих примерах.", "Оптимизация latency без контроля качества.", "README без ограничений, лицензий и аппаратных требований."],
    checkpoints: ["Чистая установка и golden batch проходят.", "Есть baseline, test и анализ ошибок по причинам.", "Задержка и throughput измерены на указанном железе.", "Model card честно описывает назначение и ограничения."],
  },
]
