
-- iPOS - Intelligent Point of Sale Initial Schema

-- 1. TABLES DEFINITION

-- Company/Store Profile
CREATE TABLE company_profile (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    search_name TEXT, -- Concatenated lower-case for search
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

-- Products
CREATE TABLE products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC DEFAULT 0,
    min_stock_level NUMERIC DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration DATE,
    supplier_uuid UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
    date_maj_prix TIMESTAMPTZ,
    stock_status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Movement Logs
CREATE TABLE inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE CASCADE NOT NULL,
    change NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    reason TEXT NOT NULL, -- 'sale', 'return', 'stock_intake', etc.
    related_uuid UUID, -- Link to sale_uuid, return_uuid, etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales
CREATE TABLE sales (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount_type TEXT, -- 'percentage', 'fixed'
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    remaining_balance NUMERIC DEFAULT 0,
    payment_status TEXT NOT NULL, -- 'paid', 'partial', 'unpaid'
    payments JSONB DEFAULT '[]',
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sale Line Items
CREATE TABLE sale_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_uuid UUID REFERENCES sales(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL
);

-- Returns
CREATE TABLE product_returns (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Return Line Items
CREATE TABLE return_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_uuid UUID REFERENCES product_returns(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    purchase_price NUMERIC NOT NULL,
    was_restocked BOOLEAN DEFAULT true
);

-- Stock Receptions (Intakes)
CREATE TABLE stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplier_uuid UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
    invoice_number TEXT,
    invoice_date DATE NOT NULL,
    total_value NUMERIC NOT NULL,
    transport_fees NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Intake Line Items
CREATE TABLE stock_intake_items (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_uuid UUID REFERENCES stock_intakes(uuid) ON DELETE CASCADE NOT NULL,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received NUMERIC NOT NULL,
    quantity_damaged NUMERIC DEFAULT 0,
    purchase_price NUMERIC NOT NULL,
    cost_price NUMERIC -- purchase + prorated transport
);

-- Customer Payments
CREATE TABLE payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments to Suppliers
CREATE TABLE supplier_payments (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplier_uuid UUID REFERENCES suppliers(uuid) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    method TEXT NOT NULL, -- 'cash', 'card', 'bank_transfer'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business Expenses
CREATE TABLE expenses (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bread Orders (Bakery Module)
CREATE TABLE bread_orders (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date DATE NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_origine INTEGER,
    est_paye BOOLEAN DEFAULT false,
    est_livre BOOLEAN DEFAULT false,
    vente_uuid UUID REFERENCES sales(uuid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Zakat Saved History
CREATE TABLE zakat_history (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    is_nisab_reached BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)

ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_history ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES GENERATION

-- Standard policy: Owners only
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT IN ('sale_items', 'return_items', 'stock_intake_items')
    LOOP
        EXECUTE format('CREATE POLICY "Ownership Access" ON %I FOR ALL USING (user_id = auth.uid())', t);
    END LOOP;
END $$;

-- Sub-tables (Items) logic: Access if user owns parent transaction
CREATE POLICY "Items Access via Sale" ON sale_items FOR ALL 
USING (EXISTS (SELECT 1 FROM sales WHERE sales.uuid = sale_items.sale_uuid AND sales.user_id = auth.uid()));

CREATE POLICY "Items Access via Return" ON return_items FOR ALL 
USING (EXISTS (SELECT 1 FROM product_returns WHERE product_returns.uuid = return_items.return_uuid AND product_returns.user_id = auth.uid()));

CREATE POLICY "Items Access via Intake" ON stock_intake_items FOR ALL 
USING (EXISTS (SELECT 1 FROM stock_intakes WHERE stock_intakes.uuid = stock_intake_items.intake_uuid AND stock_intakes.user_id = auth.uid()));

-- 4. RPC FUNCTIONS

-- Advanced Search for Sales
CREATE OR REPLACE FUNCTION search_sales(p_search_query TEXT DEFAULT NULL, p_from_date TIMESTAMPTZ DEFAULT NULL, p_to_date TIMESTAMPTZ DEFAULT NULL)
RETURNS SETOF sales AS $$
BEGIN
    RETURN QUERY
    SELECT s.*
    FROM sales s
    LEFT JOIN customers c ON s.customer_uuid = c.uuid
    WHERE s.user_id = auth.uid()
    AND (p_search_query IS NULL OR s.invoice_number ILIKE '%' || p_search_query || '%' OR c.first_name ILIKE '%' || p_search_query || '%' OR c.last_name ILIKE '%' || p_search_query || '%')
    AND (p_from_date IS NULL OR s.created_at >= p_from_date)
    AND (p_to_date IS NULL OR s.created_at <= p_to_date)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to get unique categories dynamically
CREATE OR REPLACE FUNCTION get_unique_product_categories() RETURNS TEXT[] AS $$
BEGIN
    RETURN (SELECT ARRAY_AGG(DISTINCT category) FROM products WHERE user_id = auth.uid() AND category IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_customer_categories() RETURNS TEXT[] AS $$
BEGIN
    RETURN (SELECT ARRAY_AGG(DISTINCT category) FROM customers WHERE user_id = auth.uid() AND category IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unique_expense_categories() RETURNS TEXT[] AS $$
BEGIN
    RETURN (SELECT ARRAY_AGG(DISTINCT category) FROM expenses WHERE user_id = auth.uid() AND category IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. STORAGE BUCKETS (Needs manual creation or via SDK, but here's instructions)
-- Backups bucket: "backups"
-- Products images: "products"
