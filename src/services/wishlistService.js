import { supabase } from '../lib/supabase';

/**
 * Wishlist Service
 */

export async function addToWishlist(userId, courseId) {
  const { data, error } = await supabase
    .from('wishlists')
    .insert({ user_id: userId, course_id: courseId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return null; // Already in wishlist
    throw error;
  }
  return data;
}

export async function removeFromWishlist(userId, courseId) {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) throw error;
}

export async function getUserWishlist(userId) {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      course:courses(
        *,
        instructor:profiles!courses_instructor_id_fkey(id, full_name, avatar_url),
        category:categories!courses_category_id_fkey(id, name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function isInWishlist(userId, courseId) {
  const { data, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
