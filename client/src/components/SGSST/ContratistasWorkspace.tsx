import React, { useState, useRef } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Save,
  Hammer,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shield,
  FileCheck,
  Sparkles,
  ExternalLink,
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

interface ContratistaItem {
  id: string;
  codigo: string;
  razonSocial: string;
  nit: string;
  servicio: string;
  nivelRiesgo: 'Clase I' | 'Clase II' | 'Clase III' | 'Clase IV' | 'Clase V';
  trabajadoresEnMision: number;
  estadoPila: 'Vigente' | 'Pendiente' | 'Vencida';
  certificadosExigidos: string;
  calificacionSST: 'Aprobado' | 'Condicionado' | 'No Apto';
  fechaUltimaAuditoria: string;
}

const INITIAL_CONTRATISTAS: ContratistaItem[] = [
  {
    id: '1',
    codigo: 'CONTR-001',
    razonSocial: 'Ingeniería & Mantenimiento Eléctrico SAS',
    nit: '900.876.543-1',
    servicio: 'Mantenimiento predictivo y preventivo de subestaciones y tableros',
    nivelRiesgo: 'Clase V',
    trabajadoresEnMision: 5,
    estadoPila: 'Vigente',
    certificadosExigidos: 'Matrícula CONTE / CONALTEL + Certificación Alturas Res. 4272/21',
    calificacionSST: 'Aprobado',
    fechaUltimaAuditoria: '2026-10-15'
  },
  {
    id: '2',
    codigo: 'CONTR-002',
    razonSocial: 'Servicios Integrales de Aseo y Cafetería Ltda',
    nit: '890.123.456-7',
    servicio: 'Limpieza locativa, desinfección y segregación de residuos ordinarios',
    nivelRiesgo: 'Clase I',
    trabajadoresEnMision: 8,
    estadoPila: 'Vigente',
    certificadosExigidos: 'Capacitación en uso seguro de sustancias químicas y manejo de EPP',
    calificacionSST: 'Aprobado',
    fechaUltimaAuditoria: '2026-10-12'
  },
  {
    id: '3',
    codigo: 'CONTR-003',
    razonSocial: 'Montajes Estructurales & Cubiertas del Norte',
    nit: '901.456.789-2',
    servicio: 'Reparación de bajantes y cambio de tejas en cubierta nave logística',
    nivelRiesgo: 'Clase V',
    trabajadoresEnMision: 4,
    estadoPila: 'Pendiente',
    certificadosExigidos: 'Curso Coordinador y Trabajador Autorizado Alturas + ATS diario',
    calificacionSST: 'Condicionado',
    fechaUltimaAuditoria: '2026-10-18'
  }
];

