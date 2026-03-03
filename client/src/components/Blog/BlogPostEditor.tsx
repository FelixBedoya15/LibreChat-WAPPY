import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { ArrowLeft, Save, Sparkles, Loader2, Link as LinkIcon, FileText, Plus, Trash2 } from 'lucide-react';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ModelSelector from '~/components/SGSST/ModelSelector';

export default function BlogPostEditor() {
    const { id } = useParams();
    const isNew = id === 'new';
    const navigate = useNavigate();
    const { showToast } = useToastContext();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // AI Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [generatePrompt, setGeneratePrompt] = useState('');
    const [sources, setSources] = useState<string[]>([]);
    const [newSource, setNewSource] = useState('');

    useEffect(() => {
        if (!isNew) {
            const fetchPost = async () => {
                try {
                    const response = await axios.get(`/api/blog/${id}`);
                    const post = response.data;
                    setTitle(post.title || '');
                    setContent(post.content || '');
                    setThumbnail(post.thumbnail || '');
                    setTagsText(post.tags ? post.tags.join(', ') : '');
                    setIsPublished(post.isPublished || false);
                } catch (error) {
                    console.error('Error fetching blog post:', error);
                    showToast({ message: 'Error cargando la publicación', status: 'error' });
                    navigate('/blog/admin');
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [id, isNew, navigate, showToast]);

    const handleSave = async (publish: boolean) => {
        if (!title.trim()) {
            showToast({ message: 'El título es obligatorio', status: 'warning' });
            return;
        }

        setSaving(true);
        try {
            const tags = tagsText.split(',').map(t => t.trim()).filter(t => t);
            const payload = {
                title,
                content,
                thumbnail,
                tags,
                isPublished: publish
            };

            if (isNew) {
                await axios.post('/api/blog/create', payload);
                showToast({ message: 'Publicación creada exitosamente', status: 'success' });
            } else {
                await axios.put(`/api/blog/${id}`, payload);
                showToast({ message: 'Publicación actualizada exitosamente', status: 'success' });
            }

            setIsPublished(publish);

            // Go back to the list if created
            if (isNew) {
                navigate('/blog/admin');
            }

        } catch (error) {
            console.error('Error saving post:', error);
            showToast({ message: 'Error guardando la publicación', status: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddSource = () => {
        if (newSource.trim()) {
            setSources([...sources, newSource.trim()]);
            setNewSource('');
        }
    };

    const handleRemoveSource = (idx: number) => {
        const newSources = [...sources];
        newSources.splice(idx, 1);
        setSources(newSources);
    };

    const handleGenerate = async () => {
        if (!generatePrompt.trim() && !title.trim()) {
            showToast({ message: 'Proporciona al menos un título o descripción del tema a generar', status: 'warning' });
            return;
        }

        setIsGenerating(true);
        try {
            const topic = generatePrompt.trim() || title.trim();
            const response = await axios.post('/api/blog/admin/generate', {
                type: 'blog',
                prompt: topic,
                modelName: selectedModel,
                sources: sources
            });
            if (response.data && response.data.data) {
                setContent(response.data.data);
                showToast({ message: 'Contenido generado exitosamente', status: 'success' });
            }
        } catch (error: any) {
            console.error('Error generating content:', error);
            const errorMsg = error.response?.data?.error || 'Error generando contenido con IA';
            showToast({ message: errorMsg, status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-indigo-200 dark:bg-indigo-800 rounded-full mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Header */}
            <div className="flex-none p-4 md:p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/blog/admin')}
                        className="group flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-300"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-5 h-5 flex-shrink-0 text-gray-600 dark:text-gray-300" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">
                            Volver
                        </span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-sm md:max-w-md">
                        {isNew ? 'Nueva Publicación' : 'Editar Publicación'}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="group flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full transition-all duration-300 text-sm font-medium disabled:opacity-50"
                    >
                        {saving && !isPublished ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <Save className="w-4 h-4 flex-shrink-0" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            Guardar Borrador
                        </span>
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="group flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-300 shadow-sm text-sm font-medium disabled:opacity-50"
                    >
                        {saving && isPublished ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <Sparkles className="w-4 h-4 flex-shrink-0" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            Publicar
                        </span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Basic Info */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título de la publicación <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-lg font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Escribe un título llamativo..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Miniatura (URL de imagen)</label>
                                <input
                                    type="text"
                                    value={thumbnail}
                                    onChange={(e) => setThumbnail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiquetas (separadas por coma)</label>
                                <input
                                    type="text"
                                    value={tagsText}
                                    onChange={(e) => setTagsText(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Novedades, SST, Actualización"
                                />
                            </div>
                        </div>
                    </div>

                    {/* AI Generation Tools */}
                    <div className="relative z-50 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-md font-semibold text-indigo-900 dark:text-indigo-200">Generación con Inteligencia Artificial</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-1">Indicaciones o tema específico</label>
                            <textarea
                                value={generatePrompt}
                                onChange={(e) => setGeneratePrompt(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                placeholder="Escribe de qué quieres que trate el artículo, o déjalo vacío para usar el título..."
                            />
                        </div>

                        {/* Fuentes */}
                        <div>
                            <label className="block text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-1">Fuentes (URLs o enlaces de YouTube)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={newSource}
                                        onChange={(e) => setNewSource(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                                        className="w-full block pl-10 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="Pegar enlace aquí y presionar Enter..."
                                    />
                                </div>
                                <button
                                    onClick={handleAddSource}
                                    className="px-3 py-2 bg-indigo-200 hover:bg-indigo-300 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-indigo-800 dark:text-indigo-100 rounded-lg transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {sources.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {sources.map((src, idx) => (
                                        <li key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-indigo-100 dark:border-indigo-800/50 text-sm">
                                            <span className="truncate text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                                                {src.includes('youtube.com') || src.includes('youtu.be') ? <span className="text-red-500">▶</span> : <FileText className="w-4 h-4 text-gray-400" />}
                                                {src}
                                            </span>
                                            <button onClick={() => handleRemoveSource(idx)} className="text-gray-400 hover:text-red-500 ml-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onSelectModel={setSelectedModel}
                                disabled={isGenerating}
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="group flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <Sparkles className="w-4 h-4 flex-shrink-0" />}
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                    Generar Artículo
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Contenido del Artículo
                            </h3>
                        </div>
                        <div className="flex-1">
                            <LiveEditor
                                initialContent={content}
                                onUpdate={(val) => setContent(val)}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
