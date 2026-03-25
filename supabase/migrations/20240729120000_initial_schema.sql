-- Enable Row Level Security
alter table "public"."products" enable row level security;
alter table "public"."customers" enable row level security;
alter table "public"."sales" enable row level security;
alter table "public"."payments" enable row level security;
alter table "public"."stock_intakes" enable row level security;
alter table "public"."returns" enable row level security;
alter table "public"."expenses" enable row level security;
alter table "public"."suppliers" enable row level security;
alter table "public"."clients_pain" enable row level security;
alter table "public"."commandes_pain" enable row level security;
alter table "public"."company_profile" enable row level security;
alter table "public"."inventory_logs" enable row level security;


-- Create Policies
-- These policies are wide open to allow any authenticated user to perform any action.
-- For production, you should lock this down to specific users or roles.

-- Products
drop policy if exists "Enable all access for authenticated users" on "public"."products";
create policy "Enable all access for authenticated users"
on "public"."products"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Customers
drop policy if exists "Enable all access for authenticated users" on "public"."customers";
create policy "Enable all access for authenticated users"
on "public"."customers"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Sales
drop policy if exists "Enable all access for authenticated users" on "public"."sales";
create policy "Enable all access for authenticated users"
on "public"."sales"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Payments
drop policy if exists "Enable all access for authenticated users" on "public"."payments";
create policy "Enable all access for authenticated users"
on "public"."payments"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Stock Intakes
drop policy if exists "Enable all access for authenticated users" on "public"."stock_intakes";
create policy "Enable all access for authenticated users"
on "public"."stock_intakes"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Returns
drop policy if exists "Enable all access for authenticated users" on "public"."returns";
create policy "Enable all access for authenticated users"
on "public"."returns"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Expenses
drop policy if exists "Enable all access for authenticated users" on "public"."expenses";
create policy "Enable all access for authenticated users"
on "public"."expenses"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Suppliers
drop policy if exists "Enable all access for authenticated users" on "public"."suppliers";
create policy "Enable all access for authenticated users"
on "public"."suppliers"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Bread Clients
drop policy if exists "Enable all access for authenticated users" on "public"."clients_pain";
create policy "Enable all access for authenticated users"
on "public"."clients_pain"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Bread Orders
drop policy if exists "Enable all access for authenticated users" on "public"."commandes_pain";
create policy "Enable all access for authenticated users"
on "public"."commandes_pain"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Company Profile
drop policy if exists "Enable all access for authenticated users" on "public"."company_profile";
create policy "Enable all access for authenticated users"
on "public"."company_profile"
as permissive
for all
to authenticated
using (true)
with check (true);

-- Inventory Logs
drop policy if exists "Enable all access for authenticated users" on "public"."inventory_logs";
create policy "Enable all access for authenticated users"
on "public"."inventory_logs"
as permissive
for all
to authenticated
using (true)
with check (true);


-- Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- Add all tables to the publication
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table sales;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table stock_intakes;
alter publication supabase_realtime add table returns;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table suppliers;
alter publication supabase_realtime add table clients_pain;
alter publication supabase_realtime add table commandes_pain;
alter publication supabase_realtime add table company_profile;
alter publication supabase_realtime add table inventory_logs;
