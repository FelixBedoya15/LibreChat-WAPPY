import React, { useState, useEffect, useRef } from 'react';
import { useUploadFileMutation } from '~/data-provider';
import { useToastContext } from '@librechat/client';
import { X, Calendar, Video, Tag, Image, Loader2, Key } from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  onSave: (eventData: any) => Promise<void>;
}

export default function EventFormModal({ isOpen, onClose, event, onSave }: EventFormModalProps) {
  const { showToast } = useToastContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [meetPassword, setMeetPassword] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Sync state if editing
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setMeetLink(event.meetLink || '');
      setMeetPassword(event.meetPassword || '');
      setThumbnail(event.thumbnail || '');
      setTagsInput(event.tags ? event.tags.join(', ') : '');
      setIsPublished(event.isPublished || false);
      setIsFeatured(event.isFeatured || false);

      if (event.dateTime) {
        // Convert ISO string to YYYY-MM-DDTHH:MM for datetime-local input
        const date = new Date(event.dateTime);
        const tzOffset = date.getTimezoneOffset() * 60000; // in ms
        const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
        setDateTime(localISOTime);
      } else {
        setDateTime('');
      }
    } else {
      // Clear form for new event
      setTitle('');
      setDescription('');
      setDateTime('');
      setMeetLink('');
      setMeetPassword('');
      setThumbnail('');
      setTagsInput('');
      setIsPublished(false);
      setIsFeatured(false);
    }
  }, [event, isOpen]);

  // Thumbnail file upload mutation
  const uploadMutation = useUploadFileMutation({
    onSuccess: (data: any) => {
      setUploadingImage(false);
      showToast({ message: 'Imagen subida correctamente', status: 'success' });
      setThumbnail(data.filepath);
    },
    onError: () => {
      setUploadingImage(false);
      showToast({ message: 'Error al subir la imagen', status: 'error' });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('endpoint', 'default');
      formData.append('file_id', crypto.randomUUID());
      formData.append('version', '1');
      formData.append('width', '512');
      formData.append('height', '512');
      uploadMutation.mutate(formData as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateTime || !meetLink.trim()) {
      showToast({ message: 'El título, la fecha/hora y el enlace de Meet son obligatorios.', status: 'warning' });
      return;
    }

    try {
      setSaving(true);
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        dateTime: new Date(dateTime).toISOString(),
        meetLink: meetLink.trim(),
        meetPassword: meetPassword.trim(),
        thumbnail,
        tags,
        isPublished,
        isFeatured,
      };

      await onSave(eventData);
      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-border-medium rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-medium">
          <h2 className="text-xl font-bold text-text-primary">
            {event ? 'Editar Evento de Meet' : 'Crear Nuevo Evento de Meet'}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Título del Evento *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Taller de IPER y Matrices GTC-45"
              className="w-full rounded-xl border border-border-medium/80 bg-surface-primary px-4 py-2.5 text-sm text-text-primary focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe los temas del evento, los ponentes y a quién va dirigido..."
              rows={4}
              className="w-full rounded-xl border border-border-medium/80 bg-surface-primary px-4 py-2.5 text-sm text-text-primary focus:border-green-500 focus:outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DateTime */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1">
                <Calendar size={16} className="text-green-500" />
                Fecha y Hora *
              </label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={e => setDateTime(e.target.value)}
                className="w-full rounded-xl border border-border-medium/80 bg-surface-primary px-4 py-2.5 text-sm text-text-primary focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1">
                <Tag size={16} className="text-green-500" />
                Categorías / Etiquetas
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="Separadas por comas (ej. SST, Legal, Curso)"
                className="w-full rounded-xl border border-border-medium/80 bg-surface-primary px-4 py-2.5 text-sm text-text-primary focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meet Link */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1">
                <Video size={16} className="text-green-500" />
                Link de Google Meet *
              </label>
              <input
                type="url"
                required
                value={meetLink}
                onChange={e => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="w-full rounded-xl border border-border-medium/80 bg-surface-primary px-4 py-2.5 text-sm text-text-primary focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Meet Password */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1">
                <Key size={16} className="text-green-500" />
                Clave de Conexión (Opcional)
              </label>
              <input
                type="text"
                value={meetPassword}
                onChange={e => setMeetPassword(e.target.value)}
                placeholder="Ej. WAPPY2026 (si aplica)"
                className="w-full rounded-xl border border-border-medium/80 bg-surface-primary px-4 py-2.5 text-sm text-text-primary focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Thumbnail Image */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1">
              <Image size={16} className="text-green-500" />
              Imagen del Evento (Portada)
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={thumbnail}
                onChange={e => setThumbnail(e.target.value)}
                placeholder="URL de la imagen o sube un archivo..."
                className="flex-1 rounded-xl border border-border-medium/80 bg-surface-primary px-4 py-2.5 text-sm text-text-primary focus:border-green-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5 shrink-0"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Subiendo...
                  </>
                ) : (
                  'Subir Foto'
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
            {thumbnail && (
              <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden bg-surface-secondary border border-border-medium">
                <img
                  src={thumbnail.startsWith('http') || thumbnail.startsWith('/') ? thumbnail : `/images/${thumbnail.split('/').pop()}`}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="rounded text-green-600 focus:ring-green-500 h-4.5 w-4.5 border-border-medium"
              />
              <span className="text-sm font-semibold text-text-primary">Publicar Evento</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                className="rounded text-green-600 focus:ring-green-500 h-4.5 w-4.5 border-border-medium"
              />
              <span className="text-sm font-semibold text-text-primary">Destacar en Portada</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-medium bg-surface-secondary rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="border border-border-medium hover:bg-surface-hover text-text-primary px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {event ? 'Guardar Cambios' : 'Crear Evento'}
          </button>
        </div>
      </div>
    </div>
  );
}
