import React, { useState, useRef } from 'react';
import {
  GitMerge,
  Plus,
  Trash2,
  Save,
  Hammer,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  FileText,
  HelpCircle,
  Eye,
  Filter
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

interface MocItem {
  id: string;
  codigo: string;
  titulo: string;
  tipoCambio: 'Locativo' | 'Maquinaria/Equipo' | 'Procedimiento' | 'Sustancia Química' | 'Personal/Organizacional';
  origen: 'Interno' | 'Externo/Legal';
  descripcion: string;
  peligrosNuevos: string;
  controlesRequeridos: string;
  responsable: string;
  fechaPropuesta: string;
  estado: 'Borrador' | 'En Evaluación' | 'Aprobado con Controles' | 'Implementado';
}

const INITIAL_MOC_ITEMS: MocItem[] = [
  {
    id: '1',
    codigo: 'MOC-2026-001',
    titulo: 'Reconfiguración de layout en línea de ensamble nave A',
    tipoCambio: 'Locativo',
    origen: 'Interno',
    descripcion: 'Modificación del trazado de cintas transportadoras y ensanchamiento de pasillos para flujo continuo.',
    peligrosNuevos: 'Peligro mecánico por atrapamiento, ruido durante montaje y caída de herramientas a distinto nivel.',
    controlesRequeridos: 'Aplicación estricta de LOTO (Bloqueo/Etiquetado), demarcación de área segura y ATS de montaje.',
    responsable: 'Jefe de Operaciones y Mantenimiento',
    fechaPropuesta: '2026-11-15',
    estado: 'Aprobado con Controles'
  },
  {
    id: '2',
    codigo: 'MOC-2026-002',
    titulo: 'Sustitución de solvente industrial clorado por limpiador biodegradable SGA',
    tipoCambio: 'Sustancia Química',
    origen: 'Interno',
    descripcion: 'Reemplazo del tricloroetileno en taller mecánico por desengrasante acuoso no inflamable.',
    peligrosNuevos: 'Contacto dérmico potencial y descarte del solvente anterior según protocolo ambiental.',
    controlesRequeridos: 'Revisión y divulgación de FDS (Ficha de Datos de Seguridad), pruebas de compatibilidad dérmica.',
    responsable: 'Coordinador SG-SST',
    fechaPropuesta: '2026-11-20',
    estado: 'En Evaluación'
  },
  {
    id: '3',
    codigo: 'MOC-2026-003',
    titulo: 'Incorporación de montacargas eléctrico de pasillo angosto',
    tipoCambio: 'Maquinaria/Equipo',
    origen: 'Interno',
    descripcion: 'Adquisición de montacargas trilaterales para optimizar almacenaje en altura de 8 metros.',
    peligrosNuevos: 'Riesgo de atropello a peatones, colisión contra estanterías y caída de cargas suspendidas.',
    controlesRequeridos: 'Certificación de competencia de operadores (SENA), instalación de sensores de proximidad y radar azul (BlueSpot).',
    responsable: 'Director de Logística',
    fechaPropuesta: '2026-10-30',
    estado: 'Implementado'
  }
];

export const GestionCambioWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [mocList, setMocList] = useState<MocItem[]>(INITIAL_MOC_ITEMS);
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Formulario nuevo cambio
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitulo, setNewTitulo] = useState('');
  const [newTipo, setNewTipo] = useState<MocItem['tipoCambio']>('Maquinaria/Equipo');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newPeligros, setNewPeligros] = useState('');
  const [newControles, setNewControles] = useState('');
  const [newResponsable, setNewResponsable] = useState('');
  const [newFecha, setNewFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newEstado, setNewEstado] = useState<MocItem['estado']>('En Evaluación');

  const handleAddMoc = () => {
    if (!newTitulo.trim() || !newDescripcion.trim() || !newPeligros.trim()) {
      showToast({ message: 'Completa el título, descripción y nuevos peligros identificados.', status: 'warning' });
      return;
    }

    const nextNumber = String(mocList.length + 1).padStart(3, '0');
    const newMoc: MocItem = {
      id: Date.now().toString(),
      codigo: `MOC-2026-${nextNumber}`,
      titulo: newTitulo.trim(),
      tipoCambio: newTipo,
      origen: 'Interno',
      descripcion: newDescripcion.trim(),
      peligrosNuevos: newPeligros.trim(),
      controlesRequeridos: newControles.trim() || 'Evaluar controles de ingeniería y EPP previo a la ejecución',
      responsable: newResponsable.trim() || 'Líder del Área Solicitante',
      fechaPropuesta: newFecha,
      estado: newEstado
    };

    setMocList(prev => [newMoc, ...prev]);
    setNewTitulo('');
    setNewDescripcion('');
    setNewPeligros('');
    setNewControles('');
    setNewResponsable('');
    setIsFormOpen(false);
    showToast({ message: `Solicitud de cambio ${newMoc.codigo} registrada con éxito.`, status: 'success' });
  };

  const handleDeleteMoc = (id: string) => {
    setMocList(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    try {
      localStorage.setItem('wappy_iso45001_gestion_cambio', JSON.stringify(mocList));
      showToast({ message: 'Padrón de Gestión del Cambio (MOC) guardado localmente.', status: 'success' });
    } catch {
      showToast({ message: 'Error al guardar los datos en almacenamiento local.', status: 'error' });
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const rowsHtml = mocList.map(m => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${m.codigo}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>${m.titulo}</strong><br><small style="color: #64748b;">${m.tipoCambio} · ${m.origen}</small></td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${m.descripcion}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #b91c1c;">${m.peligrosNuevos}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #047857;">${m.controlesRequeridos}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${m.responsable}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center;"><strong>${m.estado}</strong></td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            PROCEDIMIENTO Y REGISTRO DE GESTIÓN DEL CAMBIO OPERACIONAL (MOC)
          </h1>
          <p><strong>Normativa Técnica Internacional:</strong> ISO 45001:2018 Cláusula 8.1.3 (Gestión del Cambio)</p>
          <p><strong>Alineación Jurídica Nacional:</strong> Decreto 1072 de 2015 Art. 2.2.4.6.26 · Resolución 0312 de 2019 Estándar 2.12.1</p>
          <p><strong>Fecha de Evaluación:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2 style="color: #0f766e; margin-top: 24px;">1. Objetivo y Alcance</h2>
          <p>Garantizar que todo cambio planificado, temporal o permanente (en infraestructura, procesos, equipos, sustancias químicas o legislación) sea evaluado sistemáticamente antes de su implementación, identificando nuevos peligros en el SG-SST y adoptando las medidas de control pertinentes.</p>

          <h2 style="color: #0f766e; margin-top: 24px;">2. Registro y Control de Solicitudes de Cambio (MOC)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 8px; border: 1px solid #0f766e;">Código</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Denominación / Tipo</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Descripción del Cambio</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Peligros Nuevos Identificados</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Controles Requeridos Previos</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Responsable</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <h2 style="color: #0f766e; margin-top: 28px;">3. Comunicación, Consulta y Capacitación</h2>
          <p>Todo cambio aprobado debe comunicarse oportunamente al COPASST o Vigía de SST, actualizarse en la Matriz IPEVAR (GTC 45) y capacitar al personal involucrado antes de la puesta en marcha de la nueva condición.</p>
        </div>
      `;
      setGeneratedReport(html);
      editorContentRef.current = html;
      showToast({ message: 'Informe de Gestión del Cambio (MOC) generado con éxito.', status: 'success' });
    } catch {
      showToast({ message: 'Error al compilar el informe técnico MOC.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  useAutoLoadReport({
    token,
    tags: ['sgsst-gestion-cambio'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  const filteredMoc = filterEstado === 'todos'
    ? mocList
    : mocList.filter(m => m.estado.toLowerCase() === filterEstado.toLowerCase());

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER PRINCIPAL GESTIÓN DEL CAMBIO (WAPPY DESIGN SYSTEM) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 text-white shadow-lg shadow-teal-500/20">
              <GitMerge className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Gestión del Cambio en SST (MOC - Management of Change)
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${mocList.length} Solicitudes de Cambio Registradas`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {mocList.length} Solicitudes MOC
                    </span>
                  </div>
                </div>

                {/* ISO 45001 Num. 8.1.3 · Dec. 1072 Art. 2.2.4.6.26: CUMPLE */}
                <SGSSTLegalBadge
                  standardCode="2.12.1"
                  label="ISO 45001 Num. 8.1.3 · Dec. 1072 Art. 2.2.4.6.26: CUMPLE"
                  tooltip="ISO 45001:2018 Cláusula 8.1.3 (Gestión del cambio) · Dec. 1072/15 Art. 2.2.4.6.26 y Res. 0312/2019 Estándar 2.12.1"
                  moduleName="Gestión del Cambio MOC"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={() => setIsFormOpen(!isFormOpen)}
              icon={Plus}
              label={isFormOpen ? "Cerrar Formulario" : "Nueva Solicitud MOC"}
              variant="teal"
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
            Módulo en Construcción (Fase Beta · Flujo de Solicitud y Aprobación MOC)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            Este aplicativo implementa el mandato de la <strong>Cláusula 8.1.3 de ISO 45001:2018 y Decreto 1072 Art. 2.2.4.6.26</strong>.
            Permite a las áreas radicar solicitudes de cambios locativos, técnicos o de procesos, evaluar preventivamente sus riesgos en SST y aprobar controles antes de su puesta en marcha.
          </p>
        </div>
      </div>

      {/* ─── FORMULARIO DESPLEGABLE NUEVA SOLICITUD MOC ─── */}
      {isFormOpen && (
        <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/70 backdrop-blur-md shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-500" /> Radicar Solicitud de Cambio (MOC)
            </h3>
            <span className="text-[11px] text-text-tertiary">ISO 45001 Cláusula 8.1.3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Título del Cambio</label>
              <input
                type="text"
                placeholder="Ej: Cambio de compresor industrial en sala de máquinas..."
                value={newTitulo}
                onChange={(e) => setNewTitulo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Tipo de Cambio</label>
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Locativo">Locativo / Infraestructura</option>
                <option value="Maquinaria/Equipo">Maquinaria / Equipo</option>
                <option value="Procedimiento">Procedimiento / Método</option>
                <option value="Sustancia Química">Sustancia Química / Insumo</option>
                <option value="Personal/Organizacional">Personal / Estructura</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Estado Inicial</label>
              <select
                value={newEstado}
                onChange={(e) => setNewEstado(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="En Evaluación">En Evaluación</option>
                <option value="Aprobado con Controles">Aprobado con Controles</option>
                <option value="Borrador">Borrador</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Descripción Detallada del Cambio</label>
              <textarea
                rows={2}
                placeholder="Explica qué se modificará, sustituirá o implementará..."
                value={newDescripcion}
                onChange={(e) => setNewDescripcion(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block text-red-600 dark:text-red-400">
                Peligros Nuevos en SST (IPEVAR)
              </label>
              <textarea
                rows={2}
                placeholder="¿Qué nuevos riesgos mecánicos, eléctricos, químicos o ergonómicos surgen?..."
                value={newPeligros}
                onChange={(e) => setNewPeligros(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-red-500/30 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block text-emerald-600 dark:text-emerald-400">
                Medidas de Control Previas
              </label>
              <textarea
                rows={2}
                placeholder="Controles requeridos antes de autorizar la ejecución..."
                value={newControles}
                onChange={(e) => setNewControles(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-500/30 bg-surface-secondary text-text-primary"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Responsable de evaluación..."
                value={newResponsable}
                onChange={(e) => setNewResponsable(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="date"
                value={newFecha}
                onChange={(e) => setNewFecha(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-secondary"
              >
                Cancelar
              </button>
              <ExpandingButton
                onClick={handleAddMoc}
                icon={Plus}
                label="Registrar Solicitud"
                variant="teal"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── FILTROS Y TABLA DE SOLICITUDES MOC ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-secondary">Filtrar por estado:</span>
            <div className="flex items-center gap-1">
              {['todos', 'Aprobado con Controles', 'En Evaluación', 'Implementado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterEstado(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    filterEstado === st
                      ? 'bg-teal-500 text-white shadow-xs'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  {st === 'todos' ? 'Todos' : st}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-text-tertiary">
            Mostrando {filteredMoc.length} de {mocList.length} solicitudes
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Denominación & Tipo</th>
                <th className="p-3">Peligros Nuevos en SST</th>
                <th className="p-3">Controles Requeridos</th>
                <th className="p-3">Responsable</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-white/5 bg-surface-primary/40">
              {filteredMoc.map((m) => (
                <tr key={m.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">{m.codigo}</td>
                  <td className="p-3 max-w-xs">
                    <p className="font-bold text-text-primary leading-tight">{m.titulo}</p>
                    <span className="text-[10px] text-text-tertiary mt-0.5 inline-block">{m.tipoCambio} · {m.fechaPropuesta}</span>
                  </td>
                  <td className="p-3 text-red-600 dark:text-red-400 font-medium max-w-xs">{m.peligrosNuevos}</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium max-w-xs">{m.controlesRequeridos}</td>
                  <td className="p-3 text-text-secondary text-[11px]">{m.responsable}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.estado === 'Implementado'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : m.estado === 'Aprobado con Controles'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {m.estado}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteMoc(m.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                      title="Eliminar solicitud"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        onSaveLocal={handleSaveLocal}
        isSavingLocal={isSavingLocal}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Gestion_del_Cambio_MOC_ISO45001_${Date.now()}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Procedimiento y Dictamen de Gestión del Cambio (ISO 45001 Num. 8.1.3)"
        icon={<GitMerge className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Gestion_del_Cambio_MOC_ISO45001"
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
            reportSourceData={mocList}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default GestionCambioWorkspace;
