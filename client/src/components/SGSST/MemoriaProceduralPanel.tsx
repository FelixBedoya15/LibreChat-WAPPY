import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Brain,
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  Sparkles,
  Layers,
  Sliders,
  ShieldAlert,
  FileText,
  RefreshCw,
  CheckCircle2,
  PauseCircle,
  Zap,
} from 'lucide-react';
import { ExpandableButton } from '~/components/Common/ExpandableButton';

export interface ProceduralMemoryRule {
  id: string;
  _id?: string;
  category: string;
  trigger: string;
  rule: string;
  isActive: boolean;
  usageCount?: number;
  updatedAt?: string;
}

const CATEGORY_META: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  habito_operativo: {
    label: 'Flujo entre Hitos / Operativo',
    badgeClass:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50',
    icon: <Layers className="w-3.5 h-3.5 text-teal-500" />,
  },
  preferencia_ui: {
    label: 'Interfaz WAPPY & Lienzo Canvas',
    badgeClass:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
    icon: <Sliders className="w-3.5 h-3.5 text-purple-500" />,
  },
  criterio_riesgo: {
    label: 'Criterio de Matrices (GTC-45 / PESV)',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />,
  },
  estilo_tono: {
    label: 'Formato Documental & Delegación',
    badgeClass:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
    icon: <FileText className="w-3.5 h-3.5 text-indigo-500" />,
  },
};

const WAPPY_PRESET_TEMPLATES: Array<{
  title: string;
  category: string;
  trigger: string;
  rule: string;
}> = [
  {
    title: 'Hito 1 → Hito 3: Riesgo GTC-45 Crítico al Cronograma',
    category: 'habito_operativo',
    trigger: 'Al guardar un peligro con Nivel de Riesgo I o II (NR >= 150) en la Matriz IPEVR del Hito 1',
    rule: 'Crear automáticamente una actividad preventiva en el Cronograma Anual SST (Hito 3) con responsable Coordinador SG-SST.',
  },
  {
    title: 'Hito 2 → Hito 3: Examen de Egreso al Retirar Trabajador',
    category: 'habito_operativo',
    trigger: 'Al aprobar el retiro de un trabajador en Huella Biocéntrica (Hito 2)',
    rule: 'Programar automáticamente una tarea en el Cronograma SST (Hito 3) para seguimiento de su examen médico de egreso en 5 días hábiles.',
  },
  {
    title: 'Hito 2 → Hito 4: Nuevo Trabajador con Perfil y EPP',
    category: 'habito_operativo',
    trigger: 'Al registrar un trabajador nuevo en Huella Biocéntrica (Hito 2)',
    rule: 'Verificar si su cargo existe en Perfiles de Cargo; si no existe, crearlo y registrar la entrega inicial de EPP en el Hito 4.',
  },
  {
    title: 'Abrir Documentos Siempre en Lienzo Canvas',
    category: 'preferencia_ui',
    trigger: 'Cuando solicite redactar un acta, procedimiento, política o formato SST',
    rule: 'Abrirlo directamente en el Lienzo Canvas interactivo (canvas_documento) con el encabezado de la empresa listo para exportar a PDF/Word.',
  },
  {
    title: 'Evitar Abrir Chats Nuevos al Operar Datos',
    category: 'estilo_tono',
    trigger: 'Cuando pida alimentar matrices, consultar censo o gestionar Hitos desde Tenshi',
    rule: 'Ejecutar directamente las herramientas de WAPPY desde el chat flotante de Tenshi sin delegar ni abrir una conversación nueva, salvo que lo pida explícitamente.',
  },
  {
    title: 'Navegación Automática al Hito Modificado',
    category: 'preferencia_ui',
    trigger: 'Después de guardar un registro en cualquier Hito de WAPPY (Matriz IPEVR, Trabajadores, Cronograma)',
    rule: 'Llevarme automáticamente a la pantalla de ese Hito usando navegación visual para verificar el cambio en vivo.',
  },
];

