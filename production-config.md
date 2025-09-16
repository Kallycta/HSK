# 🚀 Production Configuration Guide

## Backend Environment Variables (.env)

### Railway/Heroku Deployment
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# API Security
API_KEY=your-secure-api-key-here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
TELEGRAM_BOT_USERNAME=your_bot_username
REQUIRED_CHANNELS=@channel1,@channel2,@channel3

# CORS Configuration
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Frontend URL for Telegram Mini App
FRONTEND_URL=https://your-app.vercel.app
```

## Frontend Configuration

### Update config.js for Production
```javascript
const config = {
  development: {
    API_BASE_URL: 'http://localhost:3000',
    API_KEY: '881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac'
  },
  production: {
    API_BASE_URL: 'https://your-backend.railway.app', // или ваш production URL
    API_KEY: 'your-production-api-key'
  }
};
```

## Deployment Steps

### 1. Backend Deployment (Railway)
```bash
# Установить Railway CLI
npm install -g @railway/cli

# Войти в аккаунт
railway login

# Создать новый проект
railway new

# Развернуть из папки backend
cd backend
railway up

# Добавить переменные окружения через Railway Dashboard
```

### 2. Frontend Deployment (Vercel)
```bash
# Установить Vercel CLI
npm install -g vercel

# Войти в аккаунт
vercel login

# Развернуть из папки frontend
cd frontend
vercel

# Следовать инструкциям CLI
```

### 3. Telegram Mini App Setup

#### В @BotFather:
1. `/newapp` - создать новое приложение
2. Выбрать вашего бота
3. Название: `HSK Subscription Checker`
4. Описание: `Проверка подписок на каналы HSK`
5. **Web App URL**: `https://your-app.vercel.app`
6. Загрузить иконку 512x512px

#### Настройка команд:
```
/setcommands

start - Запустить бота
app - Открыть приложение проверки подписок
help - Помощь
```

#### Настройка меню:
```
/setmenubutton

Текст: 📱 Открыть приложение
URL: https://your-app.vercel.app
```

## Security Checklist

- [ ] Сгенерировать новый API_KEY для production
- [ ] Обновить TELEGRAM_BOT_TOKEN
- [ ] Настроить CORS_ORIGINS только для production доменов
- [ ] Проверить REQUIRED_CHANNELS
- [ ] Обновить FRONTEND_URL на production URL
- [ ] Убедиться что .env файлы не попадают в git

## Testing

### 1. Локальное тестирование
```bash
# Запустить backend
cd backend && npm start

# Запустить frontend
cd frontend && npm start

# Отправить /start боту в Telegram
```

### 2. Production тестирование
1. Открыть бота в Telegram
2. Отправить `/start`
3. Нажать "Открыть приложение"
4. Проверить загрузку Mini App
5. Протестировать проверку подписок

## Troubleshooting

### Проблемы с CORS
- Убедитесь что frontend URL добавлен в CORS_ORIGINS
- Проверьте что URL указан без trailing slash

### Проблемы с Telegram Bot
- Проверьте правильность TELEGRAM_BOT_TOKEN
- Убедитесь что бот не заблокирован
- Проверьте доступность каналов в REQUIRED_CHANNELS

### Проблемы с Mini App
- Убедитесь что FRONTEND_URL корректный
- Проверьте что приложение доступно по HTTPS
- Убедитесь что Web App URL настроен в BotFather

## 🎉 Готово!

После выполнения всех шагов ваше приложение будет доступно как Telegram Mini App!