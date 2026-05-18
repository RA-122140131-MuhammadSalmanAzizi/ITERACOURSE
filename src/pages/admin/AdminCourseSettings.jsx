import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Save, X, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminPages.css';

const AdminCourseSettings = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState('BookOpen');
    const [showAddForm, setShowAddForm] = useState(false);

    const iconOptions = ['Globe', 'Code', 'Palette', 'BarChart2', 'Megaphone', 'Briefcase', 'BookOpen', 'MoreHorizontal'];

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const { data } = await supabase.from('categories').select('*').order('name');
            setCategories(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            const { data, error } = await supabase.from('categories').insert({
                name: newName.trim(),
                icon: newIcon,
            }).select().single();
            if (error) throw error;
            setCategories([...categories, data]);
            setNewName('');
            setShowAddForm(false);
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleEdit = async (id) => {
        try {
            await supabase.from('categories').update({ name: editName, icon: editIcon }).eq('id', id);
            setCategories(categories.map(c => c.id === id ? { ...c, name: editName, icon: editIcon } : c));
            setEditingId(null);
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;
        try {
            await supabase.from('categories').delete().eq('id', id);
            setCategories(categories.filter(c => c.id !== id));
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <div className="admin-page">
            <AdminSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div><h1>Pengaturan Kursus</h1><p>Kelola kategori kursus</p></div>
                    <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Tambah Kategori
                    </button>
                </header>

                <section className="content-section">
                    {showAddForm && (
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1rem', background: 'var(--bg-primary)' }}>
                            <h3 style={{ margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>Kategori Baru</h3>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Nama</label>
                                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Nama kategori"
                                        style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Icon</label>
                                    <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                                        style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    >
                                        {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                    </select>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={handleAdd}><Save size={14} /> Simpan</button>
                                <button className="btn btn-outline btn-sm" onClick={() => setShowAddForm(false)}><X size={14} /> Batal</button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat...</p>
                    ) : categories.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Settings size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Belum ada kategori</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Nama</th><th>Icon</th><th>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {categories.map(cat => (
                                        <tr key={cat.id}>
                                            <td>
                                                {editingId === cat.id ? (
                                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                                        style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                                    />
                                                ) : (
                                                    <strong style={{ color: 'var(--text-primary)' }}>{cat.name}</strong>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === cat.id ? (
                                                    <select value={editIcon} onChange={(e) => setEditIcon(e.target.value)}
                                                        style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                                    >
                                                        {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                                    </select>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>{cat.icon || '-'}</span>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === cat.id ? (
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button onClick={() => handleEdit(cat.id)} style={{ padding: '0.35rem', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', border: 'none', color: '#22c55e', cursor: 'pointer' }}><Save size={16} /></button>
                                                        <button onClick={() => setEditingId(null)} style={{ padding: '0.35rem', borderRadius: '6px', background: 'rgba(148,163,184,0.1)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditIcon(cat.icon || 'BookOpen'); }}
                                                            style={{ padding: '0.35rem', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit size={16} /></button>
                                                        <button onClick={() => handleDelete(cat.id)}
                                                            style={{ padding: '0.35rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                    </div>
                                                )}
                                            </td>
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

export default AdminCourseSettings;
