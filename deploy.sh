#!/bin/bash
set -e

echo "🚀 Déploiement de MarchéPlus en cours..."

# 1. Vérification de Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker n'est pas installé. Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 2. Construction et démarrage des conteneurs
echo "📦 Build et lancement des conteneurs (PostgreSQL + Backend + Frontend)..."
docker compose down || true
docker compose up -d --build

echo "✅ Déploiement réussi ! Votre site est disponible sur le port 80 de votre VPS."
