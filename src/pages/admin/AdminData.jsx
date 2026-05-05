import { useState, useEffect } from 'react';
import { Database, Users, BookOpen, Award, FileText, MessageSquare, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../contexts/AuthContext';
import './AdminPages.css';

const AdminData = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState({});
    const [coursesList, setCoursesList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Teguran Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                { count: users },
                { count: courses },
                { count: enrollments },
                { count: certificates },
                { count: reviews },
                { count: categories },
                { count: chapters },
                { count: contents },
                { data: coursesData }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('courses').select('*', { count: 'exact', head: true }),
                supabase.from('enrollments').select('*', { count: 'exact', head: true }),
                supabase.from('certificates').select('*', { count: 'exact', head: true }),
                supabase.from('reviews').select('*', { count: 'exact', head: true }),
                supabase.from('categories').select('*', { count: 'exact', head: true }),
                supabase.from('chapters').select('*', { count: 'exact', head: true }),
                supabase.from('contents').select('*', { count: 'exact', head: true }),
                supabase.from('courses')
                    .select('*, instructor:profiles!courses_instructor_id_fkey(id, full_name, email)')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })
            ]);

            setStats({
                users: users || 0,
                courses: courses || 0,
                enrollments: enrollments || 0,
                certificates: certificates || 0,
                reviews: reviews || 0,
                categories: categories || 0,
                chapters: chapters || 0,
                contents: contents || 0,
            });
            setCoursesList(coursesData || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSendTeguran = async (e) => {
        e.preventDefault();
        if (!selectedCourse?.instructor?.id) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('notifications').insert({
                user_id: selectedCourse.instructor.id,
                sender_id: profile.id,
                title: notifTitle,
                message: notifMessage,
                type: 'warning'
            });

            if (error) throw error;
            
            alert('Teguran berhasil dikirimkan ke dosen!');
            setShowModal(false);
            setNotifTitle('');
            setNotifMessage('');
        } catch (err) {
            console.error('Error sending notif:', err);
            alert('Gagal mengirim teguran: ' + err.message);
        }
        setIsSubmitting(false);
    };

    const dataItems = [
        { label: 'Users', value: stats.users, icon: Users, color: '#3b82f6' },
        { label: 'Courses', value: stats.courses, icon: BookOpen, color: '#8b5cf6' },
        { label: 'Enrollments', value: stats.enrollments, icon: FileText, color: '#22c55e' },
        { label: 'Certificates', value: stats.certificates, icon: Award, color: '#f59e0b' },
        { label: 'Reviews', value: stats.reviews, icon: FileText, color: '#ef4444' },
        { label: 'Categories', value: stats.categories, icon: Database, color: '#06b6d4' },
        { label: 'Chapters', value: stats.chapters, icon: BookOpen, color: '#ec4899' },
        { label: 'Contents', value: stats.contents, icon: FileText, color: '#14b8a6' },
    ];

    return (
        <div className="admin-page">
            <AdminSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div><h1>Data Courses</h1><p>Manajemen Kursus Platform</p></div>
                </header>

                <section className="content-section" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Published Courses List</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kursus aktif di platform</span>
                    </div>
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat data kursus...</p>
                    ) : (
                        <div className="table-responsive" style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Judul Kursus</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Instruktur</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Level</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coursesList.map(course => (
                                        <tr key={course.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{course.title}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ color: 'var(--text-primary)' }}>{course.instructor?.full_name}</span> <br/>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{course.instructor?.email}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`status-badge published`}>{course.level}</span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button 
                                                    className="btn btn-outline btn-sm" 
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '6px' }}
                                                    onClick={() => {
                                                        setSelectedCourse(course);
                                                        setNotifTitle(`Catatan/Teguran: ${course.title}`);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <MessageSquare size={14} /> Beri Catatan
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {coursesList.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                                Belum ada kursus yang diterbitkan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {/* Modal Teguran */}
            {showModal && selectedCourse && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'var(--bg-primary)', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Kirim Catatan/Teguran</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSendTeguran} style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#ef4444' }}>
                                    Pesan ini akan dikirim langsung ke notifikasi <strong>{selectedCourse.instructor?.full_name}</strong>.
                                </p>
                            </div>
                            <div className="form-group">
                                <label>Judul Notifikasi</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    value={notifTitle} 
                                    onChange={(e) => setNotifTitle(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Isi Pesan / Teguran</label>
                                <textarea 
                                    className="input" 
                                    rows={5} 
                                    value={notifMessage} 
                                    onChange={(e) => setNotifMessage(e.target.value)} 
                                    placeholder="Contoh: Tolong perbaiki deskripsi kursus agar lebih profesional..."
                                    required 
                                ></textarea>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" style={{ background: '#ef4444' }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Teguran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminData;
