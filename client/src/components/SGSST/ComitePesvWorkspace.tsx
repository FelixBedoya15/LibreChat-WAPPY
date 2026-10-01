import React, { useState, useEffect, useCallback } from 'react';
import {
  Car,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Loader2,
  ShieldCheck,
  PenTool,
  X,
  Building2,
  History,
  Printer,
  Edit3,
  Target,
  Activity,
  Gauge,
  UserCheck,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import { SGSSTToolbar, ToolbarButton } from './SGSSTToolbar';
import ExpandingButton from './ExpandingButton';
import { SignaturePad } from './SignaturePad';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import WorkerAutocomplete from './WorkerAutocomplete';
import { syncCommitteeSignaturesInHtml } from './committeeSignaturesHtml';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const QUARTER_MONTHS: Record<number, string> = {
  3: 'Trimestre I (Ene - Mar)',
  6: 'Trimestre II (Abr - Jun)',
  9: 'Trimestre III (Jul - Sep)',
  12: 'Trimestre IV (Oct - Dic)',
};

const CSV_ROLES = [
  'Presidente del CSV (Alta Dirección)',
  'Secretario Técnico / Líder PESV',
  'Vocal de Mantenimiento y Flota',
  'Vocal de Operaciones / Conductores',
  'Vocal de SST / Talento Humano',
  'Integrante Principal',
  'Suplente',
];

const DEFAULT_METAS_PESV = [
  {
    codigo: 'TSV-01',
    indicador: 'Tasa de Siniestros Viales por Nivel de Pérdida (TSV - Paso 20)',
    metaAnual: 'Reducción ≥ 10% frente a línea base (0 fatalidades viales)',
    resultadoActual: '0 siniestros mortales en el periodo',
    estado: 'Cumplida',
  },
  {
    codigo: 'IDP-02',
    indicador: 'Ejecución de Inspecciones Preoperacionales Diarias (Paso 16)',
    metaAnual: '≥ 95% de vehículos inspeccionados antes de iniciar marcha',
    resultadoActual: 'En seguimiento trimestral',
    estado: 'En Seguimiento',
  },
  {
    codigo: 'CMP-03',
    indicador: 'Cumplimiento del Plan de Mantenimiento Preventivo de Flota (Paso 17)',
    metaAnual: '≥ 90% de mantenimientos preventivos ejecutados según cronograma',
    resultadoActual: 'En seguimiento trimestral',
    estado: 'En Seguimiento',
  },
  {
    codigo: 'CAP-04',
    indicador: 'Cobertura del Plan Anual de Formación en Seguridad Vial (Paso 10)',
    metaAnual: '≥ 90% de actores viales capacitados y evaluados',
    resultadoActual: 'En seguimiento trimestral',
    estado: 'En Seguimiento',
  },
  {
    codigo: ' GVR-05',
    indicador: 'Gestión de Riesgos Viales Críticos y Programas de Comportamiento (Pasos 6 y 11)',
    metaAnual: '100% de controles implementados en Velocidad, Fatiga y Cero Alcohol',
    resultadoActual: 'En seguimiento trimestral',
    estado: 'En Seguimiento',
  },
];

export default function ComitePesvWorkspace() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [activeTab, setActiveTab] = useState<'actas' | 'conformacion' | 'indicadores'>('actas');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado Global del Módulo CSV - PESV
  const [company, setCompany] = useState<any>(null);
  const [escala, setEscala] = useState<any>(null);
  const [activeComite, setActiveComite] = useState<any>(null);
  const [actas, setActas] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [companyWorkers, setCompanyWorkers] = useState<any[]>([]);

  // Estado de Conformación del Comité Vial y Líder PESV (Paso 1 y Paso 2)
  const [comiteForm, setComiteForm] = useState<{
    id?: string;
    periodoInicio: string;
    periodoFin: string;
    nivelPesv: string;
    flotaTotal: number;
    conductoresTotal: number;
    frecuenciaReuniones: string;
    liderPesv: {
      nombre: string;
      cedula: string;
      cargo: string;
      email: string;
      telefono: string;
      fechaDesignacion: string;
      nivelCompetencia: string;
    };
    integrantesComite: any[];
    metasAnuales: any[];
    observaciones: string;
  }>({
    periodoInicio: new Date().toISOString().split('T')[0],
    periodoFin: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    nivelPesv: 'Estándar',
    flotaTotal: 15,
    conductoresTotal: 15,
    frecuenciaReuniones: 'Trimestral',
    liderPesv: {
      nombre: '',
      cedula: '',
      cargo: '',
      email: '',
      telefono: '',
      fechaDesignacion: new Date().toISOString().split('T')[0],
      nivelCompetencia: 'Profesional / Especialista SST o Seguridad Vial',
    },
    integrantesComite: [],
    metasAnuales: DEFAULT_METAS_PESV,
    observaciones: '',
  });

  // Estado del Modal de Acta Trimestral / Mensual
  const [isActaModalOpen, setIsActaModalOpen] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [notasRapidasIA, setNotasRapidasIA] = useState('');
  const [actaForm, setActaForm] = useState<any>({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    numeroActa: '',
    tipoSesion: 'Ordinaria Trimestral',
    trimestre: 'Trimestre I',
    fechaReunion: new Date().toISOString().split('T')[0],
    lugarModalidad: 'Sala de Juntas / Híbrida',
    horaInicio: '09:00',
    horaFin: '10:30',
    asistentes: [],
    ordenDelDia: {
      verificacionQuorumActaAnterior: '',
      seguimientoCompromisosViales: '',
      analisisSiniestralidadInfracciones: '',
      inspeccionesPreoperacionalesMantenimiento: '',
      factoresHumanosVelocidadFatigaAlcohol: '',
      capacitacionCompetenciaVial: '',
      revisionIndicadoresPaso20: '',
      proposicionesPresupuestoVial: '',
    },
    compromisos: [],
    estadoActa: 'borrador',
  });

  // Estado para Firma Digital en Vivo de Asistentes y Vista de Informe Oficial
  const [signingIdx, setSigningIdx] = useState<number | null>(null);
  const [generatingOfficialReport, setGeneratingOfficialReport] = useState(false);
  const [officialReportHtml, setOfficialReportHtml] = useState<string>('');
  const [actaViewMode, setActaViewMode] = useState<'form' | 'report'>('form');
  const [showReportHistory, setShowReportHistory] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sgsst/copasst/pesv/config?anio=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar configuración del Comité de Seguridad Vial');
      const data = await res.json();
      setCompany(data.company);
      setEscala(data.escala);
      setActiveComite(data.activeComite);
      setActas(Array.isArray(data.actas) ? data.actas : []);

      // Cargar censo de trabajadores desde Perfil Sociodemográfico para autocompletado
      try {
        const workersRes = await fetch('/api/sgsst/perfil-sociodemografico/workers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (workersRes.ok) {
          const wData = await workersRes.json();
          if (Array.isArray(wData.trabajadores)) {
            setCompanyWorkers(wData.trabajadores);
          }
        }
      } catch (wErr) {
        console.warn('No se pudo cargar lista de trabajadores para autocompletado:', wErr);
      }

      if (data.activeComite) {
        setComiteForm({
          id: data.activeComite._id,
          periodoInicio: data.activeComite.periodoInicio
            ? new Date(data.activeComite.periodoInicio).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          periodoFin: data.activeComite.periodoFin
            ? new Date(data.activeComite.periodoFin).toISOString().split('T')[0]
            : new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
          nivelPesv: data.activeComite.nivelPesv || data.escala?.nivel || 'Estándar',
          flotaTotal: Number(data.activeComite.flotaTotal) || 15,
          conductoresTotal: Number(data.activeComite.conductoresTotal) || 15,
          frecuenciaReuniones: data.activeComite.frecuenciaReuniones || 'Trimestral',
          liderPesv: {
            nombre: data.activeComite.liderPesv?.nombre || data.company?.responsibleSST || '',
            cedula: data.activeComite.liderPesv?.cedula || '',
            cargo: data.activeComite.liderPesv?.cargo || 'Líder del Diseño e Implementación del PESV',
            email: data.activeComite.liderPesv?.email || '',
            telefono: data.activeComite.liderPesv?.telefono || '',
            fechaDesignacion: data.activeComite.liderPesv?.fechaDesignacion
              ? new Date(data.activeComite.liderPesv.fechaDesignacion).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            nivelCompetencia:
              data.activeComite.liderPesv?.nivelCompetencia || 'Profesional / Especialista SST o Seguridad Vial',
          },
          integrantesComite: Array.isArray(data.activeComite.integrantesComite)
            ? data.activeComite.integrantesComite
            : [],
          metasAnuales:
            Array.isArray(data.activeComite.metasAnuales) && data.activeComite.metasAnuales.length > 0
              ? data.activeComite.metasAnuales
              : DEFAULT_METAS_PESV,
          observaciones: data.activeComite.observaciones || '',
        });
      } else if (data.company) {
        setComiteForm((prev) => ({
          ...prev,
          liderPesv: {
            ...prev.liderPesv,
            nombre: prev.liderPesv.nombre || data.company.responsibleSST || '',
          },
        }));
      }
    } catch (error: any) {
      showToast({ message: error.message || 'Error al cargar Comité de Seguridad Vial', status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, selectedYear, showToast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ─── Guardar Conformación del Comité Vial y Líder PESV ─────────────────────
  const handleSaveComite = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/sgsst/copasst/pesv/comite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(comiteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar Comité de Seguridad Vial');
      showToast({
        message: 'Conformación del Comité de Seguridad Vial y Líder PESV guardada exitosamente',
        status: 'success',
      });
      fetchConfig();
    } catch (err: any) {
      showToast({ message: err.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Abrir Modal de Acta (Nuevo o Existente para un Mes/Trimestre) ─────────
  const openActaModalForMonth = (monthNumber: number) => {
    const existing = actas.find((a) => Number(a.mes) === monthNumber && Number(a.anio) === selectedYear);
    setSigningIdx(null);
    setActaViewMode('form');
    setOfficialReportHtml(existing?.resumenEjecutivoIA || '');

    const defaultTrimestre =
      monthNumber <= 3
        ? 'Trimestre I'
        : monthNumber <= 6
        ? 'Trimestre II'
        : monthNumber <= 9
        ? 'Trimestre III'
        : 'Trimestre IV';

    if (existing) {
      setActaForm({
        id: existing._id,
        mes: existing.mes,
        anio: existing.anio,
        numeroActa: existing.numeroActa || '',
        tipoSesion: existing.tipoSesion || 'Ordinaria Trimestral',
        trimestre: existing.trimestre || defaultTrimestre,
        fechaReunion: existing.fechaReunion
          ? new Date(existing.fechaReunion).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        lugarModalidad: existing.lugarModalidad || 'Sala de Juntas / Híbrida',
        horaInicio: existing.horaInicio || '09:00',
        horaFin: existing.horaFin || '10:30',
        asistentes: Array.isArray(existing.asistentes) ? existing.asistentes : [],
        ordenDelDia: {
          verificacionQuorumActaAnterior: existing.ordenDelDia?.verificacionQuorumActaAnterior || '',
          seguimientoCompromisosViales: existing.ordenDelDia?.seguimientoCompromisosViales || '',
          analisisSiniestralidadInfracciones: existing.ordenDelDia?.analisisSiniestralidadInfracciones || '',
          inspeccionesPreoperacionalesMantenimiento:
            existing.ordenDelDia?.inspeccionesPreoperacionalesMantenimiento || '',
          factoresHumanosVelocidadFatigaAlcohol: existing.ordenDelDia?.factoresHumanosVelocidadFatigaAlcohol || '',
          capacitacionCompetenciaVial: existing.ordenDelDia?.capacitacionCompetenciaVial || '',
          revisionIndicadoresPaso20: existing.ordenDelDia?.revisionIndicadoresPaso20 || '',
          proposicionesPresupuestoVial: existing.ordenDelDia?.proposicionesPresupuestoVial || '',
        },
        compromisos: Array.isArray(existing.compromisos) ? existing.compromisos : [],
        estadoActa: existing.estadoActa || 'borrador',
      });
    } else {
      // Precargar asistentes desde el Comité de Seguridad Vial activo y Líder PESV
      const defaultAsistentes: any[] = [];
      if (activeComite) {
        if (activeComite.liderPesv?.nombre) {
          defaultAsistentes.push({
            nombre: activeComite.liderPesv.nombre,
            cedula: activeComite.liderPesv.cedula || '',
            cargo: activeComite.liderPesv.cargo || 'Líder del PESV',
            rol: 'Secretario Técnico / Líder PESV',
            asistio: true,
          });
        }
        (activeComite.integrantesComite || []).forEach((r: any) => {
          if (
            !defaultAsistentes.some(
              (a) =>
                (a.cedula && r.cedula && String(a.cedula).trim() === String(r.cedula).trim()) ||
                String(a.nombre).trim().toLowerCase() === String(r.nombre).trim().toLowerCase()
            )
          ) {
            defaultAsistentes.push({
              nombre: r.nombre,
              cedula: r.cedula,
              cargo: r.cargo || '',
              rol: r.rol || 'Integrante CSV',
              asistio: true,
            });
          }
        });
      }

      setActaForm({
        id: undefined,
        mes: monthNumber,
        anio: selectedYear,
        numeroActa: `ACTA-CSV-${selectedYear}-${String(monthNumber).padStart(2, '0')}`,
        tipoSesion: [3, 6, 9, 12].includes(monthNumber) ? 'Ordinaria Trimestral' : 'Ordinaria Mensual',
        trimestre: defaultTrimestre,
        fechaReunion: new Date(selectedYear, monthNumber - 1, 15).toISOString().split('T')[0],
        lugarModalidad: 'Sala de Juntas / Híbrida',
        horaInicio: '09:00',
        horaFin: '10:30',
        asistentes: defaultAsistentes,
        ordenDelDia: {
          verificacionQuorumActaAnterior: '',
          seguimientoCompromisosViales: '',
          analisisSiniestralidadInfracciones: '',
          inspeccionesPreoperacionalesMantenimiento: '',
          factoresHumanosVelocidadFatigaAlcohol: '',
          capacitacionCompetenciaVial: '',
          revisionIndicadoresPaso20: '',
          proposicionesPresupuestoVial: '',
        },
        compromisos: [],
        estadoActa: 'borrador',
      });
    }
    setNotasRapidasIA('');
    setIsActaModalOpen(true);
  };

  // ─── Redactar Borrador de Acta con Tenshi IA ──────────────────────────────
  const handleGenerateAIDraft = async () => {
    setAiDrafting(true);
    try {
      const res = await fetch('/api/sgsst/copasst/pesv/actas/generar-borrador-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mes: actaForm.mes,
          anio: actaForm.anio,
          trimestre: actaForm.trimestre,
          notasRapidas: notasRapidasIA,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al redactar con IA');

      if (result.data?.ordenDelDia) {
        setActaForm((prev: any) => ({
          ...prev,
          ordenDelDia: {
            ...prev.ordenDelDia,
            ...result.data.ordenDelDia,
          },
          compromisos: [
            ...(prev.compromisos || []),
            ...(Array.isArray(result.data.compromisosSugeridos)
              ? result.data.compromisosSugeridos.map((c: any) => ({
                  actividad: c.actividad || c.accion,
                  responsable: c.responsable || 'Comité de Seguridad Vial',
                  fechaLimite: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                  estado: 'Pendiente',
                }))
              : []),
          ],
        }));
        showToast({
          message: '✨ Tenshi IA ha redactado los 8 puntos del Comité de Seguridad Vial y compromisos sugeridos',
          status: 'success',
        });
      }
    } catch (err: any) {
      showToast({ message: err.message, status: 'error' });
    } finally {
      setAiDrafting(false);
    }
  };

  // ─── Guardar Acta del Comité Vial ─────────────────────────────────────────
  const handleSaveActa = async (closeModal = true) => {
    setSaving(true);
    try {
      const payloadToSave = {
        ...actaForm,
        ...(officialReportHtml ? { resumenEjecutivoIA: officialReportHtml } : {}),
      };
      const res = await fetch('/api/sgsst/copasst/pesv/actas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadToSave),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el acta del Comité Vial');
      if (data.acta?._id) {
        setActaForm((prev: any) => ({ ...prev, id: data.acta._id }));
      }
      if (data.acta?.resumenEjecutivoIA) {
        setOfficialReportHtml(data.acta.resumenEjecutivoIA);
      }
      showToast({
        message: 'Acta del Comité de Seguridad Vial guardada y compromisos sincronizados con el Centro de Control',
        status: 'success',
      });
      if (closeModal) {
        setIsActaModalOpen(false);
      }
      fetchConfig();
      return data.acta;
    } catch (err: any) {
      showToast({ message: err.message, status: 'error' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ─── Generar Vista Oficial con Membrete y Firmas de Participantes ─────────
  const handleOpenOfficialReport = async () => {
    setGeneratingOfficialReport(true);
    try {
      const targetId = actaForm.id || 'preview';
      const res = await fetch(`/api/sgsst/copasst/pesv/actas/${targetId}/reporte-oficial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(actaForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar documento oficial');

      if (data.ordenEnriquecido) {
        setActaForm((prev: any) => ({
          ...prev,
          ...(data.acta?._id ? { id: data.acta._id } : {}),
          ordenDelDia: {
            ...prev.ordenDelDia,
            ...data.ordenEnriquecido,
          },
        }));
      } else if (data.acta?._id) {
        setActaForm((prev: any) => ({ ...prev, id: data.acta._id }));
      }

      setOfficialReportHtml(data.html);
      setActaViewMode('report');
      fetchConfig();
      showToast({
        message: '✨ Informe Oficial del Comité de Seguridad Vial generado y guardado automáticamente',
        status: 'success',
      });
    } catch (err: any) {
      showToast({ message: err.message || 'Error al generar informe oficial', status: 'error' });
    } finally {
      setGeneratingOfficialReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-medium">Cargando Comité de Seguridad Vial (CSV - PESV)...</p>
      </div>
    );
  }

  const completedMonths = actas.length;
  const quarterlyMonthsCompleted = actas.filter((a) => [3, 6, 9, 12].includes(Number(a.mes))).length;
  const compliancePercent =
    comiteForm.frecuenciaReuniones === 'Trimestral'
      ? Math.min(100, Math.round((quarterlyMonthsCompleted / 4) * 100))
      : Math.round((completedMonths / 12) * 100);

  return (
    <div className="space-y-6">
      {/* ─── HEADER EJECUTIVO Y ESCALA NORMATIVA PESV (PASO 1 Y PASO 2) ─────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-bold uppercase tracking-wider">
              <Car className="w-3.5 h-3.5" /> Res. 20223040040595 Paso 1, 2 y 20 • Ley 1503/2011 • ISO 39001
            </div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
              Comité de Seguridad Vial (CSV) & Líder del PESV
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              {escala?.descripcion ||
                'Órgano directivo y operativo del Plan Estratégico de Seguridad Vial encargado de planificar, auditar siniestros viales, evaluar indicadores trimestrales (Paso 20) y vigilar la movilidad segura.'}
            </p>
          </div>

          {/* Tarjetas Resumen de Escala PESV */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-teal-200">Nivel PESV</div>
              <div className="text-lg font-black mt-0.5 text-amber-300">
                {comiteForm.nivelPesv || escala?.nivel || 'Estándar'}
              </div>
              <div className="text-[10px] text-teal-200/80">
                {comiteForm.nivelPesv === 'Básico'
                  ? '19 Pasos'
                  : comiteForm.nivelPesv === 'Avanzado'
                  ? '24 Pasos'
                  : '22 Pasos'}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-teal-200">Flota / Cond.</div>
              <div className="text-sm font-extrabold mt-1">
                {comiteForm.flotaTotal || 0} Veh • {comiteForm.conductoresTotal || 0} Cond
              </div>
              <div className="text-[10px] text-teal-200/80">Mín. 3 Miembros CSV</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-teal-200">Estado CSV</div>
              <div className="text-sm font-extrabold mt-1 flex items-center justify-center gap-1">
                {activeComite ? (
                  <span className="text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Vigente
                  </span>
                ) : (
                  <span className="text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Sin conformar
                  </span>
                )}
              </div>
              <div className="text-[10px] text-teal-200/80">
                {activeComite?.liderPesv?.nombre ? `Líder: ${activeComite.liderPesv.nombre.split(' ')[0]}` : 'Paso 1 y 2'}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold text-teal-200">
                Avance {selectedYear} ({comiteForm.frecuenciaReuniones})
              </div>
              <div className="text-xl font-black mt-0.5 text-emerald-300">
                {comiteForm.frecuenciaReuniones === 'Trimestral'
                  ? `${quarterlyMonthsCompleted}/4`
                  : `${completedMonths}/12`}
              </div>
              <div className="text-[10px] text-teal-200/80">{compliancePercent}% sesiones</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE NAVEGACIÓN CÁPSULA WAPPY ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SGSSTToolbar>
          <ToolbarButton
            icon={Calendar}
            label="Actas del Comité Vial"
            active={activeTab === 'actas'}
            onClick={() => setActiveTab('actas')}
            badge={completedMonths}
            variant="teal"
          />
          <ToolbarButton
            icon={Users}
            label="Conformación CSV & Líder PESV (Paso 1 y 2)"
            active={activeTab === 'conformacion'}
            onClick={() => setActiveTab('conformacion')}
            variant="teal"
          />
          <ToolbarButton
            icon={Gauge}
            label="Indicadores & Metas Viales (Paso 20)"
            active={activeTab === 'indicadores'}
            onClick={() => setActiveTab('indicadores')}
            badge={comiteForm.metasAnuales?.length || 0}
            variant="teal"
          />
        </SGSSTToolbar>

        {activeTab === 'actas' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Año Fiscal:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 1: TABLERO DE ACTAS DEL COMITÉ DE SEGURIDAD VIAL (TRIMESTRALES / MENSUALES)
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'actas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-900 dark:text-teal-300">
                  Sesiones Reglamentarias del Comité de Seguridad Vial (Paso 2 Res. 20223040040595)
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                  El Comité de Seguridad Vial debe sesionar como mínimo de forma <strong>trimestral</strong> (Marzo, Junio, Septiembre y Diciembre) o mensualmente para analizar siniestros viales, inspecciones preoperacionales, mantenimiento de flota e indicadores del Paso 20.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MONTH_NAMES.map((monthName, idx) => {
              const monthNum = idx + 1;
              const isQuarterEnd = [3, 6, 9, 12].includes(monthNum);
              const quarterLabel = QUARTER_MONTHS[monthNum];
              const acta = actas.find((a) => Number(a.mes) === monthNum && Number(a.anio) === selectedYear);
              const isDone = Boolean(acta);
              const totalConvocados = Array.isArray(acta?.asistentes)
                ? acta.asistentes.filter((a: any) => a.asistio !== false).length
                : 0;
              const totalFirmados = Array.isArray(acta?.asistentes)
                ? acta.asistentes.filter((a: any) => a.asistio !== false && a.firma).length
                : 0;

              return (
                <div
                  key={monthNum}
                  onClick={() => openActaModalForMonth(monthNum)}
                  className={cn(
                    'group cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between min-h-[155px]',
                    isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 hover:shadow-md'
                      : isQuarterEnd
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-300/80 dark:border-amber-800/50 hover:border-teal-400 hover:shadow-md'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-teal-400 hover:shadow-md'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        Mes {String(monthNum).padStart(2, '0')}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> {acta.numeroActa || 'Realizada'}
                        </span>
                      ) : isQuarterEnd ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          ⭐ Corte Trimestral
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          Opcional / Mensual
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-100 mt-1">{monthName}</h3>
                    {quarterLabel && (
                      <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">{quarterLabel}</p>
                    )}

                    {isDone ? (
                      <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-zinc-400">
                        <div>
                          Fecha:{' '}
                          <strong className="text-slate-800 dark:text-zinc-200">
                            {new Date(acta.fechaReunion || acta.createdAt).toLocaleDateString('es-CO')}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>
                            Compromisos: <strong>{acta.compromisos?.length || 0}</strong>
                          </span>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold',
                              totalFirmados > 0 && totalFirmados === totalConvocados
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            )}
                          >
                            ✍️ Firmas: {totalFirmados}/{totalConvocados}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400 dark:text-zinc-500">
                        Haz clic para diligenciar el acta del Comité Vial con ayuda de Tenshi IA.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                    <span>{isDone ? 'Ver / Editar Acta' : '+ Diligenciar Acta CSV'}</span>
                    <FileText className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 2: CONFORMACIÓN DEL COMITÉ DE SEGURIDAD VIAL Y LÍDER PESV (PASO 1 Y 2)
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'conformacion' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100">
                Designación del Líder del PESV (Paso 1) y Comité de Seguridad Vial (Paso 2)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Conforme a la Resolución 20223040040595 de 2022, la Alta Dirección designa al Líder del PESV (todos los niveles) y a los integrantes del Comité de Seguridad Vial (niveles Estándar y Avanzado, mínimo 3 miembros).
              </p>
            </div>
            <ExpandingButton icon={Save} label="Guardar Conformación CSV" onClick={handleSaveComite} variant="teal" loading={saving} />
          </div>

          {/* Parámetros de Escala PESV y Vigencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">Nivel del PESV</label>
              <select
                value={comiteForm.nivelPesv}
                onChange={(e) => setComiteForm({ ...comiteForm, nivelPesv: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold"
              >
                <option value="Básico">Básico (19 Pasos)</option>
                <option value="Estándar">Estándar (22 Pasos)</option>
                <option value="Avanzado">Avanzado (24 Pasos)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                Total Vehículos (Flota)
              </label>
              <input
                type="number"
                min={0}
                value={comiteForm.flotaTotal}
                onChange={(e) => setComiteForm({ ...comiteForm, flotaTotal: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                Total Conductores
              </label>
              <input
                type="number"
                min={0}
                value={comiteForm.conductoresTotal}
                onChange={(e) => setComiteForm({ ...comiteForm, conductoresTotal: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
                Periodicidad Sesiones
              </label>
              <select
                value={comiteForm.frecuenciaReuniones}
                onChange={(e) => setComiteForm({ ...comiteForm, frecuenciaReuniones: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold"
              >
                <option value="Trimestral">Trimestral (Mín. Legal)</option>
                <option value="Mensual">Mensual (Preventivo)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">Inicio Periodo</label>
              <input
                type="date"
                value={comiteForm.periodoInicio}
                onChange={(e) => setComiteForm({ ...comiteForm, periodoInicio: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">Fin Periodo</label>
              <input
                type="date"
                value={comiteForm.periodoFin}
                onChange={(e) => setComiteForm({ ...comiteForm, periodoFin: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>

          {/* PASO 1: Líder del Diseño e Implementación del PESV */}
          <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Paso 1: Líder del Diseño e Implementación del PESV (Obligatorio en todos los niveles)
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                Designado por la Alta Dirección
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                <WorkerAutocomplete
                  workers={companyWorkers}
                  value={comiteForm.liderPesv?.nombre || ''}
                  placeholder="Buscar o escribir nombre del Líder PESV"
                  onChange={(val) =>
                    setComiteForm({ ...comiteForm, liderPesv: { ...comiteForm.liderPesv, nombre: val } })
                  }
                  onSelectWorker={(w) =>
                    setComiteForm({
                      ...comiteForm,
                      liderPesv: {
                        ...comiteForm.liderPesv,
                        nombre: w.nombre,
                        cedula: w.cedula || comiteForm.liderPesv?.cedula || '',
                        cargo: w.cargo || comiteForm.liderPesv?.cargo || '',
                        email: w.email || comiteForm.liderPesv?.email || '',
                        telefono: w.telefono || comiteForm.liderPesv?.telefono || '',
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cédula / ID</label>
                <input
                  type="text"
                  placeholder="Cédula de ciudadanía"
                  value={comiteForm.liderPesv?.cedula || ''}
                  onChange={(e) =>
                    setComiteForm({ ...comiteForm, liderPesv: { ...comiteForm.liderPesv, cedula: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cargo en la Empresa</label>
                <input
                  type="text"
                  placeholder="Cargo actual"
                  value={comiteForm.liderPesv?.cargo || ''}
                  onChange={(e) =>
                    setComiteForm({ ...comiteForm, liderPesv: { ...comiteForm.liderPesv, cargo: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="correo@empresa.com"
                  value={comiteForm.liderPesv?.email || ''}
                  onChange={(e) =>
                    setComiteForm({ ...comiteForm, liderPesv: { ...comiteForm.liderPesv, email: e.target.value } })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Fecha de Designación
                </label>
                <input
                  type="date"
                  value={comiteForm.liderPesv?.fechaDesignacion || ''}
                  onChange={(e) =>
                    setComiteForm({
                      ...comiteForm,
                      liderPesv: { ...comiteForm.liderPesv, fechaDesignacion: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Competencia / Idoneidad
                </label>
                <input
                  type="text"
                  placeholder="Ej. Especialista SST / Curso 50h / Formación PESV"
                  value={comiteForm.liderPesv?.nivelCompetencia || ''}
                  onChange={(e) =>
                    setComiteForm({
                      ...comiteForm,
                      liderPesv: { ...comiteForm.liderPesv, nivelCompetencia: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* PASO 2: Integrantes del Comité de Seguridad Vial (CSV) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" /> Paso 2: Integrantes del Comité de Seguridad Vial (Designados por la Alta Dirección)
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Mínimo 3 integrantes con poder de decisión (Alta Dirección, Operaciones/Conductores, Mantenimiento de Flota y SST).
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setComiteForm((prev) => ({
                    ...prev,
                    integrantesComite: [
                      ...prev.integrantesComite,
                      {
                        nombre: '',
                        cedula: '',
                        cargo: '',
                        rol: prev.integrantesComite.length === 0
                          ? 'Presidente del CSV (Alta Dirección)'
                          : prev.integrantesComite.length === 1
                          ? 'Secretario Técnico / Líder PESV'
                          : 'Vocal de Mantenimiento y Flota',
                      },
                    ],
                  }))
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Integrante CSV
              </button>
            </div>

            {comiteForm.integrantesComite.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                No hay integrantes del Comité de Seguridad Vial registrados. Añade al menos 3 miembros (Presidente, Secretario Técnico y Vocal).
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {comiteForm.integrantesComite.map((rep, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <WorkerAutocomplete
                        workers={companyWorkers}
                        value={rep.nombre}
                        placeholder="Nombre completo (buscar trabajador)"
                        onChange={(val) => {
                          const list = [...comiteForm.integrantesComite];
                          list[idx].nombre = val;
                          setComiteForm({ ...comiteForm, integrantesComite: list });
                        }}
                        onSelectWorker={(w) => {
                          const list = [...comiteForm.integrantesComite];
                          list[idx] = {
                            ...list[idx],
                            nombre: w.nombre,
                            cedula: w.cedula || list[idx].cedula,
                            cargo: w.cargo || list[idx].cargo,
                          };
                          setComiteForm({ ...comiteForm, integrantesComite: list });
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Cédula"
                        value={rep.cedula}
                        onChange={(e) => {
                          const list = [...comiteForm.integrantesComite];
                          list[idx].cedula = e.target.value;
                          setComiteForm({ ...comiteForm, integrantesComite: list });
                        }}
                        className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Cargo en la empresa"
                        value={rep.cargo}
                        onChange={(e) => {
                          const list = [...comiteForm.integrantesComite];
                          list[idx].cargo = e.target.value;
                          setComiteForm({ ...comiteForm, integrantesComite: list });
                        }}
                        className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs"
                      />
                      <select
                        value={rep.rol}
                        onChange={(e) => {
                          const list = [...comiteForm.integrantesComite];
                          list[idx].rol = e.target.value;
                          setComiteForm({ ...comiteForm, integrantesComite: list });
                        }}
                        className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-bold"
                      >
                        {CSV_ROLES.map((roleOpt) => (
                          <option key={roleOpt} value={roleOpt}>
                            {roleOpt}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const list = comiteForm.integrantesComite.filter((_, i) => i !== idx);
                          setComiteForm({ ...comiteForm, integrantesComite: list });
                        }}
                        className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                          <span className="text-[10px] font-bold">Eliminar</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 3: INDICADORES Y METAS TRIMESTRALES DEL PESV (PASO 7 Y PASO 20)
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'indicadores' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" /> Tablero de Objetivos, Metas e Indicadores del PESV (Paso 7 y Paso 20)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Seguimiento trimestral por parte del Comité de Seguridad Vial a los indicadores exigidos en la Resolución 20223040040595.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setComiteForm((prev) => ({
                    ...prev,
                    metasAnuales: [
                      ...(prev.metasAnuales || []),
                      {
                        codigo: `META-0${(prev.metasAnuales?.length || 0) + 1}`,
                        indicador: '',
                        metaAnual: '',
                        resultadoActual: '',
                        estado: 'En Seguimiento',
                      },
                    ],
                  }))
                }
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
              >
                <Plus className="w-4 h-4 text-teal-600" /> Añadir Indicador PESV
              </button>
              <ExpandingButton icon={Save} label="Guardar Metas PESV" onClick={handleSaveComite} variant="teal" loading={saving} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 bg-slate-50/70 dark:bg-zinc-800/50">
                  <th className="py-3 px-3 w-24">Código</th>
                  <th className="py-3 px-3">Indicador PESV (Paso 20 Res. 20223040040595)</th>
                  <th className="py-3 px-3">Meta Anual Definida</th>
                  <th className="py-3 px-3">Resultado / Avance Trimestral</th>
                  <th className="py-3 px-3 w-36">Estado</th>
                  <th className="py-3 px-3 w-16 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800 text-xs">
                {(comiteForm.metasAnuales || []).map((meta, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30">
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={meta.codigo || ''}
                        onChange={(e) => {
                          const list = [...comiteForm.metasAnuales];
                          list[idx].codigo = e.target.value;
                          setComiteForm({ ...comiteForm, metasAnuales: list });
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs font-extrabold text-teal-700 dark:text-teal-300"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="Nombre del indicador vial"
                        value={meta.indicador || ''}
                        onChange={(e) => {
                          const list = [...comiteForm.metasAnuales];
                          list[idx].indicador = e.target.value;
                          setComiteForm({ ...comiteForm, metasAnuales: list });
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="Meta cuantitativa anual"
                        value={meta.metaAnual || ''}
                        onChange={(e) => {
                          const list = [...comiteForm.metasAnuales];
                          list[idx].metaAnual = e.target.value;
                          setComiteForm({ ...comiteForm, metasAnuales: list });
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="Resultado trimestral"
                        value={meta.resultadoActual || ''}
                        onChange={(e) => {
                          const list = [...comiteForm.metasAnuales];
                          list[idx].resultadoActual = e.target.value;
                          setComiteForm({ ...comiteForm, metasAnuales: list });
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={meta.estado || 'En Seguimiento'}
                        onChange={(e) => {
                          const list = [...comiteForm.metasAnuales];
                          list[idx].estado = e.target.value;
                          setComiteForm({ ...comiteForm, metasAnuales: list });
                        }}
                        className={cn(
                          'w-full rounded-lg border px-2 py-1.5 text-xs font-bold',
                          meta.estado === 'Cumplida'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                            : meta.estado === 'Alerta'
                            ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
                            : 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                        )}
                      >
                        <option value="Cumplida">✓ Cumplida</option>
                        <option value="En Seguimiento">⏳ En Seguimiento</option>
                        <option value="Alerta">⚠️ Alerta / Desviación</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const list = comiteForm.metasAnuales.filter((_, i) => i !== idx);
                          setComiteForm({ ...comiteForm, metasAnuales: list });
                        }}
                        className="group inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-1.5 shadow-sm active:scale-95 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                          <span className="text-[10px] font-bold">Eliminar</span>
                        </div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL DE ACTA DEL COMITÉ DE SEGURIDAD VIAL + INFORME OFICIAL Y FIRMAS
         ═══════════════════════════════════════════════════════════════════════════ */}
      {isActaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Cabecera del Modal con Botonera Cápsula WAPPY */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Acta Comité de Seguridad Vial (CSV - PESV) • {MONTH_NAMES[(actaForm.mes || 1) - 1]} {actaForm.anio}
                </span>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100">
                  {actaForm.numeroActa || 'Nueva Acta del Comité de Seguridad Vial'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SGSSTToolbar>
                  <ToolbarButton
                    icon={Edit3}
                    label="Diligenciamiento"
                    active={actaViewMode === 'form'}
                    onClick={() => setActaViewMode('form')}
                    variant="teal"
                  />
                  <ToolbarButton
                    icon={Printer}
                    label={officialReportHtml ? 'Informe Oficial' : 'Generar Informe'}
                    active={actaViewMode === 'report'}
                    onClick={() => {
                      if (officialReportHtml) {
                        setActaViewMode('report');
                      } else {
                        handleOpenOfficialReport();
                      }
                    }}
                    loading={generatingOfficialReport}
                    variant="teal"
                  />
                  <ToolbarButton
                    icon={Sparkles}
                    label={actaViewMode === 'report' ? 'Regenerar con IA' : 'Redactar con Tenshi IA'}
                    onClick={actaViewMode === 'report' ? handleOpenOfficialReport : handleGenerateAIDraft}
                    loading={actaViewMode === 'report' ? generatingOfficialReport : aiDrafting}
                    variant="orange"
                  />
                  <ToolbarButton
                    icon={History}
                    label="Historial"
                    active={showReportHistory}
                    onClick={() => {
                      setActaViewMode('report');
                      setShowReportHistory((prev) => !prev);
                    }}
                    variant="neutral"
                  />
                  <ToolbarButton
                    icon={Save}
                    label="Guardar Datos"
                    onClick={() => handleSaveActa(false)}
                    loading={saving}
                    variant="teal"
                  />
                  {actaViewMode === 'report' && officialReportHtml && (
                    <ToolbarButton
                      icon={CheckCircle2}
                      label="Guardar Informe"
                      onClick={() => handleSaveActa(false)}
                      loading={saving}
                      variant="teal"
                    />
                  )}
                  {actaViewMode === 'report' && officialReportHtml && (
                    <ExportDropdown
                      getHtmlContent={() => officialReportHtml}
                      title={`Acta_CSV_PESV_${actaForm.numeroActa || `${actaForm.mes}_${actaForm.anio}`}`}
                    />
                  )}
                </SGSSTToolbar>

                <button
                  onClick={() => setIsActaModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-500 hover:text-red-500 transition-colors"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cuerpo Scrolleable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {actaViewMode === 'report' ? (
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 space-y-4 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300">
                        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>
                          Vista Oficial de Impresión A4: Incluye membrete corporativo y las{' '}
                          <strong>Firmas Digitales de los Miembros del Comité de Seguridad Vial</strong>.
                        </span>
                      </div>
                    </div>
                    <LiveEditor
                      paperMode={true}
                      initialContent={officialReportHtml}
                      onUpdate={(newHtml) => setOfficialReportHtml(newHtml)}
                    />
                  </div>
                  {showReportHistory && (
                    <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800 pt-4 lg:pt-0 lg:pl-4">
                      <ReportHistory
                        endpoint="sgsst-diagnostico"
                        tag="sgsst-comite-pesv"
                        companyId={company?._id}
                        currentReportId={null}
                        onSelectReport={(content) => setOfficialReportHtml(content)}
                        onNewEvaluation={() => setShowReportHistory(false)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Asistente Tenshi IA para Redactar el Acta */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-teal-500/10 border border-orange-300/50 dark:border-orange-800/40 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" /> Asistente Tenshi IA — Redacción Automática de los 8 Puntos del Comité Vial
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={notasRapidasIA}
                        onChange={(e) => setNotasRapidasIA(e.target.value)}
                        placeholder="Escribe notas breves (ej. 0 siniestros en el trimestre, 98% preoperacionales cumplidas, campaña de fatiga y velocidad ejecutada)..."
                        className="flex-1 rounded-xl border border-orange-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAIDraft}
                        disabled={aiDrafting}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shrink-0"
                      >
                        {aiDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Redactar con Tenshi IA
                      </button>
                    </div>
                  </div>

                  {/* Datos Generales de la Reunión */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">N° de Acta</label>
                      <input
                        type="text"
                        value={actaForm.numeroActa}
                        onChange={(e) => setActaForm({ ...actaForm, numeroActa: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Trimestre PESV</label>
                      <select
                        value={actaForm.trimestre}
                        onChange={(e) => setActaForm({ ...actaForm, trimestre: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold"
                      >
                        <option value="Trimestre I">Trimestre I</option>
                        <option value="Trimestre II">Trimestre II</option>
                        <option value="Trimestre III">Trimestre III</option>
                        <option value="Trimestre IV">Trimestre IV</option>
                        <option value="Extraordinaria">Extraordinaria</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipo de Sesión</label>
                      <select
                        value={actaForm.tipoSesion}
                        onChange={(e) => setActaForm({ ...actaForm, tipoSesion: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold"
                      >
                        <option value="Ordinaria Trimestral">Ordinaria Trimestral</option>
                        <option value="Ordinaria Mensual">Ordinaria Mensual</option>
                        <option value="Extraordinaria (Siniestro Vial)">Extraordinaria (Siniestro Vial)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Fecha de Reunión</label>
                      <input
                        type="date"
                        value={actaForm.fechaReunion}
                        onChange={(e) => setActaForm({ ...actaForm, fechaReunion: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Hora Inicio / Fin</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={actaForm.horaInicio}
                          onChange={(e) => setActaForm({ ...actaForm, horaInicio: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2 py-2 text-xs"
                        />
                        <input
                          type="time"
                          value={actaForm.horaFin}
                          onChange={(e) => setActaForm({ ...actaForm, horaFin: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2 py-2 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Lugar / Modalidad</label>
                      <input
                        type="text"
                        value={actaForm.lugarModalidad}
                        onChange={(e) => setActaForm({ ...actaForm, lugarModalidad: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* ─── ASISTENTES Y FIRMAS DIGITALES DE LOS MIEMBROS DEL CSV ─── */}
                  <div className="space-y-3 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-zinc-800/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                          <PenTool className="w-4 h-4" /> Participantes y Firmas Digitales del Comité de Seguridad Vial
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Las firmas digitales aquí registradas se sincronizan automáticamente en el Informe Oficial A4 del Comité Vial.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActaForm((prev: any) => ({
                            ...prev,
                            asistentes: [
                              ...(prev.asistentes || []),
                              {
                                nombre: '',
                                cedula: '',
                                cargo: '',
                                rol: 'Integrante CSV',
                                asistio: true,
                                firma: '',
                              },
                            ],
                          }))
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition-all self-start"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir Participante
                      </button>
                    </div>

                    {(!actaForm.asistentes || actaForm.asistentes.length === 0) ? (
                      <p className="text-xs text-slate-400 italic py-3 text-center">
                        No hay participantes listados. Haz clic en &quot;Añadir Participante&quot; o configura el Comité en la pestaña Conformación.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {actaForm.asistentes.map((asist: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              <div className="sm:col-span-3">
                                <WorkerAutocomplete
                                  workers={companyWorkers}
                                  value={asist.nombre}
                                  placeholder="Nombre completo"
                                  onChange={(val) => {
                                    const list = [...actaForm.asistentes];
                                    list[idx].nombre = val;
                                    setActaForm({ ...actaForm, asistentes: list });
                                  }}
                                  onSelectWorker={(w) => {
                                    const list = [...actaForm.asistentes];
                                    list[idx] = {
                                      ...list[idx],
                                      nombre: w.nombre,
                                      cedula: w.cedula || list[idx].cedula,
                                      cargo: w.cargo || list[idx].cargo,
                                    };
                                    setActaForm({ ...actaForm, asistentes: list });
                                  }}
                                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  placeholder="Cédula"
                                  value={asist.cedula || ''}
                                  onChange={(e) => {
                                    const list = [...actaForm.asistentes];
                                    list[idx].cedula = e.target.value;
                                    setActaForm({ ...actaForm, asistentes: list });
                                  }}
                                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  placeholder="Cargo"
                                  value={asist.cargo || ''}
                                  onChange={(e) => {
                                    const list = [...actaForm.asistentes];
                                    list[idx].cargo = e.target.value;
                                    setActaForm({ ...actaForm, asistentes: list });
                                  }}
                                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  placeholder="Rol en el CSV"
                                  value={asist.rol || ''}
                                  onChange={(e) => {
                                    const list = [...actaForm.asistentes];
                                    list[idx].rol = e.target.value;
                                    setActaForm({ ...actaForm, asistentes: list });
                                  }}
                                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300"
                                />
                              </div>
                              <div className="sm:col-span-3 flex items-center justify-end gap-1.5">
                                <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-zinc-300 cursor-pointer mr-1">
                                  <input
                                    type="checkbox"
                                    checked={asist.asistio !== false}
                                    onChange={(e) => {
                                      const list = actaForm.asistentes.map((item: any, i: number) =>
                                        i === idx ? { ...item, asistio: e.target.checked } : item
                                      );
                                      setActaForm({ ...actaForm, asistentes: list });
                                      setOfficialReportHtml((prev) =>
                                        prev ? syncCommitteeSignaturesInHtml(prev, list, 'comite_pesv') : prev
                                      );
                                    }}
                                    className="rounded text-teal-600"
                                  />
                                  Asistió
                                </label>

                                {asist.firma ? (
                                  <button
                                    type="button"
                                    onClick={() => setSigningIdx(signingIdx === idx ? null : idx)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-extrabold flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Firmado
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSigningIdx(signingIdx === idx ? null : idx)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-extrabold flex items-center gap-1 hover:bg-amber-100"
                                  >
                                    <PenTool className="w-3 h-3" /> Firmar
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = actaForm.asistentes.filter((_: any, i: number) => i !== idx);
                                    setActaForm({ ...actaForm, asistentes: list });
                                    setOfficialReportHtml((prev) =>
                                      prev ? syncCommitteeSignaturesInHtml(prev, list, 'comite_pesv') : prev
                                    );
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {signingIdx === idx && (
                              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                                <SignaturePad
                                  existingSignature={asist.firma || undefined}
                                  signerName={asist.nombre || 'Integrante del Comité de Seguridad Vial'}
                                  signerRole={asist.rol || asist.cargo || 'Comité de Seguridad Vial (CSV)'}
                                  onCancel={() => setSigningIdx(null)}
                                  onSave={(dataUrl) => {
                                    const list = actaForm.asistentes.map((item: any, i: number) =>
                                      i === idx
                                        ? {
                                            ...item,
                                            firma: dataUrl,
                                            firmadoEn: new Date().toISOString(),
                                            firmadoDesde: 'panel_admin',
                                          }
                                        : item
                                    );
                                    setActaForm({ ...actaForm, asistentes: list });
                                    setOfficialReportHtml((prev) =>
                                      prev ? syncCommitteeSignaturesInHtml(prev, list, 'comite_pesv') : prev
                                    );
                                    setSigningIdx(null);
                                    showToast({
                                      message: `Firma digital registrada para ${list[idx].nombre || 'participante'}`,
                                      status: 'success',
                                    });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Desarrollo de los 8 Puntos Reglamentarios del Comité de Seguridad Vial */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        key: 'verificacionQuorumActaAnterior',
                        label: '1. Verificación de Quórum y Lectura del Acta Anterior',
                      },
                      {
                        key: 'seguimientoCompromisosViales',
                        label: '2. Seguimiento a Compromisos Viales y Plan Anual (Paso 7)',
                      },
                      {
                        key: 'analisisSiniestralidadInfracciones',
                        label: '3. Análisis de Siniestralidad Vial, Comparendos e Investigaciones (Paso 15)',
                      },
                      {
                        key: 'inspeccionesPreoperacionalesMantenimiento',
                        label: '4. Balance de Inspecciones Preoperacionales (Paso 16) y Mantenimiento (Paso 17)',
                      },
                      {
                        key: 'factoresHumanosVelocidadFatigaAlcohol',
                        label: '5. Auditoría de Comportamiento Seguro: Velocidad, Fatiga y Alcohol (Paso 11)',
                      },
                      {
                        key: 'capacitacionCompetenciaVial',
                        label: '6. Plan Anual de Formación Vial y Competencia de Conductores (Pasos 9 y 10)',
                      },
                      {
                        key: 'revisionIndicadoresPaso20',
                        label: '7. Evaluación de Indicadores Trimestrales y Metas del PESV (Paso 20)',
                      },
                      {
                        key: 'proposicionesPresupuestoVial',
                        label: '8. Proposiciones, Presupuesto de Seguridad Vial y Acuerdos de Cierre',
                      },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                          {field.label}
                        </label>
                        <textarea
                          rows={3}
                          value={actaForm.ordenDelDia?.[field.key] || ''}
                          onChange={(e) =>
                            setActaForm({
                              ...actaForm,
                              ordenDelDia: { ...actaForm.ordenDelDia, [field.key]: e.target.value },
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-2.5 text-xs leading-relaxed"
                          placeholder={`Registrar desarrollo de ${field.label.toLowerCase()}...`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Compromisos y Plan de Acción Vial (Sincronizado con Kanban ACPM) */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-zinc-800 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">
                          Compromisos y Plan de Acción Vial (Sincronizados con el Tablero Kanban ACPM)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Cada compromiso nuevo creará automáticamente una tarjeta de seguimiento en el Centro de Control ACPM.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActaForm((prev: any) => ({
                            ...prev,
                            compromisos: [
                              ...(prev.compromisos || []),
                              {
                                actividad: '',
                                responsable: activeComite?.liderPesv?.nombre || 'Comité de Seguridad Vial',
                                fechaLimite: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                                estado: 'Pendiente',
                              },
                            ],
                          }))
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-300 text-xs font-bold hover:bg-teal-100"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir Compromiso Vial
                      </button>
                    </div>

                    {(actaForm.compromisos || []).map((comp: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Descripción de la actividad o compromiso de seguridad vial..."
                          value={comp.actividad || comp.accion || ''}
                          onChange={(e) => {
                            const list = [...actaForm.compromisos];
                            list[idx].actividad = e.target.value;
                            setActaForm({ ...actaForm, compromisos: list });
                          }}
                          className="sm:col-span-6 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Responsable"
                          value={comp.responsable || ''}
                          onChange={(e) => {
                            const list = [...actaForm.compromisos];
                            list[idx].responsable = e.target.value;
                            setActaForm({ ...actaForm, compromisos: list });
                          }}
                          className="sm:col-span-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs"
                        />
                        <input
                          type="date"
                          value={comp.fechaLimite ? new Date(comp.fechaLimite).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const list = [...actaForm.compromisos];
                            list[idx].fechaLimite = e.target.value;
                            setActaForm({ ...actaForm, compromisos: list });
                          }}
                          className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const list = actaForm.compromisos.filter((_: any, i: number) => i !== idx);
                            setActaForm({ ...actaForm, compromisos: list });
                          }}
                          className="sm:col-span-1 flex items-center justify-center p-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
