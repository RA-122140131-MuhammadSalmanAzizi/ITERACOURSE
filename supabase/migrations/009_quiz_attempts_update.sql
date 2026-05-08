-- Allow users to update their own quiz attempts (for upsert - keeping highest score)
CREATE POLICY "Users can update own quiz attempts" ON public.quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add unique constraint for user_id + content_id to enable upsert
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_user_content_unique UNIQUE (user_id, content_id);

-- Add columns for detailed quiz info
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS correct_answers INT DEFAULT 0;
