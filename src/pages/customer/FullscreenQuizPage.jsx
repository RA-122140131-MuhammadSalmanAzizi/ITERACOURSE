import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ExerciseQuiz from '../../components/ExerciseQuiz';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Loader } from 'lucide-react';
import './WatchCoursePage.css';

const FullscreenQuizPage = () => {
    const { courseId, contentId } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [quizContent, setQuizContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuiz();
    }, [contentId]);

    const loadQuiz = async () => {
        try {
            const { data } = await supabase
                .from('contents')
                .select('*, quiz_questions(*)')
                .eq('id', contentId)
                .eq('type', 'exercise')
                .single();
            
            if (data) {
                data.questions = data.quiz_questions?.map(q => ({
                    ...q,
                    correctAnswer: q.correct_answer
                })) || [];
            }
            setQuizContent(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-500)' }} />
            </div>
        );
    }

    if (!quizContent) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <h2 style={{ color: 'var(--text-primary)' }}>Quiz tidak ditemukan</h2>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate(`/watch/${courseId}`)}>
                    Kembali ke Kursus
                </button>
            </div>
        );
    }

    const handleComplete = async (finalScore, details) => {
        // If this is just a navigation signal (user clicked Continue Learning), go back
        if (details?.navigateOnly) {
            navigate(`/watch/${courseId}`);
            return;
        }

        const isPassed = finalScore >= (quizContent.passing_score || 80);

        // Save progress to localStorage for passed quizzes
        if (isPassed) {
            const savedProgress = localStorage.getItem(`course_progress_${courseId}`);
            let currentProgress = savedProgress ? JSON.parse(savedProgress) : [];
            currentProgress = [...new Set([...currentProgress, quizContent.id])];
            localStorage.setItem(`course_progress_${courseId}`, JSON.stringify(currentProgress));

            const savedScores = localStorage.getItem(`course_scores_${courseId}`);
            let currentScores = savedScores ? JSON.parse(savedScores) : {};
            currentScores[quizContent.id] = finalScore;
            localStorage.setItem(`course_scores_${courseId}`, JSON.stringify(currentScores));
        }

        // Save quiz attempt to database (upsert - keep highest score)
        try {
            // Check if an existing attempt exists
            const { data: existing } = await supabase
                .from('quiz_attempts')
                .select('id, score')
                .eq('user_id', profile.id)
                .eq('content_id', quizContent.id)
                .maybeSingle();

            const attemptData = {
                user_id: profile.id,
                content_id: quizContent.id,
                score: finalScore,
                passed: isPassed,
                total_questions: details?.totalQuestions || 0,
                correct_answers: details?.correctAnswers || 0,
                answers: details?.questions || null,
                attempted_at: new Date().toISOString(),
            };

            if (existing) {
                // Only update if the new score is higher
                if (finalScore > existing.score) {
                    await supabase
                        .from('quiz_attempts')
                        .update(attemptData)
                        .eq('id', existing.id);
                } else {
                    // Still update the attempt timestamp and answers, but keep the higher score
                    await supabase
                        .from('quiz_attempts')
                        .update({
                            attempted_at: new Date().toISOString(),
                        })
                        .eq('id', existing.id);
                }
            } else {
                // Insert new attempt
                await supabase
                    .from('quiz_attempts')
                    .insert(attemptData);
            }

            // === INDUSTRY STANDARD: Save progress to DB if passed ===
            if (isPassed) {
                await supabase.from('content_progress').upsert({
                    user_id: profile.id,
                    content_id: quizContent.id,
                    is_completed: true,
                    completed_at: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('Error saving quiz attempt:', err);
        }
    };

    return (
        <div className="fullscreen-quiz-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <button onClick={() => navigate(`/watch/${courseId}`)} className="btn btn-ghost mb-4">
                    <ChevronLeft size={20} />
                    Kembali
                </button>
                <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <ExerciseQuiz
                        exercise={quizContent}
                        onComplete={handleComplete}
                        passingScore={quizContent.passing_score || 80}
                        autoStart={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default FullscreenQuizPage;
