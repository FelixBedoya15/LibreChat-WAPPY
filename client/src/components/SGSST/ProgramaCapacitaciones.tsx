import React, { useState, useEffect, useRef } from 'react';
import { UpgradeWall } from './UpgradeWall';
import { useAuthContext } from '~/hooks';
import { Button, useToastContext } from '@librechat/client';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExportDropdown from './ExportDropdown';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import {
  Plus,
  GraduationCap,
  Users,
  Calendar,
  Trash2,
  CheckCircle,
  Save,
  CalendarCheck,
  Loader2,
  BookOpen,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
  Award,
  Activity,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Filter,
  Check,
  Clock,
  Briefcase,
  AlertCircle,
  ChevronDown,
  Eye,
  Download,
  X,
  Printer
} from 'lucide-react';
import SGSSTToolbar from './SGSSTToolbar';

interface Trabajador {
  nombre: string;
  cedula: string;
  cargo: string;
  asistio: boolean;
}

interface SesionCapacitacion {
  id: string;
  tema: string;
  fecha: string;
  hora: string;
  duracion: string;
  responsable: string;
  descripcion: string;
  estado: 'Programada' | 'Completada' | 'Cancelada';
  trabajadoresRegistrados: Trabajador[];
  evidencias: string[];
}

interface PlanTrabajador {
  id: string;
  nombre: string;
  cargo: string;
  aptitud: string;
  bioTagsIA: string[];
  perfilCargoId: string | null;
  temas: any[];
  completoPct: number;
}

const NORMATIVA_MAP: Record<string, string> = {
  'induccion': 'Decreto 1072 de 2015 (Art. 2.2.4.6.11)',
  'copasst': 'Resolución 2013 de 1986',
  'gtc45': 'Decreto 1072 de 2015 (Art. 2.2.4.6.15)',
  'emergencias': 'Decreto 1072 de 2015 (Art. 2.2.4.6.25)',
  'actos_condiciones': 'Decreto 1072 de 2015 (Art. 2.2.4.6.12)',
  'alturas': 'Resolución 4272 de 2021',
  'vial': 'Resolución 40595 de 2022',
  'ergonomia': 'Resolución 0312 de 2019',
  'psicosocial': 'Resolución 2646 de 2008',
  'quimico': 'Decreto 1496 de 2018',
  'autocuidado': 'Resolución 0312 de 2019'
};

