#!/usr/bin/env pwsh
# PowerShell скрипт для развертывания HSK Telegram Bot на Yandex Cloud Functions

param(
    [string]$Action = "deploy",
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false,
    [switch]$DryRun = $false
)

# Настройки
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Цвета для вывода
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "Magenta" = [ConsoleColor]::Magenta
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

# Логирование
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-ColorOutput $logMessage "Red" }
        "WARN" { Write-ColorOutput $logMessage "Yellow" }
        "SUCCESS" { Write-ColorOutput $logMessage "Green" }
        "INFO" { Write-ColorOutput $logMessage "Cyan" }
        default { Write-Host $logMessage }
    }
    
    # Записываем в файл лога
    $logMessage | Out-File -FilePath "deploy.log" -Append -Encoding UTF8
}

# Проверка зависимостей
function Test-Dependencies {
    Write-Log "Проверка зависимостей..."
    
    # Проверяем Yandex Cloud CLI
    try {
        $ycVersion = yc version 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Yandex Cloud CLI не найден"
        }
        Write-Log "Yandex Cloud CLI: $ycVersion" "SUCCESS"
    }
    catch {
        Write-Log "Ошибка: Yandex Cloud CLI не установлен. Установите его с https://cloud.yandex.ru/docs/cli/quickstart" "ERROR"
        Write-Log "Команда установки: iex (New-Object System.Net.WebClient).DownloadString('https://storage.yandexcloud.net/yandexcloud-yc/install.ps1')" "INFO"
        exit 1
    }
    
    # Проверяем авторизацию
    try {
        $profile = yc config list 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Не авторизован в Yandex Cloud"
        }
        Write-Log "Yandex Cloud авторизация: OK" "SUCCESS"
    }
    catch {
        Write-Log "Ошибка: Не авторизован в Yandex Cloud. Выполните: yc init" "ERROR"
        exit 1
    }
    
    # Проверяем Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Node.js не найден"
        }
        Write-Log "Node.js: $nodeVersion" "SUCCESS"
    }
    catch {
        Write-Log "Ошибка: Node.js не установлен. Установите его с https://nodejs.org/" "ERROR"
        exit 1
    }
    
    # Проверяем npm
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "npm не найден"
        }
        Write-Log "npm: $npmVersion" "SUCCESS"
    }
    catch {
        Write-Log "Ошибка: npm не установлен" "ERROR"
        exit 1
    }
}

# Получение переменных окружения
function Get-EnvironmentVariables {
    Write-Log "Получение переменных окружения..."
    
    $envVars = @{}
    
    # Обязательные переменные
    $requiredVars = @(
        "TELEGRAM_BOT_TOKEN",
        "YC_FOLDER_ID",
        "YC_SERVICE_ACCOUNT_ID"
    )
    
    foreach ($var in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($var)
        if (-not $value) {
            Write-Log "Ошибка: Переменная окружения $var не установлена" "ERROR"
            exit 1
        }
        $envVars[$var] = $value
        Write-Log "$var: установлена" "SUCCESS"
    }
    
    # Опциональные переменные с значениями по умолчанию
    $optionalVars = @{
        "API_KEY" = "hsk_api_key_2024"
        "REQUIRED_CHANNELS" = "hsk_channel,chinese_learning,mandarin_practice"
        "NODE_ENV" = $Environment
    }
    
    foreach ($var in $optionalVars.Keys) {
        $value = [Environment]::GetEnvironmentVariable($var)
        if (-not $value) {
            $value = $optionalVars[$var]
            Write-Log "$var: используется значение по умолчанию" "WARN"
        } else {
            Write-Log "$var: установлена" "SUCCESS"
        }
        $envVars[$var] = $value
    }
    
    return $envVars
}

