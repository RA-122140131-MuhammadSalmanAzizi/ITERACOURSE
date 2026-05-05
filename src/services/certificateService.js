import { supabase } from '../lib/supabase';

/**
 * Certificate Service
 */

// ===== GENERATE CERTIFICATE CODE =====
function generateCertCode() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${random}-${year}`;
}

// ===== CLAIM CERTIFICATE =====
export async function claimCertificate(userId, courseId, enrollmentId) {
  const code = generateCertCode();

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      code,
      user_id: userId,
      course_id: courseId,
      enrollment_id: enrollmentId,
    })
    .select(`
      *,
      user:profiles!certificates_user_id_fkey(id, full_name, email),
      course:courses(id, title, instructor:profiles!courses_instructor_id_fkey(full_name))
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Sertifikat untuk kursus ini sudah pernah diklaim.');
    }
    throw error;
  }
  return data;
}

// ===== GET USER'S CERTIFICATES =====
export async function getUserCertificates(userId) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      course:courses(id, title, thumbnail_url, instructor:profiles!courses_instructor_id_fkey(full_name))
    `)
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== VERIFY CERTIFICATE BY CODE =====
export async function verifyCertificate(code) {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      user:profiles!certificates_user_id_fkey(id, full_name),
      course:courses(id, title)
    `)
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();

  if (error) throw error;
  return data; // null if not found
}

// ===== GET ALL CERTIFICATES (ADMIN) =====
export async function getAllCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      user:profiles!certificates_user_id_fkey(id, full_name, email),
      course:courses(id, title)
    `)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data;
}
