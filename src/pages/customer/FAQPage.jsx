import { useState, useRef, useEffect } from 'react';
import {
    HelpCircle, Search, ChevronDown, ChevronUp, X,
    BookOpen, Award, MessageSquare, UserPlus, Settings, Sparkles,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './FAQPage.css';

// FAQ data matching the admin panel
const faqData = [
    {
        id: 1,
        question: 'Bagaimana cara mendaftar akun di ITERA Course?',
        answer: 'Untuk mendaftar akun, klik tombol "Sign Up" di halaman utama. Isi formulir pendaftaran dengan nama lengkap, email, dan password. Setelah itu, Anda akan langsung bisa mengakses dashboard dan mulai belajar.',
        category: 'Akun & Registrasi'
    },
    {
        id: 2,
        question: 'Bagaimana cara mendaftar di sebuah course?',
        answer: 'Pada halaman Courses, pilih course yang ingin Anda ikuti, lalu klik tombol "Enroll Now" di halaman detail course. Untuk course gratis, Anda langsung terdaftar. Untuk course berbayar, Anda perlu melakukan pembayaran terlebih dahulu.',
        category: 'Pendaftaran Course'
    },
    {
        id: 3,
        question: 'Apakah ada course yang gratis?',
        answer: 'Ya! ITERA Course menyediakan banyak course gratis yang bisa Anda akses tanpa biaya apapun. Anda bisa memfilter course berdasarkan harga di halaman Courses untuk menemukan course gratis yang tersedia.',
        category: 'Pendaftaran Course'
    },
    {
        id: 4,
        question: 'Bagaimana cara mengakses materi course yang sudah saya daftar?',
        answer: 'Setelah mendaftar di sebuah course, buka Dashboard Anda, lalu pilih menu "My Courses". Di sana Anda akan menemukan semua course yang telah Anda daftar. Klik course untuk mulai belajar dan mengakses materi video, dokumen, serta quiz.',
        category: 'Pembelajaran'
    },
    {
        id: 5,
        question: 'Bagaimana cara mengerjakan quiz di sebuah course?',
        answer: 'Quiz tersedia di dalam materi course. Saat Anda mengakses konten course, klik pada materi quiz yang tersedia. Quiz akan terbuka dalam mode fullscreen. Jawab semua pertanyaan dan submit untuk melihat skor Anda.',
        category: 'Pembelajaran'
    },
    {
        id: 6,
        question: 'Bagaimana cara mendapatkan sertifikat?',
        answer: 'Untuk mendapatkan sertifikat, Anda harus menyelesaikan seluruh materi dalam sebuah course (progress 100%). Setelah course selesai, tombol "Claim Certificate" akan muncul di halaman course. Klik tombol tersebut untuk mengklaim sertifikat digital Anda.',
        category: 'Sertifikat'
    },
    {
        id: 7,
        question: 'Bagaimana cara memverifikasi keaslian sertifikat?',
        answer: 'Di halaman utama ITERA Course, terdapat fitur "Verify Certificate". Masukkan ID sertifikat (contoh: CERT-001-2024) pada kolom yang tersedia, lalu klik "Verify Certificate". Sistem akan menampilkan informasi sertifikat jika valid.',
        category: 'Sertifikat'
    },
    {
        id: 8,
        question: 'Dimana saya bisa melihat semua sertifikat saya?',
        answer: 'Anda dapat melihat semua sertifikat yang telah Anda peroleh di menu "My Certificates" pada Dashboard Anda, atau melalui dropdown profil di Navbar dengan mengklik "My Certificates".',
        category: 'Sertifikat'
    },
    {
        id: 9,
        question: 'Bagaimana cara memberikan review pada sebuah course?',
        answer: 'Setelah Anda mengikuti sebuah course, Anda dapat memberikan review di halaman detail course tersebut. Berikan rating bintang (1-5) dan tuliskan komentar Anda. Review akan ditinjau oleh admin sebelum dipublikasikan.',
        category: 'Review & Rating'
    },
    {
        id: 10,
        question: 'Apa itu Wishlist dan bagaimana cara menggunakannya?',
        answer: 'Wishlist adalah fitur untuk menyimpan course yang ingin Anda ambil di kemudian hari. Klik ikon hati/bookmark pada kartu course untuk menambahkannya ke Wishlist. Anda bisa mengakses daftar Wishlist dari Dashboard.',
        category: 'Fitur Lainnya'
    },
    {
        id: 11,
        question: 'Bagaimana cara mengubah profil saya?',
        answer: 'Klik avatar/nama Anda di Navbar, kemudian pilih "Profile". Di halaman Profile, Anda bisa mengedit informasi pribadi seperti nama, email, dan foto profil.',
        category: 'Akun & Registrasi'
    },
    {
        id: 12,
        question: 'Bagaimana cara mengganti tema (Dark/Light Mode)?',
        answer: 'Klik ikon matahari/bulan di Navbar untuk beralih antara Dark Mode dan Light Mode. Preferensi tema Anda akan tersimpan secara otomatis untuk kunjungan berikutnya.',
        category: 'Fitur Lainnya'
    },
    {
        id: 13,
        question: 'Siapa yang bisa meng-upload course?',
        answer: 'Hanya pengguna dengan role "Dosen" (Lecturer) yang dapat meng-upload dan mengelola course. Jika Anda seorang pengajar dan ingin membuat course, hubungi administrator untuk mendapatkan akses dosen.',
        category: 'Pendaftaran Course'
    },
    {
        id: 14,
        question: 'Apakah saya bisa belajar di perangkat mobile?',
        answer: 'Ya! ITERA Course adalah platform berbasis web yang responsif, sehingga Anda bisa mengaksesnya dari browser di smartphone, tablet, maupun komputer tanpa perlu menginstall aplikasi tambahan.',
        category: 'Fitur Lainnya'
    },
    {
        id: 15,
        question: 'Bagaimana jika saya lupa password?',
        answer: 'Pada halaman Login, klik "Lupa Password". Masukkan email yang terdaftar, dan instruksi reset password akan dikirimkan ke email Anda. Ikuti langkah-langkah di email untuk membuat password baru.',
        category: 'Akun & Registrasi'
    }
];

const categories = [
    { name: 'Semua', icon: Sparkles },
    { name: 'Akun & Registrasi', icon: UserPlus },
    { name: 'Pendaftaran Course', icon: BookOpen },
    { name: 'Pembelajaran', icon: MessageSquare },
    { name: 'Sertifikat', icon: Award },
    { name: 'Review & Rating', icon: Settings },
    { name: 'Fitur Lainnya', icon: Settings }
];

const FAQPage = () => {
    const { profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [expandedId, setExpandedId] = useState(null);
    const carouselRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const [showContactModal, setShowContactModal] = useState(false);
    const [messageTitle, setMessageTitle] = useState('');
    const [messageText, setMessageText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!profile) {
            alert("Anda harus login untuk mengirim pesan.");
            return;
        }
        setIsSubmitting(true);
        try {
            // Fetch admins
            const { data: admins, error: adminErr } = await supabase.from('profiles').select('id').eq('role', 'admin');
            if (adminErr) throw adminErr;

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    sender_id: profile.id,
                    title: `Pesan dari ${profile.full_name || 'User'} (${profile.email}): ${messageTitle}`,
                    message: messageText,
                    type: 'info',
                    is_read: false
                }));

                const { error: insertErr } = await supabase.from('notifications').insert(notifications);
                if (insertErr) throw insertErr;
                
                alert('Pesan berhasil dikirim ke Admin!');
                setShowContactModal(false);
                setMessageTitle('');
                setMessageText('');
            } else {
                alert('Tidak ada Admin yang ditemukan.');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Gagal mengirim pesan.');
        }
        setIsSubmitting(false);
    };

    const filteredFaqs = faqData.filter(faq => {
        const matchSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategory = activeCategory === 'Semua' || faq.category === activeCategory;
        return matchSearch && matchCategory;
    });

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Check scroll availability
    const updateScrollButtons = () => {
        const el = carouselRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    // Auto-scroll carousel
    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        updateScrollButtons();

        let direction = 1;
        const interval = setInterval(() => {
            if (!el) return;
            const maxScroll = el.scrollWidth - el.clientWidth;
            if (el.scrollLeft >= maxScroll) direction = -1;
            if (el.scrollLeft <= 0) direction = 1;
            el.scrollBy({ left: direction * 1, behavior: 'auto' });
        }, 30);

        el.addEventListener('scroll', updateScrollButtons);

        // Pause auto-scroll on hover
        const pause = () => clearInterval(interval);
        el.addEventListener('mouseenter', pause);

        return () => {
            clearInterval(interval);
            el.removeEventListener('scroll', updateScrollButtons);
            el.removeEventListener('mouseenter', pause);
        };
    }, []);

    const scrollCarousel = (dir) => {
        const el = carouselRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * 200, behavior: 'smooth' });
    };

    return (
        <div className="faq-page">
            <Navbar />

            {/* Hero Section */}
            <section className="faq-hero">
                <div className="faq-hero-content">
                    <h1>Frequently Asked Questions</h1>
                    <p>Temukan jawaban untuk pertanyaan yang sering diajukan tentang ITERA Course</p>

                    <div className="faq-search-bar">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Cari pertanyaan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="faq-search-clear" onClick={() => setSearchQuery('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="faq-content">
                <div className="faq-container">
                    {/* Category Tabs Carousel */}
                    <div className="faq-categories-wrapper">
                        {canScrollLeft && (
                            <button className="faq-carousel-arrow left" onClick={() => scrollCarousel(-1)}>
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <div className="faq-categories" ref={carouselRef}>
                            {categories.map(cat => {
                                const IconComp = cat.icon;
                                const count = cat.name === 'Semua'
                                    ? faqData.length
                                    : faqData.filter(f => f.category === cat.name).length;
                                return (
                                    <button
                                        key={cat.name}
                                        className={`faq-category-btn ${activeCategory === cat.name ? 'active' : ''}`}
                                        onClick={() => { setActiveCategory(cat.name); setExpandedId(null); }}
                                    >
                                        <IconComp size={16} />
                                        <span>{cat.name}</span>
                                        <span className="faq-cat-count">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {canScrollRight && (
                            <button className="faq-carousel-arrow right" onClick={() => scrollCarousel(1)}>
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>

                    {/* FAQ Items */}
                    <div className="faq-list">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, index) => (
                                <div
                                    key={faq.id}
                                    className={`faq-item ${expandedId === faq.id ? 'expanded' : ''}`}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <button
                                        className="faq-question"
                                        onClick={() => toggleExpand(faq.id)}
                                        id={`faq-question-${faq.id}`}
                                    >
                                        <div className="faq-q-left">
                                            <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                                            <span className="faq-q-text">{faq.question}</span>
                                        </div>
                                        <div className="faq-q-right">
                                            <span className="faq-q-category">{faq.category}</span>
                                            {expandedId === faq.id ?
                                                <ChevronUp size={20} className="faq-chevron-icon" /> :
                                                <ChevronDown size={20} className="faq-chevron-icon" />
                                            }
                                        </div>
                                    </button>
                                    {expandedId === faq.id && (
                                        <div className="faq-answer">
                                            <p>{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="faq-empty">
                                <HelpCircle size={56} />
                                <h3>Tidak ada FAQ ditemukan</h3>
                                <p>Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => { setSearchQuery(''); setActiveCategory('Semua'); }}
                                >
                                    Reset Filter
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Contact CTA */}
                    <div className="faq-contact-cta">
                        <div className="faq-cta-icon">
                            <MessageSquare size={32} />
                        </div>
                        <h3>Masih punya pertanyaan?</h3>
                        <p>Jika Anda tidak menemukan jawaban yang dicari, jangan ragu untuk menghubungi tim support kami.</p>
                        <button onClick={() => {
                            if (!profile) {
                                alert("Silakan login terlebih dahulu untuk menghubungi Admin.");
                                return;
                            }
                            setShowContactModal(true);
                        }} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            Hubungi Kami
                        </button>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Modal Hubungi Kami */}
            {showContactModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'var(--bg-primary)', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Kirim Pesan ke Admin</h2>
                            <button onClick={() => setShowContactModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSendMessage} style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#3b82f6' }}>
                                    Pesan Anda akan masuk ke Inbox Admin dan segera ditindaklanjuti.
                                </p>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Judul Pesan</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    value={messageTitle} 
                                    onChange={(e) => setMessageTitle(e.target.value)} 
                                    placeholder="Contoh: Bantuan pendaftaran kursus"
                                    required 
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Isi Pesan</label>
                                <textarea 
                                    className="input" 
                                    rows={5} 
                                    value={messageText} 
                                    onChange={(e) => setMessageText(e.target.value)} 
                                    placeholder="Tuliskan pertanyaan atau kendala Anda secara detail..."
                                    required 
                                    style={{ width: '100%', resize: 'vertical' }}
                                ></textarea>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowContactModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FAQPage;
