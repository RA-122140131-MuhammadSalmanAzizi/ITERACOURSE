import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, BookOpen, ArrowRight, User, Check, Sun, Moon, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './AuthPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, loginWithGoogle, isAuthenticated, profile, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // If already authenticated and profile loaded, redirect
    useEffect(() => {
        if (isAuthenticated && profile && !loading) {
            const redirectMap = {
                admin: '/admin',
                dosen: '/dosen',
                customer: '/customer/dashboard',
            };
            navigate(redirectMap[profile.role] || '/customer/dashboard', { replace: true });
        }
    }, [isAuthenticated, profile, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (password.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Password tidak cocok.');
            return;
        }

        if (name.trim().length < 2) {
            setError('Nama harus minimal 2 karakter.');
            return;
        }

        setIsLoading(true);

        const result = await register(name.trim(), email, password);

        if (result.success) {
            if (result.requiresConfirmation) {
                setSuccess(result.message);
            } else {
                navigate('/customer/dashboard');
            }
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    };

    const handleGoogleRegister = async () => {
        setError('');
        setIsLoading(true);

        const result = await loginWithGoogle();

        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = () => {
        if (!password) return { level: 0, text: '', color: '' };
        if (password.length < 6) return { level: 1, text: 'Terlalu pendek', color: '#ef4444' };
        if (password.length < 8) return { level: 2, text: 'Lemah', color: '#f59e0b' };
        if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { level: 4, text: 'Kuat', color: '#22c55e' };
        return { level: 3, text: 'Cukup', color: '#3b82f6' };
    };

    const passwordStrength = getPasswordStrength();

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
                        <h1>Create Account</h1>
                        <p>Join ITERA Course and start learning today</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="auth-success" style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#22c55e',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                        }}>
                            <CheckCircle size={16} />
                            {success}
                        </div>
                    )}

                    {/* Google Sign-Up Button */}
                    <button
                        type="button"
                        className="btn btn-secondary btn-lg w-full"
                        onClick={handleGoogleRegister}
                        disabled={isLoading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            marginBottom: '1.5rem',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isLoading ? 'Redirecting...' : 'Continue with Google'}
                    </button>

                    <div className="auth-divider">
                        <span>or register with email</span>
                    </div>

                    {!success && (
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <div className="input-with-icon">
                                    <User size={18} />
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-with-icon">
                                    <Mail size={18} />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a password (min 6 characters)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                                {password && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <div style={{
                                            height: '4px',
                                            borderRadius: '2px',
                                            background: 'var(--border-color)',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${passwordStrength.level * 25}%`,
                                                background: passwordStrength.color,
                                                transition: 'all 0.3s ease',
                                            }} />
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: passwordStrength.color,
                                            marginTop: '0.25rem',
                                            display: 'block',
                                        }}>
                                            {passwordStrength.text}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Confirm Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                                        Password tidak cocok
                                    </span>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}>
                                {isLoading ? 'Creating account...' : 'Create Account'}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    )}

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>

            <div className="auth-visual">
                <div className="visual-content">
                    <h2>Join Our Community</h2>
                    <p>Create your account and start learning from the best instructors.</p>
                    <div className="visual-features">
                        <div className="feature"><Check size={16} /> Free courses available</div>
                        <div className="feature"><Check size={16} /> Learn at your own pace</div>
                        <div className="feature"><Check size={16} /> Earn certificates</div>
                        <div className="feature"><Check size={16} /> Expert support</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
