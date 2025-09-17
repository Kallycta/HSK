# 🚀 Полное руководство по миграции на Yandex Cloud Functions

## 📋 Обзор

Это руководство поможет вам перенести ваш HSK Telegram Bot с текущего хостинга на **Yandex Cloud Functions** - serverless платформу, которая автоматически масштабируется и взимает плату только за фактическое использование.

## 🎯 Преимущества Cloud Functions

### ✅ Экономические преимущества
- **Оплата по факту**: Платите только за время выполнения функций
- **Бесплатный лимит**: 1 млн вызовов и 400,000 ГБ×сек в месяц бесплатно
- **Автомасштабирование**: Нет необходимости в постоянно работающих серверах

### ✅ Технические преимущества
- **Высокая доступность**: 99.95% SLA
- **Автоматические обновления**: Не нужно управлять инфраструктурой
- **Быстрое развертывание**: Деплой за секунды
- **Встроенный мониторинг**: Логи и метрики из коробки

### ✅ Операционные преимущества
- **Российская юрисдикция**: Соответствие требованиям 152-ФЗ
- **Техподдержка на русском языке**
- **Интеграция с другими сервисами Yandex Cloud**

## 📁 Созданные файлы для миграции

### 📄 Документация
- `yandex-cloud-functions-migration.md` - Подробное техническое руководство
- `CLOUD_FUNCTIONS_GUIDE.md` - Это руководство
- `QUICK_START_YANDEX.md` - Быстрый старт для Compute Cloud

### 🔧 Код функций
- `functions/api-handler.js` - Обработчик API запросов
- `functions/telegram-webhook.js` - Обработчик Telegram webhook
- `functions/package.json` - Зависимости для функций
- `functions/.yandexignore` - Исключения при деплое

### ⚙️ Конфигурация
- `api-gateway-spec.yaml` - Спецификация API Gateway
- `deploy-cloud-functions.ps1` - Скрипт автоматического деплоя
- `.github/workflows/deploy-cloud-functions.yml` - CI/CD pipeline

## 🚀 Быстрый старт (3 шага)

### Шаг 1: Подготовка Yandex Cloud

**📖 Подробное руководство**: См. файл <mcfile name="yandex-cloud-setup-detailed.md" path="C:\Users\user\Desktop\work\tg\tg_ch_app\HSK\yandex-cloud-setup-detailed.md"></mcfile> для пошаговых инструкций с интерфейсом веб-консоли.

