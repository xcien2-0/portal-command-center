-- Add portal_type and company_name columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portal_type TEXT NOT NULL DEFAULT 'empleado'
    CONSTRAINT profiles_portal_type_check CHECK (portal_type IN ('empleado', 'cliente')),
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Enable RLS (already likely enabled, but ensure it is)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Empleados can only see their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
