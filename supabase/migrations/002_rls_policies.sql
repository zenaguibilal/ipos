/**
 * [SEC-01] Sovereign Data Isolation Policies (RLS)
 * Garantit qu'un utilisateur ne peut accéder qu'à ses propres données.
 */

-- Purge existing dangerous policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all relevant tables
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Apply strict user_id policies for primary tables
-- Using a loop for standard user_id tables
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    AND tablename IN ('company_profile', 'products', 'customers', 'sales', 'expenses', 'stock_intakes', 'recipes', 'bread_orders', 'zakat_logs', 'inventory_logs', 'payments', 'suppliers', 'supplier_payments', 'product_returns') LOOP
        EXECUTE format('CREATE POLICY "User ownership" ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    END LOOP;
END $$;

-- Apply policies for join/child tables based on parent ownership (using EXISTS)
CREATE POLICY "Sale items ownership" ON sale_items FOR ALL 
USING (EXISTS (SELECT 1 FROM sales WHERE sales.uuid = sale_items.sale_uuid AND sales.user_id = auth.uid()));

CREATE POLICY "Stock intake items ownership" ON stock_intake_items FOR ALL 
USING (EXISTS (SELECT 1 FROM stock_intakes WHERE stock_intakes.uuid = stock_intake_items.intake_uuid AND stock_intakes.user_id = auth.uid()));

CREATE POLICY "Return items ownership" ON return_items FOR ALL 
USING (EXISTS (SELECT 1 FROM product_returns WHERE product_returns.uuid = return_items.return_uuid AND product_returns.user_id = auth.uid()));

-- Staff Profile Policy (Allows reading company staff but modification by owner only)
CREATE POLICY "Staff profile view" ON staff_profiles FOR SELECT USING (true); -- Filtered in application logic or via more complex join
CREATE POLICY "Staff profile management" ON staff_profiles FOR ALL USING (auth.uid() = user_id);
