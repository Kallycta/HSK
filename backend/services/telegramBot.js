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
      : [];  // Если не указано, то пустой массив
    
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
    try {
      // Создаем экземпляр бота без polling (не слушаем сообщения)
      this.bot = new TelegramBot(this.token, { polling: false });
      console.log('✅ Telegram Bot initialized');           // Успешная инициализация
      console.log('📋 Required channels:', this.requiredChannels); // Показываем список каналов
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
   * ===== ПРОВЕРКА ПОДПИСКИ НА ОДИН КАНАЛ =====
   * Проверяет подписку пользователя на указанный канал
   * @param {number} userId - ID пользователя Telegram
   * @param {string} channelUsername - Username канала (без @)
   * @returns {Promise<boolean>} - true если подписан, false если нет
   */
  async checkChannelSubscription(userId, channelUsername) {
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
      
      // Если канал не найден или бот не админ - считаем что не подписан
      if (error.response && error.response.error_code === 400) {
        return false;  // Возвращаем false при ошибке 400
      }
      
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