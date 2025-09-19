# 🚨 ЭКСТРЕННАЯ ОЧИСТКА GIT ИСТОРИИ

> ⚠️ **КРИТИЧЕСКАЯ СИТУАЦИЯ БЕЗОПАСНОСТИ**
> 
> Файл `.env` с секретными данными попал в GitHub репозиторий!
> Необходимо немедленно выполнить следующие действия.

## 🔥 НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ (ВЫПОЛНИТЬ СЕЙЧАС!)

### 1. 🛑 Остановить все сервисы

```bash
# Остановить все запущенные процессы
# Если есть активные деплойменты - остановить их
```

### 2. 🗑️ Удалить файл .env из репозитория

```bash
# Удалить файл из текущего состояния
git rm .env
git commit -m "Remove .env file with sensitive data"
```

### 3. 🧹 Очистить историю Git (ВЫБЕРИТЕ ОДИН МЕТОД)

#### Метод A: BFG Repo-Cleaner (РЕКОМЕНДУЕТСЯ)

```bash
# 1. Скачать BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# 2. Создать резервную копию
git clone --mirror https://github.com/YOUR_USERNAME/YOUR_REPO.git repo-backup.git

# 3. Очистить файл из истории
java -jar bfg.jar --delete-files .env repo-backup.git

# 4. Очистить и принудительно обновить
cd repo-backup.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

#### Метод B: git filter-branch

```bash
# ВНИМАНИЕ: Этот метод может занять много времени на больших репозиториях
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Принудительно обновить все ветки
git push origin --force --all
git push origin --force --tags
```

#### Метод C: git filter-repo (если установлен)

```bash
# Установить git-filter-repo если нужно
# pip install git-filter-repo

git filter-repo --path .env --invert-paths
git push origin --force --all
```

### 4. 🔄 Принудительное обновление удаленного репозитория

```bash
# Принудительно обновить все ветки
git push origin --force --all
git push origin --force --tags

# Если есть другие удаленные репозитории
git remote -v  # посмотреть все remote
git push <remote_name> --force --all
```

## 🔐 СМЕНА СКОМПРОМЕТИРОВАННЫХ СЕКРЕТОВ

### Обнаруженные скомпрометированные данные:

1. **TELEGRAM_BOT_TOKEN**: `7263989697:AAFd1wvXXAnuzUZiiLIRoG_GzaqLNc7k7LY`
2. **API_KEY**: `881f8e616c8deb37a9eb7c485c3dcee306dae17656bed5b4b8783549300fcaac`
3. **JWT_SECRET**: `6bfc9c385745750fcf9b2b737a8bbf9c24a1814470ab7ac313a332afeb68f9f6`

### Действия по смене секретов:

#### 1. Telegram Bot Token
```bash
# 1. Зайти в @BotFather
# 2. Выбрать бота
# 3. Нажать "API Token" → "Revoke current token"
# 4. Получить новый токен
# 5. Обновить в GitHub Secrets: TELEGRAM_BOT_TOKEN
```

#### 2. API Key
```bash
# Сгенерировать новый API ключ
openssl rand -hex 32
# ИЛИ
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Обновить в GitHub Secrets: API_KEY
```

#### 3. JWT Secret
```bash
# Сгенерировать новый JWT секрет
openssl rand -hex 32
# ИЛИ
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Обновить в GitHub Secrets: JWT_SECRET
```

### 4. 📝 Обновить GitHub Secrets

1. Перейти в репозиторий на GitHub
2. Settings → Secrets and variables → Actions
3. Обновить следующие секреты:
   - `TELEGRAM_BOT_TOKEN` - новый токен от BotFather
   - `API_KEY` - новый сгенерированный ключ
   - `JWT_SECRET` - новый JWT секрет

## 🛡️ ПРЕДОТВРАЩЕНИЕ ПОВТОРНЫХ УТЕЧЕК

### 1. Обновить .gitignore

```bash
# Добавить в .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore

git add .gitignore
git commit -m "Add .env to .gitignore"
git push
```

### 2. Создать .env.example

```bash
# Создать шаблон без реальных значений
cat > .env.example << 'EOF'
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
REQUIRED_CHANNELS=channel_name

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend Configuration
FRONTEND_URL=https://your-frontend-url.com

# Security
API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOF

git add .env.example
git commit -m "Add .env.example template"
git push
```

### 3. Настроить Git hooks (опционально)

```bash
# Создать pre-commit hook для проверки .env файлов
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
if git diff --cached --name-only | grep -q "\.env$"; then
    echo "❌ ОШИБКА: Попытка коммита .env файла!"
    echo "Удалите .env из индекса: git reset HEAD .env"
    exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

## ✅ ПРОВЕРКА БЕЗОПАСНОСТИ

### 1. Проверить, что файл удален из истории

```bash
# Проверить, что .env больше нет в истории
git log --all --full-history -- .env

# Если команда не возвращает результатов - файл успешно удален
```

### 2. Проверить GitHub

1. Обновить страницу репозитория на GitHub
2. Убедиться, что файл .env не отображается
3. Проверить историю коммитов - файл не должен быть виден

### 3. Проверить работу с новыми секретами

```bash
# Запустить тесты или деплой с новыми секретами
# Убедиться, что все работает корректно
```

## 🚨 ДОПОЛНИТЕЛЬНЫЕ МЕРЫ БЕЗОПАСНОСТИ

### 1. Уведомить команду
- Сообщить всем разработчикам о произошедшем
- Попросить обновить локальные копии репозитория
- Предупредить о необходимости `git pull --force`

### 2. Мониторинг
- Следить за логами на предмет подозрительной активности
- Проверить метрики использования API
- Мониторить Telegram бота на предмет несанкционированного доступа

### 3. Аудит безопасности
- Проверить другие репозитории на наличие .env файлов
- Настроить автоматические проверки секретов (GitHub Secret Scanning)
- Рассмотреть использование внешних сервисов для управления секретами

## 📞 КОНТАКТЫ ЭКСТРЕННОЙ ПОДДЕРЖКИ

- **GitHub Support**: https://support.github.com
- **Telegram Support**: @BotSupport
- **Команда разработки**: [указать контакты]

---

> ⚠️ **ВАЖНО**: После выполнения всех действий этот файл можно удалить или переместить в безопасное место.
> 
> 🔒 **ПОМНИТЕ**: Никогда не коммитьте файлы с секретными данными в Git!