-- 001_schema.sql
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- Prices are stored as INTEGER whole naira (15000 = ₦15,000). No decimals anywhere.

-- ---------- Tables ----------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null check (price >= 0),
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid not null references auth.users(id),
  idempotency_key text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  total_amount bigint not null check (total_amount >= 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  price integer not null check (price >= 0), -- product price AT THE TIME of the order
  created_at timestamptz not null default now()
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index order_items_order_idx on public.order_items (order_id);

-- ---------- Row Level Security ----------
-- Customers can only READ. All order writes go through the create_order function
-- (002), which is callable only by the server (service_role).

alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "products: public read"
  on public.products for select
  using (true);

create policy "orders: read own"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "order_items: read own"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

-- ---------- Create a profile automatically on first sign-in ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
