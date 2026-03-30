import React, { useState } from 'react';
import { RoadmapItem } from './RoadmapPage';
import { X, Save } from 'lucide-react';

interface Props {
  item: RoadmapItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoadmapAdminModal({ item, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    version: item?.version || '',
    type: item?.type || 'Nuevo',
    date: item?.date ? new Date(item.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token') || '';
      const method = item ? 'PUT' : 'POST';
      const url = item ? `/api/roadmap/${item._id}` : '/api/roadmap';
      
      const payload = { ...formData, date: new Date(formData.date).toISOString() };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert('Hubo un error al guardar. Verifica permisos.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {item ? 'Editar Hito' : 'Añadir Actualización'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título</label>
              <input 
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ej. Nuevo Gestor de Archivos"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="Nuevo">Novedad</option>
                <option value="Mejora">Mejora</option>
                <option value="Corrección">Corrección (Bugfix)</option>
                <option value="Anuncio">Anuncio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Versión (Opcional)</label>
              <input 
                value={formData.version}
                onChange={e => setFormData({ ...formData, version: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Ej. v2.3.1"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fecha de Lanzamiento</label>
              <input 
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <textarea 
                required
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500 resize-none"
                placeholder="Describe los cambios y el valor que aporta..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 flex items-center gap-2 text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition shadow-lg shadow-teal-500/30"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Publicar Hito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
