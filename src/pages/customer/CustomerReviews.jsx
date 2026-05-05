import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import '../admin/AdminPages.css';

const CustomerReviews = () => {
    const { profile } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadReviews();
    }, [profile]);

    const loadReviews = async () => {
        try {
            const { data } = await supabase
                .from('reviews')
                .select('*, course:courses(title)')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });
            setReviews(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="admin-page">
            <CustomerSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div><h1>Review Saya</h1><p>Review kursus yang telah Anda berikan</p></div>
                </header>
                <section className="content-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : reviews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <MessageSquare size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Anda belum memberikan review</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {reviews.map(review => (
                                <div key={review.id} style={{
                                    padding: '1rem', borderRadius: '12px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>{review.course?.title}</strong>
                                        <span style={{ color: '#f59e0b' }}>{'⭐'.repeat(review.rating)}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{review.comment}</p>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                                        Status: <span className={`status-badge ${review.status}`}>{review.status}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CustomerReviews;
