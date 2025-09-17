# Скрипт развертывания HSK приложения на Yandex Cloud
# Автор: HSK Team
# Версия: 1.0

param(
    [Parameter(Mandatory=$true)]
    [string]$RegistryId,
    
    [Parameter(Mandatory=$true)]
    [string]$TelegramBotToken,
    
    [Parameter(Mandatory=$true)]
    [string]$FrontendUrl,
    
    [string]$VmName = "hsk-backend",
    [string]$Zone = "ru-central1-a",
    [string]$Cores = "2",
    [string]$Memory = "2GB",
    [string]$DiskSize = "20GB"
)

# Цвета для вывода
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-YcCommand {
    try {
        yc --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerCommand {
    try {
        docker --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Проверка зависимостей
Write-ColorOutput "🔍 Проверка зависимостей..." $Blue

if (-not (Test-YcCommand)) {
    Write-ColorOutput "❌ Yandex Cloud CLI не установлен. Установите его с https://cloud.yandex.ru/docs/cli/quickstart" $Red
    exit 1
}

if (-not (Test-DockerCommand)) {
    Write-ColorOutput "❌ Docker не установлен или не запущен. Установите Docker Desktop" $Red
    exit 1
}

Write-ColorOutput "✅ Все зависимости установлены" $Green

# Проверка авторизации в Yandex Cloud
Write-ColorOutput "🔐 Проверка авторизации в Yandex Cloud..." $Blue
try {
    $profile = yc config profile list 2>$null
    if (-not $profile) {
        Write-ColorOutput "❌ Не найден активный профиль Yandex Cloud. Выполните 'yc init'" $Red
        exit 1
    }
    Write-ColorOutput "✅ Авторизация в Yandex Cloud успешна" $Green
}
catch {
    Write-ColorOutput "❌ Ошибка при проверке авторизации Yandex Cloud" $Red
    exit 1
}

# Настройка Docker для работы с Container Registry
Write-ColorOutput "🐳 Настройка Docker для работы с Container Registry..." $Blue
try {
    yc container registry configure-docker
    Write-ColorOutput "✅ Docker настроен для работы с Container Registry" $Green
}
catch {
    Write-ColorOutput "❌ Ошибка при настройке Docker" $Red
    exit 1
}

# Сборка Docker образа
Write-ColorOutput "🔨 Сборка Docker образа..." $Blue
$ImageTag = "cr.yandex/$RegistryId/hsk-backend:latest"

try {
    Set-Location backend
    docker build -t $ImageTag .
    Write-ColorOutput "✅ Docker образ собран успешно" $Green
}
catch {
    Write-ColorOutput "❌ Ошибка при сборке Docker образа" $Red
    exit 1
}
finally {
    Set-Location ..
}

# Загрузка образа в Container Registry
Write-ColorOutput "📤 Загрузка образа в Container Registry..." $Blue
try {
    docker push $ImageTag
    Write-ColorOutput "✅ Образ загружен в Container Registry" $Green
}
catch {
    Write-ColorOutput "❌ Ошибка при загрузке образа" $Red
    exit 1
}

# Проверка существования VM
Write-ColorOutput "🔍 Проверка существования виртуальной машины..." $Blue
$VmExists = $false
try {
    $vm = yc compute instance get $VmName 2>$null
    if ($vm) {
        $VmExists = $true
        Write-ColorOutput "ℹ️ Виртуальная машина '$VmName' уже существует" $Yellow
    }
}
catch {
    Write-ColorOutput "ℹ️ Виртуальная машина '$VmName' не найдена, будет создана новая" $Yellow
}

if ($VmExists) {
    # Обновление существующей VM
    Write-ColorOutput "🔄 Обновление существующей виртуальной машины..." $Blue
    try {
        yc compute instance update-container $VmName `
            --container-image $ImageTag `
            --container-env "NODE_ENV=production,PORT=8080,TELEGRAM_BOT_TOKEN=$TelegramBotToken,FRONTEND_URL=$FrontendUrl,API_KEY=hsk_api_key_2024,REQUIRED_CHANNELS=hsk_channel,chinese_learning,mandarin_practice" `
            --container-restart-policy always
        
        Write-ColorOutput "✅ Виртуальная машина обновлена успешно" $Green
    }
    catch {
        Write-ColorOutput "❌ Ошибка при обновлении виртуальной машины" $Red
        exit 1
    }
} else {
    # Создание новой VM
    Write-ColorOutput "🚀 Создание новой виртуальной машины..." $Blue
    try {
        yc compute instance create `
            --name $VmName `
            --zone $Zone `
            --network-interface "subnet-name=default-$Zone,nat-ip-version=ipv4" `
            --create-boot-disk "image-folder-id=standard-images,image-family=container-optimized-image,size=$DiskSize" `
            --cores $Cores `
            --memory $Memory `
            --container-name hsk-app `
            --container-image $ImageTag `
            --container-env "NODE_ENV=production,PORT=8080,TELEGRAM_BOT_TOKEN=$TelegramBotToken,FRONTEND_URL=$FrontendUrl,API_KEY=hsk_api_key_2024,REQUIRED_CHANNELS=hsk_channel,chinese_learning,mandarin_practice" `
            --container-restart-policy always
        
        Write-ColorOutput "✅ Виртуальная машина создана успешно" $Green
    }
    catch {
        Write-ColorOutput "❌ Ошибка при создании виртуальной машины" $Red
        exit 1
    }
}

# Получение IP адреса
Write-ColorOutput "🌐 Получение IP адреса виртуальной машины..." $Blue
try {
    $VmInfo = yc compute instance get $VmName --format json | ConvertFrom-Json
    $PublicIP = $VmInfo.network_interfaces[0].primary_v4_address.one_to_one_nat.address
    
    if ($PublicIP) {
        Write-ColorOutput "✅ Публичный IP адрес: $PublicIP" $Green
    } else {
        Write-ColorOutput "⚠️ Публичный IP адрес не найден" $Yellow
    }
}
catch {
    Write-ColorOutput "❌ Ошибка при получении информации о VM" $Red
}

# Ожидание запуска приложения
Write-ColorOutput "⏳ Ожидание запуска приложения (30 секунд)..." $Blue
Start-Sleep -Seconds 30

# Проверка работоспособности
if ($PublicIP) {
    Write-ColorOutput "🔍 Проверка работоспособности приложения..." $Blue
    try {
        $HealthUrl = "http://$PublicIP:8080/health"
        $Response = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 10
        
        if ($Response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Приложение работает корректно!" $Green
        } else {
            Write-ColorOutput "⚠️ Приложение отвечает, но статус: $($Response.StatusCode)" $Yellow
        }
    }
    catch {
        Write-ColorOutput "⚠️ Не удалось проверить работоспособность приложения. Возможно, оно еще запускается." $Yellow
    }
}

# Итоговая информация
Write-ColorOutput "`n🎉 Развертывание завершено!" $Green
Write-ColorOutput "📋 Информация о развертывании:" $Blue
Write-ColorOutput "   • Имя VM: $VmName" $Blue
Write-ColorOutput "   • Зона: $Zone" $Blue
Write-ColorOutput "   • Образ: $ImageTag" $Blue
if ($PublicIP) {
    Write-ColorOutput "   • Публичный IP: $PublicIP" $Blue
    Write-ColorOutput "   • API URL: http://$PublicIP:8080" $Blue
    Write-ColorOutput "   • Health Check: http://$PublicIP:8080/health" $Blue
}

Write-ColorOutput "`n📝 Следующие шаги:" $Yellow
Write-ColorOutput "   1. Обновите FRONTEND_URL в настройках фронтенда" $Yellow
Write-ColorOutput "   2. Настройте домен и SSL сертификат (опционально)" $Yellow
Write-ColorOutput "   3. Обновите webhook URL для Telegram бота" $Yellow
Write-ColorOutput "   4. Протестируйте все функции приложения" $Yellow

Write-ColorOutput "`n🔧 Полезные команды:" $Blue
Write-ColorOutput "   • Просмотр логов: yc compute instance get-serial-port-output $VmName" $Blue
Write-ColorOutput "   • Подключение по SSH: yc compute ssh --name $VmName" $Blue
Write-ColorOutput "   • Остановка VM: yc compute instance stop $VmName" $Blue
Write-ColorOutput "   • Запуск VM: yc compute instance start $VmName" $Blue
Write-ColorOutput "   • Удаление VM: yc compute instance delete $VmName" $Blue