
-- 001_complete_schema.sql
-- iPOS Absolute Schema Definition

-- Enable Extensions
create extension if not exists "uuid-ossp";

-- Table: company_profile
create table if not exists public.company_profile (
    uuid uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    company_name text not null,
    address text,
    city text,
    zip_code text,
    country text default 'Algérie',
    phone text,
    email text,
    website text,
    vat_number text,
    rc_number text,
    art_imposition text,
    gold_price_per_gram numeric default 0,
    prix_pain numeric default 0,
    currency_symbol text default 'DA',
    decimal_places integer default 1,
    zakat_anniversary timestamp with time zone,
    updated_at timestamp with time zone default now()
);

-- Table: products
create table if not exists public.products (
    uuid uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    category text default 'Non classé',
    price numeric not null default 0,
    purchase_price numeric not null default 0,
    quantity numeric not null default 0,
    min_stock_level numeric default 10,
    barcodes text[] default '{}',
    image_url text,
    unite text default 'Pièce',
    date_expiration timestamp with time zone,
    date_maj_prix timestamp with time zone default now(),
    supplier_uuid uuid,
    stock_status text default 'in_stock',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Table: customers
create table if not exists public.customers (
    uuid uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    first_name text not null,
    last_name text not null,
    search_name text,
    phone text,
    address text,
    notes text,
    category text default 'Standard',
    credit_limit numeric default 0,
    total_spent numeric default 0,
    outstanding_balance numeric default 0,
    last_activity_date timestamp with time zone,
    debt_status text default 'none',
    is_over_limit boolean default false,
    is_bread_client boolean default false,
    bread_type_recurrence text,
    bread_quantite_defaut numeric,
    bread_jours_semaine jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Table: sales
create table if not exists public.sales (
    uuid uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    invoice_number text unique not null,
    subtotal numeric not null,
    discount_type text,
    discount_amount numeric default 0,
    total numeric not null,
    amount_paid numeric not null,
    remaining_balance numeric default 0,
    payment_status text not null,
    payments jsonb default '[]',
    customer_uuid uuid references public.customers(uuid),
    due_date timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Table: sale_items
create table if not exists public.sale_items (
    uuid uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    sale_uuid uuid references public.sales(uuid) on delete cascade not null,
    product_uuid uuid,
    name text not null,
    price numeric not null,
    purchase_price numeric not null,
    quantity numeric not null
);

-- Indexes for performance
create index if not exists idx_products_user on public.products(user_id);
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_customers_user on public.customers(user_id);
create index if not exists idx_sales_user on public.sales(user_id);
create index if not exists idx_sales_invoice on public.sales(invoice_number);
create index if not exists idx_sale_items_sale on public.sale_items(sale_uuid);
