# 🔄 Обновление Frontend URL после развертывания

## 📋 Проблема
В `frontend/config.js` используется временный URL `your-gateway-domain.apigw.yandexcloud.net` вместо реального URL API Gateway.

## 🚀 Решение

### Шаг 1: Получите URL API Gateway

После успешного развертывания через GitHub Actions:

1. **Откройте логи GitHub Actions**
2. **Найдите секцию "Deploy API Gateway"**
3. **Скопируйте URL** из строки:
   ```
   ✅ API Gateway deployed: https://ваш-реальный-домен.apigw.yandexcloud.net
   ```

### Альтернативно через консоль Yandex Cloud:

1. Откройте https://console.cloud.yandex.ru/
2. Перейдите: **Serverless** → **API Gateway**
3. Найдите `hsk-api-gateway`
4. Скопируйте **Домен** из таблицы

### Шаг 2: Обновите config.js

Откройте `frontend/config.js` и замените:

```javascript
// БЫЛО:
API_BASE_URL: 'https://your-gateway-domain.apigw.yandexcloud.net',

// СТАНЕТ (пример):
API_BASE_URL: 'https://d5d123abc456def789.apigw.yandexcloud.net',
```

### Шаг 3: Проверьте работу

1. **Откройте браузер**
2. **Перейдите на ваш сайт**
3. **Откройте Developer Tools (F12)**
4. **Проверьте Console** на наличие ошибок сети
5. **Проверьте Network tab** - запросы должны идти на новый URL

## 🔧 Автоматизация (рекомендуется)

### Вариант 1: Переменные окружения

Измените `config.js`:

```javascript
const CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:3000',
    API_KEY: '881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac'
  },
  production: {
    // Используем переменную окружения или fallback
    API_BASE_URL: window.YANDEX_GATEWAY_URL || 'https://your-gateway-domain.apigw.yandexcloud.net',
    API_KEY: '881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac'
  }
};
```

И добавьте в `index.html`:

```html
<script>
  // URL будет подставлен автоматически при развертывании
  window.YANDEX_GATEWAY_URL = 'https://ваш-реальный-домен.apigw.yandexcloud.net';
</script>
```

### Вариант 2: GitHub Actions автозамена

Добавьте в workflow шаг:

```yaml
- name: 🔄 Update Frontend Config
  run: |
    GATEWAY_URL="${{ steps.deploy_gateway.outputs.gateway_url }}"
    sed -i "s|https://your-gateway-domain.apigw.yandexcloud.net|${GATEWAY_URL}|g" frontend/config.js
    echo "✅ Frontend config updated with: ${GATEWAY_URL}"
```

## ✅ Проверка

После обновления URL проверьте:

1. **Health Check**: `https://ваш-домен.apigw.yandexcloud.net/health`
2. **API Endpoint**: `https://ваш-домен.apigw.yandexcloud.net/api/subscription/channels`
3. **Frontend работает** без ошибок в консоли

---

> 💡 **Совет**: Сохраните реальный URL API Gateway в безопасном месте для будущих обновлений!