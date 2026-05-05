-- ============================================
-- 005: GRANT table permissions to anon & authenticated
-- This fixes the 403 "permission denied" errors
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- Grant SELECT to anon (public/non-logged-in users) for public data
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.chapters TO anon;
GRANT SELECT ON public.contents TO anon;
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.certificates TO anon;
GRANT SELECT ON public.faq_categories TO anon;
GRANT SELECT ON public.faq_items TO anon;

-- Grant full access to authenticated users (RLS policies control row access)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.chapters TO authenticated;
GRANT ALL ON public.contents TO authenticated;
GRANT ALL ON public.quiz_questions TO authenticated;
GRANT ALL ON public.enrollments TO authenticated;
GRANT ALL ON public.content_progress TO authenticated;
GRANT ALL ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.certificates TO authenticated;
GRANT ALL ON public.wishlists TO authenticated;
GRANT ALL ON public.course_approvals TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.faq_categories TO authenticated;
GRANT ALL ON public.faq_items TO authenticated;
GRANT ALL ON public.dosen_requests TO authenticated;

-- Grant USAGE on sequences (needed for serial/auto-increment columns)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Also grant to service_role (used by triggers)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
