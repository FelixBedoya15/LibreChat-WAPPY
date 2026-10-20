import React, { useState, useRef } from 'react';
import {
  Compass,
  Users,
  Target,
  Plus,
  Trash2,
  Save,
  Hammer,
  Building2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Layers,
  Globe,
  Sparkles,
  Shield,
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

interface DofaItem {
  id: string;
  type: 'fortaleza' | 'debilidad' | 'oportunidad' | 'amenaza';
  description: string;
  source: 'interno' | 'externo';
}

interface StakeholderItem {
  id: string;
  parte: string;
  necesidades: string;
  expectativas: string;
  requisito: string;
  control: string;
}

const INITIAL_DOFA: DofaItem[] = [
  { id: '1', type: 'fortaleza', description: 'Compromiso directo de la gerencia general con asignación presupuestal para el SG-SST', source: 'interno' },
  { id: '2', type: 'fortaleza', description: 'COPASST y Comité de Convivencia con reuniones mensuales y actas al día', source: 'interno' },
  { id: '3', type: 'debilidad', description: 'Resistencia inicial de algunos operarios al auto-reporte oportuno de condiciones inseguras', source: 'interno' },
  { id: '4', type: 'debilidad', description: 'Rotación de trabajadores en temporadas pico que exige reinducciones frecuentes', source: 'interno' },
  { id: '5', type: 'oportunidad', description: 'Adopción de la suite digital WAPPY con inteligencia artificial predictiva para control de riesgos', source: 'externo' },
  { id: '6', type: 'oportunidad', description: 'Articulación con programas de bienestar de las Cajas de Compensación y ARL', source: 'externo' },
  { id: '7', type: 'amenaza', description: 'Variabilidad climática extrema que eleva el riesgo de incidentes en traslados viales', source: 'externo' },
  { id: '8', type: 'amenaza', description: 'Cambios normativos frecuentes y exigencias regulatorias crecientes del Ministerio del Trabajo', source: 'externo' },
];

const INITIAL_STAKEHOLDERS: StakeholderItem[] = [
  {
    id: '1',
    parte: 'Trabajadores Directos y Operativos',
    necesidades: 'Instalaciones ergonómicas, EPP homologados, inducción periódica y protección a la salud.',
    expectativas: 'Cero accidentes laborales graves, clima laboral respetuoso y estabilidad.',
    requisito: 'Código Sustantivo del Trabajo, Dec. 1072/2015, Res. 0312/2019.',
    control: 'COPASST, matriz IPEVAR participativa, exámenes médicos ocupacionales y auto-reportes.'
  },
  {
    id: '2',
    parte: 'Contratistas, Subcontratistas y Proveedores',
    necesidades: 'Directrices claras de ingreso a planta, inducción técnica SST y protocolos de emergencia.',
    expectativas: 'Trato equitativo, seguridad en áreas compartidas y agilidad en radicación.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.28, Res. 0312 Estándar 2.11.1.',
    control: 'Control y auditoría de planillas PILA, permisos de trabajo ATS y coordinación técnica.'
  },
  {
    id: '3',
    parte: 'Alta Dirección y Accionistas',
    necesidades: 'Continuidad operativa, mitigación de pasivos jurídicos y cumplimiento integral de estándares.',
    expectativas: 'Eficiencia presupuestal, reducción de pérdidas por ausentismo y prestigio de marca.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.8, ISO 45001:2018 Cláusula 5.1.',
    control: 'Revisión anual por la dirección, informes predictivos de siniestralidad e indicadores ATEL.'
  },
  {
    id: '4',
    parte: 'ARL & Ministerio del Trabajo',
    necesidades: 'Reporte oportuno de accidentes graves y mortales (FURAT), plan de trabajo y autoevaluación 0312.',
    expectativas: 'Planes de mejoramiento efectivos con cierre de brechas y cumplimiento estricto.',
    requisito: 'Ley 1562/2012, Dec. 1072/2015, Res. 0312/2019.',
    control: 'Radicación de estándares mínimos en el fondo de riesgos, auditorías y acompañamiento técnico.'
  },
  {
    id: '5',
    parte: 'Comunidad Vecina y Autoridades Locales',
    necesidades: 'Prevención de conatos, fugas o contingencias industriales que trasciendan el predio.',
    expectativas: 'Información transparente ante emergencias y canales de diálogo comunitario.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.25 (PPRE), Ley 1523/2012 (Gestión del Riesgo).',
    control: 'Plan de emergencias, brigada capacitada, simulacros anuales y coordinación con bomberos.'
  }
];

export const ContextoPartesInteresadasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [activeTab, setActiveTab] = useState<'dofa' | 'partes'>('dofa');
  const [dofaList, setDofaList] = useState<DofaItem[]>(INITIAL_DOFA);
  const [stakeholders, setStakeholders] = useState<StakeholderItem[]>(INITIAL_STAKEHOLDERS);

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Formulario nuevo factor DOFA
  const [newDofaType, setNewDofaType] = useState<'fortaleza' | 'debilidad' | 'oportunidad' | 'amenaza'>('oportunidad');
  const [newDofaDesc, setNewDofaDesc] = useState('');

  // Formulario nueva parte interesada
  const [newParte, setNewParte] = useState('');
  const [newNecesidades, setNewNecesidades] = useState('');
  const [newExpectativas, setNewExpectativas] = useState('');
  const [newRequisito, setNewRequisito] = useState('');
  const [newControl, setNewControl] = useState('');

  const handleAddDofa = () => {
    if (!newDofaDesc.trim()) {
      showToast({ message: 'Escribe la descripción del factor DOFA.', status: 'warning' });
      return;
    }
    const source: 'interno' | 'externo' = (newDofaType === 'fortaleza' || newDofaType === 'debilidad') ? 'interno' : 'externo';
    const newItem: DofaItem = {
      id: Date.now().toString(),
      type: newDofaType,
      description: newDofaDesc.trim(),
      source
    };
    setDofaList(prev => [newItem, ...prev]);
    setNewDofaDesc('');
    showToast({ message: 'Factor agregado a la Matriz DOFA de SST.', status: 'success' });
  };

  const handleDeleteDofa = (id: string) => {
    setDofaList(prev => prev.filter(item => item.id !== id));
  };

  const handleAddStakeholder = () => {
    if (!newParte.trim() || !newNecesidades.trim()) {
      showToast({ message: 'Indica al menos la parte interesada y sus necesidades.', status: 'warning' });
      return;
    }
    const newItem: StakeholderItem = {
      id: Date.now().toString(),
      parte: newParte.trim(),
      necesidades: newNecesidades.trim(),
      expectativas: newExpectativas.trim() || 'Cumplimiento de compromisos y estándares de SST.',
      requisito: newRequisito.trim() || 'ISO 45001:2018 Cláusula 4.2 y Dec. 1072/2015',
      control: newControl.trim() || 'Seguimiento en comités y auditorías periódicas'
    };
    setStakeholders(prev => [newItem, ...prev]);
    setNewParte('');
    setNewNecesidades('');
    setNewExpectativas('');
    setNewRequisito('');
    setNewControl('');
    showToast({ message: 'Parte interesada registrada con éxito.', status: 'success' });
  };

  const handleDeleteStakeholder = (id: string) => {
    setStakeholders(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    try {
      localStorage.setItem('wappy_iso45001_dofa', JSON.stringify(dofaList));
      localStorage.setItem('wappy_iso45001_stakeholders', JSON.stringify(stakeholders));
      showToast({ message: 'Contexto y partes interesadas guardados localmente.', status: 'success' });
    } catch {
      showToast({ message: 'No se pudo guardar la información localmente.', status: 'error' });
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const fortalezas = dofaList.filter(d => d.type === 'fortaleza').map(d => `<li>${d.description}</li>`).join('');
      const debilidades = dofaList.filter(d => d.type === 'debilidad').map(d => `<li>${d.description}</li>`).join('');
      const oportunidades = dofaList.filter(d => d.type === 'oportunidad').map(d => `<li>${d.description}</li>`).join('');
      const amenazas = dofaList.filter(d => d.type === 'amenaza').map(d => `<li>${d.description}</li>`).join('');

      const stakeholderRows = stakeholders.map(s => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${s.parte}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${s.necesidades}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${s.expectativas}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${s.requisito}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${s.control}</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            ESTUDIO DEL CONTEXTO ORGANIZACIONAL Y PARTES INTERESADAS DEL SG-SST
          </h1>
          <p><strong>Normativa Técnica Internacional:</strong> ISO 45001:2018 Cláusulas 4.1 y 4.2</p>
          <p><strong>Alineación Jurídica Nacional:</strong> Resolución 0312 de 2019 Estándar 2.1.1 · Decreto 1072 de 2015 Art. 2.2.4.6.8</p>
          <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2 style="color: #0f766e; margin-top: 24px;">1. Comprensión de la Organización y su Contexto (Cláusula 4.1)</h2>
          <p>La organización ha determinado los factores externos e internos pertinentes para su propósito y que afectan su capacidad para alcanzar los resultados previstos de su sistema de gestión de la SST.</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 8px; width: 50%; border: 1px solid #0f766e;">Factores Internos Positivos (Fortalezas)</th>
                <th style="padding: 8px; width: 50%; border: 1px solid #0f766e;">Factores Externos Positivos (Oportunidades)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #cbd5e1; vertical-align: top;"><ul>${fortalezas || '<li>No se registraron fortalezas</li>'}</ul></td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; vertical-align: top;"><ul>${oportunidades || '<li>No se registraron oportunidades</li>'}</ul></td>
              </tr>
              <tr style="background-color: #e2e8f0; font-weight: bold;">
                <th style="padding: 8px; border: 1px solid #cbd5e1; color: #991b1b;">Factores Internos a Mitigar (Debilidades)</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; color: #991b1b;">Factores Externos a Mitigar (Amenazas)</th>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #cbd5e1; vertical-align: top;"><ul>${debilidades || '<li>No se registraron debilidades</li>'}</ul></td>
                <td style="padding: 12px; border: 1px solid #cbd5e1; vertical-align: top;"><ul>${amenazas || '<li>No se registraron amenazas</li>'}</ul></td>
              </tr>
            </tbody>
          </table>

          <h2 style="color: #0f766e; margin-top: 28px;">2. Matriz de Partes Interesadas y Requisitos de SST (Cláusula 4.2)</h2>
          <p>Se identificaron las partes interesadas pertinentes para el SG-SST, analizando sus necesidades (requisitos obligatorios) y expectativas (aspiraciones), vinculándolas a los mecanismos de control del sistema.</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 8px; border: 1px solid #0f766e;">Parte Interesada</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Necesidades (Obligatorias)</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Expectativas</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Marco Jurídico / Vinculante</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Mecanismo de Control y Seguimiento</th>
              </tr>
            </thead>
            <tbody>
              ${stakeholderRows}
            </tbody>
          </table>

          <h2 style="color: #0f766e; margin-top: 28px;">3. Compromiso y Plan de Acción de Gobernanza</h2>
          <p>El presente análisis de contexto y partes interesadas es insumo mandatorio para la formulación de los Objetivos de SST (Num. 6.2), la asignación de recursos y la actualización de la Matriz de Requisitos Legales y de Peligros IPEVAR.</p>
        </div>
      `;
      setGeneratedReport(html);
      editorContentRef.current = html;
      showToast({ message: 'Informe de Contexto y Partes Interesadas generado exitosamente.', status: 'success' });
    } catch {
      showToast({ message: 'Error al compilar el informe con IA.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  useAutoLoadReport({
    token,
    tags: ['sgsst-contexto-partes-interesadas'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER PRINCIPAL CONTEXTO & PARTES INTERESADAS (WAPPY DESIGN SYSTEM) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/20">
              <Compass className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Contexto y Partes Interesadas (DOFA / Stakeholders)
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${dofaList.length} Factores DOFA Registrados`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {dofaList.length} Factores DOFA
                    </span>
                  </div>
                </div>

                <div
                  title={`${stakeholders.length} Partes Interesadas Identificadas`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {stakeholders.length} Partes Interesadas
                    </span>
                  </div>
                </div>

                {/* ISO 45001 Num. 4.1 / 4.2 · Res. 0312 Est. 2.1.1: CUMPLE */}
                <SGSSTLegalBadge
                  standardCode="4.1"
                  label="ISO 45001 Num. 4.1 / 4.2 · Res. 0312 Est. 2.1.1: CUMPLE"
                  tooltip="ISO 45001:2018 Cláusulas 4.1 y 4.2 (Contexto de la Organización y Partes Interesadas) · Res. 0312/2019 Est. 2.1.1 y Dec. 1072/15 Art. 2.2.4.6.8"
                  moduleName="Contexto y Partes Interesadas"
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
            Módulo en Construcción (Fase Beta · Vista Previa Operativa ISO 45001)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            Este aplicativo implementa la estructura requerida por las <strong>Cláusulas 4.1 y 4.2 de la norma internacional ISO 45001:2018</strong>.
            Puedes registrar factores del entorno interno/externo, clasificar expectativas de los grupos de interés y compilar el documento auditable con el motor de IA.
          </p>
        </div>
      </div>

      {/* ─── TABS DE NAVEGACIÓN INTERNA (DOFA vs PARTES INTERESADAS) ─── */}
      <div className="flex items-center gap-2 border-b border-border-light dark:border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('dofa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'dofa'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-text-secondary hover:bg-surface-secondary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matriz DOFA / PESTEL SST (Cláusula 4.1)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-extrabold">
            {dofaList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('partes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'partes'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-text-secondary hover:bg-surface-secondary'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Partes Interesadas & Stakeholders (Cláusula 4.2)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-extrabold">
            {stakeholders.length}
          </span>
        </button>
      </div>

      {/* ─── CONTENIDO TAB 1: DOFA / PESTEL ─── */}
      {activeTab === 'dofa' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fortalezas */}
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Fortalezas (Internas)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {dofaList.filter(d => d.type === 'fortaleza').length}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-text-primary">
                {dofaList.filter(d => d.type === 'fortaleza').map(d => (
                  <li key={d.id} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-surface-primary/70 border border-emerald-500/20">
                    <span>{d.description}</span>
                    <button onClick={() => handleDeleteDofa(d.id)} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Oportunidades */}
            <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/[0.03]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Oportunidades (Externas)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300">
                  {dofaList.filter(d => d.type === 'oportunidad').length}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-text-primary">
                {dofaList.filter(d => d.type === 'oportunidad').map(d => (
                  <li key={d.id} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-surface-primary/70 border border-sky-500/20">
                    <span>{d.description}</span>
                    <button onClick={() => handleDeleteDofa(d.id)} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Debilidades */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.03]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Debilidades (Internas)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {dofaList.filter(d => d.type === 'debilidad').length}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-text-primary">
                {dofaList.filter(d => d.type === 'debilidad').map(d => (
                  <li key={d.id} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-surface-primary/70 border border-amber-500/20">
                    <span>{d.description}</span>
                    <button onClick={() => handleDeleteDofa(d.id)} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Amenazas */}
            <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/[0.03]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> Amenazas (Externas)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300">
                  {dofaList.filter(d => d.type === 'amenaza').length}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-text-primary">
                {dofaList.filter(d => d.type === 'amenaza').map(d => (
                  <li key={d.id} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-surface-primary/70 border border-red-500/20">
                    <span>{d.description}</span>
                    <button onClick={() => handleDeleteDofa(d.id)} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Formulario para agregar factor DOFA */}
          <div className="p-4 rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/50 flex flex-col sm:flex-row items-center gap-3">
            <select
              value={newDofaType}
              onChange={(e) => setNewDofaType(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
            >
              <option value="fortaleza">Fortaleza (Interna)</option>
              <option value="oportunidad">Oportunidad (Externa)</option>
              <option value="debilidad">Debilidad (Interna)</option>
              <option value="amenaza">Amenaza (Externa)</option>
            </select>

            <input
              type="text"
              placeholder="Describe el factor estratégico de SST..."
              value={newDofaDesc}
              onChange={(e) => setNewDofaDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDofa()}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
            />

            <ExpandingButton
              onClick={handleAddDofa}
              icon={Plus}
              label="Añadir Factor"
              variant="teal"
            />
          </div>
        </div>
      )}

      {/* ─── CONTENIDO TAB 2: PARTES INTERESADAS ─── */}
      {activeTab === 'partes' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Parte Interesada</th>
                  <th className="p-3">Necesidades (Obligatorias)</th>
                  <th className="p-3">Expectativas</th>
                  <th className="p-3">Requisito Legal</th>
                  <th className="p-3">Mecanismo de Control</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5 bg-surface-primary/40">
                {stakeholders.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="p-3 font-bold text-text-primary">{s.parte}</td>
                    <td className="p-3 text-text-secondary max-w-xs">{s.necesidades}</td>
                    <td className="p-3 text-text-secondary max-w-xs">{s.expectativas}</td>
                    <td className="p-3 text-teal-600 dark:text-teal-400 font-medium">{s.requisito}</td>
                    <td className="p-3 text-text-secondary">{s.control}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteStakeholder(s.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulario para agregar parte interesada */}
          <div className="p-4 rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/50 space-y-3">
            <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-teal-500" /> Registrar Nueva Parte Interesada
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              <input
                type="text"
                placeholder="Parte Interesada (ej: Clientes)"
                value={newParte}
                onChange={(e) => setNewParte(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="text"
                placeholder="Necesidades obligatorias..."
                value={newNecesidades}
                onChange={(e) => setNewNecesidades(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="text"
                placeholder="Expectativas..."
                value={newExpectativas}
                onChange={(e) => setNewExpectativas(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="text"
                placeholder="Requisito legal/norma..."
                value={newRequisito}
                onChange={(e) => setNewRequisito(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="text"
                placeholder="Mecanismo de control..."
                value={newControl}
                onChange={(e) => setNewControl(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>
            <div className="flex justify-end pt-1">
              <ExpandingButton
                onClick={handleAddStakeholder}
                icon={Plus}
                label="Guardar Parte Interesada"
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
        exportFileName={`Contexto_Partes_Interesadas_ISO45001_${Date.now()}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Informe Técnico de Contexto y Partes Interesadas (ISO 45001:2018 Cláusulas 4.1 y 4.2)"
        icon={<Compass className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Contexto_y_Partes_Interesadas_ISO45001"
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
            reportSourceData={{ dofaList, stakeholders }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default ContextoPartesInteresadasWorkspace;
