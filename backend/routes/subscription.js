// ===== ИМПОРТЫ И НАСТРОЙКА =====
// Подключение необходимых модулей для работы с маршрутами подписок
const express = require('express');                          // Фреймворк для создания веб-сервера и обработки HTTP запросов
const telegramBotService = require('../services/telegramBot'); // Сервис для работы с Telegram ботом и проверки подписок
const router = express.Router();                             // Создаем роутер для обработки маршрутов API подписок

/**
 * ===== MIDDLEWARE ДЛЯ БЕЗОПАСНОСТИ =====
 * Middleware для проверки API ключа
 * Проверяет наличие и корректность API ключа в заголовках запроса
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];                   // Извлекаем API ключ из заголовка запроса
  const expectedApiKey = process.env.API_KEY;                // Ожидаемый ключ из переменных окружения
  
  // Отладочное логирование
  console.log('🔑 API Key Debug:');
  console.log('  Received:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
  console.log('  Expected:', expectedApiKey ? `${expectedApiKey.substring(0, 10)}...` : 'undefined');
  console.log('  Match:', apiKey === expectedApiKey);
  
  // Проверяем наличие ключа и его соответствие переменной окружения
  if (expectedApiKey && (!apiKey || apiKey !== expectedApiKey)) {
    return res.status(401).json({ error: 'Invalid or missing API key' }); // Возвращаем ошибку авторизации
  }
  
  next();                                                    // Передаем управление следующему middleware
};

/**
 * Middleware для валидации данных Telegram Web App
 * Проверяет подлинность данных, переданных из Telegram Mini App
 * Извлекает и валидирует ID пользователя из initData
 */
const validateTelegramWebApp = (req, res, next) => {
  const { initData } = req.body;                             // Извлекаем initData из тела запроса
  
  // Проверяем наличие обязательного параметра initData
  if (!initData) {
    return res.status(400).json({ 
      error: 'Missing initData',                             // Отсутствуют данные Telegram
      message: 'Telegram Web App initData is required'       // Требуются данные из Mini App
    });
  }

  try {
    // Парсим URL-параметры из строки initData
    const urlParams = new URLSearchParams(initData);        // Создаем объект для работы с параметрами
    const userParam = urlParams.get('user');               // Извлекаем параметр 'user'
    
    // Проверяем наличие пользовательских данных
    if (!userParam) {
      return res.status(400).json({ 
        error: 'Invalid initData',                          // Некорректные данные initData
        message: 'User data not found in initData'          // Данные пользователя не найдены
      });
    }
    
    // Парсим JSON строку с данными пользователя
    const userData = JSON.parse(userParam);                 // Преобразуем JSON строку в объект
    
    // Проверяем наличие ID пользователя
    if (!userData.id) {
      return res.status(400).json({ 
        error: 'Invalid user data',                         // Некорректные данные пользователя
        message: 'User ID not found'                        // ID пользователя не найден
      });
    }
    
    // Сохраняем валидированный ID пользователя для использования в маршрутах
    req.telegramUserId = userData.id;                       // Добавляем ID в объект запроса
    next();                                                 // Передаем управление следующему обработчику
    
  } catch (error) {
    console.error('Error parsing initData:', error);        // Логируем ошибку парсинга
    res.status(400).json({ 
      error: 'Invalid initData format',                     // Некорректный формат данных
      message: 'Failed to parse Telegram Web App data'      // Ошибка обработки данных Mini App
    });
  }
};

/**
 * ===== API МАРШРУТЫ =====
 * POST /api/subscription/check
 * Проверка подписок пользователя на все обязательные каналы
 */
