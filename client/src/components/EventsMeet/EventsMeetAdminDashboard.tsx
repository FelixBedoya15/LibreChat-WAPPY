import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Plus, ArrowLeft, Edit2, Trash2, Calendar, Video, ShieldAlert, Users, Award, Eye, EyeOff } from 'lucide-react';
import EventFormModal from './EventFormModal';

export default function EventsMeetAdminDashboard() {
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Registration Detail Modal State
  const [selectedEventRegistrations, setSelectedEventRegistrations] = useState<any>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/events/admin');
      setEvents(response.data);
    } catch (error: any) {
      console.error('Error fetching admin events:', error);
      showToast({ message: 'Error al cargar los eventos de administración.', status: 'error' });
      // If forbidden, redirect back
      if (error.response?.status === 403) {
        navigate('/events-meet');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async (eventData: any) => {
    try {
      if (selectedEvent) {
        // Edit
        await axios.put(`/api/events/admin/${selectedEvent._id}`, eventData);
        showToast({ message: 'Evento actualizado correctamente.', status: 'success' });
      } else {
        // Create
        await axios.post('/api/events/admin', eventData);
        showToast({ message: 'Evento creado correctamente.', status: 'success' });
      }
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      showToast({ message: 'Error al guardar el evento.', status: 'error' });
      throw error;
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el evento "${title}"? Se borrarán también las inscripciones asociadas.`)) {
      return;
    }

    try {
      await axios.delete(`/api/events/admin/${id}`);
      showToast({ message: 'Evento eliminado correctamente.', status: 'success' });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast({ message: 'Error al eliminar el evento.', status: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-surface-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-950 text-text-primary overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border-medium bg-white dark:bg-gray-900 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/events-meet')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Award size={20} className="text-[#10b981]" />
              Administrar Eventos por Meet
            </h1>
            <p className="text-xs text-text-secondary">Crea, edita y revisa la asistencia de los eventos virtuales de SST</p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg shadow-green-600/20 flex items-center gap-1.5"
        >
          <Plus size={18} /> Crear Evento
        </button>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {events.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-border-medium rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <ShieldAlert size={48} className="text-amber-500 mb-3" />
            <h3 className="text-lg font-bold">No hay eventos creados</h3>
            <p className="text-sm text-text-secondary max-w-md mt-1">
              Haz clic en &quot;Crear Evento&quot; para programar el primer taller virtual por Google Meet.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-border-medium rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-border-medium text-xs font-bold uppercase tracking-wider text-text-secondary">
                    <th className="px-6 py-4">Portada</th>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">Fecha y Hora</th>
                    <th className="px-6 py-4">Google Meet</th>
                    <th className="px-6 py-4 text-center">Inscritos</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-medium text-sm">
                  {events.map((evt) => {
                    const formattedDate = new Date(evt.dateTime).toLocaleString('es-CO', {
                      timeZone: 'America/Bogota',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });

                    return (
                      <tr key={evt._id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 shrink-0">
                          <div className="w-16 h-10 rounded overflow-hidden bg-slate-100 dark:bg-gray-800 border border-border-medium">
                            {evt.thumbnail ? (
                              <img
                                src={evt.thumbnail.startsWith('http') || evt.thumbnail.startsWith('/') ? evt.thumbnail : `/images/${evt.thumbnail.split('/').pop()}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video size={16} className="text-text-tertiary" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold max-w-xs truncate">
                          {evt.title}
                          {evt.isFeatured && (
                            <span className="ml-2 bg-[#10b981]/15 text-[#10b981] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Portada
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {formattedDate}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          <a
                            href={evt.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <Video size={14} className="shrink-0" /> Link Conexión
                          </a>
                          {evt.meetPassword && (
                            <span className="text-[11px] text-text-tertiary block mt-0.5">Clave: {evt.meetPassword}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedEventRegistrations(evt)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:hover:bg-green-950/40 rounded-full font-bold text-xs transition-colors"
                          >
                            <Users size={12} />
                            {evt.registrationsCount} ver
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {evt.isPublished ? (
                            <span className="inline-flex items-center gap-1 text-[#10b981] font-bold text-xs bg-[#10b981]/10 px-2.5 py-1 rounded-full">
                              <Eye size={12} /> Publicado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-text-secondary font-bold text-xs bg-slate-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                              <EyeOff size={12} /> Borrador
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedEvent(evt);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(evt._id, evt.title)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onSave={handleSave}
      />

      {/* Registrations List Modal */}
      {selectedEventRegistrations && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-border-medium rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-medium shrink-0">
              <div>
                <h3 className="font-bold text-lg text-text-primary">Usuarios Inscritos</h3>
                <p className="text-xs text-text-secondary truncate max-w-xs">{selectedEventRegistrations.title}</p>
              </div>
              <button
                onClick={() => setSelectedEventRegistrations(null)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedEventRegistrations.registrations.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  No hay usuarios registrados en este evento aún.
                </div>
              ) : (
                <div className="divide-y divide-border-medium">
                  {selectedEventRegistrations.registrations.map((user: any, idx: number) => (
                    <div key={user._id || idx} className="py-3 flex flex-col">
                      <span className="font-bold text-sm text-text-primary">
                        {user.name || user.username || 'Usuario'}
                      </span>
                      <span className="text-xs text-text-secondary">{user.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-border-medium bg-surface-secondary rounded-b-2xl shrink-0">
              <button
                onClick={() => setSelectedEventRegistrations(null)}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Helper X close icon mapping
function X({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );
}
