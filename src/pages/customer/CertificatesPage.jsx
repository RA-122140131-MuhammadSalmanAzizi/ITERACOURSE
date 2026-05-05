import { useState, useEffect } from 'react';
import { Award, Download, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import './CertificatesPage.css';
import '../admin/AdminPages.css';

const CertificatesPage = () => {
    const { profile } = useAuth();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) loadCertificates();
    }, [profile]);

    const loadCertificates = async () => {
        try {
            const { data } = await supabase
                .from('certificates')
                .select('*, course:courses(title, instructor:profiles!courses_instructor_id_fkey(full_name))')
                .eq('user_id', profile.id)
                .order('issued_at', { ascending: false });
            setCertificates(data || []);
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
                    <div><h1>Sertifikat Saya</h1><p>Sertifikat yang telah Anda peroleh</p></div>
                </header>
                <section className="content-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : certificates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Award size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Anda belum memiliki sertifikat</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selesaikan kursus dan lulus semua quiz untuk mendapatkan sertifikat</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {certificates.map(cert => (
                                <div key={cert.id} style={{
                                    background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                    borderRadius: '12px', padding: '1.25rem',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: 'rgba(245, 158, 11, 0.15)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Award size={20} style={{ color: '#f59e0b' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                {cert.course?.title}
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {cert.course?.instructor?.full_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        <p style={{ margin: '0.25rem 0' }}><strong>Kode:</strong> {cert.code}</p>
                                        <p style={{ margin: '0.25rem 0' }}><strong>Tanggal:</strong> {new Date(cert.issued_at).toLocaleDateString('id-ID')}</p>
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

export default CertificatesPage;
