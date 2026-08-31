create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  customer_email text,
  payment_status text not null,
  currency text,
  amount_total bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists store_orders_payment_intent_key
  on public.store_orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists store_orders_customer_email_idx
  on public.store_orders (lower(customer_email))
  where customer_email is not null;

create table if not exists public.store_order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.store_orders (id) on delete cascade,
  stripe_product_id text not null,
  stripe_price_id text,
  product_slug text not null,
  quantity integer not null default 1 check (quantity > 0),
  amount_total bigint,
  created_at timestamptz not null default now(),
  unique (order_id, stripe_product_id)
);

create index if not exists store_order_items_product_slug_idx
  on public.store_order_items (product_slug);

alter table public.store_orders enable row level security;
alter table public.store_order_items enable row level security;

revoke all on table public.store_orders from anon, authenticated;
revoke all on table public.store_order_items from anon, authenticated;
revoke all on sequence public.store_order_items_id_seq from anon, authenticated;

comment on table public.store_orders is
  'Minimal Stripe order data for one-time product fulfillment. No assessment data belongs here.';

comment on table public.store_order_items is
  'Recognized Survivor Systems products included in a verified Stripe Checkout order.';
