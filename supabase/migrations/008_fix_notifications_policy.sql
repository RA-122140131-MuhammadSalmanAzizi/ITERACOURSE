-- ============================================
-- Fix Notifications Policies
-- Jalankan di SQL Editor Supabase
-- ============================================

-- Drop semua policy lama di notifications
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- 1) Users can read their own notifications
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- 2) Admin can also read all notifications (for monitoring)
CREATE POLICY "notifications_select_admin"
ON public.notifications FOR SELECT
USING (public.is_admin());

-- 3) Any authenticated user whose id matches sender_id can insert
--    (Admin sends notifications where sender_id = their own id)
CREATE POLICY "notifications_insert"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 4) Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 5) Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- 6) Admin can delete any notification
CREATE POLICY "notifications_delete_admin"
ON public.notifications FOR DELETE
USING (public.is_admin());

-- Grant access
GRANT ALL ON TABLE public.notifications TO authenticated;
