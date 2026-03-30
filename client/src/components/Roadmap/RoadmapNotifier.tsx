import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';

export default function RoadmapNotifier() {
  const { isAuthenticated, token } = useAuthContext();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [latestTitle, setLatestTitle] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkUpdates = async () => {
      // Evitar mostrarlo múltiples veces por sesión activa
      if (sessionStorage.getItem('roadmapPopupShown')) return;

      try {
        const response = await fetch('/api/roadmap/latest', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const latest = await response.json();
          if (latest && latest._id) {
            const lastSeenId = localStorage.getItem('lastRoadmapSeenId');
            
            // Si el ID más reciente es diferente al último que vio en la página
            if (latest._id !== lastSeenId) {
              setLatestTitle(latest.title);
              setShow(true);
              sessionStorage.setItem('roadmapPopupShown', 'true');
            }
          }
        }
      } catch (e) {
        console.error('Error fetching latest roadmap:', e);
      }
    };

    checkUpdates();
  }, [isAuthenticated, token]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShow(false);
  };

  const handleNavigate = () => {
    setShow(false);
    navigate('/hoja-de-ruta');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
          className="fixed bottom-6 right-6 z-[9999] w-80 shadow-2xl rounded-2xl overflow-hidden cursor-pointer group"
          onClick={handleNavigate}
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/90 to-blue-600/90 backdrop-blur-md opacity-100 group-hover:scale-105 transition-transform duration-500" />
          
          <div className="relative p-5 text-white">
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/80 hover:text-white" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-xl shrink-0">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">¡Nueva Actualización!</h4>
                <p className="text-xs text-teal-50 leading-relaxed opacity-90 line-clamp-2">
                  Hemos lanzado: <strong>{latestTitle || 'Mejoras en WAPPY IA'}</strong>
                </p>
                
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-white/90 group-hover:text-white group-hover:gap-2 transition-all">
                  Ver Hoja de Ruta <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
