import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, MessageSquare,
    Award, LogOut, Eye, Sun, Moon, ClipboardList, Heart, ShoppingBag, Menu, X, Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import '../pages/admin/AdminPages.css'; // Reuse admin styles for consistency

const CustomerSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { unreadCount } = useNotifications();
    const [imgError, setImgError] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => {
        if (path === '/customer') {
            return location.pathname === '/customer';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
                <Menu size={24} />
            </button>
            <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={() => setIsOpen(false)} />
            
            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`} style={{ backgroundColor: 'var(--bg-secondary)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div className="sidebar-header-fixed" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div className="sidebar-logo" style={{ marginBottom: 0 }}>
                            <LayoutDashboard size={24} />
                            <span>Student Panel</span>
                        </div>
                        {isOpen && (
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }} className="close-sidebar-mobile">
                                <X size={24} />
                            </button>
                        )}
                    </div>

                <Link to="/customer/profile" className="sidebar-profile">
                    <div className="profile-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {profile?.avatar_url && !imgError ? (
                            <img 
                                src={profile.avatar_url} 
                                alt="" 
                                onError={() => setImgError(true)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            (profile?.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        )}
                    </div>
                    <div className="profile-info">
                        <span
                            className="profile-name"
                            style={{
                                fontSize: (profile?.full_name?.length || 0) > 20 ? '0.75rem' : (profile?.full_name?.length || 0) > 15 ? '0.8rem' : '0.875rem'
                            }}
                        >
                            {profile?.full_name || 'Student'}
                        </span>
                        <span className="profile-role">Student</span>
                    </div>
                </Link>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <Link to="/customer/dashboard" className={`nav-item ${isActive('/customer/dashboard') ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    Dashboard
                </Link>
                <Link to="/customer/notifications" className={`nav-item ${isActive('/customer/notifications') ? 'active' : ''}`} style={{ position: 'relative' }}>
                    <Bell size={20} />
                    Notifikasi
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            minWidth: '18px',
                            height: '18px',
                            borderRadius: '9px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                            lineHeight: 1,
                        }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>
                <Link to="/customer/courses" className={`nav-item ${isActive('/customer/courses') ? 'active' : ''}`}>
                    <BookOpen size={20} />
                    Enrolled Courses
                </Link>
                <Link to="/customer/certificates" className={`nav-item ${isActive('/customer/certificates') ? 'active' : ''}`}>
                    <Award size={20} />
                    My Certificates
                </Link>
                <Link to="/customer/reviews" className={`nav-item ${isActive('/customer/reviews') ? 'active' : ''}`}>
                    <MessageSquare size={20} />
                    My Reviews
                </Link>
                <Link to="/customer/quiz-history" className={`nav-item ${isActive('/customer/quiz-history') ? 'active' : ''}`}>
                    <ClipboardList size={20} />
                    History Quiz
                </Link>
                <Link to="/customer/wishlist" className={`nav-item ${isActive('/customer/wishlist') ? 'active' : ''}`}>
                    <Heart size={20} />
                    Wishlist
                </Link>
                {/* Order History - hidden for now
                <Link to="/customer/orders" className={`nav-item ${isActive('/customer/orders') ? 'active' : ''}`}>
                    <ShoppingBag size={20} />
                    Order History
                </Link>
                */}
            </nav>

            <div className="sidebar-footer" style={{ flexShrink: 0 }}>
                <button className="nav-item theme-toggle" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <Link to="/" className="nav-item">
                    <Eye size={20} />
                    View Site
                </Link>
                <button className="nav-item logout" onClick={handleLogout}>
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </aside>
        </>
    );
};

export default CustomerSidebar;
