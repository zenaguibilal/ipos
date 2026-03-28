-- iPOS SOVEREIGN RLS POLICIES
-- [SEC-01] Isolation stricte des données par utilisateur

-- Enable RLS on all tables
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 1. Company Profile Policies
CREATE POLICY "Sovereign Access Profile" ON public.company_profile
    FOR ALL USING (auth.uid() = user_id);

-- 2. Products Policies
CREATE POLICY "Sovereign Access Products" ON public.products
    FOR ALL USING (auth.uid() = user_id);

-- 3. Sales Policies
CREATE POLICY "Sovereign Access Sales" ON public.sales
    FOR ALL USING (auth.uid() = user_id);

-- 4. Sale Items Policies
CREATE POLICY "Sovereign Access Sale Items" ON public.sale_items
    FOR ALL USING (auth.uid() = user_id);

-- 5. Customers Policies
CREATE POLICY "Sovereign Access Customers" ON public.customers
    FOR ALL USING (auth.uid() = user_id);
