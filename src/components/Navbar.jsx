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
        if (user.avatar_url) return null; // Will use img tag
        return (user.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        {isHomePage ? <BookOpen size={24} /> : <ArrowLeft size={24} />}
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
                                        {user.avatar_url ? <img src={user.avatar_url} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : getAvatarInitials()}
                                    </div>
                                    <span className="profile-name">{user.full_name}</span>
                                    <ChevronDown size={16} />
                                </button>

                                {isProfileOpen && (
                                    <div className="dropdown-menu">
                                        <div className="dropdown-header">
                                            <div className="avatar-lg">
                                                {user.avatar_url ? <img src={user.avatar_url} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : getAvatarInitials()}
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
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/register" className="btn btn-primary">Sign Up</Link>
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