**Краткий обзор:**
1. **Создайте аккаунт** в [Yandex Cloud](https://cloud.yandex.ru/) и активируйте его
2. **Создайте каталог** `hsk-telegram-bot` для проекта
3. **Создайте сервисный аккаунт** `hsk-bot-service-account` с ролями:
   - `serverless.functions.invoker`
   - `serverless.functions.admin`
   - `api-gateway.websockets.writer`
   - `logging.writer`
4. **Создайте и скачайте JSON ключ** для сервисного аккаунта
5. **Сохраните ID каталога и сервисного аккаунта** для следующих шагов

### Шаг 2: Настройка GitHub Secrets
⚠️ **ВАЖНО:** Без настройки Secrets деплой не будет работать! Yandex Cloud не подключается к Git автоматически.

Добавьте в настройки репозитория (Settings → Secrets and variables → Actions):

```
YC_SA_JSON_CREDENTIALS=<содержимое key.json>
YC_FOLDER_ID=<ID каталога>
YC_SERVICE_ACCOUNT_ID=<ID сервисного аккаунта>
TELEGRAM_BOT_TOKEN=<токен бота>
API_KEY=<ваш API ключ>
REQUIRED_CHANNELS=<список каналов через запятую>
```

### Шаг 3: Автоматический деплой

1. **Сделайте commit и push** в ветку `main`:
   ```bash
   git add .
   git commit -m "Add Cloud Functions migration"
   git push origin main
   ```

2. **Проверьте GitHub Actions** - деплой запустится автоматически

3. **Получите URL** из логов деплоя или в Yandex Cloud Console

## 💰 Примерная стоимость

### Для небольшого бота (до 1000 пользователей)
- **Функции**: ~50₽/месяц
- **API Gateway**: ~30₽/месяц
- **Логирование**: ~20₽/месяц
- **Итого**: ~100₽/месяц

### Для среднего бота (до 10,000 пользователей)
- **Функции**: ~200₽/месяц
- **API Gateway**: ~100₽/месяц
- **Логирование**: ~50₽/месяц
- **Итого**: ~350₽/месяц

*Цены указаны приблизительно и могут изменяться*

## 🔧 Ручной деплой (альтернатива)

Если предпочитаете ручной деплой:

```powershell
# Установите Yandex Cloud CLI
# https://cloud.yandex.ru/docs/cli/quickstart

# Запустите скрипт деплоя
.\deploy-cloud-functions.ps1 -FolderID "your-folder-id" -ServiceAccountID "your-sa-id"
```

## 📊 Мониторинг и логи

### Просмотр логов
```bash
# Логи API функции
yc logging read --group-name default --resource-type serverless.function --resource-id <API_FUNCTION_ID>

# Логи webhook функции
yc logging read --group-name default --resource-type serverless.function --resource-id <WEBHOOK_FUNCTION_ID>
```

### Метрики в консоли
1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Перейдите в **Serverless → Functions**
3. Выберите функцию для просмотра метрик

## 🔍 Тестирование

### Проверка API
```bash
# Health check
curl https://your-gateway-url/health

# API endpoint
curl -H "x-api-key: YOUR_API_KEY" https://your-gateway-url/api/subscription/channels
```

### Проверка Telegram бота
1. Отправьте `/start` боту
2. Проверьте логи функций
3. Убедитесь, что webhook работает

## 🛠️ Устранение неполадок

### Частые проблемы

#### 1. Функция не отвечает
- Проверьте логи: `yc logging read --group-name default`
- Убедитесь в правильности переменных окружения
- Проверьте размер архива (не более 128 МБ)

#### 2. Telegram webhook не работает
- Проверьте URL webhook: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Убедитесь, что API Gateway доступен
- Проверьте SSL сертификат

#### 3. API возвращает ошибки
- Проверьте API ключ в заголовках
- Убедитесь в правильности CORS настроек
- Проверьте лимиты API Gateway

### Полезные команды

```bash
# Информация о функции
yc serverless function get hsk-api-function

# Список версий функции
yc serverless function version list --function-name hsk-api-function

# Информация об API Gateway
yc serverless api-gateway get hsk-api-gateway

# Тестирование функции
yc serverless function invoke hsk-api-function --data '{"httpMethod":"GET","path":"/health"}'
```

## 📈 Оптимизация производительности

### Настройка памяти
- **API функция**: 256 МБ (для обработки множественных запросов)
- **Webhook функция**: 128 МБ (для быстрой обработки сообщений)

### Настройка таймаутов
- **API функция**: 30 секунд
- **Webhook функция**: 15 секунд (Telegram требует ответ в течение 20 сек)

### Оптимизация кода
- Используйте singleton для Telegram bot
- Кэшируйте подключения к внешним API
- Минимизируйте размер зависимостей

## 🔄 Миграция данных

Если у вас есть база данных:

1. **Экспортируйте данные** с текущего хостинга
2. **Создайте Managed PostgreSQL** в Yandex Cloud
3. **Импортируйте данные** в новую БД
4. **Обновите строки подключения** в переменных окружения

## 📞 Поддержка

### Устранение неполадок
🔧 **Проблемы с деплоем:** [github-actions-troubleshooting.md](./github-actions-troubleshooting.md)

### Документация
- [Yandex Cloud Functions](https://cloud.yandex.ru/docs/functions/)
- [API Gateway](https://cloud.yandex.ru/docs/api-gateway/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

### Сообщество
- [Telegram чат Yandex Cloud](https://t.me/YandexCloudRu)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/yandex-cloud)

### Техподдержка
- [Создать тикет](https://console.cloud.yandex.ru/support)
- Email: support@cloud.yandex.ru

## 🎉 Заключение

Миграция на Yandex Cloud Functions даст вам:
- **Экономию до 70%** на хостинге
- **Повышение надежности** благодаря автомасштабированию
- **Упрощение DevOps** процессов
- **Соответствие российскому законодательству**

Следуйте этому руководству пошагово, и ваш бот будет работать на современной serverless платформе!

---

*Создано автоматически для проекта HSK Telegram Bot*
*Версия: 1.0 | Дата: $(Get-Date -Format 'yyyy-MM-dd')*