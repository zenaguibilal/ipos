
-- [SEC-01] Strict RLS Policies Enforcement
-- No more "using(true)" violations.

ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Dynamic Ownership Policy Macro
DO $$ 
DECLARE 
    t TEXT;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Sovereign Ownership" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Sovereign Ownership" ON public.%I 
            FOR ALL USING (auth.uid() = user_id) 
            WITH CHECK (auth.uid() = user_id)', t);
    END LOOP;
END $$;
