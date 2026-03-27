
-- iPOS Enterprise Schema Reconstruction
-- Fixes: RLS ownership verification for sub-tables, Function type conflicts, and Search performance.

-- Cleanup existing functions to prevent type mismatch errors
DROP FUNCTION IF EXISTS search_sales(text, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- Company Profile
CREATE TABLE company_profile (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    gold_price_per_gram NUMERIC DEFAULT 0,
    prix_pain NUMERIC DEFAULT 0,
    role TEXT DEFAULT 'admin',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Suppliers
CREATE TABLE suppliers (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE customers (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    debt_status TEXT DEFAULT 'none',
    is_over_limit BOOLEAN DEFAULT false,
    is_bread_client BOOLEAN DEFAULT false,
    bread_type_recurrence TEXT DEFAULT 'aucun',
    bread_quantite_defaut INTEGER DEFAULT 0,
    bread_jours_semaine JSONB DEFAULT '{}'::jsonb
);

-- Products
CREATE TABLE products (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price NUMERIC NOT NULL DEFAULT 0,
    purchase_price NUMERIC DEFAULT 0,
    quantity NUMERIC DEFAULT 0,
    min_stock_level NUMERIC DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration TIMESTAMPTZ,
    supplier_uuid UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
    date_maj_prix TIMESTAMPTZ DEFAULT now(),
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales
CREATE TABLE sales (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount_type TEXT DEFAULT 'fixed',
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    remaining_balance NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'paid',
    payments JSONB DEFAULT '[]'::jsonb,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sale Items
CREATE TABLE sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_uuid UUID REFERENCES sales(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL
);

-- Expenses
CREATE TABLE expenses (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'Autre',
    amount NUMERIC NOT NULL,
    expense_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Intakes
CREATE TABLE stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplier_uuid UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
    invoice_number TEXT,
    invoice_date TIMESTAMPTZ DEFAULT now(),
    total_value NUMERIC DEFAULT 0,
    transport_fees NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Intake Items
CREATE TABLE stock_intake_items (
    id BIGSERIAL PRIMARY KEY,
    intake_uuid UUID REFERENCES stock_intakes(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received NUMERIC NOT NULL,
    quantity_damaged NUMERIC DEFAULT 0,
    purchase_price NUMERIC NOT NULL,
    cost_price NUMERIC NOT NULL
);

-- Inventory Logs
CREATE TABLE inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE CASCADE NOT NULL,
    change NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Product Returns
CREATE TABLE product_returns (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    original_sale_uuid UUID REFERENCES sales(uuid) ON DELETE SET NULL,
    original_invoice_number TEXT NOT NULL,
    total_return_value NUMERIC NOT NULL,
    amount_refunded NUMERIC DEFAULT 0,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Return Items
CREATE TABLE return_items (
    id BIGSERIAL PRIMARY KEY,
    return_uuid UUID REFERENCES product_returns(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    was_restocked BOOLEAN DEFAULT true
);

-- Payments (Customer to Merchant)
CREATE TABLE payments (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Payments (Merchant to Supplier)
CREATE TABLE supplier_payments (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplier_uuid UUID REFERENCES suppliers(uuid) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT now(),
    method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bread Orders
CREATE TABLE bread_orders (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Zakat History
CREATE TABLE zakat_history (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    inventory_value NUMERIC NOT NULL,
    customer_debts NUMERIC NOT NULL,
    bad_debts NUMERIC DEFAULT 0,
    cash_on_hand NUMERIC DEFAULT 0,
    supplier_debts NUMERIC NOT NULL,
    other_debts NUMERIC DEFAULT 0,
    gold_price NUMERIC NOT NULL,
    nisab NUMERIC NOT NULL,
    zakat_base NUMERIC NOT NULL,
    zakat_amount NUMERIC NOT NULL,
    is_nisab_reached BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_history ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Generator for tables WITH user_id
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'user_id'
    LOOP
        EXECUTE format('CREATE POLICY "User can manage their own %I" ON public.%I USING (auth.uid() = user_id)', t, t);
    END LOOP;
END $$;

-- Hardened Policies for sub-tables WITHOUT user_id (Verified Ownership via parent)
CREATE POLICY "User can manage their own sale_items" ON public.sale_items 
USING (EXISTS (SELECT 1 FROM public.sales WHERE sales.uuid = sale_items.sale_uuid AND sales.user_id = auth.uid()));

CREATE POLICY "User can manage their own stock_intake_items" ON public.stock_intake_items 
USING (EXISTS (SELECT 1 FROM public.stock_intakes WHERE stock_intakes.uuid = stock_intake_items.intake_uuid AND stock_intakes.user_id = auth.uid()));

CREATE POLICY "User can manage their own return_items" ON public.return_items 
USING (EXISTS (SELECT 1 FROM public.product_returns WHERE product_returns.uuid = return_items.return_uuid AND product_returns.user_id = auth.uid()));

-- 4. FUNCTIONS (RPC)
-- Search Sales with Date Range and Text Query
CREATE OR REPLACE FUNCTION search_sales(p_search_query TEXT, p_from_date TIMESTAMPTZ, p_to_date TIMESTAMPTZ)
RETURNS SETOF sales AS $$
BEGIN
    RETURN QUERY
    SELECT s.*
    FROM sales s
    LEFT JOIN customers c ON s.customer_uuid = c.uuid
    WHERE s.user_id = auth.uid()
    AND (p_search_query IS NULL OR s.invoice_number ILIKE '%' || p_search_query || '%' OR c.search_name ILIKE '%' || p_search_query || '%')
    AND (p_from_date IS NULL OR s.created_at >= p_from_date)
    AND (p_to_date IS NULL OR s.created_at <= p_to_date)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique Categories Getters
CREATE OR REPLACE FUNCTION get_unique_product_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM products WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_customer_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM customers WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_expense_categories() RETURNS SETOF TEXT AS $$
    SELECT DISTINCT category FROM expenses WHERE user_id = auth.uid() AND category IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;
