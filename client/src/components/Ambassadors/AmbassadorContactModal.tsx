import React, { useState } from 'react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import {
  X,
  Mail,
  MessageSquare,
  Sparkles,
  Send,
  Eye,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  ArrowRight,
  Palette
} from 'lucide-react';

export interface TargetFollowUpUser {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  subscriptionType?: string;
  planInterval?: string;
  planExpiresAt?: string | Date | null;
  daysToExpiry?: number | null;
  daysInactive?: number;
  trafficLight?: 'green' | 'yellow' | 'red' | 'gray';
  accountStatus?: string;
  ambassadorName?: string;
}

interface AmbassadorContactModalProps {
  user: TargetFollowUpUser;
  referralLink: string;
  onClose: () => void;
}

const QUICK_EMAIL_PROMPTS = [
  {
    label: '🎯 Renovar Wappy PRO',
    text: 'Escribe un correo persuasivo invitando al usuario a renovar su suscripción a Wappy PRO, destacando las nuevas actualizaciones de la suite Somos SST y ofreciendo asesoría personalizada.',
  },
  {
    label: '👋 Bienvenida y Soporte',
    text: 'Escribe un correo de bienvenida cálido como su embajador comercial asignado, presentándome para resolver dudas y ayudarle a aprovechar al máximo los agentes de WAPPY IA.',
  },
  {
    label: '🚀 Nuevos Agentes SST',
    text: 'Escribe un correo informativo sobre los nuevos agentes especializados: Coordinador PESV, Ingeniero Químico SST y Matriz IPEVAR para optimizar sus auditorías.',
  },
  {
    label: '⏰ Aviso de Vencimiento',
    text: 'Escribe un correo cortés pero con sentido de urgencia recordando que su suscripción está próxima a vencer o ha vencido, para evitar la interrupción de sus auditorías SST.',
  },
];

const QUICK_WA_PROMPTS = [
  {
    label: '🎯 Oferta PRO',
    text: 'Mensaje corto y directo invitándolo a renovar Wappy PRO con beneficio exclusivo.',
  },
  {
    label: '👋 Saludo Embajador',
    text: 'Saludo cordial como su asesor asignado en Wappy para ponerme a su disposición.',
  },
  {
    label: '⏰ Recordatorio Plan',
    text: 'Recordatorio rápido y amistoso sobre la vigencia de su plan en Wappy.',
  },
];

