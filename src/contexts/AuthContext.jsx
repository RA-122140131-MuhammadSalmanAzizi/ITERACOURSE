import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);       // Supabase auth user
  const [profile, setProfile] = useState(null);  // profiles table data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== ROLE HELPERS =====
  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isDosen = role === 'dosen';
  const isCustomer = role === 'customer';
  const isAuthenticated = !!session;
  const isActive = profile?.is_active !== false;

  // ===== FETCH PROFILE WITH RETRY =====
  // After Google OAuth, the trigger may need a moment to create the profile.
  // We retry a few times with short delays.
  const fetchProfile = useCallback(async (userId, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await authService.getProfile(userId);
        if (data) {
          setProfile(data);
          return data;
        }
      } catch (err) {
        // Profile not found yet - this is expected right after OAuth signup
        console.warn(`Profile fetch attempt ${attempt + 1}/${retries + 1}:`, err.message);
      }

      // Wait before retrying (short delays: 300ms, 600ms)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }

    // All retries exhausted - profile still not found
    console.error('Could not fetch profile after retries for user:', userId);
    setProfile(null);
    return null;
  }, []);

  // ===== INITIALIZE AUTH =====
  useEffect(() => {
    let mounted = true;
    let initDone = false;

    const initAuth = async () => {
      // Failsafe: force loading to false after 3 seconds no matter what
      const timeoutId = setTimeout(() => {
        if (mounted && !initDone) {
          console.warn('[Auth] Failsafe: forcing loading=false after 3s');
          initDone = true;
          setLoading(false);
        }
      }, 3000);

      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth] getSession error:', sessionError);
          // Session is corrupted — clear it and let user re-login
          await supabase.auth.signOut().catch(() => {});
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);

          if (currentSession?.user) {
            // Don't let fetchProfile block the UI — use a timeout wrapper
            try {
              await Promise.race([
                fetchProfile(currentSession.user.id),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 2500))
              ]);
            } catch (profileErr) {
              console.warn('[Auth] Profile fetch failed/timeout during init:', profileErr.message);
              // App will still work — ProtectedRoute will handle missing profile
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
        // If anything goes wrong, try to clean up gracefully
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        clearTimeout(timeoutId);
        if (mounted) {
          initDone = true;
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    // IMPORTANT: Do NOT await async operations here — it blocks the listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user || null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Fire and forget — don't block the listener
          fetchProfile(newSession.user.id, 3).catch(err => {
            console.warn('[Auth] Profile fetch in listener failed:', err.message);
          });
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ===== LOGIN WITH EMAIL =====
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authService.signInWithEmail(email, password);

      // Check if account is active
      const profileData = await authService.getProfile(data.user.id);
      if (!profileData.is_active) {
        await authService.signOut();
        throw new Error('Akun Anda telah dinonaktifkan. Hubungi admin.');
      }

      setProfile(profileData);
      return { success: true, user: data.user, profile: profileData };
    } catch (err) {
      const errorMsg = err.message === 'Invalid login credentials'
        ? 'Email atau password salah'
        : err.message;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // ===== REGISTER WITH EMAIL =====
  const register = async (fullName, email, password) => {
    setError(null);
    try {
      const data = await authService.signUpWithEmail(email, password, fullName);

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return {
          success: true,
          requiresConfirmation: true,
          message: 'Silakan cek email Anda untuk konfirmasi akun.',
        };
      }

      return { success: true, user: data.user };
    } catch (err) {
      let errorMsg = err.message;
      if (err.message.includes('already registered')) {
        errorMsg = 'Email sudah terdaftar. Silakan login.';
      }
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // ===== LOGIN WITH GOOGLE =====
  const loginWithGoogle = async () => {
    setError(null);
    try {
      const data = await authService.signInWithGoogle();
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ===== LOGOUT =====
  const logout = async () => {
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ===== UPDATE PROFILE =====
  const updateUserProfile = async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const data = await authService.updateProfile(user.id, updates);
      setProfile(data);
      return { success: true, profile: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ===== RBAC: CHECK PERMISSION =====
  const hasRole = (requiredRole) => {
    if (!profile) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(profile.role);
    }
    return profile.role === requiredRole;
  };

  // ===== RBAC: CHECK IF USER CAN PERFORM ACTION =====
  const can = (action, resource = null) => {
    if (!profile || !isActive) return false;

    const permissions = {
      // Course permissions
      'create:course': isDosen,
      'edit:course': isDosen || isAdmin,
      'delete:course': isDosen || isAdmin,
      'publish:course': isAdmin,
      'approve:course': isAdmin,

      // User management
      'manage:users': isAdmin,
      'change:role': isAdmin,
      'deactivate:user': isAdmin,

      // Review management
      'write:review': isCustomer,
      'approve:review': isAdmin,
      'delete:review': isAdmin,

      // Enrollment
      'enroll:course': isCustomer,
      'view:progress': isCustomer || isDosen || isAdmin,

      // Certificate
      'claim:certificate': isCustomer,
      'verify:certificate': true, // Anyone

      // FAQ
      'manage:faq': isAdmin,

      // Settings
      'manage:settings': isAdmin,
      'manage:categories': isAdmin,

      // Orders
      'create:order': isCustomer,
      'view:orders': isCustomer || isAdmin,
    };

    return permissions[action] ?? false;
  };

  const value = {
    // State
    session,
    user,
    profile,
    loading,
    error,

    // Role helpers
    role,
    isAdmin,
    isDosen,
    isCustomer,
    isAuthenticated,
    isActive,

    // Actions
    login,
    register,
    loginWithGoogle,
    logout,
    updateUserProfile,
    fetchProfile,

    // RBAC
    hasRole,
    can,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
