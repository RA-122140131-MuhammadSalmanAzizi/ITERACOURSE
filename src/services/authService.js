import { supabase } from '../lib/supabase';

/**
 * Authentication Service
 * Handles all auth operations via Supabase
 */

// ===== SIGN UP (Email + Password) =====
export async function signUpWithEmail(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      // Redirect after email confirmation
      emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
    },
  });

  if (error) throw error;
  return data;
}

// ===== SIGN IN (Email + Password) =====
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// ===== SIGN IN WITH GOOGLE =====
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

// ===== SIGN OUT =====
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ===== GET CURRENT SESSION =====
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ===== GET USER PROFILE =====
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ===== UPDATE PROFILE =====
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== PASSWORD RESET =====
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/reset-password`,
  });

  if (error) throw error;
  return data;
}

// ===== UPDATE PASSWORD =====
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

// ===== ADMIN: GET ALL USERS =====
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ===== ADMIN: UPDATE USER ROLE =====
export async function updateUserRole(userId, newRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== ADMIN: TOGGLE USER ACTIVE STATUS =====
export async function toggleUserActive(userId, isActive) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===== LISTEN TO AUTH STATE CHANGES =====
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
