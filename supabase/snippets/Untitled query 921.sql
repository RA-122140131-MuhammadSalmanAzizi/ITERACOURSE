ALTER TABLE quiz_attempts
ADD CONSTRAINT unique_user_content UNIQUE (user_id, content_id);