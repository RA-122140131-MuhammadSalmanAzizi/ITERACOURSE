import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Play, Star, Users, Clock, BookOpen, Award,
    CheckCircle, ChevronDown, ChevronUp, Share2,
    Heart, ArrowLeft, Globe, PlayCircle, FileText,
    ExternalLink, ClipboardCheck, Loader
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './CourseDetailPage.css';

const CourseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistId, setWishlistId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState([0]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id) loadCourse();
    }, [id]);

    useEffect(() => {
        if (profile && course) {
            checkEnrollment();
            checkWishlist();
        }
    }, [profile, course]);

    const loadCourse = async () => {
        setLoading(true);
        try {
            const { data: courseData, error } = await supabase
                .from('courses')
                .select('*, instructor:profiles!courses_instructor_id_fkey(id, full_name, avatar_url, email), category:categories(name)')
                .eq('id', id)
                .single();

            if (error || !courseData) {
                setCourse(null);
                setLoading(false);
                return;
            }
            setCourse(courseData);

            // Fetch chapters with contents
            const { data: chaptersData } = await supabase
                .from('chapters')
                .select('*, contents(*, quiz_questions(*))')
                .eq('course_id', id)
                .order('sort_order');
            
            if (chaptersData) {
                chaptersData.forEach(ch => {
                    if (ch.contents) {
                        ch.contents.forEach(c => {
                            if (c.type === 'exercise' && c.quiz_questions) {
                                c.questions = c.quiz_questions;
                            }
                        });
                    }
                });
            }
            setChapters(chaptersData || []);

            // Fetch approved reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('*, user:profiles!reviews_user_id_fkey(full_name, avatar_url)')
                .eq('course_id', id)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });
            setReviews(reviewsData || []);
        } catch (err) {
            console.error('Error loading course:', err);
        }
        setLoading(false);
    };

    const checkEnrollment = async () => {
        const { data } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', profile.id)
            .eq('course_id', id)
            .maybeSingle();
        setIsEnrolled(!!data);
    };

    const checkWishlist = async () => {
        const { data } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', profile.id)
            .eq('course_id', id)
            .maybeSingle();
        setIsInWishlist(!!data);
        setWishlistId(data?.id || null);
    };

    const handleEnroll = async () => {
        if (!profile) {
            navigate('/login');
            return;
        }
        if (profile.role !== 'customer') {
            alert('Fitur Enrollment hanya tersedia untuk Siswa (Customer). Anda masuk sebagai ' + profile.role);
            return;
        }
        try {
            await supabase.from('enrollments').insert({
                user_id: profile.id,
                course_id: id,
            });
            setIsEnrolled(true);
            navigate(`/watch/${id}`);
        } catch (err) {
            console.error('Enroll error:', err);
        }
    };

    const handleToggleWishlist = async () => {
        if (!profile) { navigate('/login'); return; }
        if (profile.role !== 'customer') return;

        try {
            if (isInWishlist && wishlistId) {
                await supabase.from('wishlists').delete().eq('id', wishlistId);
                setIsInWishlist(false);
                setWishlistId(null);
            } else {
                const { data } = await supabase.from('wishlists').insert({
                    user_id: profile.id,
                    course_id: id,
                }).select().single();
                setIsInWishlist(true);
                setWishlistId(data?.id);
            }
        } catch (err) {
            console.error('Wishlist error:', err);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!profile) return;
        try {
            await supabase.from('reviews').insert({
                user_id: profile.id,
                course_id: id,
                rating: reviewRating,
                comment: reviewText,
            });
            setReviewSubmitted(true);
            setShowReviewForm(false);
            setReviewText('');
            setTimeout(() => setReviewSubmitted(false), 5000);
        } catch (err) {
            console.error('Review error:', err);
        }
    };

    const toggleChapter = (index) => {
        if (expandedChapters.includes(index)) {
            setExpandedChapters(expandedChapters.filter(i => i !== index));
        } else {
            setExpandedChapters([...expandedChapters, index]);
        }
    };

    const formatPrice = (price) => {
        if (!price || price === 0) return 'Free';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    };

    // Loading state
    if (loading) {
        return (
            <div className="course-detail-page">
                <Navbar />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-500)' }} />
                </div>
                <Footer />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="course-detail-page">
                <Navbar />
                <div className="not-found">
                    <h2>Kursus tidak ditemukan</h2>
                    <Link to="/courses" className="btn btn-primary">Jelajahi Kursus</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const totalContents = chapters.reduce((acc, ch) => acc + (ch.contents?.length || 0), 0);
    const videoCount = chapters.reduce((acc, ch) => acc + (ch.contents?.filter(c => c.type === 'video').length || 0), 0);
    const quizCount = chapters.reduce((acc, ch) => acc + (ch.contents?.filter(c => c.type === 'exercise').length || 0), 0);

    return (
        <div className="course-detail-page">
            <Navbar />

            {/* Course Header */}
            <section className="course-header">
                <div className="container">
                    <div className="course-header-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '3rem', alignItems: 'start' }}>
                        <div className="course-header-content">
                            <Link to="/courses" className="back-link">
                                <ArrowLeft size={18} />
                                Kembali
                            </Link>

                            <div className="course-badges">
                                {!course.price ? (
                                    <span className="badge badge-free">Free</span>
                                ) : (
                                    <span className="badge badge-premium">Premium</span>
                                )}
                                <span className="badge badge-level">{course.level}</span>
                            </div>

                            <h1>{course.title}</h1>
                            <p className="course-subtitle">{course.description}</p>

                            <div className="course-meta-row">
                                <div className="meta-item">
                                    <Star size={16} fill="#eab308" color="#eab308" />
                                    <span className="rating-value">{course.avg_rating?.toFixed(1) || '-'}</span>
                                    <span className="rating-count">({reviews.length} reviews)</span>
                                </div>
                                <div className="meta-item">
                                    <BookOpen size={16} />
                                    <span>{totalContents} materi</span>
                                </div>
                                <div className="meta-item">
                                    <Clock size={16} />
                                    <span>{course.level}</span>
                                </div>
                            </div>

                            <div className="instructor-row">
                                <div className="instructor-avatar" style={course.instructor?.avatar_url ? {
                                    backgroundImage: `url(${course.instructor.avatar_url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    color: 'transparent',
                                } : {}}>
                                    {!course.instructor?.avatar_url && (course.instructor?.full_name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <p className="instructor-label">Dibuat oleh</p>
                                    <p className="instructor-name">{course.instructor?.full_name || 'Instructor'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="course-sidebar">
                            <div className="sidebar-card">
                                <div className="preview-video">
                                    {course.thumbnail_url ? (
                                        <img src={course.thumbnail_url} alt={course.title} />
                                    ) : (
                                        <div style={{ width: '100%', height: '200px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <BookOpen size={48} color="white" />
                                        </div>
                                    )}
                                </div>

                                <div className="sidebar-content">
                                    <div className="price-row">
                                        <span className="price">{formatPrice(course.price)}</span>
                                    </div>

                                    {isEnrolled ? (
                                        <button className="btn btn-primary btn-lg w-full" onClick={() => navigate(`/watch/${course.id}`)}>
                                            <Play size={20} />
                                            Lanjutkan Belajar
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary btn-lg w-full" onClick={handleEnroll}>
                                            {!course.price ? 'Daftar Gratis' : 'Daftar Sekarang'}
                                        </button>
                                    )}

                                    <div className="sidebar-actions">
                                        <button
                                            className={`btn w-full ${isInWishlist ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={handleToggleWishlist}
                                            disabled={profile && profile.role !== 'customer'}
                                        >
                                            <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
                                            {isInWishlist ? 'Wishlisted' : 'Tambah Wishlist'}
                                        </button>
                                        <button className="btn btn-secondary w-full" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                                            <Share2 size={18} />
                                            Bagikan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            <main className="course-main">
                <div className="container">
                    <div className="course-layout" style={{ display: 'block' }}>
                        {/* Course Content */}
                        <section className="content-section">
                            <h2>Konten Kursus</h2>
                            <div className="content-summary">
                                <span>{chapters.length} bab</span>
                                <span>•</span>
                                <span>{totalContents} materi</span>
                            </div>

                            <div className="content-types-summary">
                                <div className="content-type-item video">
                                    <PlayCircle size={16} />
                                    <span>{videoCount} Video</span>
                                </div>
                                <div className="content-type-item exercise">
                                    <ClipboardCheck size={16} />
                                    <span>{quizCount} Quiz</span>
                                </div>
                            </div>

                            <div className="passing-score-notice">
                                <ClipboardCheck size={18} />
                                <span>Lulus semua quiz dengan ≥80% untuk mendapatkan sertifikat</span>
                            </div>

                            <div className="chapters-list">
                                {chapters.map((chapter, index) => (
                                    <div key={chapter.id} className="chapter-group">
                                        <button className="chapter-title" onClick={() => toggleChapter(index)}>
                                            <span>{chapter.title}</span>
                                            <div className="chapter-right-side">
                                                <span className="chapter-meta">{chapter.contents?.length || 0} materi</span>
                                                {expandedChapters.includes(index) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </button>

                                        {expandedChapters.includes(index) && (
                                            <div className="contents-list">
                                                {(chapter.contents ? [...chapter.contents] : []).sort((a, b) => a.sort_order - b.sort_order).map((content) => (
                                                    <div
                                                        key={content.id}
                                                        className={`content-item ${content.type}`}
                                                        onClick={() => isEnrolled && navigate(`/watch/${course.id}`)}
                                                        style={{ cursor: isEnrolled ? 'pointer' : 'default' }}
                                                    >
                                                        <div className="content-icon">
                                                            {content.type === 'video' && <PlayCircle size={18} />}
                                                            {content.type === 'pdf' && <FileText size={18} />}
                                                            {content.type === 'link' && <ExternalLink size={18} />}
                                                            {content.type === 'exercise' && <ClipboardCheck size={18} />}
                                                        </div>
                                                        <div className="content-details">
                                                            <span className="content-title">{content.title}</span>
                                                            <span className="content-duration">{content.duration || ''}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Reviews */}
                        <section className="content-section">
                            <div className="reviews-header">
                                <h2>Review</h2>
                                {profile && isEnrolled && !showReviewForm && (
                                    <button className="btn btn-outline btn-sm" onClick={() => setShowReviewForm(true)}>
                                        Tulis Review
                                    </button>
                                )}
                            </div>

                            {reviewSubmitted && (
                                <div className="review-success">
                                    <CheckCircle size={20} />
                                    <span>Terima kasih! Review Anda telah dikirim untuk ditinjau.</span>
                                </div>
                            )}

                            {showReviewForm && (
                                <form className="review-form" onSubmit={handleSubmitReview}>
                                    <div className="rating-input">
                                        <label>Rating Anda</label>
                                        <div className="stars-input">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button type="button" key={star} className={`star-btn ${star <= reviewRating ? 'active' : ''}`} onClick={() => setReviewRating(star)}>
                                                    <Star size={24} fill={star <= reviewRating ? '#eab308' : 'none'} color="#eab308" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Review Anda</label>
                                        <textarea className="input" rows={4} placeholder="Bagikan pengalaman Anda..."
                                            value={reviewText} onChange={(e) => setReviewText(e.target.value)} required />
                                    </div>
                                    <div className="review-form-actions">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>Batal</button>
                                        <button type="submit" className="btn btn-primary">Kirim Review</button>
                                    </div>
                                </form>
                            )}

                            <div className="reviews-list">
                                {reviews.length > 0 ? (
                                    reviews.map(review => (
                                        <div key={review.id} className="review-card">
                                            <div className="review-header">
                                                <div className="reviewer-avatar">
                                                    {(review.user?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="reviewer-name">{review.user?.full_name}</p>
                                                    <div className="review-rating">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} fill={i < review.rating ? '#eab308' : 'none'} color="#eab308" />
                                                        ))}
                                                        <span className="review-date">{new Date(review.created_at).toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="review-text">{review.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-reviews">Belum ada review. Jadilah yang pertama!</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CourseDetailPage;
