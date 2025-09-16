// Конфигурация для разных сред
const CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:3000',
    API_KEY: '881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac'
  },
  production: {
    API_BASE_URL: 'https://your-backend-url.herokuapp.com', // Заменить на реальный URL после деплоя
    API_KEY: '881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac'
  }
};

// Определяем текущую среду
const ENVIRONMENT = window.location.hostname === 'localhost' ? 'development' : 'production';

// Экспортируем текущую конфигурацию
const CURRENT_CONFIG = CONFIG[ENVIRONMENT];

// Делаем доступным глобально
window.APP_CONFIG = CURRENT_CONFIG;

console.log('🔧 Environment:', ENVIRONMENT);
console.log('🌐 API Base URL:', CURRENT_CONFIG.API_BASE_URL);