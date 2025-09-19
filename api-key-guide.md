# 🔑 Руководство по API_KEY для HSK Telegram Bot

## 🎯 Что такое API_KEY?

**API_KEY** - это **ваш собственный секретный ключ** для защиты API эндпоинтов вашего бота от несанкционированного доступа.

### 📋 Для чего используется:
- **Защита API эндпоинтов** от внешних запросов
- **Авторизация доступа** к функциям бота
- **Предотвращение злоупотреблений** вашим API
- **Контроль доступа** к данным о подписках

## 🔍 Где используется API_KEY?

### В коде бота:
```javascript
// Middleware для проверки API ключа
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.API_KEY || 'hsk_api_key_2024';
    
    if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Valid API key required' 
        });
    }
    
    next();
};
```

### Защищенные эндпоинты:
- `GET /api/subscription/channels` - получение списка каналов
- `POST /api/subscription/check` - проверка подписки пользователя
- `POST /api/telegram/send-message` - отправка сообщений

### Незащищенные эндпоинты:
- `GET /health` - проверка состояния API
- `POST /webhook/telegram` - webhook для Telegram

## 🛠️ Как создать API_KEY?

### Вариант 1: Сгенерировать случайный ключ (рекомендуется)

**Онлайн генераторы:**
- [Random.org API Key Generator](https://www.random.org/strings/)
- [UUID Generator](https://www.uuidgenerator.net/)
- [Password Generator](https://passwordsgenerator.net/)

**Настройки для генерации:**
- Длина: **32-64 символа**
- Символы: **буквы, цифры, подчеркивания**
- Пример: `hsk_bot_api_key_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Вариант 2: Через командную строку

**Windows PowerShell:**
```powershell
# Генерация случайного ключа
$apiKey = "hsk_api_" + [System.Web.Security.Membership]::GeneratePassword(32, 8)
Write-Host "Ваш API ключ: $apiKey"
```

**Linux/macOS:**
```bash
# Генерация случайного ключа
echo "hsk_api_$(openssl rand -hex 16)"

# Или через uuidgen
echo "hsk_api_$(uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]')"
```

**Node.js:**
```javascript
const crypto = require('crypto');
const apiKey = 'hsk_api_' + crypto.randomBytes(16).toString('hex');
console.log('Ваш API ключ:', apiKey);
```

### Вариант 3: Создать вручную

**Формат:** `hsk_api_[ваш_уникальный_ключ]`

**Примеры:**
- `hsk_api_my_secret_key_2024`
- `hsk_api_telegram_bot_secure_key`
- `hsk_api_production_key_v1`

**⚠️ Требования:**
- Минимум **16 символов**
- Только **латинские буквы, цифры, подчеркивания**
- **Уникальный** и **сложный для угадывания**
- **НЕ используйте** простые слова или даты

## 🔐 Как добавить API_KEY в GitHub Secrets?

### Пошаговая инструкция:

1. **Откройте ваш репозиторий** на GitHub

2. **Перейдите в настройки:**
   - Нажмите **"Settings"** (в верхнем меню репозитория)

3. **Найдите секреты:**
   - В левом меню: **"Secrets and variables"** → **"Actions"**

4. **Добавьте новый секрет:**
   - Нажмите **"New repository secret"**
   - **Name:** `API_KEY`
   - **Secret:** ваш сгенерированный ключ
   - Нажмите **"Add secret"**

### 📸 Визуальная схема:
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

┌─────────────────────────────────────┐
│ Name: API_KEY                       │
├─────────────────────────────────────┤
│ Secret: hsk_api_your_secret_key_123 │
└─────────────────────────────────────┘
                   ↓
              Add secret
```

## 🧪 Как проверить, что API_KEY работает?

### После деплоя проверьте:

1. **Получите URL вашего API Gateway:**
   ```bash
   # Из логов GitHub Actions или
   yc serverless api-gateway get hsk-api-gateway --format json | jq -r '.domain'
   ```

2. **Тест без API ключа (должен вернуть ошибку 401):**
   ```bash
   curl https://ваш-домен.apigw.yandexcloud.net/api/subscription/channels
   # Ответ: {"error":"Unauthorized","message":"Valid API key required"}
   ```

3. **Тест с правильным API ключом (должен работать):**
   ```bash
   curl -H "x-api-key: ваш_api_ключ" https://ваш-домен.apigw.yandexcloud.net/api/subscription/channels
   # Ответ: {"success":true,"channels":[...]}
   ```

4. **Тест с неправильным API ключом (должен вернуть ошибку 401):**
   ```bash
   curl -H "x-api-key: wrong_key" https://ваш-домен.apigw.yandexcloud.net/api/subscription/channels
   # Ответ: {"error":"Unauthorized","message":"Valid API key required"}
   ```

## 🚨 Важные моменты безопасности

### ✅ Что НУЖНО делать:
- **Используйте сложные ключи** (минимум 16 символов)
- **Храните ключ только в GitHub Secrets**
- **Никогда не коммитьте** ключ в репозиторий
- **Регулярно меняйте** ключ (раз в 3-6 месяцев)
- **Используйте разные ключи** для разных окружений

### ❌ Что НЕ НУЖНО делать:
- **НЕ используйте** простые ключи типа `123456` или `password`
- **НЕ публикуйте** ключ в открытом коде
- **НЕ отправляйте** ключ по email или мессенджерам
- **НЕ используйте** один ключ для всех проектов
- **НЕ логируйте** ключ в консоль или файлы

## 🔄 Как изменить API_KEY?

### Если нужно сменить ключ:

1. **Сгенерируйте новый ключ** (см. выше)

2. **Обновите GitHub Secret:**
   - GitHub → Settings → Secrets → Actions
   - Найдите `API_KEY` → **"Update"**
   - Вставьте новый ключ → **"Update secret"**

3. **Переразверните приложение:**
   ```bash
   git commit --allow-empty -m "Update API key"
   git push
   ```

4. **Проверьте работу** с новым ключом

## 🎯 Примеры использования

### В JavaScript (frontend):
```javascript
const response = await fetch('https://your-api.apigw.yandexcloud.net/api/subscription/channels', {
    headers: {
        'x-api-key': 'ваш_api_ключ',
        'Content-Type': 'application/json'
    }
});
```

### В Python:
```python
import requests

headers = {
    'x-api-key': 'ваш_api_ключ',
    'Content-Type': 'application/json'
}

response = requests.get('https://your-api.apigw.yandexcloud.net/api/subscription/channels', headers=headers)
```

### В curl:
```bash
curl -H "x-api-key: ваш_api_ключ" \
     -H "Content-Type: application/json" \
     https://your-api.apigw.yandexcloud.net/api/subscription/channels
```

## 📝 Чек-лист настройки API_KEY

- [ ] Сгенерировал сложный API ключ (минимум 16 символов)
- [ ] Добавил `API_KEY` в GitHub Secrets
- [ ] Проверил, что секрет добавлен правильно
- [ ] Запустил деплой через GitHub Actions
- [ ] Протестировал API без ключа (должна быть ошибка 401)
- [ ] Протестировал API с правильным ключом (должно работать)
- [ ] Протестировал API с неправильным ключом (должна быть ошибка 401)
- [ ] Убедился, что ключ нигде не сохранен в открытом виде
- [ ] Записал ключ в безопасное место для будущего использования

---

## 💡 Резюме

**API_KEY** - это **ваш собственный секретный ключ**, который вы создаете сами для защиты API эндпоинтов вашего бота.

**Главное:**
1. **Создайте** сложный уникальный ключ
2. **Добавьте** его в GitHub Secrets как `API_KEY`
3. **Никогда не публикуйте** ключ в открытом коде
4. **Используйте** ключ в заголовке `x-api-key` при запросах к API

> 🔒 **Помните**: API_KEY - это НЕ токен от Telegram или Yandex Cloud. Это ваш собственный ключ для защиты вашего API!