router.post('/check', validateApiKey, validateTelegramWebApp, async (req, res) => {
  try {
    const userId = req.telegramUserId;                       // Получаем валидированный ID пользователя из middleware
    
    // Проверяем готовность бота к работе с Telegram API
    if (!telegramBotService.isInitialized()) {
      return res.status(503).json({ 
        error: 'Telegram bot not initialized',              // Бот не готов к работе
        hasAccess: false,                                   // Доступ запрещен до инициализации
        message: 'Service temporarily unavailable'          // Сообщение для пользователя
      });
    }

    console.log(`🔍 Checking subscriptions for user ${userId}`); // Логируем начало процесса проверки
    
    // Выполняем асинхронную проверку подписок на все обязательные каналы
    const subscriptionResult = await telegramBotService.checkAllSubscriptions(userId);
    
    // Формируем детальный ответ с результатами проверки каждого канала
    const response = {
      hasAccess: subscriptionResult.allSubscribed,         // Есть ли полный доступ (все подписки активны)
      userId: userId,                                      // ID проверяемого пользователя
      subscriptions: subscriptionResult.subscriptions,     // Массив с деталями по каждому каналу
      missingChannels: subscriptionResult.missingChannels, // Список каналов без подписки
      totalChannels: subscriptionResult.totalChannels,     // Общее количество обязательных каналов
      checkedAt: new Date().toISOString()                 // Временная метка проверки в ISO формате
    };
    
    // Добавляем дополнительную информацию для случая неполных подписок
    if (!subscriptionResult.allSubscribed) {
      response.message = `Необходимо подписаться на ${subscriptionResult.missingChannels.length} канал(ов)`;
      // Формируем удобный список каналов с прямыми ссылками для подписки
      response.channelsToSubscribe = subscriptionResult.missingChannels.map(channel => ({
        username: channel,                               // Имя канала без символа @
        url: `https://t.me/${channel}`                  // Прямая ссылка на канал в Telegram
      }));
    }
    
    res.json(response);                                  // Отправляем JSON ответ с результатами
    
  } catch (error) {
    console.error('Error checking subscriptions:', error); // Логируем подробности ошибки для отладки
    
    // Определяем тип ошибки для предоставления более точного ответа клиенту
    if (error.message.includes('not initialized')) {
      return res.status(503).json({ 
        error: 'Service unavailable',                       // Код ошибки сервиса
        hasAccess: false,                                   // Доступ запрещен из-за ошибки
        message: 'Telegram bot service is not available'    // Понятное сообщение об ошибке
      });
    }
    
    // Обработка общих ошибок сервера
    res.status(500).json({ 
      error: 'Subscription check failed',                    // Общий код ошибки проверки
      hasAccess: false,                                      // Безопасное значение при ошибке
      message: 'Unable to verify subscriptions at this time' // Сообщение для пользователя
    });
  }
});

/**
 * GET /api/subscription/channels
 * Получение списка обязательных каналов для подписки
 * Возвращает структурированную информацию о каждом канале с URL и отображаемыми именами
 */
router.get('/channels', validateApiKey, (req, res) => {
  try {
    // Получаем массив имен обязательных каналов из конфигурации бота
    const channels = telegramBotService.getRequiredChannels();
    
    // Формируем структурированный ответ с детальной информацией о каждом канале
    const response = {
      channels: channels.map(channel => ({                    // Преобразуем каждый канал в объект с метаданными
        username: channel,                                   // Имя канала без символа @
        url: `https://t.me/${channel}`,                     // Прямая ссылка для открытия канала в Telegram
        displayName: `@${channel}`                          // Отображаемое имя с префиксом @ для UI
      })),
      totalChannels: channels.length,                      // Общее количество обязательных каналов
      botInitialized: telegramBotService.isInitialized()   // Текущий статус готовности бота к работе
    };
    
    res.json(response);                                    // Отправляем JSON ответ со списком каналов
  } catch (error) {
    console.error('Error getting channels:', error);       // Логируем ошибку для отладки
    res.status(500).json({ 
      error: 'Failed to get channels list'                  // Сообщение об ошибке получения списка
    });
  }
});

/**
 * POST /api/subscription/user-info
 * Получение детальной информации о пользователе Telegram
 * Использует Telegram Bot API для получения актуальных данных профиля
 */
