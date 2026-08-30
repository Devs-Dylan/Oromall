import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Clock, CreditCard, Loader2, ShieldCheck, Wallet, XCircle } from 'lucide-react';
import { createMaketouCheckoutCart, getMaketouCart, maketouCartStorageKey } from './maketou';

type Deposit = { reference: string; amount: number; status: 'pending' | 'approved' | 'failed'; createdAt: string };
const STORAGE = 'maketou_demo_deposits';
const MIN_PRICE = 500;
const paymentMethods = [
  { name: 'MTN Mobile Money', mark: 'MTN', color: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300' },
  { name: 'Orange Money', mark: 'OM', color: 'border-orange-400/40 bg-orange-400/10 text-orange-300' },
  { name: 'Moov Money', mark: 'MOOV', color: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  { name: 'Airtel Money', mark: 'AIRTEL', color: 'border-red-400/40 bg-red-400/10 text-red-300' },
  { name: 'Wave', mark: 'WAVE', color: 'border-sky-400/40 bg-sky-400/10 text-sky-300' },
  { name: 'Visa / Mastercard', mark: 'CARD', color: 'border-indigo-400/40 bg-indigo-400/10 text-indigo-300' },
  { name: 'PayPal', mark: 'PAYPAL', color: 'border-blue-400/40 bg-blue-400/10 text-blue-300' },
];
const format = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const read = (): Deposit[] => { try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; } };

export default function DepositPage() {
  const [amount, setAmount] = useState('5000');
  const [firstName, setFirstName] = useState('Client');
  const [lastName, setLastName] = useState('Test');
  const [email, setEmail] = useState('client@example.com');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [deposits, setDeposits] = useState<Deposit[]>(read);

  const save = (items: Deposit[]) => { setDeposits(items); localStorage.setItem(STORAGE, JSON.stringify(items)); };
  const changeStatus = (ref: string, status: Deposit['status']) => save(read().map((d) => d.reference === ref ? { ...d, status } : d));

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const ref = query.get('ref');
    if (query.get('status') !== 'return' || !ref) return;
    history.replaceState({}, '', '/');
    const cartId = localStorage.getItem(maketouCartStorageKey(ref));
    if (!cartId) return setMessage({ ok: false, text: 'Référence locale du panier introuvable.' });
    getMaketouCart(cartId).then((cart) => {
      if (cart?.status === 'completed') { changeStatus(ref, 'approved'); setMessage({ ok: true, text: 'Paiement confirmé par Maketou.' }); }
      else if (cart?.status === 'abandoned' || cart?.status === 'payment_failed') { changeStatus(ref, 'failed'); setMessage({ ok: false, text: 'Paiement échoué ou abandonné.' }); }
      else setMessage({ ok: true, text: 'Paiement en attente de confirmation.' });
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setMessage(undefined);
    const value = Number(amount);
    if (!Number.isFinite(value) || value < MIN_PRICE) return setMessage({ ok: false, text: `Le montant minimum de test est ${format(MIN_PRICE)}.` });
    setLoading(true);
    const reference = `DEP-${Date.now()}`;
    save([{ reference, amount: value, status: 'pending', createdAt: new Date().toISOString() }, ...deposits]);
    try {
      const result = await createMaketouCheckoutCart({ amount: value, firstName, lastName, email, phone, redirectURL: `${location.origin}/?status=return&ref=${reference}`, meta: { reference, source: 'ebook-store-test' } });
      if (!result.success || !result.invoice_url) throw new Error(result.message || 'URL de paiement absente.');
      if (result.cartId) localStorage.setItem(maketouCartStorageKey(reference), result.cartId);
      location.assign(result.invoice_url);
    } catch (error) { setLoading(false); setMessage({ ok: false, text: error instanceof Error ? error.message : 'Paiement impossible.' }); }
  }

  return <main className="min-h-screen bg-[#050508] px-4 py-10 text-white"><div className="mx-auto max-w-xl space-y-6">
    <header className="text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600"><Wallet /></div><h1 className="text-3xl font-black">Paiement sécurisé</h1><p className="mt-2 text-sm text-slate-400">Finalisez l’achat de votre e-book avec Maketou</p></header>
    {message && <div className={`flex gap-3 rounded-2xl border p-4 ${message.ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-red-500/40 bg-red-500/10 text-red-300'}`}>{message.ok ? <CheckCircle2 /> : <XCircle />} {message.text}</div>}
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="flex justify-between"><h2 className="flex gap-2 font-bold"><CreditCard /> Paiement</h2><span className="flex gap-1 text-xs text-emerald-300"><ShieldCheck size={16}/> Sécurisé</span></div>
      <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4"><p className="text-xs uppercase tracking-wider text-indigo-300">Votre commande</p><h3 className="mt-1 text-lg font-black">Livre assistant IA</h3><p className="mt-1 text-xs text-slate-400">Produit Maketou configuré en prix libre.</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Prénom" value={firstName} set={setFirstName}/><Field label="Nom" value={lastName} set={setLastName}/></div>
      <Field label="E-mail" type="email" value={email} set={setEmail}/><Field label="Téléphone (+2376XXXXXXXX)" type="tel" value={phone} set={setPhone}/>
      <Field label="Montant à payer (FCFA)" type="number" value={amount} set={setAmount} min={MIN_PRICE}/>
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-300">Moyens de paiement disponibles</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{paymentMethods.map((method) => <div key={method.name} className={`rounded-xl border p-3 text-center ${method.color}`}><div className="text-xs font-black">{method.mark}</div><div className="mt-1 text-[11px] text-slate-300">{method.name}</div></div>)}</div>
        <p className="mt-2 text-[11px] text-slate-500">Les options proposées par Maketou peuvent varier selon le pays et la devise du client.</p>
      </div>
      <button disabled={loading} className="flex w-full justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-bold hover:bg-indigo-500 disabled:opacity-50">{loading ? <Loader2 className="animate-spin"/> : <CreditCard/>}{loading ? 'Ouverture du paiement…' : 'Payer'}</button>
    </form>
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6"><h2 className="mb-4 font-bold">Historique local</h2>{!deposits.length ? <p className="text-sm text-slate-400">Aucun test.</p> : deposits.map((d) => <article key={d.reference} className="mb-3 flex justify-between rounded-xl bg-black/20 p-3"><div><strong>{format(d.amount)}</strong><div className="text-xs text-slate-400">{d.reference}</div></div><span className="flex items-center gap-1 text-xs">{d.status === 'approved' ? <CheckCircle2 size={16} className="text-emerald-400"/> : d.status === 'failed' ? <XCircle size={16} className="text-red-400"/> : <Clock size={16} className="text-amber-400"/>}{d.status}</span></article>)}</section>
  </div></main>;
}

function Field({ label, value, set, type = 'text', min }: { label: string; value: string; set: (v: string) => void; type?: string; min?: number }) {
  return <label className="block text-sm font-semibold text-slate-300">{label}<input required type={type} min={min} value={value} onChange={(e) => set(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-indigo-500"/></label>;
}
