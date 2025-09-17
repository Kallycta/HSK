# 🔧 Устранение проблем с GitHub Actions и Yandex Cloud

## ❗ Проблема: Yandex Cloud не реагирует на изменения в Git

**Причина:** Yandex Cloud **НЕ подключается** к вашему репозиторию автоматически. Деплой происходит через **GitHub Actions**, который должен быть настроен вручную.

## 🔍 Диагностика проблемы

### Шаг 1: Проверьте GitHub Actions

1. Откройте ваш репозиторий на GitHub
2. Перейдите во вкладку **"Actions"**
3. Проверьте статус последнего workflow:

**✅ Что должно быть:**
```
✅ Deploy to Yandex Cloud Functions
   Triggered by push to main
   Status: Success ✅
```

**❌ Если видите:**
```
❌ Deploy to Yandex Cloud Functions
   Status: Failed ❌
   Error: Missing secrets
```

### Шаг 2: Проверьте GitHub Secrets

1. В репозитории: **Settings** → **Secrets and variables** → **Actions**
2. Должны быть настроены ВСЕ секреты:

```
✅ YC_SA_JSON_CREDENTIALS
✅ YC_FOLDER_ID  
✅ YC_SERVICE_ACCOUNT_ID
✅ TELEGRAM_BOT_TOKEN
✅ API_KEY
✅ REQUIRED_CHANNELS
```

**❌ Если секретов нет** → GitHub Actions не может подключиться к Yandex Cloud

## 🛠️ Пошаговое решение

### Решение 1: Настройка GitHub Secrets

#### 1.1 Получите данные из Yandex Cloud

**YC_FOLDER_ID:**
```bash
# В консоли Yandex Cloud
# Главная → Каталог → ID каталога
# Пример: b1g12345678901234567
```

**YC_SERVICE_ACCOUNT_ID:**
```bash
# IAM → Сервисные аккаунты → ваш аккаунт → ID
# Пример: aje12345678901234567
```

**YC_SA_JSON_CREDENTIALS:**
```bash
# Содержимое файла key.json (весь JSON целиком)
{
  "id": "aje...",
  "service_account_id": "aje...",
  "created_at": "2024-01-01T00:00:00Z",
  "key_algorithm": "RSA_2048",
  "public_key": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

#### 1.2 Добавьте секреты в GitHub

1. **Откройте репозиторий** на GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** для каждого:

```
Name: YC_SA_JSON_CREDENTIALS
Secret: {весь JSON из key.json}

Name: YC_FOLDER_ID
Secret: b1g12345678901234567

Name: YC_SERVICE_ACCOUNT_ID  
Secret: aje12345678901234567

Name: TELEGRAM_BOT_TOKEN
Secret: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

Name: API_KEY
Secret: ваш-секретный-ключ

Name: REQUIRED_CHANNELS
Secret: @channel1,@channel2,@channel3
```

### Решение 2: Принудительный запуск деплоя

#### 2.1 Через GitHub Actions

1. **Actions** → **Deploy to Yandex Cloud Functions**
2. **Run workflow** → **Run workflow**
3. Дождитесь завершения (5-10 минут)

#### 2.2 Через новый commit

```bash
# В терминале проекта
git add .
git commit -m "Trigger deployment to Yandex Cloud"
git push origin main
```

### Решение 3: Ручной деплой (если GitHub Actions не работает)

```powershell
# Установите Yandex Cloud CLI
# https://cloud.yandex.ru/docs/cli/quickstart

# Настройте CLI
yc init

# Запустите скрипт деплоя
.\deploy-cloud-functions.ps1 -FolderID "ваш-folder-id" -ServiceAccountID "ваш-sa-id"
```

## 📊 Мониторинг деплоя

### Логи GitHub Actions

1. **Actions** → последний workflow
2. Кликните на **Deploy to Yandex Cloud Functions**
3. Разверните каждый шаг для просмотра логов

**Успешный деплой выглядит так:**
```
✅ Setup Yandex Cloud CLI
✅ Deploy API Handler Function  
✅ Deploy Telegram Webhook Function
✅ Setup API Gateway
✅ Configure Telegram Webhook
✅ Test Deployment
```

### Проверка в Yandex Cloud

После успешного деплоя в консоли появятся:

1. **Serverless → Functions:**
   - `hsk-api-function`
   - `hsk-telegram-webhook`

2. **Serverless → API Gateway:**
   - `hsk-api-gateway`

3. **Логи функций в Logging**

## 🚨 Частые ошибки

### Ошибка 1: "Authentication failed"
```
Error: Failed to authenticate with Yandex Cloud
```
**Решение:** Проверьте `YC_SA_JSON_CREDENTIALS` - должен быть валидный JSON

### Ошибка 2: "Folder not found"
```
Error: Folder 'b1g...' not found
```
**Решение:** Проверьте `YC_FOLDER_ID` в консоли Yandex Cloud

### Ошибка 3: "Permission denied"
```
Error: Service account has no permission
```
**Решение:** Добавьте роли сервисному аккаунту:
- `serverless.functions.admin`
- `api-gateway.websockets.writer`
- `logging.writer`

### Ошибка 4: "Unable to resolve action yc-actions/yc-cli-install"
```
Unable to resolve action yc-actions/yc-cli-install, repository not found
```
**Решение:** Обновите GitHub Actions workflow файлы:
- Замените `yc-actions/yc-cli-install@v1` на `yandex-cloud/github-actions/yc-cli-install@v2`
- Это касается файлов `.github/workflows/deploy-*.yml`

### Ошибка 5: "Telegram webhook failed"
```
Error: Failed to set webhook
```
**Решение:** Проверьте `TELEGRAM_BOT_TOKEN` и доступность API Gateway

## ✅ Проверка успешного деплоя

### 1. API Gateway работает
```bash
curl https://ваш-домен.apigw.yandexcloud.net/health
# Ответ: {"status":"OK","timestamp":"..."}
```

### 2. Telegram webhook настроен
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
# Ответ должен содержать URL вашего API Gateway
```

### 3. Бот отвечает
- Отправьте `/start` боту в Telegram
- Проверьте логи функций в Yandex Cloud

## 📞 Если ничего не помогает

1. **Проверьте статус Yandex Cloud:** https://status.cloud.yandex.ru/
2. **Создайте issue** в репозитории с логами GitHub Actions
3. **Обратитесь в поддержку** Yandex Cloud с ID деплоя

## 🎯 Краткий чек-лист

- [ ] GitHub Secrets настроены (6 штук)
- [ ] Сервисный аккаунт имеет нужные роли
- [ ] JSON ключ валидный и не истек
- [ ] Биллинговый аккаунт активен
- [ ] GitHub Actions workflow запущен
- [ ] Логи деплоя без ошибок
- [ ] Функции появились в Yandex Cloud
- [ ] API Gateway доступен
- [ ] Telegram webhook настроен

---

**Помните:** Yandex Cloud **НЕ мониторит** ваш Git репозиторий. Деплой происходит **только** через GitHub Actions или ручные скрипты!

*Обновлено: $(Get-Date -Format 'yyyy-MM-dd HH:mm')*