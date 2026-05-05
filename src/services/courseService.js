import { supabase } from '../lib/supabase';

/**
 * Course Service
 * All course-related database operations
 */

// ===== GET ALL PUBLISHED COURSES =====
export async function getPublishedCourses({ category, level, search, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey(id, full_name, avatar_url),
      category:categories!courses_category_id_fkey(id, name, icon)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category_id', category);
  }

  if (level) {
    query = query.eq('level', level);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

// ===== GET SINGLE COURSE WITH CHAPTERS + CONTENTS =====
export async function getCourseById(courseId) {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey(id, full_name, avatar_url, bio, institution),
      category:categories!courses_category_id_fkey(id, name, icon)
    `)
    .eq('id', courseId)
    .single();

  if (courseError) throw courseError;

  // Fetch chapters with contents
  const { data: chapters, error: chapError } = await supabase
    .from('chapters')
    .select(`
      *,
      contents(
        *,
        quiz_questions(*)
      )
    `)
    .eq('course_id', courseId)
    .order('sort_order')
    .order('sort_order', { referencedTable: 'contents' });

  if (chapError) throw chapError;

  return { ...course, chapters: chapters || [] };
}

// ===== GET COURSES BY INSTRUCTOR =====
export async function getCoursesByInstructor(instructorId) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      category:categories!courses_category_id_fkey(id, name)
    `)
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== GET ALL COURSES (ADMIN) =====
export async function getAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey(id, full_name, avatar_url),
      category:categories!courses_category_id_fkey(id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== CREATE COURSE =====
export async function createCourse(courseData) {
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== UPDATE COURSE =====
export async function updateCourse(courseId, updates) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== DELETE COURSE =====
export async function deleteCourse(courseId) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
}

// ===== SUBMIT COURSE FOR APPROVAL =====
export async function submitCourseForApproval(courseId) {
  // Update course status to pending
  const { error: courseError } = await supabase
    .from('courses')
    .update({ status: 'pending' })
    .eq('id', courseId);

  if (courseError) throw courseError;

  // Create approval record
  const { data, error } = await supabase
    .from('course_approvals')
    .insert({ course_id: courseId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== APPROVE/REJECT COURSE (ADMIN) =====
export async function reviewCourseApproval(courseId, approvalId, adminId, status, notes = '') {
  // Update approval record
  const { error: approvalError } = await supabase
    .from('course_approvals')
    .update({
      admin_id: adminId,
      status,
      notes,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', approvalId);

  if (approvalError) throw approvalError;

  // Update course status
  const courseStatus = status === 'approved' ? 'published' : 'rejected';
  const updates = { status: courseStatus };
  if (courseStatus === 'published') {
    updates.published_at = new Date().toISOString();
  }

  const { error: courseError } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId);

  if (courseError) throw courseError;
}


// ===== CHAPTER OPERATIONS =====

export async function createChapter(courseId, title, sortOrder) {
  const { data, error } = await supabase
    .from('chapters')
    .insert({ course_id: courseId, title, sort_order: sortOrder })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChapter(chapterId, updates) {
  const { data, error } = await supabase
    .from('chapters')
    .update(updates)
    .eq('id', chapterId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChapter(chapterId) {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId);

  if (error) throw error;
}


// ===== CONTENT OPERATIONS =====

export async function createContent(chapterId, contentData) {
  const { data, error } = await supabase
    .from('contents')
    .insert({ chapter_id: chapterId, ...contentData })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContent(contentId, updates) {
  const { data, error } = await supabase
    .from('contents')
    .update(updates)
    .eq('id', contentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContent(contentId) {
  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('id', contentId);

  if (error) throw error;
}


// ===== QUIZ QUESTION OPERATIONS =====

export async function createQuizQuestion(contentId, questionData) {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({ content_id: contentId, ...questionData })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuizQuestion(questionId) {
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', questionId);

  if (error) throw error;
}


// ===== CATEGORIES =====

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function createCategory(name, icon) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, icon })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
}


// ===== STATS (ADMIN DASHBOARD) =====

export async function getDashboardStats() {
  const [
    { count: totalStudents },
    { count: totalCourses },
    { count: totalInstructors },
    { count: totalReviews },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalStudents: totalStudents || 0,
    totalCourses: totalCourses || 0,
    totalInstructors: totalInstructors || 0,
    totalReviews: totalReviews || 0,
  };
}
