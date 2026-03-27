
-- iPOS Comprehensive Schema Migration
-- Run this in your Supabase SQL Editor to create all required tables and RLS policies.

-- 1. Company Profiles
CREATE TABLE IF NOT EXISTS public.company_profile (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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
    gold_price_per_gram NUMERIC DEFAULT 0,
    prix_pain NUMERIC DEFAULT 0,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'cashier')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Staff Profiles
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Recipes (Cost Engineering)
CREATE TABLE IF NOT EXISTS public.recipes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    yield_quantity NUMERIC NOT NULL DEFAULT 1,
    target_margin NUMERIC NOT NULL DEFAULT 30,
    ingredients JSONB NOT NULL DEFAULT '[]',
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    suggested_price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bread Orders (Bakery Module)
CREATE TABLE IF NOT EXISTS public.bread_orders (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_uuid UUID REFERENCES public.customers(uuid) ON DELETE SET NULL,
    order_name TEXT NOT NULL,
    date DATE NOT NULL,
    quantite NUMERIC NOT NULL DEFAULT 0,
    quantite_origine NUMERIC,
    est_paye BOOLEAN DEFAULT false,
    est_livre BOOLEAN DEFAULT false,
    vente_uuid UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Zakat Logs
CREATE TABLE IF NOT EXISTS public.zakat_logs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    zakat_base NUMERIC NOT NULL,
    zakat_amount NUMERIC NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bread_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Owner-based access)
CREATE POLICY "Users can manage their own profile" ON public.company_profile FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view staff" ON public.staff_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage staff" ON public.staff_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.company_profile WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Managers and Admins can manage recipes" ON public.recipes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.company_profile WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Managers and Admins can manage bread orders" ON public.bread_orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.company_profile WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Managers and Admins can manage zakat logs" ON public.zakat_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.company_profile WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);
