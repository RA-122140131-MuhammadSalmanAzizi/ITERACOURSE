-- ============================================
-- ITERA Course Platform - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================


-- ========== TABLES ==========

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'dosen', 'customer')),
  bio TEXT,
  phone TEXT,
  institution TEXT,
  expertise TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== HELPER FUNCTION ==========
-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if current user is dosen
CREATE OR REPLACE FUNCTION public.is_dosen()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dosen'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 2. Categories
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  course_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  category_id INT REFERENCES public.categories(id),
  level TEXT CHECK (level IN ('Beginner','Intermediate','Advanced','All Levels')),
  price INT DEFAULT 0,
  is_free BOOLEAN DEFAULT TRUE,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','published','rejected')),
  passing_score INT DEFAULT 80,
  total_duration TEXT,
  total_lessons INT DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_students INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  tags TEXT[],
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Chapters
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Contents
CREATE TABLE public.contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video','pdf','link','exercise')),
  title TEXT NOT NULL,
  video_url TEXT,
  video_public_id TEXT,
  duration TEXT,
  file_url TEXT,
  file_size TEXT,
  external_url TEXT,
  link_description TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Quiz Questions
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  image_url TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INT NOT NULL,
  sort_order INT DEFAULT 0
);

-- 7. Enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed')),
  progress NUMERIC(5,2) DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- 8. Content Progress
CREATE TABLE public.content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content_id UUID NOT NULL REFERENCES public.contents(id),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, content_id)
);

-- 9. Quiz Attempts
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content_id UUID NOT NULL REFERENCES public.contents(id),
  score NUMERIC(5,2) NOT NULL,
  answers JSONB,
  passed BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 11. Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  enrollment_id UUID REFERENCES public.enrollments(id),
  issued_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 12. Wishlists
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 13. Course Approvals
CREATE TABLE public.course_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  admin_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Orders (Payment)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  amount INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired')),
  payment_method TEXT,
  payment_id TEXT,
  snap_token TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. FAQ Categories
CREATE TABLE public.faq_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0
);

-- 16. FAQ Items
CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INT REFERENCES public.faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ========== AUTO-CREATE PROFILE ON SIGNUP ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    'customer'  -- Default role: semua user baru = customer
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ========== ROW LEVEL SECURITY (RLS) ==========

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES POLICIES =====
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- ===== CATEGORIES POLICIES =====
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admin can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- ===== COURSES POLICIES =====
CREATE POLICY "Published courses are viewable by everyone" ON public.courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Dosen can view own courses (any status)" ON public.courses
  FOR SELECT USING (auth.uid() = instructor_id);

CREATE POLICY "Admin can view all courses" ON public.courses
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Dosen can create courses" ON public.courses
  FOR INSERT WITH CHECK (
    auth.uid() = instructor_id AND public.is_dosen()
  );

