import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import {
  Sparkles,
  Send,
  Mail,
  Palette,
  Eye,
  Loader2,
  FileText,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function MarketingPortal() {
  const localize = useLocalize();
  const { showToast } = useToastContext();

  const [activeSubTab, setActiveSubTab] = useState<'edit' | 'preview'>('edit');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [buttonText, setButtonText] = useState('Mejorar Plan');
  const [buttonUrl, setButtonUrl] = useState('https://wappy.club/planes');
  const [theme, setTheme] = useState('slate');
  const [targetRole, setTargetRole] = useState('USER');
  const [testEmail, setTestEmail] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Update Preview HTML dynamically
  useEffect(() => {
    const getPreviewHtml = () => {
      const THEMES_CSS = {
        slate: {
          primaryColor: '#38bdf8', // sky-400
          accentBg: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          buttonShadow: 'rgba(59, 130, 246, 0.4)',
        },
        emerald: {
          primaryColor: '#34d399', // emerald-400
          accentBg: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #059669 100%)',
          buttonBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          buttonShadow: 'rgba(16, 185, 129, 0.4)',
        },
        indigo: {
          primaryColor: '#818cf8', // indigo-400
          accentBg: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #4f46e5 100%)',
          buttonBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          buttonShadow: 'rgba(99, 102, 241, 0.4)',
        },
        amber: {
          primaryColor: '#fbbf24', // amber-400
          accentBg: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #d97706 100%)',
          buttonBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          buttonShadow: 'rgba(245, 158, 11, 0.4)',
        }
      };

      const selectedTheme = THEMES_CSS[theme] || THEMES_CSS.slate;
      const currentYear = new Date().getFullYear();

      return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #e2e8f0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              background-color: #0f172a;
              padding: 20px;
              box-sizing: border-box;
            }
            .main-table {
              max-width: 500px;
              margin: 0 auto;
              border-collapse: collapse;
              width: 100%;
            }
            .header-logo {
              padding: 10px 0 20px 0;
              text-align: center;
            }
            .logo-img {
              max-height: 38px;
              width: auto;
              display: inline-block;
            }
            .card {
              background-color: #1e293b;
              border-radius: 16px;
              border: 1px solid #334155;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
              padding: 30px 25px;
              position: relative;
              overflow: hidden;
            }
            .accent-bar {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: ${selectedTheme.accentBg};
            }
            .title {
              font-size: 20px;
              font-weight: 800;
              color: #ffffff;
              margin-top: 10px;
              margin-bottom: 16px;
              line-height: 1.3;
            }
            .greeting {
              font-size: 15px;
              font-weight: 600;
              color: #ffffff;
              margin-bottom: 12px;
            }
            .highlight-name {
              color: ${selectedTheme.primaryColor};
            }
            .content-body {
              font-size: 14px;
              line-height: 1.6;
              color: #cbd5e1;
              margin-bottom: 20px;
            }
            .content-body p {
              margin-top: 0;
              margin-bottom: 12px;
            }
            .content-body ul, .content-body ol {
              margin-top: 0;
              margin-bottom: 12px;
              padding-left: 20px;
            }
            .content-body li {
              margin-bottom: 6px;
            }
            .btn-container {
              text-align: center;
              margin: 25px 0 15px 0;
            }
            .btn {
              display: inline-block;
              background: ${selectedTheme.buttonBg};
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 28px;
              border-radius: 10px;
              font-weight: 700;
              font-size: 14px;
              box-shadow: 0 4px 15px ${selectedTheme.buttonShadow};
            }
            .footer-signature {
              border-top: 1px solid #334155;
              margin-top: 25px;
              padding-top: 20px;
              font-size: 13px;
              color: #94a3b8;
            }
            .signature-team {
              color: ${selectedTheme.primaryColor};
              font-weight: 600;
            }
            .footer-info {
              text-align: center;
              padding: 20px 0;
              font-size: 11px;
              color: #64748b;
              line-height: 1.5;
            }
            .footer-info a {
              color: ${selectedTheme.primaryColor};
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <table class="main-table">
              <tr>
                <td class="header-logo">
                  <img class="logo-img" src="https://wappy.club/assets/logo.png" alt="WAPPY IA">
                </td>
              </tr>
              <tr>
                <td>
                  <div class="card">
                    <div class="accent-bar"></div>
                    <h1 class="title">${titleEscape(subject) || 'Asunto del Correo'}</h1>
                    <div class="greeting">Hola <span class="highlight-name">Usuario</span>,</div>
                    <div class="content-body">
                      ${bodyHtml || '<p>Aquí aparecerá el cuerpo del correo generado o redactado...</p>'}
                    </div>
                    ${buttonUrl && buttonText ? `
                    <div class="btn-container">
                      <a href="${buttonUrl}" target="_blank" class="btn">${buttonText}</a>
                    </div>
                    ` : ''}
                    <div class="footer-signature">
                      Un abrazo,<br>
                      <span class="signature-team">El equipo de WAPPY IA</span>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="footer-info">
                  <p>© ${currentYear} WAPPY IA. Todos los derechos reservados.</p>
                  <p>
                    <a href="#">Sitio Web</a> • <a href="#">Soporte técnico</a>
                  </p>
                </td>
              </tr>
            </table>
          </div>
        </body>
        </html>
      `;
    };

    setPreviewHtml(getPreviewHtml());
  }, [subject, bodyHtml, buttonText, buttonUrl, theme]);

  const titleEscape = (str: string) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast({ message: 'Escribe una instrucción para que la IA pueda redactar.', status: 'warning' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('/api/admin/marketing/generate', { prompt, model });
      if (response.data) {
        setSubject(response.data.subject || '');
        setBodyHtml(response.data.bodyHtml || '');
        showToast({ message: 'Correo redactado exitosamente con IA.', status: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      showToast({
        message: err.response?.data?.message || 'Error generando contenido con la IA.',
        status: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      showToast({ message: 'Ingresa un correo electrónico de prueba.', status: 'warning' });
      return;
    }
    if (!subject.trim() || !bodyHtml.trim()) {
      showToast({ message: 'El asunto y el cuerpo no pueden estar vacíos.', status: 'warning' });
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await axios.post('/api/admin/marketing/send', {
        subject,
        bodyHtml,
        buttonText,
        buttonUrl,
        theme,
        testEmail: testEmail.trim()
      });
      showToast({ message: response.data.message || 'Correo de prueba enviado con éxito.', status: 'success' });
    } catch (err: any) {
      console.error(err);
      showToast({
        message: err.response?.data?.message || 'Error enviando correo de prueba.',
        status: 'error'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendBulk = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      showToast({ message: 'El asunto y el cuerpo no pueden estar vacíos.', status: 'warning' });
      return;
    }

    const audienceLabel = targetRole === 'USER' ? 'PLAN INVITADO' : targetRole;
    const confirmMessage = `¿Estás seguro de que quieres enviar este correo de mercadeo a todos los usuarios del ${audienceLabel}?\n\nEsta acción no se puede deshacer y se enviará en segundo plano.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsSendingBulk(true);
    try {
      const response = await axios.post('/api/admin/marketing/send', {
        subject,
        bodyHtml,
        buttonText,
        buttonUrl,
        theme,
        targetRole
      });
      showToast({ message: response.data.message || 'Envío masivo iniciado.', status: 'success' });
    } catch (err: any) {
      console.error(err);
      showToast({
        message: err.response?.data?.message || 'Error iniciando envío masivo.',
        status: 'error'
      });
    } finally {
      setIsSendingBulk(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de sub-pestanas superior */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-2">
        <button
          onClick={() => setActiveSubTab('edit')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'edit'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <FileText className="h-4 w-4" />
          1. Redactar y Editar
        </button>
        <button
          onClick={() => setActiveSubTab('preview')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'preview'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Eye className="h-4 w-4" />
          2. Vista Previa y Envío
        </button>
      </div>

      {activeSubTab === 'edit' ? (
        <div className="flex flex-col gap-4">
          {/* Redactor con IA */}
          <div className="rounded-xl border border-gray-200 bg-surface-tertiary p-5 dark:border-gray-700">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                Redactar con Inteligencia Artificial
              </h4>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="rounded-md border border-gray-300 bg-surface-primary px-2 py-1 text-xs text-text-primary focus:outline-none dark:border-gray-600"
              >
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Default)</option>
                <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Lite</option>
              </select>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Escribe un correo invitando a los usuarios que están en el plan gratuito a que se actualicen a Wappy Pro, ofreciendo acceso completo a los agentes de SST y un 20% de descuento usando el cupón WAPPY20."
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-surface-primary p-3 text-sm text-text-primary placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Redactando correo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generar Asunto y Cuerpo con IA
                </>
              )}
            </button>
          </div>

          {/* Campos de Edición */}
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-surface-tertiary p-5 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-text-primary">
              Personalizar Contenido del Correo
            </h4>
            
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Asunto del Correo</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: ¡Actualízate a Wappy Pro y lleva tu SST al siguiente nivel!"
                className="w-full rounded-lg border border-gray-300 bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Cuerpo del Correo (Soporta HTML básico)</label>
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="Escribe aquí el cuerpo del correo en párrafos <p> o listas <ul>..."
                rows={6}
                className="w-full font-mono rounded-lg border border-gray-300 bg-surface-primary p-3 text-xs text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Texto del Botón CTA</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">URL del Botón CTA</label>
                <input
                  type="text"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600"
                />
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('preview')}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Continuar a Vista Previa y Envío <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* Columna Izquierda: Configuración de Envío y Estilos */}
          <div className="flex flex-col gap-4 md:col-span-6">
            
            {/* Estilo / Tema de Color */}
            <div className="rounded-xl border border-gray-200 bg-surface-tertiary p-4 dark:border-gray-700">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
                <Palette className="h-4 w-4 text-purple-500" />
                Estilo / Tema de Color
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'slate', name: 'Tecnológico', color: 'bg-slate-700 border-slate-500' },
                  { key: 'emerald', name: 'Esmeralda', color: 'bg-emerald-600 border-emerald-400' },
                  { key: 'indigo', name: 'Índigo', color: 'bg-indigo-600 border-indigo-400' },
                  { key: 'amber', name: 'Oro Cálido', color: 'bg-amber-500 border-amber-400' }
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold text-white transition hover:opacity-90 ${t.color} ${
                      theme === t.key ? 'ring-2 ring-blue-500 scale-[1.02]' : 'opacity-70'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Envío de Prueba */}
            <div className="rounded-xl border border-gray-200 bg-surface-tertiary p-4 dark:border-gray-700">
              <h5 className="mb-2 text-xs font-bold text-text-primary uppercase tracking-wider">Paso 1: Probar Diseño</h5>
              <p className="mb-3 text-[11px] text-text-secondary leading-relaxed">
                Envía una copia a tu correo para verificar la diagramación en tu bandeja de entrada.
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-lg border border-gray-300 bg-surface-primary px-3 py-2 text-xs text-text-primary focus:border-blue-500 focus:outline-none dark:border-gray-600"
                />
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Enviar Correo de Prueba
                </button>
              </div>
            </div>

            {/* Envío Masivo */}
            <div className="rounded-xl border border-gray-200 bg-surface-tertiary p-4 dark:border-gray-700">
              <h5 className="mb-2 text-xs font-bold text-text-primary uppercase tracking-wider">Paso 2: Enviar Campaña</h5>
              <p className="mb-3 text-[11px] text-text-secondary leading-relaxed">
                El envío masivo se ejecutará en segundo plano con retardos automáticos.
              </p>
              <div className="flex flex-col gap-2">
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-surface-primary px-3 py-2 text-xs text-text-primary focus:outline-none dark:border-gray-600"
                >
                  <option value="USER">Solo Plan Invitado (Rol: USER)</option>
                  <option value="USER_GO">Plan Go (Rol: USER_GO)</option>
                  <option value="USER_PLUS">Plan Plus (Rol: USER_PLUS)</option>
                  <option value="USER_PRO">Plan Pro (Rol: USER_PRO)</option>
                </select>
                
                <button
                  onClick={handleSendBulk}
                  disabled={isSendingBulk}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {isSendingBulk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Lanzar Campaña Masiva
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('edit')}
              className="mt-1 flex items-center justify-center gap-2 py-1.5 text-xs text-text-secondary hover:text-text-primary transition"
            >
              <ArrowLeft className="h-3 w-3" /> Regresar a editar contenido
            </button>

          </div>

          {/* Columna Derecha: Vista Previa */}
          <div className="flex flex-col gap-3 md:col-span-6">
            <h4 className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider">
              <Eye className="h-4 w-4 text-purple-500" />
              Vista Previa de Correo
            </h4>
            
            {/* Mockup de Correo / Device */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface-tertiary dark:border-gray-700 shadow-md min-h-[420px]">
              {/* Simulated Window Topbar */}
              <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="mx-auto text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                  mercadeo@wappy.club
                </span>
              </div>

              {/* Envelope Header info */}
              <div className="border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900 text-[11px] text-text-secondary flex flex-col gap-0.5">
                <div className="truncate"><span className="font-semibold text-text-primary">Para:</span> usuario@wappy.club</div>
                <div className="truncate"><span className="font-semibold text-text-primary">Asunto:</span> {subject || '(Sin Asunto)'}</div>
              </div>

              {/* Sandbox IFrame Container */}
              <div className="flex-1 bg-[#0f172a] p-0.5">
                {previewHtml ? (
                  <iframe
                    title="Email Preview"
                    srcDoc={previewHtml}
                    className="h-full w-full border-none min-h-[300px]"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-text-tertiary">
                    Cargando vista previa...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
