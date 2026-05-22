import React, { useState } from 'react';
import { useAuthContext, useLocalize } from '~/hooks';
import { OGDialog, OGDialogContent, Input, Label, Button, useToastContext } from '@librechat/client';
import axios from 'axios';

const RequiredInfoModal: React.FC = () => {
  const localize = useLocalize();
  const { user, setUser, logout } = useAuthContext();
  const { showToast } = useToastContext();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      setError('El número de teléfono celular es requerido para continuar.');
      return;
    }

    // Phone validation regex
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Por favor, ingresa un número de teléfono celular válido. Ej: +57 3123456789');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: user?.name,
        username: user?.username,
        phoneNumber: cleanPhone,
      };

      const response = await axios.post('/api/user/update', payload);
      if (response.data?.user) {
        setUser(response.data.user);
        showToast({ message: '¡Información guardada correctamente!', status: 'success' });
      } else {
        throw new Error('Formato de respuesta inválido.');
      }
    } catch (err: any) {
      console.error('[RequiredInfoModal] Error saving phone number:', err);
      const serverMessage = err.response?.data?.message || 'Error de red al guardar la información. Por favor intenta de nuevo.';
      setError(serverMessage);
      showToast({ message: serverMessage, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout('/login?redirect=false');
  };

  const handleOpenChange = (open: boolean) => {
    // Intercept Radix UI close requests to make the dialog strictly blocking.
    if (!open) return;
  };

  return (
    <OGDialog open={true} onOpenChange={handleOpenChange}>
      <OGDialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-h-[90vh] w-11/12 max-w-md overflow-hidden rounded-2xl border border-green-500/20 bg-surface-secondary/80 p-0 shadow-2xl backdrop-blur-md dark:border-green-500/10"
      >
        
        {/* Glow ambient background circles */}
        <div className="pointer-events-none absolute -mr-16 -mt-16 right-0 top-0 h-48 w-48 rounded-full bg-green-500/10 blur-2xl transition-all duration-700" />
        <div className="pointer-events-none absolute -mb-16 -ml-16 bottom-0 left-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-2xl transition-all duration-700" />

        <div className="flex flex-col items-center p-6 text-center">
          {/* Animated SVG Phone Icon */}
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 dark:bg-green-500/5">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-500"
            >
              {/* Outer screen border */}
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke="url(#emeraldGradient)" strokeWidth="2" />
              {/* Speaker */}
              <line x1="12" y1="5" x2="12.01" y2="5" strokeWidth="3" stroke="url(#emeraldGradient)" />
              {/* Home button */}
              <circle cx="12" cy="19" r="1" stroke="url(#emeraldGradient)" strokeWidth="1.5" />
              {/* Screen grid lines */}
              <path d="M7 8h10M7 12h10M7 15h6" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
              {/* Pulsing glow background circle */}
              <circle cx="12" cy="12" r="3" fill="#22c55e" opacity="0.3">
                <animate attributeName="r" values="2;5;2" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
              </circle>
              <defs>
                <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Title */}
          <h2 className="mb-2 bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Información de Contacto
          </h2>

          {/* Subtitle */}
          <p className="mb-6 text-xs leading-relaxed text-text-secondary px-2">
            Para brindarte un servicio óptimo y asegurar la validez de tu cuenta de acuerdo con las normativas vigentes, por favor ingresa tu número de contacto móvil antes de continuar.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
            <div>
              <Label htmlFor="phoneNumber" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Teléfono Celular / Contacto *
              </Label>
              <Input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ej: +57 3123456789"
                className="mt-1.5 w-full rounded-xl border border-border-medium bg-surface-primary/60 px-3.5 py-2.5 text-sm text-text-primary backdrop-blur-sm transition-all focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                autoFocus
                disabled={loading}
              />
              {error && (
                <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 shadow-md shadow-green-500/10 hover:shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar y Continuar</span>
                )}
              </Button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-2.5 text-xs text-text-tertiary hover:text-text-primary transition-colors text-center font-medium border border-transparent rounded-xl hover:bg-surface-hover/50"
              >
                Cerrar Sesión
              </button>
            </div>
          </form>

        </div>
      </OGDialogContent>
    </OGDialog>
  );
};

export default RequiredInfoModal;
