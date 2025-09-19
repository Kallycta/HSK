// ===== ИМПОРТЫ =====
const TelegramBot = require('node-telegram-bot-api'); // Библиотека для работы с Telegram Bot API
const axios = require('axios');                        // HTTP клиент для запросов

/**
 * ===== СЕРВИС TELEGRAM БОТА =====
 * Класс для работы с Telegram Bot API и проверки подписок на каналы
 */
class TelegramBotService {
  /**
   * Конструктор - создает экземпляр сервиса
   */
  constructor() {
    // Получаем токен бота из переменных окружения
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.bot = null;  // Экземпляр бота (пока не создан)
    
    // Парсим список обязательных каналов из переменных окружения
    this.requiredChannels = process.env.REQUIRED_CHANNELS 
      ? process.env.REQUIRED_CHANNELS.split(',').map(ch => ch.trim()) // Разделяем по запятой и убираем пробелы
      : ['hsk_channel', 'chinese_learning', 'mandarin_practice'];  // Fallback каналы для разработки
    
    console.log('📋 Required channels initialized:', this.requiredChannels);
    
    // Если токен есть, инициализируем бота
    if (this.token) {
      this.initBot();
    } else {
      console.error('❌ TELEGRAM_BOT_TOKEN not provided'); // Ошибка если токен не указан
    }
  }

  /**
   * Инициализация экземпляра бота
   */
  initBot() {
    //log
    try {
      // Создаем экземпляр бота с polling для обработки команд
       // Создаем экземпляр бота с polling для обработки команд
      this.bot = new TelegramBot(this.token, { polling: true });
      console.log('✅ Telegram Bot initialized');           // Успешная инициализация
      console.log('📋 Required channels:', this.requiredChannels); // Показываем список каналов
      
      // Настраиваем обработчики команд
      this.setupCommandHandlers();
    } catch (error) {
      console.error('❌ Failed to initialize Telegram Bot:', error.message); // Ошибка инициализации
    }
  }

  /**
   * ===== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ =====
   * Полная инициализация бота с проверками соединения и каналов
   */
  async initialize() {
    // Проверяем наличие токена бота в переменных окружения
    if (!this.token) {
      throw new Error('Telegram bot token is not provided'); // Выбрасываем ошибку если токен отсутствует
    }

    // Если экземпляр бота еще не создан, создаем его
    if (!this.bot) {
      this.initBot(); // Вызываем метод создания экземпляра бота
    }

    try {
      // Проверяем соединение с Telegram Bot API и получаем информацию о боте
      const botInfo = await this.bot.getMe();
      console.log(`✅ Bot connected: @${botInfo.username}`); // Логируем успешное подключение
      
      // Проверяем доступность всех обязательных каналов
      await this.validateChannels();
      
      return true; // Возвращаем true при успешной инициализации
    } catch (error) {
      console.error('❌ Bot initialization failed:', error.message); // Логируем ошибку
      throw error; // Перебрасываем ошибку выше для обработки
    }
  }

  /**
   * ===== ПРОВЕРКА ДОСТУПНОСТИ КАНАЛОВ =====
   * Проверяет что бот может получить информацию о всех обязательных каналах
   */
  async validateChannels() {
    if (this.requiredChannels.length === 0) {
      console.log('📋 No required channels to validate');
      return;
    }

    console.log('🔍 Validating channels access...');
    
    for (const channel of this.requiredChannels) {
      try {
        const channelName = channel.startsWith('@') ? channel : `@${channel}`;
        // Пытаемся получить информацию о канале
        await this.bot.getChat(channelName);
        console.log(`✅ Channel ${channelName} is accessible`);
      } catch (error) {
        console.warn(`⚠️ Channel ${channel} may not be accessible: ${error.message}`);
        // Не выбрасываем ошибку, просто предупреждаем
      }
    }
  }

