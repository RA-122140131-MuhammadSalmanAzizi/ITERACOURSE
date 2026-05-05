import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminPages.css';

const AdminCourses = () => {
    const { profile } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*, instructor:profiles!courses_instructor_id_fkey(full_name, email), category:categories(name)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setCourses(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const updateStatus = async (courseId, newStatus) => {
        try {
            await supabase.from('courses').update({ status: newStatus }).eq('id', courseId);
            setCourses(courses.map(c => c.id === courseId ? { ...c, status: newStatus } : c));
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const filtered = courses.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase())
            || c.instructor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const colors = {
            published: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
            pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
            draft: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
            rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
        };
        const s = colors[status] || colors.draft;
        return (
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>
                {status}
            </span>
        );
    };

    return (
        <div className="admin-page">
            <AdminSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div><h1>Manajemen Kursus</h1><p>Review dan kelola semua kursus</p></div>
                </header>

                <section className="content-section">
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            border: '1px solid var(--border-color)', borderRadius: '8px',
                            padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', flex: 1, minWidth: '200px',
                        }}>
                            <Search size={16} style={{ color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Cari kursus atau dosen..." value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ border: 'none', outline: 'none', background: 'none', color: 'var(--text-primary)', width: '100%' }}
                            />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <BookOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Tidak ada kursus</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Kursus</th>
                                        <th>Dosen</th>
                                        <th>Kategori</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(course => (
                                        <tr key={course.id}>
                                            <td>
                                                <strong style={{ color: 'var(--text-primary)' }}>{course.title}</strong>
                                                <br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course.level}</span>
                                            </td>
                                            <td>{course.instructor?.full_name}</td>
                                            <td>{course.category?.name || '-'}</td>
                                            <td>{getStatusBadge(course.status)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <Link to={`/course/${course.id}`} style={{ padding: '0.35rem', borderRadius: '6px', color: 'var(--primary-500)' }} title="View">
                                                        <Eye size={16} />
                                                    </Link>
                                                    {course.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => updateStatus(course.id, 'published')}
                                                                style={{ padding: '0.35rem', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', border: 'none', color: '#22c55e', cursor: 'pointer' }}
                                                                title="Approve">
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button onClick={() => updateStatus(course.id, 'rejected')}
                                                                style={{ padding: '0.35rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                                title="Reject">
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminCourses;
