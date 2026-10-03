import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { UpgradeWall } from './UpgradeWall';
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
  Video,
  Film,
  Save,
  Star,
  Flame,
  BrainCircuit,
  Scale,
  Users,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  Sparkles,
  FileText,
  Layers,
  Building2,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import UniversalColumnMapperModal from './UniversalColumnMapperModal';
import ImportMethodModal from './ImportMethodModal';
import { read, utils } from 'xlsx';
import { VULNERABILIDAD_FIELDS } from './moduleFieldDefinitions';
import { exportModuleDataToExcel } from './columnMapperEngine';
import { generateDummyData } from '~/utils/dummyDataGenerator';
import { useAutoLoadReport } from './useAutoLoadReport';
import SingleSelect from './SingleSelect';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExpandingButton from './ExpandingButton';

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
  let rojos = 0,
    amarillos = 0,
    verdes = 0;
  [amColor, pColor, rColor, sColor].forEach((c) => {
    if (c === 'ROJO') rojos++;
    else if (c === 'AMARILLO') amarillos++;
    else verdes++;
  });
  if (rojos >= 3 || (rojos >= 2 && amarillos >= 2) || (rojos >= 1 && amarillos === 3)) return 'ALTO';
  if ((rojos >= 1 && amarillos >= 1) || amarillos >= 3) return 'MEDIO';
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
    ],
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
    ],
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
    ],
  },
};

const matchOrigen = (origen: string) => {
  if (!origen) return 'Natural (Sismo, Inundación...)';
  if (origen.includes('Tecnol') || origen.includes('ncendio')) return 'Tecnológico (Incendio, Derrame...)';
  if (origen.includes('Social') || origen.includes('obo')) return 'Social (Robo, Atentado...)';
  return 'Natural (Sismo, Inundación...)';
};

// ─── Botones de Calificación de Vulnerabilidad con Estilo WAPPY Cápsula Expansible ───
const VULN_SCORE_OPTIONS = [
  {
    value: 0.0,
    label: 'Bueno (0.0)',
    shortLabel: '0.0',
    icon: CheckCircle2,
    activeClass:
      'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30',
    hoverClass: 'hover:border-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  {
    value: 0.5,
    label: 'Parcial (0.5)',
    shortLabel: '0.5',
    icon: MinusCircle,
    activeClass:
      'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm ring-1 ring-amber-500/30',
    hoverClass: 'hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  {
    value: 1.0,
    label: 'Malo (1.0)',
    shortLabel: '1.0',
    icon: AlertCircle,
    activeClass:
      'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm ring-1 ring-rose-500/30',
    hoverClass: 'hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400',
    dotClass: 'bg-rose-500',
  },
];

