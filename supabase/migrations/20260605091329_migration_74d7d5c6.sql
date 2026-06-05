-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "seller_profiles_select_public" ON seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_update_own" ON seller_profiles;

-- Create a SECURITY DEFINER function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Create non-recursive policies using the helper function
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO public
USING (
  auth.uid() = id OR public.is_admin()
);

CREATE POLICY "seller_profiles_select_public"
ON seller_profiles FOR SELECT
TO public
USING (
  status = 'approved'::seller_status 
  OR user_id = auth.uid() 
  OR public.is_admin()
);

CREATE POLICY "seller_profiles_update_own"
ON seller_profiles FOR UPDATE
TO public
USING (
  user_id = auth.uid() 
  OR public.is_admin()
);