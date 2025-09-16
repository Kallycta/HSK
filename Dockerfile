FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY backend/package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код backend
COPY backend/ .

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]