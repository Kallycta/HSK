// ===== ИМПОРТЫ И НАСТРОЙКА =====
const express = require('express');                          // Фреймворк для создания веб-сервера
const telegramBotService = require('../services/telegramBot'); // Сервис для работы с Telegram ботом
const router = express.Router();                             // Создаем роутер для обработки маршрутов

/**
 * ===== MIDDLEWARE ДЛЯ БЕЗОПАСНОСТИ =====
 * Middleware для проверки API ключа
 *  * Middleware для проверки API ключа
 *  * Middleware для проверки API ключа
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];    // Получаем API ключ из заголовков
  const expectedApiKey = process.env.API_KEY; // Ожидаемый ключ из переменных окружения
  
  // Если API ключ не настроен в окружении, пропускаем проверку
  if (!expectedApiKey) {
    return next(); // Переходим к следующему middleware
  }
  
  // Проверяем наличие и корректность API ключа
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'Invalid or missing API key' }); // Возвращаем ошибку 401
  }
  
  next(); // Переходим к следующему middleware
};

/**
 * ===== API МАРШРУТЫ =====
 * GET /api/telegram/bot-info
 * Получение информации о боте
 */
router.get('/bot-info', validateApiKey, async (req, res) => {
  try {
    // Проверяем что бот инициализирован и готов к работе
    if (!telegramBotService.isInitialized()) {
      return res.status(503).json({ 
        error: 'Telegram bot not initialized', // Бот не инициализирован
        initialized: false                    // Статус инициализации
      });
    }

    // Получаем список обязательных каналов
    const requiredChannels = telegramBotService.getRequiredChannels();
    
    // Отправляем информацию о боте
    res.json({
      initialized: true,                              // Бот инициализирован
      requiredChannels,                               // Список каналов
      totalChannels: requiredChannels.length,         // Количество каналов
      botUsername: process.env.TELEGRAM_BOT_USERNAME  // Имя пользователя бота
    });
  } catch (error) {
    console.error('Error getting bot info:', error); // Логируем ошибку
    res.status(500).json({ error: 'Failed to get bot information' }); // Ошибка сервера
  }
});

/**
 * POST /api/telegram/webhook
 * Обработка webhook от Telegram
 */
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body; // Получаем данные обновления от Telegram
    
    // Обработка обычных сообщений
    if (update.message) {
      await handleMessage(update.message); // Обрабатываем текстовые сообщения
    }
    
    // Обработка callback запросов (inline кнопки)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query); // Обрабатываем нажатия на кнопки
    }
    
    res.status(200).json({ ok: true }); // Отправляем подтверждение Telegram
  } catch (error) {
    console.error('Webhook error:', error); // Логируем ошибку
    res.status(500).json({ error: 'Webhook processing failed' }); // Возвращаем ошибку сервера
  }
});

// ===== ОБРАБОТЧИКИ СООБЩЕНИЙ =====

/**
 * Обработка обычных сообщений
 */
async function handleMessage(message) {
  const chatId = message.chat.id; // ID чата для отправки ответа
  const text = message.text; // Текст сообщения от пользователя
  const userId = message.from.id; // ID пользователя

  console.log(`📨 Message from ${userId}: ${text}`); // Логируем входящее сообщение

  try {
    if (text === '/start') {
      await handleStartCommand(chatId, userId, message.from); // Обрабатываем команду старт
    } else if (text === '/check') {
      await handleCheckCommand(chatId, userId); // Обрабатываем команду проверки подписки
    } else if (text === '/help') {
      await handleHelpCommand(chatId); // Обрабатываем команду помощи
    } else {
      // Неизвестная команда
      await telegramBotService.sendMessage(chatId, 
        '❓ Неизвестная команда. Используйте /help для получения списка команд.'); // Сообщение о неизвестной команде
    }
  } catch (error) {
    console.error('Error handling message:', error); // Логируем ошибку обработки
    await telegramBotService.sendMessage(chatId, 
      '❌ Произошла ошибка при обработке сообщения.'); // Уведомляем пользователя об ошибке
  }
}

/**
 * Обработка callback запросов
 */
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id; // ID чата из сообщения с кнопкой
  const userId = callbackQuery.from.id; // ID пользователя, нажавшего кнопку
  const data = callbackQuery.data; // Данные кнопки (callback_data)

  console.log(`🔘 Callback from ${userId}: ${data}`); // Логируем нажатие кнопки

  try {
    if (data === 'check_subscriptions') {
      await handleCheckCommand(chatId, userId); // Проверяем подписки при нажатии кнопки
    }
    
    // Отвечаем на callback query чтобы убрать "loading" состояние
    // Это делается через прямой API вызов, так как node-telegram-bot-api может не поддерживать answerCallbackQuery
  } catch (error) {
    console.error('Error handling callback query:', error); // Логируем ошибку обработки callback
  }
}

