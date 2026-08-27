FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install express cors pg tsx typescript @types/express @types/cors @types/pg

COPY schema.sql ./
COPY server/ ./server/

EXPOSE 5000

CMD ["npx", "tsx", "server/index.ts"]
