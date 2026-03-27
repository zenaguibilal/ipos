
-- iPOS Enterprise Initial Schema
-- Full reconstruction with strict RLS and robust functions

-- 1. CLEANUP
DROP FUNCTION IF EXISTS search_sales(text, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();

-- 2. TABLES
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
    role TEXT DEFAULT 'admin',
    updated_at TIMESTAMPTZ DEFAULT now()
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    search_name TEXT,
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
    bread_type_recurrence TEXT DEFAULT 'none',
    bread_quantite_defaut INTEGER DEFAULT 0,
    bread_jours_semaine JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
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
    supplier_uuid UUID REFERENCES public.suppliers(uuid) ON DELETE SET NULL,
    date_maj_prix TIMESTAMPTZ,
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_uuid UUID NOT NULL REFERENCES public.products(uuid) ON DELETE CASCADE,
    change NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMPTZ DEFAULT now()
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
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
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

CREATE TABLE IF NOT EXISTS public.product_returns (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_sale_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
    original_invoice_number TEXT NOT NULL,
    total_return_value NUMERIC NOT NULL,
    amount_refunded NUMERIC NOT NULL,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.return_items (
    id BIGSERIAL PRIMARY KEY,
    return_uuid UUID NOT NULL REFERENCES public.product_returns(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    was_restocked BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID NOT NULL REFERENCES public.customers(uuid) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
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

CREATE TABLE IF NOT EXISTS public.bread_orders (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date DATE NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_origine INTEGER NOT NULL,
    est_paye BOOLEAN DEFAULT false,
    est_livre BOOLEAN DEFAULT false,
    vente_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
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

-- 3. RLS POLICIES (Hardened Subqueries for Dependent Tables)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Standard Policies
CREATE POLICY "Users can manage their own data" ON public.company_profile USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.suppliers USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.customers USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.products USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.inventory_logs USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.sales USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.product_returns USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.payments USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.expenses USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.bread_orders USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own data" ON public.zakat_history USING (auth.uid() = user_id);

-- Dependent Policies (Fixed: No user_id column)
CREATE POLICY "Access via sales ownership" ON public.sale_items 
    USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.uuid = sale_uuid AND s.user_id = auth.uid()));

CREATE POLICY "Access via returns ownership" ON public.return_items 
    USING (EXISTS (SELECT 1 FROM public.product_returns r WHERE r.uuid = return_uuid AND r.user_id = auth.uid()));

-- 4. FUNCTIONS (Robust RPC)
CREATE OR REPLACE FUNCTION search_sales(p_search_query TEXT, p_from_date TIMESTAMPTZ, p_to_date TIMESTAMPTZ)
RETURNS SETOF public.sales AS $$
BEGIN
    RETURN QUERY
    SELECT s.* FROM public.sales s
    LEFT JOIN public.customers c ON s.customer_uuid = c.uuid
    WHERE (p_search_query IS NULL OR s.invoice_number ILIKE '%' || p_search_query || '%' OR c.search_name ILIKE '%' || p_search_query || '%')
    AND (p_from_date IS NULL OR s.created_at >= p_from_date)
    AND (p_to_date IS NULL OR s.created_at <= p_to_date)
    AND s.user_id = auth.uid()
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_product_categories()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(SELECT DISTINCT category FROM public.products WHERE user_id = auth.uid() AND category IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_customer_categories()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(SELECT DISTINCT category FROM public.customers WHERE user_id = auth.uid() AND category IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_expense_categories()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(SELECT DISTINCT category FROM public.expenses WHERE user_id = auth.uid() AND category IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
