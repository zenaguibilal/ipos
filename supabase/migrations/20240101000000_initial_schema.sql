
-- iPOS Enterprise Schema - Final Reconstruction
-- Fixes RLS for child tables and robust search functions

-- 1. CLEANUP
DROP FUNCTION IF EXISTS search_sales(text, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.company_profile (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL DEFAULT 'Mon Commerce',
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
    updated_at TIMESTAMPTZ DEFAULT now()
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
    date_expiration TIMESTAMPTZ,
    supplier_uuid UUID,
    date_maj_prix TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    stock_status TEXT DEFAULT 'in_stock'
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
    is_over_limit BOOLEAN DEFAULT false,
    is_bread_client BOOLEAN DEFAULT false,
    bread_type_recurrence TEXT DEFAULT 'quotidien',
    bread_quantite_defaut INTEGER DEFAULT 10,
    bread_jours_semaine JSONB DEFAULT '{"lundi": {"actif": true, "quantite": 10}, "mardi": {"actif": true, "quantite": 10}, "mercredi": {"actif": true, "quantite": 10}, "jeudi": {"actif": true, "quantite": 10}, "vendredi": {"actif": false, "quantite": 0}, "samedi": {"actif": true, "quantite": 10}, "dimanche": {"actif": true, "quantite": 10}}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    due_date TIMESTAMPTZ
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

CREATE TABLE IF NOT EXISTS public.stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID,
    invoice_number TEXT,
    invoice_date TIMESTAMPTZ NOT NULL,
    total_value NUMERIC NOT NULL,
    transport_fees NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
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

CREATE TABLE IF NOT EXISTS public.expenses (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
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
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS POLICIES (Hardened)
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_history ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Generator
CREATE OR REPLACE FUNCTION public.create_ipos_policies() RETURNS void AS $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('company_profile', 'products', 'customers', 'sales', 'stock_intakes', 'expenses', 'zakat_history') LOOP
        EXECUTE format('DROP POLICY IF EXISTS "User manage own %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "User manage own %I" ON public.%I USING (auth.uid() = user_id)', t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT public.create_ipos_policies();

-- Special Policies for Child Tables (Linked to parents)
CREATE POLICY "Manage sale_items via sales" ON public.sale_items
USING (EXISTS (SELECT 1 FROM public.sales WHERE sales.uuid = sale_uuid AND sales.user_id = auth.uid()));

CREATE POLICY "Manage intake_items via intakes" ON public.stock_intake_items
USING (EXISTS (SELECT 1 FROM public.stock_intakes WHERE stock_intakes.uuid = intake_uuid AND stock_intakes.user_id = auth.uid()));

-- 4. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION search_sales(p_search_query TEXT, p_from_date TIMESTAMPTZ, p_to_date TIMESTAMPTZ)
RETURNS TABLE (uuid UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT s.uuid FROM sales s
    LEFT JOIN customers c ON s.customer_uuid = c.uuid
    WHERE (p_search_query IS NULL OR s.invoice_number ILIKE '%' || p_search_query || '%' OR c.search_name ILIKE '%' || p_search_query || '%')
    AND (p_from_date IS NULL OR s.created_at >= p_from_date)
    AND (p_to_date IS NULL OR s.created_at <= p_to_date)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_product_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM products WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_expense_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM expenses WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_customer_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM customers WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
