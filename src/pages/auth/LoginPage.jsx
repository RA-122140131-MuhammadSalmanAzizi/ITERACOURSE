import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Check, Sun, Moon, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './AuthPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { loginWithGoogle, isAuthenticated, profile, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // If already authenticated and profile loaded, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated && profile && !loading) {
            const redirectMap = {
                admin: '/admin',
                dosen: '/dosen',
                customer: '/customer/dashboard',
            };
            navigate(redirectMap[profile.role] || '/', { replace: true });
        }
    }, [isAuthenticated, profile, loading, navigate]);

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);

        const result = await loginWithGoogle();

        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
        }
        // If success, Supabase will redirect to OAuth provider
        // The auth state change listener will handle the rest
    };

    // Show loading while checking auth state
    if (loading) {
        return (
            <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <Link to="/" className="auth-logo" style={{ marginBottom: 0 }}>
                            <div className="logo-icon">
                                <BookOpen size={24} />
                            </div>
                            <span>ITERA Course</span>
                        </Link>
                        <button
                            onClick={toggleTheme}
                            type="button"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>

                    <div className="auth-header">
                        <h1>Selamat Datang</h1>
                        <p>Masuk untuk melanjutkan perjalanan belajar Anda</p>
                    </div>

                    {error && (
                        <div className="auth-error" style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444', fontSize: '0.9rem',
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Google Sign-In Button - Primary and only auth method */}
                    <button
                        type="button"
                        className="btn btn-primary btn-lg w-full"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24">
                            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isLoading ? 'Mengarahkan...' : 'Masuk dengan Google'}
                    </button>

                    <div style={{
                        textAlign: 'center', padding: '1rem',
                        background: 'var(--bg-secondary)', borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                    }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                            Gunakan akun Google untuk masuk atau membuat akun baru secara otomatis.
                        </p>
                    </div>
                </div>
            </div>

            <div className="auth-visual">
                <div className="visual-content">
                    <h2>Platform Pembelajaran ITERA</h2>
                    <p>Akses kursus berkualitas dari dosen-dosen berpengalaman ITERA.</p>
                    <div className="visual-features">
                        <div className="feature"><Check size={16} /> Kursus Gratis</div>
                        <div className="feature"><Check size={16} /> Dosen Berpengalaman</div>
                        <div className="feature"><Check size={16} /> Sertifikat Digital</div>
                        <div className="feature"><Check size={16} /> Belajar Kapan Saja</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
