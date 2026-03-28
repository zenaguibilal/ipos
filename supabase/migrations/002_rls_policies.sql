
-- 002_rls_policies.sql
-- iPOS Hardened Security Policies

-- Enable RLS on all tables
alter table public.company_profile enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.product_returns enable row level security;
alter table public.return_items enable row level security;
alter table public.bread_orders enable row level security;
alter table public.zakat_logs enable row level security;
alter table public.payments enable row level security;
alter table public.supplier_payments enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.recipes enable row level security;

-- Universal Policy Pattern for user_id owned tables
-- Pattern: auth.uid() = user_id

-- Table: company_profile
create policy "User owns profile" on public.company_profile 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Table: products
create policy "User owns products" on public.products 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Table: customers
create policy "User owns customers" on public.customers 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Table: sales
create policy "User owns sales" on public.sales 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Table: sale_items (Ownership via Sale or UserID)
create policy "User owns sale items" on public.sale_items 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Table: staff_profiles (Ownership check)
create policy "User owns staff" on public.staff_profiles 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Apply similar strict logic to all other tables
create policy "User owns expenses" on public.expenses 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "User owns returns" on public.product_returns 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "User owns bread" on public.bread_orders 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "User owns zakat" on public.zakat_logs 
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
