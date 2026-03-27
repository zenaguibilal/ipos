-- 🚨 IPOS ENTERPRISE SCHEMA RECONSTRUCTION
-- Mission: Zero-Mercy Database Integrity & Security

-- 1. CLEANUP PRE-EXISTING OBJECTS
DROP FUNCTION IF EXISTS search_sales(text, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS public.company_profile (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price NUMERIC NOT NULL DEFAULT 0,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    quantity NUMERIC NOT NULL DEFAULT 0,
    min_stock_level NUMERIC DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration DATE,
    supplier_uuid UUID,
    date_maj_prix TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    bread_quantite_defaut NUMERIC DEFAULT 0,
    bread_jours_semaine JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount_type TEXT NOT NULL,
    discount_amount NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    remaining_balance NUMERIC NOT NULL,
    payment_status TEXT NOT NULL,
    payments JSONB NOT NULL,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_uuid UUID REFERENCES public.sales(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stock_intakes (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplier_uuid UUID,
    invoice_number TEXT,
    invoice_date DATE,
    total_value NUMERIC NOT NULL,
    transport_fees NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_intake_items (
    id BIGSERIAL PRIMARY KEY,
    intake_uuid UUID REFERENCES public.stock_intakes(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received NUMERIC NOT NULL,
    quantity_damaged NUMERIC NOT NULL DEFAULT 0,
    purchase_price NUMERIC NOT NULL,
    cost_price NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_returns (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    original_sale_uuid UUID,
    original_invoice_number TEXT NOT NULL,
    total_return_value NUMERIC NOT NULL,
    amount_refunded NUMERIC NOT NULL,
    customer_uuid UUID REFERENCES public.customers(uuid),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.return_items (
    id BIGSERIAL PRIMARY KEY,
    return_uuid UUID REFERENCES public.product_returns(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES public.products(uuid),
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    was_restocked BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.inventory_logs (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE CASCADE NOT NULL,
    change NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_payments (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplier_uuid UUID REFERENCES public.suppliers(uuid) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    method TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bread_orders (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date DATE NOT NULL,
    quantite NUMERIC NOT NULL,
    quantite_origine NUMERIC,
    est_paye BOOLEAN DEFAULT FALSE,
    est_livre BOOLEAN DEFAULT FALSE,
    vente_uuid UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.zakat_history (
    uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- 3. RLS HARDENING (CORRELATED SUBQUERIES)
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_history ENABLE ROW LEVEL SECURITY;

-- Dynamic Ownership Policies
CREATE POLICY "Ownership Policy" ON public.company_profile FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.stock_intakes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.product_returns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.inventory_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.suppliers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.supplier_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.bread_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Ownership Policy" ON public.zakat_history FOR ALL USING (auth.uid() = user_id);

-- Subquery Link Policies (Fixing "column user_id does not exist")
CREATE POLICY "Sublink Policy" ON public.sale_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sales WHERE sales.uuid = sale_items.sale_uuid AND sales.user_id = auth.uid())
);
CREATE POLICY "Sublink Policy" ON public.stock_intake_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stock_intakes WHERE stock_intakes.uuid = stock_intake_items.intake_uuid AND stock_intakes.user_id = auth.uid())
);
CREATE POLICY "Sublink Policy" ON public.return_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.product_returns WHERE product_returns.uuid = return_items.return_uuid AND product_returns.user_id = auth.uid())
);

-- 4. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.search_sales(
    p_search_query TEXT DEFAULT NULL,
    p_from_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_to_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS SETOF public.sales AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.sales
    WHERE sales.user_id = auth.uid()
      AND (p_search_query IS NULL OR invoice_number ILIKE '%' || p_search_query || '%')
      AND (p_from_date IS NULL OR created_at >= p_from_date)
      AND (p_to_date IS NULL OR created_at <= p_to_date)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_product_categories()
RETURNS TABLE(category TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.category
    FROM public.products p
    WHERE p.user_id = auth.uid()
    ORDER BY p.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_expense_categories()
RETURNS TABLE(category TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT e.category
    FROM public.expenses e
    WHERE e.user_id = auth.uid()
    ORDER BY e.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_customer_categories()
RETURNS TABLE(category TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT c.category
    FROM public.customers c
    WHERE c.user_id = auth.uid()
    ORDER BY c.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
