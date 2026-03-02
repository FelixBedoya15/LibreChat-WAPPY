import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CourseEditor() {
    const { id } = useParams();
    const isNew = id === 'new';
    const navigate = useNavigate();
    const { showToast } = useToastContext();

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Course State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [lessons, setLessons] = useState<any[]>([]);

    // Lesson Editor State
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '' });

    useEffect(() => {
        if (!isNew) {
            fetchCourse();
        }
    }, [id, isNew]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/training/courses/${id}`);
            const data = response.data;
            setTitle(data.title || '');
            setDescription(data.description || '');
            setThumbnail(data.thumbnail || '');
            setTagsText((data.tags || []).join(', '));
            setIsPublished(data.isPublished || false);

            // Sort lessons
            const sortedLessons = (data.lessons || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            setLessons(sortedLessons);
        } catch (error) {
            console.error('Error fetching course:', error);
            showToast({ message: 'Error al cargar el curso.', status: 'error' });
            navigate('/training/admin');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCourse = async () => {
        if (!title.trim()) {
            showToast({ message: 'El título es obligatorio.', status: 'warning' });
            return;
        }

        try {
            setSaving(true);
            const payload = {
                title,
                description,
                thumbnail,
                tags: tagsText.split(',').map(t => t.trim()).filter(Boolean),
                isPublished
            };

            if (isNew) {
                const response = await axios.post('/api/training/admin/courses', payload);
                showToast({ message: 'Curso creado exitosamente.', status: 'success' });
                navigate(`/training/admin/courses/${response.data._id}`);
            } else {
                await axios.put(`/api/training/admin/courses/${id}`, payload);
                showToast({ message: 'Curso actualizado.', status: 'success' });
            }
        } catch (error) {
            console.error('Error saving course:', error);
            showToast({ message: 'Error al guardar el curso.', status: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // --- Lesson Management ---
    const handleSaveLesson = async () => {
        if (!lessonForm.title.trim()) {
            showToast({ message: 'El título de la lección es obligatorio', status: 'warning' });
            return;
        }

        try {
            if (editingLessonId === 'new') {
                await axios.post(`/api/training/admin/courses/${id}/lessons`, {
                    ...lessonForm,
                    order: lessons.length + 1
                });
                showToast({ message: 'Lección agregada.', status: 'success' });
            } else {
                await axios.put(`/api/training/admin/courses/${id}/lessons/${editingLessonId}`, lessonForm);
                showToast({ message: 'Lección actualizada.', status: 'success' });
            }
            // Refresh course to get new lesson IDs
            fetchCourse();
            setEditingLessonId(null);
            setLessonForm({ title: '', videoUrl: '', content: '' });
        } catch (error) {
            console.error('Error saving lesson:', error);
            showToast({ message: 'Error al guardar la lección.', status: 'error' });
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!window.confirm('¿Eliminar esta lección?')) return;

        try {
            await axios.delete(`/api/training/admin/courses/${id}/lessons/${lessonId}`);
            showToast({ message: 'Lección eliminada.', status: 'success' });
            fetchCourse();
        } catch (error) {
            console.error('Error deleting lesson:', error);
            showToast({ message: 'Error al eliminar lección.', status: 'error' });
        }
    };

    const openLessonEditor = (lesson: any = null) => {
        if (lesson) {
            setEditingLessonId(lesson._id);
            setLessonForm({
                title: lesson.title || '',
                videoUrl: lesson.videoUrl || '',
                content: lesson.content || ''
            });
        } else {
            setEditingLessonId('new');
            setLessonForm({ title: '', videoUrl: '', content: '' });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando editor...</div>;

    return (
        <div className="flex justify-center w-full min-h-full bg-gray-50 dark:bg-gray-900 py-8 px-4">
            <div className="w-full max-w-4xl space-y-6">

                {/* Header Navbar */}
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/training/admin')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold">
                            {isNew ? 'Crear Nuevo Curso' : 'Editar Curso'}
                        </h1>
                    </div>

                    <button
                        onClick={handleSaveCourse}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Curso'}
                    </button>
                </div>

                {/* Main Settings Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                            <h2 className="text-lg font-semibold">Configuración General</h2>

                            {/* Publish Toggle */}
                            <label className="flex items-center cursor-pointer">
                                <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    {isPublished ? 'Publicado' : 'Borrador'}
                                </span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${isPublished ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isPublished ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Curso *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Inducción de Seguridad..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                placeholder="Breve descripción de lo que aprenderán los usuarios..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de la Miniatura (Imagen)</label>
                                <input
                                    type="text"
                                    value={thumbnail}
                                    onChange={(e) => setThumbnail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiquetas (separadas por coma)</label>
                                <input
                                    type="text"
                                    value={tagsText}
                                    onChange={(e) => setTagsText(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Seguridad, RRHH, General"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Lessons Section - Only shown if course exists */}
                {!isNew && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                Gestor de Lecciones <span className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded-full">{lessons.length}</span>
                            </h2>
                            <button
                                onClick={() => openLessonEditor(null)}
                                className="flex items-center gap-1 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                                <Plus className="w-4 h-4" /> Agregar Lección
                            </button>
                        </div>

                        {/* Lesson List */}
                        <div className="p-2 space-y-1 bg-gray-50/50 dark:bg-gray-800/50">
                            {lessons.length === 0 ? (
                                <p className="text-center py-6 text-gray-500 text-sm">Aún no hay lecciones. Haz clic en "Agregar Lección" para empezar el contenido.</p>
                            ) : (
                                lessons.map((lesson, index) => (
                                    <div key={lesson._id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="cursor-grab text-gray-400 hover:text-gray-600">
                                                <GripVertical className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-sm text-gray-500 dark:text-gray-400 w-6">{index + 1}.</span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{lesson.title}</span>
                                            {(lesson.videoUrl || lesson.content) && (
                                                <span className="text-xs text-gray-400 flex gap-2 ml-2">
                                                    {lesson.videoUrl && <span title="Tiene Video">🎬</span>}
                                                    {lesson.content && <span title="Tiene Texto">📄</span>}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openLessonEditor(lesson)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLesson(lesson._id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Lesson Editor Modal Overlay */}
            {editingLessonId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg">
                                {editingLessonId === 'new' ? 'Nueva Lección' : 'Editar Lección'}
                            </h3>
                            <button onClick={() => setEditingLessonId(null)} className="text-gray-500 hover:text-gray-700 p-1">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título de la lección *</label>
                                <input
                                    type="text"
                                    value={lessonForm.title}
                                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">URL del Video (Youtube/Vimeo)</label>
                                <input
                                    type="text"
                                    value={lessonForm.videoUrl}
                                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 outline-none focus:border-blue-500"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 flex justify-between">
                                    <span>Contenido (Soporta Markdown)</span>
                                    <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">Ayuda Markdown</a>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px]">
                                    <textarea
                                        value={lessonForm.content}
                                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                        className="w-full h-full rounded border border-gray-300 dark:border-gray-600 bg-transparent p-3 outline-none focus:border-blue-500 font-mono text-sm resize-none"
                                        placeholder="## Escribe tu texto aquí..."
                                    />
                                    <div className="h-full border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto prose prose-sm dark:prose-invert">
                                        {lessonForm.content ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonForm.content}</ReactMarkdown>
                                        ) : (
                                            <p className="text-gray-400 italic">Vista previa...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingLessonId(null)}
                                className="px-4 py-2 rounded text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveLesson}
                                className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
                            >
                                Guardar Lección
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
