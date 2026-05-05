import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, BookOpen, DollarSign, Settings, X, PlusCircle,
    Star, User, Database, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as dosenRequestService from '../../services/dosenRequestService';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminPages.css';

const AdminDashboard = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ users: 0, courses: 0, dosen: 0, pendingRequests: 0 });
    const [loading, setLoading] = useState(true);
    const [isEditingActions, setIsEditingActions] = useState(false);
    const [activeActions, setActiveActions] = useState([
        { id: 'data', label: 'Data Management', path: '/admin/data', icon: Database, visible: true },
        { id: 'reviews', label: 'Reviews', path: '/admin/reviews', icon: Star, visible: true },
        { id: 'settings', label: 'Course Settings', path: '/admin/settings', icon: Settings, visible: true },
        { id: 'users', label: 'Users', path: '/admin/users', icon: Users, visible: true },
    ]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [
                { count: userCount },
                { count: courseCount },
                { count: dosenCount },
                pendingCount,
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('courses').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen'),
                dosenRequestService.getPendingDosenRequestCount(),
            ]);

            setStats({
                users: userCount || 0,
                courses: courseCount || 0,
                dosen: dosenCount || 0,
                pendingRequests: pendingCount,
            });
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const toggleAction = (id) => {
        const action = activeActions.find(a => a.id === id);
        const activeCount = activeActions.filter(a => a.visible).length;

        if (!action.visible && activeCount >= 4) {
            alert('You can only pin up to 4 quick actions.');
            return;
        }

        setActiveActions(activeActions.map(action =>
            action.id === id ? { ...action, visible: !action.visible } : action
        ));
    };

    const dashboardStats = [
        { label: 'Total Users', value: stats.users, icon: Users, color: 'primary' },
        { label: 'Total Kursus', value: stats.courses, icon: BookOpen, color: 'secondary' },
        { label: 'Dosen', value: stats.dosen, icon: User, color: 'warning' },
        { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: stats.pendingRequests > 0 ? 'success' : 'primary' },
    ];

    return (
        <div className="admin-page">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Dashboard Overview</h1>
                        <p>Selamat datang, {profile?.full_name}!</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="date-display">
                            {new Date().toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </header>

                <div className="stats-grid">
                    {dashboardStats.map((stat, index) => (
                        <div key={index} className={`stat-card ${stat.color}`}>
                            <div className="stat-header">
                                <div className="stat-icon">
                                    <stat.icon size={24} />
                                </div>
                            </div>
                            <p className="stat-value">{loading ? '...' : stat.value}</p>
                            <p className="stat-label">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="dashboard-grid">
                    {/* Quick Actions */}
                    <section className="content-section">
                        <div className="section-header">
                            <h2>Quick Actions</h2>
                            <button
                                className="btn-icon"
                                onClick={() => setIsEditingActions(!isEditingActions)}
                                title={isEditingActions ? "Done Editing" : "Customize Actions"}
                            >
                                <Settings size={18} color={isEditingActions ? 'var(--primary-500)' : 'var(--text-muted)'} />
                            </button>
                        </div>

                        {isEditingActions ? (
                            <div className="quick-actions-editor" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                {activeActions.map(action => (
                                    <button
                                        key={action.id}
                                        onClick={() => toggleAction(action.id)}
                                        className={`quick-action-btn ${action.visible ? 'active' : ''}`}
                                        style={{
                                            opacity: action.visible ? 1 : 0.5,
                                            border: action.visible ? '1px solid var(--primary-500)' : '1px dashed var(--border-color)',
                                            position: 'relative',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: action.visible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                            {action.visible ? <X size={14} /> : <PlusCircle size={14} />}
                                        </div>
                                        <action.icon size={20} />
                                        <span style={{ fontSize: '0.8rem' }}>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="quick-actions">
                                {activeActions.filter(a => a.visible).map(action => (
                                    <Link key={action.id} to={action.path} className="quick-action-btn">
                                        <action.icon size={20} />
                                        <span>{action.label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
