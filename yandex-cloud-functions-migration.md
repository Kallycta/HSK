# 🚀 Миграция Backend на Yandex Cloud Functions

## Обзор

Yandex Cloud Functions - это serverless платформа, которая позволяет запускать код без управления серверами. Идеально подходит для API и Telegram ботов.

### Преимущества Cloud Functions:
- 💰 **Оплата только за выполнение** - нет платы за простой
- 🔄 **Автоматическое масштабирование** - от 0 до тысяч запросов
- 🛠️ **Нет управления серверами** - только код
- ⚡ **Быстрое развертывание** - секунды вместо минут
- 🔒 **Встроенная безопасность** - изоляция выполнения

### Ограничения:
- ⏱️ **Время выполнения**: до 15 минут
- 💾 **Память**: до 4 ГБ
- 📦 **Размер кода**: до 128 МБ
- 🌡️ **Холодный старт**: 1-3 секунды

## 📋 Подготовка к миграции

### 1. Анализ текущего backend

Ваш текущий backend использует:
- **Express.js** сервер
- **Telegram Bot API**
- **Middleware** для обработки ошибок
- **API endpoints** для подписок

### 2. Архитектура для Cloud Functions

```
Cloud Functions Architecture:
├── HTTP Function (API Gateway)
│   ├── /api/subscription/channels
│   └── /health
├── Telegram Webhook Function
│   └── Обработка сообщений бота
└── Shared Dependencies
    ├── telegramBot.js
    └── middleware/
```

## 🔧 Шаг 1: Подготовка кода

### Создание функции-обертки

Создайте файл `functions/api-handler.js`:

```javascript
const express = require('express');
const serverless = require('serverless-http');

// Импортируем существующие роуты
const subscriptionRoutes = require('../backend/routes/subscription');
const telegramRoutes = require('../backend/routes/telegram');
const errorHandler = require('../backend/middleware/errorHandler');

// Создаем Express приложение
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS для Cloud Functions
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'HSK Telegram Bot API',
        version: '1.0.0'
    });
});

// API роуты
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/telegram', telegramRoutes);

// Обработка ошибок
app.use(errorHandler);

// Экспорт для Cloud Functions
module.exports.handler = serverless(app);
```

### Создание отдельной функции для Telegram webhook

Создайте файл `functions/telegram-webhook.js`:

```javascript
const TelegramBotService = require('../backend/services/telegramBot');

// Инициализация бота
const telegramBot = new TelegramBotService();

// Обработчик webhook
module.exports.handler = async (event, context) => {
    try {
        // Парсим тело запроса
        const body = typeof event.body === 'string' 
            ? JSON.parse(event.body) 
            : event.body;

        console.log('Received webhook:', JSON.stringify(body, null, 2));

        // Обрабатываем обновление от Telegram
        if (body.message || body.callback_query) {
            await telegramBot.processUpdate(body);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ok: true })
        };
    } catch (error) {
        console.error('Webhook error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                ok: false, 
                error: error.message 
            })
        };
    }
};
```

### Обновление telegramBot.js для Cloud Functions

Добавьте метод `processUpdate` в `backend/services/telegramBot.js`:

```javascript
// Добавьте этот метод в класс TelegramBotService
async processUpdate(update) {
    try {
        if (update.message) {
            await this.handleMessage(update.message);
        } else if (update.callback_query) {
            await this.handleCallbackQuery(update.callback_query);
        }
    } catch (error) {
        console.error('Error processing update:', error);
        throw error;
    }
}

async handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
        await this.bot.sendMessage(chatId, 'Добро пожаловать в HSK бот!');
    } else if (text === '/check') {
        // Проверка подписок
        const subscriptionStatus = await this.checkUserSubscriptions(chatId);
        await this.bot.sendMessage(chatId, subscriptionStatus);
    }
}

async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    // Обработка callback данных
    await this.bot.answerCallbackQuery(callbackQuery.id);
    await this.bot.sendMessage(chatId, `Обработано: ${data}`);
}
```

## 🔧 Шаг 2: Конфигурация для Cloud Functions

