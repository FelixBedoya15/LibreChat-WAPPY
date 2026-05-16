import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, Sparkles, Loader2, Save, ShieldAlert,
  ChevronDown, RefreshCw, AlertTriangle, Dna, TrendingUp,
  Heart, Brain, Activity, Info, X
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { SGSSTToolbar, ToolbarButton } from './SGSSTToolbar';
import SingleSelect from './SingleSelect';

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
  <SingleSelect
    value={value}
    onChange={onChange}
    options={options}
    compact={true}
    className={className}
  />
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
  const [showMethodology, setShowMethodology] = useState(false);

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

  // ─── HTML Export ─────────────────────────────────────────────────────────
  const exportHtml = useMemo(() => {
    if (rows.length === 0) return '';
    
    const criticos = rows.filter(r => r.clasificacion_bio === 'Crítico').length;
    const altos = rows.filter(r => r.clasificacion_bio === 'Alto').length;
    const moderados = rows.filter(r => r.clasificacion_bio === 'Moderado').length;
    const bajos = rows.filter(r => r.clasificacion_bio === 'Bajo').length;

    let html = `
      <div style="font-family: 'Inter', Arial, sans-serif; color: #334155; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0f766e; padding-bottom: 15px; margin-bottom: 25px;">
          <div>
            <h1 style="color: #0f766e; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: -0.5px;">Reporte Técnico IPEVAR</h1>
            <h2 style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; font-weight: normal;">Matriz de Riesgos Bio-Individual (GTC-45)</h2>
          </div>
          <div style="text-align: right; color: #64748b; font-size: 12px;">
            <p style="margin: 0;"><strong>ID Trabajador:</strong> ${workerId}</p>
            <p style="margin: 5px 0 0 0;">Fecha: ${new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
            <h3 style="color: #0f766e; font-size: 13px; margin: 0 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">📊 MÉTRICAS CLÍNICAS (FIT)</h3>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Índice FIT Integral:</strong> <span style="color: #0f766e; font-weight: bold;">${fitScore}%</span></p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Puntos Percepción:</strong> ${percepcionPts} pts</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Factor Reducción:</strong> -${(Math.min(percepcionPts / 500, 0.40) * 100).toFixed(0)}% (aplicado al índice bruto)</p>
          </div>
          
          <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
            <h3 style="color: #0f766e; font-size: 13px; margin: 0 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">⚠️ RESUMEN BIO-RIESGOS</h3>
            <div style="display: flex; gap: 15px; font-size: 12px; font-weight: bold; text-align: center;">
              <div style="flex: 1; color: #dc2626;"><span style="font-size: 20px; display: block;">${criticos}</span> Críticos</div>
              <div style="flex: 1; color: #ea580c;"><span style="font-size: 20px; display: block;">${altos}</span> Altos</div>
              <div style="flex: 1; color: #eab308;"><span style="font-size: 20px; display: block;">${moderados}</span> Moderados</div>
              <div style="flex: 1; color: #16a34a;"><span style="font-size: 20px; display: block;">${bajos}</span> Bajos</div>
            </div>
          </div>
        </div>

        <h3 style="color: #334155; font-size: 16px; margin-bottom: 15px;">Matriz Detallada</h3>
        <table style="width:100%; border-collapse: collapse; font-size: 11px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background-color: #0f766e; color: white;">
              <th style="padding: 10px; border: 1px solid #115e59;">Dominio</th>
              <th style="padding: 10px; border: 1px solid #115e59;">Dimensión</th>
              <th style="padding: 10px; border: 1px solid #115e59;">Peligro</th>
              <th style="padding: 10px; border: 1px solid #115e59;">Actividad</th>
              <th style="padding: 10px; border: 1px solid #115e59;">Factor Indiv.</th>
              <th style="padding: 10px; border: 1px solid #115e59; text-align: center;">NS</th>
              <th style="padding: 10px; border: 1px solid #115e59; text-align: center;">NE</th>
              <th style="padding: 10px; border: 1px solid #115e59; text-align: center;">Bruto</th>
              <th style="padding: 10px; border: 1px solid #115e59; text-align: center;">Efectivo</th>
              <th style="padding: 10px; border: 1px solid #115e59; text-align: center;">Clasificación</th>
              <th style="padding: 10px; border: 1px solid #115e59;">Plan de Acción</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    rows.forEach((r, idx) => {
      let bgRow = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      let colorClase = r.clasificacion_bio === 'Crítico' ? '#dc2626' : r.clasificacion_bio === 'Alto' ? '#ea580c' : r.clasificacion_bio === 'Moderado' ? '#eab308' : '#16a34a';
      let bgClase = r.clasificacion_bio === 'Crítico' ? '#fef2f2' : r.clasificacion_bio === 'Alto' ? '#fff7ed' : r.clasificacion_bio === 'Moderado' ? '#fefce8' : '#f0fdf4';
      
      html += `
        <tr style="background-color: ${bgRow};">
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${r.dominio_bio}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.dimension_bio}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.peligro_cargo}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.actividad_expuesta}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.factor_individual}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${r.nivel_susceptibilidad}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${r.nivel_exposicion}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${r.indice_bio_riesgo_bruto}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 12px;">${r.indice_bio_riesgo_efectivo.toFixed(1)}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${colorClase}; background-color: ${bgClase};">${r.clasificacion_bio}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 10px;">${r.plan_accion_bio || 'Pendiente'}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0;"><strong>Plataforma WAPPY IA</strong> - Módulo Seguridad y Salud en el Trabajo</p>
          <p style="margin: 5px 0 0 0;">Metodología Bio-Individual alineada con la GTC-45 y el Decreto 1072</p>
        </div>
      </div>
    `;
    return html;
  }, [rows, workerId, fitScore, percepcionPts]);

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
      </div>

      <SGSSTToolbar 
        onSaveLocal={() => saveRisks(rows)}
        isSavingLocal={isSaving}
        saveDisabled={!hasUnsaved || isSaving}
        exportContent={exportHtml}
        exportFileName="IPEVAR_Bio_Individual"
        customSections={[
          <ToolbarButton 
            key="methodology" 
            id="methodology" 
            onClick={() => setShowMethodology(true)} 
            title="Ver Manual de Procedimiento IPEVAR" 
            label="Metodología" 
            icon="file-text" 
            variant="default" 
          />,
          <div key="ai-input" className="flex items-center h-10 bg-surface-primary border border-border-medium rounded-xl pr-1 pl-3 transition-colors shadow-sm focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
            <input
              type="text"
              value={aiInstruction}
              onChange={e => setAiInstruction(e.target.value)}
              placeholder="Instrucciones para la IA (ej. Enfócate en riesgos...)"
              className="bg-transparent border-0 outline-none text-xs text-text-primary w-56 placeholder-text-tertiary"
              disabled={isGenerating}
            />
            <button onClick={generateWithAI} disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-bold rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 ml-1 h-8">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isGenerating ? 'Generando...' : 'Generar'}</span>
            </button>
          </div>,
          <ToolbarButton 
            key="add" 
            id="add" 
            onClick={addRow} 
            label="Añadir riesgo" 
            icon="plus" 
            variant="default" 
          />,
          <ToolbarButton 
            key="refresh" 
            id="refresh" 
            onClick={fetchData} 
            title="Refrescar" 
            label="" 
            icon="refresh-cw" 
            variant="default" 
          />
        ]}
      />

      <div className="flex flex-wrap gap-2 text-[10px]">
        {(['Crítico', 'Alto', 'Moderado', 'Bajo'] as const).map(c => (
          <span key={c} className={`px-2 py-0.5 rounded-full font-bold ${CLASIFICACION_STYLE[c]}`}>{c}</span>
        ))}
        <span className="text-text-tertiary ml-1">· Fórmula: Susceptibilidad × Exposición × (1 - Reducción percepción)</span>
      </div>

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-border-medium rounded-2xl text-text-secondary">
          <ShieldAlert className="h-12 w-12 opacity-20" />
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Sin evaluación bio-individual</p>
            <p className="text-xs opacity-70 max-w-xs">
              Genera los riesgos con IA usando la metodología Bio-Individual WAPPY, o agrégalos manualmente.
            </p>
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

                    {isExpanded && (
                      <tr className="bg-teal-50/50 dark:bg-teal-900/10">
                        <td colSpan={14} className="px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2 flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> Control en la Fuente
                              </p>
                              <textarea
                                value={row.controles_fuente || ''}
                                onChange={e => handleChange(row.id, 'controles_fuente', e.target.value)}
                                rows={2}
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2 flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> Control en el Medio
                              </p>
                              <textarea
                                value={row.controles_medio || ''}
                                onChange={e => handleChange(row.id, 'controles_medio', e.target.value)}
                                rows={2}
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2 flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> Control en el Individuo
                              </p>
                              <textarea
                                value={row.controles_individuo || ''}
                                onChange={e => handleChange(row.id, 'controles_individuo', e.target.value)}
                                rows={2}
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Plan de Acción
                              </p>
                              <textarea
                                value={row.plan_accion_bio || ''}
                                onChange={e => handleChange(row.id, 'plan_accion_bio', e.target.value)}
                                rows={2}
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
                                className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                              />
                            </div>
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

      {/* Modal Metodología (Centrado) */}
      {showMethodology && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop con blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowMethodology(false)} 
          />
          
          {/* Contenedor del Modal */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-primary shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-border-medium bg-surface-secondary/50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl shadow-sm">
                  <Activity className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">Metodología Bio-Individual IPEVAR</h3>
                  <p className="text-sm text-text-secondary mt-1">Manual de Procedimiento • GTC-45 • Decreto 1072</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMethodology(false)} 
                className="text-text-tertiary hover:text-text-primary p-2 bg-surface-hover rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Contenido con Scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8 text-sm text-text-secondary bg-surface-primary">
              
              {/* Sección 1: Fórmula */}
              <section className="space-y-4">
                <h4 className="text-lg font-bold text-text-primary border-b border-border-light pb-2">1. La Fórmula Biocéntrica</h4>
                <p className="leading-relaxed text-base">
                  A diferencia de la evaluación tradicional, la metodología <strong>IPEVAR WAPPY</strong> humaniza la matriz de riesgos cruzando la susceptibilidad clínica y la exposición real con el comportamiento y participación del trabajador (Factor de Percepción).
                </p>
                <div className="bg-teal-50 dark:bg-teal-900/10 p-6 rounded-2xl border border-teal-100 dark:border-teal-800/30 text-center shadow-inner mx-auto max-w-2xl">
                  <div className="font-mono font-bold text-2xl text-teal-700 dark:text-teal-300">
                    Efectivo = (NS × NE) × (1 - F. Percepción)
                  </div>
                  <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mt-3">
                    *El Factor de Percepción máximo es del 40% (0.40) y se deriva automáticamente de los puntos de gamificación y reportes del trabajador en la plataforma.
                  </p>
                </div>
              </section>

              {/* Grid para Criterios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sección 2: Criterios NS */}
                <section className="bg-surface-secondary/50 p-5 rounded-2xl border border-border-light">
                  <h5 className="font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2 text-base">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs">NS</span>
                    Nivel de Susceptibilidad
                  </h5>
                  <ul className="space-y-3 text-sm leading-relaxed">
                    <li className="flex gap-3"><strong>1:</strong> <span>Fisiología óptima, sin patologías preexistentes para el cargo.</span></li>
                    <li className="flex gap-3"><strong>2:</strong> <span>Condición leve, controlada con estilo de vida saludable.</span></li>
                    <li className="flex gap-3"><strong>3:</strong> <span>Sensibilidad moderada, requiere vigilancia médica preventiva.</span></li>
                    <li className="flex gap-3"><strong>4:</strong> <span>Vulnerabilidad alta, historia clínica con eventos recientes o crónicos.</span></li>
                    <li className="flex gap-3 text-red-600 dark:text-red-400"><strong>5:</strong> <span>Condición crítica o embarazo, riesgo inminente ante exposición.</span></li>
                  </ul>
                </section>

                {/* Sección 2: Criterios NE */}
                <section className="bg-surface-secondary/50 p-5 rounded-2xl border border-border-light">
                  <h5 className="font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2 text-base">
                    <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-xs">NE</span>
                    Nivel de Exposición
                  </h5>
                  <ul className="space-y-3 text-sm leading-relaxed">
                    <li className="flex gap-3"><strong>1:</strong> <span>Exposición esporádica (menos de 1 hora al mes).</span></li>
                    <li className="flex gap-3"><strong>2:</strong> <span>Exposición ocasional (algunas horas a la semana).</span></li>
                    <li className="flex gap-3"><strong>3:</strong> <span>Exposición frecuente (varias horas todos los días).</span></li>
                    <li className="flex gap-3"><strong>4:</strong> <span>Exposición continua (toda la jornada laboral, intensidad media).</span></li>
                    <li className="flex gap-3 text-red-600 dark:text-red-400"><strong>5:</strong> <span>Exposición permanente y crítica (toda la jornada a intensidad máxima).</span></li>
                  </ul>
                </section>
              </div>

              {/* Sección 3: Taxonomía */}
              <section className="space-y-4 pt-4 border-t border-border-light">
                <h4 className="text-lg font-bold text-text-primary mb-2">3. Taxonomía de Dominios Fisiológicos (GTC-45)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border-light hover:border-teal-500/50 transition-colors">
                    <strong className="text-teal-600 block mb-1">Sensorial</strong>
                    <span className="text-text-tertiary">Ruido, Iluminación, Radiaciones.</span>
                  </div>
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border-light hover:border-cyan-500/50 transition-colors">
                    <strong className="text-cyan-600 block mb-1">Respiratorio</strong>
                    <span className="text-text-tertiary">Polvos, Humos, Gases, Vapores.</span>
                  </div>
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border-light hover:border-orange-500/50 transition-colors">
                    <strong className="text-orange-600 block mb-1">Osteomuscular</strong>
                    <span className="text-text-tertiary">Postura, Esfuerzo, Movimiento, Cargas.</span>
                  </div>
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border-light hover:border-blue-500/50 transition-colors">
                    <strong className="text-blue-600 block mb-1">Psicoemocional</strong>
                    <span className="text-text-tertiary">Gestión organizacional, Tarea, Jornada.</span>
                  </div>
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border-light hover:border-lime-500/50 transition-colors">
                    <strong className="text-lime-600 block mb-1">Inmunológico</strong>
                    <span className="text-text-tertiary">Virus, Bacterias, Hongos, Fluidos.</span>
                  </div>
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border-light hover:border-gray-500/50 transition-colors">
                    <strong className="text-gray-600 block mb-1">Seguridad Integral</strong>
                    <span className="text-text-tertiary">Mecánico, Eléctrico, Locativo, Alturas.</span>
                  </div>
                </div>
              </section>

            </div>
            
            {/* Pie del Modal */}
            <div className="p-6 border-t border-border-medium bg-surface-secondary/50 rounded-b-2xl flex justify-end">
              <button 
                onClick={() => setShowMethodology(false)}
                className="px-8 py-3 bg-text-primary text-surface-primary font-bold rounded-xl hover:scale-[0.98] transition-all shadow-md"
              >
                Entendido, cerrar guía
              </button>
            </div>
          </div>
        </div>
      )}

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
