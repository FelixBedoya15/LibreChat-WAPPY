import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Sparkles, Save, History, Loader2,
    ChevronDown, ChevronRight, AlertTriangle, Shield,
    Database, Zap, FileText, LayoutList, Layers,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';

// ─── Styled Tooltip ───────────────────────────────────────────────────
const Tip = ({ children, text }: { children: React.ReactNode; text: string }) => (
    <span className="relative group/tip inline-flex items-center">
        {children}
        <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100]
            opacity-0 group-hover/tip:opacity-100 transition-all duration-200 scale-95 group-hover/tip:scale-100
            w-64 max-w-xs px-3 py-2 rounded-xl text-[11px] leading-relaxed font-normal normal-case text-left
            text-text-primary bg-surface-secondary border border-border-medium shadow-lg
            backdrop-blur-sm">
            {text}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px] border-4 border-transparent border-b-border-medium" />
        </span>
    </span>
);

// ─── Types ────────────────────────────────────────────────────────────
interface PeligroItem {
    id: string;
    descripcionPeligro: string;
    clasificacion: string;
    efectosPosibles: string;
    nivelDeficiencia: number;
    nivelExposicion: number;
    nivelProbabilidad: number;
    interpretacionNP: string;
    nivelConsecuencia: number;
    nivelRiesgo: number;
    interpretacionNR: string;
    aceptabilidad: string;
    numExpuestos: number;
    deficienciaHigienica: string;
    valoracionCuantitativa: string;
    nrFinal: number;
    factorReduccion: number;
    costoIntervencion: string;
    factorCosto: number;
    factorJustificacion: number;
    medidaSeleccionada: string;
    justificacion: string;

    // Medidas de intervención individuales
    eliminacion: string;
    fr_eliminacion?: number; costo_eliminacion?: string; fc_eliminacion?: number; j_eliminacion?: number;

    sustitucion: string;
    fr_sustitucion?: number; costo_sustitucion?: string; fc_sustitucion?: number; j_sustitucion?: number;

    controlIngenieria: string;
    fr_ingenieria?: number; costo_ingenieria?: string; fc_ingenieria?: number; j_ingenieria?: number;

    controlAdministrativo: string;
    fr_administrativo?: number; costo_administrativo?: string; fc_administrativo?: number; j_administrativo?: number;

    epp: string;
    fr_epp?: number; costo_epp?: string; fc_epp?: number; j_epp?: number;

    completedByAI: boolean;
}

interface ProcesoEntry {
    id: string;
    proceso: string;
    zona: string;
    actividad: string;
    tarea: string;
    rutinario: boolean;
    fuenteGeneradora: string;
    medioExistente: string;
    individuoControl: string;
    peligros: PeligroItem[];
}

const EMPTY_HAZARD: Omit<PeligroItem, 'id'> = {
    descripcionPeligro: '', clasificacion: '', efectosPosibles: '',
    nivelDeficiencia: 0, nivelExposicion: 0, nivelProbabilidad: 0,
    interpretacionNP: '', nivelConsecuencia: 0, nivelRiesgo: 0,
    interpretacionNR: '', aceptabilidad: '', numExpuestos: 0,
    deficienciaHigienica: '', valoracionCuantitativa: '',
    nrFinal: 0, factorReduccion: 0, costoIntervencion: '', factorCosto: 0, factorJustificacion: 0, medidaSeleccionada: '', justificacion: '',

    eliminacion: '', fr_eliminacion: 0, costo_eliminacion: '', fc_eliminacion: 0, j_eliminacion: 0,
    sustitucion: '', fr_sustitucion: 0, costo_sustitucion: '', fc_sustitucion: 0, j_sustitucion: 0,
    controlIngenieria: '', fr_ingenieria: 0, costo_ingenieria: '', fc_ingenieria: 0, j_ingenieria: 0,
    controlAdministrativo: '', fr_administrativo: 0, costo_administrativo: '', fc_administrativo: 0, j_administrativo: 0,
    epp: '', fr_epp: 0, costo_epp: '', fc_epp: 0, j_epp: 0,

    completedByAI: false,
};

const EMPTY_PROCESO: Omit<ProcesoEntry, 'id' | 'peligros'> = {
    proceso: '', zona: '', actividad: '', tarea: '', rutinario: true,
    fuenteGeneradora: '', medioExistente: '', individuoControl: '',
};

const COST_FACTOR_OPTIONS = [
    { label: 'Más de 150 SMMLV', d: 10 },
    { label: '60 a 150 SMMLV', d: 8 },
    { label: '30 a 59 SMMLV', d: 6 },
    { label: '3 a 29 SMMLV', d: 4 },
    { label: '0.3 a 2.9 SMMLV', d: 2 },
    { label: '0.06 a 0.29 SMMLV', d: 1 },
    { label: 'Menos de 0.06 SMMLV', d: 0.5 },
];

