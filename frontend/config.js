// Конфигурация для разных средfdf
const CONFIG = { 
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    API_KEY: 'hsk_api_key_2024'
  },
  production: {
    // Yandex Cloud API Gateway URL
    API_BASE_URL: 'https://d5digcd630nfv5evp48l.svoluuab.apigw.yandexcloud.net', 
    API_KEY: 'hsk_api_key_2024'
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