
-- iPOS Database Schema Migration
-- --------------------------------------------------------

-- 1. CLEANUP: Remove existing functions to avoid type conflicts
DROP FUNCTION IF EXISTS search_sales(text, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();

-- 2. CORE TABLES
-- --------------------------------------------------------

-- Company Profile & Settings
CREATE TABLE IF NOT EXISTS public.company_profile (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL DEFAULT 'Mon Magasin',
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
    gold_price_per_gram DECIMAL DEFAULT 0,
    prix_pain DECIMAL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'cashier',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price DECIMAL NOT NULL DEFAULT 0,
    purchase_price DECIMAL NOT NULL DEFAULT 0,
    quantity DECIMAL NOT NULL DEFAULT 0,
    min_stock_level DECIMAL NOT NULL DEFAULT 10,
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

-- Customers
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
    credit_limit DECIMAL DEFAULT 0,
    total_spent DECIMAL DEFAULT 0,
    outstanding_balance DECIMAL DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    debt_status TEXT DEFAULT 'none',
    is_over_limit BOOLEAN DEFAULT false,
    is_bread_client BOOLEAN DEFAULT false,
    bread_type_recurrence TEXT DEFAULT 'aucun',
    bread_quantite_defaut INTEGER DEFAULT 0,
    bread_jours_semaine JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales Invoices
CREATE TABLE IF NOT EXISTS public.sales (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    subtotal DECIMAL NOT NULL,
    discount_type TEXT,
    discount_amount DECIMAL DEFAULT 0,
    total DECIMAL NOT NULL,
    amount_paid DECIMAL NOT NULL DEFAULT 0,
    remaining_balance DECIMAL NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL,
    payments JSONB DEFAULT '[]',
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sale Items
CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_uuid UUID NOT NULL REFERENCES public.sales(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    purchase_price DECIMAL NOT NULL,
    quantity DECIMAL NOT NULL
);

-- Stock Intakes (Receipts)
CREATE TABLE IF NOT EXISTS public.stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID REFERENCES public.suppliers(uuid) ON DELETE SET NULL,
    invoice_number TEXT,
    invoice_date TIMESTAMPTZ DEFAULT now(),
    total_value DECIMAL NOT NULL DEFAULT 0,
    transport_fees DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Intake Items
CREATE TABLE IF NOT EXISTS public.stock_intake_items (
    id BIGSERIAL PRIMARY KEY,
    intake_uuid UUID NOT NULL REFERENCES public.stock_intakes(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received DECIMAL NOT NULL,
    quantity_damaged DECIMAL DEFAULT 0,
    purchase_price DECIMAL NOT NULL,
    cost_price DECIMAL
);

-- Product Returns
CREATE TABLE IF NOT EXISTS public.product_returns (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_sale_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
    original_invoice_number TEXT NOT NULL,
    total_return_value DECIMAL NOT NULL,
    amount_refunded DECIMAL NOT NULL DEFAULT 0,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Return Items
CREATE TABLE IF NOT EXISTS public.return_items (
    id BIGSERIAL PRIMARY KEY,
    return_uuid UUID NOT NULL REFERENCES public.product_returns(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity DECIMAL NOT NULL,
    price DECIMAL NOT NULL,
    purchase_price DECIMAL NOT NULL,
    was_restocked BOOLEAN DEFAULT true
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    expense_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customer Payments (Credit Collection)
CREATE TABLE IF NOT EXISTS public.payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID NOT NULL REFERENCES public.customers(uuid) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Payments
CREATE TABLE IF NOT EXISTS public.supplier_payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID NOT NULL REFERENCES public.suppliers(uuid) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    method TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_uuid UUID NOT NULL REFERENCES public.products(uuid) ON DELETE CASCADE,
    change DECIMAL NOT NULL,
    new_quantity DECIMAL NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Bread Orders
CREATE TABLE IF NOT EXISTS public.bread_orders (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date TEXT NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_origine INTEGER,
    est_paye BOOLEAN DEFAULT false,
    est_livre BOOLEAN DEFAULT false,
    vente_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Zakat History
CREATE TABLE IF NOT EXISTS public.zakat_history (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inventory_value DECIMAL NOT NULL,
    customer_debts DECIMAL NOT NULL,
    bad_debts DECIMAL NOT NULL,
    cash_on_hand DECIMAL NOT NULL,
    supplier_debts DECIMAL NOT NULL,
    other_debts DECIMAL NOT NULL,
    gold_price DECIMAL NOT NULL,
    nisab DECIMAL NOT NULL,
    zakat_base DECIMAL NOT NULL,
    zakat_amount DECIMAL NOT NULL,
    is_nisab_reached BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------

DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 4. POLICIES
-- --------------------------------------------------------

-- General rule: Users can only see/edit their own data
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'user_id'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "User manage own %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "User manage own %I" ON public.%I USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t, t);
    END LOOP;
END $$;

-- Child Table Policies (Check ownership via parent table)

-- Sale Items
DROP POLICY IF EXISTS "User manage own sale_items" ON public.sale_items;
CREATE POLICY "User manage own sale_items" ON public.sale_items 
    USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.uuid = sale_items.sale_uuid AND s.user_id = auth.uid()));

-- Stock Intake Items
DROP POLICY IF EXISTS "User manage own stock_intake_items" ON public.stock_intake_items;
CREATE POLICY "User manage own stock_intake_items" ON public.stock_intake_items 
    USING (EXISTS (SELECT 1 FROM public.stock_intakes i WHERE i.uuid = stock_intake_items.intake_uuid AND i.user_id = auth.uid()));

-- Return Items
DROP POLICY IF EXISTS "User manage own return_items" ON public.return_items;
CREATE POLICY "User manage own return_items" ON public.return_items 
    USING (EXISTS (SELECT 1 FROM public.product_returns r WHERE r.uuid = return_items.return_uuid AND r.user_id = auth.uid()));


-- 5. FUNCTIONS & RPCs
-- --------------------------------------------------------

-- Search Sales RPC
CREATE OR REPLACE FUNCTION public.search_sales(
    p_search_query TEXT DEFAULT NULL,
    p_from_date TIMESTAMPTZ DEFAULT NULL,
    p_to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (uuid UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT s.uuid
    FROM public.sales s
    LEFT JOIN public.customers c ON s.customer_uuid = c.uuid
    WHERE s.user_id = auth.uid()
    AND (
        p_search_query IS NULL 
        OR s.invoice_number ILIKE '%' || p_search_query || '%'
        OR c.search_name ILIKE '%' || p_search_query || '%'
    )
    AND (p_from_date IS NULL OR s.created_at >= p_from_date)
    AND (p_to_date IS NULL OR s.created_at <= p_to_date)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique Categories Fetchers
CREATE OR REPLACE FUNCTION public.get_unique_product_categories()
RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.products WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_expense_categories()
RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.expenses WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_customer_categories()
RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.customers WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. AUTOMATION TRIGGERS (updated_at)
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'updated_at') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_updated_at ON public.%I', t);
        EXECUTE format('CREATE TRIGGER tr_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);
    END LOOP;
END $$;
