// Нативная Cloud Function без Express
const TelegramBot = require('node-telegram-bot-api');

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Утилиты для HTTP ответов
const createResponse = (statusCode, body, headers = {}) => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, x-api-key, Authorization',
            ...headers
        },
        body: JSON.stringify(body)
    };
};

// Проверка API ключа
const validateApiKey = (headers) => {
    const apiKey = headers['x-api-key'] || headers['X-API-Key'];
    const expectedApiKey = process.env.API_KEY || 'hsk_api_key_2024';
    return apiKey === expectedApiKey;
};

// Парсинг JSON body
const parseBody = (body, isBase64Encoded) => {
    try {
        const content = isBase64Encoded ? Buffer.from(body, 'base64').toString() : body;
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
};

// Проверка подписки пользователя на каналы
const checkUserSubscriptions = async (userId) => {
    const requiredChannels = process.env.REQUIRED_CHANNELS 
        ? process.env.REQUIRED_CHANNELS.split(',')
        : ['hsk_channel', 'chinese_learning', 'mandarin_practice'];
    
    const subscriptions = [];
    
    for (const channel of requiredChannels) {
        try {
            const member = await bot.getChatMember(`@${channel.trim()}`, userId);
            const isSubscribed = ['member', 'administrator', 'creator'].includes(member.status);
            
            subscriptions.push({
                channel: channel.trim(),
                subscribed: isSubscribed,
                status: member.status
            });
        } catch (error) {
            subscriptions.push({
                channel: channel.trim(),
                subscribed: false,
                error: error.message
            });
        }
    }
    
    const allSubscribed = subscriptions.every(sub => sub.subscribed);
    
    return {
        allSubscribed,
        subscriptions,
        totalChannels: requiredChannels.length,
        subscribedCount: subscriptions.filter(sub => sub.subscribed).length
    };
};

// Основная функция-обработчик
module.exports.handler = async (event, context) => {
    const { httpMethod, path, headers, body, isBase64Encoded, queryStringParameters } = event;
    
    try {
        // CORS preflight
        if (httpMethod === 'OPTIONS') {
            return createResponse(200, { message: 'OK' });
        }
        
        // Health check
        if (httpMethod === 'GET' && path === '/health') {
            return createResponse(200, {
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'HSK Telegram Bot API',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'production',
                runtime: 'Yandex Cloud Functions'
            });
        }
        
        // Проверка API ключа для защищенных эндпоинтов
        if (path.startsWith('/api/') && !validateApiKey(headers)) {
            return createResponse(401, {
                error: 'Unauthorized',
                message: 'Valid API key required'
            });
        }
        
        // Получение обязательных каналов
        if (httpMethod === 'GET' && path === '/api/subscription/channels') {
            const requiredChannels = process.env.REQUIRED_CHANNELS 
                ? process.env.REQUIRED_CHANNELS.split(',')
                : ['hsk_channel', 'chinese_learning', 'mandarin_practice'];
            
            const channels = requiredChannels.map(channel => ({
                username: channel.trim(),
                name: channel.trim().replace(/_/g, ' ').toUpperCase(),
                required: true
            }));
            
            return createResponse(200, {
                success: true,
                channels: channels,
                total: channels.length,
                timestamp: new Date().toISOString()
            });
        }
        
        // Проверка подписки пользователя
        if (httpMethod === 'POST' && path === '/api/subscription/check') {
            const requestBody = parseBody(body, isBase64Encoded);
            
            if (!requestBody || (!requestBody.userId && !requestBody.chatId)) {
                return createResponse(400, {
                    success: false,
                    error: 'Bad Request',
                    message: 'userId or chatId is required'
                });
            }
            
            const userId = requestBody.userId || requestBody.chatId;
            const subscriptionStatus = await checkUserSubscriptions(userId);
            
            return createResponse(200, {
                success: true,
                userId: userId,
                subscriptionStatus,
                timestamp: new Date().toISOString()
            });
        }
        
        // Отправка сообщения пользователю
        if (httpMethod === 'POST' && path === '/api/telegram/send-message') {
            const requestBody = parseBody(body, isBase64Encoded);
            
            if (!requestBody || !requestBody.chatId || !requestBody.message) {
                return createResponse(400, {
                    success: false,
                    error: 'Bad Request',
                    message: 'chatId and message are required'
                });
            }
            
            const { chatId, message, parseMode = 'HTML' } = requestBody;
            
            const result = await bot.sendMessage(chatId, message, { 
                parse_mode: parseMode 
            });
            
            return createResponse(200, {
                success: true,
                messageId: result.message_id,
                chatId: chatId,
                timestamp: new Date().toISOString()
            });
        }
        
        // Получение информации о боте
        if (httpMethod === 'GET' && path === '/api/bot/info') {
            const botInfo = await bot.getMe();
            
            return createResponse(200, {
                success: true,
                bot: {
                    id: botInfo.id,
                    username: botInfo.username,
                    firstName: botInfo.first_name,
                    canJoinGroups: botInfo.can_join_groups,
                    canReadAllGroupMessages: botInfo.can_read_all_group_messages,
                    supportsInlineQueries: botInfo.supports_inline_queries
                },
                timestamp: new Date().toISOString()
            });
        }
        
        // 404 для неизвестных путей
        return createResponse(404, {
            error: 'Not Found',
            message: `Path ${path} not found`,
            availableEndpoints: [
                'GET /health',
                'GET /api/subscription/channels',
                'POST /api/subscription/check',
                'POST /api/telegram/send-message',
                'GET /api/bot/info'
            ]
        });
        
    } catch (error) {
        console.error('Function error:', error);
        
        return createResponse(500, {
            success: false,
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};