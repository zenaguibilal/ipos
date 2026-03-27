
-- iPOS - Intelligent Point of Sale
-- Full Database Schema Migration (Production Ready)

-- 1. CLEANUP OLD FUNCTIONS (To prevent type conflicts)
DROP FUNCTION IF EXISTS search_sales(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();

-- 2. TABLES DEFINITION

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    min_stock_level NUMERIC(12, 2) NOT NULL DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration TIMESTAMPTZ,
    supplier_uuid UUID,
    date_maj_prix TIMESTAMPTZ DEFAULT now(),
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    search_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    category TEXT DEFAULT 'Standard',
    settlement_day INTEGER DEFAULT 30,
    credit_limit NUMERIC(12, 2) DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0,
    outstanding_balance NUMERIC(12, 2) DEFAULT 0,
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

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_type TEXT DEFAULT 'fixed',
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    amount_paid NUMERIC(12, 2) DEFAULT 0,
    remaining_balance NUMERIC(12, 2) DEFAULT 0,
    payment_status TEXT DEFAULT 'paid',
    payments JSONB DEFAULT '[]',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_uuid UUID NOT NULL REFERENCES sales(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    purchase_price NUMERIC(12, 2) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL
);

-- Product Returns Table
CREATE TABLE IF NOT EXISTS product_returns (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_sale_uuid UUID REFERENCES sales(uuid) ON DELETE SET NULL,
    original_invoice_number TEXT NOT NULL,
    total_return_value NUMERIC(12, 2) NOT NULL,
    amount_refunded NUMERIC(12, 2) NOT NULL,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Return Items Table
CREATE TABLE IF NOT EXISTS return_items (
    id BIGSERIAL PRIMARY KEY,
    return_uuid UUID NOT NULL REFERENCES product_returns(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    purchase_price NUMERIC(12, 2) NOT NULL,
    was_restocked BOOLEAN DEFAULT true
);

-- Stock Intakes Table
CREATE TABLE IF NOT EXISTS stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
    invoice_number TEXT,
    invoice_date TIMESTAMPTZ DEFAULT now(),
    total_value NUMERIC(12, 2) NOT NULL,
    transport_fees NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Intake Items Table
CREATE TABLE IF NOT EXISTS stock_intake_items (
    id BIGSERIAL PRIMARY KEY,
    intake_uuid UUID NOT NULL REFERENCES stock_intakes(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received NUMERIC(12, 2) NOT NULL,
    quantity_damaged NUMERIC(12, 2) DEFAULT 0,
    purchase_price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL
);

-- Payments Table (Customer Payments)
CREATE TABLE IF NOT EXISTS payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID NOT NULL REFERENCES customers(uuid) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    expense_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company Profile Table
CREATE TABLE IF NOT EXISTS company_profile (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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
    gold_price_per_gram NUMERIC(12, 2) DEFAULT 0,
    prix_pain NUMERIC(12, 2) DEFAULT 0,
    role TEXT DEFAULT 'cashier',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Logs Table
CREATE TABLE IF NOT EXISTS inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_uuid UUID NOT NULL REFERENCES products(uuid) ON DELETE CASCADE,
    change NUMERIC(12, 2) NOT NULL,
    new_quantity NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Bread Orders Table
CREATE TABLE IF NOT EXISTS bread_orders (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date TEXT NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_origine INTEGER,
    est_paye BOOLEAN DEFAULT false,
    est_livre BOOLEAN DEFAULT false,
    vente_uuid UUID REFERENCES sales(uuid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Zakat History Table
CREATE TABLE IF NOT EXISTS zakat_history (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inventory_value NUMERIC(12, 2),
    customer_debts NUMERIC(12, 2),
    bad_debts NUMERIC(12, 2),
    cash_on_hand NUMERIC(12, 2),
    supplier_debts NUMERIC(12, 2),
    other_debts NUMERIC(12, 2),
    gold_price NUMERIC(12, 2),
    nisab NUMERIC(12, 2),
    zakat_base NUMERIC(12, 2),
    zakat_amount NUMERIC(12, 2),
    is_nisab_reached BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (FIXED FOR CHILD TABLES)

-- Utility to prevent repetition
CREATE OR REPLACE FUNCTION check_ownership(target_uuid UUID, table_name TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE uuid = %L AND user_id = auth.uid())', table_name, target_uuid) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Standard Policies
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
               AND tablename IN ('products', 'customers', 'suppliers', 'sales', 'product_returns', 'stock_intakes', 'payments', 'expenses', 'company_profile', 'inventory_logs', 'bread_orders', 'zakat_history')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "User can manage their own %I" ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY "User can manage their own %I" ON %I USING (auth.uid() = user_id)', tbl, tbl);
    END LOOP;
END $$;

-- Child Table Policies (Subquery Fix)
CREATE POLICY "User can manage their own sale_items" ON public.sale_items 
USING (EXISTS (SELECT 1 FROM sales WHERE sales.uuid = sale_uuid AND sales.user_id = auth.uid()));

CREATE POLICY "User can manage their own return_items" ON public.return_items 
USING (EXISTS (SELECT 1 FROM product_returns WHERE product_returns.uuid = return_uuid AND product_returns.user_id = auth.uid()));

CREATE POLICY "User can manage their own stock_intake_items" ON public.stock_intake_items 
USING (EXISTS (SELECT 1 FROM stock_intakes WHERE stock_intakes.uuid = intake_uuid AND stock_intakes.user_id = auth.uid()));

-- 5. RPC FUNCTIONS

-- Search Sales Function
CREATE OR REPLACE FUNCTION search_sales(p_search_query TEXT, p_from_date TIMESTAMPTZ, p_to_date TIMESTAMPTZ)
RETURNS SETOF sales AS $$
BEGIN
    RETURN QUERY
    SELECT s.* FROM sales s
    LEFT JOIN customers c ON s.customer_uuid = c.uuid
    WHERE s.user_id = auth.uid()
    AND (p_search_query IS NULL OR s.invoice_number ILIKE '%' || p_search_query || '%' OR c.search_name ILIKE '%' || p_search_query || '%')
    AND (p_from_date IS NULL OR s.created_at >= p_from_date)
    AND (p_to_date IS NULL OR s.created_at <= p_to_date)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique Categories Helpers
CREATE OR REPLACE FUNCTION get_unique_product_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM products WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_customer_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM customers WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_expense_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM expenses WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
               AND tablename IN ('products', 'customers', 'suppliers', 'sales', 'product_returns', 'stock_intakes', 'payments', 'expenses', 'company_profile', 'bread_orders')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl);
    END LOOP;
END $$;
