
-- iPOS Complete Enterprise Schema
-- Optimized for Performance, Security (RLS), and Data Integrity

-- CLEANUP OLD FUNCTIONS
DROP FUNCTION IF EXISTS search_sales(text, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();

-- 1. COMPANY PROFILE
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
    gold_price_per_gram DECIMAL(12,2) DEFAULT 0,
    prix_pain DECIMAL(12,2) DEFAULT 0,
    role TEXT DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    search_name TEXT GENERATED ALWAYS AS (LOWER(first_name || ' ' || last_name)) STORED,
    phone TEXT,
    address TEXT,
    notes TEXT,
    category TEXT DEFAULT 'Standard',
    settlement_day INTEGER DEFAULT 30,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    outstanding_balance DECIMAL(15,2) DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    is_bread_client BOOLEAN DEFAULT false,
    bread_type_recurrence TEXT DEFAULT 'aucun',
    bread_quantite_defaut INTEGER DEFAULT 0,
    bread_jours_semaine JSONB DEFAULT '{}',
    debt_status TEXT DEFAULT 'none',
    is_over_limit BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_stock_level DECIMAL(12,2) DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration TIMESTAMPTZ,
    supplier_uuid UUID,
    date_maj_prix TIMESTAMPTZ DEFAULT now(),
    stock_status TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN quantity <= 0 THEN 'out_of_stock'
            WHEN quantity <= min_stock_level THEN 'low_stock'
            ELSE 'in_stock'
        END
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SALES
CREATE TABLE IF NOT EXISTS public.sales (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    subtotal DECIMAL(15,2) NOT NULL,
    discount_type TEXT DEFAULT 'fixed',
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) NOT NULL,
    remaining_balance DECIMAL(15,2) NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    payments JSONB DEFAULT '[]',
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_uuid UUID NOT NULL REFERENCES public.sales(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    purchase_price DECIMAL(15,2) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL
);

-- 5. STOCK INTAKES
CREATE TABLE IF NOT EXISTS public.stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID,
    invoice_number TEXT,
    invoice_date TIMESTAMPTZ DEFAULT now(),
    total_value DECIMAL(15,2) NOT NULL,
    transport_fees DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_intake_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_uuid UUID NOT NULL REFERENCES public.stock_intakes(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received DECIMAL(12,2) NOT NULL,
    quantity_damaged DECIMAL(12,2) DEFAULT 0,
    purchase_price DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2) NOT NULL
);

-- 6. PRODUCT RETURNS
CREATE TABLE IF NOT EXISTS public.product_returns (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_sale_uuid UUID REFERENCES public.sales(uuid) ON DELETE SET NULL,
    original_invoice_number TEXT NOT NULL,
    total_return_value DECIMAL(15,2) NOT NULL,
    amount_refunded DECIMAL(15,2) DEFAULT 0,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.return_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_uuid UUID NOT NULL REFERENCES public.product_returns(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES public.products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    purchase_price DECIMAL(15,2) NOT NULL,
    was_restocked BOOLEAN DEFAULT true
);

-- 7. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. INVENTORY LOGS
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_uuid UUID NOT NULL REFERENCES public.products(uuid) ON DELETE CASCADE,
    change DECIMAL(12,2) NOT NULL,
    new_quantity DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. PAYMENTS (CUSTOMER)
CREATE TABLE IF NOT EXISTS public.payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID NOT NULL REFERENCES public.customers(uuid) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- SECURITY (RLS)
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- POLICIES
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('company_profile', 'customers', 'products', 'sales', 'stock_intakes', 'product_returns', 'expenses', 'inventory_logs', 'payments')
    LOOP
        EXECUTE format('CREATE POLICY "User can manage their own %I" ON public.%I FOR ALL USING (auth.uid() = user_id)', t, t);
    END LOOP;
END $$;

-- SPECIAL POLICIES FOR ITEMS (No user_id column)
CREATE POLICY "RLS Sale Items" ON public.sale_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sales WHERE sales.uuid = public.sale_items.sale_uuid AND sales.user_id = auth.uid())
);
CREATE POLICY "RLS Stock Intake Items" ON public.stock_intake_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stock_intakes WHERE stock_intakes.uuid = public.stock_intake_items.intake_uuid AND stock_intakes.user_id = auth.uid())
);
CREATE POLICY "RLS Return Items" ON public.return_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.product_returns WHERE product_returns.uuid = public.return_items.return_uuid AND product_returns.user_id = auth.uid())
);

-- RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.search_sales(p_search_query TEXT, p_from_date TIMESTAMPTZ, p_to_date TIMESTAMPTZ)
RETURNS SETOF public.sales AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.sales
    WHERE user_id = auth.uid()
    AND (p_search_query IS NULL OR invoice_number ILIKE '%' || p_search_query || '%')
    AND (p_from_date IS NULL OR created_at >= p_from_date)
    AND (p_to_date IS NULL OR created_at <= p_to_date)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_product_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.products WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_customer_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.customers WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_unique_expense_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM public.expenses WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE SQL SECURITY DEFINER;
