import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Settings, Database, Star,
    LogOut, Eye, Sun, Moon, HelpCircle
} from 'lucide-react';
import { useAuth, useTheme } from '../App';
import '../pages/admin/AdminPages.css';

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-logo">
                <LayoutDashboard size={24} />
                <span>Admin Panel</span>
            </div>

            <Link to="/profile" className="sidebar-profile">
                <div className="profile-avatar">
                    {user?.avatar || 'A'}
                </div>
                <div className="profile-info">
                    <span
                        className="profile-name"
                        style={{
                            fontSize: user?.name?.length > 20 ? '0.75rem' : user?.name?.length > 15 ? '0.8rem' : '0.875rem'
                        }}
                    >
                        {user?.name || 'Admin'}
                    </span>
                    <span className="profile-role">Administrator</span>
                </div>
            </Link>

            <nav className="sidebar-nav">
                <Link to="/admin" className={`nav-item ${isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    Dashboard
                </Link>
                <Link to="/admin/settings" className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}>
                    <Settings size={20} />
                    Course Settings
                </Link>
                <Link to="/admin/data" className={`nav-item ${isActive('/admin/data') ? 'active' : ''}`}>
                    <Database size={20} />
                    Data
                </Link>
                <Link to="/admin/reviews" className={`nav-item ${isActive('/admin/reviews') ? 'active' : ''}`}>
                    <Star size={20} />
                    Reviews
                </Link>
                <Link to="/admin/faq" className={`nav-item ${isActive('/admin/faq') ? 'active' : ''}`}>
                    <HelpCircle size={20} />
                    FAQ
                </Link>
            </nav>

            <div className="sidebar-footer">
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
    );
};

export default AdminSidebar;
