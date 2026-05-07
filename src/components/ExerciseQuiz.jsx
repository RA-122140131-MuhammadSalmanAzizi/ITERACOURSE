import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, RotateCcw, Trophy, AlertCircle, Flag, Clock, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import './ExerciseQuiz.css';

const ExerciseQuiz = ({ exercise, onComplete, passingScore = 80, onStart, autoStart, initialScore, initialCompleted }) => {
    const [quizStarted, setQuizStarted] = useState(initialCompleted || false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [flaggedQuestions, setFlaggedQuestions] = useState([]);
    const [showResults, setShowResults] = useState(initialCompleted || false);
    const [score, setScore] = useState(initialScore || 0);
    const [timeLeft, setTimeLeft] = useState(null);

    const [navigatorPage, setNavigatorPage] = useState(0);
    const QUESTIONS_PER_PAGE = 10;

    const questions = exercise.questions || [];
    const totalQuestions = questions.length;
    const quizDuration = exercise.duration ? parseInt(exercise.duration) * 60 : totalQuestions * 60; // default 1 min per question

    // Auto-update navigator page when question changes
    useEffect(() => {
        setNavigatorPage(Math.floor(currentQuestion / QUESTIONS_PER_PAGE));
    }, [currentQuestion]);

    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
    const visibleQuestionsStart = navigatorPage * QUESTIONS_PER_PAGE;
    const visibleQuestions = questions.slice(visibleQuestionsStart, visibleQuestionsStart + QUESTIONS_PER_PAGE);

    // Timer countdown
    useEffect(() => {
        if (!quizStarted || showResults || timeLeft === null) return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [quizStarted, showResults, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-start if requested
    useEffect(() => {
        if (autoStart) {
            handleStartQuiz();
        }
    }, [autoStart]);

    const handleStartQuiz = () => {
        if (onStart) {
            onStart();
            return;
        }
        setQuizStarted(true);
        setShowResults(false);
        setTimeLeft(quizDuration);
    };

    const handleAnswerSelect = (questionId, answerIndex) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: answerIndex
        });
    };

    const toggleFlagQuestion = (questionId) => {
        if (flaggedQuestions.includes(questionId)) {
            setFlaggedQuestions(flaggedQuestions.filter(id => id !== questionId));
        } else {
            setFlaggedQuestions([...flaggedQuestions, questionId]);
        }
    };

    const handleNext = () => {
        if (currentQuestion < totalQuestions - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const goToQuestion = (index) => {
        setCurrentQuestion(index);
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach(q => {
            if (selectedAnswers[q.id] === q.correctAnswer) {
                correct++;
            }
        });
        return Math.round((correct / totalQuestions) * 100);
    };

    const handleSubmit = () => {
        const finalScore = calculateScore();
        setScore(finalScore);
        setShowResults(true);
    };

    const handleRetry = () => {
        setSelectedAnswers({});
        setFlaggedQuestions([]);
        setCurrentQuestion(0);
        setShowResults(false);
        setScore(0);
        setQuizStarted(false);
        setTimeLeft(null);
    };

    const handlePassComplete = () => {
        onComplete && onComplete(score);
    };

    const isPassed = score >= passingScore;
    const answeredCount = Object.keys(selectedAnswers).length;

    // Pre-quiz screen
    if (!quizStarted) {
        return (
            <div className="quiz-container">
                <div className="quiz-intro">
                    <div className="quiz-intro-icon">
                        <Play size={48} />
                    </div>
                    <h2>{exercise.title}</h2>

                    <div className="quiz-info-box">
                        <div className="info-item">
                            <span>Kuis ini berisi <strong>{totalQuestions} soal</strong> dengan waktu <strong>{exercise.duration || `${totalQuestions} menit`}</strong>!</span>
                        </div>
                        <div className="info-item">
                            <span>Passing score: <strong>{passingScore}%</strong></span>
                        </div>
                    </div>

                    <button className="btn btn-primary btn-lg start-quiz-btn" onClick={handleStartQuiz}>
                        <Play size={20} />
                        Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    if (showResults) {
        return (
            <div className="quiz-container">
                <div className={`quiz-results ${isPassed ? 'passed' : 'failed'}`}>
                    <div className="results-icon">
                        {isPassed ? (
                            <Trophy size={64} className="trophy-icon" />
                        ) : (
                            <XCircle size={64} className="failed-icon" />
                        )}
                    </div>

                    <h2>{isPassed ? 'Congratulations!' : 'Not Quite There'}</h2>

                    <div className="score-display">
                        <span className="score-value">{score}%</span>
                        <span className="score-label">Your Score</span>
                    </div>

                    <p className="passing-info">
                        Passing score: {passingScore}%
                    </p>

                    {isPassed ? (
                        <>
                            <p className="result-message success">
                                You have successfully passed this exercise!
                            </p>
                            {!initialCompleted && (
                                <button className="btn btn-primary btn-lg" onClick={handlePassComplete}>
                                    <CheckCircle size={20} />
                                    Continue Learning
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="result-message failure">
                                You need at least {passingScore}% to pass. Review the material and try again.
                            </p>
                            <button className="btn btn-primary btn-lg" onClick={handleRetry}>
                                <RotateCcw size={20} />
                                Try Again
                            </button>
                        </>
                    )}

                    {Object.keys(selectedAnswers).length > 0 && (
                        <div className="answer-review">
                            <h3>Answer Review</h3>
                            {questions.map((q, idx) => {
                                const userAnswer = selectedAnswers[q.id];
                                const isCorrect = userAnswer === q.correctAnswer;
                                return (
                                    <div key={q.id} className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                                        <div className="review-header">
                                            <span className="review-number">Q{idx + 1}</span>
                                            {isCorrect ? (
                                                <CheckCircle size={18} className="correct-icon" />
                                            ) : (
                                                <XCircle size={18} className="incorrect-icon" />
                                            )}
                                        </div>
                                        <p className="review-question">{q.question}</p>
                                        {q.image_url && (
                                            <div className="review-image-container" style={{ margin: '0.5rem 0', textAlign: 'left' }}>
                                                <img src={q.image_url} alt="Question" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                                            </div>
                                        )}
                                        <p className="your-answer">
                                            Your answer: {q.options[userAnswer] || 'Not answered'}
                                        </p>
                                        {!isCorrect && (
                                            <p className="correct-answer">
                                                Correct: {q.options[q.correctAnswer]}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];
    const isCurrentFlagged = flaggedQuestions.includes(currentQ?.id);

    return (
        <div className="quiz-container">
            <div className="quiz-header">
                <div className="quiz-header-left">
                    <h3>{exercise.title}</h3>
                    <span className="question-counter">Question {currentQuestion + 1}/{totalQuestions}</span>
                </div>



                <div className="quiz-header-right">
                    <div className={`timer ${timeLeft < 60 ? 'warning' : ''}`}>
                        <Clock size={16} />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <button
                        className={`flag-btn ${isCurrentFlagged ? 'flagged' : ''}`}
                        onClick={() => toggleFlagQuestion(currentQ?.id)}
                        title="Flag this question"
                    >
                        <Flag size={16} />
                    </button>
                </div>
            </div>

            <div className="quiz-content">
                <div className="question-card">
                    <p className="question-text">{currentQ?.question}</p>
                    {currentQ?.image_url && (
                        <div className="question-image-container" style={{ margin: '1rem 0', textAlign: 'center' }}>
                            <img src={currentQ.image_url} alt="Question" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                        </div>
                    )}

                    <div className="options-list">
                        {currentQ?.options.map((option, idx) => (
                            <button
                                key={idx}
                                className={`option-btn ${selectedAnswers[currentQ.id] === idx ? 'selected' : ''}`}
                                onClick={() => handleAnswerSelect(currentQ.id, idx)}
                            >
                                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                                <span className="option-text">{option}</span>
                                {selectedAnswers[currentQ.id] === idx && (
                                    <CheckCircle size={18} className="selected-icon" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="quiz-footer">
                <div className="quiz-navigation-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', alignItems: 'center', width: '100%', gap: '1rem' }}>

                    {/* Left Column: Prev Button */}
                    <div style={{ justifySelf: 'start' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handlePrev}
                            disabled={currentQuestion === 0}
                            style={{ minWidth: '100px' }}
                        >
                            Prev
                        </button>
                    </div>

                    {/* Center Column: Navigator */}
                    <div className="question-navigator-container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <div className="question-navigator" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center', margin: 0 }}>
                            <button
                                className="nav-arrow"
                                disabled={navigatorPage === 0}
                                onClick={() => setNavigatorPage(p => p - 1)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '0',
                                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '2rem', height: '2rem',
                                    visibility: totalQuestions > QUESTIONS_PER_PAGE ? 'visible' : 'hidden',
                                    opacity: navigatorPage === 0 ? 0.3 : 1
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>

                            {visibleQuestions.map((q, idx) => {
                                const realIdx = visibleQuestionsStart + idx;
                                return (
                                    <button
                                        key={q.id}
                                        className={`nav-dot ${realIdx === currentQuestion ? 'active' : ''} ${selectedAnswers[q.id] !== undefined ? 'answered' : ''} ${flaggedQuestions.includes(q.id) ? 'flagged' : ''}`}
                                        onClick={() => goToQuestion(realIdx)}
                                    >
                                        {realIdx + 1}
                                    </button>
                                );
                            })}

                            <button
                                className="nav-arrow"
                                disabled={navigatorPage === totalPages - 1}
                                onClick={() => setNavigatorPage(p => p + 1)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '0',
                                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '2rem', height: '2rem',
                                    visibility: totalQuestions > QUESTIONS_PER_PAGE ? 'visible' : 'hidden',
                                    opacity: navigatorPage === totalPages - 1 ? 0.3 : 1
                                }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Next/Submit */}
                    <div style={{ justifySelf: 'end' }}>
                        {currentQuestion < totalQuestions - 1 ? (
                            <button
                                className="btn btn-primary"
                                onClick={handleNext}
                                style={{ minWidth: '100px' }}
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={answeredCount < totalQuestions}
                                style={{ minWidth: '100px', whiteSpace: 'nowrap' }}
                            >
                                Submit ({answeredCount}/{totalQuestions})
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExerciseQuiz;
