import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToastContext } from '@librechat/client';
import { Loader2, LogOut, CheckCircle2, Cloud, RefreshCw, Building2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthContext } from '~/hooks';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';
import { WappyExpandButton } from '../WappyExpandButton';
import { safeSetItem, safeRemoveItem, compressLogoDataUrl } from '~/utils/safeStorage';

interface CompanyGoogleSummary {
  _id: string;
  companyName: string;
  nit?: string;
  companyEmail?: string;
  isActive: boolean;
  googleConnected: boolean;
  googleEmail: string | null;
}

export default function GoogleDriveConnect() {
  const { showToast } = useToastContext();
  const { user, token } = useAuthContext();
  const isProOrAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'USER_PRO' ||
    user?.role === 'USER_IPEVAR' ||
    user?.role === 'IPEVAR';
  const [connected, setConnected] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyEmail, setCompanyEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyGoogleSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  const checkStatus = useCallback(async (targetCompanyId?: string) => {
    try {
      const query = targetCompanyId ? `?companyId=${encodeURIComponent(targetCompanyId)}` : '';
      const res = await axios.get(`/api/google-drive/status${query}`);
      setConnected(Boolean(res.data.connected));
      setEmail(res.data.email || null);
      setCompanyId(res.data.companyId || null);
      setCompanyName(res.data.companyName || null);
      setCompanyEmail(res.data.companyEmail || null);
      if (Array.isArray(res.data.companies)) {
        setCompanies(res.data.companies);
      }
    } catch (err) {
      console.error('Error checking Google Drive status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check URL parameters for OAuth status redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const driveStatus = params.get('google_drive');

    if (driveStatus === 'success') {
      showToast({
        message:
          'Google Workspace (Drive, Calendario y Gmail) conectado correctamente para la empresa activa.',
        status: 'success',
      });
      params.delete('google_drive');
      const newSearch = params.toString();
      const newPath =
        window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newPath);
    } else if (driveStatus === 'error') {
      showToast({
        message: 'Hubo un error al conectar con Google Workspace. Por favor, inténtalo de nuevo.',
        status: 'error',
      });
      params.delete('google_drive');
      const newSearch = params.toString();
      const newPath =
        window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newPath);
    }
  }, [showToast]);

  // Initial connection check + reactive listener when active company changes
  useEffect(() => {
    checkStatus();

    const handleCompanySwitchEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      const nextCid = customEvt?.detail?.companyId || customEvt?.detail?.empresaId || undefined;
      checkStatus(nextCid);
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'wappy_active_company_id') {
        checkStatus(e.newValue || undefined);
      }
    };

    window.addEventListener('wappy-company-changed', handleCompanySwitchEvent);
    window.addEventListener('wappy-empresa-cambiada', handleCompanySwitchEvent);
    window.addEventListener('wappy-reload-sgsst-data', () => checkStatus());
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('wappy-company-changed', handleCompanySwitchEvent);
      window.removeEventListener('wappy-empresa-cambiada', handleCompanySwitchEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [checkStatus]);

  const handleActivateCompanyInline = async (targetComp: CompanyGoogleSummary) => {
    if (!token || targetComp._id === companyId || switchingCompanyId) return;
    setSwitchingCompanyId(targetComp._id);
    try {
      const res = await fetch(`/api/sgsst/company-info/${targetComp._id}/activate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('No se pudo activar la empresa');
      }
      const activated = await res.json();
      safeSetItem('wappy_active_company_id', targetComp._id);
      if (activated.companyName) {
        safeSetItem('wappy_active_company_name', activated.companyName);
      }
      if (activated.nit) {
        safeSetItem('wappy_active_company_nit', activated.nit);
      }
      if (activated.arl) {
        safeSetItem('wappy_active_company_arl', activated.arl);
      }
      if (activated.workerCount !== undefined) {
        safeSetItem('wappy_active_company_workers', String(activated.workerCount));
      }
      if (activated.riskLevel) {
        safeSetItem('wappy_active_company_risk', activated.riskLevel);
      }
      if (activated.logoBase64) {
        if (activated.logoBase64.length > 50_000) {
          compressLogoDataUrl(activated.logoBase64)
            .then((c) => safeSetItem('wappy_sst_global_logo', c))
            .catch(() => safeSetItem('wappy_sst_global_logo', activated.logoBase64));
        } else {
          safeSetItem('wappy_sst_global_logo', activated.logoBase64);
        }
      } else {
        safeRemoveItem('wappy_sst_global_logo');
      }

      const detail = {
        companyId: targetComp._id,
        empresaId: targetComp._id,
        companyName: targetComp.companyName,
        empresa: targetComp.companyName,
        companyData: activated,
      };
      window.dispatchEvent(new CustomEvent('wappy-company-changed', { detail }));
      window.dispatchEvent(new CustomEvent('wappy-empresa-cambiada', { detail }));
      window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));

      await checkStatus(targetComp._id);
      showToast({
        message: `Empresa "${targetComp.companyName}" activada. Ahora puedes gestionar su cuenta de Google independiente.`,
        status: 'success',
      });
    } catch (err) {
      console.error('Error switching active company:', err);
      showToast({
        message: 'No se pudo cambiar la empresa activa.',
        status: 'error',
      });
    } finally {
      setSwitchingCompanyId(null);
    }
  };

  const handleConnect = async () => {
    if (!isProOrAdmin) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsActionLoading(true);
    try {
      const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
      const res = await axios.get(`/api/google-drive/auth${query}`);
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err) {
      console.error('Error initiating Google Drive auth:', err);
      showToast({
        message: 'No se pudo iniciar la autenticación con Google Workspace.',
        status: 'error',
      });
      setIsActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsActionLoading(true);
    try {
      const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
      await axios.delete(`/api/google-drive/disconnect${query}`);
      setConnected(false);
      setEmail(null);
      await checkStatus(companyId || undefined);
      showToast({
        message: `Cuenta de Google desconectada de ${companyName || 'la empresa activa'}.`,
        status: 'success',
      });
    } catch (err) {
      console.error('Error disconnecting Google Drive:', err);
      showToast({
        message: 'Error al desconectar Google Workspace.',
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
            {/* Custom Google Workspace Circular White Badge Icon */}
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-border-medium flex-shrink-0 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-bold flex flex-wrap items-center gap-2 text-text-primary">
                Google Workspace (Drive, Calendario y Gmail)
                {companyName ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 font-bold uppercase tracking-wider">
                    🏢 {companyName}
                  </span>
                ) : null}
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-[460px]">
                Cada empresa tiene su propia conexión aislada. Permite que tus agentes lean archivos,
                guarden reportes en Drive, envíen correos y programen alertas en Calendar para{' '}
                <strong>{companyName || 'la empresa activa'}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!connected ? (
              <WappyExpandButton
                variant="emerald"
                onClick={handleConnect}
                disabled={isActionLoading}
                isLoading={isActionLoading}
                icon={<Cloud className="w-4 h-4" />}
                label="Conectar Google Workspace"
              />
            ) : (
              <>
                <WappyExpandButton
                  variant="teal"
                  onClick={handleConnect}
                  disabled={isActionLoading}
                  isLoading={isActionLoading}
                  icon={<RefreshCw className="w-4 h-4" />}
                  label="Cambiar cuenta de Google"
                />
                <WappyExpandButton
                  variant="red"
                  onClick={handleDisconnect}
                  disabled={isActionLoading}
                  isLoading={isActionLoading}
                  icon={<LogOut className="w-4 h-4" />}
                  label="Desconectar"
                />
              </>
            )}
          </div>
        </div>

        {/* Selector rápido multi-empresa para ver y cambiar qué cuenta de Google corresponde a cada empresa */}
        {companies.length > 1 && (
          <div className="mt-1 rounded-xl border border-border-light bg-surface-secondary/50 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-500" />
                Cuentas de Google por Empresa ({companies.length}) — Haz clic en una empresa para activarla:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {companies.map((comp) => {
                const isCurrent = comp._id === companyId || comp.isActive;
                const isSwitching = switchingCompanyId === comp._id;
                return (
                  <button
                    key={comp._id}
                    type="button"
                    onClick={() => handleActivateCompanyInline(comp)}
                    disabled={Boolean(switchingCompanyId)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all text-left ${
                      isCurrent
                        ? 'bg-teal-500/15 border-teal-500/40 text-teal-800 dark:text-teal-300 font-bold shadow-sm'
                        : 'bg-surface-primary hover:bg-surface-hover border-border-light text-text-secondary'
                    }`}
                  >
                    {isSwitching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500 flex-shrink-0" />
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          comp.googleConnected ? 'bg-green-500' : 'bg-amber-400'
                        }`}
                      />
                    )}
                    <div className="flex flex-col leading-tight">
                      <span className="truncate max-w-[180px]">
                        {comp.companyName}
                        {isCurrent ? ' (Activa)' : ''}
                      </span>
                      <span className="text-[10px] opacity-80 truncate max-w-[180px]">
                        {comp.googleConnected && comp.googleEmail
                          ? comp.googleEmail
                          : 'Sin cuenta vinculada'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {connected ? (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-2xl mt-1 border border-green-500/20 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none transition-all duration-700 group-hover:bg-green-500/10" />

            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-green-600 dark:text-green-500 flex flex-wrap items-center gap-1.5">
                Google Workspace Conectado
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 font-extrabold uppercase tracking-wide">
                  {companyName || 'Empresa Activa'}
                </span>
              </span>
              <span className="text-xs text-text-secondary">
                Cuenta vinculada a esta empresa:{' '}
                <strong className="text-text-primary">{email}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3.5 bg-amber-500/5 rounded-2xl mt-1 border border-amber-500/20 text-xs text-text-secondary">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-text-primary">
                {companyName || 'La empresa activa'} no tiene una cuenta de Google vinculada
              </span>
              <span>
                Haz clic en el botón verde para vincular la cuenta de Google correspondiente a{' '}
                <strong>{companyName || 'esta empresa'}</strong>
                {companyEmail ? ` (correo en ficha: ${companyEmail})` : ''}.
              </span>
            </div>
          </div>
        )}
      </div>
      {isUpgradeModalOpen &&
        createPortal(
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
          document.body,
        )}
    </>
  );
}
