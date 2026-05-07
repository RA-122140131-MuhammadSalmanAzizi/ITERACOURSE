import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import {
    Pagination, PaginationContent, PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious
} from '../../components/ui/Pagination';
import '../admin/AdminPages.css';

const CustomerCourses = () => {
    const { profile } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const COURSES_PER_PAGE = isMobile ? 5 : 8;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (profile) loadEnrollments();
    }, [profile]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

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
        const isCompleted = e.status === 'completed' || e.progress >= 100;

        if (filter === 'all') return true;
        if (filter === 'active') return e.status === 'active' && !isCompleted;
        if (filter === 'completed') return isCompleted;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / COURSES_PER_PAGE);
    const paginatedCourses = filtered.slice(
        (currentPage - 1) * COURSES_PER_PAGE,
        currentPage * COURSES_PER_PAGE
    );

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
                        <>
                            <div className="enrollment-grid">
                                {paginatedCourses.map(enrollment => (
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
                                            aspectRatio: '16/10',
                                            width: '100%',
                                            background: enrollment.course?.thumbnail_url
                                                ? `url(${enrollment.course.thumbnail_url}) center/cover`
                                                : 'var(--gradient-primary)',
                                        }} />
                                        <div style={{ padding: '1rem' }}>
                                            <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                                {enrollment.course?.title}
                                            </h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                                                {enrollment.course?.instructor?.full_name}
                                            </p>
                                            <div style={{
                                                height: '6px', borderRadius: '3px',
                                                background: 'var(--border-color)', overflow: 'hidden',
                                                marginBottom: '0.5rem'
                                            }}>
                                                <div style={{
                                                    height: '100%', width: `${enrollment.progress || 0}%`,
                                                    background: (enrollment.status === 'completed' || enrollment.progress >= 100) ? '#22c55e' : 'var(--primary-500)',
                                                    borderRadius: '3px',
                                                }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <span style={{ fontWeight: '500' }}>{enrollment.progress || 0}% selesai</span>
                                                <span className={`status-badge ${(enrollment.status === 'completed' || enrollment.progress >= 100) ? 'completed' : 'active'}`} style={{ fontSize: '0.75rem' }}>
                                                    {(enrollment.status === 'completed' || enrollment.progress >= 100) ? 'Selesai' : 'Aktif'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(p => Math.max(1, p - 1));
                                                }}
                                                style={{ opacity: currentPage === 1 ? 0.5 : 1, pointerEvents: currentPage === 1 ? 'none' : 'auto' }}
                                            />
                                        </PaginationItem>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCurrentPage(i + 1);
                                                    }}
                                                    isActive={currentPage === i + 1}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(p => Math.min(totalPages, p + 1));
                                                }}
                                                style={{ opacity: currentPage === totalPages ? 0.5 : 1, pointerEvents: currentPage === totalPages ? 'none' : 'auto' }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CustomerCourses;
