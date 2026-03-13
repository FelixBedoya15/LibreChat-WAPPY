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

const QUESTIONS = {
  personas: [
    { id: 'p1', q: '¿Existe un comité de emergencias o brigada constituida?' },
    { id: 'p2', q: '¿El personal ha recibido capacitación en emergencias en el último año?' },
    { id: 'p3', q: '¿Se han realizado simulacros de esta amenaza específica?' },
    { id: 'p4', q: '¿La dotación (EPP) de la brigada es adecuada para esta amenaza?' },
  ],
  recursos: [
    { id: 'r1', q: '¿Se cuenta con extintores, redes contra incendio o equipos de control vigentes?' },
    { id: 'r2', q: '¿Hay disponibilidad inmediata de botiquín, camillas y equipos de rescate?' },
    { id: 'r3', q: '¿Se tiene sistema de alarma audible y visible en todas las áreas?' },
    { id: 'r4', q: '¿Existen recursos financieros asignados para atención de esta emergencia?' },
  ],
  sistemas: [
    { id: 's1', q: '¿Están claramente definidas y señalizadas las rutas de evacuación?' },
    { id: 's2', q: '¿Se cuenta con sistemas alternos de energía o comunicaciones?' },
    { id: 's3', q: '¿El plan de contingencia específico para esta amenaza está documentado?' },
    { id: 's4', q: '¿Los servicios públicos (agua, gas, luz) tienen sistemas de corte de emergencia?' },
  ]
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

const AnalisisVulnerabilidad = () => {
  const { showToast } = useToastContext();
  const { token } = useAuthContext();

  const [formData, setFormData] = useState({
    amenaza: '',
    origenAmenaza: 'Social',
    nivelAmenaza: 'Probable',
    descripcionGlobal: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const handleAnswer = (section: string, id: string, val: number) => {
    setAnswers(prev => ({ ...prev, [`${section}_${id}`]: val }));
  };

  const getSectionScore = (section: 'personas'|'recursos'|'sistemas') => {
    const sectionAnswers = QUESTIONS[section].map(q => answers[`${section}_${q.id}`]);
    const answeredCount = sectionAnswers.filter(v => v !== undefined).length;
    if (answeredCount === 0) return 0;
    const sum = sectionAnswers.reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
    // La metodología evalúa sobre 3.0 por aspecto: (sumatoria / cantidad de preguntas contestadas) * 3
    return (sum / answeredCount) * 3;
  };

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
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

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
        if (Object.keys(d.formData || {}).length > 0) {
          setFormData(prev => ({ ...prev, ...d.formData }));
          if (d.formData.answers) setAnswers(d.formData.answers);
        }
        if (d.evaluadoresList?.length) setEvaluadoresList(d.evaluadoresList);
        if (d.images) setImages(d.images);
      }).catch(() => {});
  }, [token]);

  const handleSaveData = async (silent = false) => {
    if (!token) return;
    const ptsPers = getSectionScore('personas');
    const ptsRec = getSectionScore('recursos');
    const ptsSist = getSectionScore('sistemas');

    const dataToSave = {
      ...formData,
      answers,
      puntajePersonas: ptsPers,
      puntajeRecursos: ptsRec,
      puntajeSistemas: ptsSist
    };

    try {
      const res = await fetch('/api/sgsst/analisis-vulnerabilidad/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ formData: dataToSave, evaluadoresList, images })
      });
      if (res.ok && !silent) showToast({ message: 'Datos guardados correctamente.', status: 'success' });
    } catch { if (!silent) showToast({ message: 'Error al guardar.', status: 'error' }); }
  };

  const handleVoiceInput = () => {
    if (isListening) { try { recognitionRef.current?.stop(); } catch {} setIsListening(false); setInterimText(''); return; }
    // @ts-ignore
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast({ message: 'Navegador no soporta voz. Use Chrome.', status: 'error' }); return; }
    try {
      const r = new SR(); recognitionRef.current = r;
      r.lang = 'es-CO'; r.continuous = true; r.interimResults = true;
      r.onstart = () => { setIsListening(true); setInterimText(''); };
      r.onresult = (e: any) => {
        let interim = '', finalText = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        if (finalText) setFormData(p => ({ ...p, descripcionGlobal: p.descripcionGlobal + (p.descripcionGlobal && !p.descripcionGlobal.endsWith(' ') ? ' ' : '') + finalText }));
        setInterimText(interim);
      };
      r.onerror = () => { setIsListening(false); setInterimText(''); };
      r.onend = () => { setIsListening(false); setInterimText(''); };
      r.start();
    } catch { setIsListening(false); }
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

  const ptsPers = getSectionScore('personas');
  const ptsRec = getSectionScore('recursos');
  const ptsSist = getSectionScore('sistemas');

  const amenazaColor = formData.nivelAmenaza === 'Inminente' ? 'ROJO' : (formData.nivelAmenaza === 'Probable' ? 'AMARILLO' : 'VERDE');
  const colorPers = getColorValue(ptsPers);
  const colorRec = getColorValue(ptsRec);
  const colorSist = getColorValue(ptsSist);
  const riskLevel = calculateGlobalRisk(amenazaColor, colorPers, colorRec, colorSist);

  const riskColorHex = riskLevel === 'ALTO' ? '#dc2626' : (riskLevel === 'MEDIO' ? '#facc15' : '#16a34a');
  const riskTextHex = riskLevel === 'MEDIO' ? '#000' : '#fff';

  const handleGenerate = useCallback(async () => {
    if (!formData.amenaza) {
      showToast({ message: 'Debe especificar la Amenaza evaluada antes de generar.', status: 'warning' });
      return;
    }
    setIsGenerating(true);
    handleSaveData(true);
    
    const dataToSave = {
      ...formData, answers, puntajePersonas: ptsPers, puntajeRecursos: ptsRec, puntajeSistemas: ptsSist
    };

    try {
      const response = await fetch('/api/sgsst/analisis-vulnerabilidad/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ formData: dataToSave, evaluadoresList, images, modelName: selectedModel }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Error al generar'); }
      const data = await response.json();
      setGeneratedReport(data.report);
      setEditorContent(data.report);
      setIsFormExpanded(false);
      showToast({ message: 'Análisis de Vulnerabilidad generado', status: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Error al generar', status: 'error' });
    } finally { setIsGenerating(false); }
  }, [formData, answers, ptsPers, ptsRec, ptsSist, images, selectedModel, token, evaluadoresList, showToast]);

  const handleSave = useCallback(async () => {
    const content = editorContent || generatedReport;
    if (!content || !token) return;
    try {
      if (conversationId && conversationId !== 'new' && reportMessageId) {
        const res = await fetch('/api/sgsst/diagnostico/save-report', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ conversationId, messageId: reportMessageId, content }) });
        if (res.ok) { setRefreshTrigger(p => p + 1); showToast({ message: 'Análisis actualizado', status: 'success' }); }
        return;
      }
      const res = await fetch('/api/sgsst/diagnostico/save-report', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ content, title: `Vulnerabilidad: ${formData.amenaza} – ${new Date().toLocaleDateString('es-CO')}`, tags: ['sgsst-vulnerabilidad'] }) });
      if (res.ok) { const d = await res.json(); setConversationId(d.conversationId); setReportMessageId(d.messageId); setRefreshTrigger(p => p + 1); showToast({ message: 'Análisis guardado permanentemente', status: 'success' }); }
    } catch (e: any) { showToast({ message: `Error: ${e.message}`, status: 'error' }); }
  }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast, formData.amenaza]);

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
          <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Análisis con IA</span>
        </button>
        <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isGenerating} />
        {generatedReport && (
          <>
            <button onClick={handleSave} className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
              <AnimatedIcon name="save" size={20} className="text-gray-500" />
              <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar Informe</span>
            </button>
            <ExportDropdown content={editorContent || ''} fileName={`Analisis_Vulnerabilidad_${formData.amenaza.replace(/ /g, '_')}`} />
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
            {isFormExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <Shield className="h-5 w-5 text-teal-700" />
            <span className="font-semibold">Análisis de Vulnerabilidad (Diamante de Riesgos)</span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: riskColorHex, color: riskTextHex }}>
            Riesgo: {riskLevel}
          </span>
        </button>

        {isFormExpanded && (
          <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Amenaza a Evaluar (Ej. Incendio, Sismo, Robo)</label>
                <input type="text" value={formData.amenaza} onChange={e => setFormData(p => ({ ...p, amenaza: e.target.value }))} placeholder="Debe priorizar una amenaza por análisis" className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary border-teal-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Origen de la Amenaza</label>
                <select value={formData.origenAmenaza} onChange={e => setFormData(p => ({ ...p, origenAmenaza: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm bg-surface-primary text-text-primary focus:border-teal-500">
                  <option>Natural (Sismo, Inundación...)</option>
                  <option>Tecnológico (Incendio, Derrame...)</option>
                  <option>Social (Robo, Atentado...)</option>
                </select>
              </div>
            </div>

            {/* Evaluators */}
            <div className="space-y-3 pt-3 border-t">
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

            {/* ═══════════ DIAMANTE CALCULATOR ═══════════ */}
            <div className="pt-6 border-t border-border-medium flex flex-col md:flex-row gap-8">
              
              {/* Cuestionarios Left Column */}
              <div className="flex-1 space-y-6">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-teal-700" /> Matriz de Calificación
                </h4>

                {/* Amenaza */}
                <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 uppercase">1. AMENAZA</h5>
                    <span className="px-3 py-1 text-xs font-bold rounded" style={{ backgroundColor: getHex(amenazaColor), color: amenazaColor === 'AMARILLO' ? '#000' : '#fff' }}>{amenazaColor}</span>
                  </div>
                  <select value={formData.nivelAmenaza} onChange={e => setFormData(p => ({ ...p, nivelAmenaza: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-gray-300">
                    <option value="Posible">POSIBLE (Nunca ha sucedido, es muy raro) - VERDE</option>
                    <option value="Probable">PROBABLE (Ya ha ocurrido u ocurre a veces) - AMARILLO</option>
                    <option value="Inminente">INMINENTE (Es seguro que ocurra o es muy frecuente) - ROJO</option>
                  </select>
                </div>

                {/* Vulnerabilidad Sections */}
                {['personas', 'recursos', 'sistemas'].map((sectionTitle) => {
                  const section = sectionTitle as 'personas'|'recursos'|'sistemas';
                  const p = getSectionScore(section);
                  const color = getColorValue(p);
                  return (
                    <div key={section} className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3 border-b pb-2">
                        <h5 className="font-bold text-gray-800 dark:text-gray-100 uppercase">2. VULN. EN {sectionTitle}</h5>
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-mono font-bold text-gray-500">{p.toFixed(2)}/3.0 pts</span>
                           <span className="px-3 py-1 text-xs font-bold rounded" style={{ backgroundColor: getHex(color), color: color === 'AMARILLO' ? '#000' : '#fff' }}>{color}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {QUESTIONS[section].map((q, i) => (
                          <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-700 dark:text-gray-300">{i+1}. {q.q}</span>
                            <div className="flex shrink-0 border rounded overflow-hidden">
                              <button onClick={() => handleAnswer(section, q.id, 0.0)} className={`px-2 py-1 text-xs font-bold border-r ${answers[`${section}_${q.id}`] === 0.0 ? 'bg-green-100 text-green-700' : 'bg-white hover:bg-gray-100 text-gray-500'}`}>Bueno/Sí (0.0)</button>
                              <button onClick={() => handleAnswer(section, q.id, 0.5)} className={`px-2 py-1 text-xs font-bold border-r ${answers[`${section}_${q.id}`] === 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-white hover:bg-gray-100 text-gray-500'}`}>Medio/Parcial (0.5)</button>
                              <button onClick={() => handleAnswer(section, q.id, 1.0)} className={`px-2 py-1 text-xs font-bold ${answers[`${section}_${q.id}`] === 1.0 ? 'bg-red-100 text-red-700' : 'bg-white hover:bg-gray-100 text-gray-500'}`}>Malo/No (1.0)</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Diamond Visualizer Right Column */}
              <div className="w-full md:w-80 flex-shrink-0 flex flex-col items-center pt-8">
                 <div className="sticky top-10 flex flex-col items-center w-full bg-white dark:bg-gray-800 border p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-center mb-6 text-gray-800 dark:text-gray-200">Diamante Consolidado</h3>
                    
                    {/* The Diamond logic */}
                    <div className="relative w-48 h-48 transform -rotate-45 mb-10 transition-all">
                       {/* Amenaza */}
                       <div className="absolute top-0 left-0 w-[48%] h-[48%] border-2 border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: getHex(amenazaColor) }}>
                          <span className="rotate-45 font-bold text-[10px]" style={{ color: amenazaColor === 'AMARILLO' ? '#000' : '#fff' }}>AMENAZA</span>
                       </div>
                       {/* Personas */}
                       <div className="absolute bottom-0 left-0 w-[48%] h-[48%] border-2 border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: getHex(colorPers) }}>
                          <span className="rotate-45 font-bold text-[10px]" style={{ color: colorPers === 'AMARILLO' ? '#000' : '#fff' }}>PERSONAS</span>
                       </div>
                       {/* Recursos */}
                       <div className="absolute top-0 right-0 w-[48%] h-[48%] border-2 border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: getHex(colorRec) }}>
                          <span className="rotate-45 font-bold text-[10px]" style={{ color: colorRec === 'AMARILLO' ? '#000' : '#fff' }}>RECURSOS</span>
                       </div>
                       {/* Sistemas */}
                       <div className="absolute bottom-0 right-0 w-[48%] h-[48%] border-2 border-slate-700 shadow-inner flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: getHex(colorSist) }}>
                          <span className="rotate-45 font-bold text-[10px]" style={{ color: colorSist === 'AMARILLO' ? '#000' : '#fff' }}>SISTEMAS</span>
                       </div>
                    </div>

                    <div className="w-full text-center">
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Riesgo Global</div>
                      <div className="text-2xl font-black py-2 rounded-lg" style={{ backgroundColor: riskColorHex, color: riskTextHex }}>
                        {riskLevel}
                      </div>
                      <p className="text-[11px] mt-4 text-gray-500 leading-tight">
                        Se calcula cruzando las vulnerabilidades de la entidad vs el nivel de la amenaza analizada (Ley 1523).
                      </p>
                    </div>
                 </div>
              </div>

            </div>

            {/* Description / notes with voice */}
            <div className="space-y-3 pt-6 border-t border-border-medium">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Contexto y Variables de la Instalación (Opcional - Voz)</h4>
                <button onClick={handleVoiceInput} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-surface-secondary hover:bg-surface-hover text-text-primary border-border-light'}`}>
                  <span className="relative flex h-3 w-3">{isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}<span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-red-500' : 'bg-teal-700'}`}></span></span>
                  {isListening ? 'Escuchando...' : 'Activar Micrófono'}
                </button>
              </div>
              <textarea
                value={formData.descripcionGlobal + (interimText ? (formData.descripcionGlobal.endsWith(' ') ? '' : ' ') + interimText : '')}
                onChange={e => { if (!isListening) setFormData(p => ({ ...p, descripcionGlobal: e.target.value })); }}
                readOnly={isListening}
                className={`w-full rounded-xl border-2 ${isListening ? 'border-red-300 bg-red-50/10' : 'border-dashed border-teal-200 bg-teal-50/10 focus:border-teal-400'} p-4 text-sm text-text-primary min-h-[100px] resize-y focus:outline-none transition-colors`}
                placeholder="Añade particularidades estructurales, sociales o de maquinaria que influyan en el riesgo ante esta amenaza..."
              />
            </div>

            {/* Photos */}
            <div className="space-y-3 pt-4 border-t border-border-medium">
              <h4 className="font-semibold text-sm">Registro Fotográfico de Vulnerabilidades / Instalaciones</h4>
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
            <div className="flex justify-center pt-6">
              <button onClick={handleGenerate} disabled={isGenerating || !formData.amenaza} className="group flex items-center px-6 py-3 bg-teal-700 hover:bg-teal-800 border border-teal-700 text-white rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1">
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">
                  {!formData.amenaza ? 'Defina una amenaza' : 'Generar Plan de Acción y Análisis (IA)'}
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
