import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = Number(process.env.API_PORT || 3001);
const base = process.env.MAKETOU_API_BASE || 'https://api.maketou.net';
const apiKey = process.env.MAKETOU_API_KEY || 'msk_09c77ea0fe53d89a1947898a1318de60e383561ea023e48a56321080ff98b080';
const productId = process.env.MAKETOU_PRODUCT_ID || 'e4899b0b-c18e-4728-bfae-eb19fc7e6fc7';

app.use(cors());
app.use(express.json());

function normalizePhone(value) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (/^6\d{8}$/.test(digits)) return `+237${digits}`;
  if (/^2376\d{8}$/.test(digits)) return `+${digits}`;
  if (raw.startsWith('+') && /^\+[1-9]\d{7,14}$/.test(`+${digits}`)) return `+${digits}`;
  return null;
}

// Endpoint 1: Création du panier de paiement Maketou
app.post('/api/maketou/checkout', async (req, res) => {
  const { amount, firstName, lastName, email, phone, redirectURL, meta } = req.body || {};
  if (!(Number(amount) > 0) || !email) {
    return res.status(400).json({ success: false, message: 'Données de paiement invalides.' });
  }

  const normalizedPhone = normalizePhone(phone);

  try {
    const payload = {
      productDocumentId: productId,
      email,
      firstName: firstName || 'Client',
      lastName: lastName || 'OroMall',
      phone: normalizedPhone || undefined,
      customerPrice: Number(amount),
      meta,
    };

    if (typeof redirectURL === 'string' && /^https:\/\//i.test(redirectURL)) {
      payload.redirectURL = redirectURL;
    }

    const up = await fetch(`${base}/api/v1/stores/cart/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await up.json().catch(() => ({}));

    if (up.ok) {
      return res.json({
        success: true,
        cartId: data.cart?.id || data.id,
        invoice_url: data.redirectUrl || data.invoice_url,
      });
    }

    return res.status(up.status).json({
      success: false,
      code: data.code || data.error,
      message: data.message || `Erreur Maketou (${up.status})`,
    });
  } catch (error) {
    console.error('Erreur réseau Maketou checkout :', error instanceof Error ? error.message : error);
    return res.status(502).json({
      success: false,
      message: 'Passerelle Maketou temporairement inaccessible. Réessayez dans un instant.',
    });
  }
});

// Endpoint 2: Vérification du statut du panier
app.get('/api/maketou/cart/:id', async (req, res) => {
  try {
    const up = await fetch(`${base}/api/v1/stores/cart/${encodeURIComponent(req.params.id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.status(up.status).json(await up.json());
  } catch (error) {
    return res.status(502).json({ message: 'API Maketou inaccessible.' });
  }
});

app.listen(port, () => console.log(`🚀 Serveur API Maketou OroMall actif sur http://localhost:${port}`));
