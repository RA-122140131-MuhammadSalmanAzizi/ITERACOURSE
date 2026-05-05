import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Star, Plus, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import DosenSidebar from '../../components/DosenSidebar';
import './DosenPages.css';

const DosenDashboard = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ courses: 0, students: 0, avgRating: 0 });
    const [recentCourses, setRecentCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadData();
    }, [profile]);

    const loadData = async () => {
        try {
            // Courses count
            const { count: courseCount } = await supabase
                .from('courses')
                .select('*', { count: 'exact', head: true })
                .eq('instructor_id', profile.id);

            // Total students (enrollments in my courses)
            const { data: myCourses } = await supabase
                .from('courses')
                .select('id')
                .eq('instructor_id', profile.id);

            let studentCount = 0;
            if (myCourses?.length > 0) {
                const courseIds = myCourses.map(c => c.id);
                const { count } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .in('course_id', courseIds);
                studentCount = count || 0;
            }

            // Recent courses
            const { data: recent } = await supabase
                .from('courses')
                .select('*')
                .eq('instructor_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                courses: courseCount || 0,
                students: studentCount,
                avgRating: 0,
            });
            setRecentCourses(recent || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'published': return '#22c55e';
            case 'pending': return '#f59e0b';
            case 'draft': return 'var(--text-muted)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="dosen-page">
            <DosenSidebar />
            <main className="dosen-main">
                <header className="dosen-header">
                    <div>
                        <h1>Dashboard Dosen</h1>
                        <p>Selamat datang, {profile?.full_name}! 👋</p>
                    </div>
                    <Link to="/dosen/upload" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Buat Kursus
                    </Link>
                </header>

                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                        <BookOpen size={24} style={{ color: 'var(--primary-500)', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0', color: 'var(--text-primary)' }}>{loading ? '...' : stats.courses}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Total Kursus</p>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                        <Users size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0', color: 'var(--text-primary)' }}>{loading ? '...' : stats.students}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Total Siswa</p>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                        <Star size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0', color: 'var(--text-primary)' }}>{loading ? '...' : stats.avgRating || '-'}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Rata-rata Rating</p>
                    </div>
                </div>

                <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Kursus Terbaru</h2>
                        <Link to="/dosen/courses" style={{ fontSize: '0.85rem', color: 'var(--primary-500)' }}>Lihat Semua</Link>
                    </div>

                    {loading ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Memuat...</p>
                    ) : recentCourses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Anda belum membuat kursus</p>
                            <Link to="/dosen/upload" className="btn btn-primary btn-sm">Buat Kursus Pertama</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentCourses.map(course => (
                                <div key={course.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{course.title}</h4>
                                        <span style={{
                                            fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '999px',
                                            background: `${getStatusColor(course.status)}20`, color: getStatusColor(course.status),
                                        }}>
                                            {course.status}
                                        </span>
                                    </div>
                                    <Link to={`/course/${course.id}`} style={{ color: 'var(--primary-500)' }}>
                                        <Eye size={18} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DosenDashboard;
