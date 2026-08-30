# Intégration Maketou — site de vente d'e-books (Node.js)

Ce dossier contient une démonstration fonctionnelle React + Node. Un panier réel a été créé avec succès sur la passerelle Maketou et une URL `checkout.moneroo.io` a bien été retournée.

## 1. Configuration

Les secrets doivent rester exclusivement sur le serveur Node :

```env
MAKETOU_MODE=live
MAKETOU_API_BASE=https://api.maketou.net
MAKETOU_API_KEY=cle_secrete_de_la_boutique
MAKETOU_PRODUCT_ID=identifiant_public_du_produit
MAKETOU_FREE_PRICE=true
API_PORT=3001
```

Important :

- La clé API est rattachée à une boutique Maketou précise.
- `MAKETOU_PRODUCT_ID` est l'identifiant public obtenu depuis **Produit → Partager**, pas l'identifiant interne visible dans l'URL du dashboard.
- Le produit « Livre assistant IA » est actuellement configuré en **Prix libre** ; `customerPrice` est donc obligatoire.
- Le fichier `.env` livré est confidentiel et ne doit jamais être poussé sur GitHub.

## 2. Parcours de paiement recommandé

1. Le client choisit un e-book sur le site.
2. Le backend crée une commande locale avec un `orderId`, le produit et son prix.
3. Le frontend demande au backend de démarrer le paiement avec cet `orderId` et les coordonnées du client.
4. Le backend recharge la commande depuis sa base et détermine lui-même `customerPrice`.
5. Le backend appelle Maketou et enregistre immédiatement `cart.id` avec la commande.
6. Le frontend reçoit seulement `redirectUrl` et redirige le client vers Maketou.
7. Après le paiement, le backend consulte le panier Maketou avec son `cartId`.
8. L'e-book est livré uniquement lorsque le statut Maketou est `completed`.

## 3. Création du panier

Endpoint Maketou :

```text
POST https://api.maketou.net/api/v1/stores/cart/checkout
Authorization: Bearer MAKETOU_API_KEY
Content-Type: application/json
```

Exemple de payload généré par le backend :

```json
{
  "productDocumentId": "IDENTIFIANT_PUBLIC_MAKETOU",
  "email": "client@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+237650123456",
  "customerPrice": 5000,
  "redirectURL": "https://site-ebook.com/paiement/retour",
  "meta": {
    "orderId": "CMD-12345",
    "userId": "USER-123",
    "source": "ebook-store"
  }
}
```

Maketou retourne notamment :

```json
{
  "cart": { "id": "...", "status": "waiting_payment" },
  "redirectUrl": "https://checkout.moneroo.io/..."
}
```

Le backend doit enregistrer `cart.id` avant de retourner `redirectUrl` au frontend.

## 4. Prix et sécurité

Le produit Maketou est à prix libre, mais cela ne signifie pas que le client doit choisir le prix sur le site final. Le backend doit :

- récupérer la commande depuis sa base avec `orderId` ;
- récupérer le prix officiel de l'e-book dans sa propre base ;
- envoyer ce prix dans `customerPrice` ;
- ignorer tout prix arbitraire envoyé par le navigateur.

La saisie libre du montant dans cette démo sert uniquement aux tests.

## 5. Téléphone

Maketou attend un numéro international valide. Pour le Cameroun :

```text
+237650123456
```

Le serveur de démonstration transforme automatiquement `650123456` ou `237650123456` en `+237650123456`. En production, conserver une validation E.164 stricte.

## 6. URL de retour

Maketou refuse une URL locale telle que `http://localhost:5173`. La démo omet donc `redirectURL` en local.

En production, utiliser obligatoirement une URL HTTPS publique :

```text
https://site-ebook.com/paiement/retour
```

Le retour du navigateur n'est jamais une preuve de paiement. Il sert seulement à déclencher une vérification côté serveur.

## 7. Vérification du paiement

Endpoint Maketou :

```text
GET https://api.maketou.net/api/v1/stores/cart/{cartId}
Authorization: Bearer MAKETOU_API_KEY
```

Statuts à gérer :

- `waiting_payment` : ne rien livrer ;
- `completed` : valider la commande et autoriser le téléchargement ;
- `abandoned` : marquer la tentative comme abandonnée ;
- `payment_failed` : afficher l'échec et permettre une nouvelle tentative.

La documentation actuellement fournie ne décrit pas de webhook. La confirmation doit donc être réalisée en consultant le panier côté backend, sans interrogation trop fréquente.

## 8. Endpoints Node suggérés

```text
POST /api/orders/:orderId/maketou-checkout
GET  /api/orders/:orderId/payment-status
```

Le frontend ne doit recevoir que l'URL de paiement et le statut de sa commande. Il ne doit jamais recevoir la clé API ni choisir le prix définitif.

## 9. Robustesse obligatoire

- Rendre la validation idempotente : un même panier `completed` ne doit livrer qu'une seule fois.
- Associer chaque `cartId` à une seule commande.
- Vérifier que la commande appartient au client connecté.
- Générer un lien de téléchargement temporaire ou à usage limité.
- Gérer les HTTP `400`, `401`, `404`, `422` et `429`.
- Pour `429`, respecter le header `Retry-After`.
- Journaliser les références sans enregistrer la clé API ni les données sensibles.
- L'API Maketou accepte actuellement un seul produit par panier.
- Maketou choisit les moyens de paiement disponibles ; l'API ne fournit pas de paramètre documenté permettant d'imposer MTN, Orange, Wave ou la carte.

## 10. Lancer la démonstration

```powershell
npm install
npm run dev
```

Puis ouvrir :

```text
http://localhost:5173
```

Documentation officielle : https://docs-api.maketou.com/
