-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. HELPER FUNCTIONS & TRIGGERS

-- Function to automatically update 'updated_at' timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function to update customer search_name
CREATE OR REPLACE FUNCTION update_customer_search_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_name = lower(NEW.first_name || ' ' || NEW.last_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock_status
CREATE OR REPLACE FUNCTION update_product_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= 0 THEN
        NEW.stock_status = 'out_of_stock';
    ELSIF NEW.quantity <= NEW.min_stock_level THEN
        NEW.stock_status = 'low_stock';
    ELSE
        NEW.stock_status = 'in_stock';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. TABLE DEFINITIONS

-- Company Profile Table
create table if not exists public.company_profile (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text,
  address text,
  city text,
  zip_code text,
  country text,
  phone text,
  email text,
  website text,
  vat_number text,
  rc_number text,
  gold_price_per_gram numeric,
  prix_pain numeric,
  role text not null default 'cashier',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.company_profile is 'Stores company-specific settings and profile information.';

-- Suppliers Table
create table if not exists public.suppliers (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.suppliers is 'Stores supplier information.';
create index if not exists idx_suppliers_user_id on public.suppliers(user_id);
create index if not exists idx_suppliers_name on public.suppliers(name);


-- Customers Table
create table if not exists public.customers (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  search_name text,
  phone text,
  address text,
  settlement_day integer,
  credit_limit numeric default 0,
  total_spent numeric not null default 0,
  outstanding_balance numeric not null default 0,
  last_activity_date timestamptz,
  debt_status text default 'none',
  is_over_limit boolean default false,
  is_bread_client boolean default false,
  bread_type_recurrence text default 'aucun',
  bread_quantite_defaut integer default 10,
  bread_jours_semaine jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.customers is 'Stores customer information and financial status.';
create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_customers_search_name on public.customers(search_name);


-- Products Table
create table if not exists public.products (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  price numeric not null default 0,
  purchase_price numeric not null default 0,
  quantity integer not null default 0,
  min_stock_level integer not null default 10,
  barcodes text[],
  image_url text,
  unite text default 'Pièce',
  date_expiration date,
  supplier_uuid uuid references public.suppliers(uuid) on delete set null,
  date_maj_prix timestamptz,
  stock_status text default 'in_stock',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.products is 'Stores product inventory and details.';
create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_products_barcodes on public.products using gin (barcodes);


-- Sales Table
create table if not exists public.sales (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  subtotal numeric not null,
  discount_type text,
  discount_amount numeric,
  total numeric not null,
  amount_paid numeric not null,
  remaining_balance numeric not null,
  payment_status text not null,
  payments jsonb,
  customer_uuid uuid references public.customers(uuid) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.sales is 'Stores sales transaction headers.';
create index if not exists idx_sales_user_id on public.sales(user_id);
create index if not exists idx_sales_customer_uuid on public.sales(customer_uuid);
create index if not exists idx_sales_invoice_number on public.sales(invoice_number);

-- Sale Items Table
create table if not exists public.sale_items (
  id bigserial primary key,
  sale_uuid uuid not null references public.sales(uuid) on delete cascade,
  product_uuid uuid references public.products(uuid) on delete set null,
  name text not null,
  price numeric not null,
  purchase_price numeric not null,
  quantity integer not null
);
comment on table public.sale_items is 'Stores line items for each sale.';
create index if not exists idx_sale_items_sale_uuid on public.sale_items(sale_uuid);
create index if not exists idx_sale_items_product_uuid on public.sale_items(product_uuid);


-- Product Returns Table
create table if not exists public.product_returns (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_sale_uuid uuid references public.sales(uuid) on delete set null,
  original_invoice_number text,
  total_return_value numeric not null,
  amount_refunded numeric not null,
  customer_uuid uuid references public.customers(uuid) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.product_returns is 'Stores product return transaction headers.';
create index if not exists idx_product_returns_user_id on public.product_returns(user_id);

-- Return Items Table
create table if not exists public.return_items (
  id bigserial primary key,
  return_uuid uuid not null references public.product_returns(uuid) on delete cascade,
  product_uuid uuid references public.products(uuid) on delete set null,
  product_name text not null,
  quantity integer not null,
  price numeric not null,
  purchase_price numeric not null,
  was_restocked boolean not null
);
comment on table public.return_items is 'Stores line items for each product return.';
create index if not exists idx_return_items_return_uuid on public.return_items(return_uuid);


-- Payments Table
create table if not exists public.payments (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_uuid uuid not null references public.customers(uuid) on delete cascade,
  amount numeric not null,
  payment_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.payments is 'Stores customer debt payments.';
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_customer_uuid on public.payments(customer_uuid);


-- Expenses Table
create table if not exists public.expenses (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  category text not null,
  amount numeric not null,
  expense_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.expenses is 'Stores business expenses.';
create index if not exists idx_expenses_user_id on public.expenses(user_id);


-- Stock Intakes Table
create table if not exists public.stock_intakes (
  uuid uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplier_uuid uuid references public.suppliers(uuid) on delete set null,
  invoice_number text,
  invoice_date date,
  total_value numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.stock_intakes is 'Stores stock intake transaction headers.';
create index if not exists idx_stock_intakes_user_id on public.stock_intakes(user_id);

-- Stock Intake Items Table
create table if not exists public.stock_intake_items (
  id bigserial primary key,
  intake_uuid uuid not null references public.stock_intakes(uuid) on delete cascade,
  product_uuid uuid references public.products(uuid) on delete set null,
  product_name text not null,
  quantity_received integer not null,
  quantity_damaged integer not null default 0,
  purchase_price numeric not null
);
comment on table public.stock_intake_items is 'Stores line items for each stock intake.';
create index if not exists idx_stock_intake_items_intake_uuid on public.stock_intake_items(intake_uuid);


-- Bread Orders Table
create table if not exists public.bread_orders (
    uuid uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    customer_uuid uuid not null references public.customers(uuid) on delete cascade,
    date date not null,
    quantite integer not null,
    quantite_origine integer,
    est_paye boolean not null default false,
    est_livre boolean not null default false,
    vente_uuid uuid references public.sales(uuid) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.bread_orders is 'Stores daily recurring bread orders for customers.';
create index if not exists idx_bread_orders_user_id on public.bread_orders(user_id);
create index if not exists idx_bread_orders_customer_uuid on public.bread_orders(customer_uuid);
create index if not exists idx_bread_orders_date on public.bread_orders(date);

-- Inventory Logs Table
create table if not exists public.inventory_logs (
    uuid uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_uuid uuid not null references public.products(uuid) on delete cascade,
    change integer not null,
    new_quantity integer not null,
    reason text not null,
    related_uuid uuid,
    created_at timestamptz not null default now()
);
comment on table public.inventory_logs is 'Logs all changes to product stock quantities.';
create index if not exists idx_inventory_logs_user_id on public.inventory_logs(user_id);
create index if not exists idx_inventory_logs_product_uuid on public.inventory_logs(product_uuid);


-- 4. TRIGGERS

-- Automatically update 'updated_at' on table updates
drop trigger if exists on_company_profile_updated on public.company_profile;
create trigger on_company_profile_updated
  before update on public.company_profile
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_suppliers_updated on public.suppliers;
create trigger on_suppliers_updated
  before update on public.suppliers
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_customers_updated on public.customers;
create trigger on_customers_updated
  before update on public.customers
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_products_updated on public.products;
create trigger on_products_updated
  before update on public.products
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_sales_updated on public.sales;
create trigger on_sales_updated
  before update on public.sales
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_product_returns_updated on public.product_returns;
create trigger on_product_returns_updated
  before update on public.product_returns
  for each row execute procedure public.handle_updated_at();
  
drop trigger if exists on_payments_updated on public.payments;
create trigger on_payments_updated
  before update on public.payments
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_expenses_updated on public.expenses;
create trigger on_expenses_updated
  before update on public.expenses
  for each row execute procedure public.handle_updated_at();
  
drop trigger if exists on_stock_intakes_updated on public.stock_intakes;
create trigger on_stock_intakes_updated
  before update on public.stock_intakes
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_bread_orders_updated on public.bread_orders;
create trigger on_bread_orders_updated
  before update on public.bread_orders
  for each row execute procedure public.handle_updated_at();
  
-- Automatically update derived fields
drop trigger if exists on_customer_insert_or_update on public.customers;
CREATE TRIGGER on_customer_insert_or_update
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION update_customer_search_name();

drop trigger if exists on_product_insert_or_update on public.products;
CREATE TRIGGER on_product_insert_or_update
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_status();


-- 5. ROW LEVEL SECURITY (RLS)
alter table public.company_profile enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.product_returns enable row level security;
alter table public.return_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.stock_intakes enable row level security;
alter table public.stock_intake_items enable row level security;
alter table public.bread_orders enable row level security;
alter table public.inventory_logs enable row level security;

-- Policies for company_profile
drop policy if exists "User can manage their own profile." on public.company_profile;
create policy "User can manage their own profile." on public.company_profile
  for all using (auth.uid() = user_id);

-- Policies for suppliers
drop policy if exists "User can manage their own suppliers." on public.suppliers;
create policy "User can manage their own suppliers." on public.suppliers
  for all using (auth.uid() = user_id);

-- Policies for customers
drop policy if exists "User can manage their own customers." on public.customers;
create policy "User can manage their own customers." on public.customers
  for all using (auth.uid() = user_id);

-- Policies for products
drop policy if exists "User can manage their own products." on public.products;
create policy "User can manage their own products." on public.products
  for all using (auth.uid() = user_id);
  
-- Policies for sales
drop policy if exists "User can manage their own sales." on public.sales;
create policy "User can manage their own sales." on public.sales
  for all using (auth.uid() = user_id);

-- Policies for sale_items (derived from sales)
drop policy if exists "User can manage their own sale items." on public.sale_items;
create policy "User can manage their own sale items." on public.sale_items
  for all using (exists(select 1 from public.sales where sales.uuid = sale_items.sale_uuid));
  
-- Policies for product_returns
drop policy if exists "User can manage their own returns." on public.product_returns;
create policy "User can manage their own returns." on public.product_returns
  for all using (auth.uid() = user_id);

-- Policies for return_items (derived from product_returns)
drop policy if exists "User can manage their own return items." on public.return_items;
create policy "User can manage their own return items." on public.return_items
  for all using (exists(select 1 from public.product_returns where product_returns.uuid = return_items.return_uuid));

-- Policies for payments
drop policy if exists "User can manage their own payments." on public.payments;
create policy "User can manage their own payments." on public.payments
  for all using (auth.uid() = user_id);

-- Policies for expenses
drop policy if exists "User can manage their own expenses." on public.expenses;
create policy "User can manage their own expenses." on public.expenses
  for all using (auth.uid() = user_id);

-- Policies for stock_intakes
drop policy if exists "User can manage their own stock intakes." on public.stock_intakes;
create policy "User can manage their own stock intakes." on public.stock_intakes
  for all using (auth.uid() = user_id);

-- Policies for stock_intake_items (derived from stock_intakes)
drop policy if exists "User can manage their own stock intake items." on public.stock_intake_items;
create policy "User can manage their own stock intake items." on public.stock_intake_items
  for all using (exists(select 1 from public.stock_intakes where stock_intakes.uuid = stock_intake_items.intake_uuid));

-- Policies for bread_orders
drop policy if exists "User can manage their own bread orders." on public.bread_orders;
create policy "User can manage their own bread orders." on public.bread_orders
  for all using (auth.uid() = user_id);

-- Policies for inventory_logs
drop policy if exists "User can manage their own inventory logs." on public.inventory_logs;
create policy "User can manage their own inventory logs." on public.inventory_logs
  for all using (auth.uid() = user_id);


-- 6. ADDITIONAL HELPER FUNCTIONS FOR RPC

-- Function to get unique product categories for a user
create or replace function public.get_unique_product_categories()
returns text[] as $$
  select array_agg(distinct category)
  from public.products
  where user_id = auth.uid() and category is not null and category <> '';
$$ language sql stable;

-- Function to get unique expense categories for a user
create or replace function public.get_unique_expense_categories()
returns text[] as $$
  select array_agg(distinct category)
  from public.expenses
  where user_id = auth.uid() and category is not null and category <> '';
$$ language sql stable;

-- Function to search sales efficiently
CREATE OR REPLACE FUNCTION public.search_sales(
    p_search_query TEXT,
    p_from_date TIMESTAMPTZ,
    p_to_date TIMESTAMPTZ
)
RETURNS TABLE(uuid UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT s.uuid
    FROM public.sales s
    LEFT JOIN public.customers c ON s.customer_uuid = c.uuid
    WHERE
        s.user_id = auth.uid()
        AND (p_from_date IS NULL OR s.created_at >= p_from_date)
        AND (p_to_date IS NULL OR s.created_at <= p_to_date)
        AND (
            p_search_query IS NULL OR
            s.invoice_number ILIKE '%' || p_search_query || '%' OR
            c.search_name ILIKE '%' || p_search_query || '%'
        );
END;
$$ LANGUAGE plpgsql;

-- 7. INITIAL DATA SETUP (optional, for new accounts)
-- Function to create default profile for new user
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.company_profile (user_id, company_name, email, role)
  values (new.id, 'Mon Magasin', new.email, 'admin');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
