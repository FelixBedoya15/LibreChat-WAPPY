import React, { useState, useEffect, useRef } from 'react';
import { UpgradeWall } from './UpgradeWall';
import { useAuthContext } from '~/hooks';
import { Button, useToastContext } from '@librechat/client';
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

  const [debugData, setDebugData] = useState<any>(null);

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
        if (data.debugData) setDebugData(data.debugData);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const renderTabs = () => (
    <div className="mb-6 flex w-full space-x-1 overflow-x-auto border-b border-border-light pb-1">
      <button
        onClick={() => setActiveTab('matriz')}
        className={`flex items-center whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'matriz' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
      >
        <Users className="mr-2 h-4 w-4" />
        Matriz por Trabajador
      </button>
      <button
        onClick={() => setActiveTab('cronograma')}
        className={`flex items-center whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'cronograma' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Cronograma Anual
      </button>
      <button
        onClick={() => setActiveTab('generar')}
        className={`flex items-center whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'generar' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
      >
        <FileText className="mr-2 h-4 w-4" />
        Generar Programa
      </button>
    </div>
  );

  const renderMatriz = () => (
    <div className="bg-surface-secondary/20 w-full overflow-x-auto rounded-2xl border border-border-light p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-text-primary">
        <Users className="h-5 w-5 text-teal-500" /> Matriz de Capacitaciones por Trabajador
      </h2>
      <p className="mb-6 max-w-3xl text-xs text-text-secondary">
        Esta matriz cruza de forma automática los requerimientos de capacitación según el cargo
        (IPEVAR) y las alertas de vigilancia en salud (Oráculo H1). Muestra los módulos obligatorios
        y específicos para cada trabajador.
      </p>
      <div className="min-w-[900px]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-surface-primary/50 text-[10px] font-black uppercase tracking-widest text-text-secondary">
              <th className="w-1/4 border-b border-border-light p-3">Trabajador y Cargo</th>
              <th className="w-24 border-b border-border-light p-3 text-center">Progreso</th>
              <th className="border-b border-border-light p-3">Temas Asignados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {trabajadoresPlan.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-text-secondary">
                  No hay trabajadores registrados con perfiles de cargo asociados.
                </td>
              </tr>
            ) : (
              trabajadoresPlan.map((worker) => (
                <tr key={worker.id} className="hover:bg-surface-primary/30 align-top">
                  <td className="p-3">
                    <div className="text-sm font-bold text-text-primary">{worker.nombre}</div>
                    <div className="mt-0.5 text-xs text-text-secondary">{worker.cargo}</div>
                    {worker.bioTagsIA && worker.bioTagsIA.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {worker.bioTagsIA.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] text-blue-600 dark:border-blue-800 dark:bg-blue-900/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="mt-2 h-2 w-full rounded-full bg-surface-tertiary">
                      <div
                        className="h-2 rounded-full bg-teal-500"
                        style={{ width: `${worker.completoPct}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-center text-[10px] font-bold text-text-secondary">
                      {worker.completoPct}%
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {worker.temas
                        .filter((t: any) => t.aplica)
                        .map((t: any) => {
                          const cat = catalogo.find((c) => c.id === t.capId);
                          const isCompleted = t.estado === 'Completada';
                          return (
                            <span
                              key={t.capId}
                              className={`cursor-help rounded-md border px-2 py-1.5 text-[10px] font-semibold shadow-sm ${isCompleted ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20'}`}
                              title={t.razon}
                            >
                              {cat?.tema || t.capId}
                            </span>
                          );
                        })}
                      {worker.temas.filter((t: any) => !t.aplica).length === 0 &&
                        worker.temas.length === 0 && (
                          <span className="text-text-secondary/50 text-xs italic">
                            Sin temas asignados
                          </span>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCronograma = () => {
    const selectedSesion = sesiones.find((s) => s.id === selectedSesionId);

    return (
      <div className="flex min-h-[600px] w-full flex-col gap-6 lg:flex-row">
        {/* Sidebar: List of Sessions */}
        <div className="flex w-full flex-col gap-4 lg:w-1/3">
          <div className="bg-surface-secondary/40 flex items-center justify-between rounded-2xl border border-border-light p-4 dark:border-white/5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-text-primary">
                Cronograma Anual
              </h3>
              <p className="text-xs text-text-secondary">{sesiones.length} Eventos programados</p>
            </div>
            <Button
              onClick={handleAddSesion}
              size="sm"
              className="flex h-9 items-center gap-1 rounded-xl border-none bg-teal-600 px-3 text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" /> <span className="hidden font-bold sm:inline">Nueva</span>
            </Button>
          </div>

          <div className="max-h-[70vh] flex-1 space-y-3 overflow-y-auto pr-1">
            {sesiones.length === 0 ? (
              <div className="text-text-secondary/60 bg-surface-primary/30 border-border-medium/50 rounded-2xl border border-dashed px-4 py-10 text-center">
                <CalendarCheck className="mx-auto mb-2 h-10 w-10 opacity-50" />
                <p className="text-sm font-medium">No hay capacitaciones creadas.</p>
              </div>
            ) : (
              sesiones.map((sesion) => (
                <div
                  key={sesion.id}
                  onClick={() => setSelectedSesionId(sesion.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${selectedSesionId === sesion.id ? 'border-teal-500/50 bg-teal-50/50 shadow-sm dark:bg-teal-900/20' : 'bg-surface-primary/50 border-border-light hover:border-teal-400/50'}`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="max-w-[80%] truncate text-sm font-bold text-text-primary">
                      {sesion.tema || 'Sin tema definido'}
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sesion.estado === 'Completada' ? 'bg-green-100 text-green-700' : sesion.estado === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {sesion.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {sesion.fecha || 'Sin fecha'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {sesion.trabajadoresRegistrados.length} pers.
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Column: Edit Session */}
        <div className="bg-surface-secondary/20 relative flex min-h-[500px] w-full flex-col overflow-y-auto rounded-2xl border border-border-light p-4 dark:border-white/5 sm:p-6 lg:w-2/3">
          {!selectedSesion ? (
            <div className="text-text-secondary/50 opacity-opacity-60 my-20 flex flex-1 flex-col items-center justify-center">
              <GraduationCap className="mb-4 h-16 w-16 opacity-30" />
              <h3 className="mb-1 text-lg font-bold">Centro de Formación</h3>
              <p className="max-w-sm text-center text-sm font-medium">
                Selecciona una capacitación del panel lateral o crea una nueva para empezar a
                registrar la asistencia.
              </p>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {/* HEADER ACTIONS */}
              <div className="bg-surface-primary/50 flex flex-col items-start justify-between gap-4 rounded-xl border border-border-light p-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-black text-text-primary">Detalle de Sesión</h2>
                  <p className="text-xs text-text-secondary">
                    Actualiza los datos y guarda antes de generar el acta
                  </p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    onClick={() => handleSave(sesiones)}
                    className="h-9 flex-1 rounded-lg border border-border-medium bg-surface-tertiary px-3 py-1.5 text-text-primary hover:bg-surface-hover sm:flex-none"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    <span className="text-xs font-semibold">Guardar</span>
                  </Button>
                  <Button
                    onClick={() => handleGenerateActa(selectedSesion)}
                    disabled={!!isGenerating}
                    className="h-9 flex-1 rounded-lg border-none bg-gradient-to-r from-teal-500 to-emerald-600 px-3 py-1.5 text-white shadow-md hover:from-teal-600 hover:to-emerald-700 sm:flex-none"
                  >
                    {isGenerating === selectedSesion.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wide">Emitir Acta</span>
                  </Button>
                  <Button
                    onClick={() => handleDeleteSesion(selectedSesion.id)}
                    className="h-9 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-red-600 hover:bg-red-100"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* FORM: BASIC INFO */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Tema a Tratar *
                  </label>
                  <input
                    type="text"
                    value={selectedSesion.tema}
                    onChange={(e) =>
                      handleUpdateSesion(selectedSesion.id, { tema: e.target.value })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-teal-500"
                    placeholder="Ej. Uso y Mantenimiento de EPIs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={selectedSesion.fecha}
                      onChange={(e) =>
                        handleUpdateSesion(selectedSesion.id, { fecha: e.target.value })
                      }
                      className="w-full rounded-xl border border-border-medium bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={selectedSesion.hora}
                      onChange={(e) =>
                        handleUpdateSesion(selectedSesion.id, { hora: e.target.value })
                      }
                      className="w-full rounded-xl border border-border-medium bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Responsable / Capacitador
                  </label>
                  <input
                    type="text"
                    value={selectedSesion.responsable}
                    onChange={(e) =>
                      handleUpdateSesion(selectedSesion.id, { responsable: e.target.value })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-teal-500"
                    placeholder="Nombre del facilitador"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Duración
                    </label>
                    <input
                      type="text"
                      value={selectedSesion.duracion}
                      onChange={(e) =>
                        handleUpdateSesion(selectedSesion.id, { duracion: e.target.value })
                      }
                      className="w-full rounded-xl border border-border-medium bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-teal-500"
                      placeholder="Ej. 2 horas"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Estado
                    </label>
                    <select
                      value={selectedSesion.estado}
                      onChange={(e) =>
                        handleUpdateSesion(selectedSesion.id, { estado: e.target.value as any })
                      }
                      className="w-full cursor-pointer appearance-none rounded-xl border border-border-medium bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Programada">Programada</option>
                      <option value="Completada">Completada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Objetivo / Descripción Breve
                  </label>
                  <textarea
                    rows={2}
                    value={selectedSesion.descripcion}
                    onChange={(e) =>
                      handleUpdateSesion(selectedSesion.id, { descripcion: e.target.value })
                    }
                    className="w-full resize-none rounded-xl border border-border-medium bg-surface-primary px-4 py-3 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-teal-500"
                    placeholder="Describe brevemente el alcance de la charla..."
                  />
                </div>
              </div>

              <hr className="my-2 border-border-light dark:border-white/5" />

              {/* FORM: WORKER ARRAY */}
              <div>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-black text-text-primary">
                      <Users className="h-5 w-5 text-teal-500" /> Asistencia y Personal
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      Marca las casillas de quienes asistieron. Esto habilitará la casilla de firma
                      en su reporte.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAddTrabajador(selectedSesion.id)}
                    size="sm"
                    className="h-8 rounded-lg border-border-medium bg-surface-primary px-3 text-xs font-bold text-text-primary shadow-sm hover:bg-surface-hover"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Agregar Persona
                  </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-border-light bg-surface-primary">
                  <div className="bg-surface-secondary/50 hidden gap-3 border-b border-border-light p-3 px-4 text-[10px] font-black uppercase tracking-widest text-text-secondary sm:grid sm:grid-cols-[1fr_1fr_1fr_80px_50px]">
                    <div>Nombre y Apellidos</div>
                    <div>Documento / CC</div>
                    <div>Cargo / Rol</div>
                    <div className="text-center">Asistió</div>
                    <div></div>
                  </div>

                  {selectedSesion.trabajadoresRegistrados.length === 0 ? (
                    <div className="p-8 text-center text-sm font-medium text-text-secondary">
                      No hay personal inscrito en esta actividad. Crea registros manualmente.
                    </div>
                  ) : (
                    <div className="divide-y divide-border-light">
                      {selectedSesion.trabajadoresRegistrados.map((worker, i) => (
                        <div
                          key={i}
                          className="dark:hover:bg-white-[0.02] flex flex-col gap-3 p-3 px-4 hover:bg-slate-50/50 sm:grid sm:grid-cols-[1fr_1fr_1fr_80px_50px] sm:items-center"
                        >
                          <input
                            type="text"
                            placeholder="Nombre completo"
                            value={worker.nombre}
                            onChange={(e) =>
                              handleUpdateTrabajador(selectedSesion.id, i, {
                                nombre: e.target.value,
                              })
                            }
                            className="placeholder:text-text-secondary/40 line-clamp-1 w-full border-none bg-transparent px-0 text-sm font-semibold text-text-primary focus:ring-0"
                          />
                          <input
                            type="text"
                            placeholder="102938475"
                            value={worker.cedula}
                            onChange={(e) =>
                              handleUpdateTrabajador(selectedSesion.id, i, {
                                cedula: e.target.value,
                              })
                            }
                            className="w-full border-none bg-transparent px-0 font-mono text-sm text-text-secondary focus:ring-0"
                          />
                          <input
                            type="text"
                            placeholder="Auxiliar"
                            value={worker.cargo}
                            onChange={(e) =>
                              handleUpdateTrabajador(selectedSesion.id, i, {
                                cargo: e.target.value,
                              })
                            }
                            className="w-full border-none bg-transparent px-0 text-sm text-text-secondary focus:ring-0"
                          />
                          <div className="flex items-center sm:justify-center">
                            <label className="flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={worker.asistio}
                                onChange={(e) =>
                                  handleUpdateTrabajador(selectedSesion.id, i, {
                                    asistio: e.target.checked,
                                  })
                                }
                                className="h-5 w-5 cursor-pointer rounded border-border-medium bg-surface-primary text-teal-600 transition-colors focus:border-transparent focus:ring-teal-500"
                              />
                              <span className="ml-2 text-sm font-bold sm:hidden">
                                Marcó asistencia
                              </span>
                            </label>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDeleteTrabajador(selectedSesion.id, i)}
                              className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGenerar = () => (
    <div className="bg-surface-secondary/20 flex min-h-[500px] w-full flex-col items-center justify-center rounded-2xl border border-border-light p-8 text-center">
      <BookOpen className="mb-6 h-20 w-20 text-teal-500 opacity-80" />
      <h2 className="mb-4 text-2xl font-black text-text-primary">Documento Formal del Programa</h2>
      <p className="mb-8 max-w-lg text-sm text-text-secondary">
        Genera el documento formal "Programa de Capacitación y Entrenamiento" en cumplimiento del
        Decreto 1072 de 2015 y la Resolución 0312 de 2019. El sistema consolidará la matriz por
        trabajador, el cronograma y estructurará el documento mediante Inteligencia Artificial.
      </p>
      <SGSSTToolbar onAnalyze={handleGeneratePrograma} isAnalyzing={isAnalyzing} />
    </div>
  );

  return (
    <div className="mx-auto flex min-h-[600px] w-full max-w-[1400px] flex-col pb-10">
      {renderTabs()}

      <div className="w-full">
        {activeTab === 'matriz' && renderMatriz()}
        {activeTab === 'cronograma' && renderCronograma()}
        {activeTab === 'generar' && renderGenerar()}
      </div>
    </div>
  );
}
