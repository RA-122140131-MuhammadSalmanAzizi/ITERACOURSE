import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Play, ChevronLeft, ChevronRight, CheckCircle,
    List, X, Award, PlayCircle, FileText, ExternalLink,
    ClipboardCheck, Sun, Moon, AlertCircle, ChevronDown, ChevronUp, Loader,
    Lock,
    RotateCcw // DEV ONLY
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
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0); // 0-100 percentage watched
    const [videoCompleted, setVideoCompleted] = useState(false);
    const videoRef = useRef(null);
    const maxWatchedTimeRef = useRef(0);
    const isSeekingRef = useRef(false);

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
                .select('*, contents(*, quiz_questions(*))')
                .eq('course_id', id)
                .order('sort_order');

            if (chaptersData) {
                chaptersData.forEach(ch => {
                    if (ch.contents) {
                        ch.contents.forEach(c => {
                            if (c.type === 'exercise' && c.quiz_questions) {
                                c.questions = c.quiz_questions.map(q => ({
                                    ...q,
                                    correctAnswer: q.correct_answer
                                }));
                            }
                        });
                    }
                });
            }
            setChapters(chaptersData || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    // Get all contents flattened
    const allContents = chapters.flatMap(ch =>
        (ch.contents ? [...ch.contents] : []).sort((a, b) => a.sort_order - b.sort_order)
    );
    const currentContent = allContents[currentContentIndex];

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

    // Chapter locking logic
    const isChapterCompleted = (chapterIndex) => {
        const chapter = chapters[chapterIndex];
        if (!chapter || !chapter.contents || chapter.contents.length === 0) return true;
        return chapter.contents.every(c =>
            completedContents.includes(c.id) ||
            (c.type === 'exercise' && exerciseScores[c.id] >= 80)
        );
    };

    const isChapterUnlocked = (chapterIndex) => {
        if (chapterIndex === 0) return true;
        return isChapterCompleted(chapterIndex - 1);
    };

    // Find which chapter a global content index belongs to
    const getChapterIndexForGlobalIndex = (globalIndex) => {
        let count = 0;
        for (let i = 0; i < chapters.length; i++) {
            const chapterContentCount = chapters[i].contents?.length || 0;
            if (globalIndex < count + chapterContentCount) return i;
            count += chapterContentCount;
        }
        return chapters.length - 1;
    };

    const isContentLocked = (globalIndex) => {
        const chapterIdx = getChapterIndexForGlobalIndex(globalIndex);
        return !isChapterUnlocked(chapterIdx);
    };

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

    // Auto-complete non-exercise, non-video content when viewed
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!currentContent) return;
        // Video requires 50% watch time; exercise requires passing score
        if (['pdf', 'link'].includes(currentContent.type)) {
            if (!completedContents.includes(currentContent.id)) {
                setCompletedContents(prev => {
                    const newCompleted = [...prev, currentContent.id];
                    if (id) localStorage.setItem(`course_progress_${id}`, JSON.stringify(newCompleted));
                    return newCompleted;
                });
            }
        }
    }, [currentContentIndex, currentContent?.id, id, completedContents]);

    // Reset video tracking state when content changes
    useEffect(() => {
        if (currentContent?.type === 'video') {
            const savedProgress = localStorage.getItem(`video_progress_${currentContent.id}`);
            const savedMaxTime = localStorage.getItem(`video_maxtime_${currentContent.id}`);
            if (savedProgress) {
                setVideoProgress(parseFloat(savedProgress));
            } else {
                setVideoProgress(0);
            }
            maxWatchedTimeRef.current = savedMaxTime ? parseFloat(savedMaxTime) : 0;
            setVideoCompleted(completedContents.includes(currentContent.id));
        } else {
            setVideoProgress(0);
            maxWatchedTimeRef.current = 0;
            setVideoCompleted(false);
        }
    }, [currentContent?.id]);

    // Video event handlers
    const handleVideoTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video || !currentContent || isSeekingRef.current) return;

        const currentTime = video.currentTime;
        const duration = video.duration;

        // Update max watched time
        if (currentTime > maxWatchedTimeRef.current) {
            maxWatchedTimeRef.current = currentTime;
            localStorage.setItem(`video_maxtime_${currentContent.id}`, currentTime.toString());
        }

        // Calculate progress percentage based on max watched time
        if (duration > 0) {
            const pct = (maxWatchedTimeRef.current / duration) * 100;
            setVideoProgress(pct);
            localStorage.setItem(`video_progress_${currentContent.id}`, pct.toString());

            // Mark as completed at 50%
            if (pct >= 50 && !completedContents.includes(currentContent.id)) {
                setVideoCompleted(true);
                setCompletedContents(prev => {
                    const newCompleted = [...prev, currentContent.id];
                    if (id) localStorage.setItem(`course_progress_${id}`, JSON.stringify(newCompleted));
                    return newCompleted;
                });
            }
        }
    }, [currentContent, completedContents, id]);

    const handleVideoSeeking = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        // Allow seeking backward, block seeking forward beyond max watched time
        if (video.currentTime > maxWatchedTimeRef.current + 0.5) {
            isSeekingRef.current = true;
            video.currentTime = maxWatchedTimeRef.current;
            setTimeout(() => { isSeekingRef.current = false; }, 100);
        }
    }, []);

    const handleVideoLoadedMetadata = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        // If there's saved progress, seek to last position
        const savedMaxTime = localStorage.getItem(`video_maxtime_${currentContent?.id}`);
        if (savedMaxTime) {
            const maxTime = parseFloat(savedMaxTime);
            maxWatchedTimeRef.current = maxTime;
            // Don't auto-seek, let the student choose where to start from the allowed range
        }
    }, [currentContent?.id]);

    // Sync progress to database
    useEffect(() => {
        if (!profile || !id || progress === 0) return;

        const syncProgress = async () => {
            try {
                const roundedProgress = Math.round(progress);

                // Check DB progress first to prevent overwriting with 0 if on new device
                const { data } = await supabase
                    .from('enrollments')
                    .select('progress')
                    .eq('course_id', id)
                    .eq('user_id', profile.id)
                    .single();

                if (data && roundedProgress > (data.progress || 0)) {
                    await supabase
                        .from('enrollments')
                        .update({ progress: roundedProgress })
                        .eq('course_id', id)
                        .eq('user_id', profile.id);
                }
            } catch (err) {
                console.error("Failed to sync progress:", err);
            }
        };

        syncProgress();
    }, [progress, id, profile]);

    useEffect(() => {
        if (canComplete && completedCount === allContents.length && allContents.length > 0) {
            const hasSeen = localStorage.getItem(`course_completed_modal_${id}`);
            if (!hasSeen) {
                setShowCompletionModal(true);
                localStorage.setItem(`course_completed_modal_${id}`, 'true');
            }
        }
    }, [canComplete, completedCount, allContents.length, id]);

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

    const handleNextContent = () => {
        const nextIndex = currentContentIndex + 1;
        if (nextIndex < allContents.length && !isContentLocked(nextIndex)) {
            setCurrentContentIndex(nextIndex);
        }
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
            setShowCompletionModal(false);
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

    // DEV ONLY - Reset all progress for this course
    const handleResetProgress = () => {
        if (!window.confirm('Reset semua progress kursus ini? (DEV ONLY)')) return;
        // Clear completed contents & exercise scores
        setCompletedContents([]);
        setExerciseScores({});
        setVideoProgress(0);
        setVideoCompleted(false);
        maxWatchedTimeRef.current = 0;
        setCurrentContentIndex(0);
        // Clear all localStorage for this course
        localStorage.removeItem(`course_progress_${id}`);
        localStorage.removeItem(`course_scores_${id}`);
        localStorage.removeItem(`course_completed_modal_${id}`);
        // Clear video progress for all contents in this course
        allContents.forEach(c => {
            localStorage.removeItem(`video_progress_${c.id}`);
            localStorage.removeItem(`video_maxtime_${c.id}`);
        });
    };
    // END DEV ONLY

    const renderContentViewer = () => {
        switch (currentContent?.type) {
            case 'video':
                return (
                    <div className="content-viewer-container">
                        {currentContent.video_url || currentContent.file_url ? (
                            <div className="video-player-wrapper">
                                <video
                                    ref={videoRef}
                                    controls
                                    controlsList="nodownload"
                                    disablePictureInPicture
                                    src={currentContent.video_url || currentContent.file_url}
                                    style={{ width: '100%', maxHeight: '70vh', background: '#000', borderRadius: '8px 8px 0 0' }}
                                    onTimeUpdate={handleVideoTimeUpdate}
                                    onSeeking={handleVideoSeeking}
                                    onLoadedMetadata={handleVideoLoadedMetadata}
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    Browser Anda tidak mendukung pemutar video.
                                </video>
                                <div className="video-progress-info">
                                    <div className="video-progress-bar-container">
                                        <div className="video-progress-bar-track">
                                            <div
                                                className={`video-progress-bar-fill ${videoProgress >= 50 ? 'completed' : ''}`}
                                                style={{ width: `${Math.min(videoProgress, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="video-watch-pct">
                                        {Math.round(videoProgress)}% ditonton
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="content-preview video-preview">
                                <Play size={64} />
                                <h3>{currentContent.title}</h3>
                                <span className="content-duration">{currentContent.duration}</span>
                                <p className="auto-complete-notice">Video belum tersedia</p>
                            </div>
                        )}
                    </div>
                );
            case 'pdf':
                return (
                    <div className="content-viewer-container" style={{ height: '100%' }}>
                        {currentContent.file_url ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '70vh', background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                        <FileText size={20} /> {currentContent.title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <a href={currentContent.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm pdf-open-tab">
                                            Buka di Tab Baru
                                        </a>
                                        <a href={currentContent.file_url} download target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                                            Download PDF
                                        </a>
                                    </div>
                                </div>
                                <div className="pdf-iframe-wrapper">
                                    <iframe
                                        src={`${currentContent.file_url}#toolbar=0&view=FitH&scrollbar=0`}
                                        title={currentContent.title}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="content-preview pdf-preview">
                                <FileText size={64} />
                                <h3>{currentContent.title}</h3>
                                <p className="auto-complete-notice">File PDF belum tersedia</p>
                            </div>
                        )}
                    </div>
                );
            case 'link':
                return (
                    <div className="content-viewer-container">
                        <div className="content-preview link-preview">
                            <ExternalLink size={64} />
                            <h3>{currentContent.title}</h3>
                            {(currentContent.external_url || currentContent.url) && (
                                <a href={currentContent.external_url || currentContent.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                    Buka URL
                                </a>
                            )}
                            <p className="auto-complete-notice">Konten ini otomatis ditandai selesai</p>
                        </div>
                    </div>
                );
            case 'exercise':
                const exerciseScore = exerciseScores[currentContent.id];
                const isCompleted = completedContents.includes(currentContent.id) || (exerciseScore !== undefined && exerciseScore >= (currentContent.passing_score || 80));

                return (
                    <div className="content-viewer-container">
                        <ExerciseQuiz
                            exercise={currentContent}
                            onComplete={handleExerciseComplete}
                            passingScore={currentContent.passing_score || 80}
                            onStart={() => navigate(`/course/quiz/${course.id}/${currentContent.id}`)}
                            initialScore={exerciseScore}
                            initialCompleted={isCompleted}
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
                    {/* DEV ONLY - Reset Progress Button */}
                    <button className="theme-toggle-btn" onClick={handleResetProgress} title="Reset Progress (DEV)" style={{ color: '#ef4444' }}>
                        <RotateCcw size={20} />
                    </button>
                    {/* END DEV ONLY */}
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

            {/* Mobile sidebar backdrop */}
            {showSidebar && <div className="watch-sidebar-backdrop" onClick={() => setShowSidebar(false)} />}

            <div className="watch-content">
                <main className="content-section">
                    {renderContentViewer()}
                    <div className="content-info">
                        <div className="content-header">
                            <div style={{ width: '100%' }}>
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
                                    <button className="btn btn-primary" onClick={handleNextContent} disabled={currentContentIndex === allContents.length - 1 || isContentLocked(currentContentIndex + 1)}>
                                        {currentContentIndex < allContents.length - 1 && isContentLocked(currentContentIndex + 1) ? (
                                            <><Lock size={16} /> Bab Terkunci</>
                                        ) : (
                                            <>Selanjutnya <ChevronRight size={18} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <aside className={`lessons-sidebar ${showSidebar ? 'show' : ''}`}>
                    <div className="sidebar-header">
                        <h3>Konten Kursus</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span>{completedContents.length}/{allContents.length} selesai</span>
                            <button className="sidebar-close-btn" onClick={() => setShowSidebar(false)}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="passing-notice">
                        <AlertCircle size={16} />
                        <span>Lulus semua quiz dengan ≥80%</span>
                    </div>

                    <div className="chapters-list">
                        {chapters.map((chapter, chapterIndex) => {
                            const chapterLocked = !isChapterUnlocked(chapterIndex);
                            return (
                                <div key={chapter.id} className="chapter-group">
                                    <button className="chapter-title" onClick={() => toggleChapter(chapterIndex)} style={chapterLocked ? { opacity: 0.6 } : {}}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {chapterLocked && <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                                            {chapter.title}
                                        </span>
                                        <div className="chapter-right-side">
                                            {!chapterLocked ? (
                                                <span className="chapter-progress">
                                                    {chapter.contents?.filter(c =>
                                                        completedContents.includes(c.id) ||
                                                        (c.type === 'exercise' && exerciseScores[c.id] >= 80)
                                                    ).length}/{chapter.contents?.length}
                                                    <CheckCircle size={14} className="chapter-check-icon" />
                                                </span>
                                            ) : (
                                                <span className="chapter-progress" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Terkunci</span>
                                            )}
                                            {expandedChapters.includes(chapterIndex) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </button>
                                    {expandedChapters.includes(chapterIndex) && (
                                        <div className="contents-list">
                                            {(chapter.contents ? [...chapter.contents] : []).sort((a, b) => a.sort_order - b.sort_order).map((content) => {
                                                const globalIndex = contentIndex++;
                                                const isActive = globalIndex === currentContentIndex;
                                                const isContentCompleted = completedContents.includes(content.id) ||
                                                    (content.type === 'exercise' && exerciseScores[content.id] >= 80);
                                                const exerciseScore = exerciseScores[content.id];

                                                return (
                                                    <button
                                                        key={content.id}
                                                        className={`content-item ${isActive ? 'active' : ''} ${isContentCompleted ? 'completed' : ''} ${content.type} ${chapterLocked ? 'locked' : ''}`}
                                                        onClick={() => {
                                                            if (chapterLocked) return;
                                                            setCurrentContentIndex(globalIndex);
                                                        }}
                                                        style={chapterLocked ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                                                    >
                                                        <div className="content-item-left">
                                                            <div className="content-icon">
                                                                {chapterLocked ? (
                                                                    <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                                                                ) : isActive ? (
                                                                    <div className="playing-indicator">{getContentIcon(content.type)}</div>
                                                                ) : getContentIcon(content.type)}
                                                            </div>
                                                            <span className="content-title" title={content.title}>{content.title}</span>
                                                        </div>
                                                        <div className="content-item-right">
                                                            <span className={`type-label ${content.type}`}>{getContentTypeLabel(content.type)}</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                {!chapterLocked && content.type === 'exercise' && exerciseScore !== undefined && (
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
                            );
                        })}
                    </div>
                </aside>
            </div>

            {showCompletionModal && (
                <div className="completion-modal">
                    <div className="modal-content" style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowCompletionModal(false)}
                            style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={24} />
                        </button>
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
