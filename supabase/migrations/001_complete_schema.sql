-- iPOS COMPLETE SCHEMA CONSOLIDATION
-- [DB-01] Migrations consolidées pour la production

-- 1. Profiles & Authority
CREATE TABLE IF NOT EXISTS public.company_profile (
    uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'Algérie',
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Inventory Management
CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price NUMERIC NOT NULL DEFAULT 0,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    quantity NUMERIC NOT NULL DEFAULT 0,
    min_stock_level NUMERIC DEFAULT 10,
    barcodes TEXT[],
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration TIMESTAMP WITH TIME ZONE,
    date_maj_prix TIMESTAMP WITH TIME ZONE DEFAULT now(),
    supplier_uuid UUID,
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Sales & Financials
CREATE TABLE IF NOT EXISTS public.sales (
    uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount_type TEXT DEFAULT 'fixed',
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    remaining_balance NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'paid',
    payments JSONB DEFAULT '[]',
    customer_uuid UUID,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_uuid UUID REFERENCES public.sales(uuid) ON DELETE CASCADE,
    product_uuid UUID,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL
);

-- 4. CRM
CREATE TABLE IF NOT EXISTS public.customers (
    uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    search_name TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    category TEXT DEFAULT 'Standard',
    credit_limit NUMERIC DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    outstanding_balance NUMERIC DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    debt_status TEXT DEFAULT 'none',
    is_over_limit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance [DB-02]
CREATE INDEX IF NOT EXISTS idx_products_user ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_uuid);
