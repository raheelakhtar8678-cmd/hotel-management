# Database Setup Guide 🛠️

To make the Hotel Management System fully functional (including Refunds, Revenue Pace, and Analytics), you need to set up your database tables correctly.

Run the following SQL commands in your **Neon / PostgreSQL** SQL Editor.

## 1. Full Database Schema (Run this if starting fresh)

```sql
-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- 1. Properties
create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  base_price numeric not null,
  min_price numeric not null,
  max_price numeric not null,
  caretaker_name text,
  caretaker_email text,
  caretaker_phone text,
  structure_details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Rooms
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade not null,
  status text check (status in ('available', 'maintenance', 'occupied')) default 'available',
  type text not null,
  current_price numeric,
  last_logic_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Bookings (With Refund Support)
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  guest_name text not null,
  guest_email text,
  check_in date not null,
  check_out date not null,
  guests int default 1,
  total_paid numeric not null,
  status text check (status in ('confirmed', 'cancelled', 'refunded')) default 'confirmed',
  channel text check (channel in ('booking_com', 'expedia', 'airbnb', 'direct', 'other')) default 'direct',
  refund_amount numeric default 0,
  refund_reason text,
  refunded_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Room Extras
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

-- 5. Price History
create table if not exists price_history (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  old_price numeric,
  new_price numeric not null,
  reason text,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. System Settings
create table if not exists system_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Security Policies
alter table properties enable row level security;
alter table rooms enable row level security;
alter table room_extras enable row level security;
alter table bookings enable row level security;
alter table price_history enable row level security;
alter table system_settings enable row level security;

-- Allow Public Access (Change if Auth is added later)
create policy "Public read properties" on properties for select using (true);
create policy "Public read rooms" on rooms for select using (true);
create policy "Public read room_extras" on room_extras for select using (true);
create policy "Public read bookings" on bookings for select using (true);
create policy "Public read price_history" on price_history for select using (true);
create policy "Public read system_settings" on system_settings for select using (true);
```

## 2. Troubleshooting: Fix Existing Database 🔧

If you already created the tables but are getting "Refund Failed" or "Check Constraint Violation" errors, run this patch:

```sql
-- 1. Add missing refund columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- 2. Update status constraint to allow 'refunded'
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'refunded'));

-- 3. Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_refunds ON bookings(refund_amount) WHERE refund_amount > 0;

-- 4. Add Property Caretaker & Structure Info
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS caretaker_name TEXT,
ADD COLUMN IF NOT EXISTS caretaker_email TEXT,
ADD COLUMN IF NOT EXISTS caretaker_phone TEXT,
ADD COLUMN IF NOT EXISTS structure_details JSONB DEFAULT '{}'::jsonb;
```

## 3. Seed Initial Data (Optional)

```sql
-- Insert a test property
INSERT INTO properties (name, base_price, min_price, max_price) 
VALUES ('Seaside Villa', 150.00, 100.00, 300.00);

-- Insert a test room (Use the ID from above)
-- INSERT INTO rooms (property_id, type, status, current_price) VALUES ('<property_id_here>', 'Deluxe Suite', 'available', 150.00);
```
 fo