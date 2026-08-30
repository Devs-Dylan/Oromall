export type CheckoutInput = { amount: number; firstName: string; lastName: string; email: string; phone?: string; redirectURL: string; meta?: Record<string, string> };
export type CheckoutResult = { success: boolean; cartId?: string; invoice_url?: string; message?: string };
export type Cart = { id: string; status: 'waiting_payment' | 'completed' | 'abandoned' | 'payment_failed' };

export async function createMaketouCheckoutCart(input: CheckoutInput): Promise<CheckoutResult> {
  const response = await fetch('/api/maketou/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const data = await response.json().catch(() => ({}));
  const message = typeof data.message === 'string' ? data.message : `Erreur serveur (${response.status})`;
  return response.ok ? data : { success: false, message };
}

export async function getMaketouCart(cartId: string): Promise<Cart | null> {
  const response = await fetch(`/api/maketou/cart/${encodeURIComponent(cartId)}`);
  return response.ok ? response.json() : null;
}

export const maketouCartStorageKey = (reference: string) => `maketou_cart_${reference}`;