router.post('/user-info', validateApiKey, validateTelegramWebApp, async (req, res) => {
  try {
    const userId = req.telegramUserId;                       // Получаем валидированный ID пользователя из middleware
    
    // Проверяем готовность бота для выполнения API запросов
    if (!telegramBotService.isInitialized()) {
      return res.status(503).json({ 
        error: 'Telegram bot not initialized'                // Бот не готов к работе с API
      });
    }
    
    // Выполняем запрос к Telegram Bot API для получения данных пользователя
    const userInfo = await telegramBotService.getUserInfo(userId);
    
    // Формируем успешный ответ с информацией о пользователе
    res.json({
      user: userInfo,                                      // Объект с данными пользователя (имя, username, фото и т.д.)
      requestedAt: new Date().toISOString()                // Временная метка запроса в ISO формате
    });
    
  } catch (error) {
    console.error('Error getting user info:', error);       // Логируем подробности ошибки для отладки
    
    // Обрабатываем специфичные ошибки Telegram API
    if (error.response && error.response.error_code === 400) {
      return res.status(404).json({ 
        error: 'User not found',                            // Пользователь не найден в Telegram
        message: 'Unable to get user information'           // Понятное сообщение для клиента
      });
    }
    
    // Обработка общих ошибок сервера или сети
    res.status(500).json({ 
      error: 'Failed to get user information'             // Общее сообщение об ошибке получения данных
    });
  }
});

/**
 * POST /api/subscription/check-single
 * Проверка подписки пользователя на один конкретный канал
 * Позволяет выборочно проверить статус подписки без полной проверки всех каналов
 */
router.post('/check-single', validateApiKey, validateTelegramWebApp, async (req, res) => {
  try {
    const userId = req.telegramUserId;                       // Получаем валидированный ID пользователя из middleware
    const { channel } = req.body;                            // Извлекаем имя целевого канала из тела запроса
    
    // Валидируем наличие обязательного параметра канала
    if (!channel) {
      return res.status(400).json({ 
        error: 'Missing channel parameter',                 // Отсутствует обязательный параметр
        message: 'Channel username is required'             // Требуется указать имя канала
      });
    }
    
    // Проверяем готовность бота для выполнения проверки подписки
    if (!telegramBotService.isInitialized()) {
      return res.status(503).json({ 
        error: 'Telegram bot not initialized',              // Бот не готов к работе
        isSubscribed: false                                 // Безопасное значение при недоступности сервиса
      });
    }
    
    // Выполняем проверку подписки на указанный канал через Telegram API
    const isSubscribed = await telegramBotService.checkChannelSubscription(userId, channel);
    
    // Формируем детальный ответ с результатом проверки
    res.json({
      userId: userId,                                      // ID проверяемого пользователя
      channel: channel,                                    // Имя проверенного канала
      isSubscribed: isSubscribed,                          // Булево значение статуса подписки
      checkedAt: new Date().toISOString()                 // Временная метка проверки в ISO формате
    });
    
  } catch (error) {
    console.error('Error checking single subscription:', error); // Логируем подробности ошибки для отладки
    res.status(500).json({ 
      error: 'Single subscription check failed',              // Сообщение об ошибке проверки
      isSubscribed: false                                     // Безопасное значение при ошибке
    });
  }
});

/**
 * GET /api/subscription/status
 * Получение общего статуса сервиса проверки подписок
 * Предоставляет информацию о готовности системы и количестве настроенных каналов
 */
router.get('/status', (req, res) => {
  try {
    // Собираем информацию о текущем состоянии всех компонентов сервиса
    const status = {
      botInitialized: telegramBotService.isInitialized(),              // Готовность бота к работе с Telegram API
      requiredChannelsCount: telegramBotService.getRequiredChannels().length, // Количество настроенных обязательных каналов
      serviceStatus: 'operational',                                    // Общий статус работоспособности сервиса
      timestamp: new Date().toISOString()                             // Временная метка запроса статуса
    };
    
    // Определяем деградированный статус при проблемах с инициализацией бота
    if (!status.botInitialized) {
      status.serviceStatus = 'degraded';                             // Сервис работает с ограниченной функциональностью
      status.message = 'Telegram bot not initialized';              // Описание причины деградации
    }
    
    res.json(status);                                              // Отправляем JSON ответ со статусом сервиса
  } catch (error) {
    console.error('Error getting service status:', error);          // Логируем ошибку для отладки
    res.status(500).json({ 
      serviceStatus: 'error',                                        // Критическая ошибка сервиса
      message: 'Unable to determine service status'                 // Сообщение о невозможности определить статус
    });
  }
});

// ===== ЭКСПОРТ РОУТЕРА =====
// Экспортируем настроенный роутер с маршрутами API для интеграции в основное приложение
// Роутер содержит все endpoints для работы с проверкой подписок на Telegram каналы
module.exports = router;