### Создание package.json для функций

Создайте `functions/package.json`:

```json
{
  "name": "hsk-cloud-functions",
  "version": "1.0.0",
  "description": "HSK Telegram Bot Cloud Functions",
  "main": "api-handler.js",
  "scripts": {
    "start": "node api-handler.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "serverless-http": "^3.2.0",
    "node-telegram-bot-api": "^0.61.0",
    "axios": "^1.4.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Создание .yandexignore

Создайте `functions/.yandexignore`:

```
node_modules/
.git/
.env
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
README.md
*.md
tests/
__tests__/
.github/
```

## 🚀 Шаг 3: Развертывание через Yandex Cloud CLI

### Установка и настройка CLI

```powershell
# Установка Yandex Cloud CLI
iex (New-Object System.Net.WebClient).DownloadString('https://storage.yandexcloud.net/yandexcloud-yc/install.ps1')

# Инициализация
yc init

# Проверка авторизации
yc config list
```

### Создание функций

```bash
# Создание функции для API
yc serverless function create \
  --name hsk-api-function \
  --description "HSK Telegram Bot API endpoints"

# Создание функции для Telegram webhook
yc serverless function create \
  --name hsk-telegram-webhook \
  --description "HSK Telegram Bot webhook handler"
```

### Развертывание API функции

```bash
# Переходим в папку с функциями
cd functions

# Устанавливаем зависимости
npm install

# Создаем архив с кодом
zip -r api-function.zip . -x "node_modules/*" "*.log" ".git/*"

# Развертываем функцию
yc serverless function version create \
  --function-name hsk-api-function \
  --runtime nodejs18 \
  --entrypoint api-handler.handler \
  --memory 256m \
  --execution-timeout 30s \
  --source-path api-function.zip \
  --environment NODE_ENV=production,TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN,API_KEY=hsk_api_key_2024,REQUIRED_CHANNELS="hsk_channel,chinese_learning,mandarin_practice"
```

### Развертывание Telegram webhook функции

```bash
# Создаем архив для webhook функции
zip -r telegram-webhook.zip . -x "node_modules/*" "*.log" ".git/*"

# Развертываем функцию
yc serverless function version create \
  --function-name hsk-telegram-webhook \
  --runtime nodejs18 \
  --entrypoint telegram-webhook.handler \
  --memory 128m \
  --execution-timeout 15s \
  --source-path telegram-webhook.zip \
  --environment NODE_ENV=production,TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
```

## 🌐 Шаг 4: Настройка API Gateway

### Создание API Gateway

```bash
# Создаем API Gateway
yc serverless api-gateway create \
  --name hsk-api-gateway \
  --description "HSK Telegram Bot API Gateway"
```

### Конфигурация API Gateway

Создайте файл `api-gateway-spec.yaml`:

```yaml
openapi: 3.0.0
info:
  title: HSK Telegram Bot API
  version: 1.0.0
  description: API для HSK Telegram бота

paths:
  /api/subscription/channels:
    get:
      summary: Получить список обязательных каналов
      parameters:
        - name: x-api-key
          in: header
          required: true
          schema:
            type: string
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <FUNCTION_ID>
        service_account_id: <SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Список каналов
          content:
            application/json:
              schema:
                type: object

  /health:
    get:
      summary: Проверка состояния API
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <FUNCTION_ID>
        service_account_id: <SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Статус OK

  /webhook/telegram:
    post:
      summary: Telegram webhook
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <TELEGRAM_WEBHOOK_FUNCTION_ID>
        service_account_id: <SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Webhook обработан
```

### Обновление API Gateway

```bash
# Получаем ID функций
API_FUNCTION_ID=$(yc serverless function get hsk-api-function --format json | jq -r '.id')
WEBHOOK_FUNCTION_ID=$(yc serverless function get hsk-telegram-webhook --format json | jq -r '.id')

# Обновляем спецификацию
sed -i "s/<FUNCTION_ID>/$API_FUNCTION_ID/g" api-gateway-spec.yaml
sed -i "s/<TELEGRAM_WEBHOOK_FUNCTION_ID>/$WEBHOOK_FUNCTION_ID/g" api-gateway-spec.yaml

