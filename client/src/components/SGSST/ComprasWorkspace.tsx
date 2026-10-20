import React, { useState, useRef } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  Hammer,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Shield,
  FileCheck,
  Package,
  Layers,
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

interface CompraItem {
  id: string;
  codigo: string;
  productoServicio: string;
  categoria: 'Elementos de Protección Personal (EPP)' | 'Maquinaria y Herramientas' | 'Sustancias Químicas' | 'Servicios e Instalaciones';
  proveedorSugerido: string;
  especificacionesSST: string;
  criteriosVerificados: string;
  dictamenSST: 'Aprobado para Compra' | 'Condicionado / Exige Ajuste' | 'Rechazado';
  fechaEvaluacion: string;
}

const INITIAL_COMPRAS: CompraItem[] = [
  {
    id: '1',
    codigo: 'ADQ-2026-001',
    productoServicio: 'Lote de arneses de cuerpo entero dieléctricos 4 argollas',
    categoria: 'Elementos de Protección Personal (EPP)',
    proveedorSugerido: 'Seguridad y Alturas Industrial SAS',
    especificacionesSST: 'Certificación ANSI/ASSE Z359.11-2021, resistencia dieléctrica 20kV y etiqueta indeleble con fecha de fabricación.',
    criteriosVerificados: 'Certificado de laboratorio acreditado, ficha técnica en español y garantía de 5 años.',
    dictamenSST: 'Aprobado para Compra',
    fechaEvaluacion: '2026-10-10'
  },
  {
    id: '2',
    codigo: 'ADQ-2026-002',
    productoServicio: 'Desengrasante alcalino concentrado para lavado de motores',
    categoria: 'Sustancias Químicas',
    proveedorSugerido: 'Químicos y Soluciones Ecológicas Ltda',
    especificacionesSST: 'FDS (Ficha de Datos de Seguridad) en 16 secciones bajo Sistema Globalmente Armonizado (SGA / Dec. 1496/18) y pH controlado.',
    criteriosVerificados: 'Evaluación de compatibilidad con bodega central; se exige uso mandatorio de guantes de nitrilo calibre 15.',
    dictamenSST: 'Condicionado / Exige Ajuste',
    fechaEvaluacion: '2026-10-14'
  },
  {
    id: '3',
    codigo: 'ADQ-2026-003',
    productoServicio: 'Sierra ingletadora telescópica de 12 pulgadas para carpintería',
    categoria: 'Maquinaria y Herramientas',
    proveedorSugerido: 'Maquinaria Pesada del Caribe SAS',
    especificacionesSST: 'Guarda protectora retráctil envolvente, interruptor de hombre muerto (dead-man) y salida de aspiración de aserrín.',
    criteriosVerificados: 'Inspección técnica visual y verificación de nivel de presión acústica (< 82 dB).',
    dictamenSST: 'Aprobado para Compra',
    fechaEvaluacion: '2026-10-18'
  }
];

