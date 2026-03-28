
-- iPOS SOVEREIGN RLS POLICIES (SEC-01)
-- AUTHOR: SECURITY ENGINEER

-- Enable RLS on all tables
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 1. COMPANY PROFILE POLIES
DROP POLICY IF EXISTS "Sovereign Access" ON public.company_profile;
CREATE POLICY "Sovereign Access" ON public.company_profile
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. PRODUCTS POLICIES
DROP POLICY IF EXISTS "User Ownership" ON public.products;
CREATE POLICY "User Ownership" ON public.products
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Insert" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User Update" ON public.products
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User Delete" ON public.products
    FOR DELETE USING (auth.uid() = user_id);

-- 3. CUSTOMERS POLICIES
DROP POLICY IF EXISTS "Customer Ownership" ON public.customers;
CREATE POLICY "Customer Ownership" ON public.customers
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. SALES POLICIES
DROP POLICY IF EXISTS "Sales Ownership" ON public.sales;
CREATE POLICY "Sales Ownership" ON public.sales
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
