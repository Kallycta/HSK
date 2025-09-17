# 🔧 Устранение проблем с GitHub Actions и Yandex Cloud

## ❗ Проблема: Yandex Cloud не реагирует на изменения в Git

**Причина:** Yandex Cloud **НЕ подключается** к вашему репозиторию автоматически. Деплой происходит через **GitHub Actions**, который должен быть настроен вручную.

## 🔍 Диагностика проблемы

### Шаг 1: Проверьте секреты GitHub
1. Откройте ваш репозиторий на GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Убедитесь, что все необходимые секреты добавлены:
   - `YC_SA_JSON_CREDENTIALS` (JSON ключ сервисного аккаунта)
   - `YC_FOLDER_ID` (ID каталога Yandex Cloud)
   - `YC_SERVICE_ACCOUNT_ID` (ID сервисного аккаунта)
   - `TELEGRAM_BOT_TOKEN` (токен Telegram бота)
   - `API_KEY` (ваш API ключ)
   - `REQUIRED_CHANNELS` (список каналов через запятую)

### Шаг 2: Проверьте статус GitHub Actions

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

### Шаг 3: Проверьте GitHub Secrets

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
- Замените `yc-actions/yc-cli-install@v1` на `yc-actions/yc-cli-install@v2`
- Если используется `yandex-cloud/github-actions/yc-cli-install`, замените на `yc-actions/yc-cli-install@v2`
- Это касается файлов `.github/workflows/deploy-*.yml`

### Ошибка 5: "Проблемы с секретами GitHub"
```
Error: The secret YC_SA_JSON_CREDENTIALS was not found
Error: Invalid service account key
Error: Access denied
```
**Решение:**
- Проверьте, что все секреты добавлены в GitHub (Settings → Secrets and variables → Actions)
- Убедитесь, что `YC_SA_JSON_CREDENTIALS` содержит весь JSON ключ (включая фигурные скобки)
- Проверьте права сервисного аккаунта в Yandex Cloud
- Убедитесь, что секреты не содержат лишних пробелов или символов

### Ошибка 6: "Unable to cache dependencies"
```
Some specified paths were not resolved, unable to cache dependencies
```
**Решение:**
- Проверьте, что файл `package-lock.json` существует в указанной папке
- Если используете только `package.json`, измените `cache-dependency-path` на `package.json`
- Или уберите параметр `cache-dependency-path` для автоматического определения

### Ошибка 7: "Unable to resolve action yc-actions/yc-cli-install"
```
Unable to resolve action yc-actions/yc-cli-install, repository not found
```

**Причины:**
- Репозиторий `yc-actions/yc-cli-install` не существует или был удален
- Указана неверная версия действия
- Проблемы с доступом к GitHub Marketplace

**Рекомендуемые решения с официальными yc-actions:**

1. **Для аутентификации в Container Registry:**
   ```yaml
   - name: Login to Yandex Cloud Container Registry
     uses: yc-actions/yc-cr-login@v1
     with:
       yc-sa-json-credentials: ${{ secrets.YC_SA_JSON_CREDENTIALS }}
   ```

2. **Для развертывания Container Optimized Image (COI):**
   ```yaml
   - name: Deploy COI VM
     uses: yc-actions/yc-coi-deploy@v2
     with:
       yc-sa-json-credentials: ${{ secrets.YC_SA_JSON_CREDENTIALS }}
       folder-id: ${{ secrets.YC_FOLDER_ID }}
       vm-name: your-vm-name
   ```

3. **Установка CLI через официальный скрипт (универсальное решение):**
   ```yaml
   - name: Setup Yandex Cloud CLI
     run: |
       curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
       echo "$HOME/yandex-cloud/bin" >> $GITHUB_PATH
       
   - name: Configure Yandex Cloud CLI
     run: |
       echo '${{ secrets.YC_SA_JSON_CREDENTIALS }}' > key.json
       yc config profile create sa-profile
       yc config set service-account-key key.json
       yc config set folder-id ${{ secrets.YC_FOLDER_ID }}
       rm key.json
   ```

**Альтернативное решение (не рекомендуется для продакшена):**
- Замените `yc-actions/yc-cli-install@v1` на `nightstory/setup-yc@v1`
- Это касается файлов `.github/workflows/deploy-*.yml`

### Ошибка 8: "Telegram webhook failed"
```
Error: Failed to set webhook
Error: Request failed with status code 400
Telegram API error
```
**Решение:**
- Проверьте правильность TELEGRAM_BOT_TOKEN
- Убедитесь, что бот создан через @BotFather
- Проверьте, что бот не заблокирован
- Проверьте доступность API Gateway

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