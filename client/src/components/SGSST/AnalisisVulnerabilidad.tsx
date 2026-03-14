import React, { useState, useCallback, useRef } from 'react';
import {
    Loader2,
    ChevronDown,
    ChevronRight,
    Camera,
    X,
    Plus,
    Trash2,
    Shield,
    AlertTriangle,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';
import { generateDummyData } from '~/utils/dummyDataGenerator';

// ─── Diamante de Colores Calculator ───
const getColorValue = (score: number) => {
  if (score >= 0.0 && score <= 1.0) return 'VERDE';
  if (score >= 1.1 && score <= 2.0) return 'AMARILLO';
  if (score >= 2.1 && score <= 3.0) return 'ROJO';
  return 'VERDE';
};

const getHex = (color: string) => {
  if (color === 'ROJO') return '#dc2626';
  if (color === 'AMARILLO') return '#facc15';
  if (color === 'VERDE') return '#16a34a';
  return '#e2e8f0';
};

const calculateGlobalRisk = (amColor: string, pColor: string, rColor: string, sColor: string) => {
  let rojos = 0, amarillos = 0, verdes = 0;
  [amColor, pColor, rColor, sColor].forEach(c => {
    if (c === 'ROJO') rojos++;
    else if (c === 'AMARILLO') amarillos++;
    else verdes++;
  });
  if (rojos >= 3 || (rojos >= 2 && amarillos >= 2) || (rojos >= 1 && amarillos === 3)) return 'ALTO';
  if ((rojos >= 1 && amarillos >= 1) || (amarillos >= 3)) return 'MEDIO';
  return 'BAJO';
};

const QUESTIONS_BY_ORIGIN = {
  'Natural (Sismo, Inundación...)': {
    personas: [
      { id: 'p1', q: '¿Existe brigada capacitada en evacuación y rescate para fenómenos naturales?' },
      { id: 'p2', q: '¿El personal ha recibido entrenamiento sobre puntos de encuentro y refugio?' },
      { id: 'p3', q: '¿Se realizan simulacros periódicos enfocados en sismos o inundaciones?' },
      { id: 'p4', q: '¿El personal vulnerable (movilidad reducida) tiene plan de evacuación asignado?' },
    ],
    recursos: [
      { id: 'r1', q: '¿Se cuenta con botiquines, camillas y cuerdas accesibles e inspeccionados?' },
      { id: 'r2', q: '¿Hay disponibilidad de linternas, radios y equipo para emergencias naturales?' },
      { id: 'r3', q: '¿Se tiene un sistema de alarma de evacuación audible en toda la instalación?' },
      { id: 'r4', q: '¿Existen recursos financieros para reparaciones estructurales urgentes?' },
    ],
    sistemas: [
      { id: 's1', q: '¿La edificación es sismorresistente o cuenta con refuerzos estructurales?' },
      { id: 's2', q: '¿Existen estanterías, luminarias o elementos altos anclados firmemente?' },
      { id: 's3', q: '¿Las rutas de evacuación son seguras, amplias y libres de caídas de objetos?' },
      { id: 's4', q: '¿Existen sistemas alternos de energía (plantas) y agua interconectados?' },
    ]
  },
  'Tecnológico (Incendio, Derrame...)': {
    personas: [
      { id: 'p1', q: '¿La brigada está entrenada en control de conatos, incendios y derrames?' },
      { id: 'p2', q: '¿El personal operativo sabe cómo accionar extintores y paradas de emergencia?' },
      { id: 'p3', q: '¿Se realizan simulacros de evacuación por humo o químicos peligrosos?' },
      { id: 'p4', q: '¿Los contratistas/mantenimiento reciben inducción sobre riesgos tecnológicos?' },
    ],
    recursos: [
      { id: 'r1', q: '¿Contamos con extintores vigentes, suficientes y acordes al tipo de riesgo?' },
      { id: 'r2', q: '¿Existen gabinetes, redes contra incendio o rociadores automáticos (si aplica)?' },
      { id: 'r3', q: '¿Hay disponibilidad inmediata de kits de control de derrames ambientales?' },
      { id: 'r4', q: '¿Los sistemas de alarma incluyen detectores de humo, calor o gases?' },
    ],
    sistemas: [
      { id: 's1', q: '¿Se realizan inspecciones periódicas rigurosas a instalaciones eléctricas?' },
      { id: 's2', q: '¿Las máquinas o procesos críticos tienen botones de parada rápida?' },
      { id: 's3', q: '¿Las áreas de sustancias químicas cuentan con diques de contención?' },
      { id: 's4', q: '¿Existen sistemas de corte automático y seguro para gas o combustibles?' },
    ]
  },
  'Social (Robo, Atentado...)': {
    personas: [
      { id: 'p1', q: '¿El personal conoce el protocolo de actuación ante una intrusión o asalto?' },
      { id: 'p2', q: '¿El equipo de seguridad de portería está formado en el manejo de crisis corporativa?' },
      { id: 'p3', q: '¿Existen inducciones sobre prevención de sabotajes o personas sospechosas?' },
      { id: 'p4', q: '¿Se han establecido códigos de comunicación o santo seña para alertar peligro?' },
    ],
    recursos: [
      { id: 'r1', q: '¿Se cuenta con botones de pánico conectados a centrales o autoridades locales?' },
      { id: 'r2', q: '¿El personal de vigilancia tiene elementos de apoyo y comunicación radial?' },
      { id: 'r3', q: '¿Existen cámaras de seguridad (CCTV) grabando 24/7 áreas críticas y perímetros?' },
      { id: 'r4', q: '¿Se cuenta con iluminación exterior e interior de emergencia antiasaltos?' },
    ],
    sistemas: [
      { id: 's1', q: '¿Existe control estricto de acceso de visitantes, contratistas y vehículos?' },
      { id: 's2', q: '¿Las puertas, ventanas y cerramientos perimetrales tienen barreras físicas?' },
      { id: 's3', q: '¿Existen mecanismos de resguardo en dinero/valores (cajas fuertes, horario seguro)?' },
      { id: 's4', q: '¿Se protegen activamente los sistemas de información corporativos (backups, ciberseguridad)?' },
    ]
  }
};

const matchOrigen = (origen: string) => {
  if (!origen) return 'Natural (Sismo, Inundación...)';
  if (origen.includes('Tecnol') || origen.includes('ncendio')) return 'Tecnológico (Incendio, Derrame...)';
  if (origen.includes('Social') || origen.includes('obo')) return 'Social (Robo, Atentado...)';
  return 'Natural (Sismo, Inundación...)';
};

const WorkerAutocomplete = ({ value, onChange, onSelect, data, searchKey, placeholder, className, wrapperClassName }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: any) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = data.filter((w: any) => {
    const v = w[searchKey];
    if (!value) return true;
    return v && String(v).toLowerCase().includes(String(value).toLowerCase());
  });
  const exact = value && filtered.find((w: any) => String(w[searchKey]).toLowerCase() === String(value).toLowerCase());
  return (
    <div className={`relative ${wrapperClassName || 'w-full'}`} ref={wrapperRef}>
      <input type="text" value={value} onChange={e => { onChange(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} className={className} placeholder={placeholder} autoComplete="off" />
      {isOpen && filtered.length > 0 && !exact && (
        <ul className="absolute z-50 w-full mt-1 max-h-48 overflow-auto bg-surface-primary border border-border-medium rounded-lg shadow-xl py-1 text-left">
          {filtered.map((w: any, idx: number) => (
            <li key={idx} className="px-4 py-2 text-sm cursor-pointer hover:bg-surface-hover" onClick={() => { if (onSelect) onSelect(w); else onChange(w[searchKey]); setIsOpen(false); }}>
              <div className="font-semibold">{w.nombre}</div>
              <div className="text-xs text-text-secondary">CC: {w.identificacion} {w.cargo ? `• ${w.cargo}` : ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface AmenazaNode {
  id: string;
  amenaza: string;
  origenAmenaza: string;
  nivelAmenaza: string;
  descripcionGlobal: string;
  answers: Record<string, number>;
}

const emptyAmenaza = (): AmenazaNode => ({
  id: crypto.randomUUID(),
  amenaza: '',
  origenAmenaza: 'Natural (Sismo, Inundación...)',
  nivelAmenaza: 'Probable',
  descripcionGlobal: '',
  answers: {}
});

const AnalisisVulnerabilidad = () => {
  const { showToast } = useToastContext();
  const { token } = useAuthContext();

  const [amenazasList, setAmenazasList] = useState<AmenazaNode[]>([emptyAmenaza()]);
  const [activeAmenazaId, setActiveAmenazaId] = useState<string | null>(null);

  const [images, setImages] = useState<{ [k: string]: string | null }>({ foto1: null, foto2: null, foto3: null });
  const [evaluadoresList, setEvaluadoresList] = useState([{ nombre: '', cedula: '', rol: '' }]);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  // Set the first threat active on mount
  React.useEffect(() => {
    if (amenazasList.length > 0 && !activeAmenazaId) {
      setActiveAmenazaId(amenazasList[0].id);
    }
  }, [amenazasList, activeAmenazaId]);

  React.useEffect(() => {
    if (!token) return;
    fetch('/api/sgsst/perfil-sociodemografico/data', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.trabajadores?.length) setAvailableWorkers(d.trabajadores); })
      .catch(() => {});
  }, [token]);

  React.useEffect(() => {
    if (!token) return;
    fetch('/api/sgsst/analisis-vulnerabilidad/data', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.amenazasList && d.amenazasList.length > 0) {
          // ensure valid ids if migrating from old flat schema
          const migrated = d.amenazasList.map((a: any) => ({ ...emptyAmenaza(), ...a, id: a.id || crypto.randomUUID() }));
          setAmenazasList(migrated);
          setActiveAmenazaId(migrated[0].id);
        }
        if (d.evaluadoresList?.length) setEvaluadoresList(d.evaluadoresList);
        if (d.images) setImages(d.images);
      }).catch(() => {});
  }, [token]);

  const updateAmenaza = (id: string, updates: Partial<AmenazaNode>) => {
    setAmenazasList(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleAnswer = (amId: string, section: string, qId: string, val: number) => {
    setAmenazasList(prev => prev.map(a => {
      if (a.id === amId) {
        return { ...a, answers: { ...a.answers, [`${section}_${qId}`]: val } };
      }
      return a;
    }));
  };

  const getSectionScore = (answers: Record<string, number>, section: 'personas'|'recursos'|'sistemas', origen: string) => {
    if (!answers) return 0;
    const originKey = matchOrigen(origen) as keyof typeof QUESTIONS_BY_ORIGIN;
    const questions = QUESTIONS_BY_ORIGIN[originKey][section];
    const sectionAnswers = questions.map(q => answers[`${section}_${q.id}`]);
    const answeredCount = sectionAnswers.filter(v => v !== undefined).length;
    if (answeredCount === 0) return 0;
    const sum = sectionAnswers.reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
    return (sum / answeredCount) * 3;
  };

  const calculateThreatGraphics = (am: AmenazaNode) => {
    const ptsPers = getSectionScore(am.answers, 'personas', am.origenAmenaza);
    const ptsRec = getSectionScore(am.answers, 'recursos', am.origenAmenaza);
    const ptsSist = getSectionScore(am.answers, 'sistemas', am.origenAmenaza);

    const amenazaColor = am.nivelAmenaza === 'Inminente' ? 'ROJO' : (am.nivelAmenaza === 'Probable' ? 'AMARILLO' : 'VERDE');
    const colorPers = getColorValue(ptsPers);
    const colorRec = getColorValue(ptsRec);
    const colorSist = getColorValue(ptsSist);
    const riskLevel = calculateGlobalRisk(amenazaColor, colorPers, colorRec, colorSist);

    const riskColorHex = riskLevel === 'ALTO' ? '#dc2626' : (riskLevel === 'MEDIO' ? '#facc15' : '#16a34a');
    const riskTextHex = riskLevel === 'MEDIO' ? '#000' : '#fff';

    return { ptsPers, ptsRec, ptsSist, amenazaColor, colorPers, colorRec, colorSist, riskLevel, riskColorHex, riskTextHex };
  };

  const handleSaveData = async (silent = false) => {
    if (!token) return;
    
    // Inject calculated points before saving
    const dataToSave = amenazasList.map(am => {
       const calc = calculateThreatGraphics(am);
       return { ...am, puntajePersonas: calc.ptsPers, puntajeRecursos: calc.ptsRec, puntajeSistemas: calc.ptsSist, riskLevel: calc.riskLevel };
    });

    try {
      const res = await fetch('/api/sgsst/analisis-vulnerabilidad/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer \${token}` },
        body: JSON.stringify({ amenazasList: dataToSave, evaluadoresList, images })
      });
      if (res.ok && !silent) showToast({ message: 'Datos guardados correctamente.', status: 'success' });
    } catch { if (!silent) showToast({ message: 'Error al guardar.', status: 'error' }); }
  };

  const handleDummyData = () => {
    const dummy = generateDummyData.vulnerabilidad();
    setAmenazasList(dummy.amenazasList as any);
    setEvaluadoresList(dummy.evaluadoresList);
    setImages({ foto1: null, foto2: null, foto3: null });
    setActiveAmenazaId(dummy.amenazasList[0].id);
    showToast({ message: 'Datos de prueba generados exitosamente.', status: 'success' });
  };

  const handleImageUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const MAX = 1200;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        setImages(prev => ({ ...prev, [field]: canvas.toDataURL('image/jpeg', 0.6) }));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = useCallback(async () => {
    const invalid = amenazasList.find(a => !a.amenaza.trim());
    if (invalid) {
      showToast({ message: 'Todas las tarjetas deben tener un nombre de Amenaza definido.', status: 'warning' });
      setActiveAmenazaId(invalid.id);
      return;
    }
    setIsGenerating(true);
    handleSaveData(true);
    
    const dataToSave = amenazasList.map(am => {
       const calc = calculateThreatGraphics(am);
       return { ...am, puntajePersonas: calc.ptsPers, puntajeRecursos: calc.ptsRec, puntajeSistemas: calc.ptsSist, riskLevel: calc.riskLevel };
    });

    try {
      const response = await fetch('/api/sgsst/analisis-vulnerabilidad/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer \${token}` },
        body: JSON.stringify({ amenazasList: dataToSave, evaluadoresList, images, modelName: selectedModel }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Error al generar'); }
      const data = await response.json();
      setGeneratedReport(data.report);
      setEditorContent(data.report);
      setIsFormExpanded(false);
      showToast({ message: 'Análisis Multi-Amenaza generado', status: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Error al generar', status: 'error' });
    } finally { setIsGenerating(false); }
  }, [amenazasList, images, selectedModel, token, evaluadoresList, showToast]);

  const handleSave = useCallback(async () => {
    const content = editorContent || generatedReport;
    if (!content || !token) return;
    try {
      if (conversationId && conversationId !== 'new' && reportMessageId) {
        const res = await fetch('/api/sgsst/diagnostico/save-report', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ conversationId, messageId: reportMessageId, content }) });
        if (res.ok) { setRefreshTrigger(p => p + 1); showToast({ message: 'Análisis actualizado', status: 'success' }); }
        return;
      }
      const titleName = amenazasList.length === 1 ? amenazasList[0].amenaza : `Múltiple (${amenazasList.length} Amenazas)`;
      const res = await fetch('/api/sgsst/diagnostico/save-report', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ content, title: `Vulnerabilidad: ${titleName} – ${new Date().toLocaleDateString('es-CO')}`, tags: ['sgsst-vulnerabilidad'] }) });
      if (res.ok) { const d = await res.json(); setConversationId(d.conversationId); setReportMessageId(d.messageId); setRefreshTrigger(p => p + 1); showToast({ message: 'Análisis guardado permanentemente', status: 'success' }); }
    } catch (e: any) { showToast({ message: `Error: ${e.message}`, status: 'error' }); }
  }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast, amenazasList]);

  const handleSelectReport = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/messages/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const messages = await res.json();
      const last = messages[messages.length - 1];
      if (last?.text) { setGeneratedReport(last.text); setEditorContent(last.text); setConversationId(id); setReportMessageId(last.messageId); setIsFormExpanded(false); showToast({ message: 'Documento cargado', status: 'success' }); }
    } catch { showToast({ message: 'Error al cargar', status: 'error' }); }
    setIsHistoryOpen(false);
  }, [token, showToast]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
                    <DummyGenerateButton onClick={handleDummyData} />
        <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-teal-100 text-teal-700' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}>
          <AnimatedIcon name="history" size={20} />
          <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Historial</span>
        </button>
        <button onClick={() => handleSaveData(false)} className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
          <AnimatedIcon name="database" size={20} className="text-gray-500" />
          <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar Datos</span>
        </button>
        <button onClick={handleGenerate} disabled={isGenerating} className="group flex items-center px-3 py-2 bg-teal-700 hover:bg-teal-800 border border-teal-700 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
          <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Análisis (Multi)</span>
        </button>
        <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />
        {generatedReport && (
          <>
            <button onClick={handleSave} className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
              <AnimatedIcon name="save" size={20} className="text-gray-500" />
              <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar Informe</span>
            </button>
            <ExportDropdown content={editorContent || ''} fileName={`Analisis_Vulnerabilidad_${new Date().getTime()}`} />
          </>
        )}
      </div>

      {isHistoryOpen && (
        <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
          <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen} toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger} tags={['sgsst-vulnerabilidad']} />
        </div>
      )}

      {/* Main form */}
      <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
        <button onClick={() => setIsFormExpanded(!isFormExpanded)} className="w-full flex items-center justify-between p-4 bg-surface-tertiary">
          <div className="flex items-center gap-2">
                    <DummyGenerateButton onClick={handleDummyData} />
            {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <Shield className="h-5 w-5 text-teal-700" />
            <span className="font-semibold">Análisis de Vulnerabilidad (Multi-Amenaza)</span>
          </div>
          <div className="text-xs text-text-secondary font-medium">
             {amenazasList.length} {amenazasList.length === 1 ? 'amenaza' : 'amenazas'} en sesión
          </div>
        </button>

        {isFormExpanded && (
          <div className="p-6 space-y-6">
            
            {/* Global Evaluators (Apply to entire plan) */}
            <div className="space-y-3 pb-6 border-b border-border-medium">
              <label className="text-sm font-bold text-teal-800 dark:text-teal-300">Equipo Evaluador / Comité de Emergencias</label>
              {evaluadoresList.map((r, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-3">
                  <WorkerAutocomplete value={r.nombre} onChange={(v: string) => { const n = [...evaluadoresList]; n[idx].nombre = v; const m = availableWorkers.find(w => w.nombre === v); if (m) { n[idx].cedula = m.identificacion; if (!n[idx].rol && m.cargo) n[idx].rol = m.cargo; } setEvaluadoresList(n); }} onSelect={(w: any) => { const n = [...evaluadoresList]; n[idx].nombre = w.nombre; n[idx].cedula = w.identificacion; if (!n[idx].rol && w.cargo) n[idx].rol = w.cargo; setEvaluadoresList(n); }} data={availableWorkers} searchKey="nombre" placeholder="Nombre completo" wrapperClassName="w-full md:w-1/3" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
                  <input type="text" value={r.rol} onChange={e => { const n = [...evaluadoresList]; n[idx].rol = e.target.value; setEvaluadoresList(n); }} className="w-full md:w-1/3 rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary" placeholder="Rol en Emergencias / Cargo" />
                  <div className="flex w-full md:w-1/3 gap-2">
                    <WorkerAutocomplete value={r.cedula} onChange={(v: string) => { const n = [...evaluadoresList]; n[idx].cedula = v; const m = availableWorkers.find(w => w.identificacion === v); if (m && !n[idx].nombre) { n[idx].nombre = m.nombre; if (!n[idx].rol && m.cargo) n[idx].rol = m.cargo; } setEvaluadoresList(n); }} onSelect={(w: any) => { const n = [...evaluadoresList]; n[idx].cedula = w.identificacion; if (!n[idx].nombre) { n[idx].nombre = w.nombre; if (!n[idx].rol && w.cargo) n[idx].rol = w.cargo; } setEvaluadoresList(n); }} data={availableWorkers} searchKey="identificacion" placeholder="Cédula" wrapperClassName="w-full" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
                    <button onClick={() => setEvaluadoresList(evaluadoresList.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" disabled={evaluadoresList.length === 1}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => setEvaluadoresList([...evaluadoresList, { nombre: '', cedula: '', rol: '' }])} className="flex items-center gap-1 text-sm text-teal-700 font-medium"><Plus className="h-4 w-4" /> Añadir Evaluador</button>
            </div>

            {/* The Threats Accordion */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                   Listado de Amenazas
                </h3>
                <button 
                   onClick={() => {
                     const nid = crypto.randomUUID();
                     setAmenazasList([{ ...emptyAmenaza(), id: nid }, ...amenazasList]);
                     setActiveAmenazaId(nid);
                   }}
                   className="flex items-center gap-2 text-sm bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 font-bold px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors"
                >
                   <Plus className="h-4 w-4" /> Añadir Amenaza
                </button>
              </div>

              <div className="space-y-3">
                 {amenazasList.map((am, index) => {
                    const isActive = activeAmenazaId === am.id;
                    const graphics = calculateThreatGraphics(am);
                    
                    return (
                      <div key={am.id} className={`border rounded-xl bg-surface-primary overflow-hidden transition-all duration-300 ${isActive ? 'border-teal-500 ring-1 ring-teal-500 shadow-md' : 'border-border-medium hover:border-teal-300'}`}>
                        {/* Header card */}
                        <div 
                          onClick={() => setActiveAmenazaId(isActive ? null : am.id)}
                          className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isActive ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}
                        >
                           <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold shrink-0">{amenazasList.length - index}</span>
                              <div className="flex flex-col">
                                 <span className="font-bold text-[15px]">{am.amenaza || 'Amenaza sin título'}</span>
                                 <span className="text-xs text-text-secondary">{am.origenAmenaza} • {am.nivelAmenaza}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm" style={{ backgroundColor: graphics.riskColorHex, color: graphics.riskTextHex }}>
                                {graphics.riskLevel}
                              </span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setAmenazasList(p => p.filter(x => x.id !== am.id)); }} 
                                disabled={amenazasList.length === 1}
                                className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              {isActive ? <ChevronDown className="h-5 w-5 text-teal-700" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                           </div>
                        </div>

                        {/* Body card (expanded) */}
                        {isActive && (
                          <div className="p-5 border-t border-border-medium animate-in slide-in-from-top-2">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-sm font-medium">Amenaza a Evaluar (Ej. Incendio, Sismo, Robo)</label>
                                  <input type="text" value={am.amenaza} onChange={e => updateAmenaza(am.id, { amenaza: e.target.value })} placeholder="Nombre de la amenaza" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary border-teal-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-sm font-medium">Origen de la Amenaza</label>
                                  <select value={am.origenAmenaza} onChange={e => updateAmenaza(am.id, { origenAmenaza: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:border-teal-500">
                                    <option>Natural (Sismo, Inundación...)</option>
                                    <option>Tecnológico (Incendio, Derrame...)</option>
                                    <option>Social (Robo, Atentado...)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col md:flex-row gap-8">
                                {/* Matriz Left */}
                                <div className="flex-1 space-y-6">
                                  {/* Amenaza Select */}
                                  <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-bold text-gray-800 dark:text-gray-100 uppercase text-xs">CALIFICACIÓN DE LA AMENAZA</h5>
                                      <span className="px-3 py-1 text-xs font-bold rounded" style={{ backgroundColor: getHex(graphics.amenazaColor), color: graphics.amenazaColor === 'AMARILLO' ? '#000' : '#fff' }}>{graphics.amenazaColor}</span>
                                    </div>
                                    <select value={am.nivelAmenaza} onChange={e => updateAmenaza(am.id, { nivelAmenaza: e.target.value })} className="w-full rounded border px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-gray-300">
                                      <option value="Posible">POSIBLE (Nunca ha sucedido, muy raro) - VERDE</option>
                                      <option value="Probable">PROBABLE (Ocurre a veces) - AMARILLO</option>
                                      <option value="Inminente">INMINENTE (Es seguro o muy frecuente) - ROJO</option>
                                    </select>
                                  </div>

                                  {/* Vulnerabilidades */}
                                  {(['personas', 'recursos', 'sistemas'] as ('personas'|'recursos'|'sistemas')[]).map((sectionTitle) => {
                                      const p = getSectionScore(am.answers, sectionTitle, am.origenAmenaza);
                                      const color = getColorValue(p);
                                      const originKey = matchOrigen(am.origenAmenaza) as keyof typeof QUESTIONS_BY_ORIGIN;
                                      const dynamicQuestions = QUESTIONS_BY_ORIGIN[originKey][sectionTitle];

                                      return (
                                        <div key={sectionTitle} className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-4 shadow-sm">
                                          <div className="flex items-center justify-between mb-3 border-b pb-2">
                                            <h5 className="font-bold text-gray-800 dark:text-gray-100 uppercase text-xs">VULN. EN {sectionTitle}</h5>
                                            <div className="flex items-center gap-3">
                                              <span className="text-xs font-mono font-bold text-gray-500">{p.toFixed(2)}/3.0</span>
                                              <span className="px-3 py-0.5 text-[10px] font-bold rounded" style={{ backgroundColor: getHex(color), color: color === 'AMARILLO' ? '#000' : '#fff' }}>{color}</span>
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            {dynamicQuestions.map((q, i) => {
                                              const currentAns = am.answers[`${sectionTitle}_${q.id}`];
                                              return (
                                                <div key={q.id} className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700">
                                                  <span className="text-gray-700 dark:text-gray-300">{i+1}. {q.q}</span>
                                                  <div className="flex shrink-0 border rounded overflow-hidden">
                                                    <button onClick={() => handleAnswer(am.id, sectionTitle, q.id, 0.0)} className={`px-2 py-1 border-r ${currentAns === 0.0 ? 'bg-green-100 text-green-700 font-bold' : 'bg-white hover:bg-gray-100 text-gray-500'}`}>Bueno (0.0)</button>
                                                    <button onClick={() => handleAnswer(am.id, sectionTitle, q.id, 0.5)} className={`px-2 py-1 border-r ${currentAns === 0.5 ? 'bg-yellow-100 text-yellow-700 font-bold' : 'bg-white hover:bg-gray-100 text-gray-500'}`}>Medio (0.5)</button>
                                                    <button onClick={() => handleAnswer(am.id, sectionTitle, q.id, 1.0)} className={`px-2 py-1 ${currentAns === 1.0 ? 'bg-red-100 text-red-700 font-bold' : 'bg-white hover:bg-gray-100 text-gray-500'}`}>Malo (1.0)</button>
                                                  </div>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      );
                                  })}
                                </div>

                                {/* Diamond Right */}
                                <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center pt-2">
                                  <div className="sticky top-10 flex flex-col items-center w-full bg-white dark:bg-gray-800 border p-6 rounded-2xl shadow-lg">
                                      <h3 className="font-bold text-center mb-6 text-gray-800 dark:text-gray-200 text-sm">Diamante Local</h3>
                                      <div className="relative w-36 h-36 transform -rotate-45 mb-8 transition-all">
                                         {/* Amenaza */}
                                         <div className="absolute top-0 left-0 w-[48%] h-[48%] border-[2px] border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: getHex(graphics.amenazaColor) }}>
                                            <span className="rotate-45 font-bold text-[8px] text-center" style={{ color: graphics.amenazaColor === 'AMARILLO' ? '#000' : '#fff' }}>AMENAZA</span>
                                         </div>
                                         <div className="absolute bottom-0 left-0 w-[48%] h-[48%] border-[2px] border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: getHex(graphics.colorPers) }}>
                                            <span className="rotate-45 font-bold text-[8px]" style={{ color: graphics.colorPers === 'AMARILLO' ? '#000' : '#fff' }}>PERSONAS</span>
                                         </div>
                                         <div className="absolute top-0 right-0 w-[48%] h-[48%] border-[2px] border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: getHex(graphics.colorRec) }}>
                                            <span className="rotate-45 font-bold text-[8px]" style={{ color: graphics.colorRec === 'AMARILLO' ? '#000' : '#fff' }}>RECURSOS</span>
                                         </div>
                                         <div className="absolute bottom-0 right-0 w-[48%] h-[48%] border-[2px] border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: getHex(graphics.colorSist) }}>
                                            <span className="rotate-45 font-bold text-[8px]" style={{ color: graphics.colorSist === 'AMARILLO' ? '#000' : '#fff' }}>SISTEMAS</span>
                                         </div>
                                      </div>
                                      <div className="w-full text-center">
                                        <div className="text-xl font-black py-1 rounded shadow-inner" style={{ backgroundColor: graphics.riskColorHex, color: graphics.riskTextHex }}>
                                          {graphics.riskLevel}
                                        </div>
                                      </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-border-light">
                                <label className="text-xs font-semibold mb-2 block">Contexto u observaciones de ESTA amenaza:</label>
                                <textarea value={am.descripcionGlobal} onChange={e => updateAmenaza(am.id, { descripcionGlobal: e.target.value })} className="w-full rounded border border-border-medium bg-surface-primary p-2 text-sm min-h-[60px]" placeholder="Ej: Históricamente la planta se inunda en nivel 3..."></textarea>
                              </div>
                          </div>
                        )}
                      </div>
                    );
                 })}
              </div>
            </div>

            {/* Photos Global */}
            <div className="space-y-3 pt-6 border-t border-border-medium">
              <h4 className="font-semibold text-sm">Registro Fotográfico Global (Evidencia General)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {['foto1', 'foto2', 'foto3'].map((foto, idx) => {
                  const labels = ['Vista General', 'Vulnerabilidad / Equipo 1', 'Vulnerabilidad / Equipo 2'];
                  const f = foto as 'foto1' | 'foto2' | 'foto3';
                  return (
                    <div key={foto} className="flex flex-col items-center gap-2">
                      <span className="font-semibold text-xs text-center">{labels[idx]}</span>
                      <div className="relative w-full aspect-square bg-surface-tertiary rounded-xl border-2 border-dashed border-teal-200 flex flex-col items-center justify-center overflow-hidden hover:bg-surface-hover transition-colors">
                        {images[f] ? (
                          <><img src={images[f] as string} className="w-full h-full object-cover" alt={foto} /><button onClick={() => setImages(p => ({ ...p, [f]: null }))} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500"><X className="h-4 w-4" /></button></>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-teal-700">
                            <Camera className="h-8 w-8 mb-2" />
                            <span className="text-xs text-center px-4">Subir Evidencia</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(f, e)} />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate button */}
            <div className="flex justify-center pt-6 gap-4">
              <button 
                 onClick={handleGenerate} 
                 disabled={isGenerating || amenazasList.some(a => !a.amenaza)} 
                 className="group flex items-center px-6 py-3 bg-teal-700 hover:bg-teal-800 border border-teal-700 text-white rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
               >
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                  Generar Informe Multi-Amenaza
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generated report editor */}
      {generatedReport && (
        <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm mt-4">
          <div className="border-b border-border-medium bg-surface-tertiary px-4 py-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-700" />
            <h3 className="font-semibold">Documento de Análisis Documentado</h3>
          </div>
          <div className="p-1 overflow-hidden">
            <div style={{ minHeight: '600px', overflowX: 'auto', width: '100%' }}>
              <div style={{ minWidth: '900px', padding: '16px' }}>
                <LiveEditor key={conversationId || 'new-vuln-editor'} initialContent={generatedReport} onUpdate={setEditorContent} onSave={handleSave} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalisisVulnerabilidad;
