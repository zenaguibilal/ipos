
-- iPOS - Full Database Schema Reconstruction
-- Protocols: DROP BEFORE CREATE, STRICT RLS, CASCADE DELETE

-- 1. CLEANUP
DROP FUNCTION IF EXISTS search_sales(text, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS public.company_profile (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    role TEXT DEFAULT 'cashier',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    search_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    category TEXT DEFAULT 'Standard',
    settlement_day INTEGER,
    credit_limit NUMERIC DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    outstanding_balance NUMERIC DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    debt_status TEXT DEFAULT 'none',
    is_over_limit BOOLEAN DEFAULT FALSE,
    is_bread_client BOOLEAN DEFAULT FALSE,
    bread_type_recurrence TEXT DEFAULT 'aucun',
    bread_quantite_defaut INTEGER DEFAULT 0,
    bread_jours_semaine JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC DEFAULT 0,
    min_stock_level NUMERIC DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration TIMESTAMPTZ,
    supplier_uuid UUID,
    date_maj_prix TIMESTAMPTZ,
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount_type TEXT,
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    remaining_balance NUMERIC NOT NULL,
    payment_status TEXT NOT NULL,
    payments JSONB DEFAULT '[]',
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_uuid UUID NOT NULL REFERENCES public.sales(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID REFERENCES public.suppliers(uuid) ON DELETE SET NULL,
    invoice_number TEXT,
    invoice_date TIMESTAMPTZ NOT NULL,
    total_value NUMERIC NOT NULL,
    transport_fees NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_intake_items (
    id BIGSERIAL PRIMARY KEY,
    intake_uuid UUID NOT NULL REFERENCES public.stock_intakes(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received NUMERIC NOT NULL,
    quantity_damaged NUMERIC DEFAULT 0,
    purchase_price NUMERIC NOT NULL,
    cost_price NUMERIC
);

CREATE TABLE IF NOT EXISTS public.product_returns (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_sale_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
    original_invoice_number TEXT NOT NULL,
    total_return_value NUMERIC NOT NULL,
    amount_refunded NUMERIC NOT NULL,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.return_items (
    id BIGSERIAL PRIMARY KEY,
    return_uuid UUID NOT NULL REFERENCES public.product_returns(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    was_restocked BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID NOT NULL REFERENCES public.customers(uuid) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bread_orders (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date TEXT NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_origine INTEGER,
    est_paye BOOLEAN DEFAULT FALSE,
    est_livre BOOLEAN DEFAULT FALSE,
    vente_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.zakat_history (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inventory_value NUMERIC NOT NULL,
    customer_debts NUMERIC NOT NULL,
    bad_debts NUMERIC NOT NULL,
    cash_on_hand NUMERIC NOT NULL,
    supplier_debts NUMERIC NOT NULL,
    other_debts NUMERIC NOT NULL,
    gold_price NUMERIC NOT NULL,
    nisab NUMERIC NOT NULL,
    zakat_base NUMERIC NOT NULL,
    zakat_amount NUMERIC NOT NULL,
    is_nisab_reached BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENFORCE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_history ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (No-Mercy Fix for Missing user_id)
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "User can manage their own %I" ON public.%I', t, t);
    END LOOP;
END $$;

-- Direct User Ownership Policies
CREATE POLICY "User can manage their own company_profile" ON public.company_profile USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own customers" ON public.customers USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own products" ON public.products USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own sales" ON public.sales USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own expenses" ON public.expenses USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own suppliers" ON public.suppliers USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own stock_intakes" ON public.stock_intakes USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own product_returns" ON public.product_returns USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own payments" ON public.payments USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own bread_orders" ON public.bread_orders USING (auth.uid() = user_id);
CREATE POLICY "User can manage their own zakat_history" ON public.zakat_history USING (auth.uid() = user_id);

-- Indirect (Inherited) Ownership Policies
CREATE POLICY "User can manage their own sale_items" ON public.sale_items 
USING (EXISTS (SELECT 1 FROM public.sales WHERE sales.uuid = sale_items.sale_uuid AND sales.user_id = auth.uid()));

CREATE POLICY "User can manage their own stock_intake_items" ON public.stock_intake_items 
USING (EXISTS (SELECT 1 FROM public.stock_intakes WHERE stock_intakes.uuid = stock_intake_items.intake_uuid AND stock_intakes.user_id = auth.uid()));

CREATE POLICY "User can manage their own return_items" ON public.return_items 
USING (EXISTS (SELECT 1 FROM public.product_returns WHERE product_returns.uuid = return_items.return_uuid AND product_returns.user_id = auth.uid()));

-- 5. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION search_sales(p_search_query TEXT, p_from_date TIMESTAMPTZ, p_to_date TIMESTAMPTZ)
RETURNS SETOF public.sales AS $$
BEGIN
    RETURN QUERY
    SELECT s.*
    FROM public.sales s
    LEFT JOIN public.customers c ON s.customer_uuid = c.uuid
    WHERE (p_search_query IS NULL OR s.invoice_number ILIKE '%' || p_search_query || '%' OR c.search_name ILIKE '%' || p_search_query || '%')
      AND (p_from_date IS NULL OR s.created_at >= p_from_date)
      AND (p_to_date IS NULL OR s.created_at <= p_to_date)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_product_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.products WHERE category IS NOT NULL;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_expense_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.expenses WHERE category IS NOT NULL;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_customer_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.customers WHERE category IS NOT NULL;
$$ LANGUAGE SQL SECURITY DEFINER;
