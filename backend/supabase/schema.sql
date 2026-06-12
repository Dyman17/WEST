-- WEST PostgreSQL schema
-- Canonical production model + legacy compatibility tables for the current demo backend.
-- Roles are only: admin, shipper, carrier.

create extension if not exists "pgcrypto";

-- =====================================================================
-- ENUM-LIKE CHECK VALUES
-- =====================================================================

-- Roles:
--   admin   - Akimat / system administration
--   shipper - грузоотправитель
--   carrier - перевозчик / транспортная компания

-- =====================================================================
-- CORE USERS
-- =====================================================================

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text unique not null,
  name text not null,
  role text not null check (role in ('admin', 'shipper', 'carrier')),
  password text not null default '1234',
  company text,
  capabilities text[] not null default '{}',
  avatar_url text,
  phone text,
  language text not null default 'ru' check (language in ('ru', 'kk', 'en')),
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shipper_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  tax_number text,
  contact_person text,
  contact_phone text,
  preferred_language text not null default 'ru' check (preferred_language in ('ru', 'kk', 'en')),
  organization_type text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- GEO CATALOG
-- =====================================================================

create table if not exists locations (
  id bigserial primary key,
  name_ru text not null,
  name_kk text not null,
  name_en text not null,
  lat numeric(10,8) not null,
  lng numeric(11,8) not null,
  type text not null check (type in ('port', 'border', 'city', 'rail_terminal')),
  region text not null default 'Mangystau',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists carrier_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  company_name text not null,
  transport_type text not null check (transport_type in ('truck', 'ship', 'rail')),
  plate_number text,
  fuel_type text check (fuel_type in ('diesel', 'electric', 'lng', 'petrol')),
  home_location_id bigint references locations(id),
  rating numeric(3,2) not null default 0,
  eco_score numeric(3,2) not null default 0.50,
  total_trips int not null default 0,
  total_delays int not null default 0,
  total_cancellations int not null default 0,
  average_response_minutes int not null default 0,
  available boolean not null default true,
  status text not null default 'online' check (status in ('online', 'offline', 'busy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- SHIPMENTS / ORDERS
-- =====================================================================

create table if not exists shipments (
  id bigserial primary key,
  shipper_id uuid not null references users(id) on delete cascade,
  carrier_id uuid references users(id) on delete set null,
  from_location_id bigint not null references locations(id),
  to_location_id bigint not null references locations(id),
  weight_ton numeric(8,2) not null check (weight_ton > 0),
  cargo_type text not null check (cargo_type in ('container', 'bulk', 'oversized', 'liquid', 'perishable')),
  price_tenge numeric(12,2) not null default 0,
  tariff_type text not null default 'standard' check (tariff_type in ('standard', 'express')),
  status text not null default 'open' check (status in ('open', 'assigned', 'in_transit', 'delivered', 'cancelled')),
  notes text,
  current_lat numeric(10,8),
  current_lng numeric(11,8),
  assigned_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipments_status on shipments(status);
create index if not exists idx_shipments_shipper on shipments(shipper_id);
create index if not exists idx_shipments_carrier on shipments(carrier_id);
create index if not exists idx_shipments_created on shipments(created_at desc);
create index if not exists idx_shipments_route on shipments(from_location_id, to_location_id);

create table if not exists tracking_points (
  id bigserial primary key,
  shipment_id bigint not null references shipments(id) on delete cascade,
  lat numeric(10,8) not null,
  lng numeric(11,8) not null,
  speed_kph numeric(6,2),
  recorded_at timestamptz not null default now()
);

create table if not exists reviews (
  id bigserial primary key,
  shipment_id bigint not null references shipments(id) on delete cascade,
  reviewer_id uuid not null references users(id) on delete cascade,
  carrier_id uuid not null references users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists violations (
  id bigserial primary key,
  carrier_id uuid not null references users(id) on delete cascade,
  shipment_id bigint references shipments(id) on delete cascade,
  type text not null check (type in ('late', 'cancellation', 'damage', 'speeding')),
  points_deduct int not null default 10,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists tinder_likes (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  shipment_id bigint not null references shipments(id) on delete cascade,
  action text not null check (action in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique(user_id, shipment_id)
);

create table if not exists matches (
  id bigserial primary key,
  shipment_id bigint not null references shipments(id) on delete cascade,
  carrier_id uuid not null references users(id) on delete cascade,
  shipper_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(shipment_id)
);

create table if not exists empty_load_offers (
  id bigserial primary key,
  shipment_id bigint not null references shipments(id) on delete cascade,
  suggested_carrier_id uuid not null references users(id) on delete cascade,
  direction text not null check (direction in ('along_way', 'return')),
  extra_weight_ton numeric(8,2),
  extra_price_tenge numeric(12,2),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists port_bookings (
  id bigserial primary key,
  carrier_id uuid not null references users(id) on delete cascade,
  location_id bigint not null references locations(id) on delete cascade,
  booked_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'used', 'cancelled')),
  qr_code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_port_bookings_location_time on port_bookings(location_id, booked_at);
create index if not exists idx_port_bookings_carrier on port_bookings(carrier_id);

-- =====================================================================
-- AI LAYER
-- =====================================================================

create table if not exists ai_prompts (
  key text primary key,
  title text not null,
  category text not null,
  description text not null,
  template text not null,
  instructions text not null,
  model text not null default 'o4-mini',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists ai_analyses (
  id text primary key,
  prompt_key text references ai_prompts(key) on delete set null,
  entity_type text not null,
  entity_id text not null,
  input_json jsonb not null default '{}'::jsonb,
  summary text not null,
  bullets text[] not null default '{}',
  source text not null default 'mock',
  model text not null default 'o4-mini',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_analyses_prompt on ai_analyses(prompt_key, created_at desc);

-- =====================================================================
-- AKIMAT ANALYTICS
-- =====================================================================

create table if not exists akimat_analytics_daily (
  day date primary key,
  total_shipments int not null default 0,
  total_weight_ton numeric(12,2) not null default 0,
  open_shipments int not null default 0,
  assigned_shipments int not null default 0,
  delivered_shipments int not null default 0,
  avg_wait_hours numeric(5,2) not null default 0,
  avg_carrier_rating numeric(3,2) not null default 0,
  saved_time_hours int not null default 0,
  saved_money_tenge numeric(14,2) not null default 0,
  top_location_id bigint references locations(id),
  notes text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- DEMO / LEGACY COMPATIBILITY TABLES
-- Keep these while the current backend still reads demo store names.
-- Remove them only after migrating the backend to the canonical tables above.
-- =====================================================================

create table if not exists drivers (
  id text primary key,
  name text not null,
  transport_type text not null check (transport_type in ('truck', 'ship', 'rail')),
  rating numeric(3,1) not null default 0,
  score int not null default 0,
  trips int not null default 0,
  eco int not null default 0,
  delays int not null default 0,
  cancels int not null default 0,
  home_base text not null,
  routes text[] not null default '{}',
  hourly_rate int not null default 0,
  price_per_km int not null default 0,
  available boolean not null default true,
  status text not null default 'online'
);

create table if not exists freights (
  id text primary key,
  "from" text not null,
  "to" text not null,
  weight numeric(8,2) not null,
  type text not null,
  price int not null,
  shipper text not null,
  rating numeric(3,1) not null default 0,
  eco boolean not null default false,
  distance int not null default 0,
  transport_type text not null check (transport_type in ('truck', 'ship', 'rail')),
  status text not null default 'open',
  priority int not null default 0,
  deadline date not null
);

create table if not exists ports (
  id text primary key,
  name text not null,
  city text not null,
  kind text not null,
  load int not null default 0,
  status text not null default 'free',
  capacity_per_day int not null default 40,
  timezone text not null default 'Asia/Qyzylorda',
  latitude numeric(10,8),
  longitude numeric(11,8)
);

create table if not exists bookings (
  id text primary key,
  port_id text not null references ports(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  slot text not null,
  purpose text not null,
  status text not null default 'confirmed'
);

create table if not exists lessons (
  id text primary key,
  title text not null,
  description text not null,
  duration_minutes int not null,
  language text not null,
  stage int not null
);

create table if not exists trajectories (
  id text primary key,
  "from" text not null,
  "to" text not null,
  mode text not null,
  status text not null,
  load int not null default 0,
  distance int not null default 0,
  congestion text not null,
  note text not null
);

create table if not exists rating_rules (
  key text primary key,
  label text not null,
  weight numeric(5,2) not null,
  source text not null
);

create table if not exists freight_decisions (
  id text primary key,
  freight_id text not null references freights(id) on delete cascade,
  user_id uuid,
  decision text not null check (decision in ('take', 'skip')),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- RLS NOTES
-- Enable row-level security in production and add policies for:
-- - users see only their own profile
-- - shippers see their own shipments
-- - carriers see open shipments plus their assignments
-- - admin sees akimat analytics and everything else
-- =====================================================================
