import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, Award, Clock, TrendingUp, Heart, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import '../admin/AdminPages.css';

const CustomerDashboard = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        enrolledCourses: 0,
        completedCourses: 0,
        certificates: 0,
        wishlistCount: 0,
    });
    const [recentCourses, setRecentCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadDashboardData();
    }, [profile]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch enrolled courses count
            const { count: enrolledCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);

            // Fetch completed courses count
            const { count: completedCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('status', 'completed');

            // Fetch certificates count
            const { count: certCount } = await supabase
                .from('certificates')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);

            // Fetch wishlist count
            const { count: wishCount } = await supabase
                .from('wishlists')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);

            // Fetch recent enrolled courses with course details
            const { data: recentEnrollments } = await supabase
                .from('enrollments')
                .select(`
                    *,
                    course:courses(id, title, thumbnail_url, level, instructor:profiles!courses_instructor_id_fkey(full_name))
                `)
                .eq('user_id', profile.id)
                .order('enrolled_at', { ascending: false })
                .limit(4);

            setStats({
                enrolledCourses: enrolledCount || 0,
                completedCourses: completedCount || 0,
                certificates: certCount || 0,
                wishlistCount: wishCount || 0,
            });

            setRecentCourses(recentEnrollments || []);
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
        setLoading(false);
    };

    const dashboardStats = [
        { label: 'Kursus Diikuti', value: stats.enrolledCourses, icon: BookOpen, color: 'primary' },
        { label: 'Kursus Selesai', value: stats.completedCourses, icon: Award, color: 'success' },
        { label: 'Sertifikat', value: stats.certificates, icon: Star, color: 'warning' },
        { label: 'Wishlist', value: stats.wishlistCount, icon: Heart, color: 'secondary' },
    ];

    return (
        <div className="admin-page customer-dashboard">
            <CustomerSidebar />

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Dashboard</h1>
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

                {/* Stats */}
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
                    {/* Recent Courses */}
                    <section className="content-section">
                        <div className="section-header">
                            <h2>Kursus Terakhir</h2>
                            <Link to="/customer/courses" className="btn btn-outline btn-sm view-all-desktop">Lihat Semua</Link>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                Memuat...
                            </div>
                        ) : recentCourses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <BookOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Anda belum mengikuti kursus</p>
                                <Link to="/courses" className="btn btn-primary btn-sm">Jelajahi Kursus</Link>
                            </div>
                        ) : (
                            <div className="recent-courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                                {recentCourses.map(enrollment => (
                                    <Link
                                        key={enrollment.id}
                                        to={`/watch/${enrollment.course?.id}`}
                                        style={{
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <div style={{
                                            height: '120px',
                                            background: enrollment.course?.thumbnail_url
                                                ? `url(${enrollment.course.thumbnail_url}) center/cover`
                                                : 'var(--gradient-primary)',
                                        }} />
                                        <div style={{ padding: '0.75rem' }}>
                                            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                {enrollment.course?.title}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {enrollment.course?.instructor?.full_name || 'Instructor'}
                                            </p>
                                            <div style={{
                                                marginTop: '0.5rem',
                                                height: '4px',
                                                borderRadius: '2px',
                                                background: 'var(--border-color)',
                                                overflow: 'hidden',
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${enrollment.progress || 0}%`,
                                                    background: 'var(--primary-500)',
                                                    borderRadius: '2px',
                                                    transition: 'width 0.3s ease',
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {enrollment.progress || 0}% selesai
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Link to="/customer/courses" className="btn btn-outline btn-block view-all-mobile" style={{ marginTop: '1.5rem', textAlign: 'center', justifyContent: 'center' }}>Lihat Semua Kursus</Link>
                    </section>

                    {/* Quick Actions */}
                    <section className="content-section quick-actions-section">
                        <div className="section-header">
                            <h2>Aksi Cepat</h2>
                        </div>
                        <div className="quick-actions">
                            <Link to="/courses" className="quick-action-btn">
                                <BookOpen size={20} />
                                <span>Jelajahi Kursus</span>
                            </Link>
                            <Link to="/customer/certificates" className="quick-action-btn">
                                <Award size={20} />
                                <span>Sertifikat</span>
                            </Link>
                            <Link to="/customer/wishlist" className="quick-action-btn">
                                <Heart size={20} />
                                <span>Wishlist</span>
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default CustomerDashboard;