CREATE POLICY "Dosen can update own courses" ON public.courses
  FOR UPDATE USING (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Dosen can delete own draft courses" ON public.courses
  FOR DELETE USING (auth.uid() = instructor_id AND status = 'draft');

CREATE POLICY "Admin can update any course" ON public.courses
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin can delete any course" ON public.courses
  FOR DELETE USING (public.is_admin());

-- ===== CHAPTERS POLICIES =====
CREATE POLICY "Chapters viewable if course is viewable" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND (c.status = 'published' OR c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Dosen can manage chapters of own courses" ON public.chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage any chapter" ON public.chapters
  FOR ALL USING (public.is_admin());

-- ===== CONTENTS POLICIES =====
CREATE POLICY "Contents viewable if chapter is viewable" ON public.contents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chapters ch
      JOIN public.courses c ON c.id = ch.course_id
      WHERE ch.id = chapter_id
      AND (c.status = 'published' OR c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Dosen can manage contents of own courses" ON public.contents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chapters ch
      JOIN public.courses c ON c.id = ch.course_id
      WHERE ch.id = chapter_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage any content" ON public.contents
  FOR ALL USING (public.is_admin());

-- ===== QUIZ QUESTIONS POLICIES =====
CREATE POLICY "Quiz questions viewable with content" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contents ct
      JOIN public.chapters ch ON ch.id = ct.chapter_id
      JOIN public.courses c ON c.id = ch.course_id
      WHERE ct.id = content_id
      AND (c.status = 'published' OR c.instructor_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Dosen can manage quiz questions of own courses" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.contents ct
      JOIN public.chapters ch ON ch.id = ct.chapter_id
      JOIN public.courses c ON c.id = ch.course_id
      WHERE ct.id = content_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage any quiz question" ON public.quiz_questions
  FOR ALL USING (public.is_admin());

-- ===== ENROLLMENTS POLICIES =====
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Dosen can view enrollments of own courses" ON public.enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

CREATE POLICY "Admin can view all enrollments" ON public.enrollments
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can enroll themselves" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollment" ON public.enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- ===== CONTENT PROGRESS POLICIES =====
CREATE POLICY "Users can view own progress" ON public.content_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON public.content_progress
  FOR ALL USING (auth.uid() = user_id);

-- ===== QUIZ ATTEMPTS POLICIES =====
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dosen can view attempts on own courses" ON public.quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contents ct
      JOIN public.chapters ch ON ch.id = ct.chapter_id
      JOIN public.courses c ON c.id = ch.course_id
      WHERE ct.id = content_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (public.is_admin());

-- ===== REVIEWS POLICIES =====
CREATE POLICY "Approved reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all reviews" ON public.reviews
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can create reviews for enrolled courses" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = course_id)
  );

CREATE POLICY "Users can update own pending reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admin can update any review" ON public.reviews
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin can delete any review" ON public.reviews
  FOR DELETE USING (public.is_admin());

-- ===== CERTIFICATES POLICIES =====
CREATE POLICY "Certificates are viewable by everyone (for verification)" ON public.certificates
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can claim own certificates" ON public.certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== WISHLISTS POLICIES =====
CREATE POLICY "Users can view own wishlist" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- ===== COURSE APPROVALS POLICIES =====
CREATE POLICY "Admin can manage all approvals" ON public.course_approvals
  FOR ALL USING (public.is_admin());

CREATE POLICY "Dosen can view approvals of own courses" ON public.course_approvals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid())
  );

-- ===== ORDERS POLICIES =====
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin());

-- ===== FAQ POLICIES =====
CREATE POLICY "FAQ categories viewable by everyone" ON public.faq_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Admin can manage FAQ categories" ON public.faq_categories
  FOR ALL USING (public.is_admin());

CREATE POLICY "Published FAQ items viewable by everyone" ON public.faq_items
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admin can view all FAQ items" ON public.faq_items
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin can manage FAQ items" ON public.faq_items
  FOR ALL USING (public.is_admin());


-- ========== SEED DATA ==========

-- Default categories
INSERT INTO public.categories (name, icon, sort_order) VALUES
  ('Web Development', 'Globe', 1),
  ('Programming', 'Code', 2),
  ('Design', 'Palette', 3),
  ('Data Science', 'BarChart2', 4),
  ('Marketing', 'Megaphone', 5),
  ('Business', 'Briefcase', 6);

-- Default FAQ categories
INSERT INTO public.faq_categories (name, sort_order) VALUES
  ('General', 1),
  ('Courses', 2),
  ('Payment', 3),
  ('Certificates', 4),
  ('Technical', 5);

-- Default FAQ items
INSERT INTO public.faq_items (category_id, question, answer, sort_order) VALUES
  (1, 'Apa itu ITERA Course?', 'ITERA Course adalah platform pembelajaran online yang menyediakan kursus berkualitas dari dosen-dosen berpengalaman.', 1),
  (1, 'Bagaimana cara mendaftar?', 'Anda dapat mendaftar dengan mengklik tombol "Register" dan menggunakan akun Google atau email.', 2),
  (2, 'Apakah ada kursus gratis?', 'Ya! Kami menyediakan banyak kursus gratis yang bisa Anda akses setelah mendaftar.', 1),
  (3, 'Metode pembayaran apa saja yang tersedia?', 'Saat ini kami mendukung pembayaran melalui transfer bank, e-wallet, dan kartu kredit.', 1),
  (4, 'Bagaimana cara mendapatkan sertifikat?', 'Selesaikan semua materi dan lulus semua kuis dengan skor minimal 80% untuk mendapatkan sertifikat.', 1);


-- ========== INDEXES FOR PERFORMANCE ==========
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_category ON public.courses(category_id);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_chapters_course ON public.chapters(course_id);
CREATE INDEX idx_contents_chapter ON public.contents(chapter_id);
CREATE INDEX idx_quiz_questions_content ON public.quiz_questions(content_id);
CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_content_progress_user ON public.content_progress(user_id);
CREATE INDEX idx_reviews_course ON public.reviews(course_id);
CREATE INDEX idx_certificates_code ON public.certificates(code);
CREATE INDEX idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);


-- ========== UPDATED_AT TRIGGER ==========
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
