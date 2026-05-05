import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Send, Users, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import DosenSidebar from '../../components/DosenSidebar';
import AdminSidebar from '../../components/AdminSidebar';

const NotificationsPage = () => {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Admin: send notification form
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifType, setNotifType] = useState('info');
    const [isSending, setIsSending] = useState(false);
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'send'

    const isAdmin = profile?.role === 'admin';
    const isDosen = profile?.role === 'dosen';

    useEffect(() => {
        if (profile) {
            loadNotifications();
            if (isAdmin) loadUsers();
        }
    }, [profile]);

    useEffect(() => {
        if (userSearch.trim()) {
            setFilteredUsers(allUsers.filter(u =>
                u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(userSearch.toLowerCase())
            ).slice(0, 8));
        } else {
            setFilteredUsers([]);
        }
    }, [userSearch, allUsers]);

    const loadNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error('Error load notif:', err);
        }
        setLoading(false);
    };

    const loadUsers = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .neq('role', 'admin')
                .order('full_name');
            setAllUsers(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotif = async (id) => {
        try {
            await supabase.from('notifications').delete().eq('id', id);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!selectedUser) {
            alert('Pilih penerima notifikasi!');
            return;
        }
        setIsSending(true);
        try {
            const { error } = await supabase.from('notifications').insert({
                user_id: selectedUser.id,
                sender_id: profile.id,
                title: notifTitle,
                message: notifMessage,
                type: notifType
            });
            if (error) throw error;

            alert(`Notifikasi berhasil dikirim ke ${selectedUser.full_name}!`);
            setNotifTitle('');
            setNotifMessage('');
            setSelectedUser(null);
            setUserSearch('');
            setNotifType('info');
        } catch (err) {
            alert('Gagal mengirim: ' + err.message);
        }
        setIsSending(false);
    };

    // === Inbox Content (for all roles) ===
    const inboxContent = (
        <>
            {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Memuat notifikasi...</p>
            ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <Bell size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-muted)' }}>Belum ada notifikasi.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.map(notif => (
                        <div key={notif.id} style={{
                            padding: '1.25rem',
                            borderRadius: '10px',
                            background: '#fff',
                            border: `1px solid ${notif.is_read ? 'var(--border-color)' : 'var(--primary-500)'}`,
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.4rem', color: notif.type === 'warning' ? '#ef4444' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                                        {notif.title}
                                    </h4>
                                    <p style={{ margin: '0 0 0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        {notif.message}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                                    {!notif.is_read && (
                                        <button onClick={() => markAsRead(notif.id)} style={{ background: 'transparent', border: 'none', color: '#22c55e', cursor: 'pointer', padding: '0.3rem' }} title="Tandai dibaca">
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => deleteNotif(notif.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }} title="Hapus">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    // === Send Form Content (admin only) ===
    const sendFormContent = (
        <form onSubmit={handleSendNotification} style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
            {/* User search */}
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Penerima</label>
                {selectedUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <Users size={16} color="#22c55e" />
                        <span style={{ flex: 1, fontWeight: 500 }}>{selectedUser.full_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({selectedUser.role})</span></span>
                        <button type="button" onClick={() => { setSelectedUser(null); setUserSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>×</button>
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 0.75rem', background: '#fff' }}>
                            <Search size={16} color="var(--text-muted)" />
                            <input
                                type="text"
                                placeholder="Cari nama atau email user..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: 'var(--text-primary)' }}
                            />
                        </div>
                        {filteredUsers.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                {filteredUsers.map(u => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => { setSelectedUser(u); setUserSearch(''); setFilteredUsers([]); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'left' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <div>
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{u.full_name}</span><br/>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email} · {u.role}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tipe */}
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tipe Notifikasi</label>
                <select value={notifType} onChange={e => setNotifType(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', color: 'var(--text-primary)' }}>
                    <option value="info">Info (Umum)</option>
                    <option value="warning">Peringatan / Teguran</option>
                    <option value="system">Sistem</option>
                </select>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Judul</label>
                <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    placeholder="Contoh: Pemberitahuan Penting"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
            </div>

            {/* Message */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Isi Pesan</label>
                <textarea
                    required
                    rows={4}
                    value={notifMessage}
                    onChange={e => setNotifMessage(e.target.value)}
                    placeholder="Tuliskan pesan yang ingin dikirimkan..."
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box' }}
                ></textarea>
            </div>

            <button type="submit" disabled={isSending} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: 'var(--primary-500)', color: '#fff', border: 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
            }}>
                <Send size={16} />
                {isSending ? 'Mengirim...' : 'Kirim Notifikasi'}
            </button>
        </form>
    );

    // === Page Content ===
    const content = (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                <Bell size={28} color="var(--primary-500)" />
                Notifikasi
            </h1>

            {/* Tabs for admin */}
            {isAdmin && (
                <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)' }}>
                    <button
                        onClick={() => setActiveTab('inbox')}
                        style={{
                            padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                            background: 'transparent',
                            color: activeTab === 'inbox' ? 'var(--primary-500)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'inbox' ? '2px solid var(--primary-500)' : '2px solid transparent',
                            marginBottom: '-2px'
                        }}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => setActiveTab('send')}
                        style={{
                            padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                            background: 'transparent',
                            color: activeTab === 'send' ? 'var(--primary-500)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'send' ? '2px solid var(--primary-500)' : '2px solid transparent',
                            marginBottom: '-2px'
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Send size={16} /> Kirim Notifikasi
                        </span>
                    </button>
                </div>
            )}

            {isAdmin && activeTab === 'send' ? sendFormContent : inboxContent}
        </div>
    );

    if (isAdmin) {
        return (
            <div className="admin-page" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <AdminSidebar />
                <main className="admin-main" style={{ flex: 1, padding: '2rem' }}>{content}</main>
            </div>
        );
    }

    if (isDosen) {
        return (
            <div className="dosen-page" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <DosenSidebar />
                <main className="dosen-main" style={{ flex: 1, padding: '2rem' }}>{content}</main>
            </div>
        );
    }

    // Customer view
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <div style={{ flex: 1, paddingTop: '80px' }}>{content}</div>
        </div>
    );
};

export default NotificationsPage;
