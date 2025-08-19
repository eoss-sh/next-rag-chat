-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('pending', 'user', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public read access" ON user_profiles;
DROP POLICY IF EXISTS "Service role can update" ON user_profiles;
DROP POLICY IF EXISTS "Profile updates" ON user_profiles;

-- Create clean policies
-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- All authenticated users can read profiles (authorization in API)
CREATE POLICY "Authenticated read access" ON user_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- All authenticated users can update profiles (authorization in API) 
CREATE POLICY "Authenticated update access" ON user_profiles
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'pending',
        'pending_approval'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the first admin user (replace with your email)
-- This should be run manually after creating your account
-- INSERT INTO user_profiles (id, email, full_name, role, status, approved_at)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'admin', 'active', NOW()
-- FROM auth.users 
-- WHERE email = 'your-admin-email@example.com'
-- ON CONFLICT (id) DO UPDATE SET 
--   role = 'admin',
--   status = 'active',
--   approved_at = NOW();