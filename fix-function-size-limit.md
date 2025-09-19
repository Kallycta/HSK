# 🚨 Исправление ошибки размера архива Cloud Function

## ❌ Ошибка
```
ERROR: zip archive content exceeds the maximum size 3.5 MB, use object storage to upload the content
```

## 🔍 Причина
Размер архива с кодом функции превышает лимит Yandex Cloud Functions в 3.5 MB.

## ✅ Решения

### 1. 🗂️ Оптимизация зависимостей

#### Проверьте размер node_modules:
```bash
cd functions
du -sh node_modules/
# или для Windows
dir node_modules /s
```

#### Удалите неиспользуемые зависимости:
```bash
# Анализ зависимостей
npm ls --depth=0

# Удаление неиспользуемых пакетов
npm uninstall <package-name>

# Очистка кэша
npm cache clean --force
```

### 2. 📦 Использование .yandexignore

Создайте/обновите файл `functions/.yandexignore`:
```
# Исключить из архива
node_modules/.cache/
*.log
*.tmp
.git/
.github/
README.md
*.md
tests/
__tests__/
.env
.env.*
*.test.js
*.spec.js
coverage/
.nyc_output/
```

### 3. 🔧 Минимизация кода

#### Удалите неиспользуемые файлы:
```bash
# Перейдите в папку functions
cd functions

# Удалите тестовые файлы
rm -rf tests/ __tests__/ *.test.js *.spec.js

# Удалите документацию
rm -rf docs/ README.md
```

#### Оптимизируйте package.json:
```json
{
  "name": "hsk-functions",
  "version": "1.0.0",
  "dependencies": {
    // Только необходимые зависимости
  },
  "devDependencies": {
    // Удалите все dev-зависимости
  }
}
```

### 4. 🏗️ Использование production-сборки

#### Установите только production зависимости:
```bash
cd functions
rm -rf node_modules/
npm ci --only=production
```

#### Обновите GitHub Actions:
```yaml
# В .github/workflows/deploy-cloud-functions.yml
- name: Install dependencies
  run: |
    cd functions
    npm ci --only=production
    npm prune --production
```

### 5. 📁 Разделение функций

Если размер все еще велик, разделите на несколько функций:

```
functions/
├── api-handler/          # Основные API endpoints
│   ├── index.js
│   └── package.json
├── telegram-webhook/     # Telegram webhook
│   ├── index.js
│   └── package.json
└── shared/              # Общие модули
    └── utils.js
```

### 6. 🗄️ Использование Object Storage (если необходимо)

Для очень больших функций:

```bash
# Загрузите код в Object Storage
yc storage cp ./functions.zip s3://your-bucket/functions.zip

# Создайте функцию из Object Storage
yc serverless function version create \
  --function-name hsk-api-function \
  --package-bucket-name your-bucket \
  --package-object-name functions.zip
```

## 🔍 Диагностика размера

### Проверьте размер архива:
```bash
# Создайте тестовый архив
cd functions
zip -r test-archive.zip . -x "node_modules/.cache/*" "*.log"
ls -lh test-archive.zip
```

### Найдите самые большие файлы:
```bash
# Linux/Mac
find . -type f -exec du -h {} + | sort -rh | head -20

# Windows PowerShell
Get-ChildItem -Recurse | Sort-Object Length -Descending | Select-Object -First 20 Name, Length
```

## ⚡ Быстрое решение

1. **Удалите dev-зависимости:**
   ```bash
   cd functions
   npm prune --production
   ```

2. **Обновите .yandexignore:**
   ```
   node_modules/.cache/
   *.log
   *.md
   tests/
   ```

3. **Пересоберите и задеплойте:**
   ```bash
   git add .
   git commit -m "Optimize function size"
   git push
   ```

## 📊 Мониторинг размера

Добавьте в CI/CD проверку размера:
```yaml
- name: Check function size
  run: |
    cd functions
    zip -r temp.zip . -x "node_modules/.cache/*"
    SIZE=$(stat -f%z temp.zip 2>/dev/null || stat -c%s temp.zip)
    echo "Function size: $((SIZE/1024/1024)) MB"
    if [ $SIZE -gt 3500000 ]; then
      echo "❌ Function size exceeds 3.5MB limit"
      exit 1
    fi
    rm temp.zip
```

## 🆘 Если ничего не помогает

1. **Свяжитесь с поддержкой Yandex Cloud** с trace-id: `285c8358-e6d8-4a2a-8dd9-39e6b9c3d81b`
2. **Рассмотрите использование Container Registry** для больших приложений
3. **Перенесите часть логики в отдельные сервисы**

---

**💡 Совет:** Регулярно проверяйте размер функций и оптимизируйте зависимости для избежания подобных проблем.