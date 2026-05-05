import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import '../admin/AdminPages.css';

const CustomerCourses = () => {
    const { profile } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (profile) loadEnrollments();
    }, [profile]);

    const loadEnrollments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    *,
                    course:courses(id, title, thumbnail_url, level, description, instructor:profiles!courses_instructor_id_fkey(full_name))
                `)
                .eq('user_id', profile.id)
                .order('enrolled_at', { ascending: false });

            if (error) throw error;
            setEnrollments(data || []);
        } catch (err) {
            console.error('Error loading enrollments:', err);
        }
        setLoading(false);
    };

    const filtered = enrollments.filter(e => {
        if (filter === 'all') return true;
        if (filter === 'active') return e.status === 'active';
        if (filter === 'completed') return e.status === 'completed';
        return true;
    });

    return (
        <div className="admin-page">
            <CustomerSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Kursus Saya</h1>
                        <p>Kursus yang sedang Anda ikuti</p>
                    </div>
                </header>

                <section className="content-section">
                    <div className="filter-bar">
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="all">Semua ({enrollments.length})</option>
                            <option value="active">Sedang Berjalan</option>
                            <option value="completed">Selesai</option>
                        </select>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <BookOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Belum ada kursus yang diikuti</p>
                            <Link to="/courses" className="btn btn-primary btn-sm">Jelajahi Kursus</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {filtered.map(enrollment => (
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
                                    }}
                                >
                                    <div style={{
                                        height: '140px',
                                        background: enrollment.course?.thumbnail_url
                                            ? `url(${enrollment.course.thumbnail_url}) center/cover`
                                            : 'var(--gradient-primary)',
                                    }} />
                                    <div style={{ padding: '1rem' }}>
                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                            {enrollment.course?.title}
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
                                            {enrollment.course?.instructor?.full_name}
                                        </p>
                                        <div style={{
                                            height: '6px', borderRadius: '3px',
                                            background: 'var(--border-color)', overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%', width: `${enrollment.progress || 0}%`,
                                                background: enrollment.status === 'completed' ? '#22c55e' : 'var(--primary-500)',
                                                borderRadius: '3px',
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <span>{enrollment.progress || 0}% selesai</span>
                                            <span className={`status-badge ${enrollment.status}`} style={{ fontSize: '0.75rem' }}>
                                                {enrollment.status === 'completed' ? 'Selesai' : 'Aktif'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CustomerCourses;
