
-- Consolidated iPOS Schema
-- Enables UUID and core tables with optimized indexes

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles & Core
CREATE TABLE IF NOT EXISTS public.company_profile (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    country TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    vat_number TEXT,
    rc_number TEXT,
    art_imposition TEXT,
    gold_price_per_gram NUMERIC DEFAULT 0,
    prix_pain NUMERIC DEFAULT 0,
    currency_symbol TEXT DEFAULT 'DA',
    decimal_places INTEGER DEFAULT 1,
    zakat_anniversary TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products
CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price NUMERIC NOT NULL DEFAULT 0,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    quantity NUMERIC NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration TIMESTAMP WITH TIME ZONE,
    date_maj_prix TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stock_status TEXT DEFAULT 'in_stock',
    supplier_uuid UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS public.customers (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    search_name TEXT,
    phone TEXT,
    address TEXT,
    category TEXT DEFAULT 'Standard',
    credit_limit NUMERIC DEFAULT 0,
    outstanding_balance NUMERIC DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    debt_status TEXT DEFAULT 'none',
    is_over_limit BOOLEAN DEFAULT FALSE,
    is_bread_client BOOLEAN DEFAULT FALSE,
    bread_type_recurrence TEXT DEFAULT 'aucun',
    bread_quantite_defaut INTEGER DEFAULT 0,
    bread_jours_semaine JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sales
CREATE TABLE IF NOT EXISTS public.sales (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    subtotal NUMERIC NOT NULL,
    discount_type TEXT DEFAULT 'fixed',
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    remaining_balance NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'paid',
    payments JSONB DEFAULT '[]',
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_uuid UUID REFERENCES public.sales(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Staff & Logs
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'cashier',
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- [DB-02] Optimized Indexes
CREATE INDEX IF NOT EXISTS idx_products_user ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_uuid);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products USING GIN (barcodes);
