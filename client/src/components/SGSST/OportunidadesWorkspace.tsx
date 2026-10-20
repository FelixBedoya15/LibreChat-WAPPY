import React, { useState, useRef } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Hammer,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Lightbulb,
  FileText
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExpandingButton from './ExpandingButton';
import { useAutoLoadReport } from './useAutoLoadReport';

interface OportunidadItem {
  id: string;
  titulo: string;
  categoria: 'Tecnológica / IA' | 'Ergonómica / Locativa' | 'Cultura / Psicosocial' | 'Procesos / Eficiencia';
  beneficioEsperado: string;
  recursosRequeridos: string;
  responsable: string;
  estado: 'Identificada' | 'En Plan de Acción' | 'Implementada';
}

interface RiesgoSistemaItem {
  id: string;
  amenaza: string;
  impactoSistema: 'Alto' | 'Medio' | 'Bajo';
  probabilidad: 'Alta' | 'Media' | 'Baja';
  medidaMitigacion: string;
  responsableMonitoreo: string;
}

const INITIAL_OPORTUNIDADES: OportunidadItem[] = [
  {
    id: '1',
    titulo: 'Despliegue de Analítica Predictiva con Inteligencia Artificial WAPPY',
    categoria: 'Tecnológica / IA',
    beneficioEsperado: 'Pronóstico anticipado de accidentalidad a 30 y 90 días, reduciendo incidentes en al menos 35%.',
    recursosRequeridos: 'Suscripción WAPPY Pro, inducción al equipo y conexión de datos históricos.',
    responsable: 'Gerencia General y Responsable SG-SST',
    estado: 'En Plan de Acción'
  },
  {
    id: '2',
    titulo: 'Capacitación Asincrónica en Micro-cápsulas móviles (WAPPY LMS)',
    categoria: 'Cultura / Psicosocial',
    beneficioEsperado: 'Elevar la cobertura de inducción y capacitación del 60% al 98% sin frenar la producción.',
    recursosRequeridos: 'Módulo de Rutas de Aprendizaje y banco de quizzes interactivos.',
    responsable: 'Gestión del Talento Humano',
    estado: 'Implementada'
  },
  {
    id: '3',
    titulo: 'Sustitución de Herramientas Neumáticas Pesadas por Eléctricas Ergonómicas',
    categoria: 'Ergonómica / Locativa',
    beneficioEsperado: 'Mitigación de desórdenes musculoesqueléticos (DME) por vibración y sobreesfuerzo en extremidades.',
    recursosRequeridos: 'Partida presupuestal de reposición de herramientas en taller.',
    responsable: 'Jefe de Mantenimiento',
    estado: 'Identificada'
  }
];

const INITIAL_RIESGOS_SISTEMA: RiesgoSistemaItem[] = [
  {
    id: '1',
    amenaza: 'Rotación imprevista del líder de SST con licencia y pérdida de trazabilidad documental',
    impactoSistema: 'Alto',
    probabilidad: 'Media',
    medidaMitigacion: 'Custodia digital en la nube WAPPY con accesos delegados y perfil de reemplazo estandarizado.',
    responsableMonitoreo: 'Gerencia General'
  },
  {
    id: '2',
    amenaza: 'Picos estacionales de producción que generen ausentismo en comités COPASST y brigada',
    impactoSistema: 'Medio',
    probabilidad: 'Alta',
    medidaMitigacion: 'Reuniones híbridas de 30 minutos con firma electrónica de actas y suplentes activos.',
    responsableMonitoreo: 'Presidente COPASST'
  },
  {
    id: '3',
    amenaza: 'Incumplimiento de contratistas en la notificación inmediata de incidentes de trabajo',
    impactoSistema: 'Alto',
    probabilidad: 'Baja',
    medidaMitigacion: 'Cláusula contractual sancionatoria, retención de factura y código QR de reporte en portería.',
    responsableMonitoreo: 'Coordinador de Contratistas'
  }
];

