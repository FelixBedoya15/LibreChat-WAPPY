import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, useToastContext } from '@librechat/client';
import { Loader2, LogOut, CheckCircle2, Cloud } from 'lucide-react';
import axios from 'axios';
import { useAuthContext } from '~/hooks';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

export default function GoogleDriveConnect() {
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
    const driveStatus = params.get('google_drive');
    
    if (driveStatus === 'success') {
      showToast({
        message: 'Google Workspace (Drive y Calendario) conectado correctamente. Tus agentes ahora pueden interactuar con tus documentos y programar alertas.',
        status: 'success',
      });
      // Clean up URL parameters
      params.delete('google_drive');
      const newSearch = params.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newPath);
    } else if (driveStatus === 'error') {
      showToast({
        message: 'Hubo un error al conectar con Google Workspace. Por favor, inténtalo de nuevo.',
        status: 'error',
      });
      // Clean up URL parameters
      params.delete('google_drive');
      const newSearch = params.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newPath);
    }
  }, [showToast]);

  // Initial connection check
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get('/api/google-drive/status');
        setConnected(res.data.connected);
        setEmail(res.data.email);
        setCompanyName(res.data.companyName);
      } catch (err) {
        console.error('Error checking Google Drive status:', err);
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
      const res = await axios.get('/api/google-drive/auth');
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err) {
      console.error('Error initiating Google Drive auth:', err);
      showToast({
        message: 'No se pudo iniciar la autenticación con Google Drive.',
        status: 'error',
      });
      setIsActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsActionLoading(true);
    try {
      await axios.delete('/api/google-drive/disconnect');
      setConnected(false);
      setEmail(null);
      showToast({
        message: 'Google Drive desconectado exitosamente.',
        status: 'success',
      });
    } catch (err) {
      console.error('Error disconnecting Google Drive:', err);
      showToast({
        message: 'Error al desconectar Google Drive.',
        status: 'error',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-text-secondary">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-green-500" />
        <span>Cargando estado de Google Workspace...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 py-2 text-sm text-text-primary">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-3">
          {/* Custom Google Drive SVG Icon */}
          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 flex-shrink-0 flex items-center justify-center w-10 h-10">
            <svg viewBox="0 0 87.3 78" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 10.1-17.5h54l-10.1 17.5z" fill="#0f9d58"/>
              <path d="m28.65 28.5 10.1-17.5h42l-10.1 17.5z" fill="#4285f4"/>
              <path d="m16.7 49.35 22.05-38.35h20.2l-22.05 38.35z" fill="#f4b400"/>
            </svg>
          </div>
          <div>
            <h4 className="font-bold flex items-center gap-2">
              Google Workspace (Drive y Calendario) {companyName ? <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-secondary border border-border-light font-normal">Empresa: {companyName}</span> : null}
            </h4>
            <p className="text-xs text-text-secondary mt-1 max-w-[400px]">
              Permite que tus agentes lean tus archivos, guarden reportes en Drive y programen alertas automáticas o recordatorios en tu Google Calendar para <strong>{companyName || 'la empresa activa'}</strong>.
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          {!connected ? (
            <Button 
              variant="outline" 
              onClick={handleConnect} 
              disabled={isActionLoading}
              className="border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-700 transition-colors font-semibold"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conectar Google Workspace'}
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
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-2xl mt-2 border border-green-500/20 shadow-sm relative overflow-hidden group">
          {/* Subtle glow ambient background */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none transition-all duration-700 group-hover:bg-green-500/10" />
          
          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-green-600 dark:text-green-500">Google Workspace Conectado ({companyName || 'Empresa Activa'})</span>
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
              title="Integración de Google Exclusiva"
              description="La conexión y uso de herramientas de Google Drive y Google Calendar están reservados para usuarios del plan Wappy Pro."
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
