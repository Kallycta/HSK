# Расширенная диагностика проблем с правами доступа в Yandex Cloud

> 🔧 **Комплексное руководство по решению проблем с правами доступа**
> 
> Если стандартные методы не помогли, используйте эти дополнительные шаги для диагностики и решения проблем.

## 📋 Быстрая диагностика

### 1. Проверка актуальности ролей

**⏰ Время распространения изменений: до 15 минут**

```bash
# Проверка текущих назначений ролей в проекте
yc iam access-binding list --id <ID_проекта>

# Проверка ролей сервисного аккаунта
yc iam service-account list-access-bindings <SERVICE_ACCOUNT_ID>

# Проверка статуса сервисного аккаунта
yc iam service-account get <SERVICE_ACCOUNT_ID>
```

**🔍 Что проверять:**
- Наличие необходимых ролей (`serverless.functions.invoker`, `editor`, `admin`)
- Правильность ID проекта и сервисного аккаунта
- Время последнего изменения ролей

### 2. Проверка файлов конфигурации Yandex CLI

**📁 Локации конфигурационных файлов:**

```bash
# Windows
%USERPROFILE%\.config\yandex-cloud\config.yaml

# Linux/macOS
~/.config/yandex-cloud/config.yaml

# GitHub Actions
/home/runner/.config/yandex-cloud/config.yaml
```

**🔧 Проверка конфигурации:**

```bash
# Просмотр текущей конфигурации
yc config list

# Проверка активного профиля
yc config profile list

# Проверка токена
yc iam create-token
```

### 3. Создание нового токена и обновление CI/CD

**🔑 Пошаговая замена токена:**

1. **Создание нового JSON-ключа:**
   ```bash
   yc iam key create --service-account-name <SERVICE_ACCOUNT_NAME> --output key.json
   ```

2. **Обновление GitHub Secrets:**
   - Перейдите в Settings → Secrets and variables → Actions
   - Обновите `YC_SA_JSON_CREDENTIALS` новым содержимым key.json
   - Проверьте другие секреты: `API_KEY`, `TELEGRAM_BOT_TOKEN`

3. **Обновление локальных переменных:**
   ```bash
   # Обновление профиля CLI
   yc config profile create <PROFILE_NAME>
   yc config set service-account-key key.json
   ```

### 4. Анализ логов и диагностика

**📊 Проверка логов Yandex CLI:**

```bash
# Поиск логов
ls ~/.config/yandex-cloud/logs/

# Просмотр последних логов
tail -f ~/.config/yandex-cloud/logs/*yc_serverless_function*.txt

# Поиск ошибок в логах
grep -i "error\|denied\|forbidden" ~/.config/yandex-cloud/logs/*.txt
```

**🔍 Ключевые индикаторы в логах:**
- `403 Forbidden` - проблемы с правами доступа
- `401 Unauthorized` - проблемы с аутентификацией
- `quota exceeded` - превышение квот
- `resource not found` - неправильные ID ресурсов

### 5. Проверка ресурсов и квот

**📈 Проверка квот:**

```bash
# Проверка квот на функции
yc serverless function list

# Проверка лимитов проекта
yc resource-manager folder get <FOLDER_ID>

# Проверка биллинга
yc billing account list
```

**⚠️ Частые проблемы с ресурсами:**
- Превышение лимита на количество функций
- Недостаточно средств на балансе
- Блокировка аккаунта за неоплату

### 6. Проверка версий инструментов

**🔄 Обновление инструментов:**

```bash
# Проверка версии yc CLI
yc version

# Обновление yc CLI (Linux/macOS)
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Обновление yc CLI (Windows)
iwr -useb https://storage.yandexcloud.net/yandexcloud-yc/install.ps1 | iex

# Проверка версии Docker (если используется)
docker --version

# Проверка Node.js версии
node --version
npm --version
```

### 7. Проверка зависимостей и контейнеров

**🐳 Docker диагностика:**

```bash
# Проверка доступности образов
docker images

# Проверка запущенных контейнеров
docker ps -a

# Очистка Docker кэша
docker system prune -f

# Пересборка образа
docker build --no-cache -t <IMAGE_NAME> .
```

**📦 Node.js зависимости:**

```bash
# Очистка кэша npm
npm cache clean --force

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install

# Проверка уязвимостей
npm audit
npm audit fix
```

## 🚨 Экстренные меры

### Если ничего не помогает:

1. **Создание нового сервисного аккаунта:**
   ```bash
   yc iam service-account create --name <NEW_SA_NAME>
   yc resource-manager folder add-access-binding <FOLDER_ID> \
     --role editor \
     --service-account-name <NEW_SA_NAME>
   ```

2. **Полная переинициализация CLI:**
   ```bash
   rm -rf ~/.config/yandex-cloud/
   yc init
   ```

3. **Проверка через веб-консоль:**
   - Войдите в [console.cloud.yandex.ru](https://console.cloud.yandex.ru)
   - Проверьте права доступа через интерфейс
   - Создайте тестовую функцию вручную

## 📞 Получение поддержки

### Подготовка информации для поддержки:

```bash
# Сбор диагностической информации
echo "=== Yandex CLI Version ===" > debug-info.txt
yc version >> debug-info.txt

echo "\n=== Current Config ===" >> debug-info.txt
yc config list >> debug-info.txt

echo "\n=== Service Accounts ===" >> debug-info.txt
yc iam service-account list >> debug-info.txt

echo "\n=== Functions List ===" >> debug-info.txt
yc serverless function list >> debug-info.txt

echo "\n=== Recent Logs ===" >> debug-info.txt
tail -20 ~/.config/yandex-cloud/logs/*.txt >> debug-info.txt
```

### Контакты поддержки:
- 📧 **Email:** support@cloud.yandex.ru
- 💬 **Telegram:** @YandexCloudSupport
- 🌐 **Документация:** [cloud.yandex.ru/docs](https://cloud.yandex.ru/docs)

## ✅ Чек-лист диагностики

- [ ] Подождал 15 минут после изменения ролей
- [ ] Проверил назначения ролей командой `yc iam access-binding list`
- [ ] Проверил конфигурацию CLI командой `yc config list`
- [ ] Создал новый JSON-ключ и обновил секреты
- [ ] Проанализировал логи на наличие ошибок
- [ ] Проверил квоты и ресурсы проекта
- [ ] Обновил yc CLI до последней версии
- [ ] Очистил кэши Docker и npm
- [ ] Попробовал создать функцию через веб-консоль
- [ ] Собрал диагностическую информацию для поддержки

---

> 💡 **Совет:** Ведите лог всех выполненных действий - это поможет службе поддержки быстрее решить проблему.

**📚 Связанные руководства:**
- [Быстрое исправление ошибок доступа](./QUICK-FIX-PERMISSION-DENIED.md)
- [Подробное руководство по токенам](./token-update-guide.md)
- [Чек-лист диагностики](./permission-troubleshooting-checklist.md)
- [Руководство по API ключам](./api-key-guide.md)