# Подготовка кода
function Prepare-Code {
    Write-Log "Подготовка кода для развертывания..."
    
    # Переходим в папку functions
    if (-not (Test-Path "functions")) {
        Write-Log "Ошибка: Папка functions не найдена" "ERROR"
        exit 1
    }
    
    Push-Location "functions"
    
    try {
        # Устанавливаем зависимости
        Write-Log "Установка зависимостей..."
        npm ci --only=production --silent
        
        if ($LASTEXITCODE -ne 0) {
            throw "Ошибка установки зависимостей"
        }
        
        Write-Log "Зависимости установлены" "SUCCESS"
        
        # Создаем архив
        Write-Log "Создание архива для развертывания..."
        
        if (Test-Path "../functions.zip") {
            Remove-Item "../functions.zip" -Force
        }
        
        # Создаем архив с исключением ненужных файлов
        $excludePatterns = @(
            "node_modules/.cache/*",
            "*.log",
            ".git/*",
            "test/*",
            "*.test.js",
            "*.spec.js"
        )
        
        # Используем PowerShell для создания архива
        $compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        
        $zipPath = Resolve-Path "../functions.zip"
        $sourcePath = Get-Location
        
        [System.IO.Compression.ZipFile]::CreateFromDirectory($sourcePath, $zipPath, $compressionLevel, $false)
        
        $zipSize = (Get-Item "../functions.zip").Length / 1MB
        Write-Log "Архив создан: functions.zip ($('{0:N2}' -f $zipSize) MB)" "SUCCESS"
        
        if ($zipSize -gt 128) {
            Write-Log "Предупреждение: Размер архива превышает 128 MB" "WARN"
        }
    }
    finally {
        Pop-Location
    }
}

