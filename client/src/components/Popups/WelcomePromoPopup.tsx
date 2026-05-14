import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Clock, Sparkles, ArrowRight, Tag } from 'lucide-react';
import axios from 'axios';
import { Button } from '@librechat/client';
import { useNavigate } from 'react-router-dom';

export default function WelcomePromoPopup() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [promoData, setPromoData] = useState<{ code: string; discountPercentage: number; expiresAt: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  const checkEligibility = async (forceOpen = false) => {
    try {
      const { data } = await axios.get('/api/wompi/welcome-promo');
      if (data.eligible) {
        setPromoData({
          code: data.code,
          discountPercentage: data.discountPercentage,
          expiresAt: data.expiresAt
        });
        
        const lastDismissed = localStorage.getItem('welcome_promo_last_dismissed');
        const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
        let shouldShow = true;

        if (lastDismissed) {
          const timeSinceDismissed = Date.now() - parseInt(lastDismissed, 10);
          if (timeSinceDismissed < EIGHT_HOURS_MS) {
            shouldShow = false;
          }
        }

        if (shouldShow || forceOpen) {
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error checking welcome promo:', error);
    }
  };

  useEffect(() => {
    checkEligibility();

    const handleOpenEvent = () => checkEligibility(true);
    window.addEventListener('open-welcome-promo', handleOpenEvent);
    return () => window.removeEventListener('open-welcome-promo', handleOpenEvent);
  }, []);

  useEffect(() => {
    if (!promoData) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(promoData.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsOpen(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [promoData]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('welcome_promo_last_dismissed', Date.now().toString());
  };

  const handleGoToPlanes = () => {
    handleClose();
    navigate('/planes');
  };

  return (
    <AnimatePresence>
      {isOpen && promoData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-surface-primary shadow-2xl"
          >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-green-500 to-emerald-700 opacity-10 dark:opacity-20" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-surface-secondary hover:bg-surface-hover text-text-secondary transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 md:p-8 pt-8 md:pt-10 flex flex-col items-center text-center">
              <div className="mb-4 md:mb-6 relative">
                <div className="p-3 md:p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                  <Gift className="w-8 h-8 md:w-10 md:h-10 text-green-600 dark:text-green-400" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-2 -right-2 p-1 md:p-1.5 bg-yellow-400 rounded-full shadow-lg"
                >
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </motion.div>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-text-primary mb-2 tracking-tight">
                ¡Bienvenido a <span className="text-green-600">WAPPY</span>!
              </h2>
              <p className="text-text-secondary text-base md:text-lg mb-5 md:mb-8 max-w-sm">
                Queremos celebrar tu llegada con un descuento exclusivo en cualquiera de nuestros planes.
              </p>

              <div className="w-full bg-surface-secondary rounded-2xl p-4 md:p-6 mb-5 md:mb-8 border border-border-light relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-tertiary">Código de Descuento</span>
                  </div>
                  
                  <div className="text-3xl md:text-4xl font-mono font-black text-green-600 tracking-tighter bg-green-500/5 px-4 md:px-6 py-2 md:py-3 rounded-xl border border-green-500/20 group-hover:scale-105 transition-transform">
                    {promoData.code}
                  </div>

                  <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-bold flex-wrap justify-center">
                    <div className="flex items-center gap-1 md:gap-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 md:px-3 py-1 md:py-1.5 rounded-lg">
                      <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                      {promoData.discountPercentage}% OFF
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5 text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 md:px-3 py-1 md:py-1.5 rounded-lg">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" />
                      {timeLeft}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-3">
                <Button
                  onClick={handleGoToPlanes}
                  className="w-full h-12 md:h-14 bg-green-600 hover:bg-green-700 text-white text-base md:text-lg font-bold rounded-2xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 group transition-all"
                >
                  Ver Planes y Precios
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-[11px] text-text-tertiary font-medium">
                  * Este código es válido por tiempo limitado (48 horas desde tu registro).
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
