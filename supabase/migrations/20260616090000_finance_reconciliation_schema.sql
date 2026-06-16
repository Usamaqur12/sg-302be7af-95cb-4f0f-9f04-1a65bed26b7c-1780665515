-- Finance ledger, payment event, refund, payout batch, and COD reconciliation schema.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_entry_direction') THEN
    CREATE TYPE public.finance_entry_direction AS ENUM ('debit', 'credit');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_entry_status') THEN
    CREATE TYPE public.finance_entry_status AS ENUM ('pending', 'posted', 'voided');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_event_status') THEN
    CREATE TYPE public.payment_event_status AS ENUM ('received', 'processed', 'ignored', 'failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_record_status') THEN
    CREATE TYPE public.refund_record_status AS ENUM ('requested', 'approved', 'processing', 'completed', 'failed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_batch_status') THEN
    CREATE TYPE public.payout_batch_status AS ENUM ('draft', 'approved', 'processing', 'paid', 'failed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_item_status') THEN
    CREATE TYPE public.payout_item_status AS ENUM ('pending', 'included', 'paid', 'failed', 'withheld');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cod_reconciliation_status') THEN
    CREATE TYPE public.cod_reconciliation_status AS ENUM ('awaiting_collection', 'collected', 'partially_remitted', 'reconciled', 'short_paid', 'over_paid', 'disputed', 'written_off');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_type text NOT NULL,
  event_status public.payment_event_status NOT NULL DEFAULT 'received',
  provider_event_id text,
  provider_payment_id text,
  amount decimal(12,2),
  currency text NOT NULL DEFAULT 'PKR',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_events_provider_event_unique UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order ON public.payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON public.payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_status ON public.payment_events(event_status, received_at);
CREATE INDEX IF NOT EXISTS idx_payment_events_provider_payment ON public.payment_events(provider, provider_payment_id);

CREATE TABLE IF NOT EXISTS public.refund_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  return_request_id uuid,
  requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'PKR',
  reason text NOT NULL,
  status public.refund_record_status NOT NULL DEFAULT 'requested',
  provider text,
  provider_refund_id text,
  notes text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_at timestamp with time zone,
  processed_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_records_order ON public.refund_records(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_records_payment ON public.refund_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_records_return_request ON public.refund_records(return_request_id);
CREATE INDEX IF NOT EXISTS idx_refund_records_status ON public.refund_records(status, requested_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refund_records_provider_refund
  ON public.refund_records(provider, provider_refund_id)
  WHERE provider IS NOT NULL AND provider_refund_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payout_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text NOT NULL UNIQUE,
  status public.payout_batch_status NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'PKR',
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  total_fees decimal(12,2) NOT NULL DEFAULT 0,
  net_amount decimal(12,2) NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  payout_method text,
  payout_reference text,
  scheduled_for date,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  processed_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_batches_status ON public.payout_batches(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_payout_batches_reference ON public.payout_batches(payout_reference);

CREATE TABLE IF NOT EXISTS public.payout_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_batch_id uuid NOT NULL REFERENCES public.payout_batches(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE RESTRICT,
  seller_earning_id uuid REFERENCES public.seller_earnings(id) ON DELETE SET NULL,
  withdrawal_request_id uuid REFERENCES public.withdrawal_requests(id) ON DELETE SET NULL,
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  fee_amount decimal(12,2) NOT NULL DEFAULT 0,
  net_amount decimal(12,2) NOT NULL CHECK (net_amount >= 0),
  status public.payout_item_status NOT NULL DEFAULT 'pending',
  failure_reason text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payout_batch_items_source_check CHECK (
    seller_earning_id IS NOT NULL OR withdrawal_request_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_payout_batch_items_batch ON public.payout_batch_items(payout_batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_seller ON public.payout_batch_items(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_earning ON public.payout_batch_items(seller_earning_id);
CREATE INDEX IF NOT EXISTS idx_payout_batch_items_withdrawal ON public.payout_batch_items(withdrawal_request_id);

CREATE TABLE IF NOT EXISTS public.cod_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  courier_name text,
  courier_reference text,
  expected_amount decimal(12,2) NOT NULL CHECK (expected_amount >= 0),
  collected_amount decimal(12,2) NOT NULL DEFAULT 0 CHECK (collected_amount >= 0),
  remitted_amount decimal(12,2) NOT NULL DEFAULT 0 CHECK (remitted_amount >= 0),
  courier_fee decimal(12,2) NOT NULL DEFAULT 0 CHECK (courier_fee >= 0),
  discrepancy_amount decimal(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PKR',
  status public.cod_reconciliation_status NOT NULL DEFAULT 'awaiting_collection',
  collected_at timestamp with time zone,
  remitted_at timestamp with time zone,
  reconciled_at timestamp with time zone,
  reconciled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cod_reconciliations_order_unique UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_cod_reconciliations_status ON public.cod_reconciliations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_cod_reconciliations_payment ON public.cod_reconciliations(payment_id);
CREATE INDEX IF NOT EXISTS idx_cod_reconciliations_courier ON public.cod_reconciliations(courier_name, courier_reference);

CREATE TABLE IF NOT EXISTS public.finance_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number text NOT NULL UNIQUE,
  entry_type text NOT NULL,
  direction public.finance_entry_direction NOT NULL,
  status public.finance_entry_status NOT NULL DEFAULT 'pending',
  account_code text NOT NULL,
  seller_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  payment_event_id uuid REFERENCES public.payment_events(id) ON DELETE SET NULL,
  refund_record_id uuid REFERENCES public.refund_records(id) ON DELETE SET NULL,
  payout_batch_id uuid REFERENCES public.payout_batches(id) ON DELETE SET NULL,
  payout_batch_item_id uuid REFERENCES public.payout_batch_items(id) ON DELETE SET NULL,
  cod_reconciliation_id uuid REFERENCES public.cod_reconciliations(id) ON DELETE SET NULL,
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'PKR',
  memo text,
  idempotency_key text,
  posted_at timestamp with time zone,
  voided_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_status ON public.finance_ledger_entries(status, posted_at);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_account ON public.finance_ledger_entries(account_code, direction);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_order ON public.finance_ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_seller ON public.finance_ledger_entries(seller_id);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_payment ON public.finance_ledger_entries(payment_id);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_refund ON public.finance_ledger_entries(refund_record_id);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_payout ON public.finance_ledger_entries(payout_batch_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_ledger_entries_idempotency
  ON public.finance_ledger_entries(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cod_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_events_select_admin" ON public.payment_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "refund_records_select_related_or_admin" ON public.refund_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = refund_records.order_id AND orders.customer_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "payout_batches_select_admin" ON public.payout_batches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "payout_batch_items_select_seller_or_admin" ON public.payout_batch_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.seller_profiles WHERE seller_profiles.id = payout_batch_items.seller_id AND seller_profiles.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "cod_reconciliations_select_admin" ON public.cod_reconciliations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "finance_ledger_entries_select_seller_or_admin" ON public.finance_ledger_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.seller_profiles WHERE seller_profiles.id = finance_ledger_entries.seller_id AND seller_profiles.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
