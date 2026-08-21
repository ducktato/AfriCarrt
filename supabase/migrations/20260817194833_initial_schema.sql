-- Reconstructed from the live glbzvocaonvtcgrdmhsx project via the Management
-- API (Docker was unavailable locally for `supabase db pull`/`db dump`, which
-- normally generate this file). Column types, defaults, and constraints below
-- were introspected directly from information_schema / pg_catalog and should
-- match the remote schema exactly; formatting/comments are mine.

create extension if not exists "uuid-ossp" schema extensions;
create extension if not exists "pgcrypto" schema extensions;

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role = any (array['customer', 'store_owner', 'admin'])),
  full_name text,
  phone text,
  phone_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  address text not null,
  lat double precision,
  lng double precision,
  phone text,
  business_license_status text not null default 'pending'
    check (business_license_status = any (array['pending', 'verified', 'rejected'])),
  business_license_number text,
  verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.catalog_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  image_url text,
  is_perishable boolean not null default false,
  is_returnable boolean not null default true,
  suggested_price numeric(10, 2),
  barcode text,
  created_at timestamptz not null default now()
);

create table public.store_listings (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores (id) on delete cascade,
  catalog_item_id uuid references public.catalog_items (id) on delete set null,
  custom_name text,
  custom_image_url text,
  custom_category text,
  is_perishable boolean not null default false,
  is_returnable boolean not null default true,
  price numeric(10, 2) not null,
  stock_qty integer not null default 0,
  low_stock_threshold integer not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint store_listings_check check (
    catalog_item_id is not null or custom_name is not null
  )
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.users (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  fulfillment_type text not null check (fulfillment_type = any (array['pickup', 'delivery'])),
  delivery_tier text check (delivery_tier = any (array['regular', 'priority'])),
  status text not null default 'placed' check (
    status = any (array[
      'placed', 'packing', 'courier_assigned', 'picked_up',
      'delivered', 'completed', 'cancelled'
    ])
  ),
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null default 0,
  service_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  uber_delivery_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders (id) on delete cascade,
  store_listing_id uuid not null references public.store_listings (id),
  item_name text not null,
  qty integer not null check (qty > 0),
  price_at_purchase numeric(10, 2) not null
);

create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  customer_id uuid not null references public.users (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.payouts (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  stripe_transfer_id text,
  amount numeric(10, 2) not null,
  status text not null default 'pending' check (status = any (array['pending', 'paid', 'failed'])),
  created_at timestamptz not null default now()
);
