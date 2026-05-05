import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import '../admin/AdminPages.css';

const CustomerOrders = () => {
    const { profile } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadOrders();
    }, [profile]);

    const loadOrders = async () => {
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, course:courses(title)')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });
            setOrders(data || []);
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
                    <div><h1>Riwayat Pesanan</h1><p>Semua transaksi Anda</p></div>
                </header>
                <section className="content-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <ShoppingBag size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Belum ada pesanan</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fitur pembayaran akan segera hadir</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Kursus</th>
                                        <th>Jumlah</th>
                                        <th>Status</th>
                                        <th>Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.course?.title || '-'}</td>
                                            <td>Rp {(order.amount || 0).toLocaleString('id-ID')}</td>
                                            <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                                            <td>{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
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

export default CustomerOrders;
