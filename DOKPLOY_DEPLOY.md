# Guide de Déploiement Dokploy (Docker Compose) - OroMall

Ce guide vous accompagne pas à pas pour déployer **OroMall** et sa base de données **PostgreSQL 16** sur votre VPS avec **Dokploy**.

---

## 📋 Pré-requis

1. Un VPS avec **Dokploy** installé et fonctionnel.
2. Votre code OroMall poussé sur votre dépôt Git (GitHub, GitLab ou Git personnalisé).

---

## 🚀 Étapes de Déploiement dans Dokploy

### Étape 1 : Créer un projet Compose
1. Rendez-vous sur votre tableau de bord **Dokploy**.
2. Allez dans l'onglet **Compose** (ou *Projects* -> *Create Compose*).
3. Donnez un nom au projet : `oromall` ou `oromall-production`.

---

### Étape 2 : Connecter votre Dépôt Git
1. Choisissez **Git Source** (GitHub / GitLab / Git).
2. Sélectionnez votre dépôt et la branche : `main`.
3. Chemin du fichier Compose : `./docker-compose.yml`.

---

### Étape 3 : Configurer les Variables d'Environnement (Facultatif)
Dans l'onglet **Environment Variables** de Dokploy, vous pouvez définir ou personnaliser :

```env
# Configuration PostgreSQL
PGUSER=postgres
PGPASSWORD=votre_mot_de_passe_robuste_2026
PGDATABASE=marcheplus

# Clé administrateur OroMall
VITE_ADMIN_PIN=Tecnodylan14@
```

---

### Étape 4 : Configurer le Domaine & SSL
1. Dans l'onglet **Domains** du service `app` :
   - Ajoutez votre nom de domaine (ex: `oromall.cm` ou `shop.votredomaine.com`).
   - Port cible : `80`.
   - Cochez **HTTPS** (Dokploy / Traefik génère et renouvelle automatiquement le certificat SSL Let's Encrypt gratuit et redirige le port 80 vers HTTPS 443).

---

### Étape 5 : Lancer le Déploiement
1. Cliquez sur **Deploy**.
2. Dokploy va :
   - Démarrer le conteneur **PostgreSQL 16** (`oromall_db`).
   - Initialiser les tables SQL avec [schema.sql](file:///home/devs-dylan/Téléchargements/E-Commerce/schema.sql).
   - Compiler l'application React Vite en bundle de production.
   - Démarrer le serveur Node.js unifié (`oromall_app`) sur le port `80`.

---

## 🛡️ Comptes par Défaut Disponibles au Démarrage

- **Super Administrateur** :
  - URL : `/admin/login`
  - PIN : `Tecnodylan14@` (ou email `admin@oromall.cm` / mot de passe `Tecnodylan14@`)
- **Compte Associé Démo** :
  - Email : `associe@oromall.cm`
  - Mot de passe : `Associe2026@`
- **Compte Vendeur Démo** :
  - Email : `vendeur@oromall.cm`
  - Mot de passe : `Vendeur2026@`
