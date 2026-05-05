import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Play, Star, Users, BookOpen, Award, ArrowRight, ArrowUp, ArrowDown,
    CheckCircle, TrendingUp, Clock, Search, XCircle, Youtube,
    Globe, Code, Palette, BarChart2, Megaphone, Briefcase, MoreHorizontal, GraduationCap,
    UserPlus, ClipboardCheck, PlayCircle, User, CreditCard
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './HomePage.css';

// Icon mapping for categories
const iconMap = {
    Globe: Globe,
    Code: Code,
    Palette: Palette,
    BarChart2: BarChart2,
    Megaphone: Megaphone,
    Briefcase: Briefcase,
    MoreHorizontal: MoreHorizontal
};

// Top instructors data - use BASE_URL for GitHub Pages compatibility
const topInstructors = [
    { id: 1, name: 'Dr. Ans Lecturer', title: 'Web Development Expert', avatar: `${import.meta.env.BASE_URL}dosen1.png` },
    { id: 2, name: 'Prof. Habs Webdev', title: 'Data Science Specialist', avatar: `${import.meta.env.BASE_URL}dosen2.png` },
    { id: 3, name: 'Mrs. W Design', title: 'UI/UX Designer', avatar: `${import.meta.env.BASE_URL}dosen3.png` },
    { id: 4, name: 'Dr. Alex AI', title: 'Machine Learning Expert', avatar: `${import.meta.env.BASE_URL}dosen4.png` },
    { id: 5, name: 'James Backend', title: 'Backend Specialist', avatar: `${import.meta.env.BASE_URL}dosen5.png` },
];

// Reviews data
const testimonials = [
    { id: 1, text: 'Materi yang dibahas sangat relevan dengan kebutuhan saat ini, dan penyaji mampu menjelaskan dengan jelas.', rating: 5 },
    { id: 2, text: 'Platform pembelajaran yang luar biasa! Saya bisa belajar dengan kecepatan sendiri.', rating: 5 },
    { id: 3, text: 'Kursus yang sangat komprehensif dan mudah dipahami. Highly recommended!', rating: 5 },
    { id: 4, text: 'Performa yang baik dari semua pembicara. Materi disampaikan dengan struktur yang jelas.', rating: 5 },
    { id: 5, text: 'Materi relevan dengan perkembangan teknologi terkini dan disertai perspektif etika.', rating: 5 },
];

const CountUp = ({ end, duration = 1500, formatter = (val) => val }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            // Ease out quart
            const easeProgress = 1 - Math.pow(1 - progress, 4);

            setCount(Math.floor(easeProgress * end));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span className="stat-digit">{formatter(count)}</span>;
};

