/**
 * Компонент для проверки подписок на каналы
 */

class SubscriptionCheck {
  constructor() {
    this.isChecking = false;
    this.hasAccess = false;
    this.requiredChannels = [];
    this.subscriptionData = null;
    
    this.init();
  }
  
  /**
   * Инициализация компонента
   */
  init() {
    this.createSubscriptionModal();
    this.bindEvents();
  }
  
  /**
   * Создание модального окна для проверки подписок
   */
  createSubscriptionModal() {
    const modalHTML = `
      <div id="subscription-modal" class="subscription-modal hidden">
        <div class="subscription-content">
          <div class="subscription-header">
            <h2>🔐 Проверка подписок</h2>
            <p>Для доступа к приложению необходимо подписаться на наши каналы</p>
          </div>
          
          <div id="subscription-status" class="subscription-status">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Проверяем подписки...</p>
            </div>
          </div>
          
          <div id="channels-list" class="channels-list hidden"></div>
          
          <div class="subscription-actions">
            <button id="check-subscription-btn" class="btn btn-primary" onclick="window.subscriptionCheck.checkSubscriptions()">
              <span class="btn-spinner hidden"></span>
              <span class="btn-text">Проверить подписку</span>
            </button>
            
            <button id="open-app-btn" class="btn btn-success hidden" onclick="window.subscriptionCheck.openApp()">
              Открыть приложение
            </button>
          </div>

        </div>
      </div>
      <style>
        .subscription-actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        
        .subscription-actions button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        #check-subscription-btn {
          background: #007bff;
          color: white;
        }
        
        #check-subscription-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        
        #check-subscription-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        #open-app-btn {
          background: #28a745;
          color: white;
        }
        
        #open-app-btn:hover {
          background: #1e7e34;
        }
        
        .hidden {
          display: none !important;
        }
      </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  
  /**
   * Привязка событий
   */
  bindEvents() {
    // Закрытие модального окна
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    // Закрытие по клику на фон
    const modal = document.getElementById('subscription-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hide();
        }
      });
    }
    
    // Кнопка проверки подписки
    const checkBtn = document.getElementById('check-subscription-btn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkSubscriptions());
    }
    
    // Кнопка открытия приложения
    const openAppBtn = document.getElementById('open-app-btn');
    if (openAppBtn) {
      openAppBtn.addEventListener('click', () => this.openApp());
    }
  }
  
  /**
   * Показать модальное окно проверки подписок
   */
  async show() {
    const modal = document.getElementById('subscription-modal');
    if (!modal) {
      console.error('Subscription modal not found in DOM');
      return;
    }
    
    console.log('📋 Showing subscription modal');
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    // Загружаем список каналов
    console.log('📋 Loading required channels...');
    await this.loadRequiredChannels();
    
    // Автоматически проверяем подписки при первой загрузке
    console.log('📋 Starting automatic subscription check...');
    await this.checkSubscriptions();
  }
  
  /**
   * Скрыть модальное окно
   */
  hide() {
    const modal = document.getElementById('subscription-modal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
  
  /**
   * Загрузка списка обязательных каналов
   */
  async loadRequiredChannels() {
    try {
      console.log('📋 Starting to load required channels...');
      this.showLoading('Загружаем список каналов...');
      
      console.log('📋 Calling telegramApp.getRequiredChannels()...');
      const channels = await window.telegramApp.getRequiredChannels();
      console.log('📋 Received channels response:', channels);
      
      this.requiredChannels = channels.channels || [];
      console.log('📋 Set requiredChannels:', this.requiredChannels);
      
      this.renderChannelsList();
      this.hideLoading();
      
    } catch (error) {
      console.error('❌ Failed to load channels:', error);
      this.showError('Не удалось загрузить список каналов. Проверьте подключение к интернету.');
    }
  }
  
  /**
   * Отображение списка каналов
   */
  renderChannelsList() {
    const channelsList = document.getElementById('channels-list');
    console.log('📋 Rendering channels list:', {
      channelsList: !!channelsList,
      requiredChannels: this.requiredChannels,
      channelsCount: this.requiredChannels?.length || 0
    });
    
    if (!channelsList) {
      console.error('❌ channels-list element not found in DOM');
      return;
    }
    
    if (!this.requiredChannels.length) {
      console.warn('⚠️ No required channels to display');
      channelsList.innerHTML = '<p>Нет обязательных каналов для подписки</p>';
      return;
    }
    
    const channelsHTML = `
      <h3>📋 Обязательные каналы:</h3>
      <div class="channels-grid">
        ${this.requiredChannels.map(channel => `
          <div class="channel-item" data-channel="${channel.channel_username}">
                    <div class="channel-info">
                        <span class="channel-status" id="status-${channel.channel_username}">❓</span>
                        <span class="channel-name">${channel.name}</span>
                        <a href="https://t.me/${channel.channel_username}" target="_blank" class="channel-link">
              Подписаться
            </a>
          </div>
        `).join('')}
      </div>
    `;
    
    console.log('📋 Setting channels HTML:', channelsHTML.substring(0, 200) + '...');
    channelsList.innerHTML = channelsHTML;
    channelsList.classList.remove('hidden');
    
    // Добавляем обработчики для ссылок каналов
    this.bindChannelLinks();
  }
  
  /**
   * Привязка обработчиков для ссылок каналов
   */
  bindChannelLinks() {
    const channelLinks = document.querySelectorAll('.channel-link');
    
    channelLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = link.getAttribute('href');
        
        // Открываем ссылку через Telegram Web App API
        if (window.telegramApp && window.telegramApp.openLink) {
          window.telegramApp.openLink(url);
        } else {
          window.open(url, '_blank');
        }
        
        // Показываем подсказку
        this.showChannelHint(link);
      });
    });
  }
  
  /**
   * Показать подсказку после клика на канал
   */
  showChannelHint(linkElement) {
    const originalText = linkElement.textContent;
    linkElement.textContent = '✅ Открыто';
    linkElement.style.background = '#4CAF50';
    
    setTimeout(() => {
      linkElement.textContent = originalText;
      linkElement.style.background = '';
    }, 2000);
    
    // Автоматически проверяем подписки через 3 секунды
    setTimeout(() => {
      this.checkSubscriptions();
    }, 3000);
  }
  
  /**
   * Проверка подписок пользователя
   */
  async checkSubscriptions() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    this.updateCheckButton(true);
    this.showCheckingStatus('Проверяем ваши подписки...');
    
    try {
      const result = await window.telegramApp.checkSubscriptions();
      this.subscriptionData = result;
      this.hasAccess = result.hasAccess;
      
      if (result.hasAccess) {
        this.showSuccess();
      } else {
        this.showSubscriptionResults(result);
      }
      
    } catch (error) {
      console.error('Subscription check failed:', error);
      
      // Показываем более детальную ошибку
      let errorMessage = 'Не удалось проверить подписки. Попробуйте еще раз.';
      
      if (error.message && error.message.includes('HTTP 400')) {
        errorMessage = 'Ошибка данных Telegram. Перезапустите приложение.';
      } else if (error.message && error.message.includes('HTTP 503')) {
        errorMessage = 'Сервис временно недоступен. Попробуйте позже.';
      }
      
      this.showError(errorMessage);
    } finally {
      this.isChecking = false;
      this.updateCheckButton(false);
    }
  }
  
  /**
   * Показать результаты проверки подписок
   */
  showSubscriptionResults(result) {
    const statusDiv = document.getElementById('subscription-status');
    const channelsList = document.getElementById('channels-list');
    const openAppBtn = document.getElementById('open-app-btn');
    if (!statusDiv) return;
    
    // Обновляем статусы каналов
    this.updateChannelStatuses(result.subscriptions);
    
    const missingCount = result.missingChannels?.length || 0;
    const totalCount = result.totalChannels || 0;
    const subscribedCount = totalCount - missingCount;
    
    // Показываем результат над списком каналов
    statusDiv.innerHTML = `
      <div class="subscription-result">
        <div class="result-icon">❌</div>
        <h3>Вы не подписаны на все необходимые каналы</h3>
        <p>Подписано: <strong>${subscribedCount}/${totalCount}</strong> каналов</p>
        ${missingCount > 0 ? `
          <div class="missing-channels">
            <p>Необходимо подписаться еще на <strong>${missingCount}</strong> канал(ов):</p>
            <ul>
              ${result.missingChannels.map(channel => `
                <li>@${channel}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        <p class="help-text">Подпишитесь на все каналы и нажмите "Проверить подписку".</p>
      </div>
    `;
    
    // Скрываем кнопку "Открыть приложение"
    if (openAppBtn) {
      openAppBtn.classList.add('hidden');
    }
    
    // Убеждаемся, что список каналов остается видимым
    if (channelsList) {
      channelsList.classList.remove('hidden');
    }
  }
  
  /**
   * Обновить статусы каналов в списке
   */
  updateChannelStatuses(subscriptions) {
    if (!subscriptions) return;
    
    Object.entries(subscriptions).forEach(([channel, isSubscribed]) => {
      const statusElement = document.getElementById(`status-${channel}`);
      if (statusElement) {
        statusElement.textContent = isSubscribed ? '✅' : '❌';
        statusElement.title = isSubscribed ? 'Подписан' : 'Не подписан';
      }
    });
  }
  
  /**
   * Показать успешный результат
   */
  showSuccess() {
    const statusDiv = document.getElementById('subscription-status');
    const channelsList = document.getElementById('channels-list');
    const openAppBtn = document.getElementById('open-app-btn');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `
      <div class="subscription-result success">
        <div class="result-icon">✅</div>
        <h3>Вы подписаны на все необходимые каналы</h3>
        <p class="success-text">Отлично! Теперь вы можете пользоваться приложением.</p>
      </div>
    `;
    
    // Показываем кнопку "Открыть приложение"
    if (openAppBtn) {
      openAppBtn.classList.remove('hidden');
    }
    
    // Убеждаемся, что список каналов остается видимым
    if (channelsList) {
      channelsList.classList.remove('hidden');
    }
  }
  
  /**
   * Показать состояние загрузки
   */
  showLoading(message) {
    const statusDiv = document.getElementById('subscription-status');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }
  
  /**
   * Скрыть состояние загрузки
   */
  hideLoading() {
    const statusDiv = document.getElementById('subscription-status');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = '';
  }
  
  /**
   * Показать статус проверки подписок (не скрывая каналы)
   */
  showCheckingStatus(message) {
    const statusDiv = document.getElementById('subscription-status');
    const channelsList = document.getElementById('channels-list');
    if (!statusDiv) return;
    
    // Очищаем предыдущие статусы и показываем только статус проверки
    statusDiv.innerHTML = `
      <div class="checking-status">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    
    // Убеждаемся, что список каналов остается видимым
    if (channelsList) {
      channelsList.classList.remove('hidden');
    }
  }
  
  /**
   * Показать ошибку
   */
  showError(message) {
    const statusDiv = document.getElementById('subscription-status');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `
      <div class="subscription-result error">
        <div class="result-icon">❌</div>
        <h3>Ошибка</h3>
        <p>${message}</p>
        <button class="small-btn" onclick="location.reload()">Перезагрузить</button>
      </div>
    `;
  }
  
  /**
   * Обновить состояние кнопки проверки
   */
  updateCheckButton(isChecking) {
    const checkBtn = document.getElementById('check-subscription-btn');
    if (checkBtn) {
      checkBtn.disabled = isChecking;
      checkBtn.textContent = isChecking ? 'Проверяем...' : 'Проверить подписку';
    }
  }

  /**
   * Открыть приложение
   */
  openApp() {
    console.log('Opening app...');
    this.hide();
    this.onAccessGranted();
  }

  /**
   * Обработчик получения доступа
   */
  onAccessGranted() {
    // Сохраняем статус доступа
    localStorage.setItem('subscription_access', JSON.stringify({
      hasAccess: true,
      checkedAt: new Date().toISOString(),
      userId: window.telegramApp?.getUser()?.id
    }));
    
    // Уведомляем приложение о получении доступа
    window.dispatchEvent(new CustomEvent('subscriptionAccessGranted', {
      detail: this.subscriptionData
    }));
    
    console.log('✅ Access granted to HSK trainer');
  }
  
  /**
   * Проверить, есть ли сохраненный доступ
   */
  checkSavedAccess() {
    try {
      const saved = localStorage.getItem('subscription_access');
      if (!saved) return false;
      
      const data = JSON.parse(saved);
      const currentUser = window.telegramApp?.getUser();
      
      // Проверяем, что доступ для текущего пользователя и не старше 1 часа
      if (data.hasAccess && 
          data.userId === currentUser?.id && 
          new Date() - new Date(data.checkedAt) < 60 * 60 * 1000) {
        this.hasAccess = true;
        return true;
      }
      
      // Удаляем устаревший доступ
      localStorage.removeItem('subscription_access');
      return false;
      
    } catch (error) {
      console.error('Error checking saved access:', error);
      return false;
    }
  }
  
  /**
   * Проверить доступ (основной метод)
   */
  async checkAccess() {
    // Сначала проверяем сохраненный доступ
    if (this.checkSavedAccess()) {
      console.log('✅ Using saved access');
      return true;
    }
    
    // Если нет сохраненного доступа, показываем модальное окно
    await this.show();
    return false;
  }
  
  /**
   * Получить статус доступа
   */
  getAccessStatus() {
    return {
      hasAccess: this.hasAccess,
      subscriptionData: this.subscriptionData,
      requiredChannels: this.requiredChannels
    };
  }
}

// Создаем глобальный экземпляр
window.subscriptionCheck = new SubscriptionCheck();

// Экспортируем для использования в модулях
export default SubscriptionCheck;