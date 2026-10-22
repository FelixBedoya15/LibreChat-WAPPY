import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Compass,
  Users,
  Target,
  Plus,
  Trash2,
  Save,
  Building2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Layers,
  Globe,
  Sparkles,
  Shield,
  FileText,
  Workflow,
  Sparkle,
  ArrowRight,
  BrainCircuit,
  Pencil,
  RotateCw,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExpandingButton from './ExpandingButton';

export interface DofaItem {
  id: string;
  type: 'fortaleza' | 'debilidad' | 'oportunidad' | 'amenaza';
  description: string;
  source: 'interno' | 'externo';
  impact?: string;
  strategicAction?: string;
}

export interface StakeholderItem {
  id: string;
  parte: string;
  necesidades: string;
  expectativas: string;
  requisito: string;
  control: string;
  impactLevel?: string;
}

export interface CrossStrategies {
  fo: string[];
  do: string[];
  fa: string[];
  da: string[];
}

const INITIAL_DOFA: DofaItem[] = [
  {
    id: '1',
    type: 'fortaleza',
    description: 'Compromiso directo de la gerencia general con asignación presupuestal para el SG-SST',
    source: 'interno',
    impact: 'alto',
    strategicAction: 'Mantener rubro anual específico auditado y blindado en presupuesto corporativo.',
  },
  {
    id: '2',
    type: 'fortaleza',
    description: 'COPASST y Comité de Convivencia con reuniones mensuales y actas al día',
    source: 'interno',
    impact: 'alto',
    strategicAction: 'Publicar actas en portal digital y articular con comités de seguridad vial.',
  },
  {
    id: '3',
    type: 'debilidad',
    description: 'Resistencia inicial de algunos operarios al auto-reporte oportuno de condiciones inseguras',
    source: 'interno',
    impact: 'medio',
    strategicAction: 'Implementar incentivos de prevención y campañas de cultura justa de reporte sin represalias.',
  },
  {
    id: '4',
    type: 'debilidad',
    description: 'Rotación de trabajadores en temporadas pico que exige reinducciones frecuentes',
    source: 'interno',
    impact: 'medio',
    strategicAction: 'Estandarizar inducción digital con WAPPY LMS y evaluaciones automatizadas previas al ingreso.',
  },
  {
    id: '5',
    type: 'oportunidad',
    description: 'Adopción de la suite digital WAPPY con inteligencia artificial predictiva para control de riesgos',
    source: 'externo',
    impact: 'alto',
    strategicAction: 'Automatizar inspecciones, matrices y planes de acción con trazabilidad en la nube.',
  },
  {
    id: '6',
    type: 'oportunidad',
    description: 'Articulación con programas de bienestar de las Cajas de Compensación y ARL',
    source: 'externo',
    impact: 'medio',
    strategicAction: 'Gestionar jornadas de salud ocupacional, vacunación y medicina preventiva sin costo adicional.',
  },
  {
    id: '7',
    type: 'amenaza',
    description: 'Variabilidad climática extrema que eleva el riesgo de incidentes en traslados viales y sedes',
    source: 'externo',
    impact: 'alto',
    strategicAction: 'Actualizar plan de contingencia climática y alertas tempranas en el PESV.',
  },
  {
    id: '8',
    type: 'amenaza',
    description: 'Cambios normativos frecuentes y exigencias regulatorias crecientes del Ministerio del Trabajo',
    source: 'externo',
    impact: 'alto',
    strategicAction: 'Monitoreo normativo quincenal en Matriz Legal con alertas automáticas.',
  },
];

