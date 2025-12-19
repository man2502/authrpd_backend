FROM node:18-alpine

WORKDIR /app

# Устанавливаем переменные окружения для production
ENV NODE_ENV=production
ENV CURRENT_ENV=production

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p /app/keys/ec
# RUN mkdir -p /app/keys/rsa

EXPOSE 3000

CMD ["npm", "run", "start:docker"]

