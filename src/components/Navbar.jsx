import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    Menu, X, BookOpen, Award, User, LogOut,
    ChevronDown, ArrowLeft, Sun, Moon, HelpCircle, Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
    const { profile, user: authUser, logout, isAuthenticated } = useAuth();
    // Use profile data if available, otherwise build a fallback from auth user metadata
    const user = profile || (authUser ? {
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        role: null,
        email: authUser.email,
    } : null);
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showThemeToast, setShowThemeToast] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isHomePage = location.pathname === '/';

    // Show theme toast on first visit to homepage
    useEffect(() => {
        if (isHomePage) {
            const hasSeenToast = localStorage.getItem('hasSeenThemeToast');
            if (!hasSeenToast) {
                // Show toast after a short delay
                const timer = setTimeout(() => {
                    setShowThemeToast(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [isHomePage]);

    // Auto-dismiss toast after 8 seconds
    useEffect(() => {
        if (showThemeToast) {
            const timer = setTimeout(() => {
                dismissThemeToast();
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [showThemeToast]);

    const dismissThemeToast = () => {
        setShowThemeToast(false);
        localStorage.setItem('hasSeenThemeToast', 'true');
    };

    const handleThemeToggle = () => {
        toggleTheme();
        if (showThemeToast) {
            dismissThemeToast();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getDashboardLink = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'admin': return '/admin';
            case 'dosen': return '/dosen';
            default: return '/customer/dashboard';
        }
    };

    const getAvatarInitials = () => {
        if (!user) return '?';
        return (user.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon" style={{ background: 'transparent' }}>
                        <img src="/Logo_ITERA.png" alt="ITERA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span className="logo-text">{isHomePage ? 'ITERA Course' : 'Back to Site'}</span>
                </Link>

                <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/courses" className="nav-link">Courses</Link>
                    <Link to="/faq" className="nav-link">FAQ</Link>
                    {isHomePage && (
                        <button
                            className="nav-link"
                            onClick={() => {
                                const section = document.getElementById('why-section');
                                if (section) {
                                    section.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Why Us
                        </button>
                    )}
                </div>

                <div className="navbar-actions">
                    {/* Theme Toggle Button with Toast */}
                    <div className="theme-toggle-wrapper">
                        <button
                            className="theme-toggle-btn"
                            onClick={handleThemeToggle}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            style={{ marginRight: user ? '0.5rem' : '0' }}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Theme Toast Notification */}
                        {showThemeToast && (
                            <div className="theme-toast">
                                <div className="theme-toast-content">
                                    <span className="theme-toast-icon">
                                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                    </span>
                                    <p>Klik tombol ini untuk beralih ke mode {theme === 'dark' ? 'terang' : 'gelap'}!</p>
                                </div>
                                <button className="theme-toast-close" onClick={dismissThemeToast}>×</button>
                                <div className="theme-toast-arrow"></div>
                            </div>
                        )}
                    </div>

                    {isAuthenticated && user ? (
                        <>
                            <Link to={getDashboardLink()} className="btn btn-ghost dashboard-nav-btn" style={{ color: 'var(--primary-500)' }}>
                                Dashboard
                            </Link>
                            <div className="profile-dropdown">
                                <button
                                    className="profile-trigger"
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    <div className="avatar">
                                        {user.avatar_url && !imgError ? <img src={user.avatar_url} alt="" onError={() => setImgError(true)} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : getAvatarInitials()}
                                    </div>
                                    <span className="profile-name">{user.full_name}</span>
                                    <ChevronDown size={16} />
                                </button>

                                {isProfileOpen && (
                                    <div className="dropdown-menu">
                                        <div className="dropdown-header">
                                            <div className="avatar-lg">
                                                {user.avatar_url && !imgError ? <img src={user.avatar_url} alt="" onError={() => setImgError(true)} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : getAvatarInitials()}
                                            </div>
                                            <div>
                                                <p className="dropdown-name">{user.full_name}</p>
                                                <p className="dropdown-role">{user.role}</p>
                                            </div>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to="/profile" className="dropdown-item">
                                            <User size={16} />
                                            Profile
                                        </Link>
                                        {user.role === 'customer' && (
                                            <Link to="/my-certificates" className="dropdown-item">
                                                <Award size={16} />
                                                My Certificates
                                            </Link>
                                        )}
                                        <Link to="/notifications" className="dropdown-item">
                                            <Bell size={16} />
                                            Notifikasi
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button onClick={handleLogout} className="dropdown-item logout">
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Login
                            </Link>
                        </div>
                    )}

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
