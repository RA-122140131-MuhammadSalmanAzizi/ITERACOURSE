import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Eye, Edit, Trash2, Search, X, Users, Star, Calendar, BarChart2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import DosenSidebar from '../../components/DosenSidebar';
import './DosenPages.css';

const DosenCourses = () => {
    const { profile } = useAuth();
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [editThumbnailFile, setEditThumbnailFile] = useState(null);
    const [editThumbnailPreview, setEditThumbnailPreview] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (profile) {
            loadCourses();
            loadCategories();
        }
    }, [profile]);

    const loadCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name');
        setCategories(data || []);
    };

    const loadCourses = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*, category:categories(id, name), enrollments(count), reviews(rating)')
                .eq('instructor_id', profile.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setCourses(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm('Yakin ingin menghapus kursus ini?')) return;
        try {
            await supabase.from('courses').delete().eq('id', courseId);
            setCourses(courses.filter(c => c.id !== courseId));
        } catch (err) {
            alert('Gagal menghapus: ' + err.message);
        }
    };

    const uploadToSupabase = async (file, folder) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage.from('course-assets').upload(filePath, file);
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('course-assets').getPublicUrl(filePath);
        return publicUrl;
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditThumbnailFile(file);
            setEditThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const openEditModal = (course) => {
        setEditForm({
            id: course.id,
            title: course.title,
            description: course.description || '',
            category_id: course.category_id || course.category?.id || '',
            thumbnail_url: course.thumbnail_url || ''
        });
        setEditThumbnailFile(null);
        setEditThumbnailPreview('');
        setShowEditModal(true);
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            let finalThumbnailUrl = editForm.thumbnail_url;
            if (editThumbnailFile) {
                finalThumbnailUrl = await uploadToSupabase(editThumbnailFile, 'images');
            }

            const { error } = await supabase
                .from('courses')
                .update({
                    title: editForm.title,
                    description: editForm.description,
                    category_id: editForm.category_id,
                    thumbnail_url: finalThumbnailUrl
                })
                .eq('id', editForm.id);

            if (error) throw error;

            // Update local state by reloading from DB to ensure 100% accuracy
            await loadCourses();

            alert('Kursus berhasil diperbarui!');
            setShowEditModal(false);
        } catch (err) {
            alert('Gagal mengupdate kursus: ' + err.message);
        }
        setIsUpdating(false);
    };

    const filtered = courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const getStatusColor = (status) => {
        switch (status) {
            case 'published': return '#22c55e';
            case 'pending': return '#f59e0b';
            case 'draft': return 'var(--text-muted)';
            case 'rejected': return '#ef4444';
            default: return 'var(--text-muted)';
        }
    };

    const calculateRating = (reviews) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    };

    return (
        <div className="dosen-page">
            <DosenSidebar />
            <main className="dosen-main">
                <header className="dosen-header">
                    <div>
                        <h1>Kursus Saya</h1>
                        <p>Kelola kursus yang telah Anda buat</p>
                    </div>
                    <Link to="/dosen/upload" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Buat Kursus
                    </Link>
                </header>

                <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            border: '1px solid var(--border-color)', borderRadius: '8px',
                            padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', flex: 1, minWidth: '200px',
                        }}>
                            <Search size={16} style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text" placeholder="Cari kursus..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ border: 'none', outline: 'none', background: 'none', color: 'var(--text-primary)', width: '100%' }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat...</p>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <BookOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                {courses.length === 0 ? 'Anda belum membuat kursus' : 'Tidak ada kursus yang cocok'}
                            </p>
                            {courses.length === 0 && (
                                <Link to="/dosen/upload" className="btn btn-primary btn-sm">Buat Kursus Pertama</Link>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                            {filtered.map(course => {
                                const rating = calculateRating(course.reviews);
                                return (
                                <div key={course.id} className="course-card" style={{
                                    display: 'flex', flexDirection: 'column',
                                    borderRadius: '12px', background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)', overflow: 'hidden',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}>
                                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderBottom: '1px solid var(--border-color)' }}>
                                        <img 
                                            src={course.thumbnail_url || 'https://via.placeholder.com/600x400?text=No+Thumbnail'} 
                                            alt={course.title}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <span style={{
                                            position: 'absolute', top: '0.5rem', right: '0.5rem',
                                            padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem',
                                            background: 'rgba(255, 255, 255, 0.95)', color: getStatusColor(course.status),
                                            fontWeight: 'bold', border: `1px solid ${getStatusColor(course.status)}`,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {course.status.toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--primary-500)', fontWeight: 600 }}>
                                                <BookOpen size={12} />
                                                <span>{course.category?.name || 'Uncategorized'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                                <Star size={12} fill="#f59e0b" />
                                                <span>{rating}</span>
                                            </div>
                                        </div>
                                        
                                        <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4rem' }}>
                                            {course.title}
                                        </h4>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Users size={12} />
                                                    {course.enrollments?.[0]?.count || 0} Pendaftar
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <BarChart2 size={12} />
                                                    {course.level}
                                                </span>
                                            </div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Calendar size={12} />
                                                Dibuat: {formatDate(course.created_at)}
                                            </span>
                                        </div>
                                        
                                        <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                            <Link to={`/course/${course.id}`} style={{
                                                padding: '0.5rem', borderRadius: '6px', color: 'var(--text-muted)',
                                                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', textDecoration: 'none'
                                            }} title="Lihat Pratinjau">
                                                <Eye size={18} />
                                            </Link>
                                            <button onClick={() => openEditModal(course)} style={{
                                                padding: '0.5rem', borderRadius: '6px', color: 'var(--primary-500)',
                                                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                                cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s'
                                            }} title="Edit Info Kursus">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(course.id)} style={{
                                                padding: '0.5rem', borderRadius: '6px', color: '#ef4444',
                                                background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s'
                                            }} title="Hapus Kursus">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* Edit Modal */}
            {showEditModal && editForm && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'var(--bg-primary)', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Edit Info Kursus</h2>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCourse} style={{ padding: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Thumbnail Kursus</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                                        <img 
                                            src={editThumbnailPreview || editForm.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                                            alt="Thumbnail Preview" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', cursor: 'pointer', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                            <ImageIcon size={14} /> Ubah Thumbnail
                                            <input type="file" accept="image/*" hidden onChange={handleThumbnailChange} />
                                        </label>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Format disarankan: JPG, PNG, WEBP (Resolusi 1280x720px).</p>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Judul Kursus</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    value={editForm.title} 
                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Kategori</label>
                                <select 
                                    className="input" 
                                    value={editForm.category_id} 
                                    onChange={(e) => setEditForm({...editForm, category_id: e.target.value})} 
                                    required
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <textarea 
                                    className="input" 
                                    rows={5} 
                                    value={editForm.description} 
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                                    required 
                                ></textarea>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                                    {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DosenCourses;
