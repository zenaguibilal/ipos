
-- 1. CLEANUP: Prevent Type Conflicts
DROP FUNCTION IF EXISTS search_sales(text, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_unique_product_categories();
DROP FUNCTION IF EXISTS get_unique_expense_categories();
DROP FUNCTION IF EXISTS get_unique_customer_categories();

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS company_profile (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
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
    role TEXT DEFAULT 'cashier',
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
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
    date_maj_prix TIMESTAMPTZ DEFAULT now(),
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
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
    bread_type_recurrence TEXT DEFAULT 'aucun',
    bread_quantite_defaut INTEGER DEFAULT 0,
    bread_jours_semaine JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    subtotal NUMERIC NOT NULL,
    discount_type TEXT DEFAULT 'fixed',
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    remaining_balance NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'paid',
    payments JSONB DEFAULT '[]',
    customer_uuid UUID REFERENCES customers(uuid),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_uuid UUID REFERENCES sales(uuid) ON DELETE CASCADE,
    product_uuid UUID,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS product_returns (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    original_sale_uuid UUID REFERENCES sales(uuid),
    original_invoice_number TEXT NOT NULL,
    total_return_value NUMERIC NOT NULL,
    amount_refunded NUMERIC DEFAULT 0,
    customer_uuid UUID REFERENCES customers(uuid),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS return_items (
    id BIGSERIAL PRIMARY KEY,
    return_uuid UUID REFERENCES product_returns(uuid) ON DELETE CASCADE,
    product_uuid UUID,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    was_restocked BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE CASCADE,
    change NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zakat_history (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    inventory_value NUMERIC,
    customer_debts NUMERIC,
    bad_debts NUMERIC,
    cash_on_hand NUMERIC,
    supplier_debts NUMERIC,
    other_debts NUMERIC,
    gold_price NUMERIC,
    nisab NUMERIC,
    zakat_base NUMERIC,
    zakat_amount NUMERIC,
    is_nisab_reached BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SECURITY (RLS) - CORRECTED FOR SUB-TABLES
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_history ENABLE ROW LEVEL SECURITY;

-- Base Policies
CREATE POLICY "Users manage their own profile" ON company_profile FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own products" ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own customers" ON customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own sales" ON sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own logs" ON inventory_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own returns" ON product_returns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their own zakat" ON zakat_history FOR ALL USING (auth.uid() = user_id);

-- SUB-TABLE POLICIES: Correlated ownership check
CREATE POLICY "Users manage their own sale items" ON sale_items 
FOR ALL USING (
    EXISTS (SELECT 1 FROM sales WHERE sales.uuid = sale_items.sale_uuid AND sales.user_id = auth.uid())
);

CREATE POLICY "Users manage their own return items" ON return_items 
FOR ALL USING (
    EXISTS (SELECT 1 FROM product_returns WHERE product_returns.uuid = return_items.return_uuid AND product_returns.user_id = auth.uid())
);

-- 4. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION search_sales(p_search_query TEXT, p_from_date TIMESTAMPTZ, p_to_date TIMESTAMPTZ)
RETURNS SETOF sales AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM sales
    WHERE user_id = auth.uid()
    AND (p_search_query IS NULL OR invoice_number ILIKE '%' || p_search_query || '%')
    AND (p_from_date IS NULL OR created_at >= p_from_date)
    AND (p_to_date IS NULL OR created_at <= p_to_date)
    ORDER BY created_at DESC;
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
