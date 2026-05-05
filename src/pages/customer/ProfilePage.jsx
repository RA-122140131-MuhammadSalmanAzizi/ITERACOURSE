import { useState, useEffect } from 'react';
import {
    User, Mail, Camera, CheckCircle, Clock, XCircle, AlertCircle, Save, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as dosenRequestService from '../../services/dosenRequestService';
import CustomerSidebar from '../../components/CustomerSidebar';
import '../admin/AdminPages.css';

const ProfilePage = () => {
    const { profile, updateUserProfile } = useAuth();
    const [fullName, setFullName] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    
    // Dosen request state
    const [dosenRequest, setDosenRequest] = useState(null);
    const [showDosenForm, setShowDosenForm] = useState(false);
    const [dosenFormData, setDosenFormData] = useState({ reason: '', department: '', staffId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [dosenError, setDosenError] = useState('');
    const [imgError, setImgError] = useState(false);

    const isEligible = dosenRequestService.isEligibleForDosen(profile?.email);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            loadDosenRequest();
        }
    }, [profile]);

    const loadDosenRequest = async () => {
        if (!profile) return;
        try {
            const req = await dosenRequestService.getMyDosenRequest(profile.id);
            setDosenRequest(req);
        } catch (err) {
            console.error('Error loading dosen request:', err);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!fullName.trim()) return;
        setSaving(true);
        setSaveMsg('');

        const result = await updateUserProfile({ full_name: fullName.trim() });
        if (result.success) {
            setSaveMsg('Profil berhasil disimpan!');
            setTimeout(() => setSaveMsg(''), 3000);
        } else {
            setSaveMsg('Gagal menyimpan: ' + result.error);
        }
        setSaving(false);
    };

    const handleSubmitDosenRequest = async (e) => {
        e.preventDefault();
        setDosenError('');
        setSubmitting(true);

        try {
            const req = await dosenRequestService.submitDosenRequest({
                userId: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                reason: dosenFormData.reason,
                department: dosenFormData.department,
                staffId: dosenFormData.staffId,
            });
            setDosenRequest(req);
            setShowDosenForm(false);
        } catch (err) {
            setDosenError(err.message);
        }
        setSubmitting(false);
    };

    const getRoleBadge = (role) => {
        const styles = {
            admin: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Administrator' },
            dosen: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: 'Dosen / Lecturer' },
            customer: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', label: 'Student' },
        };
        const s = styles[role] || styles.customer;
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.85rem',
                background: s.bg, color: s.color, fontWeight: 600,
            }}>
                {s.label}
            </span>
        );
    };

    const inputStyle = {
        flex: 1,
        padding: '0.75rem 0.75rem 0.75rem 0',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-primary)',
        outline: 'none',
        width: '100%',
        fontSize: '0.95rem',
    };

    const inputWrapStyle = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
    };

    return (
        <div className="admin-page">
            <CustomerSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Profil Saya</h1>
                        <p>Kelola informasi akun Anda</p>
                    </div>
                </header>

                <div className="content-section">
                    <div style={{ maxWidth: '650px' }}>
                        {/* Avatar & Role */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'var(--gradient-primary)', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', fontWeight: 700, overflow: 'hidden',
                                border: '3px solid var(--border-color)',
                                position: 'relative'
                            }}>
                                {profile?.avatar_url && !imgError ? (
                                    <img 
                                        src={profile.avatar_url} 
                                        alt="" 
                                        onError={() => setImgError(true)}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>{profile?.full_name}</h3>
                                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{profile?.email}</p>
                                {getRoleBadge(profile?.role)}
                            </div>
                        </div>

                        {/* Edit Profile Form */}
                        <form onSubmit={handleSaveProfile}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Nama Lengkap</label>
                                <div style={inputWrapStyle}>
                                    <User size={18} style={{ margin: '0 0.75rem', color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        style={inputStyle}
                                        placeholder="Masukkan nama lengkap"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Email</label>
                                <div style={{ ...inputWrapStyle, background: 'var(--bg-secondary)' }}>
                                    <Mail size={18} style={{ margin: '0 0.75rem', color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <input
                                        type="email"
                                        value={profile?.email || ''}
                                        readOnly
                                        style={{ ...inputStyle, color: 'var(--text-muted)', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                    Email tidak dapat diubah (terhubung dengan akun Google)
                                </span>
                            </div>

                            {saveMsg && (
                                <div style={{
                                    padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '1rem',
                                    background: saveMsg.includes('berhasil') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: saveMsg.includes('berhasil') ? '#22c55e' : '#ef4444',
                                    fontSize: '0.85rem',
                                }}>
                                    {saveMsg}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Save size={16} />
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </form>

                        {/* Dosen Request Section */}
                        {profile?.role === 'customer' && isEligible && (
                            <div style={{
                                marginTop: '2rem', padding: '1.25rem', borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <GraduationCap size={20} style={{ color: 'var(--primary-500)' }} />
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Ajukan Role Dosen</h3>
                                </div>

                                {!dosenRequest ? (
                                    <>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                                            Email Anda terdeteksi sebagai email staff ITERA. Anda dapat mengajukan perubahan role menjadi Dosen untuk membuat dan mengelola kursus.
                                        </p>
                                        {!showDosenForm ? (
                                            <button onClick={() => setShowDosenForm(true)} className="btn btn-primary btn-sm">
                                                Ajukan Sekarang
                                            </button>
                                        ) : (
                                            <form onSubmit={handleSubmitDosenRequest}>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Jurusan / Program Studi</label>
                                                    <input
                                                        type="text"
                                                        value={dosenFormData.department}
                                                        onChange={(e) => setDosenFormData({ ...dosenFormData, department: e.target.value })}
                                                        placeholder="Contoh: Informatika"
                                                        required
                                                        style={{ ...inputStyle, padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>NIP / NIDN (opsional)</label>
                                                    <input
                                                        type="text"
                                                        value={dosenFormData.staffId}
                                                        onChange={(e) => setDosenFormData({ ...dosenFormData, staffId: e.target.value })}
                                                        placeholder="Masukkan NIP/NIDN"
                                                        style={{ ...inputStyle, padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)' }}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>Alasan Pengajuan</label>
                                                    <textarea
                                                        value={dosenFormData.reason}
                                                        onChange={(e) => setDosenFormData({ ...dosenFormData, reason: e.target.value })}
                                                        placeholder="Jelaskan kursus apa yang ingin Anda buat..."
                                                        rows={3}
                                                        required
                                                        style={{ ...inputStyle, padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', resize: 'vertical', fontFamily: 'inherit' }}
                                                    />
                                                </div>
                                                {dosenError && (
                                                    <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <AlertCircle size={14} /> {dosenError}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                                        {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                                                    </button>
                                                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowDosenForm(false)}>
                                                        Batal
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {dosenRequest.status === 'pending' && (
                                            <>
                                                <Clock size={18} style={{ color: '#f59e0b' }} />
                                                <span style={{ fontSize: '0.9rem', color: '#f59e0b' }}>Pengajuan sedang menunggu persetujuan admin</span>
                                            </>
                                        )}
                                        {dosenRequest.status === 'approved' && (
                                            <>
                                                <CheckCircle size={18} style={{ color: '#22c55e' }} />
                                                <span style={{ fontSize: '0.9rem', color: '#22c55e' }}>Pengajuan disetujui! Silakan refresh halaman.</span>
                                            </>
                                        )}
                                        {dosenRequest.status === 'rejected' && (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <XCircle size={18} style={{ color: '#ef4444' }} />
                                                    <span style={{ fontSize: '0.9rem', color: '#ef4444' }}>Pengajuan ditolak</span>
                                                </div>
                                                {dosenRequest.admin_notes && (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                        Alasan: {dosenRequest.admin_notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
