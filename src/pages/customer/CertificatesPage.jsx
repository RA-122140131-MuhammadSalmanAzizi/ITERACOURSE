import { useState, useEffect, useRef } from 'react';
import { Award, Download, ExternalLink, X, Copy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import CertificateTemplate from '../../components/CertificateTemplate';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '../../components/ui/Pagination';
import './CertificatesPage.css';
import '../admin/AdminPages.css';

const CertificatesPage = () => {
    const { profile } = useAuth();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const certTemplateRef = useRef(null);

    useEffect(() => {
        if (profile) loadCertificates();
    }, [profile]);

    const loadCertificates = async () => {
        try {
            const { data } = await supabase
                .from('certificates')
                .select('*, course:courses(title, thumbnail_url, instructor:profiles!courses_instructor_id_fkey(full_name))')
                .eq('user_id', profile.id)
                .order('issued_at', { ascending: false });
            setCertificates(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = async () => {
        if (!certTemplateRef.current) return;
        setDownloading(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(certTemplateRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#fffdf5',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [793, 1122] });
            pdf.addImage(imgData, 'PNG', 0, 0, 1122, 793);
            pdf.save(`Sertifikat-${selectedCertificate.code}.pdf`);
        } catch (err) {
            console.error('Error generating certificate:', err);
            alert('Gagal mengunduh sertifikat. Coba lagi.');
        }
        setDownloading(false);
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
                            <Award size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Anda belum memiliki sertifikat</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selesaikan kursus dan lulus semua quiz untuk mendapatkan sertifikat</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {certificates.map(cert => (
                                <div
                                    key={cert.id}
                                    style={{
                                        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                        borderRadius: '12px', padding: '1.25rem 1.5rem', transition: 'all 0.2s ease',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        gap: '1.5rem', flexWrap: 'wrap'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1 1 300px' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '50%',
                                            background: 'rgba(245, 158, 11, 0.15)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <Award size={28} style={{ color: '#f59e0b' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                                {cert.course?.title}
                                            </h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                <span><strong>Instruktur:</strong> {cert.course?.instructor?.full_name}</span>
                                                <span style={{ color: 'var(--border-color)' }}>|</span>
                                                <span><strong>Tanggal:</strong> {new Date(cert.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                <span style={{ color: 'var(--border-color)' }}>|</span>
                                                <span><strong>Kode:</strong> {cert.code}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => setSelectedCertificate(cert)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                                        >
                                            <ExternalLink size={16} /> Lihat Sertifikat
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {certificates.length > 0 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationLink href="#">1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#" isActive>
                                        2
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">4</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">5</PaginationLink>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </section>
            </main>

            {/* Certificate Modal */}
            {selectedCertificate && (
                <div className="certificate-modal-overlay" onClick={() => setSelectedCertificate(null)}>
                    <div className="certificate-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="certificate-modal-header">
                            <h2>Detail Sertifikat</h2>
                            <button className="certificate-modal-close" onClick={() => setSelectedCertificate(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="certificate-modal-body">
                            {selectedCertificate.course?.thumbnail_url ? (
                                <img
                                    src={selectedCertificate.course.thumbnail_url}
                                    alt="Course Thumbnail"
                                    className="certificate-modal-thumbnail"
                                />
                            ) : (
                                <div className="certificate-modal-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                                    <Award size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                </div>
                            )}
                            <div className="certificate-modal-info">
                                <h3>{selectedCertificate.course?.title}</h3>
                                <p>Instruktur: {selectedCertificate.course?.instructor?.full_name}</p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <p style={{ margin: 0 }}><strong>Kode Sertifikat:</strong> {selectedCertificate.code}</p>
                                    </div>
                                    <p style={{ margin: 0 }}><strong>Tanggal Diterbitkan:</strong> {new Date(selectedCertificate.issued_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                        <div className="certificate-modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleCopy(selectedCertificate.code)}
                                className="btn"
                                style={{
                                    background: copied ? '#10b981' : 'transparent',
                                    color: copied ? 'white' : 'var(--text-primary)',
                                    border: `1px solid ${copied ? '#10b981' : 'var(--border-color)'}`,
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Kode Tersalin!' : 'Salin Kode'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleDownload}
                                disabled={downloading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: downloading ? 0.7 : 1 }}
                            >
                                <Download size={16} /> {downloading ? 'Memproses...' : 'Download Sertifikat'}
                            </button>
                        </div>

                        {/* Hidden certificate template for html2canvas capture */}
                        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
                            <CertificateTemplate
                                ref={certTemplateRef}
                                certificate={selectedCertificate}
                                profileName={profile?.full_name}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificatesPage;
