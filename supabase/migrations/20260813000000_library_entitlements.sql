create table if not exists public.library_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_type text not null check (access_type in ('owner', 'subscriber')),
  active boolean not null default true,
  expires_at timestamptz,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.library_entitlements enable row level security;

revoke all on table public.library_entitlements from anon;
grant select on table public.library_entitlements to authenticated;

drop policy if exists "Users can read their own library entitlement"
  on public.library_entitlements;

create policy "Users can read their own library entitlement"
  on public.library_entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_library_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.library_entitlements
    where user_id = auth.uid()
      and active = true
      and (
        access_type = 'owner'
        or expires_at is null
        or expires_at > now()
      )
  );
$$;

revoke all on function public.has_library_access() from public;
grant execute on function public.has_library_access() to authenticated;

comment on table public.library_entitlements is
  'Minimal library access state. Assessment data must never be stored here.';

comment on function public.has_library_access() is
  'Checks the signed-in user only. Owners have permanent access independent of Stripe.';
