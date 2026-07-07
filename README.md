# Jazo Phone Accessories — Setup Guide
# Vercel (hosting) + Supabase (database & image storage)
# Both FREE, no credit card needed.

════════════════════════════════════════════
STEP 1 — SUPABASE SETUP
════════════════════════════════════════════

1. Go to https://supabase.com → create free project
   Name: jazo-phone-accessories

2. Go to SQL Editor → paste and run this:

-------- PASTE INTO SQL EDITOR --------

create table products (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  category    text not null,
  description text not null,
  price       numeric not null,
  old_price   numeric,
  stock       integer not null default 0,
  image       text default '',
  images      text[] default '{}',
  featured    boolean default false,
  is_new      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

create table orders (
  id          text primary key,
  customer    jsonb not null,
  items       jsonb not null,
  total       numeric not null,
  note        text default '',
  status      text default 'pending',
  created_at  timestamptz default now()
);

alter table products enable row level security;
create policy "Public can read products"
  on products for select using (true);

alter table orders enable row level security;
create policy "Anyone can create orders"
  on orders for insert with check (true);

-------- END OF SQL --------

3. Go to Storage → New bucket
   Name: product-images
   Toggle ON: Public bucket → Save

4. Go to Settings → API → copy:
   - Project URL  (https://xxxx.supabase.co)
   - service_role key (the long JWT token)

════════════════════════════════════════════
STEP 2 — DEPLOY TO VERCEL
════════════════════════════════════════════

1. Push this folder to a GitHub repo
2. Go to vercel.com → Add New Project → import repo
3. Before deploying, add Environment Variables:

   SUPABASE_URL         → your Supabase project URL
   SUPABASE_SERVICE_KEY → your service_role key

4. Deploy. Your site goes live instantly.

════════════════════════════════════════════
ADMIN PANEL
════════════════════════════════════════════

URL:      https://your-site.vercel.app/admin.html
Username: admin
Password: jazo2025

To change password: open js/admin.js, find:
  const CREDS = { user: 'admin', pass: 'jazo2025' };

════════════════════════════════════════════
BEFORE GOING LIVE — UPDATE THESE
════════════════════════════════════════════

1. WhatsApp number — in js/main.js find:
     const WHATSAPP_NUMBER = '254700000000';
   Replace with real number (digits, country code, no +)

2. Contact details — in index.html replace:
   - +254 700 000 000
   - hello@jazoaccessories.co.ke
   - Update address

3. Logo — replace images/jazologof.jpeg with the
   actual Jazo logo file (keep the same filename)

════════════════════════════════════════════
CATEGORIES
════════════════════════════════════════════

cases | chargers | earphones | screen-protectors | powerbanks | accessories
