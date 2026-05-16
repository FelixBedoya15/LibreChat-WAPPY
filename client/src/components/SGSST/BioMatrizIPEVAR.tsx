import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Sparkles, Loader2, Save, ShieldAlert,
  ChevronDown, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';

// ─── Tipos propios (independientes de MatrizIPEVARTable) ────────────────────
export interface BioRiskRow {
  id: string;
  proceso: string;
  zona: string;
  actividad: string;
  tareas: string;
  rutinaria: 'Sí' | 'No';
  peligro_descripcion: string;
  peligro_clasificacion: string;
  efectos_posibles: string;
  controles_fuente: string;
  controles_medio: string;
  controles_individuo: string;
  nd: number;
  ne: number;
  np: number;
  nc: number;
  nr: number;
  interpretacion_nr: 'I' | 'II' | 'III' | 'IV' | '';
  aceptabilidad: string;
  medida_eliminacion: string;
  medida_sustitucion: string;
  medida_ingenieria: string;
  medida_administrativa: string;
  medida_eppu: string;
  factores_reduccion: string;
}

// ─── Constantes propias ──────────────────────────────────────────────────────
const CLASIFICACIONES = [
  'Biológico', 'Biomecánico', 'Condiciones de seguridad', 'Eléctrico',
  'Físico', 'Locativo', 'Mecánico', 'Natural', 'Psicosocial',
  'Químico', 'Tecnológico', 'Trabajo en alturas',
];

const NIVEL_NR = (nr: number): { nivel: string; color: string; aceptabilidad: string } => {
  if (nr >= 500) return { nivel: 'I', color: 'bg-red-600 text-white', aceptabilidad: 'No Aceptable' };
  if (nr >= 150) return { nivel: 'II', color: 'bg-orange-500 text-white', aceptabilidad: 'No Aceptable o Aceptable con Control Específico' };
  if (nr >= 40)  return { nivel: 'III', color: 'bg-yellow-400 text-gray-900', aceptabilidad: 'Mejorable' };
  return { nivel: 'IV', color: 'bg-green-500 text-white', aceptabilidad: 'Aceptable' };
};

const createEmptyRow = (): BioRiskRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  proceso: '', zona: '', actividad: '', tareas: '', rutinaria: 'Sí',
  peligro_descripcion: '', peligro_clasificacion: '', efectos_posibles: '',
  controles_fuente: 'Ninguno', controles_medio: 'Ninguno', controles_individuo: 'Ninguno',
  nd: 0, ne: 0, np: 0, nc: 0, nr: 0, interpretacion_nr: '', aceptabilidad: '',
  medida_eliminacion: 'Ninguno', medida_sustitucion: 'Ninguno', medida_ingenieria: 'Ninguno',
  medida_administrativa: 'Ninguno', medida_eppu: 'Ninguno', factores_reduccion: 'No aplica',
});

