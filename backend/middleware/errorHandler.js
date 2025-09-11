/**
 * ===== MIDDLEWARE ДЛЯ ОБРАБОТКИ ОШИБОК =====
 * Содержит middleware для логирования запросов и обработки ошибок
 * Включает функции для цветного вывода, санитизации данных и форматирования
 */

// Импорт библиотеки для цветного вывода в консоль
const colors = require('colors');

/**
 * ===== ЛОГИРОВАНИЕ ЗАПРОСОВ =====
 * Middleware для логирования всех HTTP запросов с детальной информацией
 * Записывает метод, URL, IP, User-Agent и тело запроса (без чувствительных данных)
 */
const requestLogger = (req, res, next) => {
  // Получаем текущее время в формате ISO
  const timestamp = new Date().toISOString();
  
  // Извлекаем информацию о запросе
  const method = req.method;                                    // HTTP метод (GET, POST, etc.)
  const url = req.originalUrl;                                  // URL запроса
  const userAgent = req.get('User-Agent') || 'Unknown';        // Браузер/клиент
  const ip = req.ip || req.connection.remoteAddress;           // IP адрес клиента
  
  // Выводим основную информацию о запросе
  console.log(`📝 [${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Логируем тело запроса для POST/PUT (без чувствительных данных)
  if ((method === 'POST' || method === 'PUT') && req.body) {
    // Создаем копию тела запроса
    const safeBody = { ...req.body };
    
    // Удаляем чувствительные данные из логов для безопасности
    delete safeBody.password;   // Пароли
    delete safeBody.token;      // Токены
    delete safeBody.apiKey;     // API ключи
    
    // Выводим безопасные данные, если они есть
    if (Object.keys(safeBody).length > 0) {
      console.log(`📋 Request body:`, JSON.stringify(safeBody, null, 2));
    }
  }
  
  // Засекаем время начала обработки запроса для измерения производительности
  req.startTime = Date.now();
  
  // Перехватываем оригинальную функцию отправки ответа
  const originalSend = res.send;
  
  // Заменяем функцию отправки ответа на нашу с логированием
  res.send = function(data) {
    // Вычисляем время обработки запроса
    const duration = Date.now() - req.startTime;
    
    // Получаем код статуса ответа
    const statusCode = res.statusCode;
    
    // Выбираем эмодзи в зависимости от статуса
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    
    // Логируем завершение обработки запроса
    console.log(`${statusEmoji} [${timestamp}] ${method} ${url} - ${statusCode} (${duration}ms)`);
    
    // Логируем детали ошибок для отладки
    if (statusCode >= 400) {
      try {
        // Пытаемся распарсить JSON ответ
        const responseData = JSON.parse(data);
        if (responseData.error) {
          console.log(`🚨 Error response:`, responseData.error);
        }
      } catch (e) {
        // Игнорируем ошибки парсинга JSON
      }
    }
    
    // Вызываем оригинальную функцию отправки ответа
    originalSend.call(this, data);
  };
  
  // Передаем управление следующему middleware
  next();
};

/**
 * ===== ОБРАБОТЧИК 404 ОШИБОК =====
 * Middleware для обработки запросов к несуществующим маршрутам
 * Создает ошибку 404 и передает ее в глобальный обработчик ошибок
 */
const notFoundHandler = (req, res, next) => {
  // Создаем объект ошибки с описанием несуществующего маршрута
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;  // Устанавливаем HTTP статус 404 (Not Found)
  
  // Логируем попытку доступа к несуществующему эндпоинту
  console.log(
    colors.yellow('⚠️  404:'),                    // Предупреждение о 404
    colors.red(`${req.method} ${req.originalUrl}`), // Метод и URL запроса
    colors.gray(`from ${req.ip || 'unknown'}`)     // IP адрес клиента
  );
  
  // Передаем ошибку в следующий middleware (глобальный обработчик)
  next(error);
};

/**
 * ===== ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК =====
 * Центральный обработчик всех ошибок в приложении
 * Форматирует ошибки, логирует их и отправляет клиенту стандартизированный ответ
 */
const globalErrorHandler = (error, req, res, next) => {
  // Получаем информацию о запросе для логирования
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  
  // Извлекаем HTTP статус код из ошибки (по умолчанию 500 - Internal Server Error)
  const statusCode = error.status || error.statusCode || 500;
  
  // Логируем подробную информацию об ошибке для мониторинга
  console.error(`🔥 [${timestamp}] ERROR ${method} ${url}:`);
  console.error(`   Status: ${statusCode}`);
  console.error(`   Message: ${error.message}`);
  
  // В режиме разработки показываем полный стек ошибки для отладки
  if (process.env.NODE_ENV === 'development') {
    console.error(`   Stack: ${error.stack}`);
  }
  
  // Определяем понятное сообщение и тип ошибки для пользователя
  let userMessage = 'Internal server error';  // Сообщение по умолчанию для клиента
  let errorType = 'server_error';             // Тип ошибки для программной обработки
  
  // Выбираем подходящее сообщение в зависимости от HTTP статус кода
  switch (statusCode) {
    case 400:  // Неправильный запрос - ошибка в данных
      userMessage = 'Bad request';
      errorType = 'validation_error';
      break;
    case 401:  // Не авторизован - требуется аутентификация
      userMessage = 'Unauthorized';
      errorType = 'auth_error';
      break;
    case 403:  // Доступ запрещен - недостаточно прав
      userMessage = 'Forbidden';
      errorType = 'permission_error';
      break;
    case 404:  // Не найдено - ресурс не существует
      userMessage = 'Not found';
      errorType = 'not_found_error';
      break;
    case 429:  // Слишком много запросов - превышен лимит
      userMessage = 'Too many requests';
      errorType = 'rate_limit_error';
      break;
    case 503:  // Сервис недоступен - временная проблема
      userMessage = 'Service unavailable';
      errorType = 'service_error';
      break;
  }
  
  // Формируем JSON ответ для отправки клиенту
  const errorResponse = {
    error: errorType,                    // Тип ошибки для программной обработки
    message: error.message || userMessage,   // Сообщение об ошибке
    timestamp: timestamp,                     // Время возникновения ошибки
    path: url,                               // URL где произошла ошибка
    method: method                           // HTTP метод запроса
  };
  
  // В режиме разработки добавляем дополнительную информацию для отладки
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;       // Полный стек ошибки
    errorResponse.details = {
      originalError: error.name,             // Название типа ошибки
      statusCode: statusCode                 // Статус код
    };
  }
  
  // Специальная обработка для ошибок Telegram Bot API
  if (error.response && error.response.error_code) {
    // Добавляем информацию об ошибке от Telegram
    errorResponse.telegramError = {
      code: error.response.error_code,       // Код ошибки от Telegram
      description: error.response.description // Описание от Telegram
    };
    
    // Переводим некоторые ошибки Telegram на понятный язык
    switch (error.response.error_code) {
      case 400:  // Неправильный запрос к Telegram API
        if (error.response.description.includes('chat not found')) {
          errorResponse.message = 'Channel or chat not found';
        } else if (error.response.description.includes('user not found')) {
          errorResponse.message = 'User not found';
        }
        break;
      case 403:  // Доступ запрещен в Telegram API
        if (error.response.description.includes('bot was blocked')) {
          errorResponse.message = 'Bot was blocked by user';
        } else if (error.response.description.includes('not enough rights')) {
          errorResponse.message = 'Bot has insufficient permissions';
        }
        break;
    }
  }
  
  // Отправляем JSON ответ с ошибкой клиенту
  res.status(statusCode).json(errorResponse);
};

/**
 * ===== ОБРАБОТЧИК АСИНХРОННЫХ ОШИБОК =====
 * Wrapper функция для автоматической обработки ошибок в async middleware
 * Избавляет от необходимости писать try-catch в каждой async функции
 */
const asyncErrorHandler = (fn) => {
  // Возвращаем новую функцию middleware
  return (req, res, next) => {
    // Выполняем асинхронную функцию и автоматически ловим Promise ошибки
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * ===== ОБРАБОТЧИК JSON ОШИБОК =====
 * Специализированный обработчик для ошибок парсинга JSON в теле запроса
 * Перехватывает SyntaxError и возвращает понятное сообщение клиенту
 */
const jsonErrorHandler = (error, req, res, next) => {
  // Проверяем, является ли ошибка синтаксической ошибкой JSON (неверный формат)
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    // Логируем детали ошибки парсинга для отладки
    console.error('🚨 JSON Parse Error:', error.message);
    // Отправляем стандартизированный ответ с ошибкой парсинга
    return res.status(400).json({
      success: false,                           // Флаг неуспешного выполнения
      error: {
        type: 'json_parse_error',               // Тип ошибки для программной обработки
        message: 'Invalid JSON format',         // Понятное сообщение для клиента
        timestamp: new Date().toISOString()     // Временная метка ошибки
      }
    });
  }
  // Если это не ошибка JSON парсинга, передаем в следующий обработчик
  next(error);
};

/**
 * ===== ФУНКЦИИ ЛОГИРОВАНИЯ =====
 * Вспомогательные функции для цветного логирования различных типов событий
 * Обеспечивают единообразный формат вывода в консоль с цветовой индикацией
 */

/**
 * Функция для логирования информационных событий системы (общая информация)
 */
const logEvent = (event, data = {}) => {
  const timestamp = new Date().toISOString();           // Получаем текущее время
  console.log(colors.blue(`🎯 [${timestamp}] EVENT: ${event}`));      // Выводим событие с эмодзи синим цветом
  
  // Если есть дополнительные данные, выводим их серым цветом
  if (Object.keys(data).length > 0) {
    console.log(colors.gray(`   Data:`), colors.gray(JSON.stringify(data, null, 2))); // Форматированный JSON
  }
};

/**
 * Функция для логирования предупреждений (потенциальные проблемы)
 */
const logWarning = (message, data = {}) => {
  const timestamp = new Date().toISOString();           // Получаем текущее время
  console.warn(colors.yellow(`⚠️ [${timestamp}] WARNING: ${message}`)); // Выводим предупреждение желтым цветом
  
  // Если есть дополнительные данные, выводим их серым цветом
  if (Object.keys(data).length > 0) {
    console.warn(colors.gray(`   Data:`), colors.gray(JSON.stringify(data, null, 2))); // Форматированный JSON
  }
};

/**
 * Функция для логирования успешных операций (положительные результаты)
 */
const logSuccess = (message, data = {}) => {
  const timestamp = new Date().toISOString();           // Получаем текущее время
  console.log(colors.green(`✅ [${timestamp}] SUCCESS: ${message}`));   // Выводим успех с галочкой зеленым цветом
  
  // Если есть дополнительные данные, выводим их серым цветом
  if (Object.keys(data).length > 0) {
    console.log(colors.gray(`   Data:`), colors.gray(JSON.stringify(data, null, 2))); // Форматированный JSON
  }
};

/**
 * ===== ЭКСПОРТ МОДУЛЯ =====
 * Экспортируем все middleware и утилиты для использования в других частях приложения
 * Позволяет импортировать функции по отдельности или все сразу
 */
module.exports = {
  requestLogger,      // Middleware для логирования HTTP запросов
  notFoundHandler,    // Обработчик ошибок 404 (маршрут не найден)
  globalErrorHandler, // Центральный обработчик всех ошибок приложения
  asyncErrorHandler,  // Wrapper для автоматической обработки async ошибок
  jsonErrorHandler,   // Специализированный обработчик ошибок парсинга JSON
  logEvent,          // Утилита для логирования информационных событий
  logWarning,        // Утилита для логирования предупреждений
  logSuccess         // Утилита для логирования успешных операций
};