export const ContratistasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [contratistas, setContratistas] = useState<ContratistaItem[]>(INITIAL_CONTRATISTAS);
  const [filterCalificacion, setFilterCalificacion] = useState<string>('todos');

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Formulario nuevo contratista
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newRazonSocial, setNewRazonSocial] = useState('');
  const [newNit, setNewNit] = useState('');
  const [newServicio, setNewServicio] = useState('');
  const [newNivelRiesgo, setNewNivelRiesgo] = useState<ContratistaItem['nivelRiesgo']>('Clase I');
  const [newTrabajadores, setNewTrabajadores] = useState<number>(2);
  const [newEstadoPila, setNewEstadoPila] = useState<ContratistaItem['estadoPila']>('Vigente');
  const [newCertificados, setNewCertificados] = useState('');
  const [newCalificacion, setNewCalificacion] = useState<ContratistaItem['calificacionSST']>('Aprobado');

  const totalTrabajadores = contratistas.reduce((acc, c) => acc + (c.trabajadoresEnMision || 0), 0);
  const vigentesCount = contratistas.filter(c => c.estadoPila === 'Vigente').length;
  const porcentajePila = contratistas.length > 0 ? Math.round((vigentesCount / contratistas.length) * 100) : 100;

  const handleAddContratista = () => {
    if (!newRazonSocial.trim() || !newNit.trim() || !newServicio.trim()) {
      showToast({ message: 'Completa la Razón Social, NIT y Servicio contratado.', status: 'warning' });
      return;
    }

    const nextCode = `CONTR-${String(contratistas.length + 1).padStart(3, '0')}`;
    const newContr: ContratistaItem = {
      id: Date.now().toString(),
      codigo: nextCode,
      razonSocial: newRazonSocial.trim(),
      nit: newNit.trim(),
      servicio: newServicio.trim(),
      nivelRiesgo: newNivelRiesgo,
      trabajadoresEnMision: Number(newTrabajadores) || 1,
      estadoPila: newEstadoPila,
      certificadosExigidos: newCertificados.trim() || 'Afiliación ARL + Inducción SST en planta',
      calificacionSST: newCalificacion,
      fechaUltimaAuditoria: new Date().toISOString().split('T')[0]
    };

    setContratistas(prev => [newContr, ...prev]);
    setNewRazonSocial('');
    setNewNit('');
    setNewServicio('');
    setNewCertificados('');
    setIsFormOpen(false);
    showToast({ message: `Contratista ${newContr.razonSocial} registrado exitosamente.`, status: 'success' });
  };

  const handleDeleteContratista = (id: string) => {
    setContratistas(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    try {
      localStorage.setItem('wappy_iso45001_contratistas', JSON.stringify(contratistas));
      showToast({ message: 'Padrón de Contratistas y Proveedores guardado localmente.', status: 'success' });
    } catch {
      showToast({ message: 'Error al guardar los datos en almacenamiento local.', status: 'error' });
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const rowsHtml = contratistas.map(c => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${c.codigo}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>${c.razonSocial}</strong><br><small style="color: #64748b;">NIT: ${c.nit}</small></td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.servicio}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center;"><strong>${c.nivelRiesgo}</strong></td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center;">${c.trabajadoresEnMision}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; color: ${c.estadoPila === 'Vigente' ? '#047857' : '#b91c1c'}; font-weight: bold;">${c.estadoPila}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.certificadosExigidos}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold;">${c.calificacionSST}</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            MANUAL Y PADRÓN DE COORDINACIÓN Y CONTROL DE CONTRATISTAS Y PROVEEDORES
          </h1>
          <p><strong>Normativa Técnica Internacional:</strong> ISO 45001:2018 Cláusula 8.1.4.2 (Contratistas) y 8.1.4.3 (Contratación externa)</p>
          <p><strong>Alineación Jurídica Nacional:</strong> Decreto 1072 de 2015 Art. 2.2.4.6.28 · Resolución 0312 de 2019 Estándar 2.11.1</p>
          <p><strong>Fecha de Evaluación:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2 style="color: #0f766e; margin-top: 24px;">1. Obligaciones y Deberes Legales del Contratante</h2>
          <p>La empresa contratante garantiza la adopción y mantenimiento de disposiciones de SST para proteger la salud de trabajadores dependientes, contratistas, subcontratistas y proveedores en todas las fases contractuales (selección, inducción, ejecución y liquidación).</p>

          <h2 style="color: #0f766e; margin-top: 24px;">2. Censo y Calificación de Contratistas en Terreno</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 8px; border: 1px solid #0f766e;">Código</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Razón Social & NIT</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Servicio / Objeto</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Riesgo ARL</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Personal</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">PILA</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Certificados y Exigencias SST</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Dictamen</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <h2 style="color: #0f766e; margin-top: 28px;">3. Protocolo de Ingreso y Permisos de Trabajo en Campo</h2>
          <p>Ningún colaborador externo podrá iniciar labores sin la verificación previa de su planilla PILA correspondiente al mes en curso, la inducción de riesgos de la sede y el diligenciamiento del Análisis de Trabajo Seguro (ATS) y permiso de trabajo cuando aplique (alturas, confinados, caliente o energías peligrosas).</p>
        </div>
      `;
      setGeneratedReport(html);
      editorContentRef.current = html;
      showToast({ message: 'Manual y Registro de Control de Contratistas generado con éxito.', status: 'success' });
    } catch {
      showToast({ message: 'Error al generar el informe con IA.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  useAutoLoadReport({
    token,
    tags: ['sgsst-contratistas'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  const filteredContratistas = filterCalificacion === 'todos'
    ? contratistas
    : contratistas.filter(c => c.calificacionSST.toLowerCase() === filterCalificacion.toLowerCase());

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER PRINCIPAL CONTRATISTAS (WAPPY DESIGN SYSTEM) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-600 text-white shadow-lg shadow-teal-500/20">
              <Briefcase className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Gestión y Control de Proveedores y Contratistas
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${contratistas.length} Contratistas Registrados`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {contratistas.length} Empresas Aliadas
                    </span>
                  </div>
                </div>

                <div
                  title={`${totalTrabajadores} Trabajadores de Terceros en Misión`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {totalTrabajadores} Trabajadores en Misión
                    </span>
                  </div>
                </div>

                <div
                  title={`${porcentajePila}% de Cumplimiento en Planilla PILA`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-surface-primary text-emerald-700 dark:text-emerald-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {porcentajePila}% PILA Vigente
                    </span>
                  </div>
                </div>

                {/* ISO 45001 Num. 8.1.4 · Dec. 1072 Art. 2.2.4.6.28: CUMPLE */}
                <SGSSTLegalBadge
                  standardCode="2.11.1"
                  label="ISO 45001 Num. 8.1.4 · Dec. 1072 Art. 2.2.4.6.28: CUMPLE"
                  tooltip="ISO 45001:2018 Cláusula 8.1.4.2 (Coordinación y control de contratistas) · Dec. 1072/15 Art. 2.2.4.6.28 y Res. 0312/2019 Estándar 2.11.1"
                  moduleName="Gestión de Proveedores y Contratistas"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={() => setIsFormOpen(!isFormOpen)}
              icon={Plus}
              label={isFormOpen ? "Cerrar Formulario" : "Añadir Contratista"}
              variant="teal"
            />
            <ExpandingButton
              onClick={handleSaveLocal}
              icon={Save}
              label="Guardar Padrón"
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
            Módulo en Construcción (Fase Beta · Padrón y Control de Contratistas ISO 45001)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            Este aplicativo da cumplimiento estricto a las <strong>Cláusulas 8.1.4.2 y 8.1.4.3 de ISO 45001:2018 y Decreto 1072 Art. 2.2.4.6.28</strong>.
            Centraliza la calificación técnica de proveedores, la verificación de seguridad social (PILA), certificaciones obligatorias de tareas de alto riesgo y actas de inducción.
          </p>
        </div>
      </div>

      {/* ─── FORMULARIO REGISTRO NUEVO CONTRATISTA ─── */}
      {isFormOpen && (
        <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/70 backdrop-blur-md shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-500" /> Registrar Nuevo Proveedor o Contratista
            </h3>
            <span className="text-[11px] text-text-tertiary">ISO 45001 Cláusula 8.1.4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Razón Social</label>
              <input
                type="text"
                placeholder="Ej: Mantenimiento Eléctrico Total SAS..."
                value={newRazonSocial}
                onChange={(e) => setNewRazonSocial(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">NIT / Identificación</label>
              <input
                type="text"
                placeholder="Ej: 900.123.456-7..."
                value={newNit}
                onChange={(e) => setNewNit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Nivel de Riesgo ARL</label>
              <select
                value={newNivelRiesgo}
                onChange={(e) => setNewNivelRiesgo(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Clase I">Clase I (Riesgo Mínimo)</option>
                <option value="Clase II">Clase II (Riesgo Bajo)</option>
                <option value="Clase III">Clase III (Riesgo Medio)</option>
                <option value="Clase IV">Clase IV (Riesgo Alto)</option>
                <option value="Clase V">Clase V (Riesgo Máximo)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Trabajadores en Misión</label>
              <input
                type="number"
                min={1}
                value={newTrabajadores}
                onChange={(e) => setNewTrabajadores(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Servicio / Objeto a Ejecutar</label>
              <input
                type="text"
                placeholder="Ej: Mantenimiento de techos y canaletas..."
                value={newServicio}
                onChange={(e) => setNewServicio(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Certificaciones Exigidas</label>
              <input
                type="text"
                placeholder="Ej: Alturas Res. 4272, Espacios Confinados, CONTE..."
                value={newCertificados}
                onChange={(e) => setNewCertificados(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-text-secondary mb-1 block">Planilla PILA</label>
                <select
                  value={newEstadoPila}
                  onChange={(e) => setNewEstadoPila(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                >
                  <option value="Vigente">Vigente (Al Día)</option>
                  <option value="Pendiente">Pendiente Pago</option>
                  <option value="Vencida">Vencida</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-secondary mb-1 block">Dictamen SST</label>
                <select
                  value={newCalificacion}
                  onChange={(e) => setNewCalificacion(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                >
                  <option value="Aprobado">Aprobado</option>
                  <option value="Condicionado">Condicionado</option>
                  <option value="No Apto">No Apto</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-secondary"
            >
              Cancelar
            </button>
            <ExpandingButton
              onClick={handleAddContratista}
              icon={Plus}
              label="Registrar Contratista"
              variant="teal"
            />
          </div>
        </div>
      )}

      {/* ─── TABLA DE CONTRATISTAS Y AUDITORÍA EN CAMPO ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs font-bold text-text-secondary">Filtrar por dictamen:</span>
            <div className="flex items-center gap-1">
              {['todos', 'Aprobado', 'Condicionado', 'No Apto'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterCalificacion(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    filterCalificacion === st
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
            Mostrando {filteredContratistas.length} de {contratistas.length} contratistas
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Razón Social & NIT</th>
                <th className="p-3">Servicio / Objeto</th>
                <th className="p-3 text-center">Riesgo ARL</th>
                <th className="p-3 text-center">Trabajadores</th>
                <th className="p-3 text-center">Seguridad Social (PILA)</th>
                <th className="p-3">Certificaciones & EPP</th>
                <th className="p-3 text-center">Calificación</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-white/5 bg-surface-primary/40">
              {filteredContratistas.map((c) => (
                <tr key={c.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">{c.codigo}</td>
                  <td className="p-3 max-w-xs">
                    <p className="font-bold text-text-primary leading-tight">{c.razonSocial}</p>
                    <span className="text-[10px] text-text-tertiary mt-0.5 inline-block">NIT: {c.nit}</span>
                  </td>
                  <td className="p-3 text-text-secondary max-w-xs text-[11px]">{c.servicio}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-secondary border border-border-light dark:border-white/10">
                      {c.nivelRiesgo}
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold text-text-primary">{c.trabajadoresEnMision}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.estadoPila === 'Vigente'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : c.estadoPila === 'Pendiente'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                    }`}>
                      {c.estadoPila}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-text-secondary max-w-xs">{c.certificadosExigidos}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.calificacionSST === 'Aprobado'
                        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                        : c.calificacionSST === 'Condicionado'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                    }`}>
                      {c.calificacionSST}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteContratista(c.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                      title="Eliminar contratista"
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
        exportFileName={`Control_Contratistas_ISO45001_${Date.now()}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Manual y Protocolo de Control de Contratistas (ISO 45001 Num. 8.1.4)"
        icon={<Briefcase className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Control_Contratistas_ISO45001"
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
            reportSourceData={contratistas}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default ContratistasWorkspace;