// ─── Sub-componente: celda editable ─────────────────────────────────────────
const EditableCell = ({ value, onChange, type = 'text', options, className = '' }: {
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  className?: string;
}) => {
  const base = 'w-full text-xs bg-transparent border-0 outline-none focus:bg-surface-hover/50 rounded px-1 py-0.5 transition-colors resize-none min-h-[28px]';
  if (type === 'select' && options) {
    return (
      <select value={String(value)} onChange={e => onChange(e.target.value)}
        className={`${base} cursor-pointer ${className}`}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (type === 'number') {
    return (
      <input type="number" value={value} min={0}
        onChange={e => onChange(e.target.value)}
        className={`${base} text-center w-12 ${className}`} />
    );
  }
  return (
    <textarea value={String(value)} onChange={e => onChange(e.target.value)}
      rows={2} className={`${base} ${className}`} />
  );
};

// ─── Componente principal ────────────────────────────────────────────────────
interface BioMatrizIPEVARProps {
  workerId: string;
}

export default function BioMatrizIPEVAR({ workerId }: BioMatrizIPEVARProps) {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const [rows, setRows] = useState<BioRiskRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // ─── Cargar riesgos ────────────────────────────────────────────────────────
  const fetchRisks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sgsst/workers/worker/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      setRows(data.worker?.riesgosIpevar || []);
    } catch (e) {
      showToast({ message: 'Error cargando la matriz', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [workerId, token]);

  useEffect(() => { fetchRisks(); }, [fetchRisks]);

  // ─── Guardar riesgos ───────────────────────────────────────────────────────
  const saveRisks = async (updatedRows: BioRiskRow[]) => {
    try {
      setIsSaving(true);
      await fetch(`/api/sgsst/workers/${workerId}/ipevar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ riesgosIpevar: updatedRows }),
      });
      setHasUnsaved(false);
      showToast({ message: 'Matriz guardada ✅', status: 'success', severity: 'success' });
    } catch {
      showToast({ message: 'Error al guardar', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Calcular NP / NR ─────────────────────────────────────────────────────
  const recalculate = (row: BioRiskRow): BioRiskRow => {
    const np = (row.nd || 0) * (row.ne || 0);
    const nr = np * (row.nc || 0);
    const { nivel, aceptabilidad } = NIVEL_NR(nr);
    return { ...row, np, nr, interpretacion_nr: nivel as BioRiskRow['interpretacion_nr'], aceptabilidad };
  };

  // ─── Editar celda ─────────────────────────────────────────────────────────
  const handleChange = (id: string, field: keyof BioRiskRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: ['nd', 'ne', 'nc'].includes(field) ? Number(value) : value };
      return recalculate(updated);
    }));
    setHasUnsaved(true);
  };

  // ─── Agregar fila ─────────────────────────────────────────────────────────
  const addRow = () => {
    setRows(prev => [...prev, createEmptyRow()]);
    setHasUnsaved(true);
  };

  // ─── Eliminar fila ────────────────────────────────────────────────────────
  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
    setHasUnsaved(true);
  };

  // ─── Generar con IA ───────────────────────────────────────────────────────
  const generateWithAI = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/sgsst/workers/worker/${workerId}/generate-risks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar');
      const generated = (data.riesgosIpevar || []).map((r: any) => ({
        ...createEmptyRow(), ...r,
        id: r.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }));
      setRows(generated);
      setHasUnsaved(false); // ya guardado en el backend por el endpoint
      showToast({ message: `✅ ${generated.length} riesgos generados con IA`, status: 'success', severity: 'success' });
    } catch (e: any) {
      showToast({ message: e.message || 'Error al generar con IA', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 gap-3 text-text-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        <span className="text-sm">Cargando matriz bio-individual...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header / Actions ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-teal-600" />
          <h4 className="font-bold text-text-primary text-sm">
            Matriz IPEVAR Bio-Individual
            {rows.length > 0 && (
              <span className="ml-2 text-xs font-normal text-text-secondary">({rows.length} riesgo{rows.length !== 1 ? 's' : ''})</span>
            )}
          </h4>
          {hasUnsaved && <span className="text-xs text-amber-500 font-semibold">● Sin guardar</span>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={generateWithAI}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-bold rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
          >
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {isGenerating ? 'Generando...' : 'Generar con IA'}
          </button>

          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-secondary border border-border-medium text-text-primary text-xs font-semibold rounded-xl hover:bg-surface-hover transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir riesgo
          </button>

          {hasUnsaved && (
            <button
              onClick={() => saveRisks(rows)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar
            </button>
          )}

          <button onClick={fetchRisks} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Empty State ── */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-border-medium rounded-2xl text-text-secondary">
          <ShieldAlert className="h-12 w-12 opacity-20" />
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Sin riesgos registrados</p>
            <p className="text-xs opacity-70 max-w-xs">
              Genera los riesgos automáticamente con IA basándote en el perfil del trabajador, o agrégalos manualmente.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateWithAI}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-700 shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Generando...' : 'Generar con IA'}
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-5 py-2.5 bg-surface-secondary border border-border-medium text-text-primary font-semibold rounded-xl hover:bg-surface-hover transition-colors"
            >
              <Plus className="h-4 w-4" /> Añadir manualmente
            </button>
          </div>
        </div>
      )}

      {/* ── Tabla de Riesgos ── */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border-medium shadow-sm">
          <table className="w-full text-xs border-collapse min-w-max">
            <thead className="bg-surface-secondary text-text-secondary uppercase tracking-wide text-[10px] font-bold sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left min-w-[120px]">Proceso</th>
                <th className="px-3 py-2.5 text-left min-w-[90px]">Zona</th>
                <th className="px-3 py-2.5 text-left min-w-[120px]">Actividad</th>
                <th className="px-3 py-2.5 text-left min-w-[90px]">Rutinaria</th>
                <th className="px-3 py-2.5 text-left border-l border-teal-500/30 min-w-[160px]">Peligro</th>
                <th className="px-3 py-2.5 text-left min-w-[110px]">Clasificación</th>
                <th className="px-3 py-2.5 text-left min-w-[140px]">Efectos</th>
                <th className="px-3 py-2.5 text-center border-l border-teal-500/30 min-w-[40px]">ND</th>
                <th className="px-3 py-2.5 text-center min-w-[40px]">NE</th>
                <th className="px-3 py-2.5 text-center min-w-[40px]">NP</th>
                <th className="px-3 py-2.5 text-center min-w-[40px]">NC</th>
                <th className="px-3 py-2.5 text-center min-w-[50px]">NR</th>
                <th className="px-3 py-2.5 text-center min-w-[40px]">Nivel</th>
                <th className="px-3 py-2.5 text-left min-w-[140px] border-l border-teal-500/30">Aceptabilidad</th>
                <th className="px-3 py-2.5 text-center min-w-[70px]">Detalles</th>
                <th className="px-3 py-2.5 text-center min-w-[50px]">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {rows.map((row, idx) => {
                const { color } = NIVEL_NR(row.nr);
                const isExpanded = expandedRow === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr className={`hover:bg-surface-hover/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-primary/30'}`}>
                      <td className="px-2 py-1"><EditableCell value={row.proceso} onChange={v => handleChange(row.id, 'proceso', v)} /></td>
                      <td className="px-2 py-1"><EditableCell value={row.zona} onChange={v => handleChange(row.id, 'zona', v)} /></td>
                      <td className="px-2 py-1"><EditableCell value={row.actividad} onChange={v => handleChange(row.id, 'actividad', v)} /></td>
                      <td className="px-2 py-1">
                        <EditableCell value={row.rutinaria} onChange={v => handleChange(row.id, 'rutinaria', v)} type="select" options={['Sí', 'No']} />
                      </td>
                      <td className="px-2 py-1 border-l border-teal-500/20"><EditableCell value={row.peligro_descripcion} onChange={v => handleChange(row.id, 'peligro_descripcion', v)} /></td>
                      <td className="px-2 py-1">
                        <EditableCell value={row.peligro_clasificacion} onChange={v => handleChange(row.id, 'peligro_clasificacion', v)} type="select" options={CLASIFICACIONES} />
                      </td>
                      <td className="px-2 py-1"><EditableCell value={row.efectos_posibles} onChange={v => handleChange(row.id, 'efectos_posibles', v)} /></td>
                      <td className="px-2 py-1 border-l border-teal-500/20 text-center">
                        <EditableCell value={row.nd} onChange={v => handleChange(row.id, 'nd', v)} type="number" />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <EditableCell value={row.ne} onChange={v => handleChange(row.id, 'ne', v)} type="number" />
                      </td>
                      <td className="px-2 py-1 text-center font-mono text-text-secondary">{row.np}</td>
                      <td className="px-2 py-1 text-center">
                        <EditableCell value={row.nc} onChange={v => handleChange(row.id, 'nc', v)} type="number" />
                      </td>
                      <td className="px-2 py-1 text-center font-bold font-mono">{row.nr}</td>
                      <td className="px-2 py-1 text-center">
                        {row.nr > 0 && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${color}`}>
                            {row.interpretacion_nr}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1 border-l border-teal-500/20 text-[10px] text-text-secondary">{row.aceptabilidad}</td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                          className="p-1 hover:bg-surface-hover rounded-lg transition-colors text-text-secondary hover:text-teal-600"
                          title="Ver controles y medidas"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={() => removeRow(row.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                    {/* Fila expandida: controles y medidas preventivas */}
                    {isExpanded && (
                      <tr className="bg-teal-50/50 dark:bg-teal-900/10">
                        <td colSpan={16} className="px-4 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[10px] mb-2">Controles Existentes</p>
                              <div className="space-y-1.5">
                                {[
                                  { label: 'Fuente', field: 'controles_fuente' },
                                  { label: 'Medio', field: 'controles_medio' },
                                  { label: 'Individuo', field: 'controles_individuo' },
                                ].map(({ label, field }) => (
                                  <div key={field}>
                                    <p className="text-[10px] text-text-tertiary font-semibold">{label}</p>
                                    <EditableCell value={(row as any)[field]} onChange={v => handleChange(row.id, field as keyof BioRiskRow, v)} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-orange-600 dark:text-orange-400 uppercase text-[10px] mb-2">Medidas Preventivas (Jerarquía GTC 45)</p>
                              <div className="space-y-1.5">
                                {[
                                  { label: 'Eliminación', field: 'medida_eliminacion' },
                                  { label: 'Sustitución', field: 'medida_sustitucion' },
                                  { label: 'Ingeniería', field: 'medida_ingenieria' },
                                ].map(({ label, field }) => (
                                  <div key={field}>
                                    <p className="text-[10px] text-text-tertiary font-semibold">{label}</p>
                                    <EditableCell value={(row as any)[field]} onChange={v => handleChange(row.id, field as keyof BioRiskRow, v)} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-purple-600 dark:text-purple-400 uppercase text-[10px] mb-2 mt-4 md:mt-0">EPP y Factores de Reducción</p>
                              <div className="space-y-1.5">
                                {[
                                  { label: 'Administrativo', field: 'medida_administrativa' },
                                  { label: 'EPP / EPU', field: 'medida_eppu' },
                                  { label: 'Factores de Reducción (Anexo E)', field: 'factores_reduccion' },
                                ].map(({ label, field }) => (
                                  <div key={field}>
                                    <p className="text-[10px] text-text-tertiary font-semibold">{label}</p>
                                    <EditableCell value={(row as any)[field]} onChange={v => handleChange(row.id, field as keyof BioRiskRow, v)} />
                                  </div>
                                ))}
                              </div>
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

      {/* ── Footer: Botón guardar flotante ── */}
      {rows.length > 0 && hasUnsaved && (
        <div className="flex justify-end">
          <button
            onClick={() => saveRisks(rows)}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
}
