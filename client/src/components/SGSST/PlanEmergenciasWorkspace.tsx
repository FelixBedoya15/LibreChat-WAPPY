import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Flame,
  Shield,
  Users,
  Wrench,
  Calendar,
  Building2,
  PhoneCall,
  MapPin,
  Plus,
  Trash2,
  Save,
  Hammer,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExpandingButton from './ExpandingButton';
import { useAutoLoadReport } from './useAutoLoadReport';

const PlanEmergenciasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim(),
  );

  const [sedeData, setSedeData] = useState({
    nombreSede: 'Sede Principal',
    direccion: '',
    horarioOperacion: 'Lunes a Viernes 07:00 - 17:00',
    trabajadoresFijos: '15',
    contratistasFlotantes: '5',
    puntoEncuentroPrincipal: 'Parqueadero externo / Zona verde frontal',
    puntoEncuentroAlterno: 'Plazoleta contigua a portería',
    clinicaMedevac: 'Clínica / Hospital Nivel III más cercano',
    arlNombre: 'ARL SURA / Positiva / Colmena',
  });

  const [syncCounts, setSyncCounts] = useState({
    amenazas: 0,
    brigadistas: 0,
    equipos: 0,
    simulacros: 0,
  });

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchConnectedSummary = useCallback(async () => {
    if (!token) return;
    try {
      const resVuln = await fetch('/api/sgsst/analisis-vulnerabilidad/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resVuln.ok) {
        const d = await resVuln.json();
        setSyncCounts((prev) => ({
          ...prev,
          amenazas: Array.isArray(d.amenazasList) ? d.amenazasList.length : 0,
        }));
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchConnectedSummary();
  }, [fetchConnectedSummary]);

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    setTimeout(() => {
      localStorage.setItem('wappy_plan_emergencias_draft', JSON.stringify(sedeData));
      setIsSavingLocal(false);
      showToast({
        message: 'Parámetros del Plan de Emergencias guardados localmente',
        status: 'success',
        severity: 'success',
      });
    }, 300);
  };

  const handleDummy = () => {
    setSedeData({
      nombreSede: 'Planta Operativa y Sede Administrativa Central',
      direccion: 'Zona Industrial Sector Norte, Bodega 14',
      horarioOperacion: 'Lunes a Sábado 06:00 a 18:00',
      trabajadoresFijos: '42',
      contratistasFlotantes: '12',
      puntoEncuentroPrincipal: 'Bahía Exterior Norte (Frente a Portería 1)',
      puntoEncuentroAlterno: 'Parque Público Manzana B (A 80 metros)',
      clinicaMedevac: 'Clínica de Occidente / Hospital Universitario (10 min)',
      arlNombre: 'ARL SURA - Línea de Atención 018000 511414',
    });
    showToast({
      message: 'Datos de prueba cargados para Plan de Emergencias',
      status: 'success',
      severity: 'success',
    });
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            PLAN DE PREVENCIÓN, PREPARACIÓN Y RESPUESTA ANTE EMERGENCIAS (PPRE)
          </h2>
          <p><strong>Sede Evaluada:</strong> ${sedeData.nombreSede} &bull; <strong>Horario:</strong> ${sedeData.horarioOperacion}</p>
          <p><strong>Carga Ocupacional:</strong> ${sedeData.trabajadoresFijos} colaboradores fijos / ${sedeData.contratistasFlotantes} flotantes o visitantes.</p>
          <h3 style="color: #0f766e; margin-top: 24px;">1. Puntos de Encuentro y Rutas de Evacuación</h3>
          <ul>
            <li><strong>Punto de Encuentro Principal:</strong> ${sedeData.puntoEncuentroPrincipal}</li>
            <li><strong>Punto de Encuentro Alterno:</strong> ${sedeData.puntoEncuentroAlterno}</li>
          </ul>
          <h3 style="color: #0f766e; margin-top: 24px;">2. Plan de Evacuación Médica (MEDEVAC)</h3>
          <p><strong>Centro Asistencial de Referencia:</strong> ${sedeData.clinicaMedevac}</p>
          <p><strong>Contacto ARL:</strong> ${sedeData.arlNombre}</p>
          <h3 style="color: #0f766e; margin-top: 24px;">3. Procedimientos Operativos Normalizados (PON)</h3>
          <p>Documento base sincronizado con el Análisis de Vulnerabilidad (${syncCounts.amenazas} amenazas vinculadas), Brigada de Emergencias (Hito 3), Inventario de Equipos (Hito 5) y Simulacros (Hito 6).</p>
        </div>
      `;
      setGeneratedReport(html);
      editorContentRef.current = html;
      liveEditorRef.current?.setHTML(html);
      showToast({
        message: 'Borrador del Plan Maestro de Emergencias generado en el Live Editor',
        status: 'success',
        severity: 'success',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [sedeData, syncCounts.amenazas, showToast]);

  const handleSaveReport = useCallback(async () => {
    const content = editorContentRef.current || generatedReport;
    if (!content || !token) return;
    try {
      if (conversationId && conversationId !== 'new' && reportMessageId) {
        const res = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ conversationId, messageId: reportMessageId, content }),
        });
        if (res.ok) {
          setRefreshTrigger((p) => p + 1);
          showToast({ message: 'Plan de Emergencias actualizado', status: 'success', severity: 'success' });
        }
        return;
      }
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content,
          title: `Plan de Emergencias (PPRE) – ${new Date().toLocaleDateString('es-CO')}`,
          tags: ['sgsst-plan-emergencias'],
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setConversationId(d.conversationId);
        setReportMessageId(d.messageId);
        setRefreshTrigger((p) => p + 1);
        showToast({ message: 'Plan de Emergencias guardado exitosamente', status: 'success', severity: 'success' });
      }
    } catch (e: any) {
      showToast({ message: `Error: ${e.message}`, status: 'error' });
    }
  }, [generatedReport, conversationId, reportMessageId, token, showToast]);

  const handleSelectReport = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        const res = await fetch(`/api/messages/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const messages = await res.json();
        const last = messages[messages.length - 1];
        if (last?.text) {
          setGeneratedReport(last.text);
          editorContentRef.current = last.text;
          liveEditorRef.current?.setHTML(last.text);
          setConversationId(id);
          setReportMessageId(last.messageId);
          showToast({ message: 'Documento cargado', status: 'success', severity: 'success' });
        }
      } catch {
        showToast({ message: 'Error al cargar', status: 'error' });
      }
      setIsHistoryOpen(false);
    },
    [token, showToast],
  );

  useAutoLoadReport({
    token,
    tags: ['sgsst-plan-emergencias'],
    generatedReport,
    handleSelectReport,
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER DE CONSOLIDACIÓN MULTI-HITO (ESTILO MATRIZ IPEVR) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/20">
              <Shield className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Plan Maestro de Emergencias y Contingencias (PPRE)
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              {/* Badges Expansibles de Conexión con los Hitos 1, 3, 5 y 6 */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${syncCounts.amenazas} Amenazas de Hito 1`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                      {syncCounts.amenazas}
                    </span>
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Hito 1: {syncCounts.amenazas} Amenazas (Diamante)
                    </span>
                  </div>
                </div>

                <div
                  title="Hito 3: Brigada de Emergencias & SCI"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">Hito 3: Brigada & SCI</span>
                  </div>
                </div>

                <div
                  title="Hito 5: Inventario de Extintores, Botiquines y Camillas"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">Hito 5: Equipos y Extintores</span>
                  </div>
                </div>

                <div
                  title="Hito 6: Simulacros y Evacuación"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">Hito 6: Simulacros Anuales</span>
                  </div>
                </div>

                {/* Res. 0312 Est. 5.1.1: CUMPLE */}
                <div
                  title="Res. 0312/2019 Estándar 5.1.1 — Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE): CUMPLE"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 sm:px-2.5 shadow-sm outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Res. 0312 Est. 5.1.1: CUMPLE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={fetchConnectedSummary}
              icon={RefreshCw}
              label="Sincronizar Hitos"
              variant="outline-teal"
            />
            <ExpandingButton
              onClick={handleSaveLocal}
              icon={Save}
              label="Guardar Datos"
              variant="teal"
              isLoading={isSavingLocal}
            />
          </div>
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
        exportFileName={`Plan_Emergencias_PPRE_${new Date().getTime()}`}
        onDummy={handleDummy}
      />

      {isHistoryOpen && (
        <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
          <ReportHistory
            onSelectReport={handleSelectReport}
            isOpen={isHistoryOpen}
            toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
            refreshTrigger={refreshTrigger}
            tags={['sgsst-plan-emergencias']}
          />
        </div>
      )}

      {/* ─── PARÁMETROS BASE DE LA SEDE Y MEDEVAC ─── */}
      <div className="rounded-3xl border border-border-medium bg-surface-primary p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border-light pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-text-primary">
                Caracterización Locativa, Evacuación y MEDEVAC
              </h3>
              <p className="text-xs text-text-secondary">
                Datos estructurales que consolidan el documento maestro del Plan de Emergencias (Dec. 1072 Art. 2.2.4.6.25)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-text-secondary block mb-1">Nombre de la Sede / Centro de Trabajo</label>
            <input
              type="text"
              value={sedeData.nombreSede}
              onChange={(e) => setSedeData({ ...sedeData, nombreSede: e.target.value })}
              className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-secondary/40 text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-secondary block mb-1">Dirección y Georreferenciación</label>
            <input
              type="text"
              value={sedeData.direccion}
              onChange={(e) => setSedeData({ ...sedeData, direccion: e.target.value })}
              placeholder="Ej: Calle 100 # 15-20"
              className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-secondary/40 text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-secondary block mb-1">Horario de Operación / Turnos</label>
            <input
              type="text"
              value={sedeData.horarioOperacion}
              onChange={(e) => setSedeData({ ...sedeData, horarioOperacion: e.target.value })}
              className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-secondary/40 text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-secondary block mb-1">Punto de Encuentro Principal</label>
            <input
              type="text"
              value={sedeData.puntoEncuentroPrincipal}
              onChange={(e) => setSedeData({ ...sedeData, puntoEncuentroPrincipal: e.target.value })}
              className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-secondary/40 text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-secondary block mb-1">Punto de Encuentro Alterno</label>
            <input
              type="text"
              value={sedeData.puntoEncuentroAlterno}
              onChange={(e) => setSedeData({ ...sedeData, puntoEncuentroAlterno: e.target.value })}
              className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-secondary/40 text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-secondary block mb-1">Centro Médico de Referencia (MEDEVAC)</label>
            <input
              type="text"
              value={sedeData.clinicaMedevac}
              onChange={(e) => setSedeData({ ...sedeData, clinicaMedevac: e.target.value })}
              className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-secondary/40 text-text-primary"
            />
          </div>
        </div>
      </div>

      {/* ─── LIVE EDITOR DEL PLAN DE EMERGENCIAS ─── */}
      <CollapsibleReportBox
        onSave={handleSaveReport}
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        title="Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)"
        icon={<Shield className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Plan_Maestro_Emergencias_PPRE"
            reportType="general"
          />
        }
      >
        <div className="w-full min-w-0">
          <LiveEditor
            ref={liveEditorRef}
            paperMode={true}
            initialContent={generatedReport}
            onUpdate={(html) => {
              editorContentRef.current = html;
            }}
            reportSourceData={sedeData}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default PlanEmergenciasWorkspace;
