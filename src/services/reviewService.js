import { supabase } from '../lib/supabase';

/**
 * Review Service
 */

// ===== CREATE REVIEW =====
export async function createReview(userId, courseId, rating, comment) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      course_id: courseId,
      rating,
      comment,
      status: 'pending', // Always pending, admin must approve
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Anda sudah memberikan review untuk kursus ini.');
    }
    throw error;
  }
  return data;
}

// ===== GET APPROVED REVIEWS FOR COURSE =====
export async function getCourseReviews(courseId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles!reviews_user_id_fkey(id, full_name, avatar_url)
    `)
    .eq('course_id', courseId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== GET USER'S REVIEWS =====
export async function getUserReviews(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      course:courses(id, title, thumbnail_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== GET ALL REVIEWS (ADMIN) =====
export async function getAllReviews(status = null) {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      user:profiles!reviews_user_id_fkey(id, full_name, avatar_url, email),
      course:courses(id, title)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ===== APPROVE REVIEW (ADMIN) =====
export async function approveReview(reviewId) {
  const { data, error } = await supabase
    .from('reviews')
    .update({ status: 'approved' })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== REJECT REVIEW (ADMIN) =====
export async function rejectReview(reviewId) {
  const { data, error } = await supabase
    .from('reviews')
    .update({ status: 'rejected' })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== DELETE REVIEW (ADMIN) =====
export async function deleteReview(reviewId) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}
