-- ============================================
-- 004: FIX infinite recursion in profiles policies
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- Step 1: Drop ALL policies on profiles (nuclear reset)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Step 2: Drop ALL policies on other affected tables
DO $$
DECLARE
  pol RECORD;
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['categories','courses','chapters','contents','quiz_questions',
    'enrollments','content_progress','quiz_attempts','reviews','certificates',
    'wishlists','course_approvals','orders','faq_categories','faq_items','dosen_requests']
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- Step 3: Recreate is_admin/is_dosen as SECURITY DEFINER (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_dosen()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dosen'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- PROFILES - NO self-referencing policies!
-- ==========================================
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin update uses SECURITY DEFINER function (no recursion)
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- ==========================================
-- CATEGORIES
-- ==========================================
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories_admin" ON public.categories
  FOR ALL USING (public.is_admin());

-- ==========================================
-- COURSES
-- ==========================================
CREATE POLICY "courses_select_published" ON public.courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "courses_select_own" ON public.courses
  FOR SELECT USING (auth.uid() = instructor_id);

CREATE POLICY "courses_select_admin" ON public.courses
  FOR SELECT USING (public.is_admin());

CREATE POLICY "courses_insert_dosen" ON public.courses
  FOR INSERT WITH CHECK (auth.uid() = instructor_id AND public.is_dosen());

CREATE POLICY "courses_update_own" ON public.courses
  FOR UPDATE USING (auth.uid() = instructor_id);

CREATE POLICY "courses_update_admin" ON public.courses
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "courses_delete_own" ON public.courses
  FOR DELETE USING (auth.uid() = instructor_id AND status = 'draft');

CREATE POLICY "courses_delete_admin" ON public.courses
  FOR DELETE USING (public.is_admin());

-- ==========================================
-- CHAPTERS
-- ==========================================
CREATE POLICY "chapters_select" ON public.chapters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id
      AND (c.status = 'published' OR c.instructor_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY "chapters_manage_own" ON public.chapters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "chapters_manage_admin" ON public.chapters
  FOR ALL USING (public.is_admin());

-- ==========================================
-- CONTENTS
-- ==========================================
CREATE POLICY "contents_select" ON public.contents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chapters ch JOIN public.courses c ON c.id = ch.course_id
      WHERE ch.id = chapter_id
      AND (c.status = 'published' OR c.instructor_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY "contents_manage_own" ON public.contents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chapters ch JOIN public.courses c ON c.id = ch.course_id
      WHERE ch.id = chapter_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "contents_manage_admin" ON public.contents
  FOR ALL USING (public.is_admin());

-- ==========================================
-- QUIZ QUESTIONS
-- ==========================================
CREATE POLICY "quiz_questions_select" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.contents ct JOIN public.chapters ch ON ch.id = ct.chapter_id
      JOIN public.courses c ON c.id = ch.course_id WHERE ct.id = content_id
      AND (c.status = 'published' OR c.instructor_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY "quiz_questions_manage_own" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.contents ct JOIN public.chapters ch ON ch.id = ct.chapter_id
      JOIN public.courses c ON c.id = ch.course_id WHERE ct.id = content_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "quiz_questions_manage_admin" ON public.quiz_questions
  FOR ALL USING (public.is_admin());

-- ==========================================
-- ENROLLMENTS
-- ==========================================
CREATE POLICY "enrollments_select_own" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "enrollments_select_dosen" ON public.enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "enrollments_select_admin" ON public.enrollments
  FOR SELECT USING (public.is_admin());

CREATE POLICY "enrollments_insert_own" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enrollments_update_own" ON public.enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- CONTENT PROGRESS
-- ==========================================
CREATE POLICY "content_progress_own" ON public.content_progress
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- QUIZ ATTEMPTS
-- ==========================================
CREATE POLICY "quiz_attempts_select_own" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_insert_own" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_select_admin" ON public.quiz_attempts
  FOR SELECT USING (public.is_admin());

-- ==========================================
-- REVIEWS
-- ==========================================
CREATE POLICY "reviews_select_approved" ON public.reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "reviews_select_own" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reviews_select_admin" ON public.reviews
  FOR SELECT USING (public.is_admin());

CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "reviews_update_admin" ON public.reviews
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "reviews_delete_admin" ON public.reviews
  FOR DELETE USING (public.is_admin());

-- ==========================================
-- CERTIFICATES
-- ==========================================
CREATE POLICY "certificates_select" ON public.certificates
  FOR SELECT USING (true);

CREATE POLICY "certificates_insert_own" ON public.certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- WISHLISTS
-- ==========================================
CREATE POLICY "wishlists_own" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- COURSE APPROVALS
-- ==========================================
CREATE POLICY "course_approvals_admin" ON public.course_approvals
  FOR ALL USING (public.is_admin());

CREATE POLICY "course_approvals_select_dosen" ON public.course_approvals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

-- ==========================================
-- ORDERS
-- ==========================================
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (public.is_admin());

-- ==========================================
-- FAQ
-- ==========================================
CREATE POLICY "faq_categories_select" ON public.faq_categories
  FOR SELECT USING (true);

CREATE POLICY "faq_categories_admin" ON public.faq_categories
  FOR ALL USING (public.is_admin());

CREATE POLICY "faq_items_select" ON public.faq_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "faq_items_admin" ON public.faq_items
  FOR ALL USING (public.is_admin());

-- ==========================================
-- DOSEN REQUESTS
-- ==========================================
CREATE POLICY "dosen_requests_select_own" ON public.dosen_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dosen_requests_insert_own" ON public.dosen_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dosen_requests_update_own" ON public.dosen_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "dosen_requests_select_admin" ON public.dosen_requests
  FOR SELECT USING (public.is_admin());

CREATE POLICY "dosen_requests_update_admin" ON public.dosen_requests
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "dosen_requests_delete_admin" ON public.dosen_requests
  FOR DELETE USING (public.is_admin());

-- ==========================================
-- VERIFY: Check profile exists for all users
-- ==========================================
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT u.id, LOWER(TRIM(u.email)),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', NULL),
  CASE WHEN LOWER(TRIM(u.email)) = 'iteracourse@gmail.com' THEN 'admin' ELSE 'customer' END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles SET role = 'admin' WHERE email = 'iteracourse@gmail.com' AND role != 'admin';