# Развертываем API Gateway
yc serverless api-gateway update hsk-api-gateway \
  --spec api-gateway-spec.yaml
```

## 🔧 Шаг 5: Автоматизация через GitHub Actions

### Создание workflow для Cloud Functions

Создайте `.github/workflows/deploy-cloud-functions.yml`:

```yaml
name: Deploy to Yandex Cloud Functions

on:
  push:
    branches: [ main, master ]
    paths: 
      - 'backend/**'
      - 'functions/**'
  workflow_dispatch:

env:
  YC_FOLDER_ID: ${{ secrets.YC_FOLDER_ID }}
  YC_SERVICE_ACCOUNT_KEY: ${{ secrets.YC_SERVICE_ACCOUNT_KEY }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: 🔄 Checkout code
      uses: actions/checkout@v4
      
    - name: 🔧 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: functions/package-lock.json
        
    - name: 🔧 Setup Yandex Cloud CLI
      uses: yc-actions/yc-cli-install@v1
      with:
        yc-sa-json-credentials: ${{ secrets.YC_SA_JSON_CREDENTIALS }}
        
    - name: 📦 Install dependencies
      run: |
        cd functions
        npm ci --only=production
        
    - name: 🗜️ Create deployment package
      run: |
        cd functions
        zip -r ../api-function.zip . -x "node_modules/.cache/*" "*.log"
        
    - name: 🚀 Deploy API Function
      run: |
        yc serverless function version create \
          --function-name hsk-api-function \
          --runtime nodejs18 \
          --entrypoint api-handler.handler \
          --memory 256m \
          --execution-timeout 30s \
          --source-path api-function.zip \
          --environment NODE_ENV=production,TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }},API_KEY=${{ secrets.API_KEY }},REQUIRED_CHANNELS="${{ secrets.REQUIRED_CHANNELS }}"
          
    - name: 🚀 Deploy Telegram Webhook Function
      run: |
        yc serverless function version create \
          --function-name hsk-telegram-webhook \
          --runtime nodejs18 \
          --entrypoint telegram-webhook.handler \
          --memory 128m \
          --execution-timeout 15s \
          --source-path api-function.zip \
          --environment NODE_ENV=production,TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}
          
    - name: 🔍 Test functions
      run: |
        # Получаем URL API Gateway
        GATEWAY_URL=$(yc serverless api-gateway get hsk-api-gateway --format json | jq -r '.domain')
        
        # Тестируем health endpoint
        curl -f "https://$GATEWAY_URL/health" || exit 1
        
        # Тестируем API endpoint
        curl -f -H "x-api-key: ${{ secrets.API_KEY }}" "https://$GATEWAY_URL/api/subscription/channels" || echo "API test warning"
        
    - name: 📊 Deployment summary
      run: |
        GATEWAY_URL=$(yc serverless api-gateway get hsk-api-gateway --format json | jq -r '.domain')
        
        echo "## 🎉 Cloud Functions Deployment Summary" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY
        echo "| Parameter | Value |" >> $GITHUB_STEP_SUMMARY
        echo "|-----------|-------|" >> $GITHUB_STEP_SUMMARY
        echo "| API Gateway URL | https://$GATEWAY_URL |" >> $GITHUB_STEP_SUMMARY
        echo "| Health Check | https://$GATEWAY_URL/health |" >> $GITHUB_STEP_SUMMARY
        echo "| API Endpoint | https://$GATEWAY_URL/api/subscription/channels |" >> $GITHUB_STEP_SUMMARY
        echo "| Telegram Webhook | https://$GATEWAY_URL/webhook/telegram |" >> $GITHUB_STEP_SUMMARY
```

## 🔧 Шаг 6: Настройка Telegram webhook

### Обновление webhook URL

```bash
# Получаем URL API Gateway
GATEWAY_URL=$(yc serverless api-gateway get hsk-api-gateway --format json | jq -r '.domain')

