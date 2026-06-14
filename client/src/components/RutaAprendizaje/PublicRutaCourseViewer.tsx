import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { ChevronLeft, CheckCircle, Circle, PlayCircle, FileText, Trophy, BookOpen, AlertCircle, ArrowLeft, GraduationCap, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RutaCertificate from './RutaCertificate';

interface WorkerSession {
    companyId: string;
    companyName: string;
    nombre: string;
    cedula: string;
    cargo: string;
}

export default function PublicRutaCourseViewer() {
    const { companyId, courseId } = useParams<{ companyId: string; courseId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToastContext();

    const [session, setSession] = useState<WorkerSession | null>(null);
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

    // Quiz taking states
    const [isTakingExam, setIsTakingExam] = useState(false);
    const [examQuestions, setExamQuestions] = useState<any[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [examResult, setExamResult] = useState<{ score: number; passed: boolean; showExplanation: boolean } | null>(null);
    const [currentExamType, setCurrentExamType] = useState<'lesson' | 'course'>('lesson');

    // Certificate View State
    const [showCertificate, setShowCertificate] = useState(false);

    // Initial session verify
    useEffect(() => {
        const stored = localStorage.getItem('wappy_worker_session');
        if (!stored) {
            navigate(`/sgsst-public/ruta-aprendizaje/${companyId}`);
            return;
        }

        try {
            const parsed = JSON.parse(stored) as WorkerSession;
            if (parsed.companyId !== companyId) {
                localStorage.removeItem('wappy_worker_session');
                navigate(`/sgsst-public/ruta-aprendizaje/${companyId}`);
                return;
            }
            setSession(parsed);
        } catch (e) {
            localStorage.removeItem('wappy_worker_session');
            navigate(`/sgsst-public/ruta-aprendizaje/${companyId}`);
            return;
        }

        const fetchCompany = async () => {
            try {
                const response = await axios.get(`/api/ruta-aprendizaje/public/company/${companyId}`);
                setCompanyDetails(response.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchCompany();
    }, [companyId]);

    // Load course data and progress
    const fetchCourseData = async (workerCedula: string) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/ruta-aprendizaje/public/courses/${companyId}/${courseId}?cedula=${workerCedula}&cargo=${encodeURIComponent(session?.cargo || '')}`
            );
            const data = response.data;
            if (data.lessons) {
                data.lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            }
            setCourse(data);

            if (data.lessons && data.lessons.length > 0) {
                const incomplete = data.lessons.find((l: any) =>
                    !data.progress?.completedLessons?.includes(l._id)
                );
                setActiveLessonId(incomplete?._id || data.lessons[0]._id);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            showToast({ message: 'Error al cargar el contenido del curso.', status: 'error' });
            navigate(`/sgsst-public/ruta-aprendizaje/${companyId}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session && courseId) {
            fetchCourseData(session.cedula);
        }
    }, [session, courseId]);

    const markCurrentComplete = async () => {
        if (!session || !activeLessonId || !courseId || !companyId) return;

        try {
            const response = await axios.post('/api/ruta-aprendizaje/public/progress', {
                companyId,
                courseId,
                lessonId: activeLessonId,
                workerCedula: session.cedula,
                workerName: session.nombre
            });

            showToast({ message: '¡Lección completada!', status: 'success' });

            // Reload course data to refresh progress
            await fetchCourseData(session.cedula);
        } catch (error) {
            console.error('Error updating progress:', error);
            showToast({ message: 'Error al guardar el progreso.', status: 'error' });
        }
    };

    // Starts exam flow
    const startExam = (questions: any[], type: 'lesson' | 'course') => {
        setExamQuestions(questions);
        setCurrentExamType(type);
        setUserAnswers({});
        setExamResult(null);
        setIsTakingExam(true);
    };

    const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: optionIndex
        }));
    };

    const submitExam = () => {
        if (Object.keys(userAnswers).length < examQuestions.length) {
            showToast({ message: 'Responde todas las preguntas antes de enviar.', status: 'warning' });
            return;
        }

        // Calculate score
        let correctCount = 0;
        examQuestions.forEach((q, idx) => {
            if (userAnswers[idx] === q.correctOptionIndex) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / examQuestions.length) * 100);
        const passingScore = currentExamType === 'lesson' 
            ? (activeLesson?.exam?.passingScore || 70) 
            : (course?.exam?.passingScore || 70);
        const passed = score >= passingScore;

        setExamResult({
            score,
            passed,
            showExplanation: true
        });

        if (passed) {
            showToast({ message: `¡Felicidades! Aprobaste con ${score}%`, status: 'success' });
            if (currentExamType === 'lesson') {
                markCurrentComplete();
            } else {
                // Course final exam approved -> Force course completion
                // We mark the last lesson again to trigger isCourseCompleted inside the backend
                if (course.lessons && course.lessons.length > 0) {
                    const lastLessonId = course.lessons[course.lessons.length - 1]._id;
                    axios.post('/api/ruta-aprendizaje/public/progress', {
                        companyId,
                        courseId,
                        lessonId: lastLessonId,
                        workerCedula: session?.cedula,
                        workerName: session?.nombre
                    }).then(() => {
                        fetchCourseData(session?.cedula || '');
                    });
                }
            }
        } else {
            showToast({ message: `No alcanzaste el puntaje requerido de ${passingScore}%. Inténtalo de nuevo.`, status: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-screen bg-slate-950 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!course || !session) return null;

    const activeLesson = course.lessons?.find((l: any) => l._id === activeLessonId);
    const isCurrentCompleted = course.progress?.completedLessons?.includes(activeLessonId);
    const completedCount = course.progress?.completedLessons?.length || 0;
    const totalLessons = course.lessons?.length || 0;
    const allLessonsCompleted = completedCount >= totalLessons;
    
    // Check if the final exam is required and completed
    const hasFinalExam = course.exam?.isEnabled;
    const isCourseCompleted = course.progress?.isCompleted;

    return (
        <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header navbar */}
            <div className="flex-none h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-20">
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => navigate(`/sgsst-public/ruta-aprendizaje/${companyId}`)}
                        className="rounded-full p-2 hover:bg-slate-800 transition-colors"
                        aria-label="Back"
                    >
                        <ChevronLeft className="h-6 w-6 text-slate-300" />
                    </button>
                    <div className="h-6 w-px bg-slate-800 mx-1"></div>
                    <h1 className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-md">
                        {course.title}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <span>{completedCount}/{totalLessons} Lecciones</span>
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* LearnDash Sidebar */}
                <div className={`
                    absolute md:relative z-10 
                    h-full bg-slate-900 border-r border-slate-800 flex flex-col w-80 shrink-0
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-80'}
                `}>
                    <div className="p-4 border-b border-slate-800">
                        <h2 className="font-bold text-white text-base">Contenido de la Ruta</h2>
                        <p className="text-xs text-slate-400">{totalLessons} Lecciones en total</p>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="flex flex-col">
                            {course.lessons?.map((lesson: any, index: number) => {
                                const isCompleted = course.progress?.completedLessons?.includes(lesson._id);
                                const isActive = activeLessonId === lesson._id && !isTakingExam;

                                return (
                                    <button
                                        key={lesson._id}
                                        onClick={() => {
                                            setActiveLessonId(lesson._id);
                                            setIsTakingExam(false);
                                            if (window.innerWidth < 768) setSidebarOpen(false);
                                        }}
                                        className={`
                                            flex items-start gap-3 p-4 text-left border-b border-slate-800/50 transition-all
                                            ${isActive ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500' : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'}
                                        `}
                                    >
                                        <div className="mt-0.5">
                                            {isCompleted ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <Circle className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold leading-snug line-clamp-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                {index + 1}. {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                {lesson.videoUrl ? <PlayCircle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                                <span>{lesson.videoUrl ? 'Video' : 'Lectura'}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Final course exam access inside the sidebar */}
                        {hasFinalExam && allLessonsCompleted && (
                            <div className="p-4 border-t border-slate-800">
                                <button
                                    onClick={() => startExam(course.exam.questions, 'course')}
                                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all
                                        ${isCourseCompleted 
                                            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30' 
                                            : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'
                                        }
                                    `}
                                >
                                    📝 {isCourseCompleted ? 'Examen Final Aprobado' : 'Presentar Examen Final'}
                                </button>
                            </div>
                        )}
                    </div>

                    {isCourseCompleted && (
                        <div className="p-4 bg-emerald-950/30 border-t border-emerald-900/40 text-center space-y-3">
                            <Trophy className="w-8 h-8 mx-auto text-emerald-400" />
                            <div>
                                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider">¡Ruta Finalizada!</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Has completado todas las lecciones y evaluaciones.</p>
                            </div>
                            <button
                                onClick={() => setShowCertificate(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow"
                            >
                                <Award className="w-4 h-4" /> Ver Certificado
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                        
                        {/* Exam Taking Flow */}
                        {isTakingExam ? (
                            <div className="max-w-3xl mx-auto space-y-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                                <div className="border-b border-slate-800 pb-4">
                                    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Evaluación en progreso</span>
                                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                                        {currentExamType === 'lesson' ? `Examen de Lección: ${activeLesson?.title}` : `Evaluación Final: ${course.title}`}
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Requisito para aprobar: {currentExamType === 'lesson' ? activeLesson?.exam?.passingScore : course?.exam?.passingScore}% de respuestas correctas.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {examQuestions.map((q, qIndex) => (
                                        <div key={qIndex} className="space-y-3">
                                            <h4 className="font-bold text-white text-base">
                                                {qIndex + 1}. {q.questionText}
                                            </h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {q.options.map((opt: string, oIndex: number) => {
                                                    const isSelected = userAnswers[qIndex] === oIndex;
                                                    const showCorrection = examResult !== null;
                                                    const isCorrect = oIndex === q.correctOptionIndex;

                                                    let borderClass = 'border-slate-800 hover:border-slate-700 bg-slate-900/50';
                                                    if (isSelected) borderClass = 'border-indigo-500 bg-indigo-950/20 text-indigo-300';
                                                    if (showCorrection) {
                                                        if (isCorrect) borderClass = 'border-emerald-500 bg-emerald-950/20 text-emerald-400';
                                                        else if (isSelected) borderClass = 'border-red-500 bg-red-950/20 text-red-400';
                                                    }

                                                    return (
                                                        <button
                                                            key={oIndex}
                                                            disabled={showCorrection}
                                                            onClick={() => handleAnswerSelect(qIndex, oIndex)}
                                                            className={`text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between gap-4 ${borderClass}`}
                                                        >
                                                            <span>{opt}</span>
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0
                                                                ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'}
                                                            `}>
                                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            
                                            {/* Question feedback */}
                                            {examResult && q.explanation && (
                                                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
                                                    <strong>Explicación:</strong> {q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Exam results / submission footer */}
                                <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {examResult ? (
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${examResult.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                <Trophy className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Resultado</p>
                                                <h4 className="font-extrabold text-base text-white">
                                                    Puntaje: {examResult.score}% - {examResult.passed ? 'APROBADO' : 'NO APROBADO'}
                                                </h4>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">Responde todas las preguntas de la evaluación para calificar.</span>
                                    )}

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {examResult ? (
                                            examResult.passed ? (
                                                <button
                                                    onClick={() => {
                                                        setIsTakingExam(false);
                                                        setExamResult(null);
                                                    }}
                                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 py-3 font-bold text-sm transition-colors"
                                                >
                                                    Continuar
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => startExam(examQuestions, currentExamType)}
                                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-3 font-bold text-sm transition-colors"
                                                >
                                                    Reintentar Examen
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                onClick={submitExam}
                                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-3 font-bold text-sm transition-colors"
                                            >
                                                Calificar Examen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : activeLesson ? (
                            /* Standard Lesson Content View */
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/20 w-fit px-3 py-1.5 rounded-full border border-emerald-900/30 shadow-sm">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        Lección {course.lessons.findIndex((l: any) => l._id === activeLesson._id) + 1} de {totalLessons}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                                        {activeLesson.title}
                                    </h2>
                                </div>

                                {/* Video section */}
                                {activeLesson.videoUrl && (
                                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl relative border border-slate-800">
                                        {(() => {
                                            let embedUrl = '';
                                            const url = activeLesson.videoUrl;
                                            if (url.includes('youtube.com/watch?v=')) {
                                                const videoId = url.split('v=')[1]?.split('&')[0];
                                                embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3`;
                                            } else if (url.includes('youtu.be/')) {
                                                const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                                                embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3`;
                                            }

                                            if (embedUrl) {
                                                return (
                                                    <iframe
                                                        src={embedUrl}
                                                        title={activeLesson.title}
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="w-full h-full absolute inset-0 border-0"
                                                    ></iframe>
                                                );
                                            }
                                            return (
                                                <div className="flex items-center justify-center h-full w-full flex-col text-slate-500 absolute inset-0">
                                                    <PlayCircle className="w-16 h-16 mb-4 opacity-50 text-slate-600" />
                                                    <a href={url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                                                        Abrir Video en nueva pestaña
                                                    </a>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Markdown Content */}
                                {activeLesson.content && (
                                    <div className="prose prose-slate dark:prose-invert max-w-none prose-emerald bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-md">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {activeLesson.content}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {/* Lesson Exam Banner */}
                                {activeLesson.exam?.isEnabled && (
                                    <div className="p-6 bg-indigo-950/20 rounded-2xl border border-indigo-900/30 flex flex-col items-center text-center">
                                        <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow border border-indigo-900/40">
                                            <span className="text-xl">📝</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">{activeLesson.exam.title || 'Evaluación de la Lección'}</h3>
                                        <p className="text-xs text-slate-400 max-w-lg mx-auto mb-5 leading-relaxed">
                                            {activeLesson.exam.description || 'Para validar tu aprendizaje y completar esta lección, debes resolver y aprobar este cuestionario.'}
                                        </p>
                                        <button 
                                            onClick={() => startExam(activeLesson.exam.questions, 'lesson')}
                                            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all
                                                ${isCurrentCompleted 
                                                    ? 'bg-slate-800 text-slate-400 cursor-default' 
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                                                }
                                            `}
                                            disabled={isCurrentCompleted}
                                        >
                                            {isCurrentCompleted ? 'Evaluación Aprobada' : `Comenzar Evaluación (${activeLesson.exam.questions?.length || 0} preguntas)`}
                                        </button>
                                    </div>
                                )}

                                {/* Mark complete button */}
                                {!activeLesson.exam?.isEnabled && (
                                    <div className="pt-6 border-t border-slate-800 flex items-center justify-end">
                                        <button
                                            onClick={markCurrentComplete}
                                            disabled={isCurrentCompleted}
                                            className={`group flex items-center px-6 py-3 rounded-full font-bold text-sm tracking-wide transition-all shadow
                                                ${isCurrentCompleted
                                                    ? 'bg-slate-800 text-slate-500 cursor-default shadow-none'
                                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                }
                                            `}
                                        >
                                            {isCurrentCompleted ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                                                    <span className="ml-2">Lección Completada</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                                    <span className="ml-2">Marcar Lección como Completada</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                                Selecciona una lección del menú izquierdo para comenzar.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Certificate View Modal */}
            {showCertificate && session && (
                <RutaCertificate
                    course={course}
                    worker={{
                        nombre: session.nombre,
                        cedula: session.cedula,
                        cargo: session.cargo
                    }}
                    company={{
                        companyName: session.companyName,
                        nit: companyDetails?.nit || '',
                        logo: companyDetails?.logo || null,
                        legalRepresentative: companyDetails?.legalRepresentative
                    }}
                    onClose={() => setShowCertificate(false)}
                />
            )}
        </div>
    );
}
