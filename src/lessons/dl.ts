import type { LessonGuide } from "./types"

export const dlGuides: LessonGuide[] = [
  {
    id: 17,
    essence: [
      "Тензор — многомерный массив с формой, типом данных и устройством хранения. Скаляр имеет rank 0, вектор — rank 1, матрица — rank 2, батч изображений обычно rank 4. В PyTorch операции выполняются над совместимыми формами, а вычисления могут происходить на CPU или GPU.",
      "Autograd строит динамический граф операций с тензорами, у которых requires_grad=True. Вызов backward вычисляет градиенты по цепному правилу и накапливает их в .grad. Градиенты нужно обнулять перед следующим шагом, а при inference отключать граф через torch.no_grad или inference_mode.",
    ],
    mentalModel: "X, параметры → операции → computation graph → скалярный loss → backward → .grad для каждого обучаемого параметра.",
    sections: [
      {
        title: "Формы, broadcasting и устройства",
        paragraphs: [
          "Форма [batch, channels, height, width] для изображений означает, что первое измерение перечисляет примеры, а не признаки одного объекта. Ошибка matmul часто связана с перестановкой измерений. Перед операцией полезно записать формы на бумаге и проверить результат.",
          "Broadcasting расширяет измерения размера 1 по правилам справа налево, но не угадывает смысл. Например, [32,10] + [10] добавляет смещение к каждому примеру. Tensor.to(device) переносит данные; модель и батч должны находиться на одном устройстве.",
        ],
        table: { headers: ["Объект", "Пример формы", "Смысл"], rows: [["Батч табличных данных", "[B, F]", "B объектов, F признаков"], ["Изображения NCHW", "[B, C, H, W]", "Каналы, высота, ширина"], ["Последовательность", "[B, T, D]", "T токенов, D признаков"], ["Logits классификации", "[B, K]", "K оценок на объект"]] },
        code: { title: "Явная проверка форм", language: "python", content: "import torch\n\nX = torch.randn(32, 20, device=device)\nW = torch.randn(20, 10, device=device)\nb = torch.zeros(10, device=device)\nlogits = X @ W + b\nassert logits.shape == (32, 10)" },
      },
      {
        title: "Цепное правило и накопление градиентов",
        paragraphs: [
          "Если z=f(x), y=g(z), то dy/dx=(dy/dz)(dz/dx). Autograd применяет это правило в обратном порядке от loss к параметрам. Локальная производная каждой операции умножается на градиент, пришедший сверху.",
          "Метод .item() извлекает Python-число из скалярного тензора и отсоединяет его от графа. .detach() создаёт тензор без истории, а .clone() копирует данные. Эти операции имеют разное назначение и не должны использоваться как универсальное исправление ошибок autograd.",
        ],
        formula: { expression: "y = g(f(x))  ⇒  ∂y/∂x = (∂g/∂f)·(∂f/∂x)", explanation: "Для векторов локальные производные — матрицы Якоби, а backward выполняет vector-Jacobian product." },
        diagram: { nodes: ["x: requires_grad", "z = x·w + b", "ŷ = activation(z)", "loss = L(ŷ,y)", "backward → w.grad, b.grad"], caption: "Граф строится при forward и используется в обратном направлении при backward." },
        code: { title: "Минимальный autograd", language: "python", content: "x = torch.tensor([2.0], requires_grad=True)\nw = torch.tensor([3.0], requires_grad=True)\nloss = (x * w - 10) ** 2\nloss.backward()\nassert x.grad.item() == -24.0\nassert w.grad.item() == -16.0" },
      },
    ],
    example: {
      title: "Градиент квадратичной ошибки вручную",
      paragraphs: ["Для x=2, w=3 предсказание равно 6, ошибка −4, loss=16. Производная по w равна 2(6−10)·x=−16, а производная по x равна 2(6−10)·w=−24. Именно эти значения должен записать autograd.", "Правильный рабочий метод — сначала записать формулу, затем вычислить каждую производную, после чего сверить с autograd. Если код и ручной расчёт разошлись, не меняйте ожидание автоматически: проверьте начальные значения и арифметику."],
      code: { title: "Самопроверка без жёстко записанного ответа", language: "python", content: "prediction = x * w\nexpected_w_grad = 2 * (prediction.detach() - 10) * x.detach()\nexpected_x_grad = 2 * (prediction.detach() - 10) * w.detach()\nassert torch.allclose(w.grad, expected_w_grad)\nassert torch.allclose(x.grad, expected_x_grad)" },
      result: "Вы можете связать форму каждого тензора с операцией, вывести два градиента и подтвердить их автоматическим дифференцированием.",
    },
    mistakes: ["Смешивание CPU и CUDA тензоров в одной операции.", "Неверная размерность батча при matmul или loss.", "Отсутствие optimizer.zero_grad и суммирование градиентов между батчами.", "Построение графа на inference и лишний расход памяти."],
    checkpoints: ["Записываю форму входа, выхода и параметров каждого слоя.", "Объясняю broadcasting на конкретных размерностях.", "Вывожу градиент небольшой функции вручную.", "Понимаю zero_grad, detach и no_grad."],
  },
  {
    id: 18,
    essence: [
      "Нейросеть компонует линейные преобразования и нелинейности. Без activation несколько слоёв схлопываются в одно линейное преобразование. ReLU оставляет положительные значения и зануляет отрицательные, sigmoid подходит для вероятности бинарного выхода, softmax преобразует logits многоклассового выхода.",
      "Backpropagation вычисляет градиенты всех параметров от выхода к входу. Forward сохраняет промежуточные значения, backward использует их и локальные производные. Реализация с нуля помогает увидеть размерности и знаки, после чего PyTorch становится не магией, а автоматизацией понятного процесса.",
    ],
    mentalModel: "X → z¹=XW¹+b¹ → a¹=ReLU(z¹) → z²=a¹W²+b² → loss → dW²,db² → da¹ → dW¹,db¹.",
    sections: [
      {
        title: "Forward pass и функции активации",
        paragraphs: [
          "Для батча X формы [B,D] и W¹ формы [D,H] скрытое состояние имеет [B,H]. Смещение b¹ формы [H] добавляется по broadcasting. Второй слой отображает H в K классов, сохраняя измерение батча.",
          "Softmax вычисляют со сдвигом на максимум по классам, чтобы exp не переполнялась. В PyTorch CrossEntropyLoss принимает сырые logits и сам включает log_softmax, поэтому явный softmax перед loss избыточен.",
        ],
        formula: { expression: "ReLU(z)=max(0,z);  softmax(zₖ)=e^{zₖ−max(z)}/Σⱼe^{zⱼ−max(z)}", explanation: "Сдвиг на max не меняет вероятности, но делает вычисление численно устойчивым." },
        code: { title: "Двухслойный forward", language: "python", content: "z1 = X @ W1 + b1\na1 = np.maximum(z1, 0)\nlogits = a1 @ W2 + b2\nstable = logits - logits.max(axis=1, keepdims=True)\nprobability = np.exp(stable) / np.exp(stable).sum(axis=1, keepdims=True)" },
      },
      {
        title: "Backward pass по цепному правилу",
        paragraphs: [
          "Для softmax и cross-entropy в стандартной комбинации градиент по logits равен (p−one_hot(y))/B. Деление на B соответствует усреднению loss по батчу. Затем dW2=a1ᵀ·dlogits, da1=dlogits·W2ᵀ.",
          "Градиент ReLU равен нулю для z≤0 и единице для z>0. Поэтому dz1=da1·(z1>0). После получения dW1 и db1 выполняют один шаг SGD. Численная проверка градиента на маленькой сети обязательна перед масштабированием.",
        ],
        formula: { expression: "dL/dlogits = (p − y_onehot)/B;  dW² = (a¹)ᵀ·dlogits;  dz¹ = (dlogits·(W²)ᵀ)⊙1[z¹>0]", explanation: "⊙ — поэлементное умножение. Проверяйте формы: dW² [H,K], dz¹ [B,H]." },
        diagram: { nodes: ["dLoss", "dLogits [B,K]", "dW² и dA¹", "dZ¹ через ReLU", "dW¹ и db¹"], caption: "Обратный проход повторяет граф forward в противоположном порядке." },
        code: { title: "Обновление после backward", language: "python", content: "dlogits = (probability - targets) / batch_size\ndW2 = a1.T @ dlogits\ndb2 = dlogits.sum(axis=0)\nda1 = dlogits @ W2.T\ndz1 = da1 * (z1 > 0)\ndW1 = X.T @ dz1\ndb1 = dz1.sum(axis=0)" },
      },
    ],
    example: {
      title: "Маленькая сеть для XOR",
      paragraphs: ["XOR не разделяется одной прямой: классы (0,0),(1,1) против (0,1),(1,0). Скрытый слой с нелинейностью преобразует пространство так, что выходной слой может разделить примеры.", "Обучите сеть на крошечном наборе, постройте loss и проверьте предсказания всех четырёх точек. Затем уберите ReLU: даже после обучения композиция останется линейной и не решит XOR в общем случае."],
      code: { title: "Численный градиент для проверки", language: "python", content: "def numeric_gradient(parameter, loss_function, epsilon=1e-5):\n    gradient = np.zeros_like(parameter)\n    for index in np.ndindex(parameter.shape):\n        old = parameter[index]\n        parameter[index] = old + epsilon\n        plus = loss_function()\n        parameter[index] = old - epsilon\n        minus = loss_function()\n        parameter[index] = old\n        gradient[index] = (plus - minus) / (2 * epsilon)\n    return gradient" },
      result: "Forward и backward реализованы с явными формами, аналитические градиенты совпадают с численными, а роль нелинейности подтверждена экспериментом.",
    },
    mistakes: ["Softmax перед CrossEntropyLoss.", "Потеря деления на batch size в dlogits.", "Неверная ось суммирования softmax или db.", "Обучение на полном наборе до проверки градиентов на маленьком примере."],
    checkpoints: ["Записываю формы всех промежуточных тензоров.", "Объясняю, зачем нужна нелинейность.", "Вывожу backward для двух слоёв.", "Сравниваю аналитический и численный градиент."],
  },
  {
    id: 19,
    essence: [
      "Training loop повторяет загрузку батча, forward, loss, обнуление градиентов, backward и обновление параметров. Валидация использует model.eval() и отключённый граф, но не выполняет optimizer.step. Переключение train/eval влияет на Dropout и BatchNorm.",
      "Воспроизводимый цикл хранит конфигурацию, seed, лучшее состояние по validation и историю метрик. Accuracy и loss измеряются средневзвешенно по числу примеров, а не как простое среднее батчей, если последний батч меньше остальных.",
    ],
    mentalModel: "for epoch → train batches → optimizer → eval batches без градиентов → средние метрики → сохранить лучший state_dict → scheduler/checkpoint.",
    sections: [
      {
        title: "Правильный порядок одного батча",
        paragraphs: [
          "optimizer.zero_grad(set_to_none=True) очищает старые градиенты. logits=model(X) выполняет forward, loss=criterion(logits,y) создаёт скаляр, loss.backward() вычисляет градиенты, optimizer.step() обновляет параметры.",
          "Для CrossEntropyLoss logits имеют [B,K], а y — целочисленные индексы классов [B], не one-hot [B,K]. При смешанной точности backward и шаг оборачивают в GradScaler, а Gradient clipping ограничивает норму при взрыве градиентов.",
        ],
        code: { title: "Один обучающий батч", language: "python", content: "model.train()\nfor X, y in train_loader:\n    X, y = X.to(device), y.to(device)\n    optimizer.zero_grad(set_to_none=True)\n    logits = model(X)\n    loss = criterion(logits, y)\n    loss.backward()\n    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\n    optimizer.step()" },
        formula: { expression: "epoch_loss = Σ(batch_loss_b·batch_size_b) / Σbatch_size_b", explanation: "Такой расчёт корректен и для последнего неполного батча." },
      },
      {
        title: "Валидация, checkpoint и ранняя остановка",
        paragraphs: [
          "model.eval() отключает Dropout и переводит BatchNorm на накопленные статистики. torch.inference_mode() предотвращает построение графа. Валидационный loss сравнивают между эпохами и сохраняют state_dict лучшей модели, а не обязательно последней.",
          "Checkpoint для продолжения обучения включает модель, optimizer, scheduler, epoch, scaler и генераторы случайности. Для inference достаточно model.state_dict плюс архитектура и preprocessing. Эти два сценария не следует смешивать.",
        ],
        diagram: { nodes: ["Train epoch", "Validation", "Metric улучшилась?", "Сохранить best.pt", "Patience или следующая эпоха"], caption: "Best checkpoint выбирается по заранее заданной validation-метрике." },
        chart: { title: "История обучения", kind: "line", labels: ["1", "2", "3", "4", "5"], values: [1.8, 1.15, 0.82, 0.69, 0.64], yLabel: "Validation loss", caption: "Сохраняйте лучший результат; если несколько эпох подряд нет улучшения, срабатывает early stopping." },
        code: { title: "Сохранение лучшей модели", language: "python", content: "if valid_loss < best_loss:\n    best_loss = valid_loss\n    torch.save({\n        \"model\": model.state_dict(),\n        \"config\": config,\n        \"epoch\": epoch,\n    }, \"best.pt\")" },
      },
    ],
    example: {
      title: "Воспроизводимый эксперимент FashionMNIST",
      paragraphs: ["Зафиксируйте train/validation/test, seed и конфигурацию. Обучите небольшую MLP, сохраняйте train loss, validation loss и accuracy каждой эпохи. Проверьте, что validation не вызывает backward и step.", "После обучения загрузите best.pt в новый процесс и сравните предсказания на фиксированном батче. Затем оцените test один раз и сохраните отчёт."],
      code: { title: "Средняя метрика по примерам", language: "python", content: "total_loss += loss.item() * y.size(0)\ncorrect += (logits.argmax(dim=1) == y).sum().item()\ncount += y.size(0)\n# После цикла: mean_loss = total_loss / count; accuracy = correct / count" },
      result: "Цикл корректно переключает режимы, сохраняет лучшее состояние и восстанавливает идентичные предсказания в новом процессе.",
    },
    mistakes: ["optimizer.step до backward или отсутствие zero_grad.", "model.eval во время обучения и model.train на валидации.", "Среднее loss батчей без учёта размера последнего батча.", "Сохранение только последней эпохи независимо от validation."],
    checkpoints: ["Могу перечислить порядок операций батча по памяти.", "Понимаю train/eval и no_grad/inference_mode.", "Считаю метрики по числу примеров.", "Восстанавливаю лучший checkpoint и повторяю inference."],
  },
  {
    id: 20,
    essence: [
      "Оптимизатор выбирает способ обновления параметров, регуляризация ограничивает чрезмерную подгонку, а scheduler меняет learning rate во время обучения. Train loss постоянно снижается и при запоминании, поэтому переобучение диагностируют по разрыву с validation.",
      "Data augmentation увеличивает разнообразие входов, Dropout случайно зануляет часть активаций при обучении, weight decay штрафует большие веса, early stopping останавливает выбор по validation. Каждый метод меняет конкретное свойство и требует отдельного эксперимента.",
    ],
    mentalModel: "Смещение: train и validation плохие. Дисперсия: train хороший, validation хуже. Сначала диагноз, затем данные/емкость/регуляризация/оптимизация — по одному изменению.",
    sections: [
      {
        title: "SGD, momentum и Adam",
        paragraphs: [
          "Momentum накапливает направление прошлых градиентов и сглаживает колебания. Adam поддерживает скользящие оценки первого и второго моментов градиента и масштабирует шаг адаптивно. Это не гарантирует лучшую обобщающую способность: иногда SGD с хорошим scheduler даёт сильный результат.",
          "Learning rate остаётся ключевым параметром. Warmup постепенно увеличивает его в начале, cosine schedule плавно снижает. Сравнивать оптимизаторы нужно при сопоставимом бюджете и настройке, а не одним стандартным набором параметров.",
        ],
        formula: { expression: "mₜ=β₁mₜ₋₁+(1−β₁)gₜ; vₜ=β₂vₜ₋₁+(1−β₂)gₜ²; θₜ←θₜ₋₁−η·m̂ₜ/(√v̂ₜ+ε)", explanation: "m̂ и v̂ — оценки с bias correction. AdamW отделяет weight decay от адаптивного градиентного шага." },
        code: { title: "AdamW и scheduler", language: "python", content: "optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=1e-2)\nscheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)\n# optimizer.step() внутри батча; scheduler.step() после эпохи" },
      },
      {
        title: "Диагностика bias и variance",
        paragraphs: [
          "Недообучение проявляется высокой ошибкой и на train, и на validation. Возможные действия: увеличить ёмкость, улучшить признаки, дольше обучать или уменьшить чрезмерную регуляризацию. Переобучение требует другого набора действий.",
          "Кривые нужно сравнивать на одинаковых эпохах и метриках. Внезапный рост loss может означать численную нестабильность, а плато — слишком малый learning rate или ошибку в данных. Прежде чем менять архитектуру, проверьте способность модели переобучить 32 примера почти до нуля.",
        ],
        chart: { title: "Разрыв обобщения", kind: "line", labels: ["1", "3", "5", "7", "9"], values: [0.86, 0.67, 0.61, 0.64, 0.72], yLabel: "Validation loss", caption: "После пятой эпохи validation ухудшается: разумно вернуть лучший checkpoint и усилить контроль переобучения." },
        table: { headers: ["Наблюдение", "Гипотеза", "Следующий эксперимент"], rows: [["Train loss не падает", "Оптимизация/данные", "Переобучить 32 примера"], ["Train ↓, validation ↑", "Переобучение", "Augmentation, weight decay, меньше ёмкости"], ["Оба loss высокие", "Недообучение", "Ёмкость, features, дольше"], ["NaN", "Численная нестабильность", "LR, clipping, dtype, входные NaN"]] },
      },
    ],
    example: {
      title: "Контролируемое сравнение регуляризации",
      paragraphs: ["Возьмите одну архитектуру и split. Baseline обучается без augmentation и weight decay. Затем добавьте только augmentation, затем только weight decay, затем комбинацию. Сохраняйте лучшую validation-метрику и разрыв train/validation.", "Для каждого запуска используйте одинаковый бюджет и early stopping policy. Повторите лучшие два варианта с тремя seed, чтобы отличить устойчивый эффект от удачной инициализации."],
      code: { title: "Dropout только в train mode", language: "python", content: "class MLP(torch.nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.layers = torch.nn.Sequential(\n            torch.nn.Linear(784, 256), torch.nn.ReLU(),\n            torch.nn.Dropout(0.2), torch.nn.Linear(256, 10),\n        )" },
      result: "Есть таблица экспериментов с диагнозом, одним изменением за раз и выводом, подтверждённым несколькими seed.",
    },
    mistakes: ["Добавление пяти регуляризаций одновременно без контрольного эксперимента.", "Выбор последней эпохи при растущем validation loss.", "Вывод по одному seed.", "Попытка лечить ошибку разметки увеличением модели."],
    checkpoints: ["Различаю недообучение и переобучение по кривым.", "Объясняю momentum, AdamW и weight decay.", "Умею выполнить sanity check на 32 примерах.", "Сравниваю изменения по одинаковому протоколу и нескольким seed."],
  },
]
