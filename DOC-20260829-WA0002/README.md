# Test Maketou

## Lancer immédiatement en simulation

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Ouvrir http://localhost:5173. Le mode `mock` valide le parcours sans paiement réel.

## Créer un vrai panier visible dans le dashboard Maketou

Dans `.env`, mettre `MAKETOU_MODE=live`, la vraie `MAKETOU_API_KEY` et le `MAKETOU_PRODUCT_ID`, puis redémarrer. La clé doit rester côté serveur et ne doit jamais être préfixée `VITE_`.

Maketou exige une `redirectURL` publique valide. En local (`http://localhost`), la démo l'omet automatiquement. Sur le site réel, utilisez une URL HTTPS comme `https://site-ebook.com/paiement/retour`.

## À remettre au propriétaire du site d'e-books

Il doit intégrer `maketou.ts` au frontend, les deux routes de `server.mjs` au backend et les secrets sur son serveur. En production, la livraison de l'e-book doit être déclenchée seulement après vérification serveur du statut du panier Maketou. La documentation actuelle ne décrit pas de webhook et le retour navigateur seul n'est pas une preuve de paiement. Voir `NOTE_INTEGRATION_NODE.md`.