export const ComprasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [compras, setCompras] = useState<CompraItem[]>(INITIAL_COMPRAS);
  const [filterDictamen, setFilterDictamen] = useState<string>('todos');

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Formulario nueva evaluación de compra
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newProducto, setNewProducto] = useState('');
  const [newCategoria, setNewCategoria] = useState<CompraItem['categoria']>('Elementos de Protección Personal (EPP)');
  const [newProveedor, setNewProveedor] = useState('');
  const [newEspecificaciones, setNewEspecificaciones] = useState('');
  const [newCriterios, setNewCriterios] = useState('');
  const [newDictamen, setNewDictamen] = useState<CompraItem['dictamenSST']>('Aprobado para Compra');

  const countAprobados = compras.filter(c => c.dictamenSST === 'Aprobado para Compra').length;

  const handleAddCompra = () => {
    if (!newProducto.trim() || !newEspecificaciones.trim()) {
      showToast({ message: 'Completa el nombre del producto y las especificaciones técnicas SST.', status: 'warning' });
      return;
    }

    const nextCode = `ADQ-2026-${String(compras.length + 1).padStart(3, '0')}`;
    const newItem: CompraItem = {
      id: Date.now().toString(),
      codigo: nextCode,
      productoServicio: newProducto.trim(),
      categoria: newCategoria,
      proveedorSugerido: newProveedor.trim() || 'Por definir por compras',
      especificacionesSST: newEspecificaciones.trim(),
      criteriosVerificados: newCriterios.trim() || 'Verificación documental técnica de seguridad',
      dictamenSST: newDictamen,
      fechaEvaluacion: new Date().toISOString().split('T')[0]
    };

    setCompras(prev => [newItem, ...prev]);
    setNewProducto('');
    setNewProveedor('');
    setNewEspecificaciones('');
    setNewCriterios('');
    setIsFormOpen(false);
    showToast({ message: `Evaluación de compra ${newItem.codigo} registrada con éxito.`, status: 'success' });
  };

  const handleDeleteCompra = (id: string) => {
    setCompras(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    try {
      localStorage.setItem('wappy_iso45001_compras', JSON.stringify(compras));
      showToast({ message: 'Padrón de Compras y Adquisiciones SST guardado localmente.', status: 'success' });
    } catch {
      showToast({ message: 'Error al guardar los datos en almacenamiento local.', status: 'error' });
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const rowsHtml = compras.map(c => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${c.codigo}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>${c.productoServicio}</strong><br><small style="color: #64748b;">${c.categoria}</small></td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.proveedorSugerido}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.especificacionesSST}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.criteriosVerificados}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold; color: ${
            c.dictamenSST === 'Aprobado para Compra' ? '#047857' : c.dictamenSST === 'Rechazado' ? '#b91c1c' : '#b45309'
          };">${c.dictamenSST}</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            PROCEDIMIENTO Y REGISTRO DE COMPRAS Y ADQUISICIONES EN SST
          </h1>
          <p><strong>Normativa Técnica Internacional:</strong> ISO 45001:2018 Cláusula 8.1.4.1 (Compras y Adquisición de Bienes)</p>
          <p><strong>Alineación Jurídica Nacional:</strong> Decreto 1072 de 2015 Art. 2.2.4.6.27 · Resolución 0312 de 2019 Estándar 2.10.1</p>
          <p><strong>Fecha de Evaluación:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2 style="color: #0f766e; margin-top: 24px;">1. Objeto y Alcance</h2>
          <p>Establecer los controles y especificaciones técnicas de Seguridad y Salud en el Trabajo aplicables a la compra o arrendamiento de bienes, materias primas, insumos químicos, maquinaria, herramientas y elementos de protección personal (EPP), garantizando que no se introduzcan peligros incontrolados a los centros de trabajo.</p>

          <h2 style="color: #0f766e; margin-top: 24px;">2. Evaluación Previa a la Orden de Compra</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 8px; border: 1px solid #0f766e;">Código</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Producto / Insumo</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Proveedor</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Especificaciones SST Requeridas</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Criterios Verificados</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Dictamen SST</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <h2 style="color: #0f766e; margin-top: 28px;">3. Recepción en Almacén e Inspección de Entrada</h2>
          <p>Al momento de la entrega física, el personal de compras y almacén cotejará que los productos entregados correspondan exactamente con las certificaciones y fichas de seguridad avaladas en este dictamen técnico.</p>
        </div>
      `;
      setGeneratedReport(html);
      editorContentRef.current = html;
      showToast({ message: 'Informe de Compras y Adquisiciones SST generado con éxito.', status: 'success' });
    } catch {
      showToast({ message: 'Error al compilar el informe con IA.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  useAutoLoadReport({
    token,
    tags: ['sgsst-compras'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  const filtered = filterDictamen === 'todos'
    ? compras
    : compras.filter(c => c.dictamenSST.toLowerCase() === filterDictamen.toLowerCase());

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER PRINCIPAL COMPRAS (WAPPY DESIGN SYSTEM) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-amber-500 text-white shadow-lg shadow-teal-500/20">
              <ShoppingBag className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Compras y Adquisiciones en SST
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${compras.length} Adquisiciones Evaluadas en SST`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {compras.length} Adquisiciones Evaluadas
                    </span>
                  </div>
                </div>

                <div
                  title={`${countAprobados} Productos con Visto Bueno para Compra`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-surface-primary text-emerald-700 dark:text-emerald-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {countAprobados} Aprobados SST
                    </span>
                  </div>
                </div>

                {/* ISO 45001 Num. 8.1.4.1 · Dec. 1072 Art. 2.2.4.6.27: CUMPLE */}
                <SGSSTLegalBadge
                  standardCode="8.1.4.1"
                  label="ISO 45001 Num. 8.1.4.1 · Dec. 1072 Art. 2.2.4.6.27: CUMPLE"
                  tooltip="ISO 45001:2018 Cláusula 8.1.4.1 (Compras y adquisiciones de bienes y servicios) · Dec. 1072/15 Art. 2.2.4.6.27 y Res. 0312/2019 Estándar 2.10.1"
                  moduleName="Compras y Adquisiciones en SST"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={() => setIsFormOpen(!isFormOpen)}
              icon={Plus}
              label={isFormOpen ? "Cerrar Formulario" : "Nueva Evaluación"}
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
            Módulo en Construcción (Fase Beta · Filtro Preventivo de Compras ISO 45001)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            Este aplicativo da cumplimiento estricto a la <strong>Cláusula 8.1.4.1 de ISO 45001:2018 y Decreto 1072 Art. 2.2.4.6.27</strong>.
            Garantiza que toda compra de insumos, maquinaria, EPP o químicos cuente con el dictamen y verificación de especificaciones de seguridad antes de emitir la orden de compra.
          </p>
        </div>
      </div>

      {/* ─── FORMULARIO REGISTRO NUEVA EVALUACIÓN DE COMPRA ─── */}
      {isFormOpen && (
        <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/70 backdrop-blur-md shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-500" /> Evaluar Nuevo Requerimiento de Compra
            </h3>
            <span className="text-[11px] text-text-tertiary">ISO 45001 Cláusula 8.1.4.1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Producto / Insumo / Equipo</label>
              <input
                type="text"
                placeholder="Ej: Caretas para soldadura con oscurecimiento automático..."
                value={newProducto}
                onChange={(e) => setNewProducto(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Categoría de Compra</label>
              <select
                value={newCategoria}
                onChange={(e) => setNewCategoria(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Elementos de Protección Personal (EPP)">Elementos de Protección Personal (EPP)</option>
                <option value="Maquinaria y Herramientas">Maquinaria y Herramientas</option>
                <option value="Sustancias Químicas">Sustancias Químicas</option>
                <option value="Servicios e Instalaciones">Servicios e Instalaciones</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Proveedor Sugerido</label>
              <input
                type="text"
                placeholder="Ej: Distribuidora Industrial de Seguridad..."
                value={newProveedor}
                onChange={(e) => setNewProveedor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Especificaciones Técnicas y Normas SST</label>
              <input
                type="text"
                placeholder="Ej: Norma ANSI Z87.1, protección UV/IR DIN 9-13, certificado de laboratorio..."
                value={newEspecificaciones}
                onChange={(e) => setNewEspecificaciones(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Dictamen SST</label>
              <select
                value={newDictamen}
                onChange={(e) => setNewDictamen(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Aprobado para Compra">Aprobado para Compra</option>
                <option value="Condicionado / Exige Ajuste">Condicionado / Exige Ajuste</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <input
              type="text"
              placeholder="Criterios verificados (FDS, manual, ficha técnica)..."
              value={newCriterios}
              onChange={(e) => setNewCriterios(e.target.value)}
              className="flex-1 w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-secondary"
              >
                Cancelar
              </button>
              <ExpandingButton
                onClick={handleAddCompra}
                icon={Plus}
                label="Emitir Dictamen"
                variant="teal"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TABLA DE COMPRAS EVALUADAS EN SST ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-secondary">Filtrar por dictamen:</span>
            <div className="flex items-center gap-1">
              {['todos', 'Aprobado para Compra', 'Condicionado / Exige Ajuste', 'Rechazado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterDictamen(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    filterDictamen === st
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
            Mostrando {filtered.length} de {compras.length} evaluaciones
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Producto / Insumo</th>
                <th className="p-3">Proveedor Sugerido</th>
                <th className="p-3">Especificaciones SST Requeridas</th>
                <th className="p-3">Criterios Verificados</th>
                <th className="p-3 text-center">Dictamen SST</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-white/5 bg-surface-primary/40">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">{c.codigo}</td>
                  <td className="p-3 max-w-xs">
                    <p className="font-bold text-text-primary leading-tight">{c.productoServicio}</p>
                    <span className="text-[10px] text-text-tertiary mt-0.5 inline-block">{c.categoria}</span>
                  </td>
                  <td className="p-3 text-text-secondary text-[11px]">{c.proveedorSugerido}</td>
                  <td className="p-3 text-text-secondary max-w-xs text-[11px]">{c.especificacionesSST}</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium max-w-xs text-[11px]">{c.criteriosVerificados}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.dictamenSST === 'Aprobado para Compra'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : c.dictamenSST === 'Rechazado'
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {c.dictamenSST}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteCompra(c.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors"
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
        exportFileName={`Compras_Adquisiciones_SST_ISO45001_${Date.now()}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Procedimiento y Dictamen de Compras SST (ISO 45001 Num. 8.1.4.1)"
        icon={<ShoppingBag className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Compras_Adquisiciones_SST_ISO45001"
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
            reportSourceData={compras}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default ComprasWorkspace;
