import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Copy, Download } from 'lucide-react';
import { Input, Label, useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { WappyExpandButton } from '../WappyExpandButton';
import WhatsAppConnect from './WhatsAppConnect';
import GoogleDriveConnect from './GoogleDriveConnect';
import OneDriveConnect from './OneDriveConnect';
import GoogleAIConnect from './GoogleAIConnect';
import AntigravityMcpConnect from './AntigravityMcpConnect';
import NotebookLMConnect from './NotebookLMConnect';
import GoogleFlowConnect from './GoogleFlowConnect';

function IntegrationsTab() {
  const { user, token } = useAuthContext();
  const { showToast } = useToastContext();

  const [showToken, setShowToken] = useState(false);
  const [desktopToken, setDesktopToken] = useState<string>('');

  useEffect(() => {
    const fetchDesktopToken = async () => {
      try {
        const response = await axios.get('/api/sgsst/canvas/desktop-token');
        setDesktopToken(response.data.token);
      } catch (error) {
        console.error('Error fetching desktop token:', error);
      }
    };
    if (user && user.role === 'ADMIN') {
      fetchDesktopToken();
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-6 p-2 text-sm text-text-primary">
      <div className="flex flex-col gap-1 p-5 rounded-2xl border border-border-light bg-surface-primary shadow-sm">
        <div className="mb-2 pb-3 border-b border-border-light">
          <h3 className="text-base font-bold text-text-primary">Conexiones e Integraciones</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Administra tus llaves de IA, almacenamiento en la nube y enlace en vivo con Antigravity y NotebookLM.
          </p>
        </div>

        {/* Google AI (Gemini API Key) - Todos los usuarios */}
        <div className="py-2">
          <GoogleAIConnect />
        </div>
        <div className="h-px bg-border-light w-full my-1"></div>

        {/* Token de Seguridad (JWT) para Agente Local - Solo para ADMIN */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div className="flex flex-col gap-1 flex-1">
                  <Label className="text-sm font-bold text-text-primary">
                    Token de Seguridad (JWT) para Agente Local
                  </Label>
                  <p className="text-xs text-text-secondary">
                    Usa este token para conectar las carpetas de tu computadora con WAPPY de forma segura.
                  </p>
                  <div className="relative mt-2 flex gap-2 max-w-xl">
                    <div className="relative flex-1">
                      <Input
                        id="mcpToken"
                        type={showToken ? 'text' : 'password'}
                        value={desktopToken || token}
                        readOnly
                        className="pr-10 font-mono text-xs select-all bg-surface-secondary text-text-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-primary"
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <WappyExpandButton
                      type="button"
                      variant="neutral"
                      icon={<Copy className="w-4 h-4" />}
                      label="Copiar"
                      onClick={() => {
                        navigator.clipboard.writeText(desktopToken || token);
                        showToast({ message: 'Token copiado al portapapeles', status: 'success' });
                      }}
                    />
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-text-secondary">
                      Descargar Aplicativo "Somos SST - WappyClub":
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <WappyExpandButton
                        type="button"
                        variant="emerald"
                        icon={<Download className="w-4 h-4" />}
                        label="Descargar para Windows (.exe)"
                        onClick={() => {
                          window.open('/download/somos-sst-wappyclub/windows', '_blank');
                        }}
                      />
                      <WappyExpandButton
                        type="button"
                        variant="blue"
                        icon={<Download className="w-4 h-4" />}
                        label="Descargar para macOS (.dmg)"
                        onClick={() => {
                          window.open('/download/somos-sst-wappyclub/mac', '_blank');
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-px bg-border-light w-full my-1"></div>
          </>
        )}

        {/* Google Workspace / Drive - Todos los usuarios */}
        <div className="py-2">
          <GoogleDriveConnect />
        </div>

        {/* Microsoft OneDrive - Solo para ADMIN */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="h-px bg-border-light w-full my-1"></div>
            <div className="py-2">
              <OneDriveConnect />
            </div>
          </>
        )}

        {/* WhatsApp - Solo para ADMIN */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="h-px bg-border-light w-full my-1"></div>
            <div className="py-2">
              <WhatsAppConnect />
            </div>
          </>
        )}

        {/* Antigravity MCP - Todos los usuarios */}
        <div className="h-px bg-border-light w-full my-1"></div>
        <div className="py-2">
          <AntigravityMcpConnect />
        </div>

        {/* NotebookLM - Todos los usuarios */}
        <div className="h-px bg-border-light w-full my-1"></div>
        <div className="py-2">
          <NotebookLMConnect />
        </div>

        {/* Google Flow (Imágenes y Videos con Veo / Imagen) - Todos los usuarios */}
        <div className="h-px bg-border-light w-full my-1"></div>
        <div className="py-2">
          <GoogleFlowConnect />
        </div>
      </div>
    </div>
  );
}

export default React.memo(IntegrationsTab);
