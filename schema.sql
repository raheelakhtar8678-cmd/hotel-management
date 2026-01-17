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

-- Room Extras Table (add-ons like breakfast, parking, etc.)
create table if not exists room_extras (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  booking_id uuid references bookings(id) on delete cascade,
  item_name text not null,
  item_category text check (item_category in ('food', 'beverage', 'service', 'amenity', 'other')) default 'other',
  price numeric not null,
  quantity int default 1,
  description text,
  status text check (status in ('pending', 'paid', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings Table
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  guest_name text not null,
  guest_email text,
  check_in date not null,
  check_out date not null,
  guests int default 1,
  total_paid numeric not null,
  status text check (status in ('confirmed', 'cancelled')) default 'confirmed',
  channel text check (channel in ('booking_com', 'expedia', 'airbnb', 'direct', 'other')) default 'direct',
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
alter table room_extras enable row level security;
alter table bookings enable row level security;
alter table price_history enable row level security;
alter table system_settings enable row level security;

-- Allow public read access (for simplicity in this demo app)
create policy "Public read properties" on properties for select using (true);
create policy "Public read rooms" on rooms for select using (true);
create policy "Public read room_extras" on room_extras for select using (true);
create policy "Public read bookings" on bookings for select using (true);
create policy "Public read price_history" on price_history for select using (true);
create policy "Public read system_settings" on system_settings for select using (true);