const GTC45_CATEGORIES: Record<string, string[]> = {
    'Biológico': [
        'Virus', 'Bacterias', 'Hongos', 'Ricketsias', 'Parásitos', 'Picaduras', 'Mordeduras', 'Fluidos o excrementos'
    ],
    'Físico': [
        'Ruido (de impacto, intermitente, continuo)', 'Iluminación (luz visible por exceso o deficiencia)',
        'Vibración (cuerpo entero, segmentaria)', 'Temperaturas extremas (calor y frío)',
        'Presión atmosférica (normal y ajustada)', 'Radiaciones ionizantes (rayos x, gama, beta y alfa)',
        'Radiaciones no ionizantes (láser, ultravioleta, infrarroja, radiofrecuencia, microondas)'
    ],
    'Químico': [
        'Polvos orgánicos inorgánicos', 'Fibras', 'Líquidos (nieblas y rocíos)', 'Gases y vapores',
        'Humos metálicos, no metálicos', 'Material particulado'
    ],
    'Psicosocial': [
        'Gestión organizacional (estilo de mando, pago, contratación, participación, inducción y capacitación, bienestar social, evaluación del desempeño, manejo de cambios)',
        'Características de la organización del trabajo (comunicación, tecnología, organización del trabajo, demandas cualitativas y cuantitativas de la labor)',
        'Características del grupo social de trabajo (relaciones, cohesión, calidad de interacciones, trabajo en equipo)',
        'Condiciones de la tarea (carga mental, contenido de la tarea, demandas emocionales, sistemas de control, definición de roles, monotonía, etc)',
        'Interfase persona - tarea (conocimientos, habilidades en relación con la demanda de la tarea, iniciativa, autonomía y reconocimiento, identificación de la persona con la tarea y la organización)',
        'Jornada de trabajo (pausas, trabajo nocturno, rotación, horas extras, descansos)'
    ],
    'Biomecánicos': [
        'Postura (prolongada mantenida, forzada, antigravitacional)', 'Esfuerzo',
        'Movimiento repetitivo', 'Manipulación manual de cargas'
    ],
    'Condiciones de seguridad': [
        'Mecánico (elementos o partes de máquinas, herramientas, equipos, piezas a trabajar, materiales proyectados sólidos o fluidos)',
        'Eléctrico (alta y baja tensión, estática)',
        'Locativo (sistemas y medios de almacenamiento), superficies de trabajo (irregulares, deslizantes, con diferencia del nivel), condiciones de orden y aseo, (caídas de objeto)',
        'Tecnológico (explosión, fuga, derrame, incendio)', 'Accidentes de tránsito',
        'Públicos (robos, atracos, asaltos, atentados, de orden público, etc.)',
        'Trabajo en alturas', 'Espacios confinados'
    ],
    'Fenómenos naturales': [
        'Sismo', 'Terremoto', 'Vendaval', 'Inundación', 'Derrumbe', 'Precipitaciones (lluvias, granizadas, heladas)'
    ]
};

const getRiskColor = (nr: number, h?: PeligroItem) => {
    if (nr >= 600) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300', label: 'I - No Aceptable' };
    if (nr >= 150) return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300', label: 'II - No Aceptable / Control' };
    if (nr >= 40) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300', label: 'III - Aceptable' };
    if (nr > 0) return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300', label: 'IV - Aceptable' };
    if (h && h.deficienciaHigienica === 'Bajo (B)' && nr === 0) return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300', label: 'IV - Aceptable' };
    return { bg: 'bg-surface-tertiary/20', text: 'text-text-secondary', border: 'border-border-medium', label: 'Sin Valorar' };
};

