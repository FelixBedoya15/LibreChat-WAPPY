import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, useToastContext } from '@librechat/client';
import { Loader2, LogOut, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuthContext } from '~/hooks';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

export default function OneDriveConnect() {
  const { showToast } = useToastContext();
  const { user } = useAuthContext();
  const isProOrAdmin = user?.role === 'ADMIN' || user?.role === 'USER_PRO';
  const [connected, setConnected] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  // Check URL parameters for OAuth status redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const driveStatus = params.get('one_drive');
    
    if (driveStatus === 'success') {
      showToast({
        message: 'OneDrive conectado correctamente. Tus agentes ahora pueden interactuar con tus documentos de Microsoft.',
        status: 'success',
      });
      // Clean up URL parameters
      params.delete('one_drive');
      const newSearch = params.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newPath);
    } else if (driveStatus === 'error') {
      showToast({
        message: 'Hubo un error al conectar con OneDrive. Por favor, inténtalo de nuevo.',
        status: 'error',
      });
      // Clean up URL parameters
      params.delete('one_drive');
      const newSearch = params.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newPath);
    }
  }, [showToast]);

  // Initial connection check
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get('/api/one-drive/status');
        setConnected(res.data.connected);
        setEmail(res.data.email);
        setCompanyName(res.data.companyName);
      } catch (err) {
        console.error('Error checking OneDrive status:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleConnect = async () => {
    if (!isProOrAdmin) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await axios.get('/api/one-drive/auth');
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err) {
      console.error('Error initiating OneDrive auth:', err);
      showToast({
        message: 'No se pudo iniciar la autenticación con OneDrive.',
        status: 'error',
      });
      setIsActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsActionLoading(true);
    try {
      await axios.delete('/api/one-drive/disconnect');
      setConnected(false);
      setEmail(null);
      showToast({
        message: 'OneDrive desconectado exitosamente.',
        status: 'success',
      });
    } catch (err) {
      console.error('Error disconnecting OneDrive:', err);
      showToast({
        message: 'Error al desconectar OneDrive.',
        status: 'error',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-text-secondary">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-500" />
        <span>Cargando estado de Microsoft OneDrive...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 py-2 text-sm text-text-primary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            {/* Custom OneDrive Circular White Badge Icon */}
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-border-medium flex-shrink-0 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 32 32" className="w-6 h-6">
                <path fill="#0078d4" d="M25.5 15.5C25.5 11.9 22.6 9 19 9c-.6 0-1.1.1-1.6.3C16.4 5.7 12.5 3 8 3 3.6 3 0 6.6 0 11c0 .4 0 .7.1 1.1C.2 12.1 0 12.5 0 13c0 2.8 2.2 5 5 5h14c3.6 0 6.5-2.9 6.5-6.5l-.1 0z" />
                <path fill="#005a9e" d="M32 20.5c0-3.6-2.9-6.5-6.5-6.5-.6 0-1.1.1-1.6.3-.5-1.9-1.9-3.4-3.8-4.1 1.2 1.4 1.9 3.3 1.9 5.3 0 .4 0 .8-.1 1.2.6.5 1 1.2 1 2 0 1.5-1.2 2.7-2.7 2.7H8.5c2.3 2.1 5.4 3.3 8.7 3.3h8.3c3.6 0 6.5-2.9 6.5-6.5l0-.2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold flex flex-wrap items-center gap-2 text-text-primary">
                Microsoft OneDrive
                {companyName ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider">
                    🏢 {companyName}
                  </span>
                ) : null}
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-[400px]">
                Permite que tus agentes lean tus archivos de Microsoft OneDrive y guarden reportes para <strong>{companyName || 'la empresa activa'}</strong>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {!connected ? (
              <Button 
                variant="outline" 
                onClick={handleConnect} 
                disabled={isActionLoading}
                className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 transition-colors font-semibold"
              >
                {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conectar OneDrive'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleDisconnect} 
                disabled={isActionLoading}
                className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors font-semibold"
              >
                {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" />Desconectar</>}
              </Button>
            )}
          </div>
        </div>

        {connected && (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl mt-2 border border-blue-500/20 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none transition-all duration-700 group-hover:bg-blue-500/10" />
            
            <CheckCircle2 className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-blue-600 dark:text-blue-500 flex items-center gap-1.5">
                Microsoft OneDrive Conectado 
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 font-extrabold uppercase tracking-wide">
                  {companyName || 'Empresa Activa'}
                </span>
              </span>
              <span className="text-xs text-text-secondary">Cuenta vinculada: <strong className="text-text-primary">{email}</strong></span>
            </div>
          </div>
        )}
      </div>

      {isUpgradeModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm duration-300 animate-in zoom-in-95">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute -top-10 right-0 z-[99999999] rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300"
            >
              Cerrar ✕
            </button>
            <UpgradeWall
              title="Integración de OneDrive Exclusiva"
              description="La conexión y uso de herramientas de OneDrive están reservados para usuarios del plan Wappy Pro."
              plan={user?.role || 'USER'}
              isPopup={true}
              hideFeatures={true}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