  /**
   * ===== ПРОВЕРКА ПОДПИСКИ НА ОДИН КАНАЛ =====
   * Проверяет подписку пользователя на указанный канал
   * @param {number} userId - ID пользователя Telegram
   * @param {string} channelUsername - Username канала (без @)
   * @returns {Promise<boolean>} - true если подписан, false если нет
   */
  async checkChannelSubscription(userId, channelUsername) {
    console.log(`🔍 Starting subscription check for user ${userId} to channel ${channelUsername}`);
    
    // Проверяем что бот инициализирован
    if (!this.bot) {
      throw new Error('Telegram Bot not initialized');
    }

    try {
      // Добавляем @ к имени канала если его нет
      const channel = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
      
      // Получаем информацию о пользователе в канале
      const chatMember = await this.bot.getChatMember(channel, userId);
      
      // Проверяем статус участника (разрешенные статусы)
      const allowedStatuses = ['creator', 'administrator', 'member'];
      const isSubscribed = allowedStatuses.includes(chatMember.status);
      
      // Логируем результат проверки
      console.log(`👤 User ${userId} subscription to ${channel}: ${isSubscribed ? '✅' : '❌'}`);
      return isSubscribed;  // Возвращаем результат
      
    } catch (error) {
      // Логируем ошибку проверки подписки
      console.error(`❌ Error checking subscription for user ${userId} to ${channelUsername}:`, error.message);
      console.log('🔍 Error details:', JSON.stringify(error.response || error.body || error, null, 2));
      
      // Проверяем разные структуры ошибок от Telegram API
      const errorData = error.response || error.body || {};
      const statusCode = errorData.error_code || (error.response && error.response.statusCode) || error.statusCode;
      const description = errorData.description || (error.body && error.body.description) || error.message || '';
      
      console.log(`🔍 Status code: ${statusCode}, Description: ${description}`);
      
      // Если канал не найден, бот не админ, или пользователь недействителен - считаем что не подписан
      if (statusCode === 400) {
        if (description.includes('PARTICIPANT_ID_INVALID')) {
          console.warn(`⚠️ Invalid user ID ${userId} - user may not exist or bot cannot access user info`);
          return false;  // Возвращаем false для недействительного пользователя
        } else if (description.includes('CHAT_NOT_FOUND')) {
          console.warn(`⚠️ Channel ${channelUsername} not found or bot is not admin`);
          return false;  // Возвращаем false для недоступного канала
        }
        return false;  // Возвращаем false при любой ошибке 400
      }
      
      console.error('🚨 Throwing error:', error);
      throw error;  // Пробрасываем другие ошибки
    }
  }

  /**
   * ===== ПРОВЕРКА ВСЕХ ПОДПИСОК =====
   * Проверяет подписку пользователя на все обязательные каналы
   * @param {number} userId - ID пользователя Telegram
   * @returns {Promise<Object>} - Объект с результатами проверки
   */
  async checkAllSubscriptions(userId) {
    // Проверяем что бот инициализирован
    if (!this.bot) {
      throw new Error('Telegram Bot not initialized');
    }

    // Если нет обязательных каналов, считаем что все подписки есть
    if (this.requiredChannels.length === 0) {
      return {
        allSubscribed: true,     // Все подписки есть
        subscriptions: {},       // Пустой объект подписок
        missingChannels: []      // Нет отсутствующих каналов
      };
    }

    const results = {};          // Результаты проверки каждого канала
    const missingChannels = [];  // Список каналов без подписки

    // Проверяем каждый канал из списка обязательных
    for (const channel of this.requiredChannels) {
      try {
        // Проверяем подписку на текущий канал
        const isSubscribed = await this.checkChannelSubscription(userId, channel);
        results[channel] = isSubscribed;  // Сохраняем результат
        
        // Если не подписан, добавляем в список отсутствующих
        if (!isSubscribed) {
          missingChannels.push(channel);
        }
      } catch (error) {
        // При ошибке считаем что не подписан
        console.error(`Error checking channel ${channel}:`, error.message);
        results[channel] = false;         // Помечаем как не подписан
        missingChannels.push(channel);    // Добавляем в отсутствующие
      }
    }

    // Определяем есть ли все подписки (нет отсутствующих каналов)
    const allSubscribed = missingChannels.length === 0;

    // Возвращаем полный отчет о подписках
    return {
      allSubscribed,                              // Есть ли все подписки
      subscriptions: results,                     // Детали по каждому каналу
      missingChannels,                           // Список отсутствующих подписок
      totalChannels: this.requiredChannels.length // Общее количество каналов
    };
  }

