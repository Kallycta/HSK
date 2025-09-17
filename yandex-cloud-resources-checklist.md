# 📋 Чек-лист ресурсов в Yandex Cloud

## 🎯 Что должно появиться в консоли после настройки

После выполнения инструкций по настройке, в вашей [консоли Yandex Cloud](https://console.cloud.yandex.ru/) должны появиться следующие ресурсы:

## 📁 1. Каталог (Folder)

**Где найти:** Главная страница консоли → Выбор каталога

✅ **Название:** `hsk-telegram-bot`  
✅ **Статус:** Активный  
✅ **Описание:** Каталог для HSK Telegram Bot проекта  

## 👤 2. Сервисный аккаунт

**Где найти:** IAM → Сервисные аккаунты

✅ **Название:** `hsk-bot-service-account`  
✅ **Роли:**
- `serverless.functions.invoker`
- `serverless.functions.admin` 
- `api-gateway.websockets.writer`
- `logging.writer`

✅ **JSON ключ:** Скачан и сохранен (файл `key.json`)

## 🔑 3. Статические ключи доступа (если используете Object Storage)

**Где найти:** IAM → Сервисные аккаунты → ваш аккаунт → Ключи доступа

✅ **Access Key ID:** Создан  
✅ **Secret Access Key:** Создан и сохранен  

## 💳 4. Биллинговый аккаунт

**Где найти:** Биллинг → Аккаунты

✅ **Статус:** Активный  
✅ **Способ оплаты:** Банковская карта привязана  
✅ **Баланс:** Положительный или есть грант  

## 🆔 5. Важные ID для сохранения

### Folder ID (ID каталога)
**Где найти:** Главная → Каталог → Обзор → ID каталога
```
Пример: b1g12345678901234567
```

### Service Account ID
**Где найти:** IAM → Сервисные аккаунты → ваш аккаунт → ID
```
Пример: aje12345678901234567
```

### Cloud ID (ID облака)
**Где найти:** Главная → Облако → ID
```
Пример: b1g98765432109876543
```

## 🚀 После деплоя появятся:

### 📦 Cloud Functions
**Где найти:** Serverless → Functions

✅ **hsk-api-function**
- Среда выполнения: Node.js 18
- Память: 256 МБ
- Таймаут: 30 сек
- Переменные окружения настроены

✅ **hsk-telegram-webhook**
- Среда выполнения: Node.js 18  
- Память: 128 МБ
- Таймаут: 15 сек
- Переменные окружения настроены

### 🌐 API Gateway
**Где найти:** Serverless → API Gateway

✅ **hsk-api-gateway**
- Домен: `https://xxxxxxxx.apigw.yandexcloud.net`
- Спецификация: Загружена из `api-gateway-spec.yaml`
- Статус: Активный

### 📊 Логи
**Где найти:** Logging → Группы логов

✅ **default**
- Логи функций
- Логи API Gateway
- Период хранения: 3 дня (по умолчанию)

## 🔍 Как проверить, что все работает

### 1. Проверка функций
```bash
# В консоли Serverless → Functions
# Должны быть 2 функции со статусом "Активна"
```

### 2. Проверка API Gateway
```bash
# Откройте URL API Gateway в браузере
https://ваш-домен.apigw.yandexcloud.net/health
# Должен вернуть: {"status": "OK", "timestamp": "..."}
```

### 3. Проверка Telegram webhook
```bash
# Проверьте webhook бота
curl https://api.telegram.org/bot<ВАШ_ТОКЕН>/getWebhookInfo
# Должен показать URL вашего API Gateway
```

## ❌ Что НЕ должно появляться

- ❌ Виртуальные машины (Compute Cloud)
- ❌ Kubernetes кластеры
- ❌ Базы данных (если не используете)
- ❌ Load Balancer (не нужен для serverless)
- ❌ Container Registry (не используется)

## 🆘 Если чего-то нет

### Нет каталога
1. Создайте новый каталог в консоли
2. Выберите его как активный

### Нет сервисного аккаунта
1. IAM → Сервисные аккаунты → Создать
2. Добавьте необходимые роли
3. Создайте JSON ключ

### Нет биллингового аккаунта
1. Биллинг → Создать аккаунт
2. Привяжите банковскую карту
3. Активируйте аккаунт

### Функции не создались
1. Проверьте GitHub Actions логи
2. Убедитесь, что все Secrets настроены
3. Повторите деплой

## 📱 Мобильное приложение Yandex Cloud

Для удобного мониторинга установите приложение:
- [iOS App Store](https://apps.apple.com/ru/app/yandex-cloud/id1483700156)
- [Google Play](https://play.google.com/store/apps/details?id=ru.yandex.cloud)

## 💡 Полезные ссылки

- [Консоль Yandex Cloud](https://console.cloud.yandex.ru/)
- [Документация Functions](https://cloud.yandex.ru/docs/functions/)
- [Документация API Gateway](https://cloud.yandex.ru/docs/api-gateway/)
- [Калькулятор стоимости](https://cloud.yandex.ru/prices)

---

*Обновлено: $(Get-Date -Format 'yyyy-MM-dd HH:mm')*
*Проект: HSK Telegram Bot → Yandex Cloud Functions*