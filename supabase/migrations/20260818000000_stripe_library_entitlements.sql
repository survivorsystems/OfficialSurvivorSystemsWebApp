alter table public.library_entitlements
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_status text;

create unique index if not exists library_entitlements_stripe_customer_id_key
  on public.library_entitlements (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists library_entitlements_stripe_subscription_id_key
  on public.library_entitlements (stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column public.library_entitlements.stripe_customer_id is
  'Stripe customer identifier used only to synchronize paid library access.';

comment on column public.library_entitlements.stripe_subscription_id is
  'Stripe subscription identifier used only to synchronize paid library access.';

comment on column public.library_entitlements.stripe_status is
  'Last subscription status received from the verified Stripe webhook.';