  /**
   * ===== ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ =====
   * Получает информацию о пользователе Telegram
   * @param {number} userId - ID пользователя
   * @returns {Promise<Object>} - Информация о пользователе
   */
  async getUserInfo(userId) {
    // Проверяем что бот инициализирован
    if (!this.bot) {
      throw new Error('Telegram Bot not initialized');
    }

    try {
      // Используем getChat для получения информации о пользователе
      const userInfo = await this.bot.getChat(userId);
      // Возвращаем только нужные поля пользователя
      return {
        id: userInfo.id,                    // ID пользователя
        first_name: userInfo.first_name,    // Имя
        last_name: userInfo.last_name,      // Фамилия
        username: userInfo.username,        // Username (@username)
        type: userInfo.type                 // Тип чата (private для пользователя)
      };
    } catch (error) {
      // Логируем и пробрасываем ошибку
      console.error(`Error getting user info for ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * ===== ОТПРАВКА СООБЩЕНИЙ =====
   * Отправляет сообщение пользователю
   * @param {number} userId - ID пользователя
   * @param {string} message - Текст сообщения
   * @param {Object} options - Дополнительные опции
   */
  async sendMessage(userId, message, options = {}) {
    // Проверяем что бот инициализирован
    if (!this.bot) {
      throw new Error('Telegram Bot not initialized');
    }

    try {
      // Отправляем сообщение через Telegram Bot API
      return await this.bot.sendMessage(userId, message, options);
    } catch (error) {
      // Логируем и пробрасываем ошибку отправки
      console.error(`Error sending message to ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * ===== СОЗДАНИЕ КЛАВИАТУРЫ =====
   * Создает инлайн клавиатуру с кнопками подписки на каналы
   * @returns {Object} - Объект клавиатуры для Telegram
   */
  createSubscriptionKeyboard() {
    // Создаем кнопки для каждого обязательного канала
    const keyboard = this.requiredChannels.map(channel => {
      const channelUrl = `https://t.me/${channel}`;  // Формируем URL канала
      return [{
        text: `📢 Подписаться на @${channel}`,  // Текст кнопки
        url: channelUrl                            // Ссылка на канал
      }];
    });

    // Добавляем кнопку "Проверить подписки" в конце
    keyboard.push([{
      text: '✅ Проверить подписки',              // Текст кнопки проверки
      callback_data: 'check_subscriptions'       // Данные для обработки нажатия
    }]);

    // Возвращаем объект клавиатуры в формате Telegram
    return {
      inline_keyboard: keyboard  // Инлайн клавиатура
    };
  }

  /**
   * ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
   * Получает список обязательных каналов
   * @returns {Array} - Массив названий каналов
   */
  getRequiredChannels() {
    return this.requiredChannels;  // Возвращаем массив каналов
  }

  /**
   * Настройка обработчиков команд бота
   */
  setupCommandHandlers() {
    if (!this.bot) return;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    // Обработчик команды /start
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `🎯 Добро пожаловать в HSK Subscription Checker!

Этот бот поможет проверить ваши подписки на необходимые каналы.

📱 Нажмите кнопку "Открыть приложение" в меню или используйте команду /app`;
      
      this.bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📱 Открыть приложение',
              web_app: { url: frontendUrl }
            }
          ]]
        }
      });
    });

    // Обработчик команды /app
    this.bot.onText(/\/app/, (msg) => {
      const chatId = msg.chat.id;
      
      this.bot.sendMessage(chatId, '📱 Открываю приложение проверки подписок...', {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🚀 Запустить приложение',
              web_app: { url: frontendUrl }
            }
          ]]
        }
      });
    });

    // Обработчик команды /help
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `🆘 Помощь по использованию бота

📋 Доступные команды:
/start - Начать работу с ботом
/app - Открыть приложение проверки подписок
/help - Показать это сообщение

❓ Как использовать:
1. Нажмите "Открыть приложение"
2. Приложение проверит ваши подписки
3. Подпишитесь на необходимые каналы
4. Получите доступ к материалам`;
      
      this.bot.sendMessage(chatId, helpMessage);
    });

    // Настройка команд меню
    this.bot.setMyCommands([
      { command: 'start', description: 'Запустить бота' },
      { command: 'app', description: 'Открыть приложение проверки подписок' },
      { command: 'help', description: 'Помощь' }
    ]);

    console.log('✅ Bot command handlers configured');
  }

  /**
   * Проверяет, инициализирован ли бот
   * @returns {boolean} - true если бот готов к работе
   */
  isInitialized() {
    return this.bot !== null;  // Проверяем что экземпляр бота создан
  }
}

// ===== СОЗДАНИЕ И ЭКСПОРТ СЕРВИСА =====
// Создаем единственный экземпляр сервиса (паттерн Singleton)
const telegramBotService = new TelegramBotService();

// Экспортируем готовый экземпляр для использования в других файлах
module.exports = telegramBotService;