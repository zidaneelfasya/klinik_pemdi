-- Fix RLS policies for profiles table
-- This ensures that superadmin (unit_id = 1) can manage all profiles
-- and regular users can view their own profile

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Super admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can update profiles" ON profiles;
DROP POLICY IF EXISTS "Superadmin can insert any profile" ON profiles;
DROP POLICY IF EXISTS "User can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Allow superadmin to view all profiles
CREATE POLICY "Superadmin can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_unit_penanggungjawab 
            WHERE user_unit_penanggungjawab.user_id = auth.uid() 
            AND user_unit_penanggungjawab.unit_id = 1
        )
    );

-- Policy 4: Allow superadmin to insert any profile
-- This is needed when admin creates a new user
CREATE POLICY "Superadmin can insert profiles" ON profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_unit_penanggungjawab 
            WHERE user_unit_penanggungjawab.user_id = auth.uid() 
            AND user_unit_penanggungjawab.unit_id = 1
        )
    );

-- Policy 5: Allow superadmin to update any profile
CREATE POLICY "Superadmin can update all profiles" ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_unit_penanggungjawab 
            WHERE user_unit_penanggungjawab.user_id = auth.uid() 
            AND user_unit_penanggungjawab.unit_id = 1
        )
    );

-- Policy 6: Allow superadmin to delete profiles
CREATE POLICY "Superadmin can delete profiles" ON profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_unit_penanggungjawab 
            WHERE user_unit_penanggungjawab.user_id = auth.uid() 
            AND user_unit_penanggungjawab.unit_id = 1
        )
    );

-- Important Note:
-- Service role key bypasses ALL RLS policies automatically
-- The API uses service role key (SUPABASE_SERVICE_ROLE_KEY), so it should work
-- These policies are for additional security when using client-side queries

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