/**
 * Обработка команды /start
 */
async function handleStartCommand(chatId, userId, userInfo) {
  const welcomeMessage = `👋 Добро пожаловать в HSK-тренер!

` +
    `🎯 Это приложение поможет вам изучать китайский язык на уровне HSK-1.

` +
    `📋 Для доступа к приложению необходимо подписаться на следующие каналы:\n`; // Приветственное сообщение

  const channels = telegramBotService.getRequiredChannels(); // Получаем список обязательных каналов
  let channelsList = ''; // Строка со списком каналов
  
  channels.forEach((channel, index) => {
    channelsList += `${index + 1}. @${channel}\n`; // Формируем нумерованный список каналов
  });

  const fullMessage = welcomeMessage + channelsList + 
    `\n✅ После подписки нажмите кнопку "Проверить подписки" или используйте команду /check`; // Полное сообщение с инструкциями

  const keyboard = telegramBotService.createSubscriptionKeyboard(); // Создаем клавиатуру с кнопкой проверки
  
  await telegramBotService.sendMessage(chatId, fullMessage, {
    reply_markup: keyboard, // Прикрепляем клавиатуру к сообщению
    parse_mode: 'HTML' // Используем HTML разметку
  });
}

/**
 * Обработка команды /check
 */
async function handleCheckCommand(chatId, userId) {
  try {
    const subscriptionResult = await telegramBotService.checkAllSubscriptions(userId); // Проверяем подписки пользователя
    
    if (subscriptionResult.allSubscribed) {
      const successMessage = `✅ Отлично! Вы подписаны на все необходимые каналы.\n\n` +
        `🎮 Теперь вы можете запустить HSK-тренер и начать изучение китайского языка!\n\n` +
        `🔗 Нажмите кнопку ниже, чтобы открыть приложение:`; // Сообщение об успешной проверке
      
      const appKeyboard = {
        inline_keyboard: [[
          {
            text: '🚀 Открыть HSK-тренер', // Текст кнопки
            web_app: { url: process.env.FRONTEND_URL } // URL веб-приложения из переменных окружения
          }
        ]]
      }; // Клавиатура с кнопкой запуска приложения
      
      await telegramBotService.sendMessage(chatId, successMessage, {
        reply_markup: appKeyboard, // Прикрепляем клавиатуру
        parse_mode: 'HTML' // Используем HTML разметку
      });
    } else {
      let message = `❌ Вы не подписаны на следующие каналы:\n\n`; // Начало сообщения об отсутствующих подписках
      
      subscriptionResult.missingChannels.forEach((channel, index) => {
        message += `${index + 1}. @${channel}\n`; // Добавляем каждый канал в список
      });
      
      message += `\n📢 Пожалуйста, подпишитесь на все каналы и повторите проверку.`; // Инструкция для пользователя
      
      const keyboard = telegramBotService.createSubscriptionKeyboard(); // Создаем клавиатуру для повторной проверки
      
      await telegramBotService.sendMessage(chatId, message, {
        reply_markup: keyboard, // Прикрепляем клавиатуру
        parse_mode: 'HTML' // Используем HTML разметку
      });
    }
  } catch (error) {
    console.error('Error in check command:', error); // Логируем ошибку
    await telegramBotService.sendMessage(chatId, 
      '❌ Произошла ошибка при проверке подписок. Попробуйте позже.'); // Уведомляем пользователя об ошибке
  }
}

/**
 * Обработка команды /help
 */
async function handleHelpCommand(chatId) {
  const helpMessage = `📖 Доступные команды:\n\n` +
    `🔸 /start - Начать работу с ботом\n` +
    `🔸 /check - Проверить подписки на каналы\n` +
    `🔸 /help - Показать это сообщение\n\n` +
    `❓ Если у вас есть вопросы, обратитесь к администратору.`; // Справочное сообщение со списком команд

  await telegramBotService.sendMessage(chatId, helpMessage, {
    parse_mode: 'HTML' // Используем HTML разметку
  });
}

// ===== ЭКСПОРТ РОУТЕРА =====
module.exports = router; // Экспортируем роутер для использования в основном приложении