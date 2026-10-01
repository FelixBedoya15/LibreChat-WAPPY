import React, { useState, useRef, useCallback } from 'react';
import {
  Activity,
  Shield,
  Plus,
  Trash2,
  Save,
  Hammer,
  Clock,
  Users,
  Scale,
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

const SimulacrosEmergenciaWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim(),
  );

  const [simulacros, setSimulacros] = useState([
    {
      fecha: new Date().toISOString().split('T')[0],
      hipotesis: 'Sismo de magnitud 6.4 con evacuación total',
      tipo: 'Avisado',
      tiempoTotal: '3 min 20 seg',
      evacuados: '28',
      hallazgos: 'Evacuación ordenada hacia Punto de Encuentro Principal.',
    },
  ]);

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    setTimeout(() => {
      localStorage.setItem('wappy_simulacros_emergencia_draft', JSON.stringify(simulacros));
      setIsSavingLocal(false);
      showToast({
        message: 'Registro de Simulacros guardado localmente',
        status: 'success',
        severity: 'success',
      });
    }, 300);
  };

  const handleDummy = () => {
    setSimulacros([
      {
        fecha: new Date().toISOString().split('T')[0],
        hipotesis: 'Sismo estructural + Conato de incendio en cuarto eléctrico',
        tipo: 'Avisado (Simulacro Nacional)',
        tiempoTotal: '2 min 45 seg',
        evacuados: '45',
        hallazgos:
          'Alarma audible en todas las áreas. Se recomienda reforzar señalización luminiscente en escalera B.',
      },
    ]);
    showToast({
      message: 'Datos de prueba de Simulacro de Emergencia cargados',
      status: 'success',
      severity: 'success',
    });
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const rowsHtml = simulacros
        .map(
          (s, i) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${i + 1}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;">${s.fecha}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${s.hipotesis}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${s.tipo}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#0f766e;">${s.tiempoTotal}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${s.evacuados} personas</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${s.hallazgos}</td>
          </tr>`,
        )
        .join('');

      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            ACTA Y EVALUACIÓN DE SIMULACRO DE EMERGENCIA Y EVACUACIÓN
          </h2>
          <p>En cumplimiento del <strong>Decreto 1072 de 2015 (Art. 2.2.4.6.25 Numeral 10)</strong>, se documenta la planeación, cronometraje y evaluación del simulacro anual de respuesta ante emergencias.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#0f766e;color:#fff;">
                <th style="padding:10px;text-align:left;">#</th>
                <th style="padding:10px;text-align:left;">Fecha</th>
                <th style="padding:10px;text-align:left;">Hipótesis / Escenario</th>
                <th style="padding:10px;text-align:left;">Modalidad</th>
                <th style="padding:10px;text-align:left;">Tiempo Total</th>
                <th style="padding:10px;text-align:left;">Evacuados</th>
                <th style="padding:10px;text-align:left;">Hallazgos y Mejoras</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      `;
      setGeneratedReport(html);
      editorContentRef.current = html;
      liveEditorRef.current?.setHTML(html);
      showToast({
        message: 'Acta de Evaluación de Simulacro generada en el Live Editor',
        status: 'success',
        severity: 'success',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [simulacros, showToast]);

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
          showToast({ message: 'Acta de Simulacro actualizada', status: 'success', severity: 'success' });
        }
        return;
      }
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content,
          title: `Acta Simulacro de Emergencia – ${new Date().toLocaleDateString('es-CO')}`,
          tags: ['sgsst-simulacros-emergencia'],
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setConversationId(d.conversationId);
        setReportMessageId(d.messageId);
        setRefreshTrigger((p) => p + 1);
        showToast({ message: 'Acta de Simulacro guardada exitosamente', status: 'success', severity: 'success' });
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
          showToast({ message: 'Acta cargada', status: 'success', severity: 'success' });
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
    tags: ['sgsst-simulacros-emergencia'],
    generatedReport,
    handleSelectReport,
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER DE CONTROL DE SIMULACROS (ESTILO WAPPY) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-500 text-white shadow-lg shadow-teal-500/20">
              <Activity className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Gestión y Evaluación de Simulacros de Emergencia
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${simulacros.length} Simulacros Registrados`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                      {simulacros.length}
                    </span>
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {simulacros.length} Simulacros Registrados
                    </span>
                  </div>
                </div>

                <div
                  title="Decreto 1072 Art. 2.2.4.6.25 Num. 10 (Mínimo 1 anual)"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Dec. 1072 Art. 2.2.4.6.25 Num. 10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={() =>
                setSimulacros([
                  ...simulacros,
                  {
                    fecha: new Date().toISOString().split('T')[0],
                    hipotesis: '',
                    tipo: 'Avisado',
                    tiempoTotal: '',
                    evacuados: '',
                    hallazgos: '',
                  },
                ])
              }
              icon={Plus}
              label="Nuevo Simulacro"
              variant="teal"
            />
            <ExpandingButton
              onClick={handleSaveLocal}
              icon={Save}
              label="Guardar Simulacros"
              variant="outline-teal"
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
        exportFileName={`Acta_Simulacro_Emergencia_${new Date().getTime()}`}
        onDummy={handleDummy}
      />

      {isHistoryOpen && (
        <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
          <ReportHistory
            onSelectReport={handleSelectReport}
            isOpen={isHistoryOpen}
            toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
            refreshTrigger={refreshTrigger}
            tags={['sgsst-simulacros-emergencia']}
          />
        </div>
      )}

      {/* ─── FORMULARIO DE SIMULACROS ─── */}
      <div className="rounded-3xl border border-border-medium bg-surface-primary p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-light pb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-text-primary">
            Bitácora de Simulacros de Evacuación y Tiempos de Respuesta
          </h3>
        </div>

        <div className="space-y-3">
          {simulacros.map((s, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-surface-secondary/40 border border-border-light"
            >
              <input
                type="date"
                value={s.fecha}
                onChange={(e) => {
                  const n = [...simulacros];
                  n[idx].fecha = e.target.value;
                  setSimulacros(n);
                }}
                className="md:col-span-2 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <input
                type="text"
                value={s.hipotesis}
                onChange={(e) => {
                  const n = [...simulacros];
                  n[idx].hipotesis = e.target.value;
                  setSimulacros(n);
                }}
                placeholder="Hipótesis / Amenaza simulada"
                className="md:col-span-3 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <input
                type="text"
                value={s.tiempoTotal}
                onChange={(e) => {
                  const n = [...simulacros];
                  n[idx].tiempoTotal = e.target.value;
                  setSimulacros(n);
                }}
                placeholder="Tiempo (Ej: 3 min 10 s)"
                className="md:col-span-2 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <input
                type="text"
                value={s.evacuados}
                onChange={(e) => {
                  const n = [...simulacros];
                  n[idx].evacuados = e.target.value;
                  setSimulacros(n);
                }}
                placeholder="N° Evacuados"
                className="md:col-span-2 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <div className="md:col-span-3 flex items-center gap-2">
                <input
                  type="text"
                  value={s.hallazgos}
                  onChange={(e) => {
                    const n = [...simulacros];
                    n[idx].hallazgos = e.target.value;
                    setSimulacros(n);
                  }}
                  placeholder="Hallazgos / Oportunidades de mejora"
                  className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => setSimulacros(simulacros.filter((_, i) => i !== idx))}
                  disabled={simulacros.length === 1}
                  className="group flex h-8 min-w-[32px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 px-2 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[70px] group-hover:opacity-100 sm:flex">
                    <span className="text-[10px] font-bold">Quitar</span>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── LIVE EDITOR DE SIMULACROS ─── */}
      <CollapsibleReportBox
        onSave={handleSaveReport}
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        title="Acta e Informe de Evaluación de Simulacro de Emergencia"
        icon={<Activity className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Acta_Simulacro_Emergencia"
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
            reportSourceData={simulacros}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default SimulacrosEmergenciaWorkspace;
