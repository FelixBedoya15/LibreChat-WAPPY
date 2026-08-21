import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Briefcase, 
  Building2, 
  Sparkles, 
  Download, 
  Share2, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  ExternalLink, 
  Copy, 
  Upload, 
  Trash2, 
  FileText, 
  TrendingUp, 
  Layers, 
  RefreshCw,
  Edit3,
  Bot
} from 'lucide-react';
import { useToastContext } from '@librechat/client';

interface ProposalModule {
  title: string;
  description: string;
  benefits: string;
}

interface ProposalPlan {
  key: string;
  planName: string;
  interval: string;
  regularPrice: number;
  discountPercentage: number;
  finalPrice: number;
  pricePerMonth: number;
  features: string[];
  isRecommended: boolean;
  paymentUrl: string;
}

interface ProposalTimeline {
  phase: string;
  time: string;
  description: string;
}

interface GeneratedProposal {
  title: string;
  proposalCode: string;
  companyName: string;
  companyNit: string;
  sector: string;
  employeeCount: string;
  executiveSummary: string;
  sectorDiagnosis: string;
  includedModules: ProposalModule[];
  roiAnalysis: {
    timeSavedHoursPerMonth: string;
    estimatedSavingsCop: string;
    qualitativeBenefits: string[];
  };
  investmentPlans: ProposalPlan[];
  implementationTimeline: ProposalTimeline[];
  termsAndConditions: string[];
  closingMessage: string;
  ambassadorData: {
    name: string;
    phone: string;
    email: string;
    referralLink: string;
  };
  generatedAt: string;
}

interface CommercialProposalGeneratorProps {
  ambassadorName?: string;
  ambassadorPhone?: string;
  ambassadorEmail?: string;
  referralLink?: string;
}

const SECTORS = [
  'Construcción e Infraestructura',
  'Transporte y Logística (PESV Res. 40595)',
  'Manufactura e Industria Química (SGA)',
  'Servicios Profesionales y Consultoría SST',
  'Salud y Clínicas',
  'Comercio y Retail',
  'Minería y Energía',
  'Alimentos y Bebidas',
  'Educación y Entidades Públicas',
  'Tecnología y Servicios Generales'
];

