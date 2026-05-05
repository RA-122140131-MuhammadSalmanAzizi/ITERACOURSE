-- ============================================
-- FIX: Profile auto-creation trigger with role assignment
-- + Dosen Request System (Admin Approval)
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handle_new_user function with smart role assignment
-- ONLY iteracourse@gmail.com gets auto-admin
-- Everyone else (including itera.ac.id) starts as customer
-- Dosen role must be requested and approved by admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'customer';
  user_full_name TEXT;
  user_avatar TEXT;
  user_email TEXT;
BEGIN
  user_email := LOWER(TRIM(NEW.email));
  
  -- Only auto-assign admin for the superadmin email
  IF user_email = 'iteracourse@gmail.com' THEN
    user_role := 'admin';
  ELSE
    user_role := 'customer';
  END IF;

  -- Extract name from Google metadata or fallback to email prefix
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1)
  );

  -- Extract avatar from Google metadata
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Insert profile (use ON CONFLICT to avoid duplicates)
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (NEW.id, user_email, user_full_name, user_avatar, user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- NEW TABLE: Dosen Role Requests
-- Users with itera.ac.id (staff) email can request dosen role
-- Admin must approve before role changes
-- ============================================
CREATE TABLE IF NOT EXISTS public.dosen_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  reason TEXT,                     -- Why they want dosen role
  department TEXT,                 -- e.g. "Informatika", "Teknik Elektro"
  staff_id TEXT,                   -- NIP/NIDN (optional proof)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,                -- Admin's reason for approval/rejection
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)                  -- One request per user
);

-- Enable RLS
ALTER TABLE public.dosen_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dosen_requests
CREATE POLICY "Users can view own dosen request" ON public.dosen_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dosen request" ON public.dosen_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending request" ON public.dosen_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admin can view all dosen requests" ON public.dosen_requests
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin can update any dosen request" ON public.dosen_requests
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin can delete any dosen request" ON public.dosen_requests
  FOR DELETE USING (public.is_admin());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dosen_requests_user ON public.dosen_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dosen_requests_status ON public.dosen_requests(status);


-- Add INSERT policy on profiles (needed for the trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles" ON public.profiles
      FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;


-- ============================================
-- FIX: Retroactively create profiles for existing auth users
-- who logged in via Google but don't have a profile yet
-- ============================================
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT 
  u.id,
  LOWER(TRIM(u.email)),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', NULL),
  CASE
    WHEN LOWER(TRIM(u.email)) = 'iteracourse@gmail.com' THEN 'admin'
    ELSE 'customer'
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Also fix existing iteracourse@gmail.com profile to admin if it exists
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'iteracourse@gmail.com' AND role != 'admin';
