-- Table pour stocker les notifications SMS captées par l'app Android Kotlin
CREATE TABLE IF NOT EXISTS public.payment_sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender VARCHAR(50) NOT NULL, -- Ex: "MTN MobileMoney" ou "OrangeMoney"
  message_raw TEXT NOT NULL,
  amount NUMERIC(12, 2),
  transaction_id VARCHAR(100) UNIQUE,
  sender_phone VARCHAR(50),
  matched BOOLEAN DEFAULT false,
  matched_order_id UUID,
  matched_visit_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_txn_id ON payment_sms_logs(transaction_id);
