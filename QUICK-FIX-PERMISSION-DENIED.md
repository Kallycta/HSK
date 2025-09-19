# ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ: Permission Denied

## 🎯 Проблема
Ошибка `Permission denied` при создании Cloud Functions в Yandex Cloud.

## 🚀 Быстрое решение (5 минут)

### 1️⃣ Откройте консоль Yandex Cloud
👉 https://console.cloud.yandex.ru/

### 2️⃣ Перейдите к сервисным аккаунтам
- **Все сервисы** → **Identity and Access Management** → **Сервисные аккаунты**
- Найдите ваш сервисный аккаунт (обычно `hsk-bot-service-account`)
- **Нажмите на название** аккаунта

### 3️⃣ Добавьте роли
На странице сервисного аккаунта:
- Нажмите **"Назначить роли"**
- Добавьте эти роли (по одной):

```
✅ serverless.functions.admin
✅ serverless.functions.invoker  
✅ iam.serviceAccounts.user
✅ resource-manager.folders.editor
✅ logging.writer
```

### 4️⃣ Проверьте биллинг
👉 https://console.cloud.yandex.ru/billing
- Статус должен быть **ACTIVE**
- Карта должна быть привязана
- Баланс > 0 или есть грант

### 5️⃣ Подождите и повторите
- ⏱️ Подождите **5 минут**
- 🔄 Повторите развертывание через GitHub Actions

---

## 🆘 Если не помогло

### Проверьте GitHub Secrets:
- `YC_SA_JSON_CREDENTIALS` - корректный JSON ключ
- `YC_FOLDER_ID` - правильный ID каталога

### Получите ID каталога:
1. Выберите каталог в консоли
2. Нажмите **ℹ️** (информация)
3. Скопируйте **ID каталога**

---

> 💡 **Главное**: Роль `serverless.functions.admin` - это ключ к решению!

📖 **Подробная инструкция**: `fix-permission-denied-error.md`