const INITIAL_STAKEHOLDERS: StakeholderItem[] = [
  {
    id: '1',
    parte: 'Trabajadores Directos y Operativos',
    necesidades: 'Instalaciones seguras, EPP homologados, inducción periódica y protección integral de la salud.',
    expectativas: 'Cero accidentes laborales graves, clima laboral respetuoso, estabilidad y ergonomía.',
    requisito: 'Código Sustantivo del Trabajo, Dec. 1072/2015, Res. 0312/2019 Estándar 2.1.1.',
    control: 'COPASST, matriz IPEVR participativa, exámenes médicos ocupacionales y auto-reportes.',
    impactLevel: 'alto',
  },
  {
    id: '2',
    parte: 'Contratistas, Subcontratistas y Proveedores',
    necesidades: 'Directrices claras de ingreso, inducción técnica SST y protocolos de permisos de trabajo.',
    expectativas: 'Trato equitativo, seguridad en áreas compartidas y agilidad en radicación.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.28, Res. 0312 Estándar 2.11.1.',
    control: 'Auditoría mensual de planillas PILA, permisos ATS y coordinación de actividades en sitio.',
    impactLevel: 'alto',
  },
  {
    id: '3',
    parte: 'Alta Dirección y Socios',
    necesidades: 'Continuidad operativa, mitigación de pasivos jurídicos y cumplimiento integral de estándares.',
    expectativas: 'Eficiencia presupuestal, reducción de siniestralidad ATEL y blindaje reputacional.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.8, ISO 45001:2018 Cláusula 5.1.',
    control: 'Revisión anual por la dirección, informes predictivos de siniestralidad y balance de gestión.',
    impactLevel: 'alto',
  },
  {
    id: '4',
    parte: 'ARL & Ministerio del Trabajo',
    necesidades: 'Reporte oportuno de accidentes graves (FURAT), plan de trabajo y autoevaluación 0312.',
    expectativas: 'Planes de mejoramiento efectivos con cierre oportuno de no conformidades.',
    requisito: 'Ley 1562/2012, Dec. 1072/2015, Res. 0312/2019.',
    control: 'Radicación de autoevaluación en el Fondo de Riesgos Laborales y auditorías periódicas.',
    impactLevel: 'alto',
  },
  {
    id: '5',
    parte: 'Comunidad Vecina y Autoridades Locales',
    necesidades: 'Prevención de conatos, incendios, fugas o contingencias industriales que trasciendan el predio.',
    expectativas: 'Información transparente ante emergencias y canales de diálogo comunitario.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.25 (PPRE), Ley 1523/2012 (Gestión del Riesgo).',
    control: 'Plan de emergencias, brigada capacitada, simulacros anuales y coordinación con bomberos.',
    impactLevel: 'medio',
  },
];

const INITIAL_STRATEGIES: CrossStrategies = {
  fo: [
    'Aprovechar la suite digital WAPPY y el respaldo gerencial para monitorear en tiempo real la siniestralidad.',
    'Articular la gestión del COPASST con los programas de capacitación y asesoría técnica especializada de la ARL.',
  ],
  do: [
    'Superar la resistencia al auto-reporte mediante el módulo interactivo de reportes rápidos de WAPPY asistido por voz.',
    'Cerrar brechas de la autoevaluación 0312 aprovechando las asistencias técnicas gratuitas de la ARL y Caja de Compensación.',
  ],
  fa: [
    'Utilizar las actas y reuniones periódicas del COPASST para responder con rapidez ante nuevas exigencias regulatorias.',
    'Blindar a la organización ante contingencias climáticas mediante la asignación presupuestal ya aprobada por la gerencia.',
  ],
  da: [
    'Implementar protocolos de contingencia vial y climática para evitar que la rotación de personal aumente los accidentes.',
    'Monitorear cambios normativos con alertas tempranas para evitar multas del Ministerio del Trabajo por debilidades operativas.',
  ],
};