const getAcceptabilityBadge = (a: string) => {
    if (!a) return 'bg-gray-100 text-gray-600';
    if (a.includes('No Aceptable') && !a.includes('control')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (a.includes('No Aceptable')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
};

const MatrizPeligrosGTC45 = () => {
    const { token, user } = useAuthContext();
    const { showToast } = useToastContext();

    const [procesos, setProcesos] = useState<ProcesoEntry[]>([]);
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const [expandedProcesos, setExpandedProcesos] = useState<Set<string>>(new Set());
    const [expandedPeligros, setExpandedPeligros] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<any>(null);

    // Report state
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ─── Load Data ──────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const res = await fetch('/api/sgsst/matriz-peligros/data', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.procesos?.length) setProcesos(data.procesos);
                }
            } catch (err) {
                console.error('Error loading hazard matrix:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        fetch('/api/sgsst/company-info', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(info => { if (info && info.companyName) setCompanyInfo(info); })
            .catch(() => { });
    }, [token]);

    // ─── Handlers ───────────────────────────────────────────────
    const handleAddProceso = () => {
        const newProc: ProcesoEntry = {
            id: crypto.randomUUID(),
            ...EMPTY_PROCESO,
            peligros: [],
        };
        setProcesos(prev => [...prev, newProc]);
        setExpandedProcesos(prev => new Set(prev).add(newProc.id));
    };

    const handleAddPeligro = (procesoId: string) => {
        const newHazard: PeligroItem = {
            id: crypto.randomUUID(),
            ...EMPTY_HAZARD,
        };
        setProcesos(prev => prev.map(p =>
            p.id === procesoId ? { ...p, peligros: [...p.peligros, newHazard] } : p
        ));
        setExpandedPeligros(prev => new Set(prev).add(newHazard.id));
    };

    const handleDeleteProceso = (procesoId: string) => {
        setProcesos(prev => prev.filter(p => p.id !== procesoId));
    };

    const handleDeletePeligro = (procesoId: string, peligroId: string) => {
        setProcesos(prev => prev.map(p =>
            p.id === procesoId ? { ...p, peligros: p.peligros.filter(h => h.id !== peligroId) } : p
        ));
    };

    const updateProcesoField = (procesoId: string, field: keyof ProcesoEntry, value: any) => {
        setProcesos(prev => prev.map(p => p.id === procesoId ? { ...p, [field]: value } : p));
    };

    const recalculateHazard = (h: PeligroItem): PeligroItem => {
        const nd = Number(h.nivelDeficiencia) || 0;
        const ne = Number(h.nivelExposicion) || 0;
        const nc = Number(h.nivelConsecuencia) || 0;

        let np = nd * ne;
        let nr = np * nc;

        // Determine acceptability and interpretations
        let acept = '';
        let interp = '';

        const isAnexoC = ['Muy Alto (MA)', 'Alto (A)', 'Medio (M)', 'Bajo (B)'].includes(h.deficienciaHigienica);

        if (isAnexoC) {
            if (h.deficienciaHigienica === 'Muy Alto (MA)') {
                acept = 'No Aceptable (> Límite exposición ocupacional)';
                interp = 'Zona de exposición muy alta: Valores superiores al límite de exposición ocupacional (VLP). Implica adopción de medidas correctivas ambientales y médicas urgentes.';
            } else if (h.deficienciaHigienica === 'Alto (A)') {
                acept = 'No Aceptable o Control (50% - 100% límite exposición)';
                interp = 'Zona de exposición alta: Se requieren controles médicos y ambientales, con medidas técnicas correctoras de fácil ejecución.';
            } else if (h.deficienciaHigienica === 'Medio (M)') {
                acept = 'Aceptable (10% - 50% límite exposición)';
                interp = 'Zona de exposición moderada: Comprendida entre el nivel de acción y el VLP. Deben ser muestreados con cierta frecuencia.';
            } else if (h.deficienciaHigienica === 'Bajo (B)') {
                acept = 'Aceptable (< 10% límite exposición)';
                interp = 'Zona de exposición mínima/baja: Corresponde a los valores inferiores al 10% del límite de exposición. Los riesgos no existen o son leves, se toman como calidad de aire o medidas preventivas.';
            }
        } else {
            if (nr >= 600) {
                acept = 'No Aceptable';
                interp = 'Valor NR I (4000 - 600): Situación crítica. Suspender actividades hasta que el riesgo esté bajo control. Intervención urgente.';
            } else if (nr >= 150) {
                acept = 'No Aceptable o Aceptable con control específico';
                interp = 'Valor NR II (500 - 150): Corregir y adoptar medidas de control de inmediato. Sin embargo, suspenda actividades si el nivel de riesgo está por encima o igual de 360.';
            } else if (nr >= 40) {
                acept = 'Aceptable';
                interp = 'Valor NR III (120 - 40): Mejorar si es posible. Sería conveniente justificar la intervención y su rentabilidad.';
            } else if (nr > 0) {
                acept = 'Aceptable';
                interp = 'Valor NR IV (20): Mantener las medidas de control existentes, pero se deberían considerar soluciones o mejoras y se deben hacer comprobaciones periódicas.';
            }
        }

        // Calculate Justification Factor (J) = (NR * FR) / FC for each intervention
        const calcJ = (fr?: number, fc?: number) => {
            const frNum = (Number(fr) || 0) / 100; // Treat FR as a percentage decimal
            const fcNum = Number(fc) || 1;
            return fcNum > 0 ? Number(((nr * frNum) / fcNum).toFixed(2)) : 0;
        };

        return {
            ...h,
            nivelProbabilidad: np,
            nivelRiesgo: nr,
            aceptabilidad: acept,
            interpretacionNR: interp,
            j_eliminacion: calcJ(h.fr_eliminacion, h.fc_eliminacion),
            j_sustitucion: calcJ(h.fr_sustitucion, h.fc_sustitucion),
            j_ingenieria: calcJ(h.fr_ingenieria, h.fc_ingenieria),
            j_administrativo: calcJ(h.fr_administrativo, h.fc_administrativo),
            j_epp: calcJ(h.fr_epp, h.fc_epp),
        };
    };

    const updatePeligroField = (procesoId: string, peligroId: string, field: keyof PeligroItem, value: any) => {
        setProcesos(prev => prev.map(p => {
            if (p.id !== procesoId) return p;
            return {
                ...p,
                peligros: p.peligros.map(h => {
                    if (h.id !== peligroId) return h;
                    let updatedH = { ...h, [field]: value };

                    // Specific mapping for Anexo C Qualitative -> ND
                    if (field === 'deficienciaHigienica') {
                        if (value === 'Muy Alto (MA)') updatedH.nivelDeficiencia = 10;
                        else if (value === 'Alto (A)') updatedH.nivelDeficiencia = 6;
                        else if (value === 'Medio (M)') updatedH.nivelDeficiencia = 2;
                        else if (value === 'Bajo (B)') updatedH.nivelDeficiencia = 0;
                    }

                    // For fields that require recalculation
                    const recalcFields = [
                        'nivelDeficiencia', 'nivelExposicion', 'nivelConsecuencia', 'deficienciaHigienica',
                        'fr_eliminacion', 'fc_eliminacion',
                        'fr_sustitucion', 'fc_sustitucion',
                        'fr_ingenieria', 'fc_ingenieria',
                        'fr_administrativo', 'fc_administrativo',
                        'fr_epp', 'fc_epp'
                    ];
                    if (recalcFields.includes(field)) {
                        updatedH = recalculateHazard(updatedH);
                    }

                    return updatedH;
                })
            };
        }));
    };

    // ─── AI Logic ───────────────────────────────────────────────
    const handleGenerateFull = async () => {
        if (!token) return;
        setIsGeneratingFull(true);
        try {
            const res = await fetch('/api/sgsst/matriz-peligros/generate-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ modelName: selectedModel }),
            });
            if (!res.ok) throw new Error('Error al generar matriz');
            const data = await res.json();
            if (data.procesos) {
                const refreshedProcesos = data.procesos.map((p: any) => ({
                    ...p,
                    peligros: (p.peligros || []).map((h: any) => recalculateHazard({ ...EMPTY_HAZARD, ...h }))
                }));
                setProcesos(refreshedProcesos);
                showToast({ message: 'Matriz generada con éxito (7 procesos)', status: 'success' });
            }
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setIsGeneratingFull(false);
        }
    };

    const handleCompletePeligro = async (proceso: ProcesoEntry, peligro: PeligroItem) => {
        if (!token) return;
        setLoadingIds(prev => new Set(prev).add(peligro.id));
        try {
            const res = await fetch('/api/sgsst/matriz-peligros/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ proceso, peligro, modelName: selectedModel }),
            });
            if (!res.ok) throw new Error('Error al completar peligro');
            const data = await res.json();
            const completed = data.completed || {};

            setProcesos(prev => prev.map(p => {
                if (p.id !== proceso.id) return p;

                // Extract process-level controls mapped by AI, default to existing if empty
                const { fuenteGeneradora, medioExistente, individuoControl, ...hazardFields } = completed;

                return {
                    ...p,
                    fuenteGeneradora: fuenteGeneradora || p.fuenteGeneradora || '',
                    medioExistente: medioExistente || p.medioExistente || '',
                    individuoControl: individuoControl || p.individuoControl || '',
                    peligros: p.peligros.map(h => h.id === peligro.id ? recalculateHazard({ ...h, ...hazardFields }) : h)
                };
            }));
            showToast({ message: 'Peligro valorado con IA', status: 'success' });
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setLoadingIds(prev => { const n = new Set(prev); n.delete(peligro.id); return n; });
        }
    };

    const handleSaveData = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/sgsst/matriz-peligros/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ procesos }),
            });
            if (res.ok) showToast({ message: 'Matriz guardada', status: 'success' });
            else throw new Error('Error al guardar');
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Report Logic ───────────────────────────────────────────
    const handleAnalyze = useCallback(async () => {
        if (!procesos.length) {
            showToast({ message: 'No hay procesos para generar reporte', status: 'warning' });
            return;
        }

        setIsAnalyzing(true);
        try {
            const payload = {
                procesos,
                currentDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
                userName: user?.name || user?.username || 'Usuario',
                modelName: selectedModel,
            };

            const res = await fetch('/api/sgsst/matriz-peligros/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Error al generar informe con IA');
            const data = await res.json();

            let rowsHTML = '';
            procesos.forEach((p, pIdx) => {
                p.peligros.forEach((h, hIdx) => {
                    const riskColor = h.nivelRiesgo >= 600 ? '#ef4444' : h.nivelRiesgo >= 150 ? '#f97316' : h.nivelRiesgo >= 40 ? '#eab308' : '#22c55e';
                    const riskBg = h.nivelRiesgo >= 600 ? '#fef2f2' : h.nivelRiesgo >= 150 ? '#fff7ed' : h.nivelRiesgo >= 40 ? '#fefce8' : '#f0fdf4';

                    rowsHTML += `
  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; page-break-inside: avoid;">
    <div style="background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-weight: 700; color: #0f172a; font-size: 15px;">
        <span style="color: #3b82f6;">${pIdx + 1}.${hIdx + 1}</span> PROCESO: ${p.proceso}
      </div>
      <div style="background-color: ${riskColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 700;">
        NR: ${h.nivelRiesgo}
      </div>
    </div>

    <div style="padding: 20px;">
      <div style="margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Actividad / Tarea</span>
          <span style="color: #1e293b; font-size: 14px;">${p.actividad || '-'} / ${p.tarea || '-'} (${p.rutinario ? 'Rutinario' : 'No Rutinario'})</span>
        </div>
        <div>
          <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Zona / Lugar</span>
          <span style="color: #1e293b; font-size: 14px;">${p.zona || '-'}</span>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <span style="display: block; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Controles Existentes del Proceso</span>
        <table style="width: 100%; table-layout: fixed; word-wrap: break-word; border-collapse: collapse; text-align: left; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead style="background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700;">
            <tr>
              <th style="padding: 10px; border-right: 1px solid #e2e8f0;">En la Fuente</th>
              <th style="padding: 10px; border-right: 1px solid #e2e8f0;">En el Medio</th>
              <th style="padding: 10px;">En el Individuo</th>
            </tr>
          </thead>
          <tbody style="color: #334155; font-size: 13px;">
            <tr>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${p.fuenteGeneradora || 'Ninguno'}</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${p.medioExistente || 'Ninguno'}</td>
              <td style="padding: 10px;">${p.individuoControl || 'Ninguno'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="background-color: ${riskBg}; border: 1px solid ${riskColor}40; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="margin-bottom: 12px;">
          <span style="display: block; font-size: 12px; font-weight: 700; color: ${riskColor}; text-transform: uppercase; margin-bottom: 4px;">Peligro Identificado (${h.clasificacion || '-'})</span>
          <strong style="color: #0f172a; font-size: 15px;">${h.descripcionPeligro || 'Sin descripción'}</strong>
        </div>
        <div>
          <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Efectos Posibles</span>
          <span style="color: #334155; font-size: 14px;">${h.efectosPosibles || '-'}</span>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Valoración del Riesgo</span>
        <table style="width: 100%; table-layout: fixed; word-wrap: break-word; border-collapse: collapse; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead style="background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700;">
            <tr>
              <th style="padding: 10px; border-right: 1px solid #e2e8f0;">Nivel Deficiencia (ND)</th>
              <th style="padding: 10px; border-right: 1px solid #e2e8f0;">Nivel Exposición (NE)</th>
              <th style="padding: 10px; border-right: 1px solid #e2e8f0;">Nivel Probabilidad (NP)</th>
              <th style="padding: 10px; border-right: 1px solid #e2e8f0;">Nivel Consecuencia (NC)</th>
              <th style="padding: 10px;">Aceptabilidad</th>
            </tr>
          </thead>
          <tbody style="color: #0f172a; font-size: 14px;">
            <tr>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${h.nivelDeficiencia || 0}</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${h.nivelExposicion || 0}</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${h.nivelProbabilidad || 0}</td>
              <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${h.nivelConsecuencia || 0}</td>
              <td style="padding: 10px;">
                <div style="font-weight: 600; margin-bottom: 4px;">${h.aceptabilidad || '-'}</div>
                ${h.interpretacionNR ? `<div style="font-size: 10.5px; font-weight: normal; font-style: italic; color: #64748b; line-height: 1.3;">${h.interpretacionNR}</div>` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      ${h.deficienciaHigienica && h.deficienciaHigienica.trim() !== '' && h.deficienciaHigienica.toUpperCase() !== 'N/A' && h.deficienciaHigienica.toUpperCase() !== 'NA' ? `
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 4px;">Anexo C: Deficiencia Higiénica / Cuantitativa</span>
        <span style="color: #0f172a; font-size: 13px;"><strong>Valoración:</strong> ${h.deficienciaHigienica}</span>
        ${h.valoracionCuantitativa ? `<br/><span style="color: #334155; font-size: 13px;"><strong>Detalle:</strong> ${h.valoracionCuantitativa}</span>` : ''}
      </div>` : ''}

      ${h.justificacion ? `
      <div style="background-color: #fdf4ff; border: 1px solid #f5d0fe; border-left: 4px solid #d946ef; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #a21caf; text-transform: uppercase; margin-bottom: 4px;">Anexo E: Justificación de Intervención (J)</span>
        <span style="color: #334155; font-size: 13px;">${h.justificacion}</span>
      </div>` : ''}

      <div>
        <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Jerarquía de Controles Recomendada</span>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 13px;">
          <div style="margin-bottom: 6px;"><strong style="color: #475569;">Eliminación:</strong> <span style="color: #334155;">${h.eliminacion || 'N/A'}</span> ${h.j_eliminacion ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_eliminacion})</span>` : ''}</div>
          <div style="margin-bottom: 6px;"><strong style="color: #475569;">Sustitución:</strong> <span style="color: #334155;">${h.sustitucion || 'N/A'}</span> ${h.j_sustitucion ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_sustitucion})</span>` : ''}</div>
          <div style="margin-bottom: 6px;"><strong style="color: #475569;">Controles de Ingeniería:</strong> <span style="color: #334155;">${h.controlIngenieria || 'N/A'}</span> ${h.j_ingenieria ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_ingenieria})</span>` : ''}</div>
          <div style="margin-bottom: 6px;"><strong style="color: #475569;">Controles Administrativos:</strong> <span style="color: #334155;">${h.controlAdministrativo || 'N/A'}</span> ${h.j_administrativo ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_administrativo})</span>` : ''}</div>
          <div><strong style="color: #475569;">Equipos de Protección (EPP):</strong> <span style="color: #334155;">${h.epp || 'N/A'}</span> ${h.j_epp ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_epp})</span>` : ''}</div>
          ${h.medidaSeleccionada ? `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;"><strong style="color: #10b981;">✔ Medida Seleccionada (Costo-Beneficio):</strong> <span style="color: #0f172a; font-weight: 600;">${h.medidaSeleccionada}</span></div>` : ''}
        </div>
      </div>
    </div>
  </div>`;
                });
            });

            const html = `${data.report}\n<div class="mt-12">\n<h3 style="color: #0f172a; font-size: 20px; margin: 0 0 15px 0; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Anexo: Detalle de Matriz de Peligros y Riesgos</h3>\n${rowsHTML}</div>`;

            setGeneratedReport(html);
            setEditorContent(html);
            setConversationId('new');
            setReportMessageId(null);
            showToast({ message: 'Informe gerencial generado con éxito', status: 'success' });
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    }, [procesos, companyInfo, showToast, token, user, selectedModel]);

    const handleSaveReport = useCallback(async () => {
        const content = editorContent || generatedReport;
        if (!content || !token) return;
        try {
            const isNew = !conversationId || conversationId === 'new';
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(isNew ? {
                    content,
                    title: `Matriz GTC 45 - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-matriz-peligros'],
                } : { conversationId, messageId: reportMessageId, content }),
            });
            if (res.ok) {
                const data = await res.json();
                if (isNew) { setConversationId(data.conversationId); setReportMessageId(data.messageId); }
                setRefreshTrigger(prev => prev + 1);
                setIsHistoryOpen(false); // Hide the history panel
                showToast({ message: 'Informe guardado', status: 'success' });
            }
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        }
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast]);

    const handleSelectReport = async (reportOrId: any) => {
        let content = '', convId = '', msgId = '';
        if (typeof reportOrId === 'string') {
            convId = reportOrId;
            try {
                const res = await fetch(`/api/messages/${convId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const messages = await res.json();
                    const reportMsg = messages.reverse().find((m: any) =>
                        m.sender === 'SGSST Diagnóstico' || (m.isCreatedByUser === false && m.text?.length > 100)
                    );
                    if (reportMsg) { content = reportMsg.text; msgId = reportMsg.messageId; }
                }
            } catch { /* ignore */ }
        } else if (reportOrId?.content) {
            content = reportOrId.content; convId = reportOrId.conversationId; msgId = reportOrId.messageId;
        }
        if (content) {
            setGeneratedReport(content); setEditorContent(content);
            setConversationId(convId); setReportMessageId(msgId);
            setIsHistoryOpen(false);
        }
    };

    const toggleProceso = (id: string) => {
        setExpandedProcesos(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const togglePeligro = (id: string) => {
        setExpandedPeligros(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    // ─── Render ──────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ═══ Toolbar ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <LayoutList className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Matriz de Peligros (GTC 45)</h2>
                        <span className="text-sm text-text-secondary">{procesos.length} Procesos / {procesos.reduce((a, b) => a + b.peligros.length, 0)} Peligros</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleGenerateFull} disabled={isGeneratingFull}
                        className="group flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full transition-all duration-300 shadow-md font-semibold text-sm disabled:opacity-50">
                        {isGeneratingFull ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Generar Matriz con IA</span>
                    </button>
                    <button onClick={handleSaveData} disabled={isSaving}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5 text-gray-500" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Guardar</span>
                    </button>
                    <button onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-surface-primary text-text-primary'}`}>
                        <History className="h-5 w-5" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Historial</span>
                    </button>
                    {procesos.length > 0 && (
                        <button onClick={handleAnalyze} disabled={isAnalyzing}
                            className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm disabled:opacity-50">
                            {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> : <Sparkles className="h-5 w-5 text-indigo-500" />}
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Generar Informe</span>
                        </button>
                    )}
                    <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
                </div>
            </div>

            {/* ═══ History Panel ═══ */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger}
                        tags={['sgsst-matriz-peligros']} />
                </div>
            )}

            {/* ═══ Processes List ═══ */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-text-secondary">
                        <Loader2 className="h-8 w-8 animate-spin mr-3 text-blue-500" /> Cargando matriz...
                    </div>
                ) : (
                    <>
                        {procesos.map((p, pIdx) => (
                            <div key={p.id} className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden border-l-4 border-l-blue-500 transition-all">
                                {/* Proceso Header */}
                                <div className="flex items-center justify-between p-4 bg-surface-tertiary/30 cursor-pointer" onClick={() => toggleProceso(p.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="text-blue-500">
                                            {expandedProcesos.has(p.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-primary text-base">
                                                {pIdx + 1}. {p.proceso || 'Nuevo Proceso'}
                                                <span className="ml-2 text-xs font-normal text-text-secondary">— {p.actividad || 'Sin actividad'}</span>
                                            </h3>
                                            <p className="text-xs text-text-secondary mt-0.5">{p.peligros.length} peligros identificados</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleAddPeligro(p.id); }}
                                            className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors">
                                            <Plus className="h-4 w-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProceso(p.id); }}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Proceso Body */}
                                {expandedProcesos.has(p.id) && (
                                    <div className="p-4 space-y-4 animate-in fade-in duration-300">
                                        {/* Process Details Inputs */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-bottom border-border-light">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase tracking-tight">Proceso</label>
                                                <input type="text" value={p.proceso} onChange={e => updateProcesoField(p.id, 'proceso', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary font-medium" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase tracking-tight">Zona / Lugar</label>
                                                <input type="text" value={p.zona} onChange={e => updateProcesoField(p.id, 'zona', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase tracking-tight">Actividad</label>
                                                <input type="text" value={p.actividad} onChange={e => updateProcesoField(p.id, 'actividad', e.target.value)}
                                                    className="w-full text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-text-secondary uppercase tracking-tight">Tarea / Rut.</label>
                                                <div className="flex gap-2">
                                                    <input type="text" value={p.tarea} onChange={e => updateProcesoField(p.id, 'tarea', e.target.value)}
                                                        className="flex-1 text-sm p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary" />
                                                    <select value={p.rutinario ? 'si' : 'no'} onChange={e => updateProcesoField(p.id, 'rutinario', e.target.value === 'si')}
                                                        className="w-16 text-xs p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary">
                                                        <option value="si">SÍ</option>
                                                        <option value="no">NO</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Controles Existentes del Proceso */}
                                        <div className="pt-2 pb-4">
                                            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-tight uppercase mb-3 block border-b border-border-light pb-1">Controles Existentes (Aplicables al Proceso)</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-text-secondary uppercase">En la Fuente</label>
                                                    <textarea value={p.fuenteGeneradora || ''} onChange={e => updateProcesoField(p.id, 'fuenteGeneradora', e.target.value)}
                                                        placeholder="Ej: Aislamiento acústico de la máquina..." rows={2}
                                                        className="w-full text-xs p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary resize-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-text-secondary uppercase">En el Medio</label>
                                                    <textarea value={p.medioExistente || ''} onChange={e => updateProcesoField(p.id, 'medioExistente', e.target.value)}
                                                        placeholder="Ej: Extractores, mamparas..." rows={2}
                                                        className="w-full text-xs p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary resize-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-text-secondary uppercase">En el Individuo</label>
                                                    <textarea value={p.individuoControl || ''} onChange={e => updateProcesoField(p.id, 'individuoControl', e.target.value)}
                                                        placeholder="Ej: EPP suministrado (casco, guantes)..." rows={2}
                                                        className="w-full text-xs p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary resize-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hazards Sub-List */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between border-b border-border-medium pb-1">
                                                <h5 className="text-[11px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Layers className="h-3.5 w-3.5" /> Peligros en este Proceso
                                                </h5>
                                                {p.peligros.length === 0 && (
                                                    <span className="text-[10px] text-text-secondary italic">Haz clic en + para agregar un peligro</span>
                                                )}
                                            </div>
                                            {p.peligros.map((h, hIdx) => {
                                                const hStyle = h.completedByAI ? getRiskColor(h.nivelRiesgo, h) : { bg: 'bg-surface-tertiary/20', text: 'text-text-secondary', border: 'border-border-medium' };
                                                const isHExp = expandedPeligros.has(h.id);
                                                return (
                                                    <div key={h.id} className={`rounded-xl border ${hStyle.border} overflow-hidden transition-all duration-200`}>
                                                        <div className={`p-3 flex items-center justify-between cursor-pointer ${hStyle.bg}`} onClick={() => togglePeligro(h.id)}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-text-secondary">{isHExp ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</div>
                                                                <div>
                                                                    <span className="text-sm font-bold text-text-primary">{hIdx + 1}. {h.descripcionPeligro || 'Peligro No Identificado'}</span>
                                                                    {h.completedByAI && (
                                                                        <div className="flex gap-2 mt-0.5">
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${getAcceptabilityBadge(h.aceptabilidad)}`}>
                                                                                NR: {h.nivelRiesgo}
                                                                            </span>
                                                                            <span className="text-[10px] text-text-secondary font-medium tracking-tight bg-white/30 dark:bg-black/20 px-1.5 rounded-full">{h.clasificacion}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={(e) => { e.stopPropagation(); handleCompletePeligro(p, h); }} disabled={loadingIds.has(h.id)}
                                                                    className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1">
                                                                    {loadingIds.has(h.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                                                    IA
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeletePeligro(p.id, h.id); }}
                                                                    className="text-red-400 hover:text-red-600 p-1">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isHExp && (
                                                            <div className="p-4 bg-surface-primary animate-in zoom-in-95 duration-200 space-y-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-bold text-text-secondary uppercase">Clasificación</label>
                                                                        <div className="flex flex-col gap-2">
                                                                            <select
                                                                                value={GTC45_CATEGORIES[h.clasificacion] ? h.clasificacion : (h.clasificacion ? "OTRO" : "")}
                                                                                onChange={e => {
                                                                                    if (e.target.value === 'OTRO') {
                                                                                        updatePeligroField(p.id, h.id, 'clasificacion', 'Otro');
                                                                                    } else {
                                                                                        updatePeligroField(p.id, h.id, 'clasificacion', e.target.value);
                                                                                        updatePeligroField(p.id, h.id, 'descripcionPeligro', '');
                                                                                    }
                                                                                }}
                                                                                className="w-full text-xs p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary">
                                                                                <option value="">Seleccionar Clasificación...</option>
                                                                                {Object.keys(GTC45_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                                                                                <option value="OTRO">✏️ Edición Manual / Generado por IA</option>
                                                                            </select>
                                                                            {(!GTC45_CATEGORIES[h.clasificacion] && h.clasificacion !== '') && (
                                                                                <input type="text" value={h.clasificacion} onChange={e => updatePeligroField(p.id, h.id, 'clasificacion', e.target.value)}
                                                                                    placeholder="Especifique la clasificación manual..."
                                                                                    className="w-full text-xs p-2 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-text-primary" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-bold text-text-secondary uppercase">Descripción del Peligro</label>
                                                                        <div className="flex flex-col gap-2">
                                                                            <select
                                                                                value={
                                                                                    (h.clasificacion && GTC45_CATEGORIES[h.clasificacion]?.includes(h.descripcionPeligro))
                                                                                        ? h.descripcionPeligro
                                                                                        : (h.descripcionPeligro ? "OTRO" : "")
                                                                                }
                                                                                onChange={e => {
                                                                                    if (e.target.value === 'OTRO') {
                                                                                        updatePeligroField(p.id, h.id, 'descripcionPeligro', 'Otro...');
                                                                                    } else {
                                                                                        updatePeligroField(p.id, h.id, 'descripcionPeligro', e.target.value);
                                                                                    }
                                                                                }}
                                                                                disabled={!h.clasificacion && !h.descripcionPeligro}
                                                                                className="w-full text-[11px] p-2 rounded-lg border border-border-medium bg-surface-primary text-text-primary overflow-hidden text-ellipsis"
                                                                            >
                                                                                <option value="">Seleccionar Componente...</option>
                                                                                {h.clasificacion && GTC45_CATEGORIES[h.clasificacion] && GTC45_CATEGORIES[h.clasificacion].map(d => (
                                                                                    <option key={d} value={d}>{d}</option>
                                                                                ))}
                                                                                <option value="OTRO">✏️ Edición Manual / Generado por IA</option>
                                                                            </select>

                                                                            {(!h.clasificacion || !GTC45_CATEGORIES[h.clasificacion]?.includes(h.descripcionPeligro)) && h.descripcionPeligro !== '' && (
                                                                                <textarea value={h.descripcionPeligro} onChange={e => updatePeligroField(p.id, h.id, 'descripcionPeligro', e.target.value)}
                                                                                    placeholder="Describa el peligro aquí..."
                                                                                    rows={2} className="w-full text-xs p-2 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-text-primary resize-none" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {h.completedByAI && (
                                                                    <>
                                                                        {/* Simple valuation grid */}
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-border-light">
                                                                            <div className="space-y-1">
                                                                                <label className="text-[9px] font-bold text-text-secondary uppercase">ND</label>
                                                                                <input type="number" value={h.nivelDeficiencia} onChange={e => updatePeligroField(p.id, h.id, 'nivelDeficiencia', Number(e.target.value))}
                                                                                    className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary text-text-primary text-center" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[9px] font-bold text-text-secondary uppercase">NE</label>
                                                                                <input type="number" value={h.nivelExposicion} onChange={e => updatePeligroField(p.id, h.id, 'nivelExposicion', Number(e.target.value))}
                                                                                    className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary text-text-primary text-center" />
                                                                            </div>
                                                                            {h.clasificacion && (h.clasificacion.toLowerCase().includes('físico') || h.clasificacion.toLowerCase().includes('químico') || h.clasificacion.toLowerCase().includes('biológico')) && (
                                                                                <div className="space-y-1 col-span-2">
                                                                                    <label className="text-[9px] font-bold text-text-secondary uppercase text-blue-500">Deficiencia Higiénica (Anexo C)</label>
                                                                                    <select value={h.deficienciaHigienica || ''} onChange={e => updatePeligroField(p.id, h.id, 'deficienciaHigienica', e.target.value)}
                                                                                        className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary text-text-primary">
                                                                                        <option value="">Seleccionar...</option>
                                                                                        <option value="Muy Alto (MA)">Muy Alto (MA)</option>
                                                                                        <option value="Alto (A)">Alto (A)</option>
                                                                                        <option value="Medio (M)">Medio (M)</option>
                                                                                        <option value="Bajo (B)">Bajo (B)</option>
                                                                                    </select>
                                                                                </div>
                                                                            )}
                                                                            <div className="space-y-1">
                                                                                <label className="text-[9px] font-bold text-text-secondary uppercase">NC</label>
                                                                                <input type="number" value={h.nivelConsecuencia} onChange={e => updatePeligroField(p.id, h.id, 'nivelConsecuencia', Number(e.target.value))}
                                                                                    className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary text-text-primary text-center" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[9px] font-bold text-text-secondary uppercase">NR</label>
                                                                                <div className={`w-full text-sm p-1.5 rounded font-black text-center ${hStyle.text}`}>{h.nivelRiesgo}</div>
                                                                            </div>
                                                                            <div className="sm:col-span-2 space-y-1">
                                                                                <label className="text-[9px] font-bold text-text-secondary uppercase">Aceptabilidad</label>
                                                                                <div className={`w-full text-xs p-1.5 rounded font-bold text-center ${getAcceptabilityBadge(h.aceptabilidad)}`}>{h.aceptabilidad}</div>
                                                                            </div>
                                                                        </div>
                                                                        {h.interpretacionNR && (
                                                                            <div className="pt-3 px-1 pb-1">
                                                                                <p className="text-[11px] text-text-secondary leading-snug italic border-l-2 border-indigo-400 pl-2">
                                                                                    <strong className="text-indigo-600 dark:text-indigo-400">Interpretación GTC 45: </strong>
                                                                                    {h.interpretacionNR}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {/* Hierarchy of controls */}
                                                                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-border-light">
                                                                            {['eliminacion', 'sustitucion', 'controlIngenieria', 'controlAdministrativo', 'epp'].map(field => (
                                                                                <div key={field} className="space-y-1">
                                                                                    <label className="text-[9px] font-bold text-text-secondary uppercase">{field.replace('control', '')}</label>
                                                                                    <textarea value={(h as any)[field]} onChange={e => updatePeligroField(p.id, h.id, field as any, e.target.value)}
                                                                                        className="w-full text-[10px] p-1.5 rounded border border-border-medium bg-surface-primary text-text-primary resize-none" rows={2} />
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {/* Anexo E: Justificacion y Reduccion (only show if completed by AI or heavily evaluated) */}
                                                                        <div className="pt-4 mt-2 border-t border-border-light">
                                                                            <h5 className="text-[10px] font-black text-fuchsia-600 uppercase mb-3 flex items-center justify-between">
                                                                                Anexo E: Justificación de Intervención (J) Individual
                                                                            </h5>
                                                                            <div className="space-y-4">
                                                                                {['eliminacion', 'sustitucion', 'controlIngenieria', 'controlAdministrativo', 'epp'].map(measure => {
                                                                                    const textMeasure = (h as any)[measure];
                                                                                    if (!textMeasure || textMeasure.trim() === '' || textMeasure.toLowerCase() === 'no aplica' || textMeasure.toLowerCase() === 'ninguno') return null;

                                                                                    // Helper names
                                                                                    const suffix = measure.replace('control', '').toLowerCase();
                                                                                    const frKey = `fr_${suffix}` as keyof PeligroItem;
                                                                                    const fcKey = `fc_${suffix}` as keyof PeligroItem;
                                                                                    const jKey = `j_${suffix}` as keyof PeligroItem;

                                                                                    return (
                                                                                        <div key={measure} className="bg-surface-secondary/50 rounded p-2.5 border border-border-light">
                                                                                            <div className="flex justify-between items-center mb-2">
                                                                                                <span className="text-[10px] font-extrabold text-blue-500 uppercase">{measure.replace('control', '')}</span>
                                                                                                <span className="bg-fuchsia-100 dark:bg-fuchsia-900/30 px-2 py-0.5 rounded text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-800">
                                                                                                    J = {(h as any)[jKey] || 0}
                                                                                                </span>
                                                                                            </div>
                                                                                            <p className="text-[11px] text-text-primary mb-3 bg-surface-primary p-1.5 rounded border border-border-light">{textMeasure}</p>
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                                <div className="space-y-1">
                                                                                                    <label className="text-[9px] font-bold text-text-secondary uppercase">% FACTOR DE REDUCCIÓN (FR)</label>
                                                                                                    <select value={String((h as any)[frKey] || 0)} onChange={e => updatePeligroField(p.id, h.id, frKey, Number(e.target.value))}
                                                                                                        className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary text-text-primary">
                                                                                                        <option value="0">Seleccione (0%)</option>
                                                                                                        <option value="100">100% - Eliminación Total</option>
                                                                                                        <option value="75">75% - Alto (Ingeniería)</option>
                                                                                                        <option value="50">50% - Medio (Administrativo)</option>
                                                                                                        <option value="25">25% - Bajo (EPP)</option>
                                                                                                    </select>
                                                                                                </div>
                                                                                                <div className="space-y-1">
                                                                                                    <label className="text-[9px] font-bold text-text-secondary uppercase">Factor de Costo (FC)</label>
                                                                                                    <select value={String((h as any)[fcKey] || 1)} onChange={e => updatePeligroField(p.id, h.id, fcKey, Number(e.target.value))}
                                                                                                        className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary text-text-primary">
                                                                                                        {COST_FACTOR_OPTIONS.map(opt => (
                                                                                                            <option key={opt.d} value={String(opt.d)}>{opt.label} (d={opt.d})</option>
                                                                                                        ))}
                                                                                                    </select>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                            <div className="mt-3 space-y-3">
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[9px] font-bold text-text-secondary uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                                        <Zap className="h-3 w-3" />
                                                                                        Medida Seleccionada (Mayor Costo-Beneficio)
                                                                                    </label>
                                                                                    <input type="text" value={h.medidaSeleccionada || ''} onChange={e => updatePeligroField(p.id, h.id, 'medidaSeleccionada', e.target.value)}
                                                                                        placeholder="Ej: Dotar a los trabajadores con guantes..."
                                                                                        className="w-full text-xs p-1.5 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 text-text-primary" />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[9px] font-bold text-text-secondary uppercase">Justificación Descriptiva</label>
                                                                                    <textarea value={h.justificacion || ''} onChange={e => updatePeligroField(p.id, h.id, 'justificacion', e.target.value)}
                                                                                        placeholder="Ej: Controles recomendados tienen un J > 20..." rows={3}
                                                                                        className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary text-text-primary resize-y" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}

                <button onClick={handleAddProceso}
                    className="w-full p-4 border-2 border-dashed border-border-medium rounded-2xl flex items-center justify-center gap-2 text-text-secondary hover:bg-surface-secondary/50 hover:text-blue-500 transition-all">
                    <Plus className="h-5 w-5" />
                    <span className="font-bold">Agregar Nuevo Proceso</span>
                </button>
            </div>

            {generatedReport && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-primary">Vista Previa del Informe</h3>
                        <button onClick={handleSaveReport} className="group flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg transition-all duration-300 text-sm font-bold">
                            <Save className="h-4 w-4" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2">Guardar Informe</span>
                        </button>
                    </div>
                    <div className="rounded-xl border border-border-medium bg-white dark:bg-gray-900 p-1">
                        <LiveEditor initialContent={generatedReport} onUpdate={setEditorContent} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatrizPeligrosGTC45;
