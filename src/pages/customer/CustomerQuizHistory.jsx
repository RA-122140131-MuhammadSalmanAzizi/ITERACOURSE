import { useState, useEffect } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CustomerSidebar from '../../components/CustomerSidebar';
import '../admin/AdminPages.css';

const CustomerQuizHistory = () => {
    const { profile } = useAuth();
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (profile) loadAttempts();
    }, [profile]);

    const loadAttempts = async () => {
        try {
            const { data } = await supabase
                .from('quiz_attempts')
                .select('*, content:contents(title, chapter:chapters(title, course:courses(title)))')
                .eq('user_id', profile.id)
                .order('attempted_at', { ascending: false });
            setAttempts(data || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="admin-page">
            <CustomerSidebar />
            <main className="admin-main">
                <header className="admin-header">
                    <div><h1>Riwayat Quiz</h1><p>Semua quiz yang pernah Anda kerjakan (skor tertinggi)</p></div>
                </header>
                <section className="content-section">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat...</div>
                    ) : attempts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <ClipboardList size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Anda belum mengerjakan quiz</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {attempts.map(attempt => {
                                const isExpanded = expandedId === attempt.id;
                                const answers = attempt.answers || [];
                                const hasAnswers = Array.isArray(answers) && answers.length > 0;

                                return (
                                    <div key={attempt.id} style={{
                                        background: 'var(--bg-primary)',
                                        border: `1px solid ${attempt.passed ? '#22c55e40' : 'var(--border-color)'}`,
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        {/* Summary Row */}
                                        <div
                                            style={{
                                                padding: '1.25rem 1.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '1rem',
                                                cursor: hasAnswers ? 'pointer' : 'default',
                                                flexWrap: 'wrap'
                                            }}
                                            onClick={() => hasAnswers && toggleExpand(attempt.id)}
                                        >
                                            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                                                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                                    {attempt.content?.title || 'Quiz'}
                                                </h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <span>{attempt.content?.chapter?.course?.title || '-'}</span>
                                                    <span style={{ color: 'var(--border-color)' }}>|</span>
                                                    <span>{new Date(attempt.attempted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                                                {/* Score & Stats */}
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '1.5rem', fontWeight: 700,
                                                        color: attempt.passed ? '#22c55e' : '#ef4444'
                                                    }}>
                                                        {attempt.score}%
                                                    </div>
                                                    {attempt.total_questions > 0 && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {attempt.correct_answers}/{attempt.total_questions} benar
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status Badge */}
                                                <span style={{
                                                    padding: '0.35rem 0.85rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    background: attempt.passed ? '#dcfce7' : '#fef2f2',
                                                    color: attempt.passed ? '#16a34a' : '#dc2626',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {attempt.passed ? 'Lulus' : 'Tidak Lulus'}
                                                </span>

                                                {/* Expand Arrow */}
                                                {hasAnswers && (
                                                    <div style={{ color: 'var(--text-muted)', display: 'flex' }}>
                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Answer Review */}
                                        {isExpanded && hasAnswers && (
                                            <div style={{
                                                borderTop: '1px solid var(--border-color)',
                                                padding: '1.25rem 1.5rem',
                                                background: 'var(--bg-secondary)',
                                            }}>
                                                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                    Review Jawaban
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {answers.map((q, idx) => (
                                                        <div key={q.id || idx} style={{
                                                            padding: '1rem',
                                                            borderRadius: '8px',
                                                            background: 'var(--bg-primary)',
                                                            border: `1px solid ${q.isCorrect ? '#22c55e40' : '#ef444440'}`,
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                                <span style={{
                                                                    flexShrink: 0, width: '28px', height: '28px',
                                                                    borderRadius: '50%', display: 'flex',
                                                                    alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '0.8rem', fontWeight: 700,
                                                                    background: q.isCorrect ? '#dcfce7' : '#fef2f2',
                                                                    color: q.isCorrect ? '#16a34a' : '#dc2626',
                                                                }}>
                                                                    {idx + 1}
                                                                </span>
                                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, flex: 1 }}>
                                                                    {q.question}
                                                                </p>
                                                                {q.isCorrect
                                                                    ? <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                                                                    : <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                                                                }
                                                            </div>
                                                            <div style={{ marginLeft: '40px', fontSize: '0.85rem' }}>
                                                                <p style={{ margin: '0.25rem 0', color: q.isCorrect ? '#16a34a' : '#dc2626' }}>
                                                                    <strong>Jawaban Anda:</strong> {q.options?.[q.userAnswer] ?? 'Tidak dijawab'}
                                                                </p>
                                                                {!q.isCorrect && (
                                                                    <p style={{ margin: '0.25rem 0', color: '#16a34a' }}>
                                                                        <strong>Jawaban Benar:</strong> {q.options?.[q.correctAnswer]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CustomerQuizHistory;
