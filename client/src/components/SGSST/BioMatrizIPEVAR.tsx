import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Sparkles, Loader2, Save, ShieldAlert,
  ChevronDown, RefreshCw, AlertTriangle, Dna, TrendingUp,
  Heart, Brain, Activity,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';

// ─── Tipos propios — Metodología Bio-Individual WAPPY ────────────────────────
export interface BioRiskRow {
  id: string;
  fecha_registro?: string;

  // Contexto
  dominio_bio: string;
  dimension_bio: string;
  origen_riesgo: string;
  peligro_cargo: string;
  actividad_expuesta: string;

  // Moduladores individuales
  factor_individual: string;
  fit_score: number;
  percepcion_riesgo_pts: number;

  // Cálculo
  nivel_susceptibilidad: number;  // 1-5
  nivel_exposicion: number;       // 1-5
  indice_bio_riesgo_bruto: number;      // susceptibilidad × exposicion
  factor_reduccion_percepcion: number;  // pts/500, máx 0.40
  indice_bio_riesgo_efectivo: number;   // bruto × (1 - factor_reduccion)

  // Clasificación
  clasificacion_bio: 'Crítico' | 'Alto' | 'Moderado' | 'Bajo' | '';
  intervencion_prioritaria: boolean;

  // Plan individualizado
  plan_accion_bio: string;
  restricciones_laborales: string;
  seguimiento_medico: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual' | '';
}

// ─── Constantes propias ───────────────────────────────────────────────────────
const DOMINIOS_BIO = [
  'Osteomuscular', 'Cardiovascular', 'Neurológico',
  'Psicoemocional', 'Metabólico', 'Respiratorio', 'Sensorial',
  'Inmunológico', 'Seguridad'
];

const DIMENSIONES_POR_DOMINIO: Record<string, string[]> = {
  Sensorial: ['Ruido (impacto, intermitente, continuo)', 'Iluminación (exceso o deficiencia)', 'Radiaciones no ionizantes', 'Radiaciones ionizantes', 'Afectación táctil/olfativa'],
  Respiratorio: ['Polvos orgánicos/inorgánicos', 'Fibras', 'Gases y vapores', 'Humos metálicos/no metálicos', 'Material particulado'],
  Osteomuscular: ['Postura (mantenida, forzada, antigravitacional)', 'Esfuerzo', 'Movimiento repetitivo', 'Manipulación manual de cargas'],
  Psicoemocional: ['Gestión organizacional', 'Características de la organización', 'Características del grupo social', 'Condiciones de la tarea', 'Interfase persona-tarea', 'Jornada de trabajo'],
  Inmunológico: ['Virus', 'Bacterias', 'Hongos', 'Ricketsias', 'Parásitos', 'Picaduras/Mordeduras', 'Fluidos o excrementos'],
  Cardiovascular: ['Temperaturas extremas (calor/frío)', 'Presión atmosférica', 'Exigencia cardiovascular alta', 'Trabajo sedentario prolongado'],
  Metabólico: ['Líquidos (nieblas y rocíos)', 'Alteración nutricional/digestiva', 'Desbalance térmico extremo', 'Sedentarismo metabólico'],
  Neurológico: ['Vibración (cuerpo entero, segmentaria)', 'Fatiga del sistema nervioso', 'Alteración del ciclo circadiano', 'Sobrecarga sensorial'],
  Seguridad: ['Mecánico (máquinas, herramientas)', 'Eléctrico (alta/baja tensión)', 'Locativo (superficies, caídas)', 'Tecnológico (explosión, incendio)', 'Accidentes de tránsito', 'Públicos (robos, asaltos)', 'Trabajo en alturas', 'Espacios confinados', 'Fenómenos naturales (Sismo, etc.)'],
};

const ORIGENES_RIESGO = ['Inherente a la Tarea', 'Condición Insegura', 'Acto Inseguro'];

const SEGUIMIENTO_OPTIONS = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];

const DOMINIO_ICON: Record<string, React.ElementType> = {
  Osteomuscular: Activity,
  Cardiovascular: Heart,
  Neurológico: Brain,
  Psicoemocional: Brain,
  Metabólico: Activity,
  Respiratorio: Activity,
  Sensorial: Activity,
  Inmunológico: ShieldAlert,
  Seguridad: AlertTriangle,
};

const DOMINIO_COLOR: Record<string, string> = {
  Osteomuscular: 'text-orange-500',
  Cardiovascular: 'text-red-500',
  Neurológico: 'text-purple-500',
  Psicoemocional: 'text-blue-500',
  Metabólico: 'text-amber-500',
  Respiratorio: 'text-cyan-500',
  Sensorial: 'text-teal-500',
  Inmunológico: 'text-lime-500',
  Seguridad: 'text-gray-500',
};