export default function AmbassadorContactModal({ user, referralLink, onClose }: AmbassadorContactModalProps) {
  const { showToast } = useToastContext();

  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp'>('email');
  const [emailSubTab, setEmailSubTab] = useState<'edit' | 'preview'>('edit');

  // Email State
  const [model, setModel] = useState('gemini-3.5-flash');
  const [emailPrompt, setEmailPrompt] = useState('');
  const [subject, setSubject] = useState(`¡Hola ${user.name.split(' ')[0]}! Novedades exclusivas en tu cuenta de Wappy IA`);
  const [bodyHtml, setBodyHtml] = useState(
    `<p>Hola <strong>${user.name}</strong>,</p><p>Te escribo para saludarte y contarte que tienes a tu disposición nuevas herramientas y agentes expertos en Seguridad y Salud en el Trabajo listos para potenciar tus matrices y auditorías.</p><p>¿Tienes alguna consulta o necesitas apoyo configurando tus procesos? Como tu asesor comercial asignado en Wappy, estoy para apoyarte.</p>`
  );
  const [buttonText, setButtonText] = useState('Ver Novedades en Wappy');
  const [buttonUrl, setButtonUrl] = useState(referralLink || 'https://wappy.club/planes');
  const [theme, setTheme] = useState<'slate' | 'emerald' | 'indigo' | 'amber'>('emerald');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // WhatsApp State
  const [waPrompt, setWaPrompt] = useState('');
  const [waMessage, setWaMessage] = useState(
    `Hola ${user.name.split(' ')[0]} 👋 ¿Cómo estás? Te saluda tu asesor de WAPPY IA. Te escribo para saber cómo te ha ido con la plataforma y compartirte las nuevas herramientas de SST que acabamos de lanzar 🚀. Puedes ingresar y revisarlas aquí 👇\n${referralLink || 'https://wappy.club'}\n\n¿Tienes alguna duda o te gustaría que te apoye con algo? Quedo muy atento 🙌`
  );
  const [isGeneratingWa, setIsGeneratingWa] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);

  // Clean phone number for WhatsApp URL
  const cleanPhone = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  // Generate Email Content with AI
  const handleGenerateEmail = async (customPrompt?: string) => {
    const p = customPrompt || emailPrompt;
    if (!p.trim()) {
      showToast({ message: 'Escribe una instrucción para que la IA redacte el correo.', status: 'warning' });
      return;
    }

    setIsGeneratingEmail(true);
    try {
      const response = await axios.post('/api/referrals/email/generate', {
        prompt: p,
        model,
        targetUserName: user.name,
        targetUserPlan: user.subscriptionType || 'Plan Activo',
        channel: 'email',
      });

      if (response.data) {
        if (response.data.subject) setSubject(response.data.subject);
        if (response.data.bodyHtml) setBodyHtml(response.data.bodyHtml);
        if (response.data.buttonText) setButtonText(response.data.buttonText);
        if (response.data.buttonUrl) setButtonUrl(response.data.buttonUrl);
        showToast({ message: 'Correo redactado exitosamente con IA.', status: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      showToast({
        message: err.response?.data?.message || 'Error generando correo con IA.',
        status: 'error',
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Generate WhatsApp Message with AI
  const handleGenerateWa = async (customPrompt?: string) => {
    const p = customPrompt || waPrompt;
    if (!p.trim()) {
      showToast({ message: 'Escribe una instrucción para que la IA redacte el mensaje de WhatsApp.', status: 'warning' });
      return;
    }

    setIsGeneratingWa(true);
    try {
      const response = await axios.post('/api/referrals/email/generate', {
        prompt: p,
        model,
        targetUserName: user.name,
        targetUserPlan: user.subscriptionType || 'Plan Activo',
        channel: 'whatsapp',
      });

      if (response.data && response.data.whatsappText) {
        setWaMessage(response.data.whatsappText);
        showToast({ message: 'Mensaje de WhatsApp redactado con éxito.', status: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      showToast({
        message: err.response?.data?.message || 'Error generando mensaje con IA.',
        status: 'error',
      });
    } finally {
      setIsGeneratingWa(false);
    }
  };

  // Send Marketing Email directly to user
  const handleSendEmail = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      showToast({ message: 'El asunto y el cuerpo del correo no pueden estar vacíos.', status: 'warning' });
      return;
    }
    if (!user.email) {
      showToast({ message: 'El usuario no tiene un correo electrónico válido.', status: 'error' });
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await axios.post('/api/referrals/email/send', {
        targetUserId: user.id || user.userId,
        targetEmail: user.email,
        subject,
        bodyHtml,
        buttonText,
        buttonUrl,
        theme,
      });

      showToast({
        message: response.data?.message || `Correo enviado exitosamente a ${user.email}.`,
        status: 'success',
      });
      setEmailSubTab('edit');
    } catch (err: any) {
      console.error(err);
      showToast({
        message: err.response?.data?.message || 'Error al enviar el correo.',
        status: 'error',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Copy WhatsApp text to clipboard
  const handleCopyWa = () => {
    navigator.clipboard.writeText(waMessage);
    setCopiedWa(true);
    showToast({ message: 'Mensaje copiado al portapapeles.', status: 'success' });
    setTimeout(() => setCopiedWa(false), 3000);
  };

  // Email Preview Themes
  const THEMES_CSS = {
    slate: {
      primaryColor: '#38bdf8',
      accentBg: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    },
    emerald: {
      primaryColor: '#34d399',
      accentBg: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #059669 100%)',
      buttonBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    indigo: {
      primaryColor: '#818cf8',
      accentBg: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #4f46e5 100%)',
      buttonBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    },
    amber: {
      primaryColor: '#fbbf24',
      accentBg: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #d97706 100%)',
      buttonBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
  };

  const currentTheme = THEMES_CSS[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-border-medium/50 rounded-2xl shadow-2xl w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header: User Info Overview */}
        <div className="bg-surface-secondary/80 border-b border-border-medium/40 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-extrabold text-lg shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-extrabold text-text-primary">{user.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 uppercase">
                    {user.subscriptionType || 'Freemium'} {user.planInterval ? `(${user.planInterval})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5 flex-wrap">
                  <span>{user.email}</span>
                  {user.phone && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {user.phone}
                    </span>
                  )}
                  {user.daysToExpiry !== null && user.daysToExpiry !== undefined && (
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      ⏱️ {user.daysToExpiry < 0 ? `Venció hace ${Math.abs(user.daysToExpiry)}d` : `${user.daysToExpiry}d restantes`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Channel Selector Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-medium/30">
            <button
              type="button"
              onClick={() => setActiveChannel('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeChannel === 'email'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-surface-primary text-text-secondary hover:bg-surface-hover border border-border-medium/30'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Enviar Correo de Campaña</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChannel('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeChannel === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-surface-primary text-text-secondary hover:bg-surface-hover border border-border-medium/30'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Mensaje WhatsApp Directo</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* ================= CHANNEL 1: EMAIL MARKETING ================= */}
          {activeChannel === 'email' && (
            <div className="space-y-4">
              
              {/* Sub-tabs: Edit vs Preview */}
              <div className="flex items-center justify-between border-b border-border-medium/30 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailSubTab('edit')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      emailSubTab === 'edit'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                        : 'text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>1. Redactar y Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailSubTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      emailSubTab === 'preview'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                        : 'text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>2. Vista Previa y Envío</span>
                  </button>
                </div>

                <div className="text-[11px] text-text-tertiary hidden sm:block">
                  Destinatario: <span className="font-semibold text-text-primary">{user.email}</span>
                </div>
              </div>

              {/* Sub-tab 1: Redactar y Editar */}
              {emailSubTab === 'edit' && (
                <div className="space-y-4">
                  {/* AI Generation Box */}
                  <div className="bg-surface-secondary/50 border border-teal-500/20 rounded-xl p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-purple-700 dark:text-purple-300">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>Redactar con Inteligencia Artificial</span>
                      </div>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="bg-surface-primary border border-border-medium/40 rounded-lg px-2.5 py-1 text-xs text-text-secondary outline-none focus:border-teal-500"
                      >
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                        <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      </select>
                    </div>

                    {/* Quick Prompt Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_EMAIL_PROMPTS.map((qp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEmailPrompt(qp.text);
                            handleGenerateEmail(qp.text);
                          }}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-primary border border-border-medium/40 hover:border-teal-500 hover:text-teal-600 transition-colors text-text-secondary text-left cursor-pointer"
                        >
                          {qp.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <textarea
                        value={emailPrompt}
                        onChange={(e) => setEmailPrompt(e.target.value)}
                        placeholder={`Ej: Escribe un correo invitando a ${user.name} a renovar su plan en Wappy PRO con un descuento del 10%...`}
                        rows={2}
                        className="w-full bg-surface-primary border border-border-medium/40 rounded-xl p-3 text-xs text-text-primary outline-none focus:border-teal-500 resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateEmail()}
                      disabled={isGeneratingEmail}
                      className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isGeneratingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Redactando con Inteligencia Artificial...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generar Asunto y Cuerpo con IA</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Manual Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-text-tertiary uppercase mb-1">
                        Asunto del Correo
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-text-tertiary uppercase mb-1">
                        Cuerpo del Correo (HTML seguro)
                      </label>
                      <textarea
                        value={bodyHtml}
                        onChange={(e) => setBodyHtml(e.target.value)}
                        rows={5}
                        className="w-full bg-surface-primary border border-border-medium/40 rounded-xl p-3 text-xs text-text-primary font-mono outline-none focus:border-teal-500 resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-tertiary uppercase mb-1">
                          Texto del Botón CTA
                        </label>
                        <input
                          type="text"
                          value={buttonText}
                          onChange={(e) => setButtonText(e.target.value)}
                          className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-text-tertiary uppercase mb-1">
                          URL del Botón (Enlace de Referido)
                        </label>
                        <input
                          type="text"
                          value={buttonUrl}
                          onChange={(e) => setButtonUrl(e.target.value)}
                          className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-text-tertiary uppercase mb-1 flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5" /> Tema de Color
                      </label>
                      <div className="flex items-center gap-2">
                        {(['slate', 'emerald', 'indigo', 'amber'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTheme(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all cursor-pointer ${
                              theme === t
                                ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                                : 'border-border-medium/40 bg-surface-primary text-text-secondary hover:bg-surface-hover'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEmailSubTab('preview')}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Ver Vista Previa y Enviar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Vista Previa y Envío */}
              {emailSubTab === 'preview' && (
                <div className="space-y-4">
                  {/* Email Preview Card */}
                  <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-6 border border-gray-800 shadow-xl max-w-lg mx-auto text-slate-200 text-left relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: currentTheme.accentBg }}
                    />
                    <div className="text-center py-2 mb-3">
                      <span className="font-extrabold text-lg text-white tracking-wide">WAPPY <span style={{ color: currentTheme.primaryColor }}>IA</span></span>
                    </div>

                    <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700/60 shadow-md">
                      <h4 className="text-base font-bold text-white mb-2 leading-snug">{subject || 'Asunto del Correo'}</h4>
                      <div className="text-xs text-slate-300 mb-3 font-semibold">
                        Hola <span style={{ color: currentTheme.primaryColor }}>{user.name}</span>,
                      </div>
                      <div
                        className="text-xs text-slate-300 space-y-2 leading-relaxed"
                        dangerouslySetHtml={{ __html: bodyHtml || '<p>Cuerpo del mensaje...</p>' }}
                      />

                      {buttonText && buttonUrl && (
                        <div className="text-center my-5">
                          <a
                            href={buttonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg"
                            style={{ background: currentTheme.buttonBg }}
                          >
                            {buttonText}
                          </a>
                        </div>
                      )}

                      <div className="border-t border-slate-700/60 pt-3 mt-4 text-[11px] text-slate-400">
                        Un abrazo cordial,<br />
                        <span style={{ color: currentTheme.primaryColor }} className="font-bold">
                          El equipo de WAPPY IA & Tu Embajador Comercial
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Send Action */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setEmailSubTab('edit')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-hover cursor-pointer"
                    >
                      ← Volver a Editar
                    </button>

                    <button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={isSendingEmail}
                      className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando Correo a {user.name}...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Correo a {user.name}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ================= CHANNEL 2: WHATSAPP DIRECTO ================= */}
          {activeChannel === 'whatsapp' && (
            <div className="space-y-4">
              
              {/* WhatsApp AI Box */}
              <div className="bg-surface-secondary/50 border border-emerald-500/20 rounded-xl p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Redactar Mensaje WhatsApp con IA</span>
                  </div>
                  <span className="text-[11px] text-text-tertiary">Envío manual directo (Sin costo de API)</span>
                </div>

                {/* Quick Chips for WA */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_WA_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setWaPrompt(qp.text);
                        handleGenerateWa(qp.text);
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-primary border border-border-medium/40 hover:border-emerald-500 hover:text-emerald-600 transition-colors text-text-secondary text-left cursor-pointer"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    value={waPrompt}
                    onChange={(e) => setWaPrompt(e.target.value)}
                    placeholder={`Ej: Mensaje cercano recordándole a ${user.name} que tiene soporte exclusivo para sus matrices...`}
                    rows={2}
                    className="w-full bg-surface-primary border border-border-medium/40 rounded-xl p-3 text-xs text-text-primary outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateWa()}
                  disabled={isGeneratingWa}
                  className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isGeneratingWa ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Redactando Mensaje con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Mensaje WhatsApp con IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editable WhatsApp Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">
                    Mensaje de WhatsApp para Enviar
                  </label>
                  <span className="text-[10px] text-text-tertiary">{waMessage.length} caracteres</span>
                </div>
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-surface-primary border border-border-medium/40 rounded-xl p-3 text-xs text-text-primary outline-none focus:border-emerald-500 resize-y font-sans leading-relaxed"
                />
              </div>

              {/* Phone Alert if missing */}
              {!user.phone && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-medium">
                  ⚠️ El usuario no tiene número de teléfono registrado en el sistema. Al hacer clic en <strong>Abrir en WhatsApp</strong>, se abrirá WhatsApp con el mensaje precargado para que selecciones el contacto manualmente.
                </div>
              )}

              {/* Direct WhatsApp Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyWa}
                  className="py-3 px-4 rounded-xl text-xs font-bold bg-surface-secondary border border-border-medium/40 text-text-primary hover:bg-surface-hover flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedWa ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWa ? '¡Mensaje Copiado!' : 'Copiar Mensaje'}</span>
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl text-xs font-extrabold bg-[#25D366] hover:bg-[#1EBE5D] text-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 fill-black" />
                  <span>Abrir en WhatsApp (wa.me)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
