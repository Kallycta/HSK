const TelegramBotService = require('../backend/services/telegramBot');

// Глобальная переменная для переиспользования экземпляра бота
let telegramBotInstance = null;

// Функция для получения экземпляра бота (singleton pattern)
function getTelegramBot() {
    if (!telegramBotInstance) {
        telegramBotInstance = new TelegramBotService();
    }
    return telegramBotInstance;
}

// Обработчик webhook для Yandex Cloud Functions
module.exports.handler = async (event, context) => {
    // Устанавливаем таймаут для функции
    const startTime = Date.now();
    const maxExecutionTime = 14000; // 14 секунд
    
    try {
        console.log('=== Telegram Webhook Handler Started ===');
        console.log('Event:', JSON.stringify(event, null, 2));
        console.log('Context:', JSON.stringify(context, null, 2));
        
        // Парсим тело запроса
        let body;
        if (typeof event.body === 'string') {
            try {
                body = JSON.parse(event.body);
            } catch (parseError) {
                console.error('Error parsing request body:', parseError);
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        ok: false, 
                        error: 'Invalid JSON in request body' 
                    })
                };
            }
        } else {
            body = event.body || {};
        }
        
        console.log('Parsed webhook body:', JSON.stringify(body, null, 2));
        
        // Проверяем, что это валидное обновление от Telegram
        if (!body.update_id && !body.message && !body.callback_query && !body.inline_query) {
            console.log('Invalid webhook payload - missing required fields');
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    ok: false, 
                    error: 'Invalid webhook payload' 
                })
            };
        }
        
        // Получаем экземпляр бота
        const telegramBot = getTelegramBot();
        
        // Проверяем оставшееся время выполнения
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > maxExecutionTime) {
            console.warn('Function timeout approaching, skipping processing');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    ok: true, 
                    message: 'Timeout approaching, update skipped' 
                })
            };
        }
        
        // Обрабатываем обновление от Telegram
        if (body.message) {
            console.log('Processing message update');
            await telegramBot.handleMessage(body.message);
        } else if (body.callback_query) {
            console.log('Processing callback query update');
            await telegramBot.handleCallbackQuery(body.callback_query);
        } else if (body.inline_query) {
            console.log('Processing inline query update');
            await telegramBot.handleInlineQuery(body.inline_query);
        } else {
            console.log('Unknown update type, processing as generic update');
            await telegramBot.processUpdate(body);
        }
        
        const processingTime = Date.now() - startTime;
        console.log(`Webhook processed successfully in ${processingTime}ms`);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Processing-Time': processingTime.toString()
            },
            body: JSON.stringify({ 
                ok: true,
                processingTime: processingTime,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('=== Webhook Error ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('Processing time:', processingTime + 'ms');
        
        // Определяем тип ошибки для более точного статус кода
        let statusCode = 500;
        let errorMessage = 'Internal server error';
        
        if (error.message && error.message.includes('timeout')) {
            statusCode = 408;
            errorMessage = 'Request timeout';
        } else if (error.message && error.message.includes('rate limit')) {
            statusCode = 429;
            errorMessage = 'Rate limit exceeded';
        } else if (error.message && error.message.includes('unauthorized')) {
            statusCode = 401;
            errorMessage = 'Unauthorized';
        }
        
        return {
            statusCode: statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Processing-Time': processingTime.toString()
            },
            body: JSON.stringify({ 
                ok: false, 
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                processingTime: processingTime,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Функция для локального тестирования
if (require.main === module) {
    // Пример тестового события
    const testEvent = {
        httpMethod: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            update_id: 123456789,
            message: {
                message_id: 1,
                from: {
                    id: 123456789,
                    is_bot: false,
                    first_name: 'Test',
                    username: 'testuser'
                },
                chat: {
                    id: 123456789,
                    first_name: 'Test',
                    username: 'testuser',
                    type: 'private'
                },
                date: Math.floor(Date.now() / 1000),
                text: '/start'
            }
        })
    };
    
    const testContext = {
        requestId: 'test-request-id',
        functionName: 'telegram-webhook-test',
        functionVersion: '1.0.0'
    };
    
    console.log('Testing webhook handler locally...');
    
    module.exports.handler(testEvent, testContext)
        .then(result => {
            console.log('Test result:', JSON.stringify(result, null, 2));
        })
        .catch(error => {
            console.error('Test error:', error);
        });
}