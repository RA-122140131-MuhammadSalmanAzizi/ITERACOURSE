import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute - Server-validated RBAC route guard
 * 
 * Features:
 * - Redirects to login if not authenticated
 * - Checks role-based access
 * - Checks if account is active (not banned/deactivated)
 * - Shows loading state while checking auth (with timeout failsafe)
 */
const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { isAuthenticated, profile, loading, hasRole, can, isActive, fetchProfile, user, logout } = useAuth();
  const location = useLocation();
  const [profileTimeout, setProfileTimeout] = useState(false);

  // Failsafe: if profile doesn't load within 3 seconds, stop waiting
  useEffect(() => {
    if (isAuthenticated && !profile && !loading) {
      const timer = setTimeout(() => {
        setProfileTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (profile) {
      setProfileTimeout(false);
    }
  }, [isAuthenticated, profile, loading]);

  // Still loading auth state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-color)',
            borderTop: '3px solid var(--primary-500)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but profile not yet loaded → show loading with retry + timeout
  if (!profile) {
    if (profileTimeout) {
      // Profile failed to load — show recovery options
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
            <div style={{
              width: '60px', height: '60px',
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', fontSize: '1.5rem',
            }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Gagal memuat profil</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Sesi mungkin sudah kedaluwarsa. Coba muat ulang atau login kembali.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setProfileTimeout(false);
                  if (user) fetchProfile(user.id, 3);
                }}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px',
                  background: 'var(--primary-500)', color: 'white',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Coba Lagi
              </button>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = window.location.origin + (import.meta.env.BASE_URL || '/');
                }}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px',
                  background: '#ef4444', color: 'white',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Logout & Login Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-color)',
            borderTop: '3px solid var(--primary-500)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p>Memuat profil...</p>
        </div>
      </div>
    );
  }

  // Account deactivated → redirect to home
  if (!isActive) {
    return <Navigate to="/" replace />;
  }

  // Check role-based access
  if (allowedRoles && !hasRole(allowedRoles)) {
    // Redirect to user's dashboard based on role
    const redirectMap = {
      admin: '/admin',
      dosen: '/dosen',
      customer: '/customer/dashboard',
    };
    const redirectTo = redirectMap[profile?.role] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  // Check specific permission
  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
