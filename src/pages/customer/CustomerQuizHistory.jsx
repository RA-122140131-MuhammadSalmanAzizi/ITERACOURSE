import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import '../admin/AdminPages.css';

const CustomerQuizHistory = () => {
    const { profile } = useAuth();
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadAttempts();
    }, [profile]);

    const loadAttempts = async () => {
        try {
            const { data } = await supabase
                .from('quiz_attempts')
                .select('*, content:contents(title, chapter:chapters(title, course:courses(title)))')
                .eq('user_id', profile.id)
                .order('attempted_at', { ascending: false });
            setAttempts(data || []);
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
                    <div><h1>Riwayat Quiz</h1><p>Semua quiz yang pernah Anda kerjakan</p></div>
                </header>
                <section className="content-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : attempts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <ClipboardList size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Anda belum mengerjakan quiz</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Quiz</th>
                                        <th>Kursus</th>
                                        <th>Skor</th>
                                        <th>Status</th>
                                        <th>Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map(attempt => (
                                        <tr key={attempt.id}>
                                            <td>{attempt.content?.title || '-'}</td>
                                            <td>{attempt.content?.chapter?.course?.title || '-'}</td>
                                            <td><strong>{attempt.score}%</strong></td>
                                            <td>
                                                <span className={`status-badge ${attempt.passed ? 'active' : 'inactive'}`}>
                                                    {attempt.passed ? 'Lulus' : 'Tidak Lulus'}
                                                </span>
                                            </td>
                                            <td>{new Date(attempt.attempted_at).toLocaleDateString('id-ID')}</td>
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

export default CustomerQuizHistory;
