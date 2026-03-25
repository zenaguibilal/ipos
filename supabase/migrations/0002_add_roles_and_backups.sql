-- Add role to company profiles
ALTER TABLE public.company_profiles
ADD COLUMN role TEXT NOT NULL DEFAULT 'manager';

-- Create a type for app roles for validation
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'cashier');

-- Alter the column to use the new type and constraint, handling existing values
ALTER TABLE public.company_profiles
ALTER COLUMN role DROP DEFAULT,
ALTER COLUMN role TYPE app_role USING role::app_role,
ALTER COLUMN role SET DEFAULT 'manager';

-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 10485760, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

-- RLS helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS app_role AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role FROM public.company_profiles WHERE user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- RLS POLICIES
-- BREAD ORDERS
DROP POLICY IF EXISTS "Users can manage their own bread orders" ON public.bread_orders;
CREATE POLICY "Users can view their own bread orders" ON public.bread_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers/Admins can manage bread orders" ON public.bread_orders FOR INSERT, UPDATE, DELETE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (get_user_role() IN ('admin', 'manager')));

-- COMPANY PROFILES
DROP POLICY IF EXISTS "Users can manage their own company profile" ON public.company_profiles;
CREATE POLICY "Users can view their own profile" ON public.company_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.company_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Note: Insert and delete are handled by auth triggers or admin processes, not direct user action.

-- CUSTOMERS
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "All roles can create customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers/Admins can update/delete customers" ON public.customers FOR UPDATE, DELETE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (get_user_role() IN ('admin', 'manager')));

-- EXPENSES
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers/Admins can manage expenses" ON public.expenses FOR INSERT, UPDATE, DELETE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (get_user_role() IN ('admin', 'manager')));

-- INVENTORY LOGS
DROP POLICY IF EXISTS "Users can manage their own inventory logs" ON public.inventory_logs;
CREATE POLICY "Users can view their own inventory logs" ON public.inventory_logs FOR SELECT USING (auth.uid() = user_id);
-- Logs are created by the system via other actions (sales, returns), not directly by users.

-- PAYMENTS
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "All roles can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Payments are not typically deleted or updated.

-- PRODUCTS
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers/Admins can manage products" ON public.products FOR INSERT, UPDATE, DELETE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (get_user_role() IN ('admin', 'manager')));

-- PRODUCT RETURNS
DROP POLICY IF EXISTS "Users can manage their own product returns" ON public.product_returns;
CREATE POLICY "Users can view their own returns" ON public.product_returns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "All roles can create returns" ON public.product_returns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers/Admins can delete returns" ON public.product_returns FOR DELETE USING (auth.uid() = user_id AND (get_user_role() IN ('admin', 'manager')));

-- SALES & SALE ITEMS
DROP POLICY IF EXISTS "Users can manage their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can manage their own sale items" ON public.sale_items;
CREATE POLICY "Users can view their own sales" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own sale items" ON public.sale_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "All roles can create sales and sale items" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "All roles can create sales and sale items" ON public.sale_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers/Admins can delete sales" ON public.sales FOR DELETE USING (auth.uid() = user_id AND (get_user_role() IN ('admin', 'manager')));
-- sale_items are deleted via CASCADE

-- STOCK INTAKES
DROP POLICY IF EXISTS "Users can manage their own stock intakes" ON public.stock_intakes;
CREATE POLICY "Users can view their own stock intakes" ON public.stock_intakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers/Admins can manage stock intakes" ON public.stock_intakes FOR INSERT, UPDATE, DELETE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (get_user_role() IN ('admin', 'manager')));

-- SUPPLIERS
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;
CREATE POLICY "Users can view their own suppliers" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers/Admins can manage suppliers" ON public.suppliers FOR INSERT, UPDATE, DELETE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (get_user_role() IN ('admin', 'manager')));

-- STORAGE
DROP POLICY IF EXISTS "Users can manage their own backups" ON storage.objects;
CREATE POLICY "Users can manage their own backups"
ON storage.objects FOR ALL
USING ( bucket_id = 'backups' AND owner = auth.uid() )
WITH CHECK ( bucket_id = 'backups' AND owner = auth.uid() );