export default function ProgramaCapacitaciones() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [sesiones, setSesiones] = useState<SesionCapacitacion[]>([]);
  const [trabajadoresPlan, setTrabajadoresPlan] = useState<PlanTrabajador[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'matriz' | 'cronograma' | 'generar'>('matriz');
  const [selectedSesionId, setSelectedSesionId] = useState<string | null>(null);
  const [isSesionModalOpen, setIsSesionModalOpen] = useState(false);
  
  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCargo, setSelectedCargo] = useState('Todos');
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('Todos');

  // AI Compiler Terminal logs

  const [isCargoDropdownOpen, setIsCargoDropdownOpen] = useState(false);
  // Editor & Report State
  const [compiledReport, setCompiledReport] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const editorContentRef = useRef<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchData();
    fetchPlanData();
  }, [token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sgsst/programa-capacitaciones/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSesiones(data.sesiones || []);
      }
    } catch (error) {
      console.error('Error loading capacitaciones:', error);
      showToast({ message: 'Error al cargar cronograma', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlanData = async () => {
    try {
      const res = await fetch('/api/sgsst/programa-capacitaciones/plan-trabajador', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrabajadoresPlan(data.trabajadores || []);
        setCatalogo(data.catalogo || []);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  const handleSave = async (updatedSesiones: SesionCapacitacion[]) => {
    setIsSaving(true);
    setSesiones(updatedSesiones);
    try {
      const res = await fetch('/api/sgsst/programa-capacitaciones/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sesiones: updatedSesiones }),
      });
      if (res.ok) {
        showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showToast({ message: 'Error al guardar los cambios', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModal = async () => {
    await handleSave(sesiones);
    await fetchPlanData();
    setIsSesionModalOpen(false);
  };

  const handleAddSesion = () => {
    const newSesion: SesionCapacitacion = {
      id: Date.now().toString(),
      tema: '',
      fecha: '',
      hora: '',
      duracion: '',
      responsable: '',
      descripcion: '',
      estado: 'Programada',
      trabajadoresRegistrados: [],
      evidencias: [],
    };
    const updated = [...sesiones, newSesion];
    setSesiones(updated);
    setSelectedSesionId(newSesion.id);
    setIsSesionModalOpen(true);
    handleSave(updated);
  };

  const handleUpdateSesion = (id: string, updates: Partial<SesionCapacitacion>) => {
    const updated = sesiones.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSesiones(updated);
  };

  const handleDeleteSesion = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta capacitación?')) return;
    const updated = sesiones.filter((s) => s.id !== id);
    if (selectedSesionId === id) setSelectedSesionId(null);
    handleSave(updated);
  };

  const handleGenerateActa = async (sesion: SesionCapacitacion) => {
    if (!sesion.tema || !sesion.fecha) {
      showToast({ message: 'El tema y la fecha son obligatorios', status: 'warning' });
      return;
    }
    setIsGenerating(sesion.id);

    try {
      const res = await fetch('/api/sgsst/programa-capacitaciones/generate-acta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sesion }),
      });
      const data = await res.json();

      if (res.ok && data.report) {
        window.dispatchEvent(
          new CustomEvent('generate-sgsst-document', {
            detail: {
              module: 'capacitaciones',
              type: 'Acta de Capacitación SG-SST',
              content: data.report,
            },
          }),
        );
        showToast({ message: 'Acta generada y enviada a bandeja', status: 'success' });
      } else {
        throw new Error(data.error || 'Generación fallida');
      }
    } catch (error: any) {
      console.error('Error generating acta:', error);
      showToast({ message: error.message || 'Error al compilar el acta', status: 'error' });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGeneratePrograma = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/sgsst/programa-capacitaciones/generate-programa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ modelName: 'gemini-2.5-flash' }),
      });
      const data = await res.json();

      if (res.ok && data.report) {
        setCompiledReport(data.report);
        window.dispatchEvent(
          new CustomEvent('generate-sgsst-document', {
            detail: {
              module: 'capacitaciones',
              type: 'Programa Anual de Capacitaciones',
              content: data.report,
            },
          }),
        );
        showToast({ message: 'Programa generado y enviado a bandeja', status: 'success' });
      } else {
        throw new Error(data.error || 'Generación fallida');
      }
    } catch (error: any) {
      console.error('Error generating programa:', error);
      showToast({ message: error.message || 'Error al compilar el programa', status: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async () => {
    const content = editorContentRef.current || compiledReport;
    if (!content) return;
    setCompiledReport(content);
    window.dispatchEvent(
      new CustomEvent('generate-sgsst-document', {
        detail: {
          module: 'capacitaciones',
          type: 'Programa Anual de Capacitaciones',
          content: content,
        },
      }),
    );
    showToast({ message: 'Programa de capacitación guardado con éxito', status: 'success' });
  };

  const downloadHtml = () => {
    if (!compiledReport) return;
    const blob = new Blob([compiledReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Programa_Anual_Capacitaciones_${new Date().getFullYear()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const iframe = document.getElementById('compiled-report-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  // Workers Handlers
  const handleAddTrabajador = (sesionId: string) => {
    const sesion = sesiones.find((s) => s.id === sesionId);
    if (!sesion) return;

    const newWorker: Trabajador = { nombre: '', cedula: '', cargo: '', asistio: false };
    const updated = sesiones.map((s) =>
      s.id === sesionId
        ? { ...s, trabajadoresRegistrados: [...s.trabajadoresRegistrados, newWorker] }
        : s,
    );
    setSesiones(updated);
  };

  const handleUpdateTrabajador = (
    sesionId: string,
    index: number,
    updates: Partial<Trabajador>,
  ) => {
    const updated = sesiones.map((s) => {
      if (s.id !== sesionId) return s;
      const newWorkers = [...s.trabajadoresRegistrados];
      newWorkers[index] = { ...newWorkers[index], ...updates };
      return { ...s, trabajadoresRegistrados: newWorkers };
    });
    setSesiones(updated);
  };

  const handleDeleteTrabajador = (sesionId: string, index: number) => {
    const updated = sesiones.map((s) => {
      if (s.id !== sesionId) return s;
      const newWorkers = s.trabajadoresRegistrados.filter((_, i) => i !== index);
      return { ...s, trabajadoresRegistrados: newWorkers };
    });
    setSesiones(updated);
  };

  // Toggle company worker attendance (Attended ➜ Absent ➜ Unregistered)
  const handleToggleAttendance = (sesionId: string, worker: PlanTrabajador) => {
    const sesion = sesiones.find((s) => s.id === sesionId);
    if (!sesion) return;

    const cleanCedula = String(worker.cedula || worker.id || '').trim();
    const existingIndex = sesion.trabajadoresRegistrados.findIndex(
      (w) => String(w.cedula).trim() === cleanCedula
    );

    let updatedWorkers = [...sesion.trabajadoresRegistrados];

    if (existingIndex >= 0) {
      const current = updatedWorkers[existingIndex];
      if (current.asistio) {
        // State 2 to State 3: Was attending, now marked as absent
        current.asistio = false;
      } else {
        // State 3 to State 1: Was absent, now remove completely
        updatedWorkers.splice(existingIndex, 1);
      }
    } else {
      // State 1 to State 2: Not in list, now add as attending
      updatedWorkers.push({
        nombre: worker.nombre,
        cedula: cleanCedula,
        cargo: worker.cargo || 'Sin cargo',
        asistio: true,
      });
    }

    const updated = sesiones.map((s) =>
      s.id === sesionId ? { ...s, trabajadoresRegistrados: updatedWorkers } : s
    );
    setSesiones(updated);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center p-8">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-teal-500/20 border-t-teal-500"></div>
          <GraduationCap className="absolute h-6 w-6 animate-pulse text-teal-500" />
        </div>
      </div>
    );
  }

  // --- STATS CALCULATION ---
  const totalWorkers = trabajadoresPlan.length;
  const avgCompliance = totalWorkers > 0 
    ? Math.round(trabajadoresPlan.reduce((acc, w) => acc + (w.completoPct || 0), 0) / totalWorkers)
    : 0;

  const totalSessions = sesiones.length;
  const completedSessions = sesiones.filter(s => s.estado === 'Completada').length;
  const pendingSessions = sesiones.filter(s => s.estado === 'Programada').length;
  const totalBioAlerts = trabajadoresPlan.reduce((acc, w) => acc + (w.bioTagsIA ? w.bioTagsIA.length : 0), 0);
  const highComplianceCount = trabajadoresPlan.filter(w => w.completoPct >= 80).length;

  // Unique cargos for filtering
  const uniqueCargos = ['Todos', ...Array.from(new Set(trabajadoresPlan.map(w => w.cargo).filter(Boolean)))];

  // Filtering workers for the matrix
  const filteredWorkers = trabajadoresPlan.filter(w => {
    const matchesSearch = w.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.cargo && w.cargo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCargo = selectedCargo === 'Todos' || w.cargo === selectedCargo;
    return matchesSearch && matchesCargo;
  });

  // Filtering sessions for timeline
  const filteredSessions = sesiones.filter(s => {
    const matchesSearch = s.tema.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (s.responsable && s.responsable.toLowerCase().includes(sessionSearch.toLowerCase()));
    const matchesStatus = sessionStatusFilter === 'Todos' || s.estado === sessionStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgCompliance / 100) * circumference;

  const renderDashboardStats = () => (
    <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* CARD 1: Cumplimiento General */}
      <div className="group relative overflow-hidden rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-teal-500/30 dark:border-white/5">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-teal-500/5 blur-2xl transition-all duration-500 group-hover:scale-150" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Cumplimiento General</span>
            <h3 className="text-3xl font-black text-text-primary tracking-tight">{avgCompliance}%</h3>
          </div>
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="h-full w-full -rotate-90">
              <circle cx="28" cy="28" r={radius} className="stroke-slate-100 dark:stroke-slate-800/60" strokeWidth="5.5" fill="transparent" />
              <circle cx="28" cy="28" r={radius} className="stroke-teal-500 transition-all duration-1000 ease-out" strokeWidth="5.5" fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <TrendingUp className="absolute h-4 w-4 text-teal-600 dark:text-teal-400 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-text-secondary">
          {highComplianceCount} de {totalWorkers} trabajadores superan el 80% del plan programado.
        </p>
      </div>

      {/* CARD 2: Vigilancia Bio-Individual */}
      <div className="group relative overflow-hidden rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-amber-500/30 dark:border-white/5">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-500/5 blur-2xl transition-all duration-500 group-hover:scale-150" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Vigilancia Médica H1</span>
            <h3 className="text-3xl font-black text-text-primary tracking-tight">{totalBioAlerts} Alertas</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-all duration-300 group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-text-secondary">
          Alertas activas de vigilancia médica mitigadas mediante temas preventivos personalizados.
        </p>
      </div>

      {/* CARD 3: Estado de Charlas */}
      <div className="group relative overflow-hidden rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/30 dark:border-white/5">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/5 blur-2xl transition-all duration-500 group-hover:scale-150" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Cronograma de Eventos</span>
            <h3 className="text-3xl font-black text-text-primary tracking-tight">{completedSessions} / {totalSessions}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-all duration-300 group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
          <div 
            className="h-1.5 rounded-full bg-blue-500 transition-all duration-1000"
            style={{ width: totalSessions > 0 ? `${(completedSessions / totalSessions) * 100}%` : '0%' }}
          ></div>
        </div>
        <p className="mt-2 text-[11px] text-text-secondary">
          {pendingSessions} charlas programadas en el plan de trabajo anual.
        </p>
      </div>

      {/* CARD 4: Eficacia Normativa */}
      <div className="group relative overflow-hidden rounded-2xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-500/30 dark:border-white/5">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/5 blur-2xl transition-all duration-500 group-hover:scale-150" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Eficacia de Ley</span>
            <h3 className="text-3xl font-black text-emerald-600 tracking-tight dark:text-emerald-400">Audit-Ready</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-all duration-300 group-hover:scale-110 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Award className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-[11px] text-text-secondary">
          Cumple a cabalidad el Decreto 1072 y la Res. 0312 mediante el Motor Biocéntrico.
        </p>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="mb-6 flex w-full space-x-1 border-b border-border-light pb-1 dark:border-white/5">
      <button
        onClick={() => setActiveTab('matriz')}
        className={`flex items-center border-b-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'matriz' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
      >
        <Users className="mr-2 h-4 w-4" />
        Matriz de Bio-Individuos
      </button>
      <button
        onClick={() => setActiveTab('cronograma')}
        className={`flex items-center border-b-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'cronograma' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Cronograma Anual
      </button>
      <button
        onClick={() => setActiveTab('generar')}
        className={`flex items-center border-b-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'generar' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
      >
        <FileText className="mr-2 h-4 w-4" />
        Generar Programa
      </button>
    </div>
  );

  const renderMatriz = () => (
    <div className="rounded-2xl border border-border-light bg-surface-primary p-6 dark:border-white/5 shadow-sm">
      {/* Section Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-lg font-black tracking-tight text-text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-500" /> Matriz de Capacitaciones por Trabajador
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Matriz inteligente alineada con GTC-45 y alertas de vigilancia médica (Oráculo Predictivo H1).
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar trabajador o cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border-light bg-surface-secondary/30 py-2 pl-9 pr-4 text-xs text-text-primary outline-none focus:ring-1 focus:ring-teal-500/50"
            />
          </div>

          {/* Redesigned Premium Cargo Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCargoDropdownOpen(!isCargoDropdownOpen)}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500/5 to-teal-500/10 hover:from-teal-500/10 hover:to-teal-500/20 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 rounded-xl px-4 py-2 border border-teal-500/20 shadow-sm transition-all text-xs font-black uppercase tracking-wider focus:outline-none"
            >
              <Briefcase className="h-3.5 w-3.5 text-teal-500" />
              <span>{selectedCargo === 'Todos' ? 'Filtrar por Cargo' : selectedCargo}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isCargoDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCargoDropdownOpen && (
              <>
                {/* Click outside backdrop overlay */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsCargoDropdownOpen(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border-light bg-surface-primary/95 backdrop-blur-md p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-white/5">
                  <div className="px-3 py-2 border-b border-border-light dark:border-white/5 mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Cargos Disponibles</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {uniqueCargos.map((cargo) => {
                      const count = trabajadoresPlan.filter(w => cargo === 'Todos' || w.cargo === cargo).length;
                      const isSelected = selectedCargo === cargo;
                      return (
                        <button
                          key={cargo}
                          onClick={() => {
                            setSelectedCargo(cargo);
                            setIsCargoDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${isSelected ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'text-text-primary hover:bg-surface-secondary/50'}`}
                        >
                          <span className="truncate">{cargo}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isSelected ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'bg-surface-secondary text-text-secondary'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredWorkers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border border-dashed border-border-light rounded-2xl dark:border-white/5">
            <Users className="h-10 w-10 text-text-secondary/40 mb-3" />
            <p className="text-sm font-bold text-text-primary">No se encontraron trabajadores</p>
            <p className="text-xs text-text-secondary mt-1">Verifica los filtros o añade perfiles en el Editor de Trabajadores.</p>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            // Determine ring color depending on compliance
            const statusColor = worker.completoPct >= 80 
              ? 'border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/5' 
              : worker.completoPct >= 40 
              ? 'border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-amber-500/5' 
              : 'border-slate-300 dark:border-slate-700 text-slate-500 bg-slate-500/5';

            const aptitud = worker.aptitud || 'Sin evaluar';
            const isApto = aptitud.toLowerCase().includes('apto') && !aptitud.toLowerCase().includes('restricc') && !aptitud.toLowerCase().includes('limitac');
            const isRestringido = aptitud.toLowerCase().includes('restricc') || aptitud.toLowerCase().includes('limitac') || aptitud.toLowerCase().includes('recomendac');
            const isNoApto = aptitud.toLowerCase().includes('inapto') || aptitud.toLowerCase().includes('no apto');
            
            const aptitudBadge = isApto
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
              : isRestringido
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
              : isNoApto
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
              : 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-400';

            return (
              <div 
                key={worker.id}
                className="group relative rounded-2xl border border-border-light bg-surface-secondary/10 p-5 transition-all duration-300 hover:bg-surface-secondary/20 hover:-translate-y-1 hover:shadow-xl dark:border-white/5 hover:z-20"
              >
                {/* Background/Aura container (handles overflow isolation) */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-teal-500/[0.02] blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:bg-teal-500/[0.04]" />
                </div>
                
                <div className="flex flex-col gap-4">
                  {/* Row 1: Worker Identity & Health Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar with compliance border glow */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-black text-xs transition-all duration-500 group-hover:scale-105 ${statusColor}`}>
                        {worker.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{worker.nombre}</h4>
                        <span className="flex items-center gap-1 text-[11px] text-text-secondary mt-0.5">
                          <Briefcase className="h-3 w-3 text-teal-500" /> {worker.cargo || 'Sin cargo asignado'}
                        </span>
                      </div>
                    </div>

                    {/* Aptitud Badge */}
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${aptitudBadge}`}>
                      <Activity className="h-2.5 w-2.5 shrink-0" />
                      {aptitud}
                    </span>
                  </div>

                  {/* Row 2: Compliance progress bar */}
                  <div className="bg-surface-secondary/20 rounded-xl p-3 border border-border-light dark:border-white/5">
                    <div className="flex items-center justify-between text-[10px] text-text-secondary font-black uppercase tracking-wider mb-1.5">
                      <span>Progreso del Plan</span>
                      <span className="text-text-primary font-black">{worker.completoPct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${worker.completoPct >= 80 ? 'bg-emerald-500' : worker.completoPct >= 40 ? 'bg-amber-500' : 'bg-slate-400'}`}
                        style={{ width: `${worker.completoPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-secondary mt-1.5 block">
                      {worker.temas.filter((t: any) => t.aplica && t.estado === 'Completada').length} de {worker.temas.filter((t: any) => t.aplica).length} temas completados
                    </span>
                  </div>

                  {/* Row 3: H1 Alerts */}
                  {worker.bioTagsIA && worker.bioTagsIA.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary block">Alertas Médicas H1</span>
                      <div className="flex flex-wrap gap-1.5">
                        {worker.bioTagsIA.map((tag, idx) => {
                          const isBurnout = tag.toLowerCase().includes('burnout') || tag.toLowerCase().includes('mental') || tag.toLowerCase().includes('estrés');
                          const pillStyle = isBurnout 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.08)]' 
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.08)]';
                          const dotStyle = isBurnout ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]' : 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]';

                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${pillStyle}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dotStyle}`} />
                              {tag.split(':')[0]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Assigned Topics */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary block">Temas Personalizados de Seguridad</span>
                    <div className="flex flex-wrap gap-2">
                      {worker.temas
                        .filter((t: any) => t.aplica)
                        .map((t: any) => {
                          const cat = catalogo.find((c) => c.id === t.capId);
                          const isCompleted = t.estado === 'Completada';
                          const norm = NORMATIVA_MAP[t.capId] || 'Resolución 0312 de 2019';

                          return (
                            <div
                              key={t.capId}
                              className={`group/badge relative flex cursor-help items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold shadow-sm transition-all duration-200 ${isCompleted ? 'border-emerald-500/20 bg-emerald-500/[0.03] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/[0.08]' : 'border-amber-500/20 bg-amber-500/[0.03] text-amber-700 dark:text-amber-400 hover:bg-amber-500/[0.08]'}`}
                            >
                              {isCompleted ? (
                                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                              )}
                              <span>{cat?.tema || t.capId}</span>

                              {/* Tooltip */}
                              <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-md p-3 text-xs font-medium text-slate-200 shadow-xl opacity-0 transition-all duration-200 group-hover/badge:visible group-hover/badge:opacity-100">
                                <p className="font-black text-white mb-1 text-xs">{cat?.tema || t.capId}</p>
                                <p className="text-[9px] font-black text-teal-400 uppercase tracking-wider mb-2">{norm}</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{t.razon}</p>
                                <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-slate-950/95 rotate-45 border-r border-b border-white/10"></div>
                              </div>
                            </div>
                          );
                        })}
                      {worker.temas.filter((t: any) => t.aplica).length === 0 && (
                        <span className="text-text-secondary/50 text-xs italic">
                          Sin temas asignados bajo la metodología bio-individual.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderSesionModal = () => {
    const selectedSesion = sesiones.find((s) => s.id === selectedSesionId);
    if (!selectedSesion) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-border-light bg-surface-primary shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 dark:border-white/5">
          <div className="flex items-center justify-between border-b border-border-light bg-surface-secondary/20 px-6 py-4 dark:border-white/5">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary">Ficha de Planificación</h3>
              <h2 className="text-base font-black text-text-primary truncate max-w-md">{selectedSesion.tema || 'Nueva Capacitación'}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveModal}
                className="h-8 rounded-lg border border-border-light bg-surface-secondary/20 px-3 text-xs font-bold text-text-primary hover:bg-surface-secondary/40"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                <span>Guardar y Cerrar</span>
              </Button>
              <button
                onClick={() => handleDeleteSesion(selectedSesion.id)}
                className="h-8 rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400"
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsSesionModalOpen(false)}
                className="rounded-xl border border-border-light bg-surface-primary p-2 text-text-primary hover:bg-surface-hover hover:border-rose-500/50 transition-colors ml-2"
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Tema de la Capacitación *</label>
                <input
                  type="text"
                  value={selectedSesion.tema}
                  onChange={(e) => handleUpdateSesion(selectedSesion.id, { tema: e.target.value })}
                  className="w-full rounded-xl border border-border-light bg-surface-secondary/10 px-3 py-2 text-xs text-text-primary outline-none focus:ring-1 focus:ring-teal-500/50"
                  placeholder="Ej: Identificación de peligros GTC-45"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Fecha *</label>
                  <input
                    type="date"
                    value={selectedSesion.fecha}
                    onChange={(e) => handleUpdateSesion(selectedSesion.id, { fecha: e.target.value })}
                    className="w-full rounded-xl border border-border-light bg-surface-secondary/10 px-3 py-2 text-xs text-text-primary outline-none font-mono focus:ring-1 focus:ring-teal-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Hora</label>
                  <input
                    type="time"
                    value={selectedSesion.hora}
                    onChange={(e) => handleUpdateSesion(selectedSesion.id, { hora: e.target.value })}
                    className="w-full rounded-xl border border-border-light bg-surface-secondary/10 px-3 py-2 text-xs text-text-primary outline-none font-mono focus:ring-1 focus:ring-teal-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Responsable / Capacitador</label>
                <input
                  type="text"
                  value={selectedSesion.responsable}
                  onChange={(e) => handleUpdateSesion(selectedSesion.id, { responsable: e.target.value })}
                  className="w-full rounded-xl border border-border-light bg-surface-secondary/10 px-3 py-2 text-xs text-text-primary outline-none focus:ring-1 focus:ring-teal-500/50"
                  placeholder="Nombre del facilitador"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Duración</label>
                  <input
                    type="text"
                    value={selectedSesion.duracion}
                    onChange={(e) => handleUpdateSesion(selectedSesion.id, { duracion: e.target.value })}
                    className="w-full rounded-xl border border-border-light bg-surface-secondary/10 px-3 py-2 text-xs text-text-primary outline-none focus:ring-1 focus:ring-teal-500/50"
                    placeholder="Ej: 2 horas"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Estado</label>
                  <select
                    value={selectedSesion.estado}
                    onChange={(e) => handleUpdateSesion(selectedSesion.id, { estado: e.target.value as any })}
                    className="w-full rounded-xl border border-border-light bg-surface-secondary/10 px-3 py-2 text-xs text-text-primary outline-none focus:ring-1 focus:ring-teal-500/50"
                  >
                    <option value="Programada">Programada</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Descripción y Alcance</label>
                <textarea
                  rows={2}
                  value={selectedSesion.descripcion}
                  onChange={(e) => handleUpdateSesion(selectedSesion.id, { descripcion: e.target.value })}
                  className="w-full rounded-xl border border-border-light bg-surface-secondary/10 px-3 py-2 text-xs text-text-primary outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
                  placeholder="Detalles sobre el contenido o material didáctico..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-primary">Control de Asistencia</h4>
                  <p className="text-[10px] text-text-secondary">Inscribe y marca la asistencia del personal.</p>
                </div>
                <Button
                  onClick={() => handleAddTrabajador(selectedSesion.id)}
                  size="sm"
                  className="h-7 rounded-lg border border-border-light bg-surface-secondary/30 px-2 text-[10px] font-bold text-text-primary hover:bg-surface-secondary/50"
                >
                  <Plus className="mr-1 h-3 w-3" /> Añadir Externo
                </Button>
              </div>

              {trabajadoresPlan.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary block">Plantilla de la Empresa (Un-click Toggle)</span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {trabajadoresPlan.map((worker) => {
                      const cleanCed = String(worker.cedula || worker.id || '').trim();
                      const regWorker = selectedSesion.trabajadoresRegistrados.find(
                        (w) => String(w.cedula).trim() === cleanCed
                      );
                      
                      let stateText = 'No inscrito';
                      let stateClass = 'border-border-light text-text-secondary bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]';
                      let stateIcon = <Plus className="h-3 w-3" />;

                      if (regWorker) {
                        if (regWorker.asistio) {
                          stateText = 'Asistió';
                          stateClass = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-[0_2px_10px_rgba(16,185,129,0.08)]';
                          stateIcon = <UserCheck className="h-3 w-3" />;
                        } else {
                          stateText = 'No asistió';
                          stateClass = 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-[0_2px_10px_rgba(245,158,11,0.08)]';
                          stateIcon = <AlertCircle className="h-3 w-3" />;
                        }
                      }

                      return (
                        <div
                          key={worker.id}
                          onClick={() => handleToggleAttendance(selectedSesion.id, worker)}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all duration-200 hover:scale-102 hover:shadow-md ${stateClass}`}
                        >
                          <div className="truncate pr-2">
                            <p className="text-[11px] font-black">{worker.nombre}</p>
                            <p className="text-[9px] opacity-75">{worker.cargo || 'Sin cargo'}</p>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 rounded-md border border-current/20 px-2 py-0.5 text-[9px] font-bold uppercase">
                            {stateIcon}
                            {stateText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedSesion.trabajadoresRegistrados.length > 0 && (
                <div className="space-y-2 mt-6">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary block">Listado Total Inscrito</span>
                  <div className="rounded-xl border border-border-light overflow-hidden dark:border-white/5">
                    <div className="bg-surface-secondary/30 hidden grid-cols-[2fr_1fr_1fr_60px_40px] gap-2 border-b border-border-light p-2 text-[8px] font-black uppercase tracking-wider text-text-secondary sm:grid">
                      <div>Nombre</div>
                      <div>Documento</div>
                      <div>Cargo</div>
                      <div className="text-center">Asistió</div>
                      <div></div>
                    </div>

                    <div className="divide-y divide-border-light dark:divide-white/5">
                      {selectedSesion.trabajadoresRegistrados.map((worker, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 sm:grid sm:grid-cols-[2fr_1fr_1fr_60px_40px] sm:items-center sm:gap-2 sm:p-2">
                          <input
                            type="text"
                            value={worker.nombre}
                            onChange={(e) => handleUpdateTrabajador(selectedSesion.id, i, { nombre: e.target.value })}
                            className="border-none bg-transparent p-0 text-xs font-bold text-text-primary outline-none focus:ring-0"
                            placeholder="Nombre del asistente"
                          />
                          <input
                            type="text"
                            value={worker.cedula}
                            onChange={(e) => handleUpdateTrabajador(selectedSesion.id, i, { cedula: e.target.value })}
                            className="border-none bg-transparent p-0 text-xs text-text-secondary font-mono outline-none focus:ring-0"
                            placeholder="Documento"
                          />
                          <input
                            type="text"
                            value={worker.cargo}
                            onChange={(e) => handleUpdateTrabajador(selectedSesion.id, i, { cargo: e.target.value })}
                            className="border-none bg-transparent p-0 text-xs text-text-secondary outline-none focus:ring-0"
                            placeholder="Cargo"
                          />
                          <div className="flex items-center sm:justify-center">
                            <input
                              type="checkbox"
                              checked={worker.asistio}
                              onChange={(e) => handleUpdateTrabajador(selectedSesion.id, i, { asistio: e.target.checked })}
                              className="h-4 w-4 rounded border-border-light bg-surface-primary text-teal-600 focus:ring-0 cursor-pointer"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDeleteTrabajador(selectedSesion.id, i)}
                              className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCronograma = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border-light bg-surface-primary p-6 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black tracking-tight text-text-primary flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-500" /> Matriz del Cronograma Anual
              </h3>
              <p className="text-xs text-text-secondary mt-1">Plan de entrenamiento y formación SG-SST ({sesiones.length} planificadas).</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Buscar charla..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="w-48 rounded-xl border border-border-light bg-surface-secondary/20 py-2 pl-8 pr-3 text-xs text-text-primary outline-none focus:ring-1 focus:ring-teal-500/50"
                />
              </div>
              <Button
                onClick={handleAddSesion}
                className="flex items-center gap-1.5 rounded-xl border-none bg-teal-600 px-4 py-2 text-xs font-black text-white hover:bg-teal-700 transition-all hover:scale-102 hover:shadow-lg hover:shadow-teal-500/10"
              >
                <Plus className="h-4 w-4" /> Nueva Charla
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border-light dark:border-white/5 bg-surface-primary">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-surface-secondary/50 uppercase text-[10px] font-black tracking-wider text-text-secondary">
                <tr>
                  <th className="px-4 py-3 border-b border-border-light dark:border-white/5">Tema Capacitación</th>
                  <th className="px-4 py-3 border-b border-border-light dark:border-white/5">Responsable</th>
                  <th className="px-4 py-3 border-b border-border-light dark:border-white/5 text-center">Duración</th>
                  {months.map(m => (
                    <th key={m} className="px-2 py-3 border-b border-border-light dark:border-white/5 text-center w-10 border-l border-border-light/30">{m}</th>
                  ))}
                  <th className="px-4 py-3 border-b border-border-light dark:border-white/5 text-center border-l border-border-light/30">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="px-4 py-12 text-center text-text-secondary">
                      <CalendarCheck className="mx-auto mb-3 h-10 w-10 opacity-30" />
                      <p className="font-bold text-sm">No hay capacitaciones programadas.</p>
                      <p className="text-xs opacity-75 mt-1">Usa el botón "Nueva Charla" para empezar a planificar.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((sesion) => {
                    const monthIdx = sesion.fecha ? parseInt(sesion.fecha.split('-')[1] || '0', 10) - 1 : -1;
                    const isCompleted = sesion.estado === 'Completada';
                    
                    return (
                      <tr 
                        key={sesion.id} 
                        className="hover:bg-surface-secondary/20 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedSesionId(sesion.id);
                          setIsSesionModalOpen(true);
                        }}
                      >
                        <td className="px-4 py-3 max-w-[250px] truncate font-bold text-text-primary group-hover:text-teal-600 transition-colors">
                          {sesion.tema || 'Sin definir'}
                        </td>
                        <td className="px-4 py-3 max-w-[150px] truncate text-text-secondary">
                          {sesion.responsable || 'No asignado'}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {sesion.duracion || '-'}
                        </td>
                        {months.map((m, idx) => (
                          <td key={m} className="px-1 py-3 text-center border-l border-border-light/30 dark:border-white/[0.02]">
                            {monthIdx === idx ? (
                              <div className={`mx-auto h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-black ${isCompleted ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'}`}>
                                {isCompleted ? 'E' : 'P'}
                              </div>
                            ) : null}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center border-l border-border-light/30">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSesionId(sesion.id);
                              setIsSesionModalOpen(true);
                            }}
                            className="text-teal-600 hover:text-teal-700 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1 rounded-lg font-bold transition-all text-[10px] uppercase"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-6 text-[10px] font-bold text-text-secondary uppercase">
            <span className="flex items-center gap-1.5"><div className="h-3.5 w-3.5 bg-blue-500 rounded-sm shadow-sm"></div> P = Programado</span>
            <span className="flex items-center gap-1.5"><div className="h-3.5 w-3.5 bg-emerald-500 rounded-sm shadow-sm"></div> E = Ejecutado</span>
          </div>
        </div>

        {/* Modal de Sesión */}
        {isSesionModalOpen && selectedSesionId && renderSesionModal()}
      </div>
    );
  };

  const renderGenerar = () => (
    <div className="mx-auto max-w-4xl rounded-2xl border border-border-light bg-surface-primary p-8 dark:border-white/5 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 mb-6 animate-pulse">
          <BookOpen className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-text-primary">Estructuración Formal del Programa Anual</h2>
        <p className="text-xs text-text-secondary max-w-lg mt-2">
          Compila y genera la documentación formal del plan de entrenamiento SG-SST según el **Decreto 1072** y la **Resolución 0312 de 2019**, vinculando el perfil sociodemográfico de los bio-individuos.
        </p>
      </div>

      <hr className="my-8 border-border-light dark:border-white/5" />

      {/* Structured Modules Timeline */}
      <div className="mb-8">
        <h4 className="text-xs font-black uppercase tracking-wider text-text-primary mb-4 text-center">Secciones del Documento Compilado</h4>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary/20 border border-border-light dark:border-white/5 text-center transition-all duration-300 hover:scale-105 hover:border-teal-500/20">
            <span className="text-xs font-black text-teal-600 dark:text-teal-400">01</span>
            <span className="text-[10px] font-bold text-text-primary mt-1">Objetivos</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary/20 border border-border-light dark:border-white/5 text-center transition-all duration-300 hover:scale-105 hover:border-teal-500/20">
            <span className="text-xs font-black text-teal-600 dark:text-teal-400">02</span>
            <span className="text-[10px] font-bold text-text-primary mt-1">Responsables</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary/20 border border-border-light dark:border-white/5 text-center transition-all duration-300 hover:scale-105 hover:border-teal-500/20">
            <span className="text-xs font-black text-teal-600 dark:text-teal-400">03</span>
            <span className="text-[10px] font-bold text-text-primary mt-1">Matriz por Cargo</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary/20 border border-border-light dark:border-white/5 text-center transition-all duration-300 hover:scale-105 hover:border-teal-500/20">
            <span className="text-xs font-black text-teal-600 dark:text-teal-400">04</span>
            <span className="text-[10px] font-bold text-text-primary mt-1">Cronograma</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-surface-secondary/20 border border-border-light dark:border-white/5 text-center transition-all duration-300 hover:scale-105 hover:border-teal-500/20">
            <span className="text-xs font-black text-teal-600 dark:text-teal-400">05</span>
            <span className="text-[10px] font-bold text-text-primary mt-1">Indicadores</span>
          </div>
        </div>
      </div>

      {/* Generated Report View */}
      {compiledReport && (
        <div className="mt-8">
          <CollapsibleReportBox
            onSave={handleSaveReport}
            onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
            isHistoryOpen={isHistoryOpen}
            title="Programa Anual de Capacitación"
            icon={<FileText className="h-5 w-5" />}
            actions={
              <ExportDropdown
                content={editorContentRef.current || compiledReport || ''}
                fileName="Programa_Capacitaciones_2026"
                reportType="general"
              />
            }
            defaultExpanded={true}
          >
            <div className="relative overflow-hidden rounded-2xl border border-border-medium/50 shadow-sm transition-all bg-white dark:bg-slate-900/50 p-2">
              <LiveEditor
                initialContent={compiledReport}
                editorId="sgsst-programa-capacitaciones"
                readOnly={false}
                onChange={(content) => {
                  editorContentRef.current = content;
                }}
              />
            </div>
          </CollapsibleReportBox>
        </div>
      )}

      {/* Compilation Trigger */}
      {!compiledReport && (
        <div className="flex justify-center mt-8">
          <SGSSTToolbar onAnalyze={handleGeneratePrograma} isAnalyzing={isAnalyzing} />
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col pb-10">
      {renderDashboardStats()}
      {renderTabs()}

      <div className="w-full">
        {activeTab === 'matriz' && renderMatriz()}
        {activeTab === 'cronograma' && renderCronograma()}
        {activeTab === 'generar' && renderGenerar()}
      </div>
    </div>
  );
}
