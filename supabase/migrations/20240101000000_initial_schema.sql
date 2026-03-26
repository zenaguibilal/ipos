
-- Initial Schema for iPOS Application

-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- handle_updated_at function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-----------------------------------------
-- Company Profile Table
-----------------------------------------
create table public.company_profile (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  address text,
  city text,
  zip_code text,
  country text,
  phone text,
  email text,
  website text,
  vat_number text,
  rc_number text,
  gold_price_per_gram real,
  prix_pain real,
  role text not null default 'cashier',
  updated_at timestamptz not null default now(),
  constraint user_id_unique unique (user_id)
);
alter table public.company_profile enable row level security;
create policy "Users can view their own profile" on public.company_profile for select using (auth.uid() = user_id);
create policy "Users can update their own profile" on public.company_profile for update using (auth.uid() = user_id);
create policy "Users can insert their own profile" on public.company_profile for insert with check (auth.uid() = user_id);

create trigger on_company_profile_updated
  before update on public.company_profile
  for each row execute procedure public.handle_updated_at();

-- Trigger to create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.company_profile (user_id, company_name, role)
  values (new.id, 'Mon Magasin', 'admin');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-----------------------------------------
-- Suppliers Table
-----------------------------------------
create table public.suppliers (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  balance real not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.suppliers enable row level security;
create policy "Users can manage their own suppliers" on public.suppliers for all using (auth.uid() = user_id);

create trigger on_suppliers_updated
  before update on public.suppliers
  for each row execute procedure public.handle_updated_at();

-----------------------------------------
-- Products Table
-----------------------------------------
create table public.products (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  price real not null,
  purchase_price real not null,
  quantity integer not null default 0,
  min_stock_level integer not null default 10,
  barcodes text[],
  image_url text,
  unite text,
  date_expiration date,
  supplier_uuid uuid references public.suppliers(uuid) on delete set null,
  date_maj_prix date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stock_status text
);
alter table public.products enable row level security;
create policy "Users can manage their own products" on public.products for all using (auth.uid() = user_id);

create trigger on_products_updated
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- Function to update product stock_status
create or replace function public.update_product_stock_status()
returns trigger as $$
begin
  if new.quantity <= 0 then
    new.stock_status := 'out_of_stock';
  elsif new.quantity <= new.min_stock_level then
    new.stock_status := 'low_stock';
  else
    new.stock_status := 'in_stock';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_product_quantity_change
  before insert or update of quantity, min_stock_level on public.products
  for each row execute procedure public.update_product_stock_status();

-----------------------------------------
-- Customers Table
-----------------------------------------
create table public.customers (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  search_name text,
  phone text,
  address text,
  settlement_day integer,
  credit_limit real,
  total_spent real not null default 0,
  outstanding_balance real not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  debt_status text,
  is_over_limit boolean,
  is_bread_client boolean default false,
  bread_type_recurrence text,
  bread_quantite_defaut integer,
  bread_jours_semaine jsonb
);
alter table public.customers enable row level security;
create policy "Users can manage their own customers" on public.customers for all using (auth.uid() = user_id);

create trigger on_customers_updated
  before update on public.customers
  for each row execute procedure public.handle_updated_at();
  
-- Function to update search_name
create or replace function public.update_customer_search_name()
returns trigger as $$
begin
  new.search_name := lower(new.first_name || ' ' || new.last_name);
  return new;
end;
$$ language plpgsql;

create trigger on_customer_name_change
  before insert or update of first_name, last_name on public.customers
  for each row execute procedure public.update_customer_search_name();

-----------------------------------------
-- Sales Table
-----------------------------------------
create table public.sales (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null unique,
  subtotal real not null,
  discount_type text,
  discount_amount real,
  total real not null,
  amount_paid real not null,
  remaining_balance real not null,
  payment_status text not null,
  payments jsonb,
  customer_uuid uuid references public.customers(uuid) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_date date
);
alter table public.sales enable row level security;
create policy "Users can manage their own sales" on public.sales for all using (auth.uid() = user_id);

create trigger on_sales_updated
  before update on public.sales
  for each row execute procedure public.handle_updated_at();

-----------------------------------------
-- Sale Items Table
-----------------------------------------
create table public.sale_items (
  id bigint generated by default as identity primary key,
  sale_uuid uuid not null references public.sales(uuid) on delete cascade,
  product_uuid uuid null references public.products(uuid) on delete set null,
  name text not null,
  price real not null,
  purchase_price real not null,
  quantity integer not null
);
alter table public.sale_items enable row level security;
create policy "Users can manage sale items linked to their sales" on public.sale_items for all using (
  auth.uid() = (select user_id from public.sales where uuid = sale_uuid)
);

-----------------------------------------
-- Payments Table
-----------------------------------------
create table public.payments (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_uuid uuid not null references public.customers(uuid) on delete cascade,
  amount real not null,
  payment_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy "Users can manage their own payments" on public.payments for all using (auth.uid() = user_id);

create trigger on_payments_updated
  before update on public.payments
  for each row execute procedure public.handle_updated_at();

-----------------------------------------
-- Expenses Table
-----------------------------------------
create table public.expenses (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  category text not null,
  amount real not null,
  expense_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
create policy "Users can manage their own expenses" on public.expenses for all using (auth.uid() = user_id);

create trigger on_expenses_updated
  before update on public.expenses
  for each row execute procedure public.handle_updated_at();

-----------------------------------------
-- Stock Intakes Table
-----------------------------------------
create table public.stock_intakes (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplier_uuid uuid references public.suppliers(uuid) on delete set null,
  invoice_number text,
  invoice_date date,
  total_value real not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.stock_intakes enable row level security;
create policy "Users can manage their own stock intakes" on public.stock_intakes for all using (auth.uid() = user_id);

create trigger on_stock_intakes_updated
  before update on public.stock_intakes
  for each row execute procedure public.handle_updated_at();
  
-----------------------------------------
-- Stock Intake Items Table
-----------------------------------------
create table public.stock_intake_items (
  id bigint generated by default as identity primary key,
  intake_uuid uuid not null references public.stock_intakes(uuid) on delete cascade,
  product_uuid uuid references public.products(uuid) on delete set null,
  product_name text not null,
  quantity_received integer not null,
  quantity_damaged integer not null default 0,
  purchase_price real not null
);
alter table public.stock_intake_items enable row level security;
create policy "Users can manage stock intake items linked to their intakes" on public.stock_intake_items for all using (
  auth.uid() = (select user_id from public.stock_intakes where uuid = intake_uuid)
);

-----------------------------------------
-- Product Returns Table
-----------------------------------------
create table public.product_returns (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_sale_uuid uuid references public.sales(uuid) on delete set null,
  original_invoice_number text not null,
  total_return_value real not null,
  amount_refunded real not null,
  customer_uuid uuid references public.customers(uuid) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.product_returns enable row level security;
create policy "Users can manage their own product returns" on public.product_returns for all using (auth.uid() = user_id);

create trigger on_product_returns_updated
  before update on public.product_returns
  for each row execute procedure public.handle_updated_at();

-----------------------------------------
-- Return Items Table
-----------------------------------------
create table public.return_items (
  id bigint generated by default as identity primary key,
  return_uuid uuid not null references public.product_returns(uuid) on delete cascade,
  product_uuid uuid null,
  product_name text not null,
  quantity integer not null,
  price real not null,
  purchase_price real not null,
  was_restocked boolean not null default false
);
alter table public.return_items enable row level security;
create policy "Users can manage return items linked to their returns" on public.return_items for all using (
  auth.uid() = (select user_id from public.product_returns where uuid = return_uuid)
);

-----------------------------------------
-- Inventory Logs Table
-----------------------------------------
create table public.inventory_logs (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_uuid uuid not null references public.products(uuid) on delete cascade,
  change integer not null,
  new_quantity integer not null,
  reason text not null,
  related_uuid uuid,
  created_at timestamptz not null default now()
);
alter table public.inventory_logs enable row level security;
create policy "Users can manage their own inventory logs" on public.inventory_logs for all using (auth.uid() = user_id);

-----------------------------------------
-- Bread Orders Table
-----------------------------------------
create table public.bread_orders (
  uuid uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_uuid uuid not null references public.customers(uuid) on delete cascade,
  date date not null,
  quantite integer not null,
  quantite_origine integer,
  est_paye boolean not null default false,
  est_livre boolean not null default false,
  vente_uuid uuid references public.sales(uuid) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(customer_uuid, date)
);
alter table public.bread_orders enable row level security;
create policy "Users can manage their own bread orders" on public.bread_orders for all using (auth.uid() = user_id);

create trigger on_bread_orders_updated
  before update on public.bread_orders
  for each row execute procedure public.handle_updated_at();

-----------------------------------------
-- Storage Policies
-----------------------------------------
-- Backups Storage
create policy "Users can manage their own backup folder" on storage.objects
  for all
  using (bucket_id = 'backups' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'backups' and auth.uid()::text = (storage.foldername(name))[1]);

-----------------------------------------
-- RPC Functions
-----------------------------------------
-- Function to get unique categories for products
create or replace function get_unique_product_categories()
returns setof text as $$
begin
  return query
  select distinct category from public.products where user_id = auth.uid() and category is not null order by category;
end;
$$ language plpgsql;

-- Function to get unique categories for expenses
create or replace function get_unique_expense_categories()
returns setof text as $$
begin
  return query
  select distinct category from public.expenses where user_id = auth.uid() and category is not null order by category;
end;
$$ language plpgsql;

-- Function to search sales with customer name
create or replace function search_sales(p_search_query text, p_from_date timestamptz, p_to_date timestamptz)
returns setof public.sales as $$
declare
    v_customer_uuids uuid[];
begin
    -- If there's a search query, find matching customers
    if p_search_query is not null then
        select array_agg(uuid) into v_customer_uuids
        from public.customers
        where user_id = auth.uid() and search_name ilike '%' || p_search_query || '%';
    end if;

    return query
    select * from public.sales s
    where 
      s.user_id = auth.uid() and
      (p_from_date is null or s.created_at >= p_from_date) and
      (p_to_date is null or s.created_at <= p_to_date) and
      (
        p_search_query is null or
        s.invoice_number ilike '%' || p_search_query || '%' or
        s.customer_uuid = any(v_customer_uuids)
      )
    order by s.created_at desc;
end;
$$ language plpgsql;

-- Function to update customer debt status
create or replace function update_customer_debt_status()
returns trigger as $$
begin
  if new.outstanding_balance > 0.01 then
    if exists (
      select 1 from public.sales 
      where customer_uuid = new.uuid 
      and payment_status != 'paid' 
      and due_date is not null 
      and due_date < current_date
    ) then
      new.debt_status := 'overdue';
    else
      new.debt_status := 'due_soon';
    end if;
  else
    new.debt_status := 'none';
  end if;

  if new.credit_limit is not null and new.credit_limit > 0 then
    new.is_over_limit := new.outstanding_balance > new.credit_limit;
  else
    new.is_over_limit := false;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger on_customer_balance_change
  before insert or update of outstanding_balance, credit_limit on public.customers
  for each row execute procedure public.update_customer_debt_status();
