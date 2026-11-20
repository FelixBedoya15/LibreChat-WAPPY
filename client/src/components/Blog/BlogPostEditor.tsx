import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import {
    ArrowLeft,
    Save,
    Sparkles,
    Wand2,
    Send,
    Loader2,
    Link as LinkIcon,
    FileText,
    Plus,
    Trash2,
    Image as ImageIcon,
    UploadCloud,
} from 'lucide-react';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ModelSelector from '~/components/SGSST/ModelSelector';
import { AttachmentManager, Attachment } from '~/components/Common/Attachments';
import { ExpandableButton } from '~/components/Common/ExpandableButton';
import { resolveBlogThumbnail } from './blogThumbnail';

export default function BlogPostEditor({ postId, onClose, onSaved }: { postId?: string; onClose?: () => void; onSaved?: () => void }) {
    const { id: paramId } = useParams();
    const id = postId || paramId;
    const isNew = id === 'new';
    const navigate = useNavigate();
    const { showToast } = useToastContext();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');          // final content used for saving
    const [generatedContent, setGeneratedContent] = useState('');  // content from AI, used as LiveEditor initialContent
    const [thumbnail, setThumbnail] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isPublished, setIsPublished] = useState(false);

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [savingAction, setSavingAction] = useState<'draft' | 'publish' | null>(null);

    // AI Generation & Editorial Beautify state
    const [isGenerating, setIsGenerating] = useState(false);
    const [isBeautifying, setIsBeautifying] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
    const [generatePrompt, setGeneratePrompt] = useState('');
    const [sources, setSources] = useState<string[]>([]);
    const [newSource, setNewSource] = useState('');

    // Ref to imperatively set HTML in LiveEditor without React re-render cycle
    const liveEditorRef = useRef<LiveEditorHandle>(null);

    // Ref holds live content WITHOUT causing re-renders when user types
    const contentRef = useRef('');

    // Stable callback: does NOT recreate on every render, so LiveEditor never
    // re-renders just because the parent did (caused the editing freeze bug)
    const handleEditorUpdate = useCallback((val: string) => {
        contentRef.current = val;
    }, []);

    // Thumbnail file upload (permanent storage in /images/blog/)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [thumbnailPreviewError, setThumbnailPreviewError] = useState(false);

    useEffect(() => {
        setThumbnailPreviewError(false);
    }, [thumbnail]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/blog/admin/upload-thumbnail', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedPath = response.data?.filepath || response.data?.url || response.data?.file?.url || '';
            if (!uploadedPath) {
                throw new Error('El servidor no devolvió la ruta de la imagen.');
            }

            setThumbnailPreviewError(false);
            setThumbnail(uploadedPath);
            showToast({ message: 'Imagen subida y guardada permanentemente', status: 'success' });
        } catch (error: any) {
            console.error('Error uploading blog thumbnail:', error);
            const errorMsg = error?.response?.data?.error || 'Error al subir la imagen';
            showToast({ message: errorMsg, status: 'error' });
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    useEffect(() => {
        if (!isNew) {
            const fetchPost = async () => {
                try {
                    const response = await axios.get(`/api/blog/${id}`);
                    const post = response.data || {};
                    setTitle(typeof post.title === 'string' ? post.title : '');
                    setDescription(typeof post.description === 'string' ? post.description : '');
                    const loaded = typeof post.content === 'string' ? post.content : '';
                    setContent(loaded);
                    setGeneratedContent(loaded);
                    contentRef.current = loaded;  // sync ref too
                    setThumbnail(typeof post.thumbnail === 'string' ? post.thumbnail : '');
                    setTagsText(Array.isArray(post.tags) ? post.tags.join(', ') : '');
                    setAttachments(Array.isArray(post.attachments) ? post.attachments : []);
                    setIsPublished(Boolean(post.isPublished));
                } catch (error) {
                    console.error('Error fetching post:', error);
                    showToast({ message: 'Error al cargar la publicación.', status: 'error' });
                    if (onClose) onClose();
                    else navigate('/blog/admin');
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [id, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

    const parseTags = useCallback(() => {
        return (tagsText || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
    }, [tagsText]);

    const handleSave = async (publish: boolean) => {
        if (!(title || '').trim()) {
            showToast({ message: 'El título es obligatorio', status: 'warning' });
            return;
        }

        setSaving(true);
        setSavingAction(publish ? 'publish' : 'draft');
        try {
            const tags = parseTags();
            const liveHtml = liveEditorRef.current?.getHTML?.();
            const finalContent =
                contentRef.current || (typeof liveHtml === 'string' ? liveHtml : '') || content;

            const payload = {
                title: (title || '').trim(),
                description: (description || '').trim(),
                content: finalContent,
                thumbnail: (thumbnail || '').trim(),
                tags,
                attachments: Array.isArray(attachments) ? attachments : [],
                isPublished: publish,
            };

            if (isNew) {
                const response = await axios.post('/api/blog/create', payload);
                showToast({ message: 'Publicación creada exitosamente.', status: 'success' });
                if (onSaved) onSaved();
                else navigate(`/blog/admin/posts/${response.data._id}`);
            } else {
                await axios.put(`/api/blog/${id}`, payload);
                showToast({ message: 'Publicación actualizada.', status: 'success' });
                if (onSaved) onSaved();
            }

            setIsPublished(publish);

            // Go back to the list if created from standalone route
            if (isNew && !onSaved) {
                navigate('/blog/admin');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            showToast({ message: 'Error guardando la publicación', status: 'error' });
        } finally {
            setSaving(false);
            setSavingAction(null);
        }
    };

    const handleAddSource = () => {
        if ((newSource || '').trim()) {
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
        if (!(generatePrompt || '').trim() && !(title || '').trim()) {
            showToast({ message: 'Proporciona al menos un título o descripción del tema a generar', status: 'warning' });
            return;
        }

        setIsGenerating(true);
        try {
            const topic = (generatePrompt || '').trim() || (title || '').trim();
            const tags = parseTags();
            const response = await axios.post('/api/blog/admin/generate', {
                type: 'blog',
                prompt: topic,
                title: (title || '').trim(),
                tags,
                modelName: selectedModel,
                sources,
            });
            const resData = response.data || {};
            const generated =
                (typeof resData.data === 'string' && resData.data) ||
                (typeof resData.html === 'string' && resData.html) ||
                (typeof resData.content === 'string' && resData.content) ||
                '';
            const suggestedDescription =
                (typeof resData.description === 'string' && resData.description) ||
                (typeof resData.summary === 'string' && resData.summary) ||
                '';

            if (generated) {
                // Imperatively set HTML — bypasses the useEffect feedback loop completely
                liveEditorRef.current?.setHTML(generated);
                setGeneratedContent(generated);
                setContent(generated);
                contentRef.current = generated;  // sync ref

                if (!(description || '').trim() && suggestedDescription.trim()) {
                    setDescription(suggestedDescription.trim());
                }

                showToast({ message: 'Artículo generado con diseño editorial WAPPY', status: 'success' });
            }
        } catch (error: any) {
            console.error('Error generating content:', error);
            const errorMsg = error?.response?.data?.error || 'Error generando contenido con IA';
            showToast({ message: errorMsg, status: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBeautifyEditorial = async () => {
        setIsBeautifying(true);
        try {
            const currentHtml =
                contentRef.current || liveEditorRef.current?.getHTML?.() || content || '';
            const plainText = currentHtml
                .replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/gi, ' ')
                .trim();
            const wasEmpty = plainText.length === 0;
            const tags = parseTags();

            const response = await axios.post('/api/blog/admin/beautify', {
                content: wasEmpty ? '' : currentHtml,
                title: (title || '').trim(),
                tags,
                forceRestyle: true,
            });

            const resData = response.data || {};
            const formatted =
                (typeof resData.html === 'string' && resData.html) ||
                (typeof resData.content === 'string' && resData.content) ||
                (typeof resData.data === 'string' && resData.data) ||
                (typeof resData.formatted === 'string' && resData.formatted) ||
                (typeof resData.data?.html === 'string' && resData.data.html) ||
                (typeof resData.data?.content === 'string' && resData.data.content) ||
                '';

            if (!formatted.trim()) {
                throw new Error('El servidor no devolvió el contenido editorial formateado.');
            }

            const suggestedDescription =
                (typeof resData.description === 'string' && resData.description) ||
                (typeof resData.summary === 'string' && resData.summary) ||
                (typeof resData.excerpt === 'string' && resData.excerpt) ||
                (typeof resData.data?.description === 'string' && resData.data.description) ||
                '';

            liveEditorRef.current?.setHTML(formatted);
            setGeneratedContent(formatted);
            setContent(formatted);
            contentRef.current = formatted;

            if (!(description || '').trim() && suggestedDescription.trim()) {
                setDescription(suggestedDescription.trim());
            }

            showToast({
                message: wasEmpty
                    ? 'Plantilla editorial WAPPY insertada lista para completar'
                    : 'Diseño Editorial WAPPY aplicado exitosamente',
                status: 'success',
            });
        } catch (error: any) {
            console.error('Error beautifying blog content:', error);
            const errorMsg =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Error al aplicar el diseño editorial WAPPY';
            showToast({ message: errorMsg, status: 'error' });
        } finally {
            setIsBeautifying(false);
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

    const isModal = typeof onClose === 'function';
    const resolvedThumbnailSrc = resolveBlogThumbnail(thumbnail);
    const trimmedThumbnail = (thumbnail || '').trim();

    const element = (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 w-full min-w-0 overflow-x-hidden">
            {/* Header */}
            <div className="flex-none p-4 md:px-6 md:py-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ExpandableButton
                        variant="neutral"
                        size="md"
                        onClick={() => (onClose ? onClose() : navigate('/blog/admin'))}
                        icon={<ArrowLeft className="w-4 h-4" />}
                        label="Volver"
                        aria-label="Volver"
                    />
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white truncate min-w-0">
                        {isNew ? 'Nueva Publicación' : 'Editar Publicación'}
                    </h1>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <ExpandableButton
                        variant="teal"
                        size="md"
                        onClick={() => handleSave(false)}
                        disabled={saving || isBeautifying || isGenerating}
                        icon={
                            saving && savingAction === 'draft' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )
                        }
                        label={saving && savingAction === 'draft' ? 'Guardando...' : 'Guardar Borrador'}
                        title="Guardar como borrador"
                    />
                    <ExpandableButton
                        variant="emerald"
                        size="md"
                        onClick={() => handleSave(true)}
                        disabled={saving || isBeautifying || isGenerating}
                        icon={
                            saving && savingAction === 'publish' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )
                        }
                        label={
                            saving && savingAction === 'publish'
                                ? 'Publicando...'
                                : isPublished
                                  ? 'Actualizar y Publicar'
                                  : 'Publicar'
                        }
                        title="Publicar artículo en el Blog"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
                <div className="w-full min-w-0 max-w-4xl mx-auto space-y-6">

                    {/* Basic Info */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 min-w-0">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Título de la publicación <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-base sm:text-lg font-medium rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                                placeholder="Escribe un título llamativo..."
                            />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <label
                                    htmlFor="blog-post-description"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Resumen breve / Meta-descripción SEO
                                </label>
                                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                    {(description || '').trim().length} caracteres
                                </span>
                            </div>
                            <textarea
                                id="blog-post-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y transition-colors"
                                placeholder="Escribe un resumen ejecutivo breve (140–220 caracteres) para la vista previa del Blog y el encabezado editorial..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="min-w-0 space-y-2.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Miniatura (Imagen)</label>

                                {/* Subida local directa y permanente (/images/blog/) */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => !uploadingImage && fileInputRef.current?.click()}
                                        onKeyDown={(e) => {
                                            if ((e.key === 'Enter' || e.key === ' ') && !uploadingImage) {
                                                e.preventDefault();
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                        className="flex-1 min-w-0 flex items-center gap-3 rounded-xl border border-dashed border-blue-500/40 dark:border-blue-400/30 bg-blue-500/5 hover:bg-blue-500/10 px-3.5 py-2 cursor-pointer transition-colors"
                                    >
                                        {uploadingImage ? (
                                            <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                                        ) : (
                                            <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        )}
                                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex-1 min-w-0 select-none truncate">
                                            {uploadingImage
                                                ? 'Subiendo imagen al servidor...'
                                                : trimmedThumbnail.startsWith('/images/blog/')
                                                    ? trimmedThumbnail.split('/').pop()
                                                    : 'Haz clic para subir imagen local...'}
                                        </span>
                                    </div>
                                    <ExpandableButton
                                        variant="blue"
                                        size="md"
                                        disabled={uploadingImage}
                                        onClick={() => fileInputRef.current?.click()}
                                        icon={
                                            uploadingImage ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <UploadCloud className="w-4 h-4" />
                                            )
                                        }
                                        label={uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                                        title="Subir imagen desde tu equipo"
                                    />
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        accept="image/*"
                                        disabled={uploadingImage}
                                    />
                                </div>

                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-snug">
                                    ✅ Se guarda de forma permanente en el servidor (<code className="font-mono text-[10px]">/images/blog/</code>) y persiste entre despliegues.
                                </p>

                                {/* Campo editable para URL externa o ruta /images/blog/... */}
                                <div className="flex gap-2 items-center min-w-0">
                                    <div className="relative flex-1 min-w-0">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={thumbnail}
                                            onChange={(e) => setThumbnail(e.target.value)}
                                            className="w-full pl-9 pr-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            placeholder="https://... o /images/blog/portada.webp"
                                        />
                                    </div>
                                    {thumbnail && (
                                        <ExpandableButton
                                            variant="danger"
                                            size="sm"
                                            onClick={() => {
                                                setThumbnail('');
                                                setThumbnailPreviewError(false);
                                            }}
                                            icon={<Trash2 className="w-4 h-4" />}
                                            label="Eliminar"
                                            title="Eliminar miniatura"
                                        />
                                    )}
                                </div>

                                {/* Preview */}
                                {resolvedThumbnailSrc && (
                                    <div className="mt-1 flex items-center gap-3 p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 min-w-0">
                                        <div className="h-16 w-28 flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                            {!thumbnailPreviewError ? (
                                                <img
                                                    src={resolvedThumbnailSrc}
                                                    alt="Vista previa de la miniatura"
                                                    className="w-full h-full object-cover"
                                                    onError={() => setThumbnailPreviewError(true)}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 px-1 text-center">
                                                    <ImageIcon className="w-5 h-5 mb-0.5" />
                                                    <span className="text-[9px] leading-tight">Sin vista previa</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                                                {trimmedThumbnail.startsWith('/images/blog/')
                                                    ? 'Miniatura permanente en servidor'
                                                    : trimmedThumbnail.startsWith('http')
                                                        ? 'Miniatura por URL externa'
                                                        : 'Ruta de imagen'}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono">
                                                {trimmedThumbnail}
                                            </p>
                                            {thumbnailPreviewError && (
                                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                                    No se pudo cargar la vista previa. Verifica la ruta o sube una nueva imagen.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiquetas (separadas por coma)</label>
                                <input
                                    type="text"
                                    value={tagsText}
                                    onChange={(e) => setTagsText(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="Novedades, SST, Actualización"
                                />
                                <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                    💡 Cada etiqueta define una <strong>sección</strong> en el Blog. Escríbelas exactamente como quieres que aparezcan:<br />
                                    <span className="inline-block font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mt-1">Seguridad y Salud en el Trabajo</span>{' '}
                                    <span className="inline-block font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mt-1">Novedades</span>{' '}
                                    <span className="inline-block font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mt-1">Seguridad Vial</span>
                                </p>
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <AttachmentManager
                                attachments={attachments}
                                onChange={setAttachments}
                                uploadEndpoint="/api/blog/admin/upload"
                                title="Archivos y Recursos Descargables del Artículo"
                                description="Adjunta guías en PDF, formatos de inspección en Excel, plantillas o infografías descargables para este artículo."
                            />
                        </div>
                    </div>

                    {/* AI Generation Tools */}
                    <div className="relative z-10 bg-gradient-to-br from-purple-500/[0.06] via-indigo-500/[0.04] to-teal-500/[0.05] dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-teal-900/15 p-4 sm:p-6 rounded-2xl border border-purple-500/20 dark:border-purple-500/30 space-y-4 min-w-0">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                Generación con Inteligencia Artificial
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Indicaciones o tema específico
                            </label>
                            <textarea
                                value={generatePrompt}
                                onChange={(e) => setGeneratePrompt(e.target.value)}
                                rows={2}
                                className="w-full rounded-xl border border-purple-200 dark:border-purple-800/70 bg-white dark:bg-gray-800 px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                placeholder="Escribe de qué quieres que trate el artículo, o déjalo vacío para usar el título..."
                            />
                        </div>

                        {/* Fuentes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fuentes (URLs o enlaces de YouTube)
                            </label>
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="relative flex-1 min-w-0">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={newSource}
                                        onChange={(e) => setNewSource(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                                        className="w-full block pl-10 rounded-xl border border-purple-200 dark:border-purple-800/70 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                        placeholder="Pegar enlace aquí y presionar Enter..."
                                    />
                                </div>
                                <ExpandableButton
                                    variant="emerald"
                                    size="md"
                                    onClick={handleAddSource}
                                    icon={<Plus className="w-4 h-4" />}
                                    label="Añadir fuente"
                                    title="Añadir fuente de referencia"
                                />
                            </div>

                            {sources.length > 0 && (
                                <ul className="mt-2.5 space-y-1.5">
                                    {sources.map((src, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 p-2 pl-3 rounded-xl border border-purple-100 dark:border-purple-800/50 text-sm min-w-0"
                                        >
                                            <span className="truncate text-indigo-700 dark:text-indigo-300 flex items-center gap-2 min-w-0">
                                                {src.includes('youtube.com') || src.includes('youtu.be') ? (
                                                    <span className="text-red-500 flex-shrink-0">▶</span>
                                                ) : (
                                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                )}
                                                <span className="truncate">{src}</span>
                                            </span>
                                            <ExpandableButton
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRemoveSource(idx)}
                                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                                label="Quitar"
                                                title="Quitar fuente"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onSelectModel={setSelectedModel}
                                disabled={isGenerating || isBeautifying}
                            />
                            <ExpandableButton
                                variant="purple"
                                size="md"
                                onClick={handleGenerate}
                                disabled={isGenerating || isBeautifying}
                                icon={
                                    isGenerating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )
                                }
                                label={isGenerating ? 'Generando...' : 'Generar Artículo'}
                                title="Generar artículo editorial con IA"
                            />
                        </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-w-0"
                        style={{ minHeight: '600px' }}
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-sm sm:text-base">
                                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                                    <span>Contenido del Artículo</span>
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    Aplica la identidad editorial WAPPY IA (resumen ejecutivo, secciones turquesa, tarjetas, tablas y CTA) en un clic.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <ExpandableButton
                                    variant="emerald"
                                    size="md"
                                    onClick={handleBeautifyEditorial}
                                    disabled={isBeautifying || isGenerating || saving}
                                    icon={
                                        isBeautifying ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Wand2 className="w-4 h-4" />
                                        )
                                    }
                                    label={isBeautifying ? 'Formateando...' : 'Diseño Editorial WAPPY'}
                                    title="Transformar al diseño editorial WAPPY IA o insertar plantilla editorial lista para rellenar"
                                />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <LiveEditor
                                ref={liveEditorRef}
                                initialContent={generatedContent}
                                onUpdate={handleEditorUpdate}
                                paperMode={false}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
                <div
                    className="bg-white dark:bg-gray-900 border border-border-medium rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[92vh] sm:h-[90vh] overflow-hidden animate-fade-in"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        {element}
                    </div>
                </div>
            </div>
        );
    }

    return element;
}