const WorkerAutocomplete = ({
  value,
  onChange,
  onSelect,
  data,
  searchKey,
  placeholder,
  className,
  wrapperClassName,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = data.filter((w: any) => {
    const v = w[searchKey];
    if (!value) return true;
    return v && String(v).toLowerCase().includes(String(value).toLowerCase());
  });
  const exact =
    value && filtered.find((w: any) => String(w[searchKey]).toLowerCase() === String(value).toLowerCase());

  return (
    <div className={`relative ${wrapperClassName || 'w-full'}`} ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && !exact && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border-medium bg-surface-primary py-1 text-left shadow-xl">
          {filtered.map((w: any, idx: number) => (
            <li
              key={idx}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-surface-hover"
              onClick={() => {
                if (onSelect) onSelect(w);
                else onChange(w[searchKey]);
                setIsOpen(false);
              }}
            >
              <div className="font-semibold">{w.nombre}</div>
              <div className="text-xs text-text-secondary">
                CC: {w.identificacion} {w.cargo ? `• ${w.cargo}` : ''}
              </div>
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
  answers: {},
});

const AnalisisVulnerabilidad = () => {
  const { showToast } = useToastContext();
  const { token, user } = useAuthContext();
  const isPro = user?.role === 'ADMIN' || user?.role === 'PRO' || Boolean(user?.isSubUser);

  const [amenazasList, setAmenazasList] = useState<AmenazaNode[]>([emptyAmenaza()]);
  const [activeAmenazaId, setActiveAmenazaId] = useState<string | null>(null);

  const [images, setImages] = useState<{ [k: string]: string | null }>({
    foto1: null,
    foto2: null,
    foto3: null,
  });
  const [video, setVideo] = useState<string | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [evaluadoresList, setEvaluadoresList] = useState([{ nombre: '', cedula: '', rol: '' }]);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim(),
  );

  useEffect(() => {
    if (user?.personalization?.geminiModels?.sstManagement) {
      setSelectedModel(user.personalization.geminiModels.sstManagement);
    }
  }, [user?.personalization?.geminiModels?.sstManagement]);

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  // Modal de Selección de Método de Importación (3 opciones)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingDirectRows, setPendingDirectRows] = useState<any[]>([]);

  // Homologador Visual de Casillas (Paralelo de Excel)
  const [isColumnMapperOpen, setIsColumnMapperOpen] = useState(false);
  const [columnMapperBuffer, setColumnMapperBuffer] = useState<ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (eEvent) => {
      const buffer = eEvent.target?.result as ArrayBuffer;
      if (buffer) {
        setColumnMapperBuffer(buffer);
        try {
          const wb = read(buffer, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const sheet = wb.Sheets[firstSheetName];
          const rows = utils.sheet_to_json(sheet) as any[];
          setPendingDirectRows(rows);
        } catch {
          setPendingDirectRows([]);
        }
        setIsImportModalOpen(true);
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = '';
  };

  const handleDirectImport = () => {
    setIsImportModalOpen(false);
    if (!pendingDirectRows || pendingDirectRows.length === 0) {
      showToast({ message: 'No se encontraron filas legibles para importación directa.', status: 'warning' });
      return;
    }
    handleConfirmColumnMapping(pendingDirectRows);
  };

  const handleAiImport = () => {
    setIsImportModalOpen(false);
    if (pendingDirectRows.length > 0) {
      handleConfirmColumnMapping(pendingDirectRows);
    }
    handleGenerate();
  };

  const handleConfirmColumnMapping = (mappedRows: any[]) => {
    if (!mappedRows || mappedRows.length === 0) {
      showToast({ message: 'No se encontraron filas con datos para importar.', status: 'warning' });
      return;
    }
    const newThreats: AmenazaNode[] = mappedRows
      .filter((r) => r.amenaza && String(r.amenaza).trim().length > 0)
      .map((r) => {
        const rawOrigen = String(r.origenAmenaza || '').trim();
        const matched = matchOrigen(rawOrigen);

        let nivel = 'Probable';
        const rawNivel = String(r.nivelAmenaza || '').toLowerCase();
        if (rawNivel.includes('posible') || rawNivel.includes('baja') || rawNivel.includes('verde')) {
          nivel = 'Posible';
        } else if (rawNivel.includes('inminente') || rawNivel.includes('alta') || rawNivel.includes('rojo')) {
          nivel = 'Inminente';
        }

        let desc = String(r.descripcionGlobal || '').trim();
        if (r.medidasExistentes && String(r.medidasExistentes).trim()) {
          desc = desc
            ? `${desc}\nMedidas existentes: ${String(r.medidasExistentes).trim()}`
            : `Medidas existentes: ${String(r.medidasExistentes).trim()}`;
        }

        return {
          id: crypto.randomUUID(),
          amenaza: String(r.amenaza).trim(),
          origenAmenaza: matched,
          nivelAmenaza: nivel,
          descripcionGlobal: desc,
          answers: {},
        };
      });

    if (newThreats.length === 0) {
      showToast({
        message: 'No se encontraron amenazas válidas con nombre definido en el archivo.',
        status: 'warning',
      });
      return;
    }

    setAmenazasList((prev) => {
      if (prev.length === 1 && !prev[0].amenaza.trim()) {
        return newThreats;
      }
      return [...prev, ...newThreats];
    });

    setActiveAmenazaId(newThreats[0].id);
    setIsFormExpanded(true);
    setIsColumnMapperOpen(false);
    setColumnMapperBuffer(null);
    showToast({
      message: `¡${newThreats.length} amenazas importadas exitosamente con el Paralelo de Casillas!`,
      status: 'success',
      severity: 'success',
    });
  };

  const handleExportExcel = () => {
    exportModuleDataToExcel(
      VULNERABILIDAD_FIELDS,
      amenazasList,
      `Analisis_Vulnerabilidad_Amenazas_${new Date().toISOString().split('T')[0]}.xlsx`,
      false,
    );
    showToast({
      message: 'Amenazas exportadas a Excel exitosamente',
      status: 'success',
      severity: 'success',
    });
  };

  const handleDownloadTemplate = () => {
    exportModuleDataToExcel(
      VULNERABILIDAD_FIELDS,
      [],
      'Plantilla_Analisis_Vulnerabilidad.xlsx',
      true,
    );
    showToast({
      message: 'Plantilla de Análisis de Vulnerabilidad descargada exitosamente',
      status: 'success',
      severity: 'success',
    });
  };

  useEffect(() => {
    if (amenazasList.length > 0 && !activeAmenazaId) {
      setActiveAmenazaId(amenazasList[0].id);
    }
  }, [amenazasList, activeAmenazaId]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/sgsst/perfil-sociodemografico/data', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.trabajadores?.length) setAvailableWorkers(d.trabajadores);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/sgsst/analisis-vulnerabilidad/data', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.amenazasList) && d.amenazasList.length > 0) {
          const migrated = d.amenazasList.map((a: any) => ({
            ...emptyAmenaza(),
            ...a,
            id: a.id || crypto.randomUUID(),
          }));
          setAmenazasList(migrated);
          setActiveAmenazaId(migrated[0].id);
        }
        if (d && Array.isArray(d.evaluadoresList) && d.evaluadoresList.length > 0) {
          setEvaluadoresList(d.evaluadoresList);
        }
        if (d && d.images) setImages(d.images);
        if (d && d.video) setVideo(d.video);
      })
      .catch(() => {});
  }, [token]);

  const updateAmenaza = (id: string, updates: Partial<AmenazaNode>) => {
    setAmenazasList((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleAnswer = (amId: string, section: string, qId: string, val: number) => {
    setAmenazasList((prev) =>
      prev.map((a) => {
        if (a.id === amId) {
          return { ...a, answers: { ...a.answers, [`${section}_${qId}`]: val } };
        }
        return a;
      }),
    );
  };

  const getSectionScore = (
    answers: Record<string, number>,
    section: 'personas' | 'recursos' | 'sistemas',
    origen: string,
  ) => {
    if (!answers) return 0;
    const originKey = matchOrigen(origen) as keyof typeof QUESTIONS_BY_ORIGIN;
    const questions = QUESTIONS_BY_ORIGIN[originKey]?.[section] || [];
    const sectionAnswers = questions.map((q) => answers[`${section}_${q.id}`]);
    const answeredCount = sectionAnswers.filter((v) => v !== undefined).length;
    if (answeredCount === 0) return 0;
    const sum = sectionAnswers.reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
    return (sum / answeredCount) * 3;
  };

  const calculateThreatGraphics = useCallback((am: AmenazaNode) => {
    const ptsPers = getSectionScore(am.answers, 'personas', am.origenAmenaza);
    const ptsRec = getSectionScore(am.answers, 'recursos', am.origenAmenaza);
    const ptsSist = getSectionScore(am.answers, 'sistemas', am.origenAmenaza);

    const amenazaColor =
      am.nivelAmenaza === 'Inminente' ? 'ROJO' : am.nivelAmenaza === 'Probable' ? 'AMARILLO' : 'VERDE';
    const colorPers = getColorValue(ptsPers);
    const colorRec = getColorValue(ptsRec);
    const colorSist = getColorValue(ptsSist);
    const riskLevel = calculateGlobalRisk(amenazaColor, colorPers, colorRec, colorSist);

    const riskColorHex =
      riskLevel === 'ALTO' ? '#dc2626' : riskLevel === 'MEDIO' ? '#facc15' : '#16a34a';
    const riskTextHex = riskLevel === 'MEDIO' ? '#000' : '#fff';

    return {
      ptsPers,
      ptsRec,
      ptsSist,
      amenazaColor,
      colorPers,
      colorRec,
      colorSist,
      riskLevel,
      riskColorHex,
      riskTextHex,
    };
  }, []);

  // Métricas en vivo para el Banner Superior (Estilo Matriz IPEVR)
  const summaryStats = useMemo(() => {
    const validThreats = amenazasList.filter((a) => a.amenaza?.trim());
    let highRiskCount = 0;
    let medRiskCount = 0;
    amenazasList.forEach((am) => {
      const g = calculateThreatGraphics(am);
      if (g.riskLevel === 'ALTO') highRiskCount++;
      else if (g.riskLevel === 'MEDIO') medRiskCount++;
    });
    const activeEvaluators = evaluadoresList.filter((e) => e.nombre?.trim()).length;
    return {
      totalThreats: amenazasList.length,
      namedThreats: validThreats.length,
      highRiskCount,
      medRiskCount,
      activeEvaluators,
    };
  }, [amenazasList, evaluadoresList, calculateThreatGraphics]);

  const handleSaveData = async (silent = false) => {
    if (!token) return;
    if (!silent) setIsSavingLocal(true);

    const dataToSave = amenazasList.map((am) => {
      const calc = calculateThreatGraphics(am);
      return {
        ...am,
        puntajePersonas: calc.ptsPers,
        puntajeRecursos: calc.ptsRec,
        puntajeSistemas: calc.ptsSist,
        riskLevel: calc.riskLevel,
      };
    });

    try {
      const res = await fetch('/api/sgsst/analisis-vulnerabilidad/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amenazasList: dataToSave, evaluadoresList, images, video }),
      });
      if (res.ok) {
        setLastUpdatedAt(new Date().toISOString());
        if (!silent) {
          showToast({ message: 'Datos de vulnerabilidad guardados exitosamente', status: 'success', severity: 'success' });
        }
      }
    } catch {
      if (!silent) showToast({ message: 'Error al guardar.', status: 'error' });
    } finally {
      if (!silent) setIsSavingLocal(false);
    }
  };

  const handleDummyData = () => {
    const dummy = generateDummyData.vulnerabilidad();
    setAmenazasList(dummy.amenazasList as any);
    setEvaluadoresList(dummy.evaluadoresList);
    setImages({ foto1: null, foto2: null, foto3: null });
    setActiveAmenazaId(dummy.amenazasList[0].id);
    showToast({
      message: 'Datos de prueba generados exitosamente.',
      status: 'success',
      severity: 'success',
    });
  };

  const handleImageUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width,
          h = img.height;
        const MAX = 1200;
        if (w > h) {
          if (w > MAX) {
            h *= MAX / w;
            w = MAX;
          }
        } else {
          if (h > MAX) {
            w *= MAX / h;
            h = MAX;
          }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        setImages((prev) => ({ ...prev, [field]: canvas.toDataURL('image/jpeg', 0.6) }));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 20 * 1024 * 1024) {
        showToast({ message: 'El video es demasiado pesado. Máximo 20MB.', status: 'error' });
        return;
      }

      setIsVideoUploading(true);
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';

      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > 10.5) {
          showToast({ message: 'El video no debe superar los 10 segundos.', status: 'error' });
          setIsVideoUploading(false);
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          setVideo(ev.target?.result as string);
          setIsVideoUploading(false);
          showToast({
            message: 'Video de evidencia cargado.',
            status: 'success',
            severity: 'success',
          });
        };
        reader.onerror = () => setIsVideoUploading(false);
        reader.readAsDataURL(file);
      };

      videoElement.onerror = () => {
        showToast({ message: 'Error al procesar el video.', status: 'error' });
        setIsVideoUploading(false);
      };

      videoElement.src = URL.createObjectURL(file);
    },
    [showToast],
  );

  const removeVideo = () => {
    setVideo(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!isPro && (!conversationId || conversationId === 'new')) {
      try {
        const resCount = await fetch(
          `/api/sgsst/diagnostico/report-history?tags=sgsst-vulnerabilidad`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (resCount.ok) {
          const data = await resCount.json();
          if (data.conversations?.length >= 1) {
            setShowUpgradeModal(true);
            return;
          }
        }
      } catch (e) {}
    }
    const invalid = amenazasList.find((a) => !a.amenaza.trim());
    if (invalid) {
      showToast({
        message: 'Todas las tarjetas deben tener un nombre de Amenaza definido.',
        status: 'warning',
      });
      setActiveAmenazaId(invalid.id);
      return;
    }
    setIsGenerating(true);
    handleSaveData(true);

    const dataToSave = (amenazasList || []).map((am) => {
      const calc = calculateThreatGraphics(am);
      return {
        ...am,
        puntajePersonas: calc.ptsPers,
        puntajeRecursos: calc.ptsRec,
        puntajeSistemas: calc.ptsSist,
        riskLevel: calc.riskLevel,
      };
    });

    try {
      const response = await fetch('/api/sgsst/analisis-vulnerabilidad/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amenazasList: dataToSave,
          evaluadoresList,
          images,
          video,
          modelName: selectedModel,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al generar');
      }
      const data = await response.json();
      setGeneratedReport(data.report);
      editorContentRef.current = data.report;
      liveEditorRef.current?.setHTML(data.report);
      setConversationId(null);
      setReportMessageId(null);
      setIsFormExpanded(false);
      showToast({
        message: 'Análisis Multi-Amenaza generado exitosamente',
        status: 'success',
        severity: 'success',
      });
    } catch (error: any) {
      showToast({ message: error.message || 'Error al generar', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [
    isPro,
    conversationId,
    amenazasList,
    images,
    video,
    selectedModel,
    token,
    evaluadoresList,
    showToast,
    calculateThreatGraphics,
  ]);

  const handleSave = useCallback(async () => {
    const content = editorContentRef.current || generatedReport;
    if (!content || !token) return;

    const isNew = !conversationId || conversationId === 'new';
    if (!isPro && isNew) {
      try {
        const resCount = await fetch(
          `/api/sgsst/diagnostico/report-history?tags=sgsst-vulnerabilidad`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (resCount.ok) {
          const data = await resCount.json();
          if (data.conversations?.length >= 1) {
            setShowUpgradeModal(true);
            return;
          }
        }
      } catch (e) {}
    }

    try {
      if (conversationId && conversationId !== 'new' && reportMessageId) {
        const res = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ conversationId, messageId: reportMessageId, content }),
        });
        if (res.ok) {
          setRefreshTrigger((p) => p + 1);
          showToast({
            message: 'Análisis actualizado',
            status: 'success',
            severity: 'success',
          });
        }
        return;
      }
      const titleName =
        amenazasList.length === 1
          ? amenazasList[0].amenaza
          : `Múltiple (${amenazasList.length} Amenazas)`;
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content,
          title: `Vulnerabilidad: ${titleName} – ${new Date().toLocaleDateString('es-CO')}`,
          tags: ['sgsst-vulnerabilidad'],
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setConversationId(d.conversationId);
        setReportMessageId(d.messageId);
        setRefreshTrigger((p) => p + 1);
        showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
      }
    } catch (e: any) {
      showToast({ message: `Error: ${e.message}`, status: 'error' });
    }
  }, [isPro, generatedReport, conversationId, reportMessageId, token, showToast, amenazasList]);

  const handleSelectReport = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        const res = await fetch(`/api/messages/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const messages = await res.json();
        const last = messages[messages.length - 1];
        if (last?.text) {
          setGeneratedReport(last.text);
          editorContentRef.current = last.text;
          liveEditorRef.current?.setHTML(last.text);
          setConversationId(id);
          setReportMessageId(last.messageId);
          setIsFormExpanded(false);
          showToast({ message: 'Documento cargado', status: 'success', severity: 'success' });
        }
      } catch {
        showToast({ message: 'Error al cargar', status: 'error' });
      }
      setIsHistoryOpen(false);
    },
    [token, showToast],
  );

  useAutoLoadReport({
    token,
    tags: ['sgsst-vulnerabilidad'],
    generatedReport,
    handleSelectReport,
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER DE CONTROL Y ESTADO DE VULNERABILIDAD (ESTILO MATRIZ IPEVR) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        {/* Glow de fondo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Lado Izquierdo: Información y Estado */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/20">
              <Shield className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Matriz de Vulnerabilidad (Diamante de Colores)
                </h2>
                {summaryStats.namedThreats > 0 ? (
                  <div
                    title="Evaluación Activa"
                    className="group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                      <span className="absolute -right-1 -top-1 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                      <span className="text-xs font-black uppercase tracking-wider">Matriz Activa</span>
                    </div>
                  </div>
                ) : (
                  <div
                    title="Pendiente de Amenazas"
                    className="group flex h-7 min-w-[28px] sm:h-8 sm:min-w-[32px] shrink-0 cursor-default items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                      <span className="text-xs font-black uppercase tracking-wider">Sin Amenazas Definidas</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Badges de Métricas Conectadas con Estilo Expansible Estándar WAPPY */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Amenazas Evaluadas */}
                <div
                  title={`${summaryStats.totalThreats} Amenazas en Sesión`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                      {summaryStats.totalThreats}
                    </span>
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {summaryStats.totalThreats}{' '}
                      {summaryStats.totalThreats === 1 ? 'Amenaza Evaluada' : 'Amenazas Evaluadas'}
                    </span>
                  </div>
                </div>

                {/* Riesgo Alto */}
                {summaryStats.highRiskCount > 0 && (
                  <div
                    title={`${summaryStats.highRiskCount} Amenazas en Riesgo ALTO`}
                    className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                  >
                    <div className="relative flex flex-shrink-0 items-center justify-center">
                      <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-rose-500 text-rose-500 shrink-0" />
                      <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                        {summaryStats.highRiskCount}
                      </span>
                    </div>
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                      <span className="text-sm font-bold tracking-wide">
                        {summaryStats.highRiskCount} en Riesgo ALTO
                      </span>
                    </div>
                  </div>
                )}

                {/* Evaluadores / Comité */}
                <div
                  title={`${summaryStats.activeEvaluators} Evaluadores del Comité`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                      {summaryStats.activeEvaluators}
                    </span>
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {summaryStats.activeEvaluators} Integrantes Comité
                    </span>
                  </div>
                </div>

                {/* Conectada al Plan de Emergencias & Oráculo Predictivo */}
                <div
                  title="Conectada al Plan de Emergencias y Oráculo Predictivo"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Conectada al Plan de Emergencias
                    </span>
                  </div>
                </div>

                {/* Decreto 1072 Art. 2.2.4.6.25 */}
                <div
                  title="Decreto 1072 Art. 2.2.4.6.25 / Res. 0312"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Dec. 1072 Art. 2.2.4.6.25
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Acciones Rápidas con Botones Expansibles WAPPY */}
          <div className="flex flex-wrap md:flex-col items-end justify-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <ExpandingButton
                onClick={() => {
                  const nid = crypto.randomUUID();
                  setAmenazasList([{ ...emptyAmenaza(), id: nid }, ...amenazasList]);
                  setActiveAmenazaId(nid);
                  setIsFormExpanded(true);
                }}
                icon={Plus}
                label="Añadir Amenaza"
                variant="teal"
              />
              <ExpandingButton
                onClick={() => handleSaveData(false)}
                icon={Save}
                label="Guardar Matriz"
                variant="outline-teal"
                isLoading={isSavingLocal}
              />
            </div>
            {lastUpdatedAt && (
              <span className="text-[10px] text-text-tertiary">
                Último guardado:{' '}
                {new Date(lastUpdatedAt).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── TOOLBAR FLOTANTE CÁPSULA WAPPY ─── */}
      <SGSSTToolbar
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onAnalyze={handleGenerate}
        isAnalyzing={isGenerating}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSaveLocal={() => handleSaveData(false)}
        isSavingLocal={isSavingLocal}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Analisis_Vulnerabilidad_${new Date().getTime()}`}
        onExportExcel={handleExportExcel}
        onDownloadTemplate={handleDownloadTemplate}
        onDummy={handleDummyData}
        onImportExcel={() => fileInputRef.current?.click()}
        importExcelLabel="Importar Amenazas"
        importExcelTitle="Cargar Amenazas desde Excel con Paralelo de Casillas"
      />

      {isHistoryOpen && (
        <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
          <ReportHistory
            onSelectReport={handleSelectReport}
            isOpen={isHistoryOpen}
            toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
            refreshTrigger={refreshTrigger}
            tags={['sgsst-vulnerabilidad']}
          />
        </div>
      )}

      {/* ─── CONTENEDOR PRINCIPAL DEL FORMULARIO MULTI-AMENAZA ─── */}
      <div className="rounded-3xl border border-border-medium bg-surface-secondary/60 shadow-lg overflow-hidden backdrop-blur-sm">
        <div
          onClick={() => setIsFormExpanded(!isFormExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-500/10 via-surface-tertiary to-transparent cursor-pointer hover:from-teal-500/15 transition-colors border-b border-border-light"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-base text-text-primary tracking-tight block">
                Evaluación Multi-Amenaza y Diamante de Riesgo
              </span>
              <span className="text-xs text-text-secondary">
                Califique Personas, Recursos y Sistemas para cada amenaza identificada en la sede
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
              {amenazasList.length} {amenazasList.length === 1 ? 'amenaza' : 'amenazas'} en sesión
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-primary border border-border-medium text-text-secondary">
              {isFormExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </div>

        {isFormExpanded && (
          <div className="p-6 space-y-8">
            {/* 1. Equipo Evaluador / Comité de Emergencias */}
            <div className="rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-text-primary uppercase tracking-wide">
                      Equipo Evaluador / Comité de Emergencias
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Integrantes responsables de validar e inspeccionar la vulnerabilidad de la sede
                    </p>
                  </div>
                </div>
                <ExpandingButton
                  onClick={() =>
                    setEvaluadoresList([...evaluadoresList, { nombre: '', cedula: '', rol: '' }])
                  }
                  icon={Plus}
                  label="Añadir Evaluador"
                  variant="outline-teal"
                  size="sm"
                />
              </div>

              <div className="space-y-3">
                {evaluadoresList.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-surface-secondary/50 border border-border-light hover:border-teal-500/30 transition-all"
                  >
                    <WorkerAutocomplete
                      value={r.nombre}
                      onChange={(v: string) => {
                        const n = [...evaluadoresList];
                        n[idx].nombre = v;
                        const m = availableWorkers.find((w) => w.nombre === v);
                        if (m) {
                          n[idx].cedula = m.identificacion;
                          if (!n[idx].rol && m.cargo) n[idx].rol = m.cargo;
                        }
                        setEvaluadoresList(n);
                      }}
                      onSelect={(w: any) => {
                        const n = [...evaluadoresList];
                        n[idx].nombre = w.nombre;
                        n[idx].cedula = w.identificacion;
                        if (!n[idx].rol && w.cargo) n[idx].rol = w.cargo;
                        setEvaluadoresList(n);
                      }}
                      data={availableWorkers}
                      searchKey="nombre"
                      placeholder="Nombre completo del evaluador"
                      wrapperClassName="w-full md:w-5/12"
                      className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs font-medium bg-surface-primary text-text-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      value={r.rol}
                      onChange={(e) => {
                        const n = [...evaluadoresList];
                        n[idx].rol = e.target.value;
                        setEvaluadoresList(n);
                      }}
                      className="w-full md:w-4/12 rounded-xl border border-border-medium px-3 py-2 text-xs font-medium bg-surface-primary text-text-primary focus:outline-none focus:border-teal-500"
                      placeholder="Rol en Emergencias / Cargo"
                    />
                    <div className="flex w-full md:w-3/12 items-center gap-2">
                      <WorkerAutocomplete
                        value={r.cedula}
                        onChange={(v: string) => {
                          const n = [...evaluadoresList];
                          n[idx].cedula = v;
                          const m = availableWorkers.find((w) => w.identificacion === v);
                          if (m && !n[idx].nombre) {
                            n[idx].nombre = m.nombre;
                            if (!n[idx].rol && m.cargo) n[idx].rol = m.cargo;
                          }
                          setEvaluadoresList(n);
                        }}
                        onSelect={(w: any) => {
                          const n = [...evaluadoresList];
                          n[idx].cedula = w.identificacion;
                          if (!n[idx].nombre) {
                            n[idx].nombre = w.nombre;
                            if (!n[idx].rol && w.cargo) n[idx].rol = w.cargo;
                          }
                          setEvaluadoresList(n);
                        }}
                        data={availableWorkers}
                        searchKey="identificacion"
                        placeholder="Cédula"
                        wrapperClassName="w-full"
                        className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs font-medium bg-surface-primary text-text-primary focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEvaluadoresList(evaluadoresList.filter((_, i) => i !== idx))
                        }
                        disabled={evaluadoresList.length === 1}
                        title="Eliminar Evaluador"
                        className="group flex h-8 min-w-[32px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-300 transition-all duration-300 px-2 shadow-2xs active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                          <span className="text-[10px] font-bold">Quitar</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Listado de Amenazas y Tarjetas con Diamante */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-text-primary tracking-tight">
                      Listado de Amenazas Identificadas
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Haga clic en cada tarjeta para desplegar su matriz de calificación y rombo de colores
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ExpandingButton
                    onClick={() => {
                      const nid = crypto.randomUUID();
                      setAmenazasList([{ ...emptyAmenaza(), id: nid }, ...amenazasList]);
                      setActiveAmenazaId(nid);
                    }}
                    icon={Plus}
                    label="Nueva Amenaza"
                    variant="teal"
                  />
                </div>
              </div>

              {/* Leyenda Visual WAPPY para Calificación de Vulnerabilidad */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
                <span className="text-[11px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-500" /> Escala de Evaluación (Metodología Diamante):
                </span>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> 0.0 Bueno (Baja Vulnerabilidad)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> 0.5 Parcial (Vulnerabilidad Media)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800/60">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> 1.0 Malo (Alta Vulnerabilidad)
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {amenazasList.map((am, index) => {
                  const isActive = activeAmenazaId === am.id;
                  const graphics = calculateThreatGraphics(am);

                  return (
                    <div
                      key={am.id}
                      className={`rounded-2xl border bg-surface-primary overflow-hidden transition-all duration-300 ${
                        isActive
                          ? 'border-teal-500/80 ring-2 ring-teal-500/20 shadow-xl'
                          : 'border-border-medium hover:border-teal-400/60 shadow-sm'
                      }`}
                    >
                      {/* Header card */}
                      <div
                        onClick={() => setActiveAmenazaId(isActive ? null : am.id)}
                        className={`flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6 cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent'
                            : 'hover:bg-surface-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs font-black shrink-0 shadow-sm">
                            #{amenazasList.length - index}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-base text-text-primary truncate">
                              {am.amenaza || 'Amenaza sin título (Clic para configurar)'}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mt-0.5">
                              <span className="font-semibold text-teal-600 dark:text-teal-400">
                                {am.origenAmenaza}
                              </span>
                              <span>•</span>
                              <span>
                                Probabilidad: <strong>{am.nivelAmenaza}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mini-Rombos + Nivel de Riesgo + Acciones */}
                        <div className="flex items-center gap-3 ml-auto">
                          {/* Mini preview de los 4 colores del diamante */}
                          <div
                            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-secondary border border-border-light"
                            title={`Amenaza: ${graphics.amenazaColor} | Personas: ${graphics.colorPers} | Recursos: ${graphics.colorRec} | Sistemas: ${graphics.colorSist}`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-xs rotate-45 border border-black/20"
                              style={{ backgroundColor: getHex(graphics.amenazaColor) }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-xs rotate-45 border border-black/20"
                              style={{ backgroundColor: getHex(graphics.colorPers) }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-xs rotate-45 border border-black/20"
                              style={{ backgroundColor: getHex(graphics.colorRec) }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-xs rotate-45 border border-black/20"
                              style={{ backgroundColor: getHex(graphics.colorSist) }}
                            />
                          </div>

                          <span
                            className="px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase shadow-sm"
                            style={{
                              backgroundColor: graphics.riskColorHex,
                              color: graphics.riskTextHex,
                            }}
                          >
                            Riesgo {graphics.riskLevel}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAmenazasList((p) => p.filter((x) => x.id !== am.id));
                            }}
                            disabled={amenazasList.length === 1}
                            title="Eliminar Amenaza"
                            className="group flex h-8 min-w-[32px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-300 transition-all duration-300 px-2 shadow-2xs active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4 shrink-0" />
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[90px] group-hover:opacity-100 sm:flex">
                              <span className="text-[10px] font-bold">Eliminar</span>
                            </div>
                          </button>

                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-secondary text-text-secondary">
                            {isActive ? (
                              <ChevronDown className="h-4 w-4 text-teal-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Body card (expanded) */}
                      {isActive && (
                        <div className="p-5 sm:p-6 border-t border-border-light bg-surface-primary space-y-6 animate-in slide-in-from-top-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                                Amenaza a Evaluar (Ej. Sismo, Incendio Estructural, Inundación, Hurto)
                              </label>
                              <input
                                type="text"
                                value={am.amenaza}
                                onChange={(e) => updateAmenaza(am.id, { amenaza: e.target.value })}
                                placeholder="Escriba el nombre de la amenaza..."
                                className="w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-sm font-semibold bg-surface-secondary/40 text-text-primary focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                                Origen de la Amenaza
                              </label>
                              <SingleSelect
                                value={am.origenAmenaza}
                                onChange={(val) => updateAmenaza(am.id, { origenAmenaza: val })}
                                placeholder="Seleccione..."
                                options={[
                                  'Natural (Sismo, Inundación...)',
                                  'Tecnológico (Incendio, Derrame...)',
                                  'Social (Robo, Atentado...)',
                                ]}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col lg:flex-row gap-8">
                            {/* Matriz Left */}
                            <div className="flex-1 space-y-5">
                              {/* Calificación de la Amenaza */}
                              <div className="rounded-2xl border border-border-medium bg-surface-secondary/30 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h5 className="font-black text-text-primary uppercase text-xs tracking-wider">
                                      1. Calificación de la Amenaza (Probabilidad)
                                    </h5>
                                    <p className="text-[11px] text-text-secondary">
                                      Posible (Verde) • Probable (Amarillo) • Inminente (Rojo)
                                    </p>
                                  </div>
                                  <span
                                    className="px-3 py-1 text-xs font-black rounded-lg shadow-sm"
                                    style={{
                                      backgroundColor: getHex(graphics.amenazaColor),
                                      color: graphics.amenazaColor === 'AMARILLO' ? '#000' : '#fff',
                                    }}
                                  >
                                    {graphics.amenazaColor}
                                  </span>
                                </div>
                                <SingleSelect
                                  value={am.nivelAmenaza}
                                  onChange={(val) => updateAmenaza(am.id, { nivelAmenaza: val })}
                                  placeholder="Seleccione..."
                                  options={['Posible', 'Probable', 'Inminente']}
                                />
                              </div>

                              {/* Bloques de Vulnerabilidad: Personas, Recursos, Sistemas */}
                              {(['personas', 'recursos', 'sistemas'] as ('personas' | 'recursos' | 'sistemas')[]).map(
                                (sectionTitle, secIdx) => {
                                  const p = getSectionScore(am.answers, sectionTitle, am.origenAmenaza);
                                  const color = getColorValue(p);
                                  const originKey = matchOrigen(am.origenAmenaza) as keyof typeof QUESTIONS_BY_ORIGIN;
                                  const dynamicQuestions = QUESTIONS_BY_ORIGIN[originKey][sectionTitle];

                                  return (
                                    <div
                                      key={sectionTitle}
                                      className="rounded-2xl border border-border-medium bg-surface-secondary/20 p-4 sm:p-5 shadow-sm space-y-3"
                                    >
                                      <div className="flex items-center justify-between border-b border-border-light pb-3">
                                        <div>
                                          <h5 className="font-black text-text-primary uppercase text-xs tracking-wider">
                                            {secIdx + 2}. Vulnerabilidad en {sectionTitle}
                                          </h5>
                                          <span className="text-[11px] text-text-secondary">
                                            0.0 a 1.0 Bajo (Verde) • 1.1 a 2.0 Medio (Amarillo) • 2.1 a 3.0 Alto (Rojo)
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-surface-primary border border-border-light text-text-primary">
                                            {p.toFixed(2)} / 3.0
                                          </span>
                                          <span
                                            className="px-3 py-1 text-[11px] font-black rounded-lg shadow-sm"
                                            style={{
                                              backgroundColor: getHex(color),
                                              color: color === 'AMARILLO' ? '#000' : '#fff',
                                            }}
                                          >
                                            {color}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="space-y-2.5">
                                        {dynamicQuestions.map((q, i) => {
                                          const currentAns = am.answers[`${sectionTitle}_${q.id}`];
                                          return (
                                            <div
                                              key={q.id}
                                              className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs bg-surface-primary p-3 rounded-xl border border-border-light hover:border-teal-500/30 transition-all"
                                            >
                                              <span className="text-text-primary font-medium leading-relaxed">
                                                <strong className="text-teal-600 dark:text-teal-400 mr-1">
                                                  {i + 1}.
                                                </strong>
                                                {q.q}
                                              </span>

                                              {/* Botonera Flotante Cápsula WAPPY con Auto-Expansión */}
                                              <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm shrink-0 self-end xl:self-auto">
                                                {VULN_SCORE_OPTIONS.map((opt) => {
                                                  const isSelected = currentAns === opt.value;
                                                  const IconComp = opt.icon;
                                                  return (
                                                    <button
                                                      key={opt.value}
                                                      type="button"
                                                      onClick={() =>
                                                        handleAnswer(am.id, sectionTitle, q.id, opt.value)
                                                      }
                                                      title={opt.label}
                                                      className={`group flex h-8 min-w-[32px] items-center justify-center rounded-xl border px-2 transition-all duration-300 active:scale-95 cursor-pointer ${
                                                        isSelected
                                                          ? opt.activeClass
                                                          : `border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 ${opt.hoverClass}`
                                                      }`}
                                                    >
                                                      <IconComp className="h-3.5 w-3.5 shrink-0" />
                                                      <div
                                                        className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                                                          isSelected
                                                            ? 'ml-1.5 max-w-[110px] opacity-100'
                                                            : 'max-w-0 opacity-0 group-hover:ml-1.5 group-hover:max-w-[110px] group-hover:opacity-100'
                                                        }`}
                                                      >
                                                        <span className="text-[11px] font-bold">
                                                          {opt.label}
                                                        </span>
                                                      </div>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>

                            {/* Diamond Right */}
                            <div className="w-full lg:w-72 flex-shrink-0 flex flex-col items-center pt-2">
                              <div className="sticky top-10 flex flex-col items-center w-full bg-gradient-to-b from-surface-secondary/60 to-surface-primary border border-border-medium p-6 rounded-3xl shadow-xl">
                                <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-1">
                                  Geometría del Riesgo
                                </span>
                                <h3 className="font-black text-center mb-8 text-text-primary text-base">
                                  Diamante de Colores
                                </h3>

                                <div className="relative w-40 h-40 transform -rotate-45 mb-10 transition-all">
                                  {/* Personas (Top-Right in -45deg rotation = Top vertex) */}
                                  <div
                                    className="absolute top-0 left-0 w-[48%] h-[48%] rounded-tl-lg border-2 border-slate-800 dark:border-white/80 shadow-md flex items-center justify-center transition-colors duration-500"
                                    style={{ backgroundColor: getHex(graphics.amenazaColor) }}
                                  >
                                    <span
                                      className="rotate-45 font-black text-[9px] text-center tracking-tighter"
                                      style={{
                                        color: graphics.amenazaColor === 'AMARILLO' ? '#000' : '#fff',
                                      }}
                                    >
                                      AMENAZA
                                    </span>
                                  </div>
                                  <div
                                    className="absolute bottom-0 left-0 w-[48%] h-[48%] rounded-bl-lg border-2 border-slate-800 dark:border-white/80 shadow-md flex items-center justify-center transition-colors duration-500"
                                    style={{ backgroundColor: getHex(graphics.colorPers) }}
                                  >
                                    <span
                                      className="rotate-45 font-black text-[9px] tracking-tighter"
                                      style={{
                                        color: graphics.colorPers === 'AMARILLO' ? '#000' : '#fff',
                                      }}
                                    >
                                      PERSONAS
                                    </span>
                                  </div>
                                  <div
                                    className="absolute top-0 right-0 w-[48%] h-[48%] rounded-tr-lg border-2 border-slate-800 dark:border-white/80 shadow-md flex items-center justify-center transition-colors duration-500"
                                    style={{ backgroundColor: getHex(graphics.colorRec) }}
                                  >
                                    <span
                                      className="rotate-45 font-black text-[9px] tracking-tighter"
                                      style={{
                                        color: graphics.colorRec === 'AMARILLO' ? '#000' : '#fff',
                                      }}
                                    >
                                      RECURSOS
                                    </span>
                                  </div>
                                  <div
                                    className="absolute bottom-0 right-0 w-[48%] h-[48%] rounded-br-lg border-2 border-slate-800 dark:border-white/80 shadow-md flex items-center justify-center transition-colors duration-500"
                                    style={{ backgroundColor: getHex(graphics.colorSist) }}
                                  >
                                    <span
                                      className="rotate-45 font-black text-[9px] tracking-tighter"
                                      style={{
                                        color: graphics.colorSist === 'AMARILLO' ? '#000' : '#fff',
                                      }}
                                    >
                                      SISTEMAS
                                    </span>
                                  </div>
                                </div>

                                <div className="w-full space-y-2 text-center">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                                    Interpretación de Riesgo Global
                                  </span>
                                  <div
                                    className="text-lg font-black py-2 px-4 rounded-2xl shadow-md tracking-wider uppercase"
                                    style={{
                                      backgroundColor: graphics.riskColorHex,
                                      color: graphics.riskTextHex,
                                    }}
                                  >
                                    RIESGO {graphics.riskLevel}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-border-light">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 block">
                              Contexto Específico u Observaciones de Campo para esta Amenaza:
                            </label>
                            <textarea
                              value={am.descripcionGlobal}
                              onChange={(e) =>
                                updateAmenaza(am.id, { descripcionGlobal: e.target.value })
                              }
                              className="w-full rounded-2xl border border-border-medium bg-surface-secondary/30 p-3.5 text-sm min-h-[75px] text-text-primary focus:outline-none focus:border-teal-500"
                              placeholder="Ej: Ubicación en zona sísmica intermedia, almacenamiento de combustibles en bodega sur, antecedentes en el sector..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Registro Fotográfico Global */}
            <div className="rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border-light pb-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-text-primary uppercase tracking-wide">
                    Registro Fotográfico de Evidencia (Inspección Visual)
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Las fotografías cargadas serán analizadas por Tenshi e incluidas en el anexo del informe oficial
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {['foto1', 'foto2', 'foto3'].map((foto, idx) => {
                  const labels = [
                    'Vista General / Entorno',
                    'Evidencia de Vulnerabilidad 1',
                    'Evidencia de Vulnerabilidad 2',
                  ];
                  const f = foto as 'foto1' | 'foto2' | 'foto3';
                  return (
                    <div key={foto} className="flex flex-col items-center gap-2">
                      <span className="font-bold text-xs text-text-secondary text-center">
                        {labels[idx]}
                      </span>
                      <div className="relative w-full aspect-video bg-surface-secondary/60 rounded-2xl border-2 border-dashed border-teal-500/30 flex flex-col items-center justify-center overflow-hidden hover:border-teal-500/60 hover:bg-surface-hover transition-all">
                        {images[f] ? (
                          <>
                            <img
                              src={images[f] as string}
                              className="w-full h-full object-cover"
                              alt={foto}
                            />
                            <button
                              type="button"
                              onClick={() => setImages((p) => ({ ...p, [f]: null }))}
                              className="absolute top-2.5 right-2.5 bg-black/60 p-1.5 rounded-xl text-white hover:bg-rose-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-teal-600 p-4">
                            <Camera className="h-7 w-7 mb-2 text-teal-500/80" />
                            <span className="text-xs font-bold text-center">
                              Subir Fotografía
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(f, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Video de Evidencia Dinámica */}
            <div className="rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-text-primary uppercase tracking-wide">
                      Video de Evidencia Dinámica (Opcional)
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Permite a la IA evaluar recorridos, rutas de evacuación y riesgos en tiempo real
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 px-2.5 py-1 rounded-full font-black uppercase">
                  Máx. 10 Segundos
                </span>
              </div>

              <div className="bg-surface-secondary/30 border-2 border-dashed border-teal-500/30 rounded-2xl p-6 transition-all hover:border-teal-500/60">
                {!video ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400">
                      {isVideoUploading ? (
                        <Loader2 className="h-7 w-7 animate-spin" />
                      ) : (
                        <Video className="h-7 w-7" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-text-primary uppercase tracking-wider">
                        Adjuntar Recorrido en Video de la Sede
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Formato MP4/WebM hasta 20MB y 10 segundos de duración
                      </p>
                    </div>
                    <label className="group relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-5 py-2 text-xs font-bold shadow-md transition-all active:scale-95">
                      <Video className="h-4 w-4" />
                      <span>{isVideoUploading ? 'Procesando...' : 'Seleccionar Video'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                        disabled={isVideoUploading}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-w-md mx-auto shadow-xl border-2 border-teal-500">
                      <video src={video} controls className="w-full h-full" />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute top-3 right-3 bg-rose-600 text-white p-2 rounded-xl shadow-lg hover:bg-rose-700 transition-colors z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-center text-xs text-teal-600 dark:text-teal-400 font-bold">
                      ✓ Evidencia en video lista para análisis multimodal con Tenshi
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── EDITOR EN VIVO DEL INFORME (LIVE EDITOR) ─── */}
      <div className="mt-2">
        <CollapsibleReportBox
          onSave={handleSave}
          onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          isHistoryOpen={isHistoryOpen}
          title="Análisis de Vulnerabilidad (Diamante de Colores)"
          icon={<Shield className="h-5 w-5 text-teal-700" />}
          actions={
            <ExportDropdown
              content={editorContentRef.current || generatedReport || ''}
              fileName="Informe_AnalisisVulnerabilidad"
              reportType="general"
            />
          }
        >
          <div className="w-full min-w-0">
            <LiveEditor
              ref={liveEditorRef}
              paperMode={true}
              initialContent={generatedReport}
              onUpdate={(html) => {
                editorContentRef.current = html;
              }}
              reportSourceData={amenazasList}
            />
          </div>
        </CollapsibleReportBox>
      </div>

      {/* Upgrade Modal (Freemium Teaser) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm"
            >
              Cerrar ✕
            </button>
            <div className="bg-surface-primary rounded-3xl shadow-2xl overflow-hidden">
              <UpgradeWall
                title="Límite Gratuito Alcanzado"
                description="Has alcanzado el límite para este módulo. Adquiere Premium para generar registros ilimitados."
                plan="USER_IPEVAR"
                isCompact={true}
                hideFeatures={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Homologador Visual de Casillas (Paralelo de Excel) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Modal de Selección de Método de Importación (3 opciones) */}
      <ImportMethodModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setPendingDirectRows([]);
          setColumnMapperBuffer(null);
        }}
        rowsCount={pendingDirectRows.length}
        hasColumnMapper={!!columnMapperBuffer}
        onSelectColumnMapper={() => {
          setIsImportModalOpen(false);
          setIsColumnMapperOpen(true);
        }}
        hasAi={true}
        onSelectAi={handleAiImport}
        onSelectDirect={handleDirectImport}
        moduleTitle="Análisis de Vulnerabilidad"
        aiDescription="Importa las amenazas de tu archivo y ejecuta el cálculo integral del Diamante de Colores con IA."
      />

      <UniversalColumnMapperModal
        isOpen={isColumnMapperOpen}
        moduleKey="analisis-vulnerabilidad"
        fileData={columnMapperBuffer}
        targetFields={VULNERABILIDAD_FIELDS}
        moduleTitle="Análisis de Vulnerabilidad y Emergencias"
        onClose={() => {
          setIsColumnMapperOpen(false);
          setColumnMapperBuffer(null);
        }}
        onConfirmImport={handleConfirmColumnMapping}
      />
    </div>
  );
};

export default AnalisisVulnerabilidad;
