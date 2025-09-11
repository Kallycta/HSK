// ===== ИМПОРТЫ И НАСТРОЙКА =====
// Подключаем библиотеку Express - это основа нашего веб-сервера
const express = require('express');           // Веб-фреймворк Express для создания сервера

// Подключаем CORS - позволяет фронтенду обращаться к нашему API с других доменов
const cors = require('cors');                 // Middleware для настройки CORS политик

// Подключаем Helmet - добавляет заголовки безопасности для защиты от атак
const helmet = require('helmet');             // Middleware для повышения безопасности HTTP заголовков

// Подключаем Rate Limiting - ограничивает количество запросов от одного IP
const rateLimit = require('express-rate-limit'); // Middleware для ограничения частоты запросов

// Загружаем переменные окружения из файла .env (токены, пароли и т.д.)
require('dotenv').config();                   // Загружаем переменные окружения из .env файла в process.env

// Импортируем наши собственные middleware (промежуточные обработчики)
const {
  requestLogger,      // Middleware для логирования всех HTTP запросов
  notFoundHandler,    // Middleware для обработки 404 ошибок (страница не найдена)
  globalErrorHandler, // Глобальный middleware для обработки всех ошибок
  jsonErrorHandler,   // Обрабатывает ошибки в JSON данных
  logEvent,          // Функция для логирования важных событий системы
  logSuccess         // Функция для логирования успешных операций
} = require('./middleware/errorHandler');

// Импортируем сервис для работы с Telegram Bot API
const telegramBotService = require('./services/telegramBot');

// Импортируем маршруты (routes) - это как страницы на сайте, но для API
const telegramRoutes = require('./routes/telegram');        // Маршруты для работы с Telegram ботом
const subscriptionRoutes = require('./routes/subscription'); // Маршруты для управления подписками

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
// Создаем экземпляр Express приложения - это наш сервер
const app = express();                        // Создаем новый экземпляр Express приложения

// Устанавливаем порт сервера: берем из переменных окружения или используем 3000 по умолчанию
const PORT = process.env.PORT || 3000;        // Определяем порт сервера из .env или используем 3000 по умолчанию

// ===== НАСТРОЙКА MIDDLEWARE (промежуточных обработчиков) =====
// Middleware - это функции, которые выполняются для каждого запроса

// Включаем логирование всех запросов (кто, когда и что запросил)
app.use(requestLogger);

// Включаем защитные заголовки HTTP для безопасности
app.use(helmet());

// ===== НАСТРОЙКА ОГРАНИЧЕНИЯ ЗАПРОСОВ =====
// Создаем ограничитель запросов чтобы защититься от спама и DDoS атак
const limiter = rateLimit({
  // Временное окно в миллисекундах (15 минут по умолчанию)
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  
  // Максимальное количество запросов с одного IP за временное окно
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Сообщение, которое отправляется при превышении лимита
  message: {
    error: 'Слишком много запросов с этого IP, попробуйте позже.'
  },
  
  // Включаем стандартные заголовки с информацией о лимитах
  standardHeaders: true,
  
  // Отключаем устаревшие заголовки
  legacyHeaders: false
});

// Применяем ограничитель только к API маршрутам (не ко всему сайту)
app.use('/api/', limiter);

// ===== НАСТРОЙКА CORS (Cross-Origin Resource Sharing) =====
// CORS позволяет фронтенду обращаться к бэкенду с других доменов
const corsOptions = {
  // Список разрешенных доменов, с которых можно делать запросы
  origin: [
    process.env.FRONTEND_URL,        // URL фронтенда из переменных окружения
    'https://web.telegram.org',      // Официальный веб-клиент Telegram
    /\.vercel\.app$/,                // Все поддомены Vercel (для деплоя)
    'http://localhost:3000',         // Локальная разработка (бэкенд)
    'http://localhost:5173'          // Локальная разработка (фронтенд Vite)
  ],
  
  // Разрешаем отправку cookies и заголовков авторизации между доменами
  credentials: true,
  
  // Список разрешенных HTTP методов для CORS запросов
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Список разрешенных заголовков в CORS запросах
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};

// Применяем CORS настройки ко всем маршрутам приложения
app.use(cors(corsOptions));

// ===== НАСТРОЙКА ПАРСИНГА ТЕЛА ЗАПРОСОВ =====
// Включаем парсинг JSON данных в теле запроса с лимитом 10MB
app.use(express.json({ limit: '10mb' }));

