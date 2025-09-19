/**
 * Модуль для работы с Telegram Web App API
 */

class TelegramApp {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.isInitialized = false;
    this.user = null;
    this.subscriptionStatus = null;
    
    // Конфигурация API из глобальной конфигурации
    this.apiConfig = {
      baseUrl: window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000',
      apiKey: window.APP_CONFIG?.API_KEY || '881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac'
    };
    
    this.init();
  }
  
  /**
   * Инициализация Telegram Web App
   */
  init() {
    if (!this.tg) {
      console.warn('⚠️ Telegram Web App SDK not available');
      // В режиме разработки создаем mock объект
      this.createMockTelegram();
      return;
    }
    
    try {
      // Настраиваем внешний вид приложения
      this.tg.ready();
      this.tg.expand();
      
      // Настраиваем цвета под тему Telegram
      this.setupTheme();
      
      // Получаем данные пользователя
      this.user = this.tg.initDataUnsafe?.user;
      
      if (this.user) {
        console.log('✅ Telegram user:', this.user);
        this.isInitialized = true;
      } else {
        console.warn('⚠️ No user data available, creating mock user for development');
        // Если нет данных пользователя, создаем mock для разработки
        this.createMockTelegram();
      }
      
      // Настраиваем обработчики событий
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ Failed to initialize Telegram Web App:', error);
      // В случае ошибки также создаем mock для разработки
      this.createMockTelegram();
    }
  }
  
  /**
   * Создает mock объект для разработки вне Telegram
   */
  createMockTelegram() {
    this.tg = {
      ready: () => {},
      expand: () => {},
      close: () => {},
      initData: 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%2C%22language_code%22%3A%22ru%22%7D',
      initDataUnsafe: {
        user: {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'ru'
        }
      },
      themeParams: {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff'
      },
      MainButton: {
        text: '',
        color: '#2481cc',
        textColor: '#ffffff',
        isVisible: false,
        isActive: true,
        show: function() { this.isVisible = true; },
        hide: function() { this.isVisible = false; },
        enable: function() { this.isActive = true; },
        disable: function() { this.isActive = false; },
        setText: function(text) { this.text = text; },
        onClick: function(callback) { this.callback = callback; },
        offClick: function(callback) { delete this.callback; }
      },
      BackButton: {
        isVisible: false,
        show: function() { this.isVisible = true; },
        hide: function() { this.isVisible = false; },
        onClick: function(callback) { this.callback = callback; },
        offClick: function(callback) { delete this.callback; }
      }
    };
    
    this.user = this.tg.initDataUnsafe.user;
    this.isInitialized = true;
    console.log('🔧 Mock Telegram Web App initialized for development');
  }
  
  /**
   * Настройка темы приложения
   */
  setupTheme() {
    if (!this.tg.themeParams) return;
    
    const root = document.documentElement;
    const theme = this.tg.themeParams;
    
    // Применяем цвета Telegram к CSS переменным
    if (theme.bg_color) {
      root.style.setProperty('--tg-bg-color', theme.bg_color);
    }
    if (theme.text_color) {
      root.style.setProperty('--tg-text-color', theme.text_color);
    }
    if (theme.hint_color) {
      root.style.setProperty('--tg-hint-color', theme.hint_color);
    }
    if (theme.link_color) {
      root.style.setProperty('--tg-link-color', theme.link_color);
    }
    if (theme.button_color) {
      root.style.setProperty('--tg-button-color', theme.button_color);
    }
    if (theme.button_text_color) {
      root.style.setProperty('--tg-button-text-color', theme.button_text_color);
    }
  }
  
  /**
   * Настройка обработчиков событий
   */
  setupEventHandlers() {
    if (!this.tg) return;
    
    // Обработчик главной кнопки
    if (this.tg.MainButton && this.tg.MainButton.onClick) {
      this.tg.MainButton.onClick(() => {
        console.log('Main button clicked');
      });
    }
    
    // Обработчик кнопки назад
    if (this.tg.BackButton && this.tg.BackButton.onClick) {
      this.tg.BackButton.onClick(() => {
        console.log('Back button clicked');
      });
    }
    
    // Обработчик событий (если доступен)
    if (this.tg.onEvent) {
      this.tg.onEvent('mainButtonClicked', () => {
        console.log('Main button clicked via onEvent');
      });
      
      this.tg.onEvent('backButtonClicked', () => {
        console.log('Back button clicked via onEvent');
      });
    }
  }
  
  /**
   * Проверка подписок пользователя
   * @returns {Promise<Object>} Результат проверки подписок
   */
  async checkSubscriptions() {
    if (!this.user) {
      throw new Error('User not initialized');
    }
    
    try {
      // Получаем initData для Telegram Web App
      const initData = this.tg?.initData || '';
      
      console.log('🔍 Checking subscriptions...', {
        apiUrl: `${this.apiConfig.baseUrl}/api/subscription/check`,
        hasInitData: !!initData,
        userAgent: navigator.userAgent
      });
      
      const response = await fetch(`${this.apiConfig.baseUrl}/api/subscription/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiConfig.apiKey
        },
        body: JSON.stringify({
          userId: this.user?.id,
          initData: initData
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          url: response.url
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      this.subscriptionStatus = result;
      
      console.log('📋 Subscription check result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to check subscriptions:', error);
      
      // Детальное логирование ошибки
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('🌐 Network Error Details:', {
          message: 'Cannot connect to API server',
          possibleCauses: [
            'Backend server is not running',
            'CORS policy blocking request',
            'Network connectivity issues',
            'Incorrect API URL'
          ],
          currentConfig: this.apiConfig
        });
      }
      
      // Возвращаем fallback результат для разработки
      if (window.location.hostname === 'localhost') {
        console.warn('🔧 Development mode: Using fallback subscription result');
        const fallbackResult = {
          hasAccess: false,
          missingChannels: ['rust_live_13'],
          message: 'API недоступен (режим разработки)',
          error: true,
          fallback: true
        };
        this.subscriptionStatus = fallbackResult;
        return fallbackResult;
      }
      
      throw error;
    }
  }
  
  /**
   * Получение списка обязательных каналов
   * @returns {Promise<Object>} Список каналов
   */
  async getRequiredChannels() {
    try {
      const response = await fetch(`${this.apiConfig.baseUrl}/api/subscription/channels`, {
        headers: {
          'x-api-key': this.apiConfig.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📋 Required channels:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to get required channels:', error);
      throw error;
    }
  }
  
  /**
   * Показать главную кнопку Telegram
   * @param {string} text Текст кнопки
   * @param {Function} callback Обработчик нажатия
   */
  showMainButton(text, callback) {
    if (!this.tg.MainButton) return;
    
    this.tg.MainButton.setText(text);
    this.tg.MainButton.onClick(callback);
    this.tg.MainButton.show();
  }
  
  /**
   * Скрыть главную кнопку Telegram
   */
  hideMainButton() {
    if (!this.tg.MainButton) return;
    
    this.tg.MainButton.hide();
  }
  
  /**
   * Показать кнопку "Назад" Telegram
   * @param {Function} callback Обработчик нажатия
   */
  showBackButton(callback) {
    if (!this.tg.BackButton) return;
    
    this.tg.BackButton.onClick(callback);
    this.tg.BackButton.show();
  }
  
  /**
   * Скрыть кнопку "Назад" Telegram
   */
  hideBackButton() {
    if (!this.tg.BackButton) return;
    
    this.tg.BackButton.hide();
  }
  
  /**
   * Закрыть приложение
   */
  close() {
    if (this.tg.close) {
      this.tg.close();
    }
  }
  
  /**
   * Показать уведомление
   * @param {string} message Текст уведомления
   */
  showAlert(message) {
    if (this.tg.showAlert) {
      this.tg.showAlert(message);
    } else {
      alert(message);
    }
  }
  
  /**
   * Показать подтверждение
   * @param {string} message Текст подтверждения
   * @returns {Promise<boolean>} Результат подтверждения
   */
  showConfirm(message) {
    return new Promise((resolve) => {
      if (this.tg.showConfirm) {
        this.tg.showConfirm(message, resolve);
      } else {
        resolve(confirm(message));
      }
    });
  }
  
  /**
   * Открыть ссылку
   * @param {string} url URL для открытия
   */
  openLink(url) {
    if (this.tg.openLink) {
      this.tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }
  
  /**
   * Получить данные пользователя
   * @returns {Object|null} Данные пользователя
   */
  getUser() {
    return this.user;
  }
  
  /**
   * Проверить, инициализировано ли приложение
   * @returns {boolean} Статус инициализации
   */
  isReady() {
    return this.isInitialized && this.user !== null;
  }
  
  /**
   * Получить последний статус подписок
   * @returns {Object|null} Статус подписок
   */
  getSubscriptionStatus() {
    return this.subscriptionStatus;
  }
  
  /**
   * Проверить, есть ли доступ к приложению
   * @returns {boolean} Есть ли доступ
   */
  hasAccess() {
    return this.subscriptionStatus?.hasAccess === true;
  }
}

// Создаем глобальный экземпляр
window.telegramApp = new TelegramApp();

// Экспортируем для использования в модулях
export default TelegramApp;