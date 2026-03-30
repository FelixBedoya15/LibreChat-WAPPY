import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Lightbulb, Map, Milestone, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import RoadmapAdminModal from './RoadmapAdminModal';

type RoadmapType = 'Nuevo' | 'Mejora' | 'Corrección' | 'Anuncio';

export interface RoadmapItem {
  _id: string;
  title: string;
  description: string;
  version: string;
  date: string;
  type: RoadmapType;
}

const typeConfig: Record<RoadmapType, { color: string; bg: string; icon: React.ReactNode }> = {
  Nuevo: { color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/30', icon: <Zap className="w-5 h-5 text-teal-500" /> },
  Mejora: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30', icon: <Lightbulb className="w-5 h-5 text-blue-500" /> },
  Corrección: { color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30', icon: <AlertTriangle className="w-5 h-5 text-orange-500" /> },
  Anuncio: { color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30', icon: <Milestone className="w-5 h-5 text-purple-500" /> },
};

const defaultSeedItems: RoadmapItem[] = [
  {
    _id: 'seed-6',
    title: 'Editor de Archivos e IA Web',
    description: 'Se introdujo el nuevo "Editor de Archivos" con soporte para importación y conversión visual enriquecida de PDFs y Words. Además, la burbuja de "Edición con IA" ahora cuenta con acceso a la web en vivo mediante Google Search Grounding permitiéndole verificar fuentes.',
    version: 'V2.5.0',
    date: new Date().toISOString(),
    type: 'Nuevo',
  },
  {
    _id: 'seed-5',
    title: 'Análisis en Vivo (SGSST Visión)',
    description: 'Cámaras y Visión Artificial integradas al sistema corporativo. Ahora Tenshi puede observar a través del lente, detectar actos o condiciones inseguras y autoredactarte inspecciones o reportes estructurados.',
    version: 'V2.2.0',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    type: 'Nuevo',
  },
  {
    _id: 'seed-4',
    title: 'Gestor SG-SST: Participación e Informes',
    description: 'El núcleo de operaciones preventivas de LibreChat-WAPPY cobró vida permitiendo completar el ciclo PHVA total con generadores automatizados como Política, Matriz Legal, Dashboard Predictivo e integración de Buzón de Empleados IPEVAR.',
    version: 'V2.0.0',
    date: new Date(Date.now() - 86400000 * 15).toISOString(),
    type: 'Nuevo',
  },
  {
    _id: 'seed-3',
    title: 'Aula Mágica Estudiantil',
    description: 'Lanzamiento de las herramientas de formación contínua, permitiéndo centralizar material SST y adoctrinamiento para coordinadores en vivo.',
    version: 'V1.5.0',
    date: new Date(Date.now() - 86400000 * 30).toISOString(),
    type: 'Mejora',
  },
  {
    _id: 'seed-2',
    title: 'Blog Normativo Integrado',
    description: 'Incorporación de Blog de noticias institucionales leídas transversalmente por nuestro Agente IA central.',
    version: 'V1.1.0',
    date: new Date(Date.now() - 86400000 * 60).toISOString(),
    type: 'Nuevo',
  },
  {
    _id: 'seed-1',
    title: 'Sistema Fundacional: Chat Inteligente',
    description: 'Lanzamiento original de LibreChat-WAPPY (Tenshi). Motores conversacionales LLM adaptados al contexto corporativo como núcleo base de operaciones.',
    version: 'V1.0.0',
    date: new Date(Date.now() - 86400000 * 100).toISOString(),
    type: 'Anuncio',
  },
];

export default function RoadmapPage() {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

  useEffect(() => {
    fetchRoadmap();
    // Update last seen status specifically for this page load
    localStorage.setItem('lastRoadmapSeenTime', Date.now().toString());
  }, []);

  const fetchRoadmap = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/roadmap', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Fallback to static seed if completely empty
        if (data.length === 0) {
          setItems(defaultSeedItems);
        } else {
          setItems(data);
          // Set latest roadmap ID in client so they don't get popups instantly
          localStorage.setItem('lastRoadmapSeenId', data[0]?._id);
        }
      }
    } catch (e) {
      console.error(e);
      setItems(defaultSeedItems);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: RoadmapItem) => {
    setEditingItem(item || null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin || !confirm('¿Estás seguro de eliminar este hito permanentemente?')) return;
    try {
      const response = await fetch(`/api/roadmap/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setItems(items.filter((i) => i._id !== id));
      }
    } catch (e) {
      console.error('Failed to delete', e);
    }
  };

  const formattedDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 md:p-12 pb-32 font-sans relative" style={{ overflowX: 'clip' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 relative"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl" />
          <Map className="w-16 h-16 mx-auto mb-4 text-teal-600 dark:text-teal-400" />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600">
            Hoja de Ruta Tecnológica
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explora la evolución de WAPPY IA. Desde nuestro primer chat fundacional hasta el increíble gestor avanzado predictivo, mantente siempre a la vanguardia.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('switch-settings-tab', { detail: { mainTab: 'tickets' } }));
                window.dispatchEvent(new CustomEvent('open-settings'));
              }}
              className="px-6 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition font-medium flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" /> Sugerir Mejoras
            </button>
            
            {isAdmin && (
              <button 
                onClick={() => handleOpenModal()}
                className="px-6 py-2 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg transition font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nueva Actualización
              </button>
            )}
          </div>
        </motion.div>

        {/* Timeline SVG Container */}
        <div className="relative">
          {/* Vertical Glowing Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500/50 via-teal-400/20 to-transparent -translate-x-1/2 rounded-full" />

          {loading ? (
            <div className="text-center text-gray-400 py-10">Cargando evolución histórica...</div>
          ) : (
            <div className="space-y-12 pb-24">
              {items.map((item, index) => {
                const isEven = index % 2 === 0;
                const { color, bg, icon } = typeConfig[item.type] || typeConfig['Nuevo'];

                return (
                  <motion.div 
                    key={item._id}
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`relative flex items-center md:justify-between w-full flex-col md:flex-row ${
                      isEven ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    
                    {/* Center Node */}
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white dark:bg-gray-900 border-4 border-white dark:border-gray-900 shadow-xl z-10 flex items-center justify-center overscroll-none overflow-hidden hover:scale-110 transition-transform">
                      <div className={`w-full h-full rounded-full flex items-center justify-center border-2 border-transparent hover:border-teal-400 ${bg}`}>
                         {icon}
                      </div>
                    </div>

                    {/* Timeline Content Card */}
                    <div className="w-full md:w-5/12 ml-16 md:ml-0 pl-4 md:pl-0 pt-2 md:pt-0">
                      <div className={`p-6 rounded-2xl border bg-white/50 dark:bg-gray-800/40 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 ${bg}`}>
                        
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${bg} ${color}`}>
                            {item.type}
                          </span>
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            {item.version}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                          {item.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed text-sm">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {formattedDate(item.date)}
                          </span>
                          
                          {isAdmin && (
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenModal(item)} className="hover:text-blue-500">Editar</button>
                              <button onClick={() => handleDelete(item._id)} className="hover:text-red-500">Eliminar</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <RoadmapAdminModal 
          item={editingItem} 
          onClose={() => setModalOpen(false)} 
          onSuccess={() => {
            setModalOpen(false);
            fetchRoadmap();
          }} 
        />
      )}
    </div>
  );
}