export default function CommercialProposalGenerator({
  ambassadorName = 'Asesor WAPPY IA',
  ambassadorPhone = '',
  ambassadorEmail = '',
  referralLink = 'https://wappy.club'
}: CommercialProposalGeneratorProps) {
  const { showToast } = useToastContext();

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [companyNit, setCompanyNit] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [sector, setSector] = useState(SECTORS[0]);
  const [employeeCount, setEmployeeCount] = useState('11-50');
  const [proposalScope, setProposalScope] = useState('Automatización Integral SG-SST, Matrices IPEVAR, PESV y Asistentes IA');
  const [selectedPlans, setSelectedPlans] = useState<string[]>(['anual', 'semestral']);
  const [customDiscount, setCustomDiscount] = useState<number>(10);
  const [customObservations, setCustomObservations] = useState('');
  const [clientLogo, setClientLogo] = useState<string | null>(null);

  // Advisor Info
  const [advisorName, setAdvisorName] = useState(ambassadorName);
  const [advisorPhone, setAdvisorPhone] = useState(ambassadorPhone);
  const [advisorEmail, setAdvisorEmail] = useState(ambassadorEmail);

  // Proposal State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [proposal, setProposal] = useState<GeneratedProposal | null>(null);
  const [isEditable, setIsEditable] = useState(false);

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast({ message: 'El logo no debe superar los 3 MB.', status: 'warning' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setClientLogo(uploadEvent.target?.result as string);
        showToast({ message: 'Logo de la empresa cargado con éxito.', status: 'success' });
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePlanSelection = (planKey: string) => {
    if (selectedPlans.includes(planKey)) {
      if (selectedPlans.length === 1) {
        showToast({ message: 'Debes cotizar al menos un plan en la propuesta.', status: 'warning' });
        return;
      }
      setSelectedPlans(selectedPlans.filter(p => p !== planKey));
    } else {
      setSelectedPlans([...selectedPlans, planKey]);
    }
  };

  // Generate with real AI (Gemini 3.5 Lite backend)
  const handleGenerateProposal = async () => {
    if (!companyName.trim()) {
      showToast({ message: 'Ingresa el nombre o razón social de la empresa cliente.', status: 'warning' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('/api/referrals/proposal/generate', {
        companyName,
        companyNit,
        contactPerson,
        clientEmail,
        sector,
        employeeCount,
        proposalScope,
        selectedPlans,
        customDiscount,
        customObservations,
        ambassadorName: advisorName,
        ambassadorPhone: advisorPhone,
        ambassadorEmail: advisorEmail,
        referralLink: referralLink || 'https://wappy.club'
      });

      setProposal(response.data);
      showToast({ message: '¡Propuesta comercial ejecutiva generada con éxito por la IA!', status: 'success' });
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Error al generar la propuesta con IA.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Send official proposal email via Wappy backend
  const handleSendEmail = async () => {
    if (!proposal) return;
    const targetMail = (clientEmail || '').trim();
    if (!targetMail || !targetMail.includes('@')) {
      showToast({ message: 'Ingresa un correo electrónico válido para enviar la propuesta oficial.', status: 'warning' });
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await axios.post('/api/referrals/proposal/send-email', {
        clientEmail: targetMail,
        proposal,
      });

      showToast({ 
        message: response.data?.message || `¡Propuesta comercial enviada con éxito a ${targetMail}!`, 
        status: 'success' 
      });
    } catch (err: any) {
      showToast({ 
        message: err.response?.data?.message || 'Error al enviar el correo de la propuesta comercial.', 
        status: 'error' 
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!proposal) return;
    const cleanPhone = (advisorPhone || '').replace(/[^0-9]/g, '');
    const plansSummary = proposal.investmentPlans.map(p => `• *${p.planName}*: $${p.finalPrice.toLocaleString('es-CO')} COP (${p.discountPercentage > 0 ? `${p.discountPercentage}% OFF` : 'Precio Estándar'})`).join('\n');
    
    const waText = `Hola *${proposal.companyName}* 👋\n\nTe comparto la *Propuesta Comercial Oficial de WAPPY IA* para la automatización de su Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST, PESV y Matrices IPEVAR).\n\n📄 *Código:* ${proposal.proposalCode}\n💼 *Sector:* ${proposal.sector}\n\n💰 *Opciones de Inversión:*\n${plansSummary}\n\nPuedes revisar todos los módulos incluidos y activar su cuenta corporativa directamente aquí 👇\n${referralLink}\n\nQuedo a su disposición para coordinar una breve demostración en vivo.\n*${advisorName}* - Consultor Líder WAPPY IA`;

    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900/40 via-teal-800/20 to-surface-secondary border border-teal-500/30 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Generador de Propuestas Comerciales con IA (Gemini 3.5)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary">
            Crea Propuestas Ejecutivas en PDF & Envíalas por Correo Oficial
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-2xl">
            Ingresa los datos de tu cliente corporativo, carga su logo institucional y la IA redactará una propuesta personalizada con diagnóstico sectorial, tablas de inversión y análisis de ROI, lista para enviar por correo corporativo desde Wappy, descargar en PDF o compartir por WhatsApp.
          </p>
        </div>

        {proposal && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSendingEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>{isSendingEmail ? 'Enviando...' : 'Enviar por Correo Oficial'}</span>
            </button>
            <button
              onClick={handlePrintPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Form Controls Left / Executive Document Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Options */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2 pb-2 border-b border-border-medium/30">
              <Building2 className="w-4 h-4 text-teal-500" />
              <span>Datos del Cliente & Parámetros</span>
            </h3>

            {/* Company Name */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Empresa / Razón Social <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej. Constructora Bolívar S.A.S."
                className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-primary font-medium"
              />
            </div>

            {/* NIT */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                NIT o Identificación Tributaria
              </label>
              <input
                type="text"
                value={companyNit}
                onChange={(e) => setCompanyNit(e.target.value)}
                placeholder="Ej. 900.123.456-7"
                className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-primary"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Nombre del Contacto / Directivo
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Ej. Ing. Carlos Pérez (Gerente SST)"
                className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-primary"
              />
            </div>

            {/* Client Email for Official Proposal Sending */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1 flex items-center justify-between">
                <span>Correo del Cliente / Destinatario</span>
                <span className="text-[10px] text-teal-600 font-bold lowercase">para envío oficial</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full bg-surface-primary border border-border-medium/40 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-teal-500 text-text-primary"
                />
              </div>
            </div>

            {/* Sector */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Sector Económico Principal
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-primary font-medium cursor-pointer"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Employee Count */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Número de Trabajadores / Alcance
              </label>
              <select
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-primary font-medium cursor-pointer"
              >
                <option value="1-10">1 a 10 Trabajadores (Microempresa)</option>
                <option value="11-50">11 a 50 Trabajadores (Pequeña Empresa)</option>
                <option value="51-200">51 a 200 Trabajadores (Mediana Empresa)</option>
                <option value="Más de 200">Más de 200 Trabajadores (Gran Empresa)</option>
              </select>
            </div>

            {/* Client Logo Uploader */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Logo de la Empresa Cliente
              </label>
              {clientLogo ? (
                <div className="flex items-center justify-between p-2.5 bg-surface-secondary border border-teal-500/30 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <img src={clientLogo} alt="Logo Cliente" className="h-8 max-w-[100px] object-contain rounded bg-white p-1" />
                    <span className="text-xs text-text-primary font-semibold">Logo listo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClientLogo(null)}
                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-border-medium/60 hover:border-teal-500/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-surface-primary/50 hover:bg-surface-hover transition-all">
                  <Upload className="w-4 h-4 text-teal-500" />
                  <span className="text-xs font-semibold text-text-primary">Subir Logo (PNG, JPG)</span>
                  <span className="text-[10px] text-text-tertiary">Aparecerá en el membrete del PDF</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Plans to Quote */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1.5">
                Planes a Cotizar en la Propuesta
              </label>
              <div className="space-y-1.5">
                {[
                  { key: 'anual', label: 'Plan Pro Anual ($600.000 COP)', badge: 'Recomendado' },
                  { key: 'semestral', label: 'Plan Pro Semestral ($350.000 COP)', badge: '6 Meses' },
                  { key: 'mensual', label: 'Plan Pro Mensual ($97.180 COP)', badge: 'Mensual' },
                ].map((p) => {
                  const isChecked = selectedPlans.includes(p.key);
                  return (
                    <div
                      key={p.key}
                      onClick={() => togglePlanSelection(p.key)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-teal-500 bg-teal-500/10 text-text-primary font-bold'
                          : 'border-border-medium/40 bg-surface-primary text-text-secondary hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-teal-600 border-teal-600 text-white' : 'border-border-medium/60'}`}>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span>{p.label}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">{p.badge}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discount Percentage */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-text-secondary uppercase">
                  Descuento Comercial de Embajador
                </label>
                <span className="text-xs font-black text-teal-600">{customDiscount}% OFF</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 10, 15, 20, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCustomDiscount(d)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      customDiscount === d
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {d === 0 ? '0%' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Observaciones Específicas / Necesidades
              </label>
              <textarea
                value={customObservations}
                onChange={(e) => setCustomObservations(e.target.value)}
                placeholder="Ej. La empresa requiere actualizar urgente su Matriz IPEVAR y el Plan Estratégico de Seguridad Vial (PESV) para auditoría ARL en 30 días."
                rows={2}
                className="w-full bg-surface-primary border border-border-medium/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 text-text-primary resize-none"
              />
            </div>

            {/* Advisor Info */}
            <div className="pt-2 border-t border-border-medium/30 space-y-2">
              <label className="block text-[10px] font-bold text-text-tertiary uppercase">
                Datos del Asesor Comercial / Firma
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  placeholder="Nombre Asesor"
                  className="bg-surface-primary border border-border-medium/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-teal-500"
                />
                <input
                  type="text"
                  value={advisorPhone}
                  onChange={(e) => setAdvisorPhone(e.target.value)}
                  placeholder="WhatsApp Asesor"
                  className="bg-surface-primary border border-border-medium/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerateProposal}
              disabled={isGenerating || !companyName.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Redactando Propuesta Ejecutiva con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Propuesta con IA (Gemini 3.5)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Executive Document Preview & Printable PDF */}
        <div className="lg:col-span-8">
          {proposal ? (
            <div className="space-y-4">
              {/* Document Action Toolbar */}
              <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-text-primary">
                    Propuesta: <span className="text-teal-600">{proposal.proposalCode}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    <span>{isSendingEmail ? 'Enviando Correo...' : 'Enviar por Correo'}</span>
                  </button>
                  <button
                    onClick={() => setIsEditable(!isEditable)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isEditable
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-surface-primary border-border-medium/40 text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditable ? 'Guardar Cambios' : 'Editar Texto'}</span>
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Printable Document Container */}
              <div 
                ref={printContainerRef}
                className="bg-white text-gray-900 border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8 font-sans print:border-none print:shadow-none print:p-0 print:m-0"
                style={{ minHeight: '1100px' }}
              >
                {/* Header: Logos + Proposal Code */}
                <div className="flex items-center justify-between border-b-2 border-teal-600 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-2xl shadow-md">
                      W
                    </div>
                    <div>
                      <div className="font-black text-2xl tracking-tight text-gray-900 leading-none">
                        WAPPY <span className="text-teal-600">IA</span>
                      </div>
                      <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mt-0.5">
                        Plataforma Líder de IA en Seguridad y Salud en el Trabajo
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    {clientLogo && (
                      <img src={clientLogo} alt="Logo Cliente" className="h-12 max-w-[150px] object-contain" />
                    )}
                    <div>
                      <div className="inline-block bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase mb-1">
                        Propuesta Comercial Oficial
                      </div>
                      <div className="text-xs font-bold text-gray-800">{proposal.proposalCode}</div>
                      <div className="text-[11px] text-gray-500">{new Date(proposal.generatedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>
                </div>

                {/* Target Company Box */}
                <div className="bg-gradient-to-r from-teal-50 to-gray-50 border border-teal-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Propuesta Preparada Exclusivamente Para:</span>
                    <h1 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">{proposal.companyName}</h1>
                    <div className="text-xs text-gray-600 font-medium mt-0.5">
                      {proposal.companyNit && <span>NIT: {proposal.companyNit} • </span>}
                      {clientEmail && <span>Correo: {clientEmail} • </span>}
                      <span>Sector: {proposal.sector}</span>
                      <span> • Alcance: {proposal.employeeCount} trabajadores</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Consultor Líder Asignado:</span>
                    <div className="text-xs font-bold text-gray-900">{proposal.ambassadorData.name}</div>
                    {proposal.ambassadorData.phone && (
                      <div className="text-[11px] text-teal-700 font-semibold">{proposal.ambassadorData.phone}</div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-snug">
                    {proposal.title}
                  </h2>
                </div>

                {/* Section 1: Executive Summary & Sector Diagnosis */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-teal-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-1">
                    <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                    <span>1. Resumen Ejecutivo y Diagnóstico Sectorial</span>
                  </h3>
                  <div 
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    className="text-xs text-gray-700 leading-relaxed space-y-2 bg-gray-50/70 p-4 rounded-xl border border-gray-100"
                  >
                    <p className="font-medium text-gray-900">{proposal.executiveSummary}</p>
                    <p className="text-gray-600"><strong>Diagnóstico para el sector {proposal.sector}:</strong> {proposal.sectorDiagnosis}</p>
                  </div>
                </div>

                {/* Section 2: Included Modules & AI Agents */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-teal-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-1">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    <span>2. Ecosistema de Agentes y Alcance Tecnológico Incluido</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {proposal.includedModules.map((mod, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-xs space-y-1.5">
                        <div className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>{mod.title}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">{mod.description}</p>
                        <div className="text-[10px] font-bold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded inline-block">
                          ✓ {mod.benefits}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Investment Table & Pricing */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-teal-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-1">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                    <span>3. Propuesta Económica y Opciones de Inversión</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {proposal.investmentPlans.map((plan, idx) => (
                      <div 
                        key={idx}
                        className={`rounded-xl border p-4 flex flex-col justify-between relative ${
                          plan.isRecommended 
                            ? 'border-teal-600 bg-teal-50/30 shadow-md ring-1 ring-teal-600' 
                            : 'border-gray-200 bg-white shadow-xs'
                        }`}
                      >
                        {plan.isRecommended && (
                          <div className="absolute -top-2.5 right-3 bg-teal-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                            Más Recomendado
                          </div>
                        )}

                        <div>
                          <div className="font-extrabold text-sm text-gray-900">{plan.planName}</div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase">{plan.interval}</div>

                          <div className="my-3">
                            {plan.discountPercentage > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 line-through">
                                <span>${plan.regularPrice.toLocaleString('es-CO')} COP</span>
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-md no-underline">
                                  {plan.discountPercentage}% OFF
                                </span>
                              </div>
                            )}
                            <div className="text-xl font-black text-gray-900 tracking-tight">
                              ${plan.finalPrice.toLocaleString('es-CO')} <span className="text-xs font-bold text-gray-500">COP</span>
                            </div>
                            <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
                              Equivalente a ~${plan.pricePerMonth.toLocaleString('es-CO')} COP / mes
                            </div>
                          </div>

                          <ul className="space-y-1.5 text-[11px] text-gray-600 mb-4 border-t border-gray-100 pt-3">
                            {plan.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <a
                          href={plan.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 text-center rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors block print:hidden"
                        >
                          Activar Este Plan →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: ROI Analysis */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-teal-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                    <span>4. Retorno de Inversión (ROI Estimado para la Empresa)</span>
                  </h3>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">Ahorro de Tiempo Estimado</div>
                      <div className="text-base font-black text-emerald-950">{proposal.roiAnalysis.timeSavedHoursPerMonth}</div>
                      <div className="text-xs text-emerald-700 mt-0.5">Ahorro financiero directo: <strong>{proposal.roiAnalysis.estimatedSavingsCop}</strong></div>
                    </div>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {proposal.roiAnalysis.qualitativeBenefits.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section 5: Implementation Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-teal-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>5. Cronograma de Adopción e Implementación Inmediata</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {proposal.implementationTimeline.map((item, tIdx) => (
                      <div key={tIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1">
                        <div className="text-[10px] font-black text-teal-700 uppercase">{item.time}</div>
                        <div className="font-bold text-gray-900">{item.phase}</div>
                        <div className="text-[11px] text-gray-600">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 6: Terms & Signature */}
                <div className="border-t-2 border-gray-200 pt-5 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Términos y Condiciones Comerciales:</h4>
                    <ul className="text-[10px] text-gray-600 space-y-1 list-disc list-inside">
                      {proposal.termsAndConditions.map((tc, tcIdx) => (
                        <li key={tcIdx}>{tc}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs text-gray-700 font-medium italic bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                    "{proposal.closingMessage}"
                  </div>

                  {/* Signature Box */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="font-black text-xs text-gray-900">{proposal.ambassadorData.name}</div>
                      <div className="text-[11px] text-teal-700 font-bold">Consultor Líder & Embajador Comercial WAPPY IA</div>
                      <div className="text-[10px] text-gray-500">
                        {proposal.ambassadorData.phone && `WhatsApp: ${proposal.ambassadorData.phone} • `}
                        {proposal.ambassadorData.email}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-bold text-gray-500">WAPPY IA — TECNOLOGÍA APLICADA A SST</div>
                      <div className="text-[10px] text-teal-700 font-mono font-bold">wappy.club / wappy-ia.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white dark:bg-gray-900 border border-border-medium/40 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center justify-center min-h-[520px] space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base sm:text-lg font-black text-text-primary">
                  Configura los Datos de tu Cliente
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Ingresa el nombre de la empresa, NIT y sector en el panel izquierdo. Al hacer clic en <strong>Generar Propuesta con IA</strong>, Gemini 3.5 construirá un documento comercial completo con diagnóstico sectorial, catálogo de agentes, tablas de inversión y cálculo de ROI listo para descargar en PDF.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