export const ContextoPartesInteresadasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [activeTab, setActiveTab] = useState<'dofa' | 'partes' | 'estrategias'>('dofa');
  const [dofaList, setDofaList] = useState<DofaItem[]>(INITIAL_DOFA);
  const [stakeholders, setStakeholders] = useState<StakeholderItem[]>(INITIAL_STAKEHOLDERS);
  const [crossStrategies, setCrossStrategies] = useState<CrossStrategies>(INITIAL_STRATEGIES);
  const [company, setCompany] = useState<any>(null);

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);

  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);
  const [isCompilingReport, setIsCompilingReport] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  // Formulario nuevo factor DOFA
  const [newDofaType, setNewDofaType] = useState<'fortaleza' | 'debilidad' | 'oportunidad' | 'amenaza'>('oportunidad');
  const [newDofaDesc, setNewDofaDesc] = useState('');
  const [newDofaAction, setNewDofaAction] = useState('');
  const [newDofaImpact, setNewDofaImpact] = useState('alto');

  // Formulario nueva parte interesada
  const [newParte, setNewParte] = useState('');
  const [newNecesidades, setNewNecesidades] = useState('');
  const [newExpectativas, setNewExpectativas] = useState('');
  const [newRequisito, setNewRequisito] = useState('');
  const [newControl, setNewControl] = useState('');
  const [newImpactLevel, setNewImpactLevel] = useState('alto');

  // Formulario de nuevas estrategias cruzadas
  const [newStrategyType, setNewStrategyType] = useState<'fo' | 'do' | 'fa' | 'da'>('fo');
  const [newStrategyText, setNewStrategyText] = useState('');

  // ─── CARGAR DATOS AL MONTAR EL COMPONENTE ──────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sgsst/contexto/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.company) setCompany(data.company);
        if (Array.isArray(data.dofaList) && data.dofaList.length > 0) {
          setDofaList(data.dofaList);
        }
        if (Array.isArray(data.stakeholders) && data.stakeholders.length > 0) {
          setStakeholders(data.stakeholders);
        }
        if (data.crossStrategies && typeof data.crossStrategies === 'object') {
          setCrossStrategies({
            fo: Array.isArray(data.crossStrategies.fo) ? data.crossStrategies.fo : [],
            do: Array.isArray(data.crossStrategies.do) ? data.crossStrategies.do : [],
            fa: Array.isArray(data.crossStrategies.fa) ? data.crossStrategies.fa : [],
            da: Array.isArray(data.crossStrategies.da) ? data.crossStrategies.da : [],
          });
        }
        if (data.lastGeneratedReport) {
          setGeneratedReport(data.lastGeneratedReport);
          editorContentRef.current = data.lastGeneratedReport;
          liveEditorRef.current?.setHTML(data.lastGeneratedReport);
        }
      }
    } catch (err) {
      console.warn('[Contexto] Could not load saved data from server:', err);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── GENERAR MATRIZ CON IA DESDE DATOS DE LA EMPRESA ───────────────────────
  const handleGenerateMatrixAI = async () => {
    if (!token) {
      showToast({ message: 'Error de autenticación.', status: 'error' });
      return;
    }
    setIsGeneratingMatrix(true);
    try {
      const res = await fetch('/api/sgsst/contexto/generate-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modelName: selectedModel }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al generar la matriz con IA.');
      }

      const data = await res.json();
      if (Array.isArray(data.dofaList) && data.dofaList.length > 0) {
        setDofaList(data.dofaList);
      }
      if (Array.isArray(data.stakeholders) && data.stakeholders.length > 0) {
        setStakeholders(data.stakeholders);
      }
      if (data.crossStrategies) {
        setCrossStrategies(data.crossStrategies);
      }

      showToast({
        message: '¡Matriz DOFA y Partes Interesadas generadas con IA desde los datos reales de la empresa!',
        status: 'success',
      });
    } catch (error: any) {
      console.error('[Contexto] Error in handleGenerateMatrixAI:', error);
      showToast({
        message: error.message || 'Error al generar matriz con IA.',
        status: 'error',
      });
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  // ─── COMPILAR INFORME OFICIAL (ENCABEZADO, TABLAS Y FIRMAS) ────────────────
  const handleCompileReport = async () => {
    if (!token) {
      showToast({ message: 'Error de autenticación.', status: 'error' });
      return;
    }
    setIsCompilingReport(true);
    try {
      const res = await fetch('/api/sgsst/contexto/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dofaList,
          stakeholders,
          crossStrategies,
          modelName: selectedModel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al compilar el informe oficial.');
      }

      const data = await res.json();
      const reportHtml = data.html;

      setGeneratedReport(reportHtml);
      editorContentRef.current = reportHtml;
      liveEditorRef.current?.setHTML(reportHtml);

      // Guardar en el historial de reportes para consulta de auditoría y Tenshi
      try {
        const saveRes = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: reportHtml,
            title: `Contexto Organizacional (DOFA / Partes Interesadas) - ${company?.companyName || 'Empresa'} - ${new Date().toLocaleDateString('es-CO')}`,
            tags: ['sgsst-contexto-organizacion', 'sgsst-contexto-partes-interesadas'],
          }),
        });

        if (saveRes.ok) {
          const saveData = await saveRes.json();
          if (saveData.conversationId) setConversationId(saveData.conversationId);
          if (saveData.messageId) setReportMessageId(saveData.messageId);
          setRefreshTrigger((prev) => prev + 1);
        }
      } catch (saveErr) {
        console.warn('[Contexto] Could not auto-save report in history:', saveErr);
      }

      showToast({
        message: 'Informe Oficial de Contexto generado con encabezado corporativo y firmas.',
        status: 'success',
      });
    } catch (error: any) {
      console.error('[Contexto] Compile report error:', error);
      showToast({
        message: error.message || 'Error al compilar el informe oficial.',
        status: 'error',
      });
    } finally {
      setIsCompilingReport(false);
    }
  };

  // ─── GUARDAR DATOS DEL FORMULARIO ──────────────────────────────────────────
  const handleSaveData = async () => {
    setIsSavingData(true);
    try {
      localStorage.setItem('wappy_iso45001_dofa', JSON.stringify(dofaList));
      localStorage.setItem('wappy_iso45001_stakeholders', JSON.stringify(stakeholders));
      localStorage.setItem('wappy_iso45001_strategies', JSON.stringify(crossStrategies));

      if (token) {
        await fetch('/api/sgsst/contexto/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dofaList,
            stakeholders,
            crossStrategies,
            lastGeneratedReport: editorContentRef.current || generatedReport || '',
            conversationId,
            messageId: reportMessageId,
          }),
        });
      }

      showToast({
        message: 'Contexto, partes interesadas y estrategias guardados exitosamente.',
        status: 'success',
      });
    } catch (err) {
      console.error('[Contexto] Save data error:', err);
      showToast({ message: 'Error al guardar los datos.', status: 'error' });
    } finally {
      setIsSavingData(false);
    }
  };

  // ─── SELECCIÓN DE REPORTE DESDE EL HISTORIAL ──────────────────────────────
  const handleSelectReport = useCallback(
    async (selectedConvoId: string) => {
      if (!selectedConvoId || !token) return;
      try {
        const res = await fetch(`/api/messages/${selectedConvoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error al obtener mensajes');
        const messages = await res.json();
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.text) {
          setGeneratedReport(lastMsg.text);
          editorContentRef.current = lastMsg.text;
          liveEditorRef.current?.setHTML(lastMsg.text);
          setConversationId(selectedConvoId);
          setReportMessageId(lastMsg.messageId);
          showToast({ message: 'Informe cargado desde el historial', status: 'success' });
        }
      } catch (err) {
        console.error('[Contexto] Load report from history error:', err);
        showToast({ message: 'Error al cargar informe del historial.', status: 'error' });
      }
      setIsHistoryOpen(false);
    },
    [token, showToast]
  );

  // ─── MANEJO DE FACTORES DOFA ───────────────────────────────────────────────
  const handleAddDofa = () => {
    if (!newDofaDesc.trim()) {
      showToast({ message: 'Escribe la descripción del factor DOFA.', status: 'warning' });
      return;
    }
    const source: 'interno' | 'externo' =
      newDofaType === 'fortaleza' || newDofaType === 'debilidad' ? 'interno' : 'externo';
    const newItem: DofaItem = {
      id: `dofa_${Date.now()}`,
      type: newDofaType,
      description: newDofaDesc.trim(),
      source,
      impact: newDofaImpact,
      strategicAction: newDofaAction.trim() || undefined,
    };
    setDofaList((prev) => [newItem, ...prev]);
    setNewDofaDesc('');
    setNewDofaAction('');
    showToast({ message: 'Factor agregado a la Matriz DOFA de SST.', status: 'success' });
  };

  const handleDeleteDofa = (id: string) => {
    setDofaList((prev) => prev.filter((item) => item.id !== id));
  };

  // ─── MANEJO DE PARTES INTERESADAS ──────────────────────────────────────────
  const handleAddStakeholder = () => {
    if (!newParte.trim() || !newNecesidades.trim()) {
      showToast({ message: 'Indica al menos la parte interesada y sus necesidades.', status: 'warning' });
      return;
    }
    const newItem: StakeholderItem = {
      id: `stk_${Date.now()}`,
      parte: newParte.trim(),
      necesidades: newNecesidades.trim(),
      expectativas: newExpectativas.trim() || 'Cumplimiento de compromisos y estándares de SST.',
      requisito: newRequisito.trim() || 'ISO 45001:2018 Cláusula 4.2 y Dec. 1072/2015',
      control: newControl.trim() || 'Seguimiento en comités y auditorías periódicas',
      impactLevel: newImpactLevel,
    };
    setStakeholders((prev) => [newItem, ...prev]);
    setNewParte('');
    setNewNecesidades('');
    setNewExpectativas('');
    setNewRequisito('');
    setNewControl('');
    showToast({ message: 'Parte interesada registrada con éxito.', status: 'success' });
  };

  const handleDeleteStakeholder = (id: string) => {
    setStakeholders((prev) => prev.filter((item) => item.id !== id));
  };

  // ─── MANEJO DE ESTRATEGIAS CRUZADAS ────────────────────────────────────────
  const handleAddStrategy = () => {
    if (!newStrategyText.trim()) {
      showToast({ message: 'Escribe el texto de la estrategia.', status: 'warning' });
      return;
    }
    setCrossStrategies((prev) => ({
      ...prev,
      [newStrategyType]: [newStrategyText.trim(), ...(prev[newStrategyType] || [])],
    }));
    setNewStrategyText('');
    showToast({ message: `Estrategia ${newStrategyType.toUpperCase()} añadida.`, status: 'success' });
  };

  const handleDeleteStrategy = (type: 'fo' | 'do' | 'fa' | 'da', index: number) => {
    setCrossStrategies((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, idx) => idx !== index),
    }));
  };

  // ─── LISTENERS PARA TENSHI (VOZ Y CHAT) ────────────────────────────────────
  useEffect(() => {
    const handleDiligenciar = (e: any) => {
      const { modulo, campos } = e.detail || {};
      if (
        !modulo ||
        modulo === 'contexto' ||
        modulo === 'dofa' ||
        modulo === 'partes_interesadas' ||
        modulo.includes('contexto') ||
        modulo.includes('dofa')
      ) {
        if (campos && typeof campos === 'object') {
          if (campos.dofaList && Array.isArray(campos.dofaList)) setDofaList(campos.dofaList);
          if (campos.stakeholders && Array.isArray(campos.stakeholders)) setStakeholders(campos.stakeholders);
          if (campos.crossStrategies && typeof campos.crossStrategies === 'object') {
            setCrossStrategies(campos.crossStrategies);
          }
          showToast({
            message: 'Tenshi ha sincronizado el contexto de la organización.',
            status: 'success',
          });
        }
      }
    };

    const handleAiEvent = (e: any) => {
      const app = (e.detail?.aplicativo || '').toLowerCase();
      if (!app || app.includes('contexto') || app.includes('dofa') || app === 'actual') {
        handleGenerateMatrixAI();
      }
    };

    window.addEventListener('wappy-diligenciar-formulario', handleDiligenciar);
    window.addEventListener('wappy-generar-analisis-ia', handleAiEvent);
    window.addEventListener('wappy-generar-analisis-actual', handleAiEvent);
    return () => {
      window.removeEventListener('wappy-diligenciar-formulario', handleDiligenciar);
      window.removeEventListener('wappy-generar-analisis-ia', handleAiEvent);
      window.removeEventListener('wappy-generar-analisis-actual', handleAiEvent);
    };
  }, []);

  const totalStrategies =
    (crossStrategies.fo?.length || 0) +
    (crossStrategies.do?.length || 0) +
    (crossStrategies.fa?.length || 0) +
    (crossStrategies.da?.length || 0);

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
                {company?.companyName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    <Building2 className="w-3 h-3" /> {company.companyName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Operativo con IA
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${dofaList.length} Factores DOFA Registrados`}
                  className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {dofaList.length} Factores DOFA
                    </span>
                  </div>
                </div>

                <div
                  title={`${stakeholders.length} Partes Interesadas Identificadas`}
                  className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {stakeholders.length} Partes Interesadas
                    </span>
                  </div>
                </div>

                <div
                  title={`${totalStrategies} Cruces Estratégicos (FO, DO, FA, DA)`}
                  className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Workflow className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {totalStrategies} Cruces Estratégicos
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

          {/* BOTONES PRINCIPALES DE ACCIÓN CONFORME A REGLAS WAPPY */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Botón Naranja / IA: Generación Inteligente desde datos de la Empresa (Expansible) */}
            <ExpandingButton
              onClick={handleGenerateMatrixAI}
              icon={Sparkles}
              label={isGeneratingMatrix ? 'Analizando Empresa...' : 'Generar Matriz con IA'}
              variant="orange"
              isLoading={isGeneratingMatrix}
              title="Recolectar datos de la empresa (GTC-45, 0312, perfil) y generar matriz completa con IA"
            />

            {/* Botón Teal / Confirmar: Compilar Informe Oficial (Expansible) */}
            <ExpandingButton
              onClick={handleCompileReport}
              icon={FileText}
              label={isCompilingReport ? 'Compilando...' : 'Compilar Informe Oficial'}
              variant="teal"
              isLoading={isCompilingReport}
              title="Compilar informe formal con encabezado oficial WAPPY y firmas digitales"
            />

            {/* Botón Guardar Datos */}
            <ExpandingButton
              onClick={handleSaveData}
              icon={Save}
              label="Guardar Datos"
              variant="outline-teal"
              isLoading={isSavingData}
            />
          </div>
        </div>
      </div>

      {/* ─── BANNER METODOLÓGICO: RECOLECCIÓN DE INFORMACIÓN INTEGRAL ─── */}
      <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-500/10 via-surface-secondary to-transparent p-4 flex items-start sm:items-center gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 shrink-0">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
            Metodología de Diagnóstico Autónomo Multi-Aplicativo (ISO 45001 Cl. 4.1 y 4.2)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            El motor de IA recolecta automáticamente los datos reales de la organización: <strong>Razón social, CIIU, nivel de riesgo</strong>,
            peligros prioritarios de la <strong>Matriz IPEVR GTC-45</strong>, autoevaluación de la <strong>Resolución 0312 de 2019</strong> y estado de los comités.
            Puedes editar, agregar o eliminar factores libremente para calibrar el estudio antes de compilar el informe.
          </p>
        </div>
      </div>

      {/* ─── TABS DE NAVEGACIÓN INTERNA (DOFA vs PARTES INTERESADAS vs ESTRATEGIAS) ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-light dark:border-white/10 pb-2">
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

        <button
          onClick={() => setActiveTab('estrategias')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'estrategias'
              ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
              : 'text-text-secondary hover:bg-surface-secondary'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>Cruces Estratégicos (FO, DO, FA, DA)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-extrabold">
            {totalStrategies}
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
                  <CheckCircle2 className="w-4 h-4" /> Fortalezas (Factores Internos Positivos)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {dofaList.filter((d) => d.type === 'fortaleza').length}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-text-primary">
                {dofaList
                  .filter((d) => d.type === 'fortaleza')
                  .map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-primary/70 border border-emerald-500/20 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{d.description}</span>
                        <button
                          onClick={() => handleDeleteDofa(d.id)}
                          className="text-red-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                          title="Eliminar factor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {d.strategicAction && (
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span>Acción: {d.strategicAction}</span>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Oportunidades */}
            <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/[0.03]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Oportunidades (Factores Externos Positivos)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300">
                  {dofaList.filter((d) => d.type === 'oportunidad').length}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-text-primary">
                {dofaList
                  .filter((d) => d.type === 'oportunidad')
                  .map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-primary/70 border border-sky-500/20 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{d.description}</span>
                        <button
                          onClick={() => handleDeleteDofa(d.id)}
                          className="text-red-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                          title="Eliminar factor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {d.strategicAction && (
                        <div className="text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1 bg-sky-500/10 px-2 py-1 rounded-lg">
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span>Acción: {d.strategicAction}</span>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Debilidades */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.03]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Debilidades (Factores Internos a Intervenir)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {dofaList.filter((d) => d.type === 'debilidad').length}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-text-primary">
                {dofaList
                  .filter((d) => d.type === 'debilidad')
                  .map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-primary/70 border border-amber-500/20 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{d.description}</span>
                        <button
                          onClick={() => handleDeleteDofa(d.id)}
                          className="text-red-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                          title="Eliminar factor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {d.strategicAction && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span>Acción: {d.strategicAction}</span>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Amenazas */}
            <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/[0.03]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> Amenazas (Factores Externos de Riesgo)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300">
                  {dofaList.filter((d) => d.type === 'amenaza').length}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-text-primary">
                {dofaList
                  .filter((d) => d.type === 'amenaza')
                  .map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-primary/70 border border-red-500/20 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{d.description}</span>
                        <button
                          onClick={() => handleDeleteDofa(d.id)}
                          className="text-red-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                          title="Eliminar factor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {d.strategicAction && (
                        <div className="text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg">
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span>Acción: {d.strategicAction}</span>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Formulario para agregar factor DOFA */}
          <div className="p-4 rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/50 flex flex-col md:flex-row items-center gap-3">
            <select
              value={newDofaType}
              onChange={(e) => setNewDofaType(e.target.value as any)}
              className="w-full md:w-auto px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
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
              className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
            />

            <input
              type="text"
              placeholder="Acción clave / medida sugerida (opcional)..."
              value={newDofaAction}
              onChange={(e) => setNewDofaAction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDofa()}
              className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
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
                  <th className="p-3 text-center">Impacto</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5 bg-surface-primary/40">
                {stakeholders.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="p-3 font-bold text-text-primary">
                      {s.parte}
                    </td>
                    <td className="p-3 text-text-secondary max-w-xs">{s.necesidades}</td>
                    <td className="p-3 text-text-secondary max-w-xs">{s.expectativas}</td>
                    <td className="p-3 text-teal-600 dark:text-teal-400 font-medium">{s.requisito}</td>
                    <td className="p-3 text-text-secondary">{s.control}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 uppercase">
                        {s.impactLevel || 'alto'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteStakeholder(s.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
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

      {/* ─── CONTENIDO TAB 3: CRUCES ESTRATÉGICOS (FO, DO, FA, DA) ─── */}
      {activeTab === 'estrategias' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FO */}
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Estrategias FO (Fortalezas + Oportunidades)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {crossStrategies.fo?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-3 italic">
                Usar las fortalezas internas para potenciar oportunidades del entorno:
              </p>
              <ul className="space-y-2 text-xs text-text-primary">
                {(crossStrategies.fo || []).map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 rounded-xl bg-surface-primary/70 border border-emerald-500/20"
                  >
                    <span>{text}</span>
                    <button
                      onClick={() => handleDeleteStrategy('fo', idx)}
                      className="text-red-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                      title="Eliminar estrategia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* DO */}
            <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                  Estrategias DO (Debilidades + Oportunidades)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300">
                  {crossStrategies.do?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-3 italic">
                Superar debilidades internas aprovechando las oportunidades externas:
              </p>
              <ul className="space-y-2 text-xs text-text-primary">
                {(crossStrategies.do || []).map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 rounded-xl bg-surface-primary/70 border border-sky-500/20"
                  >
                    <span>{text}</span>
                    <button
                      onClick={() => handleDeleteStrategy('do', idx)}
                      className="text-red-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                      title="Eliminar estrategia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* FA */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Estrategias FA (Fortalezas + Amenazas)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {crossStrategies.fa?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-3 italic">
                Usar fortalezas internas para mitigar o neutralizar amenazas externas:
              </p>
              <ul className="space-y-2 text-xs text-text-primary">
                {(crossStrategies.fa || []).map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 rounded-xl bg-surface-primary/70 border border-amber-500/20"
                  >
                    <span>{text}</span>
                    <button
                      onClick={() => handleDeleteStrategy('fa', idx)}
                      className="text-red-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                      title="Eliminar estrategia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* DA */}
            <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  Estrategias DA (Debilidades + Amenazas)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300">
                  {crossStrategies.da?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-3 italic">
                Minimizar debilidades internas y eludir o prevenir amenazas severas:
              </p>
              <ul className="space-y-2 text-xs text-text-primary">
                {(crossStrategies.da || []).map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 rounded-xl bg-surface-primary/70 border border-red-500/20"
                  >
                    <span>{text}</span>
                    <button
                      onClick={() => handleDeleteStrategy('da', idx)}
                      className="text-red-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                      title="Eliminar estrategia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Formulario para agregar estrategia */}
          <div className="p-4 rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/50 flex flex-col sm:flex-row items-center gap-3">
            <select
              value={newStrategyType}
              onChange={(e) => setNewStrategyType(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
            >
              <option value="fo">Estrategia FO (Fortalezas + Oportunidades)</option>
              <option value="do">Estrategia DO (Debilidades + Oportunidades)</option>
              <option value="fa">Estrategia FA (Fortalezas + Amenazas)</option>
              <option value="da">Estrategia DA (Debilidades + Amenazas)</option>
            </select>

            <input
              type="text"
              placeholder="Formula la estrategia de mejora continua..."
              value={newStrategyText}
              onChange={(e) => setNewStrategyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStrategy()}
              className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
            />

            <ExpandingButton
              onClick={handleAddStrategy}
              icon={Plus}
              label="Añadir Estrategia"
              variant="teal"
            />
          </div>
        </div>
      )}

      {/* ─── TOOLBAR FLOTANTE CÁPSULA WAPPY ─── */}
      <SGSSTToolbar
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onAnalyze={handleCompileReport}
        isAnalyzing={isCompilingReport}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSaveLocal={handleSaveData}
        isSavingLocal={isSavingData}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Contexto_Partes_Interesadas_ISO45001_${Date.now()}`}
      />

      {/* ─── MODAL DE HISTORIAL DE REPORTES (ReportHistory) ─── */}
      <ReportHistory
        onSelectReport={handleSelectReport}
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-contexto-organizacion', 'sgsst-contexto-partes-interesadas']}
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
            fileName={`Contexto_y_Partes_Interesadas_${company?.companyName || 'ISO45001'}`}
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
            reportSourceData={{ dofaList, stakeholders, crossStrategies, company }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default ContextoPartesInteresadasWorkspace;
