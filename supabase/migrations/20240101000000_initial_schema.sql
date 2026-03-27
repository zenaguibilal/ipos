
-- iPOS - Intelligent Point of Sale
-- Database Schema Migration (Fixed RLS & Functions)

-- 1. CLEANUP OLD FUNCTIONS (To prevent return type errors)
DROP FUNCTION IF EXISTS search_sales(text, timestamp with time zone, timestamp with time zone);
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
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

CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price NUMERIC NOT NULL DEFAULT 0,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    quantity NUMERIC NOT NULL DEFAULT 0,
    min_stock_level NUMERIC DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration TIMESTAMP WITH TIME ZONE,
    supplier_uuid UUID,
    date_maj_prix TIMESTAMP WITH TIME ZONE,
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount_type TEXT,
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    remaining_balance NUMERIC NOT NULL,
    payment_status TEXT NOT NULL,
    payments JSONB DEFAULT '[]',
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID REFERENCES public.suppliers(uuid) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_value NUMERIC NOT NULL,
    transport_fees NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_intake_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_uuid UUID NOT NULL REFERENCES public.stock_intakes(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received NUMERIC NOT NULL,
    quantity_damaged NUMERIC DEFAULT 0,
    purchase_price NUMERIC NOT NULL,
    cost_price NUMERIC
);

CREATE TABLE IF NOT EXISTS public.payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID NOT NULL REFERENCES public.customers(uuid) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_returns (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_sale_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
    original_invoice_number TEXT NOT NULL,
    total_return_value NUMERIC NOT NULL,
    amount_refunded NUMERIC DEFAULT 0,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.return_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_uuid UUID NOT NULL REFERENCES public.product_returns(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    was_restocked BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_uuid UUID NOT NULL REFERENCES public.products(uuid) ON DELETE CASCADE,
    change NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bread_orders (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date DATE NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_origine INTEGER,
    est_paye BOOLEAN DEFAULT FALSE,
    est_livre BOOLEAN DEFAULT FALSE,
    vente_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_history ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES (Fixed Subquery Ownership)
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('sale_items', 'return_items', 'stock_intake_items')
    LOOP
        EXECUTE format('CREATE POLICY "Manage own %I" ON public.%I FOR ALL USING (auth.uid() = user_id)', t, t);
    END LOOP;
END $$;

-- Special Policies for items tables (Linking to parent table user_id)
CREATE POLICY "Manage own sale_items" ON public.sale_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sales WHERE public.sales.uuid = public.sale_items.sale_uuid AND public.sales.user_id = auth.uid())
);

CREATE POLICY "Manage own return_items" ON public.return_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.product_returns WHERE public.product_returns.uuid = public.return_items.return_uuid AND public.product_returns.user_id = auth.uid())
);

CREATE POLICY "Manage own stock_intake_items" ON public.stock_intake_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stock_intakes WHERE public.stock_intakes.uuid = public.stock_intake_items.intake_uuid AND public.stock_intakes.user_id = auth.uid())
);

-- 5. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_unique_product_categories()
RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.products WHERE user_id = auth.uid() ORDER BY category;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_expense_categories()
RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.expenses WHERE user_id = auth.uid() ORDER BY category;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_customer_categories()
RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.customers WHERE user_id = auth.uid() ORDER BY category;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.search_sales(p_search_query TEXT DEFAULT NULL, p_from_date TIMESTAMP WITH TIME ZONE DEFAULT NULL, p_to_date TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS TABLE (uuid UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT s.uuid
    FROM public.sales s
    LEFT JOIN public.customers c ON s.customer_uuid = c.uuid
    WHERE s.user_id = auth.uid()
      AND (p_search_query IS NULL OR s.invoice_number ILIKE '%' || p_search_query || '%' OR c.search_name ILIKE '%' || p_search_query || '%')
      AND (p_from_date IS NULL OR s.created_at >= p_from_date)
      AND (p_to_date IS NULL OR s.created_at <= p_to_date)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND column_name = 'updated_at'
    LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', t, t);
    END LOOP;
END $$;
