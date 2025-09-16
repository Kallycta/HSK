FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json из backend
COPY backend/package*.json ./

# Устанавливаем зависимости
RUN npm install --only=production

# Копируем весь код backend
COPY backend/ ./

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

# Открываем порт (Back4app может использовать переменную PORT)
EXPOSE $PORT
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]