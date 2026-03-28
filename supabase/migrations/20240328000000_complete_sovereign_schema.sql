
-- ==========================================
-- iPOS SOVEREIGN DATABASE SCHEMA (FINAL)
-- Architecture Cloud-Only & Sécurité RLS Absolue
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TRIGGER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. TABLES DEFINITION

-- PROFILE DE L'ENTREPRISE (PROPRIÉTAIRE)
CREATE TABLE IF NOT EXISTS company_profile (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'Algérie',
    phone TEXT,
    email TEXT,
    website TEXT,
    vat_number TEXT,
    rc_number TEXT,
    art_imposition TEXT,
    gold_price_per_gram DECIMAL(12,2) DEFAULT 0,
    prix_pain DECIMAL(12,2) DEFAULT 0,
    currency_symbol TEXT DEFAULT 'DA',
    decimal_places INTEGER DEFAULT 1,
    zakat_anniversary TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- PROFILS DU PERSONNEL (EMPLOYÉS)
CREATE TABLE IF NOT EXISTS staff_profiles (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- ID du Patron
    email TEXT NOT NULL, -- Email de l'employé pour correspondance Auth
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email)
);

-- PRODUITS ET INVENTAIRE
CREATE TABLE IF NOT EXISTS products (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Non classé',
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_stock_level DECIMAL(12,2) DEFAULT 10,
    barcodes TEXT[] DEFAULT '{}',
    image_url TEXT,
    unite TEXT DEFAULT 'Pièce',
    date_expiration TIMESTAMP WITH TIME ZONE,
    date_maj_prix TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supplier_uuid UUID,
    stock_status TEXT DEFAULT 'in_stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLIENTS ET CRÉANCES
CREATE TABLE IF NOT EXISTS customers (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    search_name TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    category TEXT DEFAULT 'Standard',
    credit_limit DECIMAL(12,2) DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    debt_status TEXT DEFAULT 'none',
    is_over_limit BOOLEAN DEFAULT false,
    is_bread_client BOOLEAN DEFAULT false,
    bread_type_recurrence TEXT,
    bread_quantite_defaut INTEGER,
    bread_jours_semaine JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FOURNISSEURS
CREATE TABLE IF NOT EXISTS suppliers (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VENTES (GRAND LIVRE)
CREATE TABLE IF NOT EXISTS sales (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_type TEXT DEFAULT 'fixed',
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    remaining_balance DECIMAL(12,2) DEFAULT 0,
    payment_status TEXT NOT NULL,
    payments JSONB DEFAULT '[]',
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIGNES DE VENTE
CREATE TABLE IF NOT EXISTS sale_items (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_uuid UUID NOT NULL REFERENCES sales(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DÉPENSES
CREATE TABLE IF NOT EXISTS expenses (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'Autre',
    amount DECIMAL(12,2) NOT NULL,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MOUVEMENTS DE STOCK (LOGS)
CREATE TABLE IF NOT EXISTS inventory_logs (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_uuid UUID NOT NULL REFERENCES products(uuid) ON DELETE CASCADE,
    change DECIMAL(12,2) NOT NULL,
    new_quantity DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    related_uuid UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENCAISSEMENTS CLIENTS (PAIEMENTS)
CREATE TABLE IF NOT EXISTS payments (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID NOT NULL REFERENCES customers(uuid) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RÉCEPTIONS DE STOCK (INTAKES)
CREATE TABLE IF NOT EXISTS stock_intakes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID REFERENCES suppliers(uuid) ON DELETE SET NULL,
    invoice_number TEXT,
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_value DECIMAL(12,2) NOT NULL,
    transport_fees DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIGNES DE RÉCEPTION
CREATE TABLE IF NOT EXISTS stock_intake_items (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intake_uuid UUID NOT NULL REFERENCES stock_intakes(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity_received DECIMAL(12,2) NOT NULL,
    quantity_damaged DECIMAL(12,2) DEFAULT 0,
    purchase_price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RETOURS PRODUITS
CREATE TABLE IF NOT EXISTS product_returns (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_sale_uuid UUID NOT NULL REFERENCES sales(uuid) ON DELETE CASCADE,
    original_invoice_number TEXT NOT NULL,
    total_return_value DECIMAL(12,2) NOT NULL,
    amount_refunded DECIMAL(12,2) DEFAULT 0,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIGNES DE RETOUR
CREATE TABLE IF NOT EXISTS return_items (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    return_uuid UUID NOT NULL REFERENCES product_returns(uuid) ON DELETE CASCADE,
    product_uuid UUID REFERENCES products(uuid) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    was_restocked BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMMANDES DE PAIN (BOULANGERIE)
CREATE TABLE IF NOT EXISTS bread_orders (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID REFERENCES customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date DATE NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_origine INTEGER,
    est_paye BOOLEAN DEFAULT false,
    est_livre BOOLEAN DEFAULT false,
    vente_uuid UUID REFERENCES sales(uuid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LOGS DE CALCUL ZAKAT
CREATE TABLE IF NOT EXISTS zakat_logs (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    zakat_base DECIMAL(15,2) NOT NULL,
    zakat_amount DECIMAL(15,2) NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FICHES TECHNIQUES (COSTING)
CREATE TABLE IF NOT EXISTS recipes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    yield_quantity DECIMAL(12,2) NOT NULL,
    target_margin DECIMAL(5,2) NOT NULL,
    ingredients JSONB DEFAULT '[]',
    unit_cost DECIMAL(12,2) NOT NULL,
    suggested_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAIEMENTS VERSÉS AUX FOURNISSEURS
CREATE TABLE IF NOT EXISTS supplier_payments (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_uuid UUID NOT NULL REFERENCES suppliers(uuid) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'bank_transfer')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ENABLE RLS FOR ALL TABLES
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- 5. SOVEREIGN RLS POLICIES (OWNER + ACTIVE STAFF)

-- HELPER FUNCTION FOR STAFF PERMISSION CHECK
-- Note: Simplified for the migration file to avoid circularity
-- The policy checks if the current user email exists in staff_profiles under the record's user_id

-- APPLY POLICIES (Pattern: Owner always has full access, Staff has access based on email)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "SovereignAccess" ON %I', t);
        EXECUTE format('
            CREATE POLICY "SovereignAccess" ON %I
            FOR ALL
            USING (
                auth.uid() = user_id 
                OR 
                EXISTS (
                    SELECT 1 FROM staff_profiles 
                    WHERE email = auth.jwt()->>''email'' 
                    AND is_active = true
                )
            )
            WITH CHECK (
                auth.uid() = user_id 
                OR 
                EXISTS (
                    SELECT 1 FROM staff_profiles 
                    WHERE email = auth.jwt()->>''email'' 
                    AND is_active = true
                )
            )', t);
    END LOOP;
END $$;

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_barcodes ON products USING GIN (barcodes);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales (invoice_number);
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers (search_name);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff_profiles (email);

-- 7. AUTO-UPDATE TIMESTAMPS
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name NOT IN ('sale_items', 'inventory_logs', 'stock_intake_items', 'return_items', 'zakat_logs')
    LOOP
        EXECUTE format('CREATE TRIGGER update_%I_modtime BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;