export default function MemoriaProceduralPanel() {
  const [rules, setRules] = useState<ProceduralMemoryRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPresets, setShowPresets] = useState<boolean>(true);

  // Create / Edit Modal or Inline Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<string>('habito_operativo');
  const [formTrigger, setFormTrigger] = useState<string>('');
  const [formRule, setFormRule] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tenshi/procedural-memory?includeInactive=true');
      if (Array.isArray(res.data)) {
        setRules(
          res.data.map((r: any) => ({
            id: String(r.id || r._id),
            _id: String(r._id || r.id),
            category: r.category || 'habito_operativo',
            trigger: r.trigger || '',
            rule: r.rule || '',
            isActive: r.isActive !== false,
            usageCount: r.usageCount || 0,
            updatedAt: r.updatedAt,
          })),
        );
      }
    } catch (err) {
      console.error('[MemoriaProceduralPanel] Error cargando reglas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const openCreateForm = (preset?: {
    category: string;
    trigger: string;
    rule: string;
  }) => {
    setEditingRuleId(null);
    setFormCategory(preset?.category || 'habito_operativo');
    setFormTrigger(preset?.trigger || '');
    setFormRule(preset?.rule || '');
    setIsFormOpen(true);
  };

  const openEditForm = (item: ProceduralMemoryRule) => {
    setEditingRuleId(item.id);
    setFormCategory(item.category || 'habito_operativo');
    setFormTrigger(item.trigger || '');
    setFormRule(item.rule || '');
    setIsFormOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTrigger.trim() || !formRule.trim() || saving) return;
    setSaving(true);
    try {
      if (editingRuleId) {
        const res = await axios.put(`/api/tenshi/procedural-memory/${editingRuleId}`, {
          category: formCategory,
          trigger: formTrigger.trim(),
          rule: formRule.trim(),
        });
        if (res.data?.item) {
          setRules((prev) =>
            prev.map((r) => (r.id === editingRuleId ? { ...r, ...res.data.item } : r)),
          );
        } else {
          await fetchRules();
        }
        showToast('Regla actualizada para Tenshi y los Agentes IA');
      } else {
        await axios.post('/api/tenshi/procedural-memory', {
          category: formCategory,
          trigger: formTrigger.trim(),
          rule: formRule.trim(),
        });
        await fetchRules();
        showToast('Nueva regla guardada y activa en Tenshi y Agentes IA');
      }
      setIsFormOpen(false);
      setEditingRuleId(null);
      setFormTrigger('');
      setFormRule('');
    } catch (err) {
      console.error('[MemoriaProceduralPanel] Error guardando regla:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: ProceduralMemoryRule) => {
    const nextState = !item.isActive;
    setRules((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, isActive: nextState } : r)),
    );
    try {
      await axios.put(`/api/tenshi/procedural-memory/${item.id}`, {
        isActive: nextState,
      });
      showToast(
        nextState
          ? 'Regla activada en Tenshi y Agentes'
          : 'Regla pausada temporalmente',
      );
    } catch (err) {
      setRules((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, isActive: item.isActive } : r)),
      );
    }
  };

  const handleDeleteRule = async (id: string) => {
    const prevRules = [...rules];
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await axios.delete(`/api/tenshi/procedural-memory/${id}`);
      showToast('Regla eliminada de la Memoria Procedural');
    } catch (err) {
      setRules(prevRules);
    }
  };

  const handleApplyPresetDirect = async (preset: {
    title: string;
    category: string;
    trigger: string;
    rule: string;
  }) => {
    setSaving(true);
    try {
      await axios.post('/api/tenshi/procedural-memory', {
        category: preset.category,
        trigger: preset.trigger,
        rule: preset.rule,
      });
      await fetchRules();
      showToast(`Plantilla "${preset.title}" activada en Tenshi`);
    } catch (err) {
      console.error('[MemoriaProceduralPanel] Error aplicando plantilla:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.trigger || '').toLowerCase().includes(q) ||
        (r.rule || '').toLowerCase().includes(q)
      );
    });
  }, [rules, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.isActive).length;
    const hitosFlows = rules.filter((r) => r.category === 'habito_operativo').length;
    const uiPrefs = rules.filter(
      (r) => r.category === 'preferencia_ui' || r.category === 'estilo_tono',
    ).length;
    return { total, active, hitosFlows, uiPrefs };
  }, [rules]);

  return (
    <div className="px-6 py-5 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Memoria Procedural de Tenshi & Colmena de Agentes IA
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
            Configura las reglas personalizadas, flujos automáticos entre Hitos y preferencias de interfaz que Tenshi y los 17 especialistas obedecerán siempre en tu cuenta.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ExpandableButton
            onClick={() => setShowPresets((v) => !v)}
            variant="amber"
            isActive={showPresets}
            icon={<Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />}
            label={showPresets ? 'Ocultar Plantillas WAPPY' : 'Ver Plantillas WAPPY'}
          />

          <ExpandableButton
            onClick={() => openCreateForm()}
            variant="teal"
            icon={<Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />}
            label="Nueva Regla para Tenshi"
          />
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Total Reglas
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Activas en Tenshi
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.active}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Flujos entre Hitos
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {stats.hitosFlows}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Interfaz & Canvas
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {stats.uiPrefs}
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Rule Form Card */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveRule}
          className="bg-white dark:bg-zinc-900 border-2 border-teal-500/70 dark:border-teal-500/50 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {editingRuleId
                  ? 'Editar Regla de Memoria Procedural'
                  : 'Crear Nueva Regla para Tenshi & Agentes'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingRuleId(null);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Categoría del Sistema WAPPY
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="habito_operativo">Flujo entre Hitos / Operativo</option>
                <option value="preferencia_ui">Interfaz WAPPY & Lienzo Canvas</option>
                <option value="criterio_riesgo">Criterio de Matrices (GTC-45 / PESV)</option>
                <option value="estilo_tono">Formato Documental & Delegación</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                ¿Cuándo se dispara esta regla? (Condición o Acción en WAPPY)
              </label>
              <input
                type="text"
                required
                value={formTrigger}
                onChange={(e) => setFormTrigger(e.target.value)}
                placeholder="Ej: Al guardar un peligro Nivel I o II en la Matriz IPEVR del Hito 1..."
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              ¿Qué debe hacer Tenshi o el Agente automáticamente? (Instrucción obligatoria)
            </label>
            <textarea
              required
              rows={2}
              value={formRule}
              onChange={(e) => setFormRule(e.target.value)}
              placeholder="Ej: Crear automáticamente una tarea preventiva en el Cronograma Anual SST del Hito 3 con responsable Coordinador SG-SST."
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingRuleId(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : editingRuleId ? 'Guardar Cambios' : 'Activar Regla'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Quick WAPPY System Templates */}
      {showPresets && (
        <div className="bg-gradient-to-br from-teal-50/60 via-white to-amber-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800/70 border border-teal-200/60 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                Plantillas Recomendadas de Flujos WAPPY (Activar o Personalizar en 1 clic)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {WAPPY_PRESET_TEMPLATES.map((preset, idx) => {
              const alreadyAdded = rules.some(
                (r) =>
                  r.trigger.toLowerCase().trim() === preset.trigger.toLowerCase().trim(),
              );
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs hover:border-teal-400/70 transition-all"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {preset.title}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">
                        Cuando:
                      </span>{' '}
                      {preset.trigger}
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300 leading-snug">
                      <span className="font-semibold">Acción WAPPY:</span> {preset.rule}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => openCreateForm(preset)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      Personalizar
                    </button>
                    <button
                      type="button"
                      disabled={alreadyAdded || saving}
                      onClick={() => handleApplyPresetDirect(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        alreadyAdded
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 cursor-default'
                          : 'bg-teal-600 hover:bg-teal-500 text-white shadow-2xs active:scale-95'
                      }`}
                    >
                      {alreadyAdded ? '✓ Ya activa' : '+ Activar en Tenshi'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar regla por disparador, Hito o instrucción..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'habito_operativo', label: 'Flujos Hitos' },
            { id: 'preferencia_ui', label: 'Interfaz & Canvas' },
            { id: 'criterio_riesgo', label: 'Criterio Matrices' },
            { id: 'estilo_tono', label: 'Formato & Delegación' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                selectedCategory === tab.id
                  ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300'
                  : 'bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={fetchRules}
            title="Recargar reglas"
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
            Cargando reglas de Memoria Procedural...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-2">
            <Brain className="w-8 h-8 text-teal-500 mx-auto opacity-80" />
            <div className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              No hay reglas registradas en esta vista
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
              Usa el botón <strong>&ldquo;Nueva Regla para Tenshi&rdquo;</strong> o activa cualquiera de las plantillas de arriba para personalizar cómo Tenshi opera tu SG-SST.
            </p>
          </div>
        ) : (
          filteredRules.map((item) => {
            const cat = CATEGORY_META[item.category] || CATEGORY_META.habito_operativo;
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs ${
                  item.isActive
                    ? 'border-slate-200/90 dark:border-zinc-800'
                    : 'border-slate-200/50 dark:border-zinc-800/50 opacity-60'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.badgeClass}`}
                    >
                      {cat.icon}
                      {cat.label}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {item.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Activa
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3 h-3" /> Pausada
                        </>
                      )}
                    </span>
                  </div>

                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Cuando: <span className="font-bold text-teal-700 dark:text-teal-300">{item.trigger}</span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      Acción obligatoria en WAPPY:
                    </span>{' '}
                    {item.rule}
                  </div>
                </div>

                {/* Micro-Botones de Acción (WAPPY Design System Rule 4.3) */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* Switch Activa / Pausada */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    title={item.isActive ? 'Pausar regla' : 'Activar regla'}
                    className={`group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-2 shadow-sm active:scale-95 ${
                      item.isActive
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200'
                    }`}
                  >
                    {item.isActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <PauseCircle className="w-3.5 h-3.5" />
                    )}
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                      <span className="text-[10px] font-bold">
                        {item.isActive ? 'Pausar' : 'Activar'}
                      </span>
                    </div>
                  </button>

                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => openEditForm(item)}
                    title="Editar regla"
                    className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                      <span className="text-[10px] font-bold">Editar</span>
                    </div>
                  </button>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(item.id)}
                    title="Eliminar regla"
                    className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                      <span className="text-[10px] font-bold">Eliminar</span>
                    </div>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