const clasificarBioRiesgo = (efectivo: number): BioRiskRow['clasificacion_bio'] => {
  if (efectivo >= 20) return 'Crítico';
  if (efectivo >= 12) return 'Alto';
  if (efectivo >= 6) return 'Moderado';
  return 'Bajo';
};

const CLASIFICACION_STYLE: Record<string, string> = {
  Crítico: 'bg-red-600 text-white',
  Alto: 'bg-orange-500 text-white',
  Moderado: 'bg-yellow-400 text-gray-900',
  Bajo: 'bg-green-500 text-white',
};

const calcularRiesgo = (row: BioRiskRow, percepcionPts: number): BioRiskRow => {
  const bruto = (row.nivel_susceptibilidad || 1) * (row.nivel_exposicion || 1);
  const factor = Math.min(percepcionPts / 500, 0.40);
  const efectivo = parseFloat((bruto * (1 - factor)).toFixed(2));
  return {
    ...row,
    indice_bio_riesgo_bruto: bruto,
    factor_reduccion_percepcion: parseFloat(factor.toFixed(3)),
    indice_bio_riesgo_efectivo: efectivo,
    clasificacion_bio: clasificarBioRiesgo(efectivo),
    intervencion_prioritaria: efectivo >= 12,
  };
};

const createEmptyRow = (): BioRiskRow => ({
  id: `bio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  dominio_bio: 'Osteomuscular',
  dimension_bio: 'Postura (mantenida, forzada, antigravitacional)',
  origen_riesgo: 'Inherente a la Tarea',
  peligro_cargo: '',
  actividad_expuesta: '',
  factor_individual: '',
  fit_score: 0,
  percepcion_riesgo_pts: 0,
  nivel_susceptibilidad: 1,
  nivel_exposicion: 1,
  indice_bio_riesgo_bruto: 1,
  factor_reduccion_percepcion: 0,
  indice_bio_riesgo_efectivo: 1,
  clasificacion_bio: 'Bajo',
  intervencion_prioritaria: false,
  plan_accion_bio: '',
  restricciones_laborales: '',
  seguimiento_medico: 'Anual',
});

// ─── Sub-componente: celda select ─────────────────────────────────────────────
const SelectCell = ({ value, onChange, options, className = '' }: {
  value: string; onChange: (v: string) => void; options: string[]; className?: string;
}) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className={`w-full text-xs bg-transparent border-0 outline-none focus:bg-surface-hover/50 rounded px-1 py-0.5 cursor-pointer transition-colors ${className}`}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const TextCell = ({ value, onChange, className = '' }: {
  value: string; onChange: (v: string) => void; className?: string;
}) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
    className={`w-full text-xs bg-transparent border-0 outline-none focus:bg-surface-hover/50 rounded px-1 py-0.5 transition-colors resize-none min-h-[28px] ${className}`} />
);

// ─── Componente Principal ──────────────────────────────────────────────────────
interface BioMatrizIPEVARProps {
  workerId: string;
}

export default function BioMatrizIPEVAR({ workerId }: BioMatrizIPEVARProps) {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const [rows, setRows] = useState<BioRiskRow[]>([]);
  const [percepcionPts, setPercepcionPts] = useState(0);
  const [fitScore, setFitScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');

  // ─── Cargar datos ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sgsst/workers/worker/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      const worker = data.worker;
      setRows(worker?.riesgosBioIndividual || []);
      setPercepcionPts(worker?.percepcionRiesgoScore || 0);
      setFitScore(worker?.fitScore || 0);
    } catch (e) {
      showToast({ message: 'Error cargando la matriz bio-individual', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [workerId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Guardar ──────────────────────────────────────────────────────────────
  const saveRisks = async (updatedRows: BioRiskRow[]) => {
    try {
      setIsSaving(true);
      await fetch(`/api/sgsst/workers/${workerId}/bio-ipevar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ riesgosBioIndividual: updatedRows }),
      });
      setHasUnsaved(false);
      showToast({ message: 'Matriz bio-individual guardada ✅', status: 'success', severity: 'success' });
    } catch {
      showToast({ message: 'Error al guardar', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Editar ───────────────────────────────────────────────────────────────
  const handleChange = (id: string, field: keyof BioRiskRow, value: string | number | boolean) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'nivel_susceptibilidad' || field === 'nivel_exposicion') {
        return calcularRiesgo(updated, percepcionPts);
      }
      if (field === 'dominio_bio') {
        // Reset dimension when domain changes
        const dims = DIMENSIONES_POR_DOMINIO[value as string] || ['Otro'];
        updated.dimension_bio = dims[0];
      }
      return updated;
    }));
    setHasUnsaved(true);
  };

  const addRow = () => {
    const row = calcularRiesgo(createEmptyRow(), percepcionPts);
    setRows(prev => [...prev, row]);
    setHasUnsaved(true);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
    setHasUnsaved(true);
  };

  // ─── Generar con IA ───────────────────────────────────────────────────────
  const generateWithAI = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/sgsst/workers/worker/${workerId}/generate-bio-risks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ instruccionesExtra: aiInstruction, riesgosActuales: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar');
      const generated: BioRiskRow[] = (data.riesgosBioIndividual || []).map((r: any) => ({
        ...createEmptyRow(), ...r,
        id: r.id || `bio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }));
      setRows(generated);
      setHasUnsaved(false);
      showToast({ message: `✅ ${generated.length} riesgos bio-individuales generados`, status: 'success', severity: 'success' });
    } catch (e: any) {
      showToast({ message: e.message || 'Error al generar', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const factorReduccion = Math.min(percepcionPts / 500, 0.40);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 gap-3 text-text-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        <span className="text-sm">Cargando Metodología Bio-Individual...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-teal-500" />
            <h4 className="font-bold text-text-primary text-sm">
              Índice Bio-Riesgo Individual
              {rows.length > 0 && <span className="ml-2 text-xs font-normal text-text-secondary">({rows.length} riesgo{rows.length !== 1 ? 's' : ''})</span>}
            </h4>
            {hasUnsaved && <span className="text-xs text-amber-500 font-semibold">● Sin guardar</span>}
          </div>
          {/* Indicadores de modulación */}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-full border border-teal-200 dark:border-teal-800">
              FIT {fitScore}%
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${factorReduccion > 0.1 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-surface-secondary text-text-secondary border-border-light'}`}>
              Reducción percepción: {(factorReduccion * 100).toFixed(0)}%
            </span>
            <span className="text-xs px-2 py-0.5 bg-surface-secondary text-text-secondary rounded-full border border-border-light">
              {percepcionPts} pts percepción
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => showToast({ message: 'Metodología: Susceptibilidad (1-5) x Exposición (1-5) = Bruto. El Índice Efectivo aplica el factor de reducción (Anexo E) según tu cultura preventiva. Dominios expandidos incluyen normatividad GTC-45.', status: 'info', severity: 'info' })}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-secondary text-text-secondary text-xs font-semibold rounded-xl hover:bg-surface-hover transition-colors" title="Ver metodología detallada">
            <Sparkles className="h-3.5 w-3.5" /> Metodología
          </button>
          <div className="flex items-center gap-2 bg-surface-secondary rounded-xl pr-1 pl-3 py-1 shadow-sm border border-border-medium">
            <input
              type="text"
              value={aiInstruction}
              onChange={e => setAiInstruction(e.target.value)}
              placeholder="Instrucciones para la IA (ej. Enfócate en riesgos biomecánicos, agrega 10 riesgos...)"
              className="bg-transparent border-0 outline-none text-xs text-text-primary w-64 placeholder-text-tertiary"
              disabled={isGenerating}
            />
            <button onClick={generateWithAI} disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-bold rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isGenerating ? 'Generando...' : 'Generar'}
            </button>
          </div>
          <button onClick={addRow}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-secondary border border-border-medium text-text-primary text-xs font-semibold rounded-xl hover:bg-surface-hover transition-colors">
            <Plus className="h-3.5 w-3.5" /> Añadir riesgo
          </button>
          {hasUnsaved ? (
            <button onClick={() => saveRisks(rows)} disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar
            </button>
          ) : (
            <button disabled className="flex items-center gap-1.5 px-4 py-2 bg-surface-secondary text-text-tertiary text-xs font-bold rounded-xl opacity-60">
              <Save className="h-3.5 w-3.5" /> Matriz Guardada ✓
            </button>
          )}
          <button onClick={fetchData} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Leyenda metodología ── */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        {(['Crítico', 'Alto', 'Moderado', 'Bajo'] as const).map(c => (
          <span key={c} className={`px-2 py-0.5 rounded-full font-bold ${CLASIFICACION_STYLE[c]}`}>{c}</span>
        ))}
        <span className="text-text-tertiary ml-1">· Fórmula: Susceptibilidad × Exposición × (1 - Reducción percepción)</span>
      </div>

      {/* ── Empty State ── */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-border-medium rounded-2xl text-text-secondary">
          <ShieldAlert className="h-12 w-12 opacity-20" />
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Sin evaluación bio-individual</p>
            <p className="text-xs opacity-70 max-w-xs">
              Genera los riesgos con IA usando la metodología Bio-Individual WAPPY, o agrégalos manualmente.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full max-w-lg">
            <div className="flex-1 flex items-center bg-surface-secondary rounded-xl px-3 py-1 shadow-inner border border-border-medium">
              <input
                type="text"
                value={aiInstruction}
                onChange={e => setAiInstruction(e.target.value)}
                placeholder="Dale instrucciones a la IA..."
                className="w-full bg-transparent border-0 outline-none text-xs text-text-primary placeholder-text-tertiary py-2"
                disabled={isGenerating}
              />
            </div>
            <button onClick={generateWithAI} disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-700 shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 whitespace-nowrap">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Generando...' : 'Generar con IA'}
            </button>
          </div>
          <div className="flex gap-3 justify-center mt-2">
            <button onClick={addRow}
              className="flex items-center gap-2 px-5 py-2.5 bg-surface-secondary border border-border-medium text-text-primary font-semibold rounded-xl hover:bg-surface-hover transition-colors">
              <Plus className="h-4 w-4" /> Añadir manualmente
            </button>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border-medium shadow-sm">
          <table className="w-full text-xs border-collapse min-w-max">
            <thead className="bg-surface-secondary text-text-secondary uppercase tracking-wide text-[10px] font-bold sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left min-w-[110px]">Dominio Bio</th>
                <th className="px-3 py-2.5 text-left min-w-[130px]">Dimensión</th>
                <th className="px-3 py-2.5 text-left min-w-[120px]">Origen</th>
                <th className="px-3 py-2.5 text-left min-w-[150px]">Peligro del Cargo</th>
                <th className="px-3 py-2.5 text-left min-w-[130px]">Actividad</th>
                <th className="px-3 py-2.5 text-left min-w-[150px] border-l border-teal-500/30">Factor Individual</th>
                <th className="px-3 py-2.5 text-center min-w-[45px] border-l border-teal-500/30" title="Nivel Susceptibilidad 1-5">NS</th>
                <th className="px-3 py-2.5 text-center min-w-[45px]" title="Nivel Exposición 1-5">NE</th>
                <th className="px-3 py-2.5 text-center min-w-[55px]" title="Índice Bruto">Bruto</th>
                <th className="px-3 py-2.5 text-center min-w-[55px]" title="Índice Efectivo (con reducción)">Efectivo</th>
                <th className="px-3 py-2.5 text-center min-w-[80px]">Clasificación</th>
                <th className="px-3 py-2.5 text-center min-w-[70px]">Seguimiento</th>
                <th className="px-3 py-2.5 text-center min-w-[50px]">Plan</th>
                <th className="px-3 py-2.5 text-center min-w-[40px]">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {rows.map((row, idx) => {
                const isExpanded = expandedRow === row.id;
                const Icon = DOMINIO_ICON[row.dominio_bio] || Activity;
                const iconColor = DOMINIO_COLOR[row.dominio_bio] || 'text-teal-500';
                return (
                  <React.Fragment key={row.id}>
                    <tr className={`hover:bg-surface-hover/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-primary/30'} ${row.intervencion_prioritaria ? 'border-l-2 border-l-red-500' : ''}`}>
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          <Icon className={`h-3 w-3 shrink-0 ${iconColor}`} />
                          <SelectCell value={row.dominio_bio} onChange={v => handleChange(row.id, 'dominio_bio', v)} options={DOMINIOS_BIO} />
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <SelectCell value={row.dimension_bio || ''} onChange={v => handleChange(row.id, 'dimension_bio', v)} options={DIMENSIONES_POR_DOMINIO[row.dominio_bio] || ['Otro']} />
                      </td>
                      <td className="px-2 py-1">
                        <SelectCell value={row.origen_riesgo || 'Inherente a la Tarea'} onChange={v => handleChange(row.id, 'origen_riesgo', v)} options={ORIGENES_RIESGO} />
                      </td>
                      <td className="px-2 py-1"><TextCell value={row.peligro_cargo} onChange={v => handleChange(row.id, 'peligro_cargo', v)} /></td>
                      <td className="px-2 py-1"><TextCell value={row.actividad_expuesta} onChange={v => handleChange(row.id, 'actividad_expuesta', v)} /></td>
                      <td className="px-2 py-1 border-l border-teal-500/20"><TextCell value={row.factor_individual} onChange={v => handleChange(row.id, 'factor_individual', v)} /></td>
                      <td className="px-2 py-1 border-l border-teal-500/20 text-center">
                        <input type="number" min={1} max={5} value={row.nivel_susceptibilidad}
                          onChange={e => handleChange(row.id, 'nivel_susceptibilidad', Number(e.target.value))}
                          className="w-10 text-center text-xs bg-transparent border-0 outline-none focus:bg-surface-hover/50 rounded" />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input type="number" min={1} max={5} value={row.nivel_exposicion}
                          onChange={e => handleChange(row.id, 'nivel_exposicion', Number(e.target.value))}
                          className="w-10 text-center text-xs bg-transparent border-0 outline-none focus:bg-surface-hover/50 rounded" />
                      </td>
                      <td className="px-2 py-1 text-center font-mono font-bold text-text-secondary">{row.indice_bio_riesgo_bruto}</td>
                      <td className="px-2 py-1 text-center font-mono font-black text-text-primary">{row.indice_bio_riesgo_efectivo?.toFixed(1)}</td>
                      <td className="px-2 py-1 text-center">
                        {row.clasificacion_bio && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${CLASIFICACION_STYLE[row.clasificacion_bio] || ''}`}>
                            {row.clasificacion_bio}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <SelectCell value={row.seguimiento_medico || 'Anual'} onChange={v => handleChange(row.id, 'seguimiento_medico', v)} options={SEGUIMIENTO_OPTIONS} />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                          className="p-1 hover:bg-surface-hover rounded-lg transition-colors text-text-secondary hover:text-teal-600">
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={() => removeRow(row.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Fila expandida: plan de acción y restricciones */}
                    {isExpanded && (
                      <tr className="bg-teal-50/50 dark:bg-teal-900/10">
                        <td colSpan={12} className="px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2 flex items-center gap-1" title="Eliminación o Sustitución (Dec 1072)">
                                <ShieldAlert className="h-3 w-3" /> Control en la Fuente
                              </p>
                              <textarea
                                value={row.controles_fuente || ''}
                                onChange={e => handleChange(row.id, 'controles_fuente', e.target.value)}
                                rows={2}
                                placeholder="Eliminación o Sustitución..."
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2 flex items-center gap-1" title="Controles de Ingeniería o Administrativos (Dec 1072)">
                                <ShieldAlert className="h-3 w-3" /> Control en el Medio
                              </p>
                              <textarea
                                value={row.controles_medio || ''}
                                onChange={e => handleChange(row.id, 'controles_medio', e.target.value)}
                                rows={2}
                                placeholder="Ingeniería o Administrativos..."
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2 flex items-center gap-1" title="EPP o Clínico (Dec 1072)">
                                <ShieldAlert className="h-3 w-3" /> Control en el Individuo
                              </p>
                              <textarea
                                value={row.controles_individuo || ''}
                                onChange={e => handleChange(row.id, 'controles_individuo', e.target.value)}
                                rows={2}
                                placeholder="EPP, Clínico..."
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2 flex items-center gap-1" title="Análisis Costo/Beneficio (Anexo E)">
                                <TrendingUp className="h-3 w-3" /> Plan de Acción Bio-Individual
                              </p>
                              <textarea
                                value={row.plan_accion_bio || ''}
                                onChange={e => handleChange(row.id, 'plan_accion_bio', e.target.value)}
                                rows={2}
                                placeholder="Resumen y Análisis Costo-Beneficio (Anexo E)..."
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-orange-600 dark:text-orange-400 uppercase text-[10px] mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Restricciones Laborales
                              </p>
                              <textarea
                                value={row.restricciones_laborales || ''}
                                onChange={e => handleChange(row.id, 'restricciones_laborales', e.target.value)}
                                rows={2}
                                placeholder="Restricciones según criterio médico-laboral..."
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-text-tertiary">
                            <span>FIT al registrar: <strong>{row.fit_score}%</strong></span>
                            <span>Pts. percepción: <strong>{row.percepcion_riesgo_pts}</strong></span>
                            <span>Factor reducción: <strong>{((row.factor_reduccion_percepcion || 0) * 100).toFixed(0)}%</strong></span>
                            {row.fecha_registro && <span>Fecha: <strong>{new Date(row.fecha_registro).toLocaleDateString('es-CO')}</strong></span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Guardar flotante ── */}
      {rows.length > 0 && hasUnsaved && (
        <div className="flex justify-end">
          <button onClick={() => saveRisks(rows)} disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-60">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
}
