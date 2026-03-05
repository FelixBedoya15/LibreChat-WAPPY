import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import {
    ChevronLeft,
    CheckCircle,
    Circle,
    PlayCircle,
    FileText,
    ChevronRight,
    Trophy,
    BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CourseViewer() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToastContext();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await axios.get(`/api/training/courses/${courseId}`);
                const data = response.data;
                // Sort lessons by order
                if (data.lessons) {
                    data.lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                }
                setCourse(data);

                // Set first incomplete lesson as active, or first lesson if all complete
                if (data.lessons && data.lessons.length > 0) {
                    const firstIncomplete = data.lessons.find((l: any) =>
                        !data.progress?.completedLessons?.includes(l._id)
                    );
                    setActiveLessonId(firstIncomplete?._id || data.lessons[0]._id);
                }
            } catch (error) {
                console.error('Error fetching course:', error);
                showToast({ message: 'Error loading course details.', status: 'error' });
                navigate('/training');
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId, navigate, showToast]);

    const markCurrentComplete = async () => {
        if (!activeLessonId || !courseId) return;

        try {
            const response = await axios.post('/api/training/progress', {
                courseId,
                lessonId: activeLessonId
            });

            showToast({ message: 'Lección completada', status: 'success' });

            // Update local state
            setCourse((prev: any) => ({
                ...prev,
                progress: response.data.progress
            }));

            // Move to next lesson if available
            const currentIndex = course.lessons.findIndex((l: any) => l._id === activeLessonId);
            if (currentIndex >= 0 && currentIndex < course.lessons.length - 1) {
                setActiveLessonId(course.lessons[currentIndex + 1]._id);
            }
        } catch (error) {
            console.error('Error marking complete:', error);
            showToast({ message: 'Error actualizando el progreso', status: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!course) return null;

    const activeLesson = course.lessons?.find((l: any) => l._id === activeLessonId);
    const isCurrentCompleted = course.progress?.completedLessons?.includes(activeLessonId);
    const progressPercentage = course.lessons?.length
        ? Math.round((course.progress?.completedLessons?.length || 0) / course.lessons.length * 100)
        : 0;

    return (
        <div className="flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="flex-none h-14 bg-surface-secondary border-b border-light flex items-center justify-between px-4 sticky top-0 z-20">
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => {
                            if (window.innerWidth < 768 && !sidebarOpen) {
                                setSidebarOpen(true);
                            } else {
                                navigate('/training');
                            }
                        }}
                        className="rounded-full p-2 hover:bg-surface-tertiary transition-colors relative"
                        aria-label="Back"
                    >
                        <ChevronLeft className="h-6 w-6 text-text-primary dark:text-gray-300" />
                    </button>
                    <div className="h-6 w-px bg-light mx-1 hidden md:block"></div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden md:flex p-1.5 hover:bg-surface-hover rounded-md text-secondary transition-colors"
                        title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-semibold truncate max-w-[200px] md:max-w-md">
                        {course.title}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-xs font-medium text-secondary">
                        <span>{progressPercentage}% Completado</span>
                        <div className="w-24 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* LearnDash Sidebar - Lesson Navigation */}
                <div className={`
                    absolute md:relative z-10 
                    h-full bg-surface-secondary border-r border-light flex flex-col
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'w-full md:w-80 translate-x-0' : 'w-80 -translate-x-full hidden md:flex md:w-0 md:translate-x-0 md:border-none'}
                `}>
                    <div className="p-4 border-b border-light">
                        <h2 className="font-semibold text-lg mb-1">Contenido del Curso</h2>
                        <p className="text-xs text-secondary">{course.lessons?.length || 0} Lecciones</p>
                    </div>

                    <div className="flex-1 overflow-y-auto hidden-scrollbar">
                        <div className="flex flex-col">
                            {course.lessons?.map((lesson: any, index: number) => {
                                const isCompleted = course.progress?.completedLessons?.includes(lesson._id);
                                const isActive = activeLessonId === lesson._id;

                                return (
                                    <button
                                        key={lesson._id}
                                        onClick={() => {
                                            setActiveLessonId(lesson._id);
                                            if (window.innerWidth < 768) setSidebarOpen(false);
                                        }}
                                        className={`
                                            flex items-start gap-3 p-4 text-left border-b border-light/50 transition-colors
                                            ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'hover:bg-surface-hover border-l-4 border-l-transparent'}
                                        `}
                                    >
                                        <div className="mt-0.5">
                                            {isCompleted ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Circle className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium leading-snug line-clamp-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>
                                                {index + 1}. {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-secondary">
                                                {lesson.videoUrl ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                                <span>{lesson.videoUrl ? 'Video' : 'Lectura'}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {course.progress?.isCompleted && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-900/40 text-center">
                            <Trophy className="w-8 h-8 mx-auto text-green-500 mb-2" />
                            <h3 className="text-sm font-bold text-green-800 dark:text-green-300">¡Curso Completado!</h3>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Has finalizado todas las lecciones.</p>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
                    <div className="flex-1 overflow-y-auto">
                        {activeLesson ? (
                            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                                <div className="mb-6 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 w-fit px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800 shadow-sm">
                                        <BookOpen className="w-3 h-3" />
                                        Lección {course.lessons.findIndex((l: any) => l._id === activeLesson._id) + 1} de {course.lessons?.length || 0}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                                        {activeLesson.title}
                                    </h2>
                                </div>

                                {activeLesson.videoUrl && (
                                    <div className="aspect-video mb-8 bg-black rounded-xl overflow-hidden shadow-lg relative">
                                        {(() => {
                                            let embedUrl = '';
                                            const url = activeLesson.videoUrl;
                                            if (url.includes('youtube.com/watch?v=')) {
                                                const videoId = url.split('v=')[1]?.split('&')[0];
                                                embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&origin=${window.location.origin}`;
                                            } else if (url.includes('youtu.be/')) {
                                                const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                                                embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&origin=${window.location.origin}`;
                                            }

                                            if (embedUrl) {
                                                return (
                                                    <div className="w-full h-full absolute inset-0 group">
                                                        <iframe
                                                            src={embedUrl}
                                                            title={activeLesson.title}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            className="w-full h-full absolute inset-0"
                                                        ></iframe>
                                                        {/* Protect from navigation - Transparent Overlays */}
                                                        {/* 1. Header Protect (Title/Share) */}
                                                        <div className="absolute top-0 left-0 w-full h-16 z-10 bg-transparent" />
                                                        {/* 2. YouTube Logo Protect (Bottom Right) - Leaves space for fullscreen button */}
                                                        <div className="absolute bottom-0 right-14 w-32 h-14 z-10 bg-transparent" />
                                                        {/* 3. Center/Play Button (Optional, but helps prevent double-click to YouTube) */}
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 z-10 bg-transparent pointer-events-none" />
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="flex items-center justify-center h-full w-full flex-col text-gray-400 absolute inset-0">
                                                    <PlayCircle className="w-16 h-16 mb-4 opacity-50" />
                                                    <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                                                        Abrir Video en nueva pestaña
                                                    </a>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {activeLesson.content && (
                                    <div className="prose prose-blue dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {activeLesson.content}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {activeLesson.exam?.isEnabled && (
                                    <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-indigo-100 dark:border-indigo-700">
                                            <span className="text-2xl">📝</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2">{activeLesson.exam.title || 'Evaluación de Lección'}</h3>
                                        <p className="text-indigo-700 dark:text-indigo-300 max-w-xl mx-auto mb-6">
                                            {activeLesson.exam.description || 'Para validar tu aprendizaje y completar esta lección, debes aprobar esta evaluación.'}
                                        </p>
                                        <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all" onClick={() => alert('La función para presentar exámenes estará disponible pronto!')}>
                                            Comenzar Examen ({activeLesson.exam.questions?.length || 0} preguntas)
                                        </button>
                                    </div>
                                )}

                                {/* Bottom Navigation / Actions */}
                                <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end">
                                    <button
                                        onClick={markCurrentComplete}
                                        className={`group flex items-center px-4 py-3 rounded-full transition-all duration-300 shadow-sm font-medium text-sm
                                            ${isCurrentCompleted
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default shadow-none'
                                                : 'bg-green-500 hover:bg-green-600 text-white'}
                                        `}
                                        disabled={isCurrentCompleted}
                                    >
                                        {isCurrentCompleted ? (
                                            <>
                                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                                <span className="ml-2 whitespace-nowrap">
                                                    Lección Completada
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                                    Marcar como Completado
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500">
                                Selecciona una lección para comenzar
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
