const express = require('express');
const serverless = require('serverless-http');

// Импортируем существующие модули
const TelegramBotService = require('../backend/services/telegramBot');
const errorHandler = require('../backend/middleware/errorHandler');

// Создаем Express приложение
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS для Cloud Functions
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware для проверки API ключа
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.API_KEY || 'hsk_api_key_2024';
    
    if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Valid API key required' 
        });
    }
    
    next();
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'HSK Telegram Bot API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        runtime: 'Yandex Cloud Functions'
    });
});

// API endpoint для получения обязательных каналов
app.get('/api/subscription/channels', validateApiKey, (req, res) => {
    try {
        const requiredChannels = process.env.REQUIRED_CHANNELS 
            ? process.env.REQUIRED_CHANNELS.split(',')
            : ['hsk_channel', 'chinese_learning', 'mandarin_practice'];
        
        const channels = requiredChannels.map(channel => ({
            username: channel.trim(),
            name: channel.trim().replace(/_/g, ' ').toUpperCase(),
            required: true
        }));
        
        res.json({
            success: true,
            channels: channels,
            total: channels.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting channels:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// API endpoint для проверки подписки пользователя
app.post('/api/subscription/check', validateApiKey, async (req, res) => {
    try {
        const { userId, chatId } = req.body;
        
        if (!userId && !chatId) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'userId or chatId is required'
            });
        }
        
        // Инициализируем Telegram бот сервис
        const telegramBot = new TelegramBotService();
        
        // Проверяем подписки пользователя
        const subscriptionStatus = await telegramBot.checkUserSubscriptions(userId || chatId);
        
        res.json({
            success: true,
            userId: userId || chatId,
            subscriptionStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// API endpoint для отправки сообщения пользователю
app.post('/api/telegram/send-message', validateApiKey, async (req, res) => {
    try {
        const { chatId, message, parseMode = 'HTML' } = req.body;
        
        if (!chatId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Bad Request',
                message: 'chatId and message are required'
            });
        }
        
        // Инициализируем Telegram бот сервис
        const telegramBot = new TelegramBotService();
        
        // Отправляем сообщение
        const result = await telegramBot.sendMessage(chatId, message, { parse_mode: parseMode });
        
        res.json({
            success: true,
            messageId: result.message_id,
            chatId: chatId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Обработка несуществующих роутов
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: [
            'GET /health',
            'GET /api/subscription/channels',
            'POST /api/subscription/check',
            'POST /api/telegram/send-message'
        ]
    });
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : error.message,
        timestamp: new Date().toISOString()
    });
});

// Экспорт для Cloud Functions
module.exports.handler = serverless(app);

// Для локального тестирования
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}