# Создание или обновление функций
function Deploy-Functions {
    param(
        [hashtable]$EnvVars
    )
    
    Write-Log "Развертывание Cloud Functions..."
    
    $functions = @(
        @{
            Name = "hsk-api-function"
            Description = "HSK Telegram Bot API endpoints"
            Entrypoint = "api-handler.handler"
            Memory = "256m"
            Timeout = "30s"
        },
        @{
            Name = "hsk-telegram-webhook"
            Description = "HSK Telegram Bot webhook handler"
            Entrypoint = "telegram-webhook.handler"
            Memory = "128m"
            Timeout = "15s"
        }
    )
    
    $functionIds = @{}
    
    foreach ($func in $functions) {
        Write-Log "Развертывание функции: $($func.Name)..."
        
        # Проверяем, существует ли функция
        $existingFunction = yc serverless function get $func.Name --format json 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            # Создаем новую функцию
            Write-Log "Создание новой функции: $($func.Name)"
            
            if (-not $DryRun) {
                yc serverless function create `
                    --name $func.Name `
                    --description $func.Description
                
                if ($LASTEXITCODE -ne 0) {
                    Write-Log "Ошибка создания функции: $($func.Name)" "ERROR"
                    exit 1
                }
            }
        }
        
        # Формируем переменные окружения
        $envString = ""
        foreach ($key in $EnvVars.Keys) {
            $envString += "$key=$($EnvVars[$key]),"
        }
        $envString = $envString.TrimEnd(",")
        
        # Создаем новую версию функции
        Write-Log "Создание версии функции: $($func.Name)"
        
        if (-not $DryRun) {
            yc serverless function version create `
                --function-name $func.Name `
                --runtime nodejs18 `
                --entrypoint $func.Entrypoint `
                --memory $func.Memory `
                --execution-timeout $func.Timeout `
                --source-path "functions.zip" `
                --environment $envString
            
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Ошибка создания версии функции: $($func.Name)" "ERROR"
                exit 1
            }
        }
        
        # Получаем ID функции
        if (-not $DryRun) {
            $functionInfo = yc serverless function get $func.Name --format json | ConvertFrom-Json
            $functionIds[$func.Name] = $functionInfo.id
            Write-Log "Функция $($func.Name) развернута: $($functionInfo.id)" "SUCCESS"
        }
    }
    
    return $functionIds
}

# Настройка API Gateway
function Deploy-ApiGateway {
    param(
        [hashtable]$FunctionIds,
        [hashtable]$EnvVars
    )
    
    Write-Log "Настройка API Gateway..."
    
    # Обновляем спецификацию API Gateway
    $specContent = Get-Content "api-gateway-spec.yaml" -Raw
    
    # Заменяем плейсхолдеры
    $specContent = $specContent -replace "<API_FUNCTION_ID>", $FunctionIds["hsk-api-function"]
    $specContent = $specContent -replace "<TELEGRAM_WEBHOOK_FUNCTION_ID>", $FunctionIds["hsk-telegram-webhook"]
    $specContent = $specContent -replace "<SERVICE_ACCOUNT_ID>", $EnvVars["YC_SERVICE_ACCOUNT_ID"]
    
    # Сохраняем обновленную спецификацию
    $specContent | Out-File "api-gateway-spec-updated.yaml" -Encoding UTF8
    
    # Проверяем, существует ли API Gateway
    $existingGateway = yc serverless api-gateway get "hsk-api-gateway" --format json 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        # Создаем новый API Gateway
        Write-Log "Создание нового API Gateway"
        
        if (-not $DryRun) {
            yc serverless api-gateway create `
                --name "hsk-api-gateway" `
                --description "HSK Telegram Bot API Gateway" `
                --spec "api-gateway-spec-updated.yaml"
            
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Ошибка создания API Gateway" "ERROR"
                exit 1
            }
        }
    } else {
        # Обновляем существующий API Gateway
        Write-Log "Обновление существующего API Gateway"
        
        if (-not $DryRun) {
            yc serverless api-gateway update "hsk-api-gateway" `
                --spec "api-gateway-spec-updated.yaml"
            
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Ошибка обновления API Gateway" "ERROR"
                exit 1
            }
        }
    }
    
    # Получаем URL API Gateway
    if (-not $DryRun) {
        $gatewayInfo = yc serverless api-gateway get "hsk-api-gateway" --format json | ConvertFrom-Json
        $gatewayUrl = "https://$($gatewayInfo.domain)"
        Write-Log "API Gateway развернут: $gatewayUrl" "SUCCESS"
        return $gatewayUrl
    }
    
    return "https://example.apigw.yandexcloud.net"
}

# Настройка Telegram webhook
function Set-TelegramWebhook {
    param(
        [string]$GatewayUrl,
        [string]$BotToken
    )
    
    Write-Log "Настройка Telegram webhook..."
    
    $webhookUrl = "$GatewayUrl/webhook/telegram"
    
    if (-not $DryRun) {
        # Устанавливаем webhook
        $webhookData = @{
            url = $webhookUrl
            allowed_updates = @("message", "callback_query")
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/setWebhook" `
                -Method Post `
                -ContentType "application/json" `
                -Body $webhookData
            
            if ($response.ok) {
                Write-Log "Telegram webhook установлен: $webhookUrl" "SUCCESS"
            } else {
                Write-Log "Ошибка установки webhook: $($response.description)" "ERROR"
            }
        }
        catch {
            Write-Log "Ошибка установки Telegram webhook: $($_.Exception.Message)" "ERROR"
        }
    } else {
        Write-Log "[DRY RUN] Telegram webhook: $webhookUrl" "INFO"
    }
}

# Тестирование развертывания
function Test-Deployment {
    param(
        [string]$GatewayUrl,
        [string]$ApiKey
    )
    
    if ($SkipTests) {
        Write-Log "Тесты пропущены" "WARN"
        return
    }
    
    Write-Log "Тестирование развертывания..."
    
    # Тест health endpoint
    try {
        $healthResponse = Invoke-RestMethod -Uri "$GatewayUrl/health" -Method Get
        if ($healthResponse.status -eq "ok") {
            Write-Log "Health check: OK" "SUCCESS"
        } else {
            Write-Log "Health check: FAILED" "ERROR"
        }
    }
    catch {
        Write-Log "Health check: ERROR - $($_.Exception.Message)" "ERROR"
    }
    
    # Тест API endpoint
    try {
        $headers = @{ "x-api-key" = $ApiKey }
        $apiResponse = Invoke-RestMethod -Uri "$GatewayUrl/api/subscription/channels" -Method Get -Headers $headers
        if ($apiResponse.success) {
            Write-Log "API test: OK (найдено $($apiResponse.total) каналов)" "SUCCESS"
        } else {
            Write-Log "API test: FAILED" "ERROR"
        }
    }
    catch {
        Write-Log "API test: ERROR - $($_.Exception.Message)" "ERROR"
    }
}

