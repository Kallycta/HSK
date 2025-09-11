# Telegram Mini App Backend

Бэкенд для Telegram Mini App с проверкой подписок на каналы.

## Возможности

- 🤖 Интеграция с Telegram Bot API
- 📋 Проверка подписок пользователей на обязательные каналы
- 🔐 API для аутентификации и авторизации
- 📊 Логирование и мониторинг
- 🛡️ Безопасность и rate limiting
- 🌐 CORS поддержка для фронтенда

## Установка

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и заполните необходимые значения:

```bash
cp .env.example .env
```

### 3. Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Добавьте бота в каналы, подписки на которые нужно проверять
4. Дайте боту права администратора в этих каналах

### 4. Конфигурация .env файла

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
REQUIRED_CHANNELS=channel1,channel2,channel3

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=https://your-vercel-app.vercel.app

# Security
API_KEY=your_secure_api_key_here
JWT_SECRET=your_jwt_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Запуск

### Режим разработки

```bash
npm run dev
```

### Продакшн

```bash
npm start
```

## API Endpoints

### Health Check

```http
GET /health
```

Возвращает статус сервера и сервисов.

### Telegram Bot

#### Получение информации о боте

```http
GET /api/telegram/bot-info
Headers:
  x-api-key: your_api_key
```

#### Webhook для Telegram

```http
POST /api/telegram/webhook
Headers:
  x-api-key: your_api_key
```

### Проверка подписок

#### Проверка всех подписок пользователя

```http
POST /api/subscription/check
Headers:
  x-api-key: your_api_key
  Content-Type: application/json

Body:
{
  "userId": 123456789
}
```

Ответ:
```json
{
  "hasAccess": true,
  "userId": 123456789,
  "subscriptions": {
    "channel1": true,
    "channel2": true
  },
  "missingChannels": [],
  "totalChannels": 2,
  "checkedAt": "2024-01-01T12:00:00.000Z"
}
```

#### Получение списка обязательных каналов

```http
GET /api/subscription/channels
Headers:
  x-api-key: your_api_key
```

#### Проверка подписки на конкретный канал

```http
POST /api/subscription/check-single
Headers:
  x-api-key: your_api_key
  Content-Type: application/json

Body:
{
  "userId": 123456789,
  "channel": "channel1"
}
```

#### Получение информации о пользователе

```http
POST /api/subscription/user-info
Headers:
  x-api-key: your_api_key
  Content-Type: application/json

Body:
{
  "userId": 123456789
}
```

#### Статус сервиса

```http
GET /api/subscription/status
```

## Структура проекта

```
backend/
├── middleware/
│   └── errorHandler.js     # Middleware для обработки ошибок и логирования
├── routes/
│   ├── telegram.js         # Маршруты для Telegram Bot API
│   └── subscription.js     # Маршруты для проверки подписок
├── services/
│   └── telegramBot.js      # Сервис для работы с Telegram Bot
├── .env.example            # Пример конфигурации
├── package.json            # Зависимости и скрипты
├── server.js              # Основной файл сервера
└── README.md              # Документация
```

## Безопасность

- ✅ Helmet.js для базовой защиты
- ✅ Rate limiting для предотвращения спама
- ✅ CORS настройка
- ✅ API ключи для защиты эндпоинтов
- ✅ Валидация входных данных
- ✅ Обработка ошибок без раскрытия внутренней информации

## Логирование

Сервер автоматически логирует:
- 📝 Все HTTP запросы с временем выполнения
- ❌ Ошибки с подробной информацией
- 🎯 Важные события (инициализация бота, проверки подписок)
- ⚠️ Предупреждения о проблемах конфигурации

## Мониторинг

Используйте эндпоинт `/health` для мониторинга:
- Статус сервера
- Статус Telegram бота
- Время работы сервера
- Версия приложения

## Развертывание

### Heroku

1. Создайте приложение на Heroku
2. Настройте переменные окружения
3. Подключите GitHub репозиторий
4. Разверните приложение

### Railway

1. Подключите GitHub репозиторий
2. Настройте переменные окружения
3. Разверните из папки `backend`

### VPS

1. Клонируйте репозиторий
2. Установите Node.js и npm
3. Настройте .env файл
4. Используйте PM2 для управления процессом:

```bash
npm install -g pm2
pm2 start server.js --name "telegram-bot-backend"
pm2 startup
pm2 save
```

## Troubleshooting

### Бот не инициализируется

- Проверьте правильность `TELEGRAM_BOT_TOKEN`
- Убедитесь, что бот создан через @BotFather
- Проверьте интернет соединение

### Ошибки проверки подписок

- Убедитесь, что бот добавлен в каналы как администратор
- Проверьте правильность имен каналов в `REQUIRED_CHANNELS`
- Имена каналов должны быть без символа @

### CORS ошибки

- Проверьте настройку `FRONTEND_URL`
- Убедитесь, что URL фронтенда точно совпадает
- Включите протокол (https://) в URL

## Поддержка

Для получения помощи:
1. Проверьте логи сервера
2. Убедитесь в правильности конфигурации
3. Проверьте статус через `/health` эндпоинт