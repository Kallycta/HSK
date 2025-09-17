# 🚀 Быстрый старт: Миграция на Yandex Cloud

## Что вы получите

✅ **Полностью готовое решение для миграции с Back4App на Yandex Cloud**  
✅ **Автоматизированное развертывание через GitHub Actions**  
✅ **Скрипт для ручного развертывания**  
✅ **Конфигурации Docker и Nginx**  
✅ **Подробную документацию**  

## 📁 Созданные файлы

```
HSK/
├── yandex-cloud-migration.md      # 📖 Полная инструкция по миграции
├── deploy-yandex.ps1               # 🔧 Скрипт автоматического развертывания
├── docker-compose.yandex.yml       # 🐳 Docker Compose конфигурация
├── nginx/nginx.conf                # 🌐 Конфигурация Nginx
├── .github/workflows/
│   └── deploy-yandex-cloud.yml     # 🤖 GitHub Actions для CI/CD
└── backend/Dockerfile              # 📦 Обновленный Dockerfile
```

## ⚡ Быстрый старт (3 шага)

### 1️⃣ Подготовка Yandex Cloud

```bash
# Установите Yandex Cloud CLI
iex (New-Object System.Net.WebClient).DownloadString('https://storage.yandexcloud.net/yandexcloud-yc/install.ps1')

# Инициализация
yc init

# Создайте Container Registry
yc container registry create --name hsk-registry
```

### 2️⃣ Ручное развертывание

```powershell
# Запустите скрипт развертывания
.\deploy-yandex.ps1 -RegistryId "YOUR_REGISTRY_ID" -TelegramBotToken "YOUR_BOT_TOKEN" -FrontendUrl "YOUR_FRONTEND_URL"
```

### 3️⃣ Автоматическое развертывание (GitHub Actions)

**Добавьте секреты в GitHub:**
- `YC_SA_JSON_CREDENTIALS` - JSON ключ сервисного аккаунта
- `YC_REGISTRY_ID` - ID Container Registry
- `TELEGRAM_BOT_TOKEN` - Токен Telegram бота
- `FRONTEND_URL` - URL фронтенда
- `API_KEY` - API ключ (например: hsk_api_key_2024)
- `REQUIRED_CHANNELS` - Список каналов через запятую

**Пушьте код в main ветку - развертывание запустится автоматически!**

## 💰 Примерная стоимость

| Ресурс | Конфигурация | Стоимость/месяц |
|--------|--------------|----------------|
| VM (2 vCPU, 2GB RAM) | 24/7 | ~800₽ |
| Container Registry | 1GB образов | ~50₽ |
| Трафик | 10GB исходящий | ~100₽ |
| **Итого** | | **~950₽/месяц** |

💡 **Экономия**: Используйте автоскейлинг и расписание для снижения затрат до ~300₽/месяц

## 🔧 Полезные команды

```bash
# Просмотр статуса VM
yc compute instance list

# Подключение к VM
yc compute ssh --name hsk-backend

# Просмотр логов
yc compute instance get-serial-port-output hsk-backend

# Остановка/запуск VM
yc compute instance stop hsk-backend
yc compute instance start hsk-backend
```

## 📞 Поддержка

- 📖 **Полная документация**: `yandex-cloud-migration.md`
- 🌐 **Yandex Cloud Docs**: https://cloud.yandex.ru/docs
- 💬 **Сообщество**: https://t.me/yandexcloud_ru

---

**🎯 Готово! Ваше приложение готово к миграции на Yandex Cloud.**