// Включаем специальный обработчик ошибок JSON парсинга
app.use(jsonErrorHandler);

// Включаем парсинг URL-encoded данных (данные из HTML форм) с лимитом 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== ENDPOINT ДЛЯ ПРОВЕРКИ ЗДОРОВЬЯ СЕРВЕРА =====
// Этот endpoint показывает, работает ли сервер и его сервисы
app.get('/health', (req, res) => {
  // Проверяем, инициализирован ли Telegram бот
  const botStatus = telegramBotService.isInitialized();
  
  // Отправляем информацию о состоянии сервера
  res.json({ 
    status: 'OK',                           // Статус работы сервера
    timestamp: new Date().toISOString(),    // Текущее время в ISO формате
    uptime: process.uptime(),               // Время работы сервера в секундах
    services: {                             // Статус всех подключенных сервисов
      telegram_bot: botStatus ? 'operational' : 'not_initialized'
    },
    version: process.env.npm_package_version || '1.0.0' // Версия приложения
  });
});

// ===== ПОДКЛЮЧЕНИЕ МАРШРУТОВ API =====
// Все запросы к /api/telegram будут обрабатываться в telegramRoutes
app.use('/api/telegram', telegramRoutes);

// Все запросы к /api/subscription будут обрабатываться в subscriptionRoutes
app.use('/api/subscription', subscriptionRoutes);

// ===== ОБРАБОТЧИКИ ОШИБОК =====
// Обработчик для всех несуществующих маршрутов (возвращает 404 ошибку)
app.use('*', notFoundHandler);

// Глобальный обработчик всех необработанных ошибок (должен быть последним middleware)
app.use(globalErrorHandler);

// ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM БОТА =====
// Асинхронная функция для безопасной инициализации Telegram бота при запуске сервера
const initializeTelegramBot = async () => {
  try {
    // Пытаемся подключиться к Telegram Bot API и инициализировать бота
    await telegramBotService.initialize();
    logSuccess('Telegram bot initialized successfully'); // Логируем успешную инициализацию
    
    // Устанавливаем глобальную переменную для отслеживания статуса бота
    global.botStatus = true;
  } catch (error) {
    // Если инициализация не удалась, логируем ошибку но продолжаем работу сервера
    console.error('❌ Failed to initialize Telegram bot:', error.message);
    global.botStatus = false; // Помечаем бота как неактивного
  }
};

// ===== ЗАПУСК СЕРВЕРА =====
// Запускаем HTTP сервер и инициализируем все необходимые сервисы
app.listen(PORT, async () => {
  // Логируем информацию об успешном запуске сервера
  logSuccess(`Server is running on port ${PORT}`);
  logEvent('Server started', {
    port: PORT,                                        // Порт на котором запущен сервер
    environment: process.env.NODE_ENV || 'development', // Окружение (development/production)
    timestamp: new Date().toISOString()                // Время запуска в ISO формате
  });
  
  // Инициализируем Telegram бота после успешного запуска HTTP сервера
  await initializeTelegramBot();
  
  // Выводим в консоль информацию о доступных API эндпоинтах для разработчика
  console.log(`\n🌐 Available endpoints:`);
  console.log(`   Health check: http://localhost:${PORT}/health`);        // Проверка работоспособности
  console.log(`   Telegram API: http://localhost:${PORT}/api/telegram`);   // API для работы с ботом
  console.log(`   Subscription API: http://localhost:${PORT}/api/subscription\n`); // API для подписок
});

// ===== ОБРАБОТЧИКИ СИГНАЛОВ ЗАВЕРШЕНИЯ =====
// Настраиваем корректное завершение работы сервера при получении системных сигналов

// Обработчик сигнала SIGTERM (обычно отправляется системой при завершении процесса)
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully'); // Логируем получение сигнала
  process.exit(0); // Корректно завершаем процесс с кодом 0 (успех)
});

// Обработчик сигнала SIGINT (отправляется при нажатии Ctrl+C в терминале)
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully'); // Логируем получение сигнала
  process.exit(0); // Корректно завершаем процесс с кодом 0 (успех)
});

// ===== ЭКСПОРТ МОДУЛЯ =====
// Экспортируем экземпляр Express приложения для использования в тестах и других модулях
module.exports = app;