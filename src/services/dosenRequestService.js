import { supabase } from '../lib/supabase';

/**
 * Dosen Request Service
 * Handles dosen role upgrade requests and admin approval
 */

// ===== CHECK IF USER HAS ELIGIBLE EMAIL =====
export function isEligibleForDosen(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  // Must be itera.ac.id domain but NOT student subdomain
  const isItera = lower.endsWith('.itera.ac.id') || lower.endsWith('@itera.ac.id');
  const isStudent = lower.includes('@student.itera.ac.id');
  return isItera && !isStudent;
}

// ===== GET USER'S DOSEN REQUEST =====
export async function getMyDosenRequest(userId) {
  const { data, error } = await supabase
    .from('dosen_requests')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data; // null if no request exists
}

// ===== SUBMIT DOSEN REQUEST =====
export async function submitDosenRequest({ userId, email, fullName, reason, department, staffId }) {
  const { data, error } = await supabase
    .from('dosen_requests')
    .insert({
      user_id: userId,
      email,
      full_name: fullName,
      reason,
      department,
      staff_id: staffId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== UPDATE DOSEN REQUEST (user can update pending) =====
export async function updateDosenRequest(requestId, updates) {
  const { data, error } = await supabase
    .from('dosen_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== ADMIN: GET ALL DOSEN REQUESTS =====
export async function getAllDosenRequests(statusFilter = null) {
  let query = supabase
    .from('dosen_requests')
    .select('*, profiles:user_id(avatar_url)')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ===== ADMIN: APPROVE DOSEN REQUEST =====
export async function approveDosenRequest(requestId, adminId, adminNotes = '') {
  // 1. Update the request status
  const { data: request, error: reqError } = await supabase
    .from('dosen_requests')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq('id', requestId)
    .select()
    .single();

  if (reqError) throw reqError;

  // 2. Update the user's role to dosen
  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'dosen' })
    .eq('id', request.user_id);

  if (roleError) throw roleError;

  return request;
}

// ===== ADMIN: REJECT DOSEN REQUEST =====
export async function rejectDosenRequest(requestId, adminId, adminNotes = '') {
  const { data, error } = await supabase
    .from('dosen_requests')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== ADMIN: GET PENDING COUNT =====
export async function getPendingDosenRequestCount() {
  const { count, error } = await supabase
    .from('dosen_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}
