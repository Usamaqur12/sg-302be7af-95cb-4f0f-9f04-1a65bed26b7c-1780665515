-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Add INSERT policy for orders table (was missing)
DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" 
ON orders FOR INSERT 
TO public 
WITH CHECK (
  auth.uid() = customer_id
);

-- Ensure seller_profiles has proper permissions
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Verify profiles policies are correct
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" 
ON profiles FOR INSERT 
TO public 
WITH CHECK (
  auth.uid() = id
  OR public.is_admin()
);