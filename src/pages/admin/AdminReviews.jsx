import { useState, useEffect } from 'react';
import { Star, Search, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminPages.css';

const AdminReviews = () => {
    const { profile } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*, user:profiles!reviews_user_id_fkey(full_name, email), course:courses(title)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setReviews(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const updateStatus = async (reviewId, newStatus) => {
        try {
            await supabase.from('reviews').update({ status: newStatus }).eq('id', reviewId);
            setReviews(reviews.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const filtered = reviews.filter(r => statusFilter === 'all' || r.status === statusFilter);

    return (
        <div className="admin-page">
            <AdminSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div><h1>Manajemen Review</h1><p>Moderasi review dari pengguna</p></div>
                </header>

                <section className="content-section">
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">Semua ({reviews.length})</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <MessageSquare size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Tidak ada review</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filtered.map(review => (
                                <div key={review.id} style={{
                                    padding: '1rem', borderRadius: '12px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: 'var(--text-primary)' }}>{review.user?.full_name}</strong>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> — {review.course?.title}</span>
                                            <div style={{ color: '#f59e0b', marginTop: '0.25rem' }}>
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                                            background: review.status === 'approved' ? 'rgba(34,197,94,0.15)' : review.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                            color: review.status === 'approved' ? '#22c55e' : review.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                        }}>
                                            {review.status}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.75rem 0 0' }}>{review.comment}</p>
                                    {review.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            <button onClick={() => updateStatus(review.id, 'approved')} className="btn btn-sm"
                                                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button onClick={() => updateStatus(review.id, 'rejected')} className="btn btn-sm"
                                                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminReviews;
