import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Save,
  ShieldCheck,
  Flame,
  HeartPulse,
  Megaphone,
  Award,
  Scale,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExpandingButton from './ExpandingButton';
import { useAutoLoadReport } from './useAutoLoadReport';

const BrigadaEmergenciasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim(),
  );

  const [brigadistas, setBrigadistas] = useState([
    { nombre: '', cedula: '', cargo: '', especialidad: 'Primeros Auxilios', rolSCI: 'Brigadista Operativo' },
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

  // Cargar nómina de brigadistas desde la base de datos o borrador local
  useEffect(() => {
    if (!token) return;
    fetch('/api/sgsst/brigada/brigadistas', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.brigadistas) && data.brigadistas.length > 0) {
          setBrigadistas(
            data.brigadistas.map((b: any) => ({
              nombre: b.nombre || '',
              cedula: b.cedula || '',
              cargo: b.cargo || '',
              especialidad: b.grupoEspecialidad || b.especialidad || 'Primeros Auxilios',
              rolSCI: b.rolSCI || 'Brigadista Operativo',
            }))
          );
        } else {
          const draft = localStorage.getItem('wappy_brigada_emergencias_draft');
          if (draft) {
            try {
              const parsed = JSON.parse(draft);
              if (Array.isArray(parsed) && parsed.length > 0) setBrigadistas(parsed);
            } catch (_) {}
          }
        }
      })
      .catch(() => {
        const draft = localStorage.getItem('wappy_brigada_emergencias_draft');
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            if (Array.isArray(parsed) && parsed.length > 0) setBrigadistas(parsed);
          } catch (_) {}
        }
      });
  }, [token]);

  const handleSaveLocal = async () => {
    setIsSavingLocal(true);
    localStorage.setItem('wappy_brigada_emergencias_draft', JSON.stringify(brigadistas));
    try {
      if (token) {
        await fetch('/api/sgsst/brigada/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ brigadistas }),
        });
      }
      showToast({
        message: 'Nómina de Brigada guardada y sincronizada exitosamente',
        status: 'success',
        severity: 'success',
      });
    } catch (_) {
      showToast({
        message: 'Conformación de Brigada guardada localmente',
        status: 'info',
        severity: 'info',
      });
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleDummy = () => {
    setBrigadistas([
      {
        nombre: 'Carlos Andrés Mejía',
        cedula: '1020458912',
        cargo: 'Jefe de Planta',
        especialidad: 'Comando de Incidentes (SCI)',
        rolSCI: 'Jefe de Brigada / Comandante del Incidente',
      },
      {
        nombre: 'Laura Valentina Gómez',
        cedula: '1032487120',
        cargo: 'Analista de Talento Humano',
        especialidad: 'Primeros Auxilios',
        rolSCI: 'Líder de Primeros Auxilios y MEDEVAC',
      },
      {
        nombre: 'Jorge Eliécer Pardo',
        cedula: '79845123',
        cargo: 'Técnico de Mantenimiento',
        especialidad: 'Prevención y Control de Incendios',
        rolSCI: 'Brigadista Contra Incendios',
      },
      {
        nombre: 'Diana Carolina Ríos',
        cedula: '52984120',
        cargo: 'Coordinadora Administrativa',
        especialidad: 'Evacuación y Rescate',
        rolSCI: 'Coordinadora de Evacuación Piso 1',
      },
    ]);
    showToast({
      message: 'Brigadistas de prueba cargados exitosamente',
      status: 'success',
      severity: 'success',
    });
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const rowsHtml = brigadistas
        .map(
          (b, i) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${i + 1}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;">${b.nombre || 'Por definir'}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${b.cedula || 'N/A'}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${b.cargo || 'N/A'}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${b.especialidad}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${b.rolSCI}</td>
          </tr>`,
        )
        .join('');

      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            ACTA DE CONFORMACIÓN DE LA BRIGADA DE EMERGENCIAS Y COMITÉ DE CRISIS (SCI)
          </h2>
          <p>En cumplimiento del <strong>Decreto 1072 de 2015 (Art. 2.2.4.6.25 Numeral 11)</strong> y la <strong>Resolución 0312 de 2019</strong>, se conforma y capacita la Brigada de Prevención, Preparación y Respuesta ante Emergencias.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#0f766e;color:#fff;">
                <th style="padding:10px;text-align:left;">#</th>
                <th style="padding:10px;text-align:left;">Nombre Completo</th>
                <th style="padding:10px;text-align:left;">Cédula</th>
                <th style="padding:10px;text-align:left;">Cargo</th>
                <th style="padding:10px;text-align:left;">Unidad / Especialidad</th>
                <th style="padding:10px;text-align:left;">Rol en SCI</th>
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
        message: 'Acta de Conformación de la Brigada generada en el Live Editor',
        status: 'success',
        severity: 'success',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [brigadistas, showToast]);

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
          showToast({ message: 'Acta de Brigada actualizada', status: 'success', severity: 'success' });
        }
        return;
      }
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content,
          title: `Acta Brigada de Emergencias – ${new Date().toLocaleDateString('es-CO')}`,
          tags: ['sgsst-brigada-emergencias'],
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setConversationId(d.conversationId);
        setReportMessageId(d.messageId);
        setRefreshTrigger((p) => p + 1);
        showToast({ message: 'Acta de Brigada guardada exitosamente', status: 'success', severity: 'success' });
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
    tags: ['sgsst-brigada-emergencias'],
    generatedReport,
    handleSelectReport,
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER DE CONTROL DE BRIGADA (ESTILO WAPPY) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/20">
              <Award className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Brigada de Emergencias & Sistema Comando de Incidentes (SCI)
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Hito 3 Activo
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${brigadistas.length} Brigadistas Registrados`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                      {brigadistas.length}
                    </span>
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {brigadistas.length} Brigadistas en Nómina
                    </span>
                  </div>
                </div>

                <div
                  title="Unidades: Primeros Auxilios, Contra Incendios, Evacuación"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      Incendios • Auxilios • Evacuación
                    </span>
                  </div>
                </div>

                {/* Res. 0312 Est. 5.1.2: CUMPLE */}
                <SGSSTLegalBadge
                  standardCode="5.1.2"
                  label="Res. 0312 Est. 5.1.2: CUMPLE"
                  tooltip="Res. 0312/2019 Estándar 5.1.2 — Conformación, Capacitación y Dotación de la Brigada de Emergencias (Dec. 1072/15 Art. 2.2.4.6.25)"
                  moduleName="Brigada de Emergencias"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={() =>
                setBrigadistas([
                  ...brigadistas,
                  {
                    nombre: '',
                    cedula: '',
                    cargo: '',
                    especialidad: 'Primeros Auxilios',
                    rolSCI: 'Brigadista Operativo',
                  },
                ])
              }
              icon={Plus}
              label="Añadir Brigadista"
              variant="teal"
            />
            <ExpandingButton
              onClick={handleSaveLocal}
              icon={Save}
              label="Guardar Brigada"
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
        exportFileName={`Acta_Brigada_Emergencias_${new Date().getTime()}`}
        onDummy={handleDummy}
      />

      {isHistoryOpen && (
        <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
          <ReportHistory
            onSelectReport={handleSelectReport}
            isOpen={isHistoryOpen}
            toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
            refreshTrigger={refreshTrigger}
            tags={['sgsst-brigada-emergencias']}
          />
        </div>
      )}

      {/* ─── TABLA DE INTEGRANTES DE LA BRIGADA ─── */}
      <div className="rounded-3xl border border-border-medium bg-surface-primary p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-light pb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-text-primary">
            Nómina de Brigadistas yCoordinadores de Evacuación
          </h3>
        </div>

        <div className="space-y-3">
          {brigadistas.map((b, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-surface-secondary/40 border border-border-light"
            >
              <input
                type="text"
                value={b.nombre}
                onChange={(e) => {
                  const n = [...brigadistas];
                  n[idx].nombre = e.target.value;
                  setBrigadistas(n);
                }}
                placeholder="Nombre del Brigadista"
                className="md:col-span-3 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <input
                type="text"
                value={b.cedula}
                onChange={(e) => {
                  const n = [...brigadistas];
                  n[idx].cedula = e.target.value;
                  setBrigadistas(n);
                }}
                placeholder="Cédula"
                className="md:col-span-2 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <input
                type="text"
                value={b.cargo}
                onChange={(e) => {
                  const n = [...brigadistas];
                  n[idx].cargo = e.target.value;
                  setBrigadistas(n);
                }}
                placeholder="Cargo en la empresa"
                className="md:col-span-2 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <select
                value={b.especialidad}
                onChange={(e) => {
                  const n = [...brigadistas];
                  n[idx].especialidad = e.target.value;
                  setBrigadistas(n);
                }}
                className="md:col-span-2 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              >
                <option value="Primeros Auxilios">Primeros Auxilios</option>
                <option value="Prevención y Control de Incendios">Control de Incendios</option>
                <option value="Evacuación y Rescate">Evacuación y Rescate</option>
                <option value="Comando de Incidentes (SCI)">Comando de Incidentes (SCI)</option>
              </select>
              <div className="md:col-span-3 flex items-center gap-2">
                <input
                  type="text"
                  value={b.rolSCI}
                  onChange={(e) => {
                    const n = [...brigadistas];
                    n[idx].rolSCI = e.target.value;
                    setBrigadistas(n);
                  }}
                  placeholder="Rol en Emergencias"
                  className="w-full rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => setBrigadistas(brigadistas.filter((_, i) => i !== idx))}
                  disabled={brigadistas.length === 1}
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

      {/* ─── LIVE EDITOR DEL ACTA DE BRIGADA ─── */}
      <CollapsibleReportBox
        onSave={handleSaveReport}
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        title="Acta de Conformación de la Brigada de Emergencias"
        icon={<Award className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Acta_Conformacion_Brigada"
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
            reportSourceData={brigadistas}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default BrigadaEmergenciasWorkspace;
