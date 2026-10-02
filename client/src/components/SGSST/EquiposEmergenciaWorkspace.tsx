import React, { useState, useRef, useCallback } from 'react';
import {
  Wrench,
  Shield,
  Plus,
  Trash2,
  Save,
  Hammer,
  Flame,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import UniversalColumnMapperModal from './UniversalColumnMapperModal';
import { EQUIPOS_EMERGENCIA_FIELDS } from './moduleFieldDefinitions';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExpandingButton from './ExpandingButton';
import { useAutoLoadReport } from './useAutoLoadReport';

const EquiposEmergenciaWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement ||
      (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim(),
  );

  const [equipos, setEquipos] = useState([
    {
      categoria: 'Extintor Multipropósito ABC',
      capacidad: '10 lbs',
      ubicacion: 'Pasillo Principal Piso 1',
      vencimiento: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estado: 'Operativo',
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

  // Homologador Visual de Casillas (Paralelo de Excel)
  const [isColumnMapperOpen, setIsColumnMapperOpen] = useState(false);
  const [columnMapperBuffer, setColumnMapperBuffer] = useState<ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (eEvent) => {
      const buffer = eEvent.target?.result as ArrayBuffer;
      if (buffer) {
        setColumnMapperBuffer(buffer);
        setIsColumnMapperOpen(true);
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmColumnMapping = (mappedRows: any[]) => {
    if (!mappedRows || mappedRows.length === 0) {
      showToast({ message: 'No se encontraron filas con datos para importar.', status: 'warning' });
      return;
    }
    const newEquipos = mappedRows.map((r) => ({
      categoria: String(r.categoria || 'Extintor Multipropósito ABC').trim(),
      capacidad: String(r.capacidad || '10 lbs').trim(),
      ubicacion: String(r.ubicacion || 'Instalaciones Principales').trim(),
      vencimiento: r.vencimiento ? String(r.vencimiento).trim() : new Date().toISOString().split('T')[0],
      estado: String(r.estado || 'Operativo').trim(),
    }));
    setEquipos((prev) => [...prev, ...newEquipos]);
    setIsColumnMapperOpen(false);
    setColumnMapperBuffer(null);
    showToast({
      message: `¡${newEquipos.length} equipos de emergencia importados exitosamente con el Paralelo de Casillas!`,
      status: 'success',
      severity: 'success',
    });
  };

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    setTimeout(() => {
      localStorage.setItem('wappy_equipos_emergencia_draft', JSON.stringify(equipos));
      setIsSavingLocal(false);
      showToast({
        message: 'Inventario de equipos de emergencia guardado localmente',
        status: 'success',
        severity: 'success',
      });
    }, 300);
  };

  const handleDummy = () => {
    setEquipos([
      {
        categoria: 'Extintor Multipropósito ABC',
        capacidad: '10 lbs',
        ubicacion: 'Recepción y Acceso Principal',
        vencimiento: '2027-03-15',
        estado: 'Operativo',
      },
      {
        categoria: 'Extintor Solkaflam / Agente Limpio',
        capacidad: '3700 gr',
        ubicacion: 'Cuarto de Servidores / Rack TI',
        vencimiento: '2027-02-10',
        estado: 'Operativo',
      },
      {
        categoria: 'Botiquín Tipo B (Pared)',
        capacidad: 'Dotación NTC 4198',
        ubicacion: 'Área Operativa Central',
        vencimiento: '2026-12-30',
        estado: 'Operativo',
      },
      {
        categoria: 'Camilla Rígida en Polietileno + Inmovilizador Cervical',
        capacidad: '180 kg',
        ubicacion: 'Punto de Primeros Auxilios Piso 1',
        vencimiento: '2028-01-01',
        estado: 'Operativo',
      },
    ]);
    showToast({
      message: 'Inventario de prueba de extintores, botiquines y camillas cargado',
      status: 'success',
      severity: 'success',
    });
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const rowsHtml = equipos
        .map(
          (eq, i) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${i + 1}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;">${eq.categoria}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${eq.capacidad}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${eq.ubicacion}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${eq.vencimiento}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;color:#16a34a;font-weight:bold;">${eq.estado}</td>
          </tr>`,
        )
        .join('');

      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            INFORME DE INVENTARIO E INSPECCIÓN DE EQUIPOS DE EMERGENCIA
          </h2>
          <p>Control técnico de extintores portátiles (NTC 2885), botiquines de primeros auxilios y equipos de inmovilización y transporte para el Plan de Emergencias.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#0f766e;color:#fff;">
                <th style="padding:10px;text-align:left;">#</th>
                <th style="padding:10px;text-align:left;">Equipo / Recurso</th>
                <th style="padding:10px;text-align:left;">Capacidad / Tipo</th>
                <th style="padding:10px;text-align:left;">Ubicación Física</th>
                <th style="padding:10px;text-align:left;">Próxima Recarga / Revisión</th>
                <th style="padding:10px;text-align:left;">Estado</th>
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
        message: 'Informe de Inspección de Equipos generado en el Live Editor',
        status: 'success',
        severity: 'success',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [equipos, showToast]);

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
          showToast({ message: 'Informe de Equipos actualizado', status: 'success', severity: 'success' });
        }
        return;
      }
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content,
          title: `Inspección Equipos Emergencia – ${new Date().toLocaleDateString('es-CO')}`,
          tags: ['sgsst-equipos-emergencia'],
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setConversationId(d.conversationId);
        setReportMessageId(d.messageId);
        setRefreshTrigger((p) => p + 1);
        showToast({ message: 'Informe de Equipos guardado exitosamente', status: 'success', severity: 'success' });
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
          showToast({ message: 'Informe cargado', status: 'success', severity: 'success' });
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
    tags: ['sgsst-equipos-emergencia'],
    generatedReport,
    handleSelectReport,
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER DE CONTROL DE EQUIPOS DE EMERGENCIA (ESTILO WAPPY) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white shadow-lg shadow-teal-500/20">
              <Wrench className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Inventario e Inspección de Equipos de Emergencia
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${equipos.length} Equipos en Inventario`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <div className="relative flex flex-shrink-0 items-center justify-center">
                    <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="absolute -right-2.5 -top-2 z-10 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-primary">
                      {equipos.length}
                    </span>
                  </div>
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {equipos.length} Recursos Registrados
                    </span>
                  </div>
                </div>

                <div
                  title="NTC 2885 (Extintores) • Botiquines • Camillas"
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
                >
                  <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      NTC 2885 • Botiquines • Camillas
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={() =>
                setEquipos([
                  ...equipos,
                  {
                    categoria: 'Extintor Multipropósito ABC',
                    capacidad: '10 lbs',
                    ubicacion: '',
                    vencimiento: new Date().toISOString().split('T')[0],
                    estado: 'Operativo',
                  },
                ])
              }
              icon={Plus}
              label="Añadir Equipo"
              variant="teal"
            />
            <ExpandingButton
              onClick={handleSaveLocal}
              icon={Save}
              label="Guardar Inventario"
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
        onImportExcel={() => fileInputRef.current?.click()}
        importExcelLabel="Importar Inventario"
        importExcelTitle="Homologar casillas y cargar inventario de equipos de emergencia desde Excel"
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Inspeccion_Equipos_Emergencia_${new Date().getTime()}`}
        onDummy={handleDummy}
      />

      {isHistoryOpen && (
        <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
          <ReportHistory
            onSelectReport={handleSelectReport}
            isOpen={isHistoryOpen}
            toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
            refreshTrigger={refreshTrigger}
            tags={['sgsst-equipos-emergencia']}
          />
        </div>
      )}

      {/* ─── TABLA DE EQUIPOS (EXTINTORES, BOTIQUINES, CAMILLAS) ─── */}
      <div className="rounded-3xl border border-border-medium bg-surface-primary p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-light pb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-text-primary">
            Listado de Extintores, Botiquines, Camillas y Sistemas de Alarma
          </h3>
        </div>

        <div className="space-y-3">
          {equipos.map((eq, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-surface-secondary/40 border border-border-light"
            >
              <select
                value={eq.categoria}
                onChange={(e) => {
                  const n = [...equipos];
                  n[idx].categoria = e.target.value;
                  setEquipos(n);
                }}
                className="md:col-span-3 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              >
                <option value="Extintor Multipropósito ABC">Extintor Multipropósito ABC</option>
                <option value="Extintor Solkaflam / Agente Limpio">Extintor Solkaflam / Limpio</option>
                <option value="Extintor CO2">Extintor CO2</option>
                <option value="Extintor Agua a Presión">Extintor Agua a Presión</option>
                <option value="Botiquín Primeros Auxilios">Botiquín Primeros Auxilios</option>
                <option value="Camilla Rígida + Inmovilizadores">Camilla Rígida + Inmovilizadores</option>
                <option value="Alarma / Sirena de Evacuación">Alarma / Sirena de Evacuación</option>
              </select>
              <input
                type="text"
                value={eq.capacidad}
                onChange={(e) => {
                  const n = [...equipos];
                  n[idx].capacidad = e.target.value;
                  setEquipos(n);
                }}
                placeholder="Capacidad / Tipo"
                className="md:col-span-2 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <input
                type="text"
                value={eq.ubicacion}
                onChange={(e) => {
                  const n = [...equipos];
                  n[idx].ubicacion = e.target.value;
                  setEquipos(n);
                }}
                placeholder="Ubicación Física"
                className="md:col-span-3 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <input
                type="date"
                value={eq.vencimiento}
                onChange={(e) => {
                  const n = [...equipos];
                  n[idx].vencimiento = e.target.value;
                  setEquipos(n);
                }}
                className="md:col-span-2 rounded-xl border border-border-medium px-3 py-2 text-xs bg-surface-primary text-text-primary"
              />
              <div className="md:col-span-2 flex items-center gap-2">
                <select
                  value={eq.estado}
                  onChange={(e) => {
                    const n = [...equipos];
                    n[idx].estado = e.target.value;
                    setEquipos(n);
                  }}
                  className="w-full rounded-xl border border-border-medium px-2.5 py-2 text-xs bg-surface-primary text-text-primary"
                >
                  <option value="Operativo">Operativo</option>
                  <option value="Por Recargar">Por Recargar</option>
                  <option value="En Mantenimiento">Mantenimiento</option>
                </select>
                <button
                  type="button"
                  onClick={() => setEquipos(equipos.filter((_, i) => i !== idx))}
                  disabled={equipos.length === 1}
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

      {/* ─── LIVE EDITOR DE EQUIPOS DE EMERGENCIA ─── */}
      <CollapsibleReportBox
        onSave={handleSaveReport}
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        title="Informe de Inventario e Inspección de Equipos de Emergencia"
        icon={<Wrench className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Inspeccion_Equipos_Emergencia"
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
            reportSourceData={equipos}
          />
        </div>
      </CollapsibleReportBox>

      {/* Input oculto para carga de Excel */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modal Homologador Universal de Casillas (Paralelo de Excel) */}
      <UniversalColumnMapperModal
        isOpen={isColumnMapperOpen}
        onClose={() => {
          setIsColumnMapperOpen(false);
          setColumnMapperBuffer(null);
        }}
        moduleKey="equipos-emergencia"
        moduleTitle="Inventario e Inspección de Equipos de Emergencia"
        targetFields={EQUIPOS_EMERGENCIA_FIELDS}
        fileData={columnMapperBuffer}
        onConfirmImport={handleConfirmColumnMapping}
      />
    </div>
  );
};

export default EquiposEmergenciaWorkspace;