# Очистка временных файлов
function Clear-TempFiles {
    Write-Log "Очистка временных файлов..."
    
    $tempFiles = @(
        "functions.zip",
        "api-gateway-spec-updated.yaml"
    )
    
    foreach ($file in $tempFiles) {
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-Log "Удален: $file"
        }
    }
}

# Главная функция
function Main {
    Write-Log "=== Развертывание HSK Telegram Bot на Yandex Cloud Functions ===" "SUCCESS"
    Write-Log "Действие: $Action"
    Write-Log "Окружение: $Environment"
    Write-Log "Dry Run: $DryRun"
    
    try {
        # Проверяем зависимости
        Test-Dependencies
        
        # Получаем переменные окружения
        $envVars = Get-EnvironmentVariables
        
        if ($Action -eq "deploy" -or $Action -eq "update") {
            # Подготавливаем код
            Prepare-Code
            
            # Развертываем функции
            $functionIds = Deploy-Functions -EnvVars $envVars
            
            # Настраиваем API Gateway
            $gatewayUrl = Deploy-ApiGateway -FunctionIds $functionIds -EnvVars $envVars
            
            # Настраиваем Telegram webhook
            Set-TelegramWebhook -GatewayUrl $gatewayUrl -BotToken $envVars["TELEGRAM_BOT_TOKEN"]
            
            # Тестируем развертывание
            Test-Deployment -GatewayUrl $gatewayUrl -ApiKey $envVars["API_KEY"]
            
            # Выводим итоговую информацию
            Write-Log "" 
            Write-Log "=== РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО ===" "SUCCESS"
            Write-Log "API Gateway URL: $gatewayUrl" "INFO"
            Write-Log "Health Check: $gatewayUrl/health" "INFO"
            Write-Log "API Endpoint: $gatewayUrl/api/subscription/channels" "INFO"
            Write-Log "Telegram Webhook: $gatewayUrl/webhook/telegram" "INFO"
            Write-Log "" 
        }
        elseif ($Action -eq "test") {
            # Только тестирование
            $gatewayInfo = yc serverless api-gateway get "hsk-api-gateway" --format json | ConvertFrom-Json
            $gatewayUrl = "https://$($gatewayInfo.domain)"
            Test-Deployment -GatewayUrl $gatewayUrl -ApiKey $envVars["API_KEY"]
        }
        elseif ($Action -eq "logs") {
            # Просмотр логов
            Write-Log "Получение логов функций..."
            
            $functions = @("hsk-api-function", "hsk-telegram-webhook")
            foreach ($funcName in $functions) {
                Write-Log "Логи функции: $funcName" "INFO"
                $funcInfo = yc serverless function get $funcName --format json | ConvertFrom-Json
                yc logging read --group-name default --resource-type serverless.function --resource-id $funcInfo.id --since 1h
            }
        }
        else {
            Write-Log "Неизвестное действие: $Action" "ERROR"
            Write-Log "Доступные действия: deploy, update, test, logs" "INFO"
            exit 1
        }
    }
    catch {
        Write-Log "Критическая ошибка: $($_.Exception.Message)" "ERROR"
        Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
        exit 1
    }
    finally {
        # Очищаем временные файлы
        Clear-TempFiles
    }
}

# Запуск скрипта
if ($MyInvocation.InvocationName -ne '.') {
    Main
}