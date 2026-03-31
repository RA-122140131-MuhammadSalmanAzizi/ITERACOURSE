import { useState } from 'react';
import {
    HelpCircle, Plus, Edit3, Trash2, Search, X, Save, ChevronDown, ChevronUp, MessageCircle
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminPages.css';

// Initial FAQ data
const initialFaqs = [
    {
        id: 1,
        question: 'Bagaimana cara mendaftar akun di ITERA Course?',
        answer: 'Untuk mendaftar akun, klik tombol "Sign Up" di halaman utama. Isi formulir pendaftaran dengan nama lengkap, email, dan password. Setelah itu, Anda akan langsung bisa mengakses dashboard dan mulai belajar.',
        category: 'Akun & Registrasi',
        order: 1
    },
    {
        id: 2,
        question: 'Bagaimana cara mendaftar di sebuah course?',
        answer: 'Pada halaman Courses, pilih course yang ingin Anda ikuti, lalu klik tombol "Enroll Now" di halaman detail course. Untuk course gratis, Anda langsung terdaftar. Untuk course berbayar, Anda perlu melakukan pembayaran terlebih dahulu.',
        category: 'Pendaftaran Course',
        order: 2
    },
    {
        id: 3,
        question: 'Apakah ada course yang gratis?',
        answer: 'Ya! ITERA Course menyediakan banyak course gratis yang bisa Anda akses tanpa biaya apapun. Anda bisa memfilter course berdasarkan harga di halaman Courses untuk menemukan course gratis yang tersedia.',
        category: 'Pendaftaran Course',
        order: 3
    },
    {
        id: 4,
        question: 'Bagaimana cara mengakses materi course yang sudah saya daftar?',
        answer: 'Setelah mendaftar di sebuah course, buka Dashboard Anda, lalu pilih menu "My Courses". Di sana Anda akan menemukan semua course yang telah Anda daftar. Klik course untuk mulai belajar dan mengakses materi video, dokumen, serta quiz.',
        category: 'Pembelajaran',
        order: 4
    },
    {
        id: 5,
        question: 'Bagaimana cara mengerjakan quiz di sebuah course?',
        answer: 'Quiz tersedia di dalam materi course. Saat Anda mengakses konten course, klik pada materi quiz yang tersedia. Quiz akan terbuka dalam mode fullscreen. Jawab semua pertanyaan dan submit untuk melihat skor Anda.',
        category: 'Pembelajaran',
        order: 5
    },
    {
        id: 6,
        question: 'Bagaimana cara mendapatkan sertifikat?',
        answer: 'Untuk mendapatkan sertifikat, Anda harus menyelesaikan seluruh materi dalam sebuah course (progress 100%). Setelah course selesai, tombol "Claim Certificate" akan muncul di halaman course. Klik tombol tersebut untuk mengklaim sertifikat digital Anda.',
        category: 'Sertifikat',
        order: 6
    },
    {
        id: 7,
        question: 'Bagaimana cara memverifikasi keaslian sertifikat?',
        answer: 'Di halaman utama ITERA Course, terdapat fitur "Verify Certificate". Masukkan ID sertifikat (contoh: CERT-001-2024) pada kolom yang tersedia, lalu klik "Verify Certificate". Sistem akan menampilkan informasi sertifikat jika valid.',
        category: 'Sertifikat',
        order: 7
    },
    {
        id: 8,
        question: 'Dimana saya bisa melihat semua sertifikat saya?',
        answer: 'Anda dapat melihat semua sertifikat yang telah Anda peroleh di menu "My Certificates" pada Dashboard Anda, atau melalui dropdown profil di Navbar dengan mengklik "My Certificates".',
        category: 'Sertifikat',
        order: 8
    },
    {
        id: 9,
        question: 'Bagaimana cara memberikan review pada sebuah course?',
        answer: 'Setelah Anda mengikuti sebuah course, Anda dapat memberikan review di halaman detail course tersebut. Berikan rating bintang (1-5) dan tuliskan komentar Anda. Review akan ditinjau oleh admin sebelum dipublikasikan.',
        category: 'Review & Rating',
        order: 9
    },
    {
        id: 10,
        question: 'Apa itu Wishlist dan bagaimana cara menggunakannya?',
        answer: 'Wishlist adalah fitur untuk menyimpan course yang ingin Anda ambil di kemudian hari. Klik ikon hati/bookmark pada kartu course untuk menambahkannya ke Wishlist. Anda bisa mengakses daftar Wishlist dari Dashboard.',
        category: 'Fitur Lainnya',
        order: 10
    },
    {
        id: 11,
        question: 'Bagaimana cara mengubah profil saya?',
        answer: 'Klik avatar/nama Anda di Navbar, kemudian pilih "Profile". Di halaman Profile, Anda bisa mengedit informasi pribadi seperti nama, email, dan foto profil.',
        category: 'Akun & Registrasi',
        order: 11
    },
    {
        id: 12,
        question: 'Bagaimana cara mengganti tema (Dark/Light Mode)?',
        answer: 'Klik ikon matahari/bulan di Navbar untuk beralih antara Dark Mode dan Light Mode. Preferensi tema Anda akan tersimpan secara otomatis untuk kunjungan berikutnya.',
        category: 'Fitur Lainnya',
        order: 12
    },
    {
        id: 13,
        question: 'Siapa yang bisa meng-upload course?',
        answer: 'Hanya pengguna dengan role "Dosen" (Lecturer) yang dapat meng-upload dan mengelola course. Jika Anda seorang pengajar dan ingin membuat course, hubungi administrator untuk mendapatkan akses dosen.',
        category: 'Pendaftaran Course',
        order: 13
    },
    {
        id: 14,
        question: 'Apakah saya bisa belajar di perangkat mobile?',
        answer: 'Ya! ITERA Course adalah platform berbasis web yang responsif, sehingga Anda bisa mengaksesnya dari browser di smartphone, tablet, maupun komputer tanpa perlu menginstall aplikasi tambahan.',
        category: 'Fitur Lainnya',
        order: 14
    },
    {
        id: 15,
        question: 'Bagaimana jika saya lupa password?',
        answer: 'Pada halaman Login, klik "Lupa Password". Masukkan email yang terdaftar, dan instruksi reset password akan dikirimkan ke email Anda. Ikuti langkah-langkah di email untuk membuat password baru.',
        category: 'Akun & Registrasi',
        order: 15
    }
];

const faqCategories = ['Semua', 'Akun & Registrasi', 'Pendaftaran Course', 'Pembelajaran', 'Sertifikat', 'Review & Rating', 'Fitur Lainnya'];

const AdminFAQ = () => {
    const [faqs, setFaqs] = useState(initialFaqs);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Semua');
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [formData, setFormData] = useState({ question: '', answer: '', category: 'Akun & Registrasi' });
    const [expandedFaq, setExpandedFaq] = useState(null);

    // Filter FAQs
    const filteredFaqs = faqs.filter(faq => {
        const matchSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = filterCategory === 'Semua' || faq.category === filterCategory;
        return matchSearch && matchCategory;
    });

    // Category counts
    const getCategoryCount = (cat) => {
        if (cat === 'Semua') return faqs.length;
        return faqs.filter(f => f.category === cat).length;
    };

    // Open modal for add
    const handleAdd = () => {
        setEditingFaq(null);
        setFormData({ question: '', answer: '', category: 'Akun & Registrasi' });
        setShowModal(true);
    };

    // Open modal for edit
    const handleEdit = (faq) => {
        setEditingFaq(faq);
        setFormData({ question: faq.question, answer: faq.answer, category: faq.category });
        setShowModal(true);
    };

    // Delete FAQ
    const handleDelete = (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus FAQ ini?')) {
            setFaqs(faqs.filter(f => f.id !== id));
        }
    };

    // Save FAQ (add or edit)
    const handleSave = () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            alert('Pertanyaan dan jawaban harus diisi.');
            return;
        }

        if (editingFaq) {
            // Update existing
            setFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, ...formData } : f));
        } else {
            // Add new
            const newFaq = {
                id: Math.max(...faqs.map(f => f.id), 0) + 1,
                ...formData,
                order: faqs.length + 1
            };
            setFaqs([...faqs, newFaq]);
        }
        setShowModal(false);
        setEditingFaq(null);
        setFormData({ question: '', answer: '', category: 'Akun & Registrasi' });
    };

    return (
        <div className="admin-page">
            <AdminSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>FAQ Management</h1>
                        <p>Kelola pertanyaan yang sering diajukan pengguna</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} />
                        Tambah FAQ
                    </button>
                </header>

                {/* Stats Summary */}
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card primary" style={{ cursor: 'pointer' }} onClick={() => setFilterCategory('Semua')}>
                        <div className="stat-header">
                            <div className="stat-icon"><HelpCircle size={24} /></div>
                        </div>
                        <p className="stat-value">{faqs.length}</p>
                        <p className="stat-label">Total FAQ</p>
                    </div>
                    <div className="stat-card secondary" style={{ cursor: 'pointer' }} onClick={() => setFilterCategory('Akun & Registrasi')}>
                        <div className="stat-header">
                            <div className="stat-icon"><MessageCircle size={24} /></div>
                        </div>
                        <p className="stat-value">{getCategoryCount('Akun & Registrasi')}</p>
                        <p className="stat-label">Akun & Registrasi</p>
                    </div>
                    <div className="stat-card success" style={{ cursor: 'pointer' }} onClick={() => setFilterCategory('Sertifikat')}>
                        <div className="stat-header">
                            <div className="stat-icon"><HelpCircle size={24} /></div>
                        </div>
                        <p className="stat-value">{getCategoryCount('Sertifikat')}</p>
                        <p className="stat-label">Sertifikat</p>
                    </div>
                    <div className="stat-card warning" style={{ cursor: 'pointer' }} onClick={() => setFilterCategory('Pembelajaran')}>
                        <div className="stat-header">
                            <div className="stat-icon"><MessageCircle size={24} /></div>
                        </div>
                        <p className="stat-value">{getCategoryCount('Pembelajaran')}</p>
                        <p className="stat-label">Pembelajaran</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar-inline">
                    <div className="search-minimal">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Cari FAQ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-btn" onClick={() => setSearchTerm('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <select
                        className="filter-select"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        {faqCategories.map(cat => (
                            <option key={cat} value={cat}>{cat} ({getCategoryCount(cat)})</option>
                        ))}
                    </select>
                </div>

                {/* FAQ List */}
                <div className="content-section">
                    <div className="section-header">
                        <h2>{filterCategory === 'Semua' ? 'Semua' : filterCategory} FAQ ({filteredFaqs.length})</h2>
                    </div>

                    {filteredFaqs.length > 0 ? (
                        <div className="faqs-admin-list">
                            {filteredFaqs.map(faq => (
                                <div key={faq.id} className="faq-admin-item">
                                    <div
                                        className="faq-admin-header"
                                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                    >
                                        <div className="faq-admin-left">
                                            <div className="faq-admin-icon">
                                                <HelpCircle size={18} />
                                            </div>
                                            <div className="faq-admin-info">
                                                <h4>{faq.question}</h4>
                                                <span className="faq-category-badge">{faq.category}</span>
                                            </div>
                                        </div>
                                        <div className="faq-admin-actions">
                                            <button
                                                className="btn-icon"
                                                title="Edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(faq);
                                                }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                className="btn-icon text-error"
                                                title="Hapus"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(faq.id);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {expandedFaq === faq.id ?
                                                <ChevronUp size={18} className="faq-chevron" /> :
                                                <ChevronDown size={18} className="faq-chevron" />
                                            }
                                        </div>
                                    </div>
                                    {expandedFaq === faq.id && (
                                        <div className="faq-admin-answer">
                                            <p>{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <HelpCircle size={48} className="text-primary" />
                            <h3>Tidak Ada FAQ</h3>
                            <p>Tidak ada FAQ yang cocok dengan filter Anda.</p>
                        </div>
                    )}
                </div>

                {/* Modal Add/Edit */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                            <div className="modal-body">
                                <h2>{editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    {editingFaq ? 'Ubah pertanyaan dan jawaban FAQ.' : 'Buat FAQ baru untuk membantu pengguna.'}
                                </p>

                                <div className="form-group">
                                    <label>Kategori</label>
                                    <select
                                        className="input"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {faqCategories.filter(c => c !== 'Semua').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Pertanyaan</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Tuliskan pertanyaan..."
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Jawaban</label>
                                    <textarea
                                        className="input"
                                        rows={5}
                                        placeholder="Tuliskan jawaban..."
                                        value={formData.answer}
                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                        Batal
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Save size={16} />
                                        {editingFaq ? 'Simpan Perubahan' : 'Tambah FAQ'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminFAQ;