# Устанавливаем webhook для Telegram бота
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"https://$GATEWAY_URL/webhook/telegram\",
    \"allowed_updates\": [\"message\", \"callback_query\"]
  }"
```

### Проверка webhook

```bash
# Проверяем статус webhook
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

## 📊 Мониторинг и логирование

### Просмотр логов функций

```bash
# Логи API функции
yc logging read \
  --group-name default \
  --resource-type serverless.function \
  --resource-id $(yc serverless function get hsk-api-function --format json | jq -r '.id') \
  --since 1h

# Логи webhook функции
yc logging read \
  --group-name default \
  --resource-type serverless.function \
  --resource-id $(yc serverless function get hsk-telegram-webhook --format json | jq -r '.id') \
  --since 1h
```

### Мониторинг производительности

```bash
# Статистика вызовов функций
yc serverless function list-operations --name hsk-api-function
yc serverless function list-operations --name hsk-telegram-webhook
```

## 💰 Оптимизация затрат

### Настройка ресурсов функций

```bash
# Оптимизация памяти для API функции
yc serverless function version create \
  --function-name hsk-api-function \
  --memory 128m \
  --execution-timeout 10s

# Оптимизация для webhook функции
yc serverless function version create \
  --function-name hsk-telegram-webhook \
  --memory 64m \
  --execution-timeout 5s
```

### Примерная стоимость

| Ресурс | Использование | Стоимость/месяц |
|--------|---------------|----------------|
| API Function (128MB) | 10,000 вызовов | ~50₽ |
| Webhook Function (64MB) | 5,000 вызовов | ~20₽ |
| API Gateway | 15,000 запросов | ~30₽ |
| **Итого** | | **~100₽/месяц** |

## 🔧 Полезные команды

```bash
# Список функций
yc serverless function list

# Информация о функции
yc serverless function get hsk-api-function

# Вызов функции для тестирования
yc serverless function invoke \
  --name hsk-api-function \
  --data '{"httpMethod": "GET", "path": "/health"}'

# Обновление переменных окружения
yc serverless function version create \
  --function-name hsk-api-function \
  --environment NODE_ENV=production,NEW_VAR=value

# Удаление функции
yc serverless function delete hsk-api-function
```

## 🚨 Troubleshooting

### Частые проблемы и решения

1. **Холодный старт**
   ```javascript
   // Добавьте keep-alive для уменьшения холодных стартов
   const keepAlive = setInterval(() => {
       console.log('Keep alive');
   }, 14 * 60 * 1000); // 14 минут
   ```

2. **Превышение лимита времени**
   ```bash
   # Увеличьте timeout
   yc serverless function version create \
     --execution-timeout 60s
   ```

3. **Ошибки памяти**
   ```bash
   # Увеличьте память
   yc serverless function version create \
     --memory 512m
   ```

## 📋 Чек-лист миграции

- [ ] ✅ Создать функции-обертки для Express приложения
- [ ] ✅ Настроить обработку Telegram webhook
- [ ] ✅ Создать и развернуть Cloud Functions
- [ ] ✅ Настроить API Gateway
- [ ] ✅ Обновить Telegram webhook URL
- [ ] ✅ Настроить GitHub Actions для автоматического развертывания
- [ ] ✅ Протестировать все endpoints
- [ ] ✅ Настроить мониторинг и логирование
- [ ] ✅ Оптимизировать ресурсы для снижения затрат

## 🎯 Заключение

Cloud Functions предоставляют отличную альтернативу традиционным серверам для API и Telegram ботов:

**Преимущества:**
- 💰 Очень низкая стоимость (~100₽/месяц)
- 🔄 Автоматическое масштабирование
- 🛠️ Нет управления инфраструктурой
- ⚡ Быстрое развертывание

**Рекомендации:**
- Используйте для API с небольшой нагрузкой
- Оптимизируйте размер функций
- Настройте мониторинг
- Регулярно проверяйте логи

Ваш HSK Telegram бот будет работать эффективно и экономично на Yandex Cloud Functions! 🚀