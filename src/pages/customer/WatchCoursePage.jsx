import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Play, ChevronLeft, ChevronRight, CheckCircle,
    List, X, Award, PlayCircle, FileText, ExternalLink,
    ClipboardCheck, Sun, Moon, AlertCircle, ChevronDown, ChevronUp, Loader
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import ExerciseQuiz from '../../components/ExerciseQuiz';
import './WatchCoursePage.css';

const WatchCoursePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { profile } = useAuth();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    const [showSidebar, setShowSidebar] = useState(true);
    const [completedContents, setCompletedContents] = useState(() => {
        const saved = localStorage.getItem(`course_progress_${id}`);
        return saved ? JSON.parse(saved) : [];
    });
    const [exerciseScores, setExerciseScores] = useState(() => {
        const saved = localStorage.getItem(`course_scores_${id}`);
        return saved ? JSON.parse(saved) : {};
    });
    const [expandedChapters, setExpandedChapters] = useState([]);

    useEffect(() => {
        if (id) loadCourseData();
    }, [id]);

    const loadCourseData = async () => {
        setLoading(true);
        try {
            const { data: courseData } = await supabase
                .from('courses')
                .select('*, instructor:profiles!courses_instructor_id_fkey(full_name)')
                .eq('id', id)
                .single();
            setCourse(courseData);

            const { data: chaptersData } = await supabase
                .from('chapters')
                .select('*, contents(*)')
                .eq('course_id', id)
                .order('sort_order');
            setChapters(chaptersData || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    // Get all contents flattened
    const allContents = chapters.flatMap(ch =>
        (ch.contents || []).sort((a, b) => a.sort_order - b.sort_order)
    );
    const currentContent = allContents[currentContentIndex];

    // Initialize expanded chapters
    useEffect(() => {
        if (chapters.length > 0 && allContents.length > 0) {
            let contentCount = 0;
            for (let i = 0; i < chapters.length; i++) {
                const chapterContentCount = chapters[i].contents?.length || 0;
                if (currentContentIndex >= contentCount && currentContentIndex < contentCount + chapterContentCount) {
                    if (!expandedChapters.includes(i)) {
                        setExpandedChapters(prev => [...prev, i]);
                    }
                    break;
                }
                contentCount += chapterContentCount;
            }
        }
    }, [currentContentIndex, chapters]);

    useEffect(() => {
        if (id) localStorage.setItem(`course_progress_${id}`, JSON.stringify(completedContents));
    }, [completedContents, id]);

    useEffect(() => {
        if (id) localStorage.setItem(`course_scores_${id}`, JSON.stringify(exerciseScores));
    }, [exerciseScores, id]);

    // Auto-complete non-exercise content when viewed
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!currentContent) return;
        if (['video', 'pdf', 'link'].includes(currentContent.type)) {
            if (!completedContents.includes(currentContent.id)) {
                setCompletedContents(prev => [...prev, currentContent.id]);
            }
        }
    }, [currentContentIndex, currentContent?.id]);

    if (loading) {
        return (
            <div className="watch-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-500)' }} />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="watch-page">
                <div className="not-found">
                    <h2>Kursus tidak ditemukan</h2>
                    <Link to="/courses" className="btn btn-primary">Jelajahi Kursus</Link>
                </div>
            </div>
        );
    }

    // Progress calculation
    const completedCount = allContents.filter(c =>
        completedContents.includes(c.id) ||
        (c.type === 'exercise' && exerciseScores[c.id] >= 80)
    ).length;
    const progress = allContents.length > 0 ? (completedCount / allContents.length) * 100 : 0;

    const allExercisesPassed = allContents
        .filter(c => c.type === 'exercise')
        .every(c => exerciseScores[c.id] >= 80);

    const canComplete = completedCount === allContents.length && allExercisesPassed;

    const handleNextContent = () => {
        if (currentContentIndex < allContents.length - 1) setCurrentContentIndex(currentContentIndex + 1);
    };

    const handlePrevContent = () => {
        if (currentContentIndex > 0) setCurrentContentIndex(currentContentIndex - 1);
    };

    const toggleChapter = (index) => {
        if (expandedChapters.includes(index)) {
            setExpandedChapters(expandedChapters.filter(i => i !== index));
        } else {
            setExpandedChapters([...expandedChapters, index]);
        }
    };

    const handleExerciseComplete = (score) => {
        const newScores = { ...exerciseScores, [currentContent.id]: score };
        setExerciseScores(newScores);

        if (score >= 80) {
            setCompletedContents(prev => [...prev, currentContent.id]);
        }
    };

    const handleClaimCertificate = async () => {
        try {
            const code = `CERT-${course.id}-${Date.now().toString(36).toUpperCase()}`;
            await supabase.from('certificates').insert({
                user_id: profile.id,
                course_id: course.id,
                code,
            });
            navigate('/customer/certificates');
        } catch (err) {
            console.error('Certificate error:', err);
        }
    };

    const getContentIcon = (type) => {
        switch (type) {
            case 'video': return <PlayCircle size={18} />;
            case 'pdf': return <FileText size={18} />;
            case 'link': return <ExternalLink size={18} />;
            case 'exercise': return <ClipboardCheck size={18} />;
            default: return <PlayCircle size={18} />;
        }
    };

    const getContentTypeLabel = (type) => {
        switch (type) {
            case 'video': return 'Video';
            case 'pdf': return 'PDF';
            case 'link': return 'Link';
            case 'exercise': return 'Quiz';
            default: return 'Content';
        }
    };

    const renderContentViewer = () => {
        switch (currentContent?.type) {
            case 'video':
                return (
                    <div className="content-viewer-container">
                        <div className="content-preview video-preview">
                            <Play size={64} />
                            <h3>{currentContent.title}</h3>
                            <span className="content-duration">{currentContent.duration}</span>
                            <p className="auto-complete-notice">Konten ini otomatis ditandai selesai</p>
                        </div>
                    </div>
                );
            case 'pdf':
                return (
                    <div className="content-viewer-container">
                        <div className="content-preview pdf-preview">
                            <FileText size={64} />
                            <h3>{currentContent.title}</h3>
                            {currentContent.file_url && (
                                <a href={currentContent.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                    Download PDF
                                </a>
                            )}
                            <p className="auto-complete-notice">Konten ini otomatis ditandai selesai</p>
                        </div>
                    </div>
                );
            case 'link':
                return (
                    <div className="content-viewer-container">
                        <div className="content-preview link-preview">
                            <ExternalLink size={64} />
                            <h3>{currentContent.title}</h3>
                            {currentContent.url && (
                                <a href={currentContent.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                    Buka Link
                                </a>
                            )}
                            <p className="auto-complete-notice">Konten ini otomatis ditandai selesai</p>
                        </div>
                    </div>
                );
            case 'exercise':
                return (
                    <div className="content-viewer-container">
                        <ExerciseQuiz
                            exercise={currentContent}
                            onComplete={handleExerciseComplete}
                            passingScore={currentContent.passing_score || 80}
                            onStart={() => navigate(`/course/quiz/${course.id}/${currentContent.id}`)}
                        />
                    </div>
                );
            default:
                return (
                    <div className="content-viewer-container">
                        <div className="content-preview"><p>Konten tidak tersedia</p></div>
                    </div>
                );
        }
    };

    let contentIndex = 0;

    return (
        <div className="watch-page">
            <header className="watch-header">
                <div className="header-left">
                    <Link to="/customer/dashboard" className="back-btn"><ChevronLeft size={20} /></Link>
                    <div className="course-info">
                        <h1>{course.title}</h1>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="progress-text">{Math.round(progress)}% selesai</span>
                    </div>
                </div>
                <div className="header-right">
                    <button className="theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    {canComplete && (
                        <button className="btn btn-primary" onClick={handleClaimCertificate}>
                            <Award size={18} /> Klaim Sertifikat
                        </button>
                    )}
                    <button className="toggle-sidebar-btn" onClick={() => setShowSidebar(!showSidebar)}>
                        {showSidebar ? <X size={20} /> : <List size={20} />}
                    </button>
                </div>
            </header>

            <div className="watch-content">
                <main className="content-section">
                    {renderContentViewer()}
                    <div className="content-info">
                        <div className="content-header">
                            <div>
                                <div className="content-meta">
                                    <span className={`content-type-badge ${currentContent?.type}`}>
                                        {getContentIcon(currentContent?.type)}
                                        {getContentTypeLabel(currentContent?.type)}
                                    </span>
                                    <span className="content-number">{currentContentIndex + 1} of {allContents.length}</span>
                                </div>
                                <h2>{currentContent?.title}</h2>
                                <div className="content-navigation" style={{ marginTop: '1rem' }}>
                                    <button className="btn btn-secondary" onClick={handlePrevContent} disabled={currentContentIndex === 0}>
                                        <ChevronLeft size={18} /> Sebelumnya
                                    </button>
                                    <button className="btn btn-primary" onClick={handleNextContent} disabled={currentContentIndex === allContents.length - 1}>
                                        Selanjutnya <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <aside className={`lessons-sidebar ${showSidebar ? 'show' : ''}`}>
                    <div className="sidebar-header">
                        <h3>Konten Kursus</h3>
                        <span>{completedContents.length}/{allContents.length} selesai</span>
                    </div>

                    <div className="passing-notice">
                        <AlertCircle size={16} />
                        <span>Lulus semua quiz dengan ≥80%</span>
                    </div>

                    <div className="chapters-list">
                        {chapters.map((chapter, chapterIndex) => (
                            <div key={chapter.id} className="chapter-group">
                                <button className="chapter-title" onClick={() => toggleChapter(chapterIndex)}>
                                    <span>{chapter.title}</span>
                                    <div className="chapter-right-side">
                                        <span className="chapter-progress">
                                            {chapter.contents?.filter(c =>
                                                completedContents.includes(c.id) ||
                                                (c.type === 'exercise' && exerciseScores[c.id] >= 80)
                                            ).length}/{chapter.contents?.length}
                                            <CheckCircle size={14} className="chapter-check-icon" />
                                        </span>
                                        {expandedChapters.includes(chapterIndex) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </button>
                                {expandedChapters.includes(chapterIndex) && (
                                    <div className="contents-list">
                                        {chapter.contents?.sort((a, b) => a.sort_order - b.sort_order).map((content) => {
                                            const globalIndex = contentIndex++;
                                            const isActive = globalIndex === currentContentIndex;
                                            const isContentCompleted = completedContents.includes(content.id) ||
                                                (content.type === 'exercise' && exerciseScores[content.id] >= 80);
                                            const exerciseScore = exerciseScores[content.id];

                                            return (
                                                <button
                                                    key={content.id}
                                                    className={`content-item ${isActive ? 'active' : ''} ${isContentCompleted ? 'completed' : ''} ${content.type}`}
                                                    onClick={() => setCurrentContentIndex(globalIndex)}
                                                >
                                                    <div className="content-icon">
                                                        {isActive ? (
                                                            <div className="playing-indicator">{getContentIcon(content.type)}</div>
                                                        ) : getContentIcon(content.type)}
                                                    </div>
                                                    <div className="content-details">
                                                        <span className="content-title">{content.title}</span>
                                                        <div className="content-meta-info">
                                                            <span className={`type-label ${content.type}`}>{getContentTypeLabel(content.type)}</span>
                                                            {content.duration && <span className="content-duration">{content.duration}</span>}
                                                            {content.type === 'exercise' && exerciseScore !== undefined && (
                                                                <span className={`score-badge ${exerciseScore >= 80 ? 'passed' : 'failed'}`}>{exerciseScore}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {!expandedChapters.includes(chapterIndex) && (
                                    <div style={{ display: 'none' }}>
                                        {chapter.contents?.map(() => { contentIndex++; return null; })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            {canComplete && completedCount === allContents.length && (
                <div className="completion-modal">
                    <div className="modal-content">
                        <div className="modal-icon"><Award size={64} /></div>
                        <h2>Selamat!</h2>
                        <p>Anda telah menyelesaikan kursus ini! Klaim sertifikat Anda sekarang.</p>
                        <button className="btn btn-primary btn-lg" onClick={handleClaimCertificate}>
                            <Award size={20} /> Klaim Sertifikat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatchCoursePage;
