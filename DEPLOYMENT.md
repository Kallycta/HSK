# 🚀 Деплой HSK Telegram Mini App

Пошаговая инструкция по развертыванию приложения в Telegram Mini App.

## 📋 Подготовка к деплою

### 1. Деплой бэкенда

#### Вариант A: Railway (Рекомендуется)
1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Выберите папку `backend` для деплоя
4. Добавьте переменные окружения:
   ```
   API_KEY=881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac
   TELEGRAM_BOT_TOKEN=ваш_токен_бота
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://ваш-фронтенд-домен.vercel.app
   ```

#### Вариант B: Heroku
1. Установите Heroku CLI
2. Создайте приложение: `heroku create your-app-name`
3. Настройте переменные: `heroku config:set API_KEY=...`
4. Деплой: `git push heroku main`

### 2. Деплой фронтенда

#### Вариант A: Vercel (Рекомендуется)
1. Зарегистрируйтесь на [Vercel.com](https://vercel.com)
2. Подключите GitHub репозиторий
3. Выберите папку `frontend` как Root Directory
4. Настройте Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### Вариант B: Netlify
1. Зарегистрируйтесь на [Netlify.com](https://netlify.com)
2. Перетащите папку `frontend` в Netlify
3. Настройте автодеплой через GitHub

### 3. Обновление конфигурации

1. После деплоя бэкенда обновите `frontend/config.js`:
   ```javascript
   production: {
     API_BASE_URL: 'https://your-backend-url.railway.app', // Ваш реальный URL
     API_KEY: '881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac'
   }
   ```

2. Обновите CORS в `backend/server.js`:
   ```javascript
   origin: [
     'https://your-frontend-url.vercel.app', // Ваш фронтенд URL
     'https://web.telegram.org',
     // ... остальные origins
   ]
   ```

## 🤖 Настройка Telegram Mini App

### 1. Создание Mini App через BotFather

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newapp`
3. Выберите вашего бота
4. Введите название приложения: `HSK Subscription Checker`
5. Введите описание: `Проверка подписок на каналы HSK`
6. Загрузите иконку (512x512 px)
7. Введите URL вашего фронтенда: `https://your-frontend-url.vercel.app`

### 2. Настройка Web App URL

1. В BotFather отправьте `/myapps`
2. Выберите ваше приложение
3. Нажмите "Edit Web App URL"
4. Введите URL: `https://your-frontend-url.vercel.app`

### 3. Настройка Menu Button (опционально)

1. В BotFather отправьте `/mybots`
2. Выберите вашего бота
3. Нажмите "Bot Settings" → "Menu Button"
4. Введите текст кнопки: "Открыть приложение"
5. Введите URL: `https://your-frontend-url.vercel.app`

## 🔧 Проверка работы

### 1. Тестирование локально
```bash
# Бэкенд
cd backend
npm start

# Фронтенд (в другом терминале)
cd frontend
npm start
```

### 2. Тестирование в Telegram
1. Откройте вашего бота в Telegram
2. Нажмите кнопку "Menu" или отправьте команду
3. Приложение должно открыться в Telegram

## 🛠️ Troubleshooting

### Проблемы с CORS
- Убедитесь, что URL фронтенда добавлен в CORS настройки бэкенда
- Проверьте, что используется HTTPS для production

### Проблемы с API ключами
- Проверьте переменные окружения на сервере
- Убедитесь, что API ключ совпадает в фронтенде и бэкенде

### Проблемы с Telegram Web App
- URL должен использовать HTTPS
- Проверьте, что Telegram Web App API инициализируется корректно

## 📱 Дополнительные возможности

### Добавление в меню бота
В коде бота добавьте:
```javascript
bot.setMyCommands([
  { command: 'start', description: 'Запустить приложение' },
  { command: 'app', description: 'Открыть HSK приложение' }
]);
```

### Настройка Webhook (для production)
```javascript
// В production используйте webhook вместо polling
if (process.env.NODE_ENV === 'production') {
  bot.setWebHook(`${process.env.WEBHOOK_URL}/webhook`);
}
```

## 🎯 Готово!

Теперь ваше приложение доступно как Telegram Mini App! Пользователи могут:
- Открыть приложение через кнопку меню бота
- Проверить подписки на каналы
- Получить доступ к контенту после подписки