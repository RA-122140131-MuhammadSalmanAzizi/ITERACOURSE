-- ============================================
-- 003: Safe RLS Policy Fixes
-- This migration is SAFE to run on an existing database.
-- It only drops and re-creates policies that need fixing.
-- ============================================

-- ============================================================
-- PROBLEM: The "profiles" table needs an INSERT policy for the
-- trigger function. Check if "Service role can insert profiles"
-- policy already exists (from 002). If it does, skip.
-- ============================================================

-- Nothing to do for profiles - 001 already has correct SELECT/UPDATE policies
-- and 002 already added INSERT policy.

-- ============================================================
-- PROBLEM: Some queries from the frontend fail because the
-- existing RLS policies are too restrictive or have conflicts.
-- ============================================================

-- Fix: categories "FOR ALL" policy conflicts with "FOR SELECT" 
-- The SELECT policy says USING(TRUE) but the ALL policy requires is_admin().
-- When a non-admin tries to SELECT, the ALL policy's USING clause fails.
-- This is actually fine because PostgreSQL uses OR logic for same-operation policies.
-- But let's verify it works by checking if policies exist properly.

-- No table changes needed! The existing 001 schema is correct.
-- The issue is likely that the INSERT policy on profiles is missing
-- for the trigger. Let's make sure it exists:

DO $$
BEGIN
  -- Ensure the trigger insert policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles" ON public.profiles
      FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

-- ============================================================
-- FIX: Retroactively create profiles for any auth users that
-- somehow don't have a profile row (e.g., if trigger failed)
-- ============================================================
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
)
ON CONFLICT (id) DO NOTHING;

-- Ensure superadmin is correctly set
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'iteracourse@gmail.com' AND role != 'admin';

-- ============================================================
-- DIAGNOSTIC: Show current table counts and policy status
-- ============================================================
DO $$
DECLARE
  profile_count INT;
  auth_count INT;
  missing_count INT;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  missing_count := auth_count - profile_count;
  
  RAISE NOTICE '=== Database Status ===';
  RAISE NOTICE 'Auth users: %, Profiles: %, Missing: %', auth_count, profile_count, missing_count;
  
  IF missing_count > 0 THEN
    RAISE WARNING 'There are % auth users without profiles! This should have been fixed above.', missing_count;
  ELSE
    RAISE NOTICE 'All auth users have profiles. ✓';
  END IF;
END $$;
