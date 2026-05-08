ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS total_questions INT;

ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS correct_answers INT;