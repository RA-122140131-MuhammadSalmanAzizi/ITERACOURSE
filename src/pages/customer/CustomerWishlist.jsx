import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import '../admin/AdminPages.css';

const CustomerWishlist = () => {
    const { profile } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadWishlist();
    }, [profile]);

    const loadWishlist = async () => {
        try {
            const { data } = await supabase
                .from('wishlists')
                .select('*, course:courses(id, title, thumbnail_url, level, price, instructor:profiles!courses_instructor_id_fkey(full_name))')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });
            setWishlist(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const removeFromWishlist = async (wishlistId) => {
        try {
            await supabase.from('wishlists').delete().eq('id', wishlistId);
            setWishlist(wishlist.filter(w => w.id !== wishlistId));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="admin-page">
            <CustomerSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div><h1>Wishlist</h1><p>Kursus yang ingin Anda pelajari</p></div>
                </header>
                <section className="content-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : wishlist.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Heart size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Wishlist Anda kosong</p>
                            <Link to="/courses" className="btn btn-primary btn-sm">Jelajahi Kursus</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {wishlist.map(item => (
                                <div key={item.id} style={{
                                    background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                    borderRadius: '12px', overflow: 'hidden',
                                }}>
                                    <Link to={`/course/${item.course?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{
                                            height: '140px',
                                            background: item.course?.thumbnail_url
                                                ? `url(${item.course.thumbnail_url}) center/cover`
                                                : 'var(--gradient-primary)',
                                        }} />
                                        <div style={{ padding: '1rem' }}>
                                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                {item.course?.title}
                                            </h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                                                {item.course?.instructor?.full_name}
                                            </p>
                                        </div>
                                    </Link>
                                    <div style={{ padding: '0 1rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: item.course?.price ? 'var(--text-primary)' : '#22c55e' }}>
                                            {item.course?.price ? `Rp ${item.course.price.toLocaleString('id-ID')}` : 'Gratis'}
                                        </span>
                                        <button
                                            onClick={() => removeFromWishlist(item.id)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px',
                                                padding: '0.4rem', cursor: 'pointer', color: '#ef4444',
                                            }}
                                            title="Hapus dari Wishlist"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CustomerWishlist;
