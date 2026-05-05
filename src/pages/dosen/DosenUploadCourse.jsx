import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Image, Video, Save, ArrowLeft, Plus, Trash2, FileText,
    ExternalLink, ClipboardCheck, ChevronDown, ChevronUp,
    PlayCircle, ImageIcon, AlertCircle, Edit, Loader2, GripVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DosenSidebar from '../../components/DosenSidebar';
import './DosenPages.css';

const DosenUploadCourse = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    
    // Upload Progress States
    const [uploadProgress, setUploadProgress] = useState({});

    // Form States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        level: 'Beginner',
        price: '',
        isFree: true,
        thumbnail_url: ''
    });

    // Deferred upload: store File objects, upload only on submit
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');

    const [chapters, setChapters] = useState([
        {
            id: Date.now(),
            title: 'Bab 1: Pendahuluan',
            expanded: true,
            contents: []
        }
    ]);

    const [showContentModal, setShowContentModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [selectedChapterId, setSelectedChapterId] = useState(null);
    const [editingContentId, setEditingContentId] = useState(null);

    // New content form — fileObj stores the actual File for deferred upload
    const [newContent, setNewContent] = useState({
        type: 'video',
        title: '',
        duration: '',
        fileUrl: '',
        fileName: '',
        description: '',
        fileObj: null
    });

    // Quiz Premium Modal States
    const [quizForm, setQuizForm] = useState({
        title: '',
        duration: '10',
        passingScore: 80,
        questions: []
    });
    
    const [activeQuestionId, setActiveQuestionId] = useState(null);

    // Current question being edited
    const [currentQuestion, setCurrentQuestion] = useState({
        id: Date.now(),
        question: '',
        image: null,
        options: ['', '', '', ''],
        correctAnswer: 0
    });

    const levels = [
        { value: 'Beginner', label: 'Pemula (Beginner)' },
        { value: 'Intermediate', label: 'Menengah (Intermediate)' },
        { value: 'Advanced', label: 'Mahir (Advanced)' },
        { value: 'All Levels', label: 'Semua Tingkatan (All Levels)' },
    ];

    const contentTypes = [
        { type: 'video', label: 'Video', icon: Video, color: '#a78bfa' },
        { type: 'pdf', label: 'PDF Document', icon: FileText, color: '#ef4444' },
        { type: 'link', label: 'External Link', icon: ExternalLink, color: '#3b82f6' },
    ];

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase.from('categories').select('*').order('name');
            if (!error && data) {
                setCategories(data);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // ==========================================
    // DEFERRED UPLOAD HANDLERS
    // Files are stored in memory, uploaded only on publish
    // ==========================================
    const uploadToSupabase = async (file, folder) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('course-assets')
            .upload(filePath, file);

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from('course-assets')
            .getPublicUrl(filePath);
            
        return publicUrl;
    };

    const uploadVideoToCloudinary = (file, progressKey) => {
        return new Promise((resolve, reject) => {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) {
                alert('VITE_CLOUDINARY_CLOUD_NAME belum di set!');
                return reject(new Error('Missing Cloudinary Config'));
            }

            const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(prev => ({ ...prev, [progressKey]: percentComplete }));
                }
            };
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    setUploadProgress(prev => ({ ...prev, [progressKey]: null }));
                    resolve(response.secure_url);
                } else {
                    let errorMsg = 'Upload gagal';
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        console.error("Cloudinary Error:", errorResponse);
                        errorMsg = errorResponse.error?.message || errorMsg;
                    } catch(e) {}
                    setUploadProgress(prev => ({ ...prev, [progressKey]: null }));
                    reject(new Error(errorMsg));
                }
            };
            
            xhr.onerror = () => {
                setUploadProgress(prev => ({ ...prev, [progressKey]: null }));
                reject(new Error('Network error'));
            };
            
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
            
            xhr.send(uploadData);
        });
    };

    // LOCAL file selection — no upload happens here!
    const handleLocalFileSelect = (e, type, callback) => {
        const file = e.target.files[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        callback(file, previewUrl, file.name);
    };

    // Chapter functions
    const addChapter = () => {
        const newChapter = {
            id: Date.now(),
            title: `Bab ${chapters.length + 1}: Bab Baru`,
            expanded: true,
            contents: []
        };
        setChapters([...chapters, newChapter]);
    };

    const removeChapter = (chapterId) => {
        setChapters(chapters.filter(ch => ch.id !== chapterId));
    };

    const updateChapterTitle = (chapterId, title) => {
        setChapters(chapters.map(ch =>
            ch.id === chapterId ? { ...ch, title } : ch
        ));
    };

    const toggleChapter = (chapterId) => {
        setChapters(chapters.map(ch =>
            ch.id === chapterId ? { ...ch, expanded: !ch.expanded } : ch
        ));
    };

    // Content functions
    const openContentModal = (chapterId) => {
        setSelectedChapterId(chapterId);
        setNewContent({
            type: 'video',
            title: '',
            duration: '',
            fileUrl: '',
            fileName: '',
            description: '',
            fileObj: null
        });
        setShowContentModal(true);
    };

    const openEditContentModal = (chapterId, content) => {
        setSelectedChapterId(chapterId);
        setEditingContentId(content.id);
        
        if (content.type === 'exercise') {
            setQuizForm({
                title: content.title,
                duration: content.duration?.toString() || '10',
                passingScore: content.passingScore || 80,
                questions: content.questions || []
            });
            
            if (content.questions && content.questions.length > 0) {
                setCurrentQuestion(content.questions[0]);
                setActiveQuestionId(content.questions[0].id);
            } else {
                startNewQuestion();
            }
            setShowQuizModal(true);
        } else {
            setNewContent({
                type: content.type,
                title: content.title,
                duration: content.duration || '',
                fileUrl: content.fileUrl || content.url || '',
                fileName: content.fileName || (content.url ? 'File sudah dipilih' : ''),
                description: content.description || '',
                fileObj: content.fileObj || null
            });
            setShowContentModal(true);
        }
    };

    const addContent = () => {
        if (!newContent.title || (!newContent.fileUrl && newContent.type !== 'link')) {
            alert('Judul dan File wajib diisi');
            return;
        }
        if (newContent.type === 'link' && !newContent.fileUrl) {
            alert('URL wajib diisi');
            return;
        }

        if (editingContentId) {
            setChapters(chapters.map(ch =>
                ch.id === selectedChapterId
                    ? {
                        ...ch, contents: ch.contents.map(c =>
                            c.id === editingContentId
                                ? { ...c, ...newContent, url: newContent.fileUrl }
                                : c
                        )
                    }
                    : ch
            ));
            setEditingContentId(null);
        } else {
            const content = {
                id: Date.now(),
                ...newContent,
                url: newContent.fileUrl,
                required: newContent.type === 'video'
            };

            setChapters(chapters.map(ch =>
                ch.id === selectedChapterId
                    ? { ...ch, contents: [...ch.contents, content] }
                    : ch
            ));
        }

        setShowContentModal(false);
    };

    const removeContent = (chapterId, contentId) => {
        setChapters(chapters.map(ch =>
            ch.id === chapterId
                ? { ...ch, contents: ch.contents.filter(c => c.id !== contentId) }
                : ch
        ));
    };

    // Premium Quiz Modal Functions
    const openQuizModal = (chapterId) => {
        setSelectedChapterId(chapterId);
        setEditingContentId(null);
        setQuizForm({
            title: '',
            duration: '10',
            passingScore: 80,
            questions: []
        });
        startNewQuestion();
        setShowQuizModal(true);
    };

    const startNewQuestion = () => {
        const newQ = {
            id: Date.now(),
            question: '',
            image: null,
            options: ['', '', '', ''],
            correctAnswer: 0
        };
        setCurrentQuestion(newQ);
        setActiveQuestionId(newQ.id);
    };

    const saveCurrentQuestion = () => {
        if (!currentQuestion.question || currentQuestion.options.some(o => !o.trim())) {
            alert('Mohon isi soal dan semua pilihan jawaban');
            return;
        }

        setQuizForm(prev => {
            const exists = prev.questions.find(q => q.id === currentQuestion.id);
            if (exists) {
                return {
                    ...prev,
                    questions: prev.questions.map(q => q.id === currentQuestion.id ? currentQuestion : q)
                };
            }
            return {
                ...prev,
                questions: [...prev.questions, currentQuestion]
            };
        });
        startNewQuestion();
    };

    const editQuestion = (q) => {
        setCurrentQuestion(q);
        setActiveQuestionId(q.id);
    };

    const removeQuestionFromQuiz = (e, questionId) => {
        e.stopPropagation(); // prevent triggering editQuestion
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== questionId)
        }));
        if (activeQuestionId === questionId) {
            startNewQuestion();
        }
    };

    const confirmSaveQuiz = () => {
        if (window.confirm("Apakah Anda yakin ingin menyimpan kuis ini ke dalam materi?")) {
            saveQuiz();
        }
    };

    const saveQuiz = () => {
        if (!quizForm.title || quizForm.questions.length === 0) {
            alert('Mohon isi judul kuis dan tambahkan minimal 1 soal');
            return;
        }

        // Save current question if it has text but hasn't been saved yet
        if (currentQuestion.question.trim() && !quizForm.questions.find(q => q.id === currentQuestion.id)) {
            if (window.confirm('Ada soal yang belum disimpan. Simpan otomatis lalu tutup?')) {
                saveCurrentQuestion();
            } else {
                return;
            }
        }

        const quiz = {
            id: editingContentId || Date.now(),
            type: 'exercise',
            title: quizForm.title,
            duration: parseInt(quizForm.duration),
            passingScore: quizForm.passingScore,
            required: true,
            questions: quizForm.questions.map((q, idx) => ({
                ...q,
                id: q.id.toString().startsWith('temp') ? Date.now() + Math.random() : q.id
            }))
        };

        if (editingContentId) {
            setChapters(chapters.map(ch =>
                ch.id === selectedChapterId
                    ? { ...ch, contents: ch.contents.map(c => c.id === editingContentId ? quiz : c) }
                    : ch
            ));
            setEditingContentId(null);
        } else {
            setChapters(chapters.map(ch =>
                ch.id === selectedChapterId
                    ? { ...ch, contents: [...ch.contents, quiz] }
                    : ch
            ));
        }

        setShowQuizModal(false);
    };

    // ==========================================
    // SAVE TO SUPABASE (THE REAL DEAL)
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validation
        if (!formData.category_id) return alert('Kategori harus dipilih');
        if (!thumbnailFile && !formData.thumbnail_url) return alert('Thumbnail kursus wajib diupload');

        for (const chapter of chapters) {
            const hasVideo = chapter.contents.some(c => c.type === 'video');
            const hasExercise = chapter.contents.some(c => c.type === 'exercise');

            if (!hasVideo) return alert(`Bab "${chapter.title}" harus memiliki minimal 1 video`);
            if (!hasExercise) return alert(`Bab "${chapter.title}" harus memiliki minimal 1 kuis`);
        }

        try {
            setIsSubmitting(true);
            setUploadProgress({ overall: 0 });

            // 2. Upload thumbnail (only now, not earlier!)
            let finalThumbnailUrl = formData.thumbnail_url;
            if (thumbnailFile) {
                setUploadProgress({ overall: 5 });
                finalThumbnailUrl = await uploadToSupabase(thumbnailFile, 'images');
            }

            // 3. Upload all content files that have fileObj
            setUploadProgress({ overall: 15 });
            const uploadedChapters = [];
            let totalFiles = 0;
            let uploadedFiles = 0;

            // Count total files to upload
            for (const ch of chapters) {
                for (const c of ch.contents) {
                    if (c.fileObj) totalFiles++;
                    if (c.type === 'exercise' && c.questions) {
                        for (const q of c.questions) {
                            if (q.imageFile) totalFiles++;
                        }
                    }
                }
            }

            for (const chapter of chapters) {
                const uploadedContents = [];
                for (const content of chapter.contents) {
                    let finalUrl = content.url || content.fileUrl || '';

                    // Upload file if it has a pending File object
                    if (content.fileObj) {
                        const progressKey = `file_${content.id}`;
                        if (content.type === 'video') {
                            finalUrl = await uploadVideoToCloudinary(content.fileObj, progressKey);
                        } else if (content.type === 'pdf') {
                            finalUrl = await uploadToSupabase(content.fileObj, 'pdfs');
                        }
                        uploadedFiles++;
                        setUploadProgress({ overall: 15 + Math.round((uploadedFiles / Math.max(totalFiles, 1)) * 70) });
                    }

                    // Upload quiz question images
                    let uploadedQuestions = content.questions;
                    if (content.type === 'exercise' && content.questions) {
                        uploadedQuestions = [];
                        for (const q of content.questions) {
                            let qImage = q.image;
                            if (q.imageFile) {
                                qImage = await uploadToSupabase(q.imageFile, 'images');
                                uploadedFiles++;
                                setUploadProgress({ overall: 15 + Math.round((uploadedFiles / Math.max(totalFiles, 1)) * 70) });
                            }
                            uploadedQuestions.push({ ...q, image: qImage, imageFile: undefined });
                        }
                    }

                    uploadedContents.push({ ...content, url: finalUrl, fileUrl: finalUrl, fileObj: undefined, questions: uploadedQuestions });
                }
                uploadedChapters.push({ ...chapter, contents: uploadedContents });
            }

            setUploadProgress({ overall: 90 });

            // 4. Insert Course
            const coursePayload = {
                title: formData.title,
                description: formData.description,
                category_id: formData.category_id,
                instructor_id: profile.id,
                level: formData.level,
                price: formData.isFree ? 0 : parseFloat(formData.price),
                thumbnail_url: finalThumbnailUrl,
                status: 'published'
            };

            const { data: course, error: courseError } = await supabase
                .from('courses')
                .insert([coursePayload])
                .select()
                .single();

            if (courseError) throw courseError;

            // 5. Insert Chapters & Contents
            for (let i = 0; i < uploadedChapters.length; i++) {
                const chapter = uploadedChapters[i];
                const { data: newChapter, error: chapterError } = await supabase
                    .from('chapters')
                    .insert([{
                        course_id: course.id,
                        title: chapter.title,
                        sort_order: i + 1
                    }])
                    .select()
                    .single();

                if (chapterError) throw chapterError;

                for (let j = 0; j < chapter.contents.length; j++) {
                    const content = chapter.contents[j];
                    
                    let finalUrlField = 'file_url';
                    if (content.type === 'video') finalUrlField = 'video_url';
                    if (content.type === 'link') finalUrlField = 'external_url';

                    const contentPayload = {
                        chapter_id: newChapter.id,
                        type: content.type,
                        title: content.title,
                        duration: content.duration ? content.duration.toString() : null,
                        [finalUrlField]: content.url || content.fileUrl,
                        link_description: content.type === 'link' ? (content.description || '') : null,
                        is_required: content.required || false,
                        sort_order: j + 1
                    };

                    const { data: newContentRecord, error: contentError } = await supabase
                        .from('contents')
                        .insert([contentPayload])
                        .select()
                        .single();

                    if (contentError) throw contentError;

                    if (content.type === 'exercise' && content.questions) {
                        const questionsToInsert = content.questions.map((q, qIdx) => ({
                            content_id: newContentRecord.id,
                            question: q.question,
                            image_url: q.image || null,
                            options: q.options,
                            correct_answer: q.correctAnswer,
                            sort_order: qIdx + 1
                        }));

                        const { error: questionsError } = await supabase
                            .from('quiz_questions')
                            .insert(questionsToInsert);

                        if (questionsError) throw questionsError;
                    }
                }
            }

            setUploadProgress({ overall: 100 });
            alert('Kursus berhasil diterbitkan secara publik!');
            navigate('/dosen/courses');

        } catch (error) {
            console.error('Error saving course:', error);
            alert('Gagal menyimpan kursus: ' + error.message);
        } finally {
            setIsSubmitting(false);
            setUploadProgress({});
        }
    };

    const getContentIcon = (type) => {
        switch (type) {
            case 'video': return <PlayCircle size={16} />;
            case 'pdf': return <FileText size={16} />;
            case 'link': return <ExternalLink size={16} />;
            case 'exercise': return <ClipboardCheck size={16} />;
            default: return <PlayCircle size={16} />;
        }
    };


    return (
        <div className="dosen-page">
            <DosenSidebar />

            <main className="dosen-main">
                <header className="dosen-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                        <Link to="/dosen/courses" className="back-link">
                            <ArrowLeft size={16} />
                            Kembali ke Daftar Kursus
                        </Link>
                        <h1 style={{ marginTop: '0.5rem' }}>Buat Kursus Baru</h1>
                    </div>
                    <span className="status-badge draft">Status: Draft</span>
                </header>

                <form onSubmit={handleSubmit} style={{ maxWidth: '100%', padding: '0 2rem', margin: '1rem auto' }}>
                    
                    {/* Basic Info Card */}
                    <section className="form-section" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.125rem', margin: 0 }}>1. Informasi Dasar</h2>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Berikan identitas utama untuk kursus Anda.</p>
                        </div>
                        <div style={{ padding: '1.5rem' }} className="form-grid">
                            <div className="form-group full-width">
                                <label>Judul Kursus <span style={{color: 'red'}}>*</span></label>
                                <input
                                    type="text" name="title" className="input"
                                    placeholder="Contoh: Pengantar Basis Data Relasional dengan MySQL"
                                    value={formData.title} onChange={handleChange} required
                                    style={{ padding: '0.8rem', fontSize: '1rem' }}
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Deskripsi Kursus <span style={{color: 'red'}}>*</span></label>
                                <textarea
                                    name="description" className="input"
                                    placeholder="Jelaskan apa saja yang akan dipelajari siswa di kursus ini..."
                                    value={formData.description} onChange={handleChange} required
                                    rows={5}
                                />
                            </div>

                            <div className="form-group">
                                <label>Kategori <span style={{color: 'red'}}>*</span></label>
                                <select
                                    name="category_id" className="input"
                                    value={formData.category_id} onChange={handleChange} required
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tingkat Kesulitan <span style={{color: 'red'}}>*</span></label>
                                <select
                                    name="level" className="input"
                                    value={formData.level} onChange={handleChange} required
                                >
                                    {levels.map(level => (
                                        <option key={level.value} value={level.value}>{level.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Card */}
                    <section className="form-section" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.125rem', margin: 0 }}>2. Pengaturan Harga</h2>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox" name="isFree"
                                    checked={formData.isFree} onChange={handleChange}
                                    style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.2rem' }}
                                />
                                <div>
                                    <span style={{ fontWeight: 600, display: 'block', fontSize: '1rem' }}>Sediakan Kursus ini secara Gratis</span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Siswa dapat langsung mendaftar dan mengakses semua materi tanpa pembayaran.</span>
                                </div>
                            </label>

                            {!formData.isFree && (
                                <div className="form-group" style={{ marginTop: '1.5rem', maxWidth: '300px' }}>
                                    <label>Harga (IDR) <span style={{color: 'red'}}>*</span></label>
                                    <input
                                        type="number" name="price" className="input"
                                        placeholder="Contoh: 150000" value={formData.price}
                                        onChange={handleChange} required={!formData.isFree}
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Thumbnail Card */}
                    <section className="form-section" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.125rem', margin: 0 }}>3. Visual Kursus</h2>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Gambar yang menarik akan meningkatkan minat siswa.</p>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            {(thumbnailPreview || formData.thumbnail_url) ? (
                                <div style={{ position: 'relative', width: 'fit-content' }}>
                                    <img 
                                        src={thumbnailPreview || formData.thumbnail_url} alt="Thumbnail" 
                                        style={{ width: '100%', maxWidth: '400px', height: 'auto', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                                    />
                                    <button
                                        type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); setFormData({ ...formData, thumbnail_url: '' }); }}
                                        style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>File akan diupload saat menekan "Simpan Kursus"</p>
                                </div>
                            ) : (
                                <label className="upload-area" style={{ display: 'block' }}>
                                    <div className="upload-icon"><Image size={28} /></div>
                                    <h3 style={{ fontSize: '1rem' }}>Klik untuk Pilih Gambar</h3>
                                    <p>Format disarankan: JPG, PNG, WEBP (Resolusi 1280x720px)</p>
                                    <input type="file" accept="image/*" hidden onChange={(e) => handleLocalFileSelect(e, 'image', (file, preview) => { setThumbnailFile(file); setThumbnailPreview(preview); })} />
                                </label>
                            )}
                        </div>
                    </section>

                    {/* Course Content Builder */}
                    <section className="form-section" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.125rem', margin: 0 }}>4. Materi Kursus (Kurikulum)</h2>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Susun silabus, materi video, dokumen, dan kuis Anda di sini.</p>
                            </div>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addChapter}>
                                <Plus size={16} /> Tambah Bab Baru
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <div className="content-requirement-notice" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#b45309' }}>
                                <AlertCircle size={18} />
                                <span>Setiap bab wajib memiliki minimal <strong>1 Video Materi</strong> dan <strong>1 Kuis Penilaian</strong>.</span>
                            </div>

                            <div className="chapters-builder">
                                {chapters.map((chapter, chapterIdx) => (
                                    <div key={chapter.id} className="chapter-builder-item">
                                        <div className="chapter-builder-header">
                                            <button type="button" className="chapter-expand-btn" onClick={() => toggleChapter(chapter.id)}>
                                                {chapter.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            <span style={{ fontWeight: 'bold' }}>Bab {chapterIdx + 1}:</span>
                                            <input
                                                type="text" className="chapter-title-input"
                                                value={chapter.title.split(': ')[1] || chapter.title}
                                                onChange={(e) => updateChapterTitle(chapter.id, `Bab ${chapterIdx + 1}: ${e.target.value}`)}
                                                placeholder="Judul Bab"
                                            />
                                            <span className="chapter-content-count">{chapter.contents.length} materi</span>
                                            {chapters.length > 1 && (
                                                <button type="button" className="btn-icon delete" onClick={() => removeChapter(chapter.id)}><Trash2 size={18} /></button>
                                            )}
                                        </div>

                                        {chapter.expanded && (
                                            <div className="chapter-contents">
                                                {chapter.contents.length === 0 ? (
                                                    <div className="empty-content-notice"><p>Belum ada materi ditambahkan</p></div>
                                                ) : (
                                                    <div className="content-list-builder">
                                                        {chapter.contents.map((content, idx) => (
                                                            <div key={content.id} className={`content-builder-item ${content.type}`}>
                                                                <div className="content-builder-info" 
                                                                     style={{ cursor: content.url ? 'pointer' : 'default', flex: 1, minWidth: 0 }}
                                                                     onClick={() => content.url && window.open(content.url, '_blank')}
                                                                     title={content.url ? 'Klik untuk pratinjau' : ''}
                                                                >
                                                                    {getContentIcon(content.type)}
                                                                    <span className="content-builder-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '200px', verticalAlign: 'bottom' }}>{content.title}</span>
                                                                    <span className={`content-type-tag ${content.type}`}>
                                                                        {content.type === 'exercise' ? 'Kuis' : content.type}
                                                                    </span>
                                                                    {content.type === 'exercise' && (
                                                                        <span className="question-count">{content.questions?.length} soal</span>
                                                                    )}
                                                                </div>
                                                                <div className="content-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button type="button" className="btn-icon" onClick={() => openEditContentModal(chapter.id, content)}><Edit size={16} /></button>
                                                                    <button type="button" className="btn-icon delete" onClick={() => removeContent(chapter.id, content.id)}><Trash2 size={18} /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="add-content-buttons">
                                                    <button type="button" className="add-content-btn" onClick={() => openContentModal(chapter.id)}>
                                                        <Plus size={16} /> Tambah File (Video/PDF)
                                                    </button>
                                                    <button type="button" className="add-content-btn quiz" onClick={() => openQuizModal(chapter.id)}>
                                                        <ClipboardCheck size={16} /> Tambah Kuis
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div className="form-actions" style={{ paddingBottom: '2rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/dosen/courses')} disabled={isSubmitting}>Batal</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                            {isSubmitting ? (
                                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {uploadProgress.overall != null ? `Mengupload file... ${uploadProgress.overall}%` : 'Menyimpan...'}</>
                            ) : (
                                <><Save size={18} /> Simpan & Publish Kursus</>
                            )}
                        </button>
                    </div>
                </form>

                {/* Modal Add Content */}
                {showContentModal && (
                    <div className="modal-overlay" onClick={() => setShowContentModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h2>Tambah Materi File</h2>

                            <div className="content-type-selector">
                                {contentTypes.map(ct => (
                                    <button
                                        key={ct.type} type="button"
                                        className={`type-option ${newContent.type === ct.type ? 'active' : ''}`}
                                        onClick={() => setNewContent({ ...newContent, type: ct.type })}
                                    >
                                        <ct.icon size={20} style={{ color: ct.color }} />
                                        <span>{ct.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="modal-form">
                                <div className="form-group">
                                    <label>Judul Materi *</label>
                                    <input type="text" className="input" value={newContent.title} onChange={(e) => setNewContent({ ...newContent, title: e.target.value })} placeholder="Judul" />
                                </div>

                                {newContent.type === 'video' && (
                                    <>
                                        <div className="form-group">
                                            <label>Durasi (Menit)</label>
                                            <input type="number" className="input" value={newContent.duration} onChange={(e) => setNewContent({ ...newContent, duration: e.target.value })} placeholder="Contoh: 15" />
                                        </div>
                                        <div className="form-group">
                                            <label>Video File *</label>
                                            <label className="upload-area small" style={{ display: 'block', padding: '1.5rem' }}>
                                                <Video size={24} style={{ margin: '0 auto 0.5rem', color: '#a78bfa' }} />
                                                <p>{newContent.fileName ? <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{newContent.fileName}</span> : 'Klik untuk pilih Video'}</p>
                                                <input type="file" accept="video/*" hidden onChange={(e) => handleLocalFileSelect(e, 'video', (file, preview, name) => setNewContent({ ...newContent, fileUrl: preview, fileName: name, fileObj: file }))} />
                                            </label>
                                            {newContent.fileUrl && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <video src={newContent.fileUrl} controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Pratinjau lokal — file akan diupload saat Simpan Kursus</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {newContent.type === 'pdf' && (
                                    <div className="form-group">
                                        <label>PDF File *</label>
                                        <label className="upload-area small" style={{ display: 'block', padding: '1.5rem' }}>
                                            <FileText size={24} style={{ margin: '0 auto 0.5rem', color: '#ef4444' }} />
                                            <p>{newContent.fileName ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{newContent.fileName}</span> : 'Klik untuk pilih PDF'}</p>
                                            <input type="file" accept="application/pdf" hidden onChange={(e) => handleLocalFileSelect(e, 'pdf', (file, preview, name) => setNewContent({ ...newContent, fileUrl: preview, fileName: name, fileObj: file }))} />
                                        </label>
                                        {newContent.fileName && (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>✅ {newContent.fileName} — akan diupload saat Simpan Kursus</p>
                                        )}
                                    </div>
                                )}

                                {newContent.type === 'link' && (
                                    <div className="form-group">
                                        <label>URL *</label>
                                        <input type="url" className="input" value={newContent.fileUrl} onChange={(e) => setNewContent({ ...newContent, fileUrl: e.target.value })} placeholder="https://..." />
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowContentModal(false)}>Batal</button>
                                <button type="button" className="btn btn-primary" onClick={addContent}>Simpan Materi</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PREMIUM QUIZ MODAL */}
                {showQuizModal && (
                    <div className="modal-overlay" style={{ padding: '2rem' }} onClick={() => setShowQuizModal(false)}>
                        <div className="quiz-modal-premium" onClick={e => e.stopPropagation()} style={{ borderRadius: '12px', width: '100%' }}>
                            
                            {/* Modal Header */}
                            <div className="quiz-modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(165,42,42,0.1)', color: 'var(--primary-500)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ClipboardCheck size={20} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 'bold' }}>Buat Kuis Baru</h2>
                                        <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)' }}>Materi: {chapters.find(c => c.id === selectedChapterId)?.title}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowQuizModal(false)}>Batal</button>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={confirmSaveQuiz} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Save size={14} /> Simpan Kuis & Tutup
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body (Two Columns) */}
                            <div className="quiz-modal-body">
                                
                                {/* LEFT COLUMN: Settings & Question List */}
                                <div className="quiz-sidebar">
                                    <div className="quiz-settings">
                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Judul Kuis <span style={{color: 'red'}}>*</span></label>
                                            <input type="text" className="input" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Contoh: Post-Test Bab 1" style={{ padding: '0.5rem 0.75rem' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Durasi (mnt)</label>
                                                <input type="number" className="input" value={quizForm.duration} onChange={(e) => setQuizForm({ ...quizForm, duration: e.target.value })} style={{ padding: '0.5rem 0.75rem' }} />
                                            </div>
                                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pass Grade (%)</label>
                                                <input type="number" className="input" value={quizForm.passingScore} onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) })} style={{ padding: '0.5rem 0.75rem' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="quiz-question-list">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Soal Kuis ({quizForm.questions.length})</h3>
                                        </div>

                                        {/* Finished Questions */}
                                        {quizForm.questions.map((q, idx) => (
                                            <div 
                                                key={q.id} 
                                                className={`q-item ${activeQuestionId === q.id ? 'active' : ''}`}
                                                onClick={() => editQuestion(q)}
                                            >
                                                <div className="q-item-num">{idx + 1}</div>
                                                <div className="q-item-content">
                                                    <div className="q-item-text">{q.question || 'Draft Soal...'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: activeQuestionId === q.id ? 'var(--primary-400)' : 'var(--success)' }}>
                                                        {activeQuestionId === q.id ? 'Sedang mengedit' : 'Selesai'}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={(e) => removeQuestionFromQuiz(e, q.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                            </div>
                                        ))}

                                        {/* New Question Draft */}
                                        {activeQuestionId && !quizForm.questions.find(q => q.id === activeQuestionId) && (
                                            <div className="q-item active">
                                                <div className="q-item-num">{quizForm.questions.length + 1}</div>
                                                <div className="q-item-content">
                                                    <div className="q-item-text" style={{ color: 'var(--primary-500)' }}>{currentQuestion.question || 'Draft Soal Baru...'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sedang dibuat</div>
                                                </div>
                                            </div>
                                        )}

                                        <button type="button" onClick={startNewQuestion} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'transparent', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <Plus size={16} /> Tambah Soal
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Canvas Editor */}
                                <div className="quiz-editor" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Soal Terpilih</span>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pilihan Ganda</span>
                                            </div>
                                        </div>

                                        {/* Question Text */}
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <textarea
                                                className="input"
                                                value={currentQuestion.question}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                                placeholder="Tuliskan pertanyaan Anda di sini..."
                                                rows={3}
                                                style={{ fontSize: '1.125rem', border: 'none', borderBottom: '2px solid var(--border-color)', borderRadius: 0, padding: '0.5rem 0', background: 'transparent', resize: 'none' }}
                                            />
                                        </div>

                                        {/* Image Upload */}
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Gambar Pendukung (Opsional)</label>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                {currentQuestion.image ? (
                                                    <div style={{ position: 'relative', width: 'fit-content' }}>
                                                        <img src={currentQuestion.image} alt="Question" style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                                        <button type="button" onClick={() => setCurrentQuestion({ ...currentQuestion, image: null })} style={{ position: 'absolute', top: 5, right: 5, background: '#ef4444', color: 'white', borderRadius: '50%', border: 'none', padding: '4px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                                                        <ImageIcon size={16} /> Upload Gambar
                                                        <input type="file" accept="image/*" hidden onChange={(e) => handleLocalFileSelect(e, 'image', (file, preview) => setCurrentQuestion({ ...currentQuestion, image: preview, imageFile: file }))} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* Options */}
                                        <div>
                                            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Pilihan Jawaban (Pilih yang benar)</label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {currentQuestion.options.map((opt, idx) => {
                                                    const isCorrect = currentQuestion.correctAnswer === idx;
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <input
                                                                type="radio" name="correctAnswer"
                                                                checked={isCorrect}
                                                                onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: idx })}
                                                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                                            />
                                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: isCorrect ? 'rgba(165,42,42,0.05)' : '#fff', border: `1px solid ${isCorrect ? 'var(--primary-400)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '0.5rem 1rem', transition: 'all 0.2s' }}>
                                                                <span style={{ fontWeight: 'bold', width: '24px', color: isCorrect ? 'var(--primary-500)' : 'var(--text-muted)' }}>{String.fromCharCode(65 + idx)}</span>
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOptions = [...currentQuestion.options];
                                                                        newOptions[idx] = e.target.value;
                                                                        setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                                                    }}
                                                                    placeholder={`Tambahkan opsi jawaban...`}
                                                                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', color: isCorrect ? 'var(--primary-500)' : 'var(--text-primary)' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="quiz-modal-footer" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" onClick={saveCurrentQuestion} style={{ background: '#A82929', color: '#fff', border: 'none', fontWeight: 'bold', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(168,41,41,0.2)' }}>
                                    Simpan Perubahan Soal
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default DosenUploadCourse;