const HomePage = () => {
    const { profile } = useAuth();
    const [certificateId, setCertificateId] = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [popularCourses, setPopularCourses] = useState([]);
    const [categoriesData, setCategoriesData] = useState([]);
    const [siteStats, setSiteStats] = useState({ totalStudents: 0, totalCourses: 0, totalCertificates: 0 });

    useEffect(() => {
        loadHomeData();
    }, []);

    const loadHomeData = async () => {
        try {
            // Fetch published courses
            const { data: coursesData } = await supabase
                .from('courses')
                .select('*, instructor:profiles!courses_instructor_id_fkey(full_name), category:categories(name)')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(6);
            setPopularCourses(coursesData || []);

            // Fetch categories
            const { data: cats } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            setCategoriesData(cats || []);

            // Fetch stats
            const [{ count: userCount }, { count: courseCount }, { count: certCount }] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
                supabase.from('certificates').select('*', { count: 'exact', head: true }),
            ]);
            setSiteStats({
                totalStudents: userCount || 0,
                totalCourses: courseCount || 0,
                totalCertificates: certCount || 0,
            });
        } catch (err) {
            console.error('Error loading home data:', err);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToExplore = () => {
        const exploreSection = document.getElementById('explore');
        if (exploreSection) {
            exploreSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num;
    };

    const formatPrice = (price) => {
        if (price === 0) return 'Free';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleCertificateCheck = async (e) => {
        e.preventDefault();
        if (certificateId.trim()) {
            setIsVerifying(true);
            try {
                const { data: cert } = await supabase
                    .from('certificates')
                    .select('*, course:courses(title), user:profiles!certificates_user_id_fkey(full_name)')
                    .eq('code', certificateId.trim())
                    .maybeSingle();

                if (cert) {
                    setVerifyResult({ found: true, certificate: {
                        id: cert.code,
                        courseName: cert.course?.title,
                        userName: cert.user?.full_name,
                        issuedDate: cert.issued_at,
                    }});
                } else {
                    setVerifyResult({ found: false });
                }
            } catch (err) {
                setVerifyResult({ found: false });
            }
            setIsVerifying(false);
        }
    };

    const resetVerification = () => {
        setVerifyResult(null);
        setCertificateId('');
    };

    return (
        <div className="home-page">
            <Navbar />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}hero-bg.png)` }}></div>
                <div className="hero-overlay"></div>

                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title animate-fade-in-up">
                            Unlock Your Potential with
                            <span className="highlight"> World-Class Courses</span>
                        </h1>

                        <p className="hero-description animate-fade-in-up">
                            Join millions of learners and gain in-demand skills with our
                            expert-led courses. Start learning today with free and premium
                            courses designed for your success.
                        </p>

                        <div className="hero-actions animate-fade-in-up">
                            <Link to="/courses" className="btn btn-primary btn-lg">
                                Explore Courses
                                <ArrowRight size={20} />
                            </Link>
                        <Link to="/login" className="btn btn-white btn-lg">
                                Login
                            </Link>
                        </div>

                        <div className="hero-stats animate-fade-in-up">
                            <div className="stat-item">
                                <div className="stat-icon">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="stat-value">
                                    <CountUp end={siteStats.totalStudents} formatter={formatNumber} />+
                                    </p>
                                    <p className="stat-label">Students</p>
                                </div>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <div className="stat-icon">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <p className="stat-value">
                                    <CountUp end={siteStats.totalCourses} formatter={formatNumber} />+
                                    </p>
                                    <p className="stat-label">Courses</p>
                                </div>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <div className="stat-icon">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <p className="stat-value">
                                    <CountUp end={siteStats.totalCertificates} formatter={formatNumber} />+
                                    </p>
                                    <p className="stat-label">Certificates</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual animate-scale-in">
                        <div className="hero-card certificate-verify-card">
                            {!verifyResult ? (
                                <>
                                    <div className="certificate-verify-header">
                                        <div className="certificate-verify-icon">
                                            <Award size={40} />
                                        </div>
                                        <h3>Verify Certificate</h3>
                                        <p>Enter a certificate ID to verify its authenticity</p>
                                    </div>
                                    <form className="certificate-verify-form" onSubmit={handleCertificateCheck}>
                                        <div className="certificate-verify-input">
                                            <Search size={20} />
                                            <input
                                                type="text"
                                                placeholder="e.g., CERT-001-2024"
                                                value={certificateId}
                                                onChange={(e) => setCertificateId(e.target.value)}
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isVerifying}>
                                            {isVerifying ? 'Verifying...' : 'Verify Certificate'}
                                            {!isVerifying && <ArrowRight size={18} />}
                                        </button>
                                    </form>
                                    <div className="hero-card-features">
                                        <div className="feature-item">
                                            <CheckCircle size={16} />
                                            <span>Instant verification</span>
                                        </div>
                                        <div className="feature-item">
                                            <CheckCircle size={16} />
                                            <span>Try: CERT-001-2024</span>
                                        </div>
                                    </div>
                                </>
                            ) : verifyResult.found ? (
                                <div className="verify-result success">
                                    <div className="result-icon success">
                                        <CheckCircle size={48} />
                                    </div>
                                    <h3>Certificate Verified!</h3>
                                    <div className="result-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Certificate ID</span>
                                            <span className="detail-value">{verifyResult.certificate.id}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Course</span>
                                            <span className="detail-value">{verifyResult.certificate.courseName}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Recipient</span>
                                            <span className="detail-value">{verifyResult.certificate.userName}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Issued</span>
                                            <span className="detail-value">{formatDate(verifyResult.certificate.issuedDate)}</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-secondary w-full" onClick={resetVerification}>
                                        Verify Another
                                    </button>
                                </div>
                            ) : (
                                <div className="verify-result error">
                                    <div className="result-icon error">
                                        <XCircle size={48} />
                                    </div>
                                    <h3>Certificate Not Found</h3>
                                    <p>No certificate found with ID: {certificateId}</p>
                                    <button className="btn btn-primary w-full" onClick={resetVerification}>
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Carousel Section */}
            <section className="categories-section" id="explore">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Explore Categories</h2>
                        <p>Find the perfect course in your favorite category</p>
                    </div>
                </div>
                <div className="categories-carousel">
                    <div className="categories-track">
                        {[...categoriesData, ...categoriesData].map((category, index) => {
                            const IconComponent = iconMap[category.icon] || BookOpen;
                            return (
                                <Link
                                    to={`/courses?category=${category.name}`}
                                    key={`${category.id}-${index}`}
                                    className="category-card"
                                >
                                    <div className="category-icon">
                                        <IconComponent size={28} />
                                    </div>
                                    <h3>{category.name}</h3>
                                    <p>{category.course_count || 0} Courses</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Popular Courses Section */}
            <section className="courses-section" id="courses">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <div className="section-badge">
                                <TrendingUp size={14} />
                                <span>Trending Now</span>
                            </div>
                            <h2>Popular Courses</h2>
                            <p>Discover our most popular courses loved by thousands</p>
                        </div>
                        <Link to="/courses" className="btn btn-secondary">
                            Browse All
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid-courses">
                        {popularCourses.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p>Belum ada kursus yang dipublikasikan</p>
                            </div>
                        ) : popularCourses.map((course, index) => (
                            <Link
                                to={`/course/${course.id}`}
                                key={course.id}
                                className="course-card"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="course-image">
                                    {course.thumbnail_url ? (
                                        <img src={course.thumbnail_url} alt={course.title} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <BookOpen size={40} color="white" />
                                        </div>
                                    )}
                                    <div className="course-badges">
                                        <span className="badge badge-level">{course.level}</span>
                                        <span className={`badge ${!course.price ? 'badge-free' : 'badge-premium'}`}>
                                            {!course.price ? 'Free' : 'Premium'}
                                        </span>
                                    </div>
                                </div>
                                <div className="course-content">
                                    <div className="course-category">{course.category?.name || '-'}</div>
                                    <h3 className="course-title">{course.title}</h3>

                                    <div className="course-instructor">
                                        <div className="instructor-icon">
                                            <GraduationCap size={16} />
                                        </div>
                                        <span>{course.instructor?.full_name || 'Instructor'}</span>
                                    </div>

                                    <div className="course-meta">
                                        <div className="rating">
                                            <Star size={14} fill="#eab308" color="#eab308" />
                                            <span>{course.avg_rating?.toFixed(1) || '-'}</span>
                                        </div>
                                        <span className="dot">•</span>
                                        <span>{course.level}</span>
                                    </div>

                                    <div className="course-footer">
                                        <p className="course-price">{formatPrice(course.price || 0)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Ulasan Pelanggan yang Puas</h2>
                        <p>Apa kata mereka tentang platform kami</p>
                    </div>

                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={testimonial.id}
                                className={`testimonial-card testimonial-${index + 1}`}
                            >
                                <div className="testimonial-stars">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={16} fill="#eab308" color="#eab308" />
                                    ))}
                                </div>
                                <p>{testimonial.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How to Register Section */}
            <section className="register-steps-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Cara Mendaftar</h2>
                        <p>Mulai belajar dalam 4 langkah mudah</p>
                    </div>

                    <div className="steps-container">
                        <div className="step-item">
                            <div className="step-icon">
                                <UserPlus size={36} />
                            </div>
                            <h3>Buat Akun</h3>
                            <p>Daftar dengan email atau akun sosial media</p>
                        </div>

                        <div className="step-arrow">
                            <ArrowRight size={28} />
                        </div>

                        <div className="step-item">
                            <div className="step-icon">
                                <ClipboardCheck size={36} />
                            </div>
                            <h3>Pilih Kursus</h3>
                            <p>Temukan kursus yang sesuai kebutuhanmu</p>
                        </div>

                        <div className="step-arrow">
                            <ArrowRight size={28} />
                        </div>

                        <div className="step-item">
                            <div className="step-icon">
                                <CreditCard size={36} />
                            </div>
                            <h3>Pembayaran</h3>
                            <p>Bayar jika diperlukan untuk kursus premium</p>
                        </div>

                        <div className="step-arrow">
                            <ArrowRight size={28} />
                        </div>

                        <div className="step-item">
                            <div className="step-icon">
                                <PlayCircle size={36} />
                            </div>
                            <h3>Mulai Belajar</h3>
                            <p>Akses materi kapan saja, di mana saja</p>
                        </div>
                    </div>

                    <div className="tutorial-link">
                        <a
                            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-lg"
                        >
                            <Youtube size={20} />
                            Lihat Tutorial Lengkap
                        </a>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="why-section" id="why-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Why Choose ITERA Course?</h2>
                        <p>We provide the best learning experience for our students</p>
                    </div>

                    <div className="why-grid">
                        <div className="why-card">
                            <div className="why-icon">
                                <BookOpen size={28} />
                            </div>
                            <h3>Expert Instructors</h3>
                            <p>Learn from industry professionals with years of real-world experience.</p>
                        </div>
                        <div className="why-card">
                            <div className="why-icon secondary">
                                <Award size={28} />
                            </div>
                            <h3>Verified Certificates</h3>
                            <p>Earn certificates that are recognized by top companies worldwide.</p>
                        </div>
                        <div className="why-card">
                            <div className="why-icon accent">
                                <Clock size={28} />
                            </div>
                            <h3>Lifetime Access</h3>
                            <p>Get unlimited access to course content and future updates.</p>
                        </div>
                        <div className="why-card">
                            <div className="why-icon success">
                                <Users size={28} />
                            </div>
                            <h3>Community Support</h3>
                            <p>Join a thriving community of learners and get help when you need it.</p>
                        </div>
                    </div>

                    {/* Top Instructors */}
                    <div className="instructors-section">
                        <h3 className="instructors-title">Meet Our Top Instructors</h3>
                        <div className="instructors-grid">
                            {topInstructors.map((instructor) => (
                                <div key={instructor.id} className="instructor-card">
                                    <div className="instructor-avatar-lg">
                                        {instructor.avatar ? (
                                            <img src={instructor.avatar} alt={instructor.name} />
                                        ) : (
                                            <User size={40} />
                                        )}
                                    </div>
                                    <h4>{instructor.name}</h4>
                                    <p>{instructor.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Scroll to Top Button */}
            <button
                className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
                onClick={scrollToTop}
                aria-label="Scroll to top"
            >
                <ArrowUp size={24} />
            </button>

            {/* Scroll Down Button */}
            <button
                className={`scroll-down ${!showScrollTop ? 'visible' : ''}`}
                onClick={scrollToExplore}
                aria-label="Scroll down"
            >
                <ArrowDown size={24} />
            </button>
        </div>
    );
};

export default HomePage;
