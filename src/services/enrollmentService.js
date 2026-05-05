import { supabase } from '../lib/supabase';

/**
 * Enrollment Service
 * Handles enrollment, progress tracking, and course completion
 */

// ===== ENROLL IN COURSE =====
export async function enrollInCourse(userId, courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, course_id: courseId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Anda sudah terdaftar di kursus ini.');
    }
    throw error;
  }

  // Increment total_students on course
  await supabase.rpc('increment_course_students', { course_id_input: courseId });

  return data;
}

// ===== CHECK IF ENROLLED =====
export async function checkEnrollment(userId, courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ===== GET USER'S ENROLLMENTS =====
export async function getUserEnrollments(userId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(
        *,
        instructor:profiles!courses_instructor_id_fkey(id, full_name, avatar_url),
        category:categories!courses_category_id_fkey(id, name)
      )
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== MARK CONTENT AS COMPLETED =====
export async function markContentCompleted(userId, contentId) {
  const { data, error } = await supabase
    .from('content_progress')
    .upsert({
      user_id: userId,
      content_id: contentId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== GET CONTENT PROGRESS FOR A COURSE =====
export async function getCourseProgress(userId, courseId) {
  // Get all content IDs for this course
  const { data: chapters, error: chapError } = await supabase
    .from('chapters')
    .select('id, contents(id, is_required)')
    .eq('course_id', courseId);

  if (chapError) throw chapError;

  const allContentIds = chapters.flatMap(ch => ch.contents.map(c => c.id));

  // Get progress for these contents
  const { data: progress, error: progError } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', userId)
    .in('content_id', allContentIds);

  if (progError) throw progError;

  return {
    chapters,
    progress: progress || [],
    completedContentIds: (progress || []).filter(p => p.is_completed).map(p => p.content_id),
  };
}

// ===== SUBMIT QUIZ ATTEMPT =====
export async function submitQuizAttempt(userId, contentId, score, answers) {
  const passed = score >= 80;

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      content_id: contentId,
      score,
      answers,
      passed,
    })
    .select()
    .single();

  if (error) throw error;

  // If passed, mark content as completed
  if (passed) {
    await markContentCompleted(userId, contentId);
  }

  return data;
}

// ===== GET QUIZ ATTEMPTS FOR A CONTENT =====
export async function getQuizAttempts(userId, contentId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .order('attempted_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== GET ALL QUIZ HISTORY FOR USER =====
export async function getUserQuizHistory(userId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      content:contents(
        id, title,
        chapter:chapters(
          id, title,
          course:courses(id, title, thumbnail_url)
        )
      )
    `)
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== COMPLETE COURSE =====
export async function completeCourse(userId, courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== UPDATE ENROLLMENT PROGRESS =====
export async function updateEnrollmentProgress(userId, courseId, progress) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({ progress })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
