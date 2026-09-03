# Étape 1 : Construction de l'application React Vite (Frontend)
FROM node:20-alpine AS builder

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci || npm install

# Copie du code source et compilation Vite
COPY . .
RUN npm run build

# Étape 2 : Image d'exécution de production (Node.js + Serveur Express/PostgreSQL)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Installation exclusive des dépendances de production
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copie du bundle frontend compilé et des fichiers serveur backend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/schema.sql ./schema.sql
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Lancement du serveur Node.js qui sert l'API REST et le Frontend SPA
CMD ["node", "server/server.mjs"]