export const OportunidadesWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [activeTab, setActiveTab] = useState<'oportunidades' | 'riesgos'>('oportunidades');
  const [oportunidades, setOportunidades] = useState<OportunidadItem[]>(INITIAL_OPORTUNIDADES);
  const [riesgosSistema, setRiesgosSistema] = useState<RiesgoSistemaItem[]>(INITIAL_RIESGOS_SISTEMA);

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Formulario nueva oportunidad
  const [newOportTitulo, setNewOportTitulo] = useState('');
  const [newOportCat, setNewOportCat] = useState<OportunidadItem['categoria']>('Tecnológica / IA');
  const [newOportBeneficio, setNewOportBeneficio] = useState('');
  const [newOportResponsable, setNewOportResponsable] = useState('');

  // Formulario nuevo riesgo del sistema
  const [newRiesgoAmenaza, setNewRiesgoAmenaza] = useState('');
  const [newRiesgoImpacto, setNewRiesgoImpacto] = useState<RiesgoSistemaItem['impactoSistema']>('Alto');
  const [newRiesgoProb, setNewRiesgoProb] = useState<RiesgoSistemaItem['probabilidad']>('Media');
  const [newRiesgoMitigacion, setNewRiesgoMitigacion] = useState('');

  const handleAddOportunidad = () => {
    if (!newOportTitulo.trim() || !newOportBeneficio.trim()) {
      showToast({ message: 'Indica el título de la oportunidad y su beneficio esperado.', status: 'warning' });
      return;
    }

    const newItem: OportunidadItem = {
      id: Date.now().toString(),
      titulo: newOportTitulo.trim(),
      categoria: newOportCat,
      beneficioEsperado: newOportBeneficio.trim(),
      recursosRequeridos: 'Aprobación técnica y presupuesto de mejora',
      responsable: newOportResponsable.trim() || 'Líder SG-SST',
      estado: 'Identificada'
    };

    setOportunidades(prev => [newItem, ...prev]);
    setNewOportTitulo('');
    setNewOportBeneficio('');
    setNewOportResponsable('');
    showToast({ message: 'Oportunidad de SST registrada.', status: 'success' });
  };

  const handleAddRiesgo = () => {
    if (!newRiesgoAmenaza.trim() || !newRiesgoMitigacion.trim()) {
      showToast({ message: 'Indica la amenaza para el sistema y su medida preventiva.', status: 'warning' });
      return;
    }

    const newItem: RiesgoSistemaItem = {
      id: Date.now().toString(),
      amenaza: newRiesgoAmenaza.trim(),
      impactoSistema: newRiesgoImpacto,
      probabilidad: newRiesgoProb,
      medidaMitigacion: newRiesgoMitigacion.trim(),
      responsableMonitoreo: 'Gerencia y Responsable SG-SST'
    };

    setRiesgosSistema(prev => [newItem, ...prev]);
    setNewRiesgoAmenaza('');
    setNewRiesgoMitigacion('');
    showToast({ message: 'Riesgo del sistema registrado.', status: 'success' });
  };

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    try {
      localStorage.setItem('wappy_iso45001_oportunidades', JSON.stringify(oportunidades));
      localStorage.setItem('wappy_iso45001_riesgos_sistema', JSON.stringify(riesgosSistema));
      showToast({ message: 'Oportunidades y riesgos del sistema guardados localmente.', status: 'success' });
    } catch {
      showToast({ message: 'Error al guardar los datos en almacenamiento local.', status: 'error' });
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const oportRows = oportunidades.map(o => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${o.titulo}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${o.categoria}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${o.beneficioEsperado}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${o.responsable}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold;">${o.estado}</td>
        </tr>
      `).join('');

      const riesgoRows = riesgosSistema.map(r => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 500;">${r.amenaza}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold; color: ${r.impactoSistema === 'Alto' ? '#b91c1c' : '#b45309'};">${r.impactoSistema}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center;">${r.probabilidad}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #047857;">${r.medidaMitigacion}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${r.responsableMonitoreo}</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            MATRIZ DE RIESGOS PARA EL SG-SST Y OPORTUNIDADES DE MEJORA
          </h1>
          <p><strong>Normativa Técnica Internacional:</strong> ISO 45001:2018 Cláusulas 6.1.1 y 6.1.2.3</p>
          <p><strong>Alineación Jurídica Nacional:</strong> Decreto 1072 de 2015 Art. 2.2.4.6.8 · Resolución 0312 de 2019 Estándar 2.4.1</p>
          <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2 style="color: #0f766e; margin-top: 24px;">1. Evaluación de Oportunidades para la SST (Cláusula 6.1.2.3)</h2>
          <p>Oportunidades planificadas para adaptar el trabajo a los trabajadores, eliminar tareas monótonas y aprovechar tecnologías innovadoras para elevar los estándares de protección.</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 8px; border: 1px solid #0f766e;">Iniciativa / Oportunidad</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Categoría</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Beneficio Esperado</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Líder Asignado</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${oportRows}
            </tbody>
          </table>

          <h2 style="color: #0f766e; margin-top: 28px;">2. Riesgos para el Éxito del Sistema de Gestión (Cláusula 6.1.1)</h2>
          <p>Identificación de contingencias operacionales, presupuestales o humanas que podrían impedir que el SG-SST alcance sus metas anuales, estableciendo controles preventivos de salvaguarda.</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 8px; border: 1px solid #0f766e;">Amenaza al SG-SST</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Impacto</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Probabilidad</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Medida Preventiva de Mitigación</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Responsable</th>
              </tr>
            </thead>
            <tbody>
              ${riesgoRows}
            </tbody>
          </table>
        </div>
      `;
      setGeneratedReport(html);
      editorContentRef.current = html;
      showToast({ message: 'Matriz de Oportunidades y Riesgos del Sistema generada.', status: 'success' });
    } catch {
      showToast({ message: 'Error al compilar el informe con IA.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  useAutoLoadReport({
    token,
    tags: ['sgsst-oportunidades'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER PRINCIPAL OPORTUNIDADES (WAPPY DESIGN SYSTEM) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-500 text-white shadow-lg shadow-teal-500/20">
              <Sparkles className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Riesgos del Sistema y Oportunidades de SST
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${oportunidades.length} Oportunidades de Mejora SST`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {oportunidades.length} Oportunidades SST
                    </span>
                  </div>
                </div>

                <div
                  title={`${riesgosSistema.length} Riesgos para el Sistema Evaluados`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-amber-500/30 bg-surface-primary text-amber-700 dark:text-amber-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {riesgosSistema.length} Riesgos del SG-SST
                    </span>
                  </div>
                </div>

                {/* ISO 45001 Num. 6.1.1 / 6.1.2.3 · Res. 0312 Est. 2.4.1: CUMPLE */}
                <SGSSTLegalBadge
                  standardCode="oportunidades"
                  label="ISO 45001 Num. 6.1.1 / 6.1.2.3 · Res. 0312 Est. 2.4.1: CUMPLE"
                  tooltip="ISO 45001:2018 Cláusulas 6.1.1 y 6.1.2.3 (Evaluación de oportunidades de SST y riesgos del sistema) · Res. 0312/2019 Estándar 2.4.1 y Dec. 1072/15 Art. 2.2.4.6.8"
                  moduleName="Riesgos del Sistema y Oportunidades SST"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={handleGenerate}
              icon={Sparkles}
              label="Compilar con IA"
              variant="teal"
              isLoading={isGenerating}
            />
            <ExpandingButton
              onClick={handleSaveLocal}
              icon={Save}
              label="Guardar Datos"
              variant="outline-teal"
              isLoading={isSavingLocal}
            />
          </div>
        </div>
      </div>

      {/* ─── BANNER ELEGANTE EN CONSTRUCCIÓN / VISTA PREVIA ACTIVA ─── */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 flex items-start sm:items-center gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          <Hammer className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Módulo en Construcción (Fase Beta · Planificación de Oportunidades ISO 45001)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            Este aplicativo materializa las directrices de las <strong>Cláusulas 6.1.1 y 6.1.2.3 de ISO 45001:2018</strong>.
            Permite proyectar mejoras proactivas e innovaciones en SST (digitalización, ergonomía, bienestar) y anticipar riesgos estratégicos que pongan en peligro los objetivos del sistema de gestión.
          </p>
        </div>
      </div>

      {/* ─── TABS DE NAVEGACIÓN INTERNA (OPORTUNIDADES vs RIESGOS DEL SISTEMA) ─── */}
      <div className="flex items-center gap-2 border-b border-border-light dark:border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('oportunidades')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'oportunidades'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-text-secondary hover:bg-surface-secondary'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Oportunidades de SST (Cláusula 6.1.2.3)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-extrabold">
            {oportunidades.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('riesgos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'riesgos'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-text-secondary hover:bg-surface-secondary'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Riesgos del Sistema de Gestión (Cláusula 6.1.1)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
            {riesgosSistema.length}
          </span>
        </button>
      </div>

      {/* ─── CONTENIDO TAB 1: OPORTUNIDADES ─── */}
      {activeTab === 'oportunidades' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Oportunidad / Iniciativa</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Beneficio Esperado</th>
                  <th className="p-3">Responsable</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5 bg-surface-primary/40">
                {oportunidades.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="p-3 font-bold text-text-primary max-w-xs">{o.titulo}</td>
                    <td className="p-3 text-text-secondary text-[11px]">{o.categoria}</td>
                    <td className="p-3 text-text-secondary max-w-md text-[11px]">{o.beneficioEsperado}</td>
                    <td className="p-3 text-text-secondary text-[11px]">{o.responsable}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.estado === 'Implementada'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : o.estado === 'En Plan de Acción'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {o.estado}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setOportunidades(prev => prev.filter(x => x.id !== o.id))}
                        className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                        title="Eliminar oportunidad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulario nueva oportunidad */}
          <div className="p-4 rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/50 space-y-3">
            <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-teal-500" /> Registrar Nueva Oportunidad de SST
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Denominación de la oportunidad (ej: Automatización de inspecciones)..."
                  value={newOportTitulo}
                  onChange={(e) => setNewOportTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                />
              </div>

              <div>
                <select
                  value={newOportCat}
                  onChange={(e) => setNewOportCat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                >
                  <option value="Tecnológica / IA">Tecnológica / IA</option>
                  <option value="Ergonómica / Locativa">Ergonómica / Locativa</option>
                  <option value="Cultura / Psicosocial">Cultura / Psicosocial</option>
                  <option value="Procesos / Eficiencia">Procesos / Eficiencia</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Responsable..."
                  value={newOportResponsable}
                  onChange={(e) => setNewOportResponsable(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Beneficio cuantificable esperado en prevención y bienestar..."
                value={newOportBeneficio}
                onChange={(e) => setNewOportBeneficio(e.target.value)}
                className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <ExpandingButton
                onClick={handleAddOportunidad}
                icon={Plus}
                label="Añadir Oportunidad"
                variant="teal"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENIDO TAB 2: RIESGOS DEL SISTEMA DE GESTIÓN ─── */}
      {activeTab === 'riesgos' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Amenaza al Éxito del SG-SST</th>
                  <th className="p-3 text-center">Impacto</th>
                  <th className="p-3 text-center">Probabilidad</th>
                  <th className="p-3">Medida Preventiva de Mitigación</th>
                  <th className="p-3">Responsable</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5 bg-surface-primary/40">
                {riesgosSistema.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="p-3 font-bold text-text-primary max-w-xs">{r.amenaza}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.impactoSistema === 'Alto'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {r.impactoSistema}
                      </span>
                    </td>
                    <td className="p-3 text-center text-text-secondary font-medium">{r.probabilidad}</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium max-w-md text-[11px]">{r.medidaMitigacion}</td>
                    <td className="p-3 text-text-secondary text-[11px]">{r.responsableMonitoreo}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setRiesgosSistema(prev => prev.filter(x => x.id !== r.id))}
                        className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                        title="Eliminar riesgo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulario nuevo riesgo */}
          <div className="p-4 rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/50 space-y-3">
            <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-teal-500" /> Registrar Nuevo Riesgo para el Sistema
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Amenaza que podría afectar el cumplimiento del SG-SST..."
                  value={newRiesgoAmenaza}
                  onChange={(e) => setNewRiesgoAmenaza(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newRiesgoImpacto}
                  onChange={(e) => setNewRiesgoImpacto(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                >
                  <option value="Alto">Impacto Alto</option>
                  <option value="Medio">Impacto Medio</option>
                  <option value="Bajo">Impacto Bajo</option>
                </select>

                <select
                  value={newRiesgoProb}
                  onChange={(e) => setNewRiesgoProb(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                >
                  <option value="Alta">Prob. Alta</option>
                  <option value="Media">Prob. Media</option>
                  <option value="Baja">Prob. Baja</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Medida preventiva de mitigación planificada..."
                value={newRiesgoMitigacion}
                onChange={(e) => setNewRiesgoMitigacion(e.target.value)}
                className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <ExpandingButton
                onClick={handleAddRiesgo}
                icon={Plus}
                label="Añadir Riesgo"
                variant="teal"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TOOLBAR FLOTANTE CÁPSULA WAPPY ─── */}
      <SGSSTToolbar
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onAnalyze={handleGenerate}
        isAnalyzing={isGenerating}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSaveLocal={handleSaveLocal}
        isSavingLocal={isSavingLocal}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Oportunidades_y_Riesgos_Sistema_ISO45001_${Date.now()}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Matriz de Oportunidades y Riesgos del Sistema (ISO 45001 Num. 6.1.1 y 6.1.2.3)"
        icon={<Sparkles className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Oportunidades_y_Riesgos_Sistema_ISO45001"
            reportType="general"
          />
        }
      >
        <div className="w-full min-w-0">
          <LiveEditor
            ref={liveEditorRef}
            paperMode={true}
            initialContent={generatedReport || ''}
            onUpdate={(html) => {
              editorContentRef.current = html;
            }}
            reportSourceData={{ oportunidades, riesgosSistema }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default OportunidadesWorkspace;
