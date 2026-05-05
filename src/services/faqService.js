import { supabase } from '../lib/supabase';

/**
 * FAQ Service
 */

// ===== GET PUBLISHED FAQ =====
export async function getPublishedFAQ() {
  const { data: categories, error: catError } = await supabase
    .from('faq_categories')
    .select('*')
    .order('sort_order');

  if (catError) throw catError;

  const { data: items, error: itemError } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_published', true)
    .order('sort_order');

  if (itemError) throw itemError;

  // Group items by category
  return categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id),
  }));
}

// ===== GET ALL FAQ (ADMIN) =====
export async function getAllFAQ() {
  const { data: categories, error: catError } = await supabase
    .from('faq_categories')
    .select('*')
    .order('sort_order');

  if (catError) throw catError;

  const { data: items, error: itemError } = await supabase
    .from('faq_items')
    .select('*')
    .order('sort_order');

  if (itemError) throw itemError;

  return categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id),
  }));
}

// ===== CREATE FAQ ITEM =====
export async function createFAQItem(categoryId, question, answer) {
  const { data, error } = await supabase
    .from('faq_items')
    .insert({ category_id: categoryId, question, answer })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== UPDATE FAQ ITEM =====
export async function updateFAQItem(itemId, updates) {
  const { data, error } = await supabase
    .from('faq_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== DELETE FAQ ITEM =====
export async function deleteFAQItem(itemId) {
  const { error } = await supabase
    .from('faq_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

// ===== CREATE FAQ CATEGORY =====
export async function createFAQCategory(name) {
  const { data, error } = await supabase
    .from('faq_categories')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== DELETE FAQ CATEGORY =====
export async function deleteFAQCategory(categoryId) {
  const { error } = await supabase
    .from('faq_categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
}
