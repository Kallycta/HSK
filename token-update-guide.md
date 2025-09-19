# 🔑 Подробное руководство по обновлению токенов доступа Yandex Cloud

**После изменения ролей сервисного аккаунта необходимо обновить токены доступа**

## 🎯 Зачем обновлять токены?

Когда вы добавляете новые роли к сервисному аккаунту, **существующие токены не получают новые разрешения автоматически**. Токены содержат информацию о правах на момент их создания.

## 📋 Что именно нужно обновить

### 1. GitHub Secrets (основное)

#### `YC_SA_JSON_CREDENTIALS` - JSON ключ сервисного аккаунта

**Где находится:**
- GitHub → Ваш репозиторий → Settings → Secrets and variables → Actions
- Секрет с именем `YC_SA_JSON_CREDENTIALS`

**Что делать:**
1. **Создайте новый ключ** для сервисного аккаунта:
   ```bash
   yc iam key create --service-account-name hsk-bot-service-account --output key.json
   ```

2. **Или через консоль:**
   - Откройте [Консоль Yandex Cloud](https://console.cloud.yandex.ru/)
   - IAM → Сервисные аккаунты → Ваш аккаунт
   - Вкладка "Ключи" → "Создать ключ" → "Создать авторизованный ключ"
   - Скачайте JSON файл

3. **Обновите GitHub Secret:**
   - Откройте содержимое JSON файла
   - Скопируйте **весь JSON** (включая фигурные скобки)
   - Вставьте в GitHub Secret `YC_SA_JSON_CREDENTIALS`

#### Пример правильного JSON:
```json
{
   "id": "aje...",
   "service_account_id": "aje...",
   "created_at": "2024-01-01T00:00:00Z",
   "key_algorithm": "RSA_2048",
   "public_key": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n",
   "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

### 2. Локальные токены (если используете)

#### Если работаете локально с Yandex CLI:

**Обновите профиль:**
```bash
# Переинициализируйте CLI
yc init

# Или обновите существующий профиль
yc config profile activate default
yc config set service-account-key key.json
```

**Проверьте токен:**
```bash
# Проверьте текущие права
yc iam service-account list-access-bindings <SERVICE_ACCOUNT_ID>

# Проверьте, что токен работает
yc serverless function list
```

### 3. Переменные окружения в CI/CD

#### Если используете другие CI/CD системы:

**GitLab CI/CD:**
- Settings → CI/CD → Variables
- Обновите `YC_SA_JSON_CREDENTIALS`

**Jenkins:**
- Credentials → Update credential
- Замените содержимое секрета

**Azure DevOps:**
- Library → Variable groups
- Обновите переменную с ключом

## ⚠️ Важные моменты

### 🔒 Безопасность
- **Удалите старые ключи** после создания новых
- **Не храните ключи в коде** или открытых файлах
- **Используйте только GitHub Secrets** для хранения

### ⏰ Время обновления
- **Подождите 5-10 минут** после изменения ролей
- **Новые токены активируются сразу** после создания
- **Старые токены работают** до их удаления

### 🔄 Проверка обновления

**После обновления токенов проверьте:**

1. **Запустите тестовый деплой:**
   ```bash
   # Через GitHub Actions
   git commit --allow-empty -m "Test token update"
   git push
   ```

2. **Проверьте права локально:**
   ```bash
   yc serverless function list
   yc iam service-account list-access-bindings <SERVICE_ACCOUNT_ID>
   ```

3. **Проверьте логи GitHub Actions:**
   - Actions → Последний workflow
   - Найдите ошибки аутентификации

## 🚨 Частые ошибки

### ❌ "Invalid credentials"
**Причина:** Неправильный формат JSON или повреждённый ключ
**Решение:** Создайте новый ключ и проверьте JSON синтаксис

### ❌ "Permission denied" после обновления токена
**Причина:** Роли ещё не применились или токен создан до добавления ролей
**Решение:** Подождите 5 минут и создайте новый ключ

### ❌ "Service account not found"
**Причина:** Неправильный ID сервисного аккаунта в ключе
**Решение:** Проверьте, что создаёте ключ для правильного аккаунта

## 📝 Пошаговый чек-лист

- [ ] Добавлены новые роли к сервисному аккаунту
- [ ] Подождал 5 минут после добавления ролей
- [ ] Создал новый JSON ключ для сервисного аккаунта
- [ ] Обновил GitHub Secret `YC_SA_JSON_CREDENTIALS`
- [ ] Проверил формат JSON (валидный синтаксис)
- [ ] Удалил старые ключи сервисного аккаунта
- [ ] Запустил тестовый деплой
- [ ] Проверил логи на отсутствие ошибок аутентификации
- [ ] Убедился, что функции создаются успешно

## 🔗 Полезные команды

```bash
# Создать новый ключ
yc iam key create --service-account-name hsk-bot-service-account --output new-key.json

# Проверить роли аккаунта
yc iam service-account list-access-bindings aje1234567890

# Список всех ключей аккаунта
yc iam key list --service-account-name hsk-bot-service-account

# Удалить старый ключ
yc iam key delete <KEY_ID>

# Проверить работу токена
yc serverless function list --folder-id <FOLDER_ID>
```

---

> 💡 **Главное правило**: После каждого изменения ролей сервисного аккаунта **обязательно создавайте новый JSON ключ** и обновляйте его в GitHub Secrets!

> ⚠️ **Безопасность**: Никогда не коммитьте JSON ключи в репозиторий. Используйте только GitHub Secrets для их хранения.