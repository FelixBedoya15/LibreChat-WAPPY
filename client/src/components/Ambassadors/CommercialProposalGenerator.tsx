import React, { useState } from 'react';
import { Sparkles, Copy, FileText, Send, CheckCircle2, Download } from 'lucide-react';
import { useToastContext } from '@librechat/client';

interface CommercialProposalGeneratorProps {
  ambassadorName: string;
  ambassadorPhone: string;
  ambassadorEmail: string;
  referralLink: string;
}

export default function CommercialProposalGenerator({
  ambassadorName,
  ambassadorPhone,
  ambassadorEmail,
  referralLink,
}: CommercialProposalGeneratorProps) {
  const { showToast } = useToastContext();
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [planType, setPlanType] = useState('PRO');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [generatedText, setGeneratedText] = useState('');

  const handleGenerate = () => {
    const text = `🌟 *PROPUESTA COMERCIAL - WAPPY IA PARA SG-SST*

Hola ${clientName || 'Estimado(a)'}, te presento la propuesta oficial para ${companyName || 'tu empresa'}:

🚀 *Plan:* WAPPY ${planType}
🎁 *Beneficio Especial:* ${discountPercent !== '0' ? `${discountPercent}% de Descuento` : 'Acceso inmediato y soporte dedicado'}
🔗 *Enlace de Registro Directo:* ${referralLink}

🛡️ *¿Qué incluye WAPPY IA?*
• Creación y personalización de matrices SST, PESV y Químicos en minutos.
• Asistentes de IA especializados en normatividad colombiana (Dec. 1072, Res. 0312, Res. 40595).
• Generación automática de informes, evaluaciones y planes de trabajo.

👤 *Tu Asesor Comercial:* ${ambassadorName}
📞 *WhatsApp:* ${ambassadorPhone || '3102913651'}
✉️ *Correo:* ${ambassadorEmail || 'contacto@wappy.club'}

¿Cuándo coordinamos una breve demo para activar tu cuenta?`;

    setGeneratedText(text);
    showToast({ message: 'Propuesta generada correctamente', status: 'success' });
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    showToast({ message: 'Propuesta copiada al portapapeles', status: 'success' });
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 border-b border-border-medium/30 pb-3">
        <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
        <h3 className="text-base font-extrabold text-text-primary">Generador de Propuestas Comerciales con IA</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase">Nombre del Contacto / Lead</label>
          <input
            type="text"
            placeholder="Ej: Ing. Carlos Pérez"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1 w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3.5 py-2 text-xs text-text-primary outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase">Empresa / Razón Social</label>
          <input
            type="text"
            placeholder="Ej: Constructora Andina S.A.S"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3.5 py-2 text-xs text-text-primary outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase">Plan Comercial Sugerido</label>
          <select
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            className="mt-1 w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3.5 py-2 text-xs text-text-primary outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="PRO">WAPPY PRO (Ilimitado + Agentes SST)</option>
            <option value="VITAL">WAPPY VITAL (Acceso Empresarial)</option>
            <option value="EMPRESARIAL">A la Medida / Multi-Empresa</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase">Descuento Promocional</label>
          <select
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="mt-1 w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3.5 py-2 text-xs text-text-primary outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="0">Sin descuento (Precio estándar)</option>
            <option value="10">10% OFF Promocional</option>
            <option value="20">20% OFF Especial Lanzamiento</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleGenerate}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generar Propuesta Comercial</span>
        </button>
      </div>

      {generatedText && (
        <div className="space-y-2 pt-3 border-t border-border-medium/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase">Texto Listo para WhatsApp / Correo:</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Texto</span>
            </button>
          </div>
          <textarea
            rows={10}
            readOnly
            value={generatedText}
            className="w-full bg-surface-secondary/60 border border-border-medium/40 rounded-2xl p-4 text-xs text-text-primary font-mono outline-none"
          />
        </div>
      )}
    </div>
  );
}
