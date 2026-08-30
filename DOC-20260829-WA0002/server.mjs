import 'dotenv/config';
import express from 'express';
const app = express(), port = Number(process.env.API_PORT || 3001), base = process.env.MAKETOU_API_BASE || 'https://api.maketou.net', mock = process.env.MAKETOU_MODE !== 'live';
const carts = new Map(); app.use(express.json());
function maketouErrorMessage(data, status) {
  if (typeof data?.message === 'string') {
    if (/NumberPhone/i.test(data.message)) return 'Numéro invalide. Utilisez le format international, par exemple +2376XXXXXXXX.';
    return data.message;
  }
  if (Array.isArray(data?.message)) {
    const details = data.message.flatMap((item) => Object.values(item?.constraints || {}));
    if (details.length) return details.join(' ');
  }
  return `Erreur Maketou (${status})`;
}
function normalizePhone(value) {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (/^6\d{8}$/.test(digits)) return `+237${digits}`;
  if (/^2376\d{8}$/.test(digits)) return `+${digits}`;
  if (raw.startsWith('+') && /^\+[1-9]\d{7,14}$/.test(`+${digits}`)) return `+${digits}`;
  return null;
}
app.post('/api/maketou/checkout', async (req, res) => {
  const { amount, firstName, lastName, email, phone, redirectURL, meta } = req.body || {};
  if (!(Number(amount) > 0) || !email || !redirectURL) return res.status(400).json({ success: false, message: 'Données invalides.' });
  const normalizedPhone = normalizePhone(phone);
  if (phone && !normalizedPhone) return res.status(400).json({ success: false, message: 'Numéro invalide. Pour le Cameroun : +2376XXXXXXXX ou 6XXXXXXXX.' });
  if (mock) { const id = `mock-${Date.now()}`; carts.set(id, { id, status: 'completed' }); return res.json({ success: true, cartId: id, invoice_url: redirectURL }); }
  if (!process.env.MAKETOU_API_KEY || !process.env.MAKETOU_PRODUCT_ID) return res.status(500).json({ success: false, message: 'Configuration Maketou absente de .env.' });
  try {
    const payload = { productDocumentId: process.env.MAKETOU_PRODUCT_ID, email, firstName, lastName, phone: normalizedPhone || undefined, meta };
    // Maketou refuse les URL localhost. En production, fournir une URL HTTPS publique.
    if (typeof redirectURL === 'string' && /^https:\/\//i.test(redirectURL)) payload.redirectURL = redirectURL;
    // customerPrice est réservé aux produits configurés "Prix libre" dans Maketou.
    if (process.env.MAKETOU_FREE_PRICE === 'true') payload.customerPrice = Number(amount);
    const up = await fetch(`${base}/api/v1/stores/cart/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MAKETOU_API_KEY}` }, body: JSON.stringify(payload) });
    const data = await up.json().catch(() => ({}));
    if (up.ok) return res.json({ success: true, cartId: data.cart?.id, invoice_url: data.redirectUrl });
    const code = data.code || data.error;
    const message = code === 'INVALID_PRODUCT'
      ? 'Produit Maketou indisponible. Publiez-le puis utilisez son Identifiant public depuis Produit → Partager.'
      : maketouErrorMessage(data, up.status);
    return res.status(up.status).json({ success: false, code, message });
  } catch (error) {
    console.error('Erreur réseau Maketou checkout :', error instanceof Error ? error.message : error);
    return res.status(502).json({ success: false, message: 'API Maketou temporairement inaccessible. Réessayez dans un instant.' });
  }
});
app.get('/api/maketou/cart/:id', async (req, res) => { if (mock) return res.json(carts.get(req.params.id) || { id: req.params.id, status: 'completed' }); try { const up = await fetch(`${base}/api/v1/stores/cart/${encodeURIComponent(req.params.id)}`, { headers: { Authorization: `Bearer ${process.env.MAKETOU_API_KEY}` } }); return res.status(up.status).json(await up.json()); } catch { return res.status(502).json({ message: 'API Maketou inaccessible.' }); } });
app.listen(port, () => console.log(`API locale http://localhost:${port} — mode ${mock ? 'mock' : 'live'}`));
