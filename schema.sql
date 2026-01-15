-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- Properties Table
create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  base_price numeric not null,
  min_price numeric not null,
  max_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rooms Table
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade not null,
  status text check (status in ('available', 'maintenance', 'occupied')) default 'available',
  type text not null,
  current_price numeric,
  last_logic_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings Table
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  check_in date not null,
  check_out date not null,
  total_paid numeric not null,
  status text check (status in ('confirmed', 'cancelled')) default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Price History Table
create table if not exists price_history (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  old_price numeric,
  new_price numeric not null,
  reason text,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- System Settings
create table if not exists system_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table properties enable row level security;
alter table rooms enable row level security;
alter table bookings enable row level security;
alter table price_history enable row level security;
alter table system_settings enable row level security;

-- Allow public read access (for simplicity in this demo app)
create policy "Public read properties" on properties for select using (true);
create policy "Public read rooms" on rooms for select using (true);
create policy "Public read bookings" on bookings for select using (true);
create policy "Public read price_history" on price_history for select using (true);
create policy "Public read system_settings" on system_settings for select using (true);
