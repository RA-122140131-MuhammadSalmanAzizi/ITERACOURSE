import { useState, useEffect } from 'react';
import {
    Search, Edit, UserX, UserCheck, CheckCircle, XCircle,
    Clock, AlertCircle, ChevronDown, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';
import * as dosenRequestService from '../../services/dosenRequestService';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminPages.css';

const AdminUsers = () => {
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [usersList, setUsersList] = useState([]);
    const [dosenRequests, setDosenRequests] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');

    // Review modal state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    // Fetch users from Supabase
    useEffect(() => {
        fetchUsers();
        fetchDosenRequests();
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await authService.getAllUsers();
            setUsersList(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Gagal memuat data pengguna');
        }
        setLoadingUsers(false);
    };

    const fetchDosenRequests = async () => {
        setLoadingRequests(true);
        try {
            const [requests, count] = await Promise.all([
                dosenRequestService.getAllDosenRequests(),
                dosenRequestService.getPendingDosenRequestCount(),
            ]);
            setDosenRequests(requests || []);
            setPendingCount(count);
        } catch (err) {
            console.error('Error fetching dosen requests:', err);
        }
        setLoadingRequests(false);
    };

    const filteredUsers = usersList.filter(user => {
        const matchesSearch = (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // ===== Role Change =====
    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    const handleRoleChange = async () => {
        if (!selectedUser || !newRole) return;
        setProcessing(true);
        try {
            await authService.updateUserRole(selectedUser.id, newRole);
            setUsersList(usersList.map(u =>
                u.id === selectedUser.id ? { ...u, role: newRole } : u
            ));
            setShowRoleModal(false);
            setSelectedUser(null);
        } catch (err) {
            alert('Gagal mengubah role: ' + err.message);
        }
        setProcessing(false);
    };

    // ===== Toggle Active Status =====
    const handleToggleActive = async (userId, currentStatus) => {
        const newStatus = !currentStatus;
        const action = newStatus ? 'mengaktifkan' : 'menonaktifkan';
        if (!window.confirm(`Yakin ingin ${action} user ini?`)) return;

        try {
            await authService.toggleUserActive(userId, newStatus);
            setUsersList(usersList.map(u =>
                u.id === userId ? { ...u, is_active: newStatus } : u
            ));
        } catch (err) {
            alert('Gagal mengubah status: ' + err.message);
        }
    };

    // ===== Dosen Request Review =====
    const openReviewModal = (request) => {
        setSelectedRequest(request);
        setAdminNotes('');
        setShowReviewModal(true);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setProcessing(true);
        try {
            await dosenRequestService.approveDosenRequest(
                selectedRequest.id,
                authUser.id,
                adminNotes
            );
            await fetchDosenRequests();
            await fetchUsers(); // Refresh users to reflect role change
            setShowReviewModal(false);
        } catch (err) {
            alert('Gagal menyetujui: ' + err.message);
        }
        setProcessing(false);
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        if (!adminNotes.trim()) {
            alert('Harap berikan alasan penolakan.');
            return;
        }
        setProcessing(true);
        try {
            await dosenRequestService.rejectDosenRequest(
                selectedRequest.id,
                authUser.id,
                adminNotes
            );
            await fetchDosenRequests();
            setShowReviewModal(false);
        } catch (err) {
            alert('Gagal menolak: ' + err.message);
        }
        setProcessing(false);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', icon: Clock },
            approved: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', icon: CheckCircle },
            rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', icon: XCircle },
        };
        const s = styles[status] || styles.pending;
        const Icon = s.icon;
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem',
                background: s.bg, color: s.color, fontWeight: 500,
            }}>
                <Icon size={14} /> {status}
            </span>
        );
    };

    return (
        <div className="admin-page">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Users Management</h1>
                        <p>Kelola pengguna dan permintaan role dosen</p>
                    </div>
                </header>

                {/* Tabs */}
                <div style={{
                    display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
                    borderBottom: '1px solid var(--border-color)', paddingBottom: '0',
                }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '0.75rem 1.25rem', border: 'none', cursor: 'pointer',
                            background: 'none', fontSize: '0.95rem', fontWeight: 500,
                            color: activeTab === 'users' ? 'var(--primary-500)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'users' ? '2px solid var(--primary-500)' : '2px solid transparent',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Semua Pengguna ({usersList.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        style={{
                            padding: '0.75rem 1.25rem', border: 'none', cursor: 'pointer',
                            background: 'none', fontSize: '0.95rem', fontWeight: 500,
                            color: activeTab === 'requests' ? 'var(--primary-500)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'requests' ? '2px solid var(--primary-500)' : '2px solid transparent',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                        }}
                    >
                        Permintaan Dosen
                        {pendingCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '0.25rem', right: '-0.25rem',
                                background: '#ef4444', color: '#fff', borderRadius: '999px',
                                padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 700,
                                minWidth: '18px', textAlign: 'center',
                            }}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <section className="content-section">
                        <div className="filter-bar">
                            <div className="search-input">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari pengguna..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                                <option value="all">Semua Role</option>
                                <option value="customer">Customer</option>
                                <option value="dosen">Dosen</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {loadingUsers ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                Memuat data pengguna...
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Bergabung</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                                    Tidak ada pengguna ditemukan
                                                </td>
                                            </tr>
                                        ) : filteredUsers.map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-info">
                                                        <div className="user-avatar" style={user.avatar_url ? {
                                                            backgroundImage: `url(${user.avatar_url})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            color: 'transparent',
                                                        } : {}}>
                                                            {!user.avatar_url && (user.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <p className="user-name">{user.full_name}</p>
                                                            <p className="user-email">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                                        {user.is_active ? 'active' : 'inactive'}
                                                    </span>
                                                </td>
                                                <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => openRoleModal(user)}
                                                            title="Ubah Role"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className={`action-btn ${user.is_active ? 'reject' : ''}`}
                                                            onClick={() => handleToggleActive(user.id, user.is_active)}
                                                            title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                            style={!user.is_active ? { color: '#22c55e' } : {}}
                                                        >
                                                            {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {/* Dosen Requests Tab */}
                {activeTab === 'requests' && (
                    <section className="content-section">
                        {loadingRequests ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                Memuat permintaan...
                            </div>
                        ) : dosenRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <p>Belum ada permintaan role dosen</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {dosenRequests.map(req => (
                                    <div key={req.id} style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '1.25rem',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: 'var(--primary-500)', color: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden',
                                                    ...(req.profiles?.avatar_url ? {
                                                        backgroundImage: `url(${req.profiles.avatar_url})`,
                                                        backgroundSize: 'cover', color: 'transparent',
                                                    } : {}),
                                                }}>
                                                    {!req.profiles?.avatar_url && (req.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{req.full_name}</p>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{req.email}</p>
                                                </div>
                                            </div>
                                            {getStatusBadge(req.status)}
                                        </div>

                                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {req.department && <span><strong>Jurusan:</strong> {req.department}</span>}
                                            {req.staff_id && <span><strong>NIP/NIDN:</strong> {req.staff_id}</span>}
                                            <span><strong>Tanggal:</strong> {new Date(req.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>

                                        {req.reason && (
                                            <p style={{
                                                marginTop: '0.5rem', fontSize: '0.9rem',
                                                color: 'var(--text-secondary)', fontStyle: 'italic',
                                                background: 'var(--bg-primary)', padding: '0.75rem',
                                                borderRadius: '8px', borderLeft: '3px solid var(--primary-500)',
                                            }}>
                                                "{req.reason}"
                                            </p>
                                        )}

                                        {req.admin_notes && (
                                            <p style={{
                                                marginTop: '0.5rem', fontSize: '0.85rem',
                                                color: req.status === 'approved' ? '#22c55e' : '#ef4444',
                                            }}>
                                                <strong>Catatan admin:</strong> {req.admin_notes}
                                            </p>
                                        )}

                                        {req.status === 'pending' && (
                                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => openReviewModal(req)}
                                                    style={{
                                                        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                                                        background: 'var(--primary-500)', color: '#fff',
                                                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                                                    }}
                                                >
                                                    Review Permintaan
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Role Change Modal */}
                {showRoleModal && selectedUser && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    }}>
                        <div style={{
                            background: 'var(--bg-secondary)', borderRadius: '16px',
                            padding: '1.5rem', maxWidth: '400px', width: '100%',
                            border: '1px solid var(--border-color)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Ubah Role</h3>
                                <button onClick={() => setShowRoleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                <strong>{selectedUser.full_name}</strong><br />
                                <span style={{ fontSize: '0.85rem' }}>{selectedUser.email}</span>
                            </p>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '1rem',
                                }}
                            >
                                <option value="customer">Customer</option>
                                <option value="dosen">Dosen</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowRoleModal(false)}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '8px',
                                        border: '1px solid var(--border-color)', background: 'none',
                                        color: 'var(--text-primary)', cursor: 'pointer',
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleRoleChange}
                                    disabled={processing || newRole === selectedUser.role}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                                        background: 'var(--primary-500)', color: '#fff',
                                        cursor: processing ? 'wait' : 'pointer', opacity: newRole === selectedUser.role ? 0.5 : 1,
                                    }}
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Dosen Request Modal */}
                {showReviewModal && selectedRequest && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    }}>
                        <div style={{
                            background: 'var(--bg-secondary)', borderRadius: '16px',
                            padding: '1.5rem', maxWidth: '500px', width: '100%',
                            border: '1px solid var(--border-color)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Review Permintaan Dosen</h3>
                                <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{
                                background: 'var(--bg-primary)', borderRadius: '8px',
                                padding: '1rem', marginBottom: '1rem',
                            }}>
                                <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedRequest.full_name}</p>
                                <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedRequest.email}</p>
                                {selectedRequest.department && (
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <strong>Jurusan:</strong> {selectedRequest.department}
                                    </p>
                                )}
                                {selectedRequest.staff_id && (
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <strong>NIP/NIDN:</strong> {selectedRequest.staff_id}
                                    </p>
                                )}
                                {selectedRequest.reason && (
                                    <p style={{
                                        margin: '0.5rem 0 0', fontSize: '0.85rem', fontStyle: 'italic',
                                        color: 'var(--text-secondary)',
                                    }}>
                                        "{selectedRequest.reason}"
                                    </p>
                                )}
                            </div>

                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Catatan Admin (wajib diisi jika ditolak)
                            </label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Tulis catatan atau alasan..."
                                rows={3}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical',
                                    marginBottom: '1rem', fontFamily: 'inherit',
                                }}
                            />

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '8px',
                                        border: '1px solid var(--border-color)', background: 'none',
                                        color: 'var(--text-primary)', cursor: 'pointer',
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={processing}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                                        background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                                        cursor: processing ? 'wait' : 'pointer', fontWeight: 500,
                                    }}
                                >
                                    {processing ? '...' : 'Tolak'}
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                                        background: '#22c55e', color: '#fff',
                                        cursor: processing ? 'wait' : 'pointer', fontWeight: 500,
                                    }}
                                >
                                    {processing ? '...' : 'Setujui'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminUsers;
