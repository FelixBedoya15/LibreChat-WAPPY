import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { 
  Shield, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Plus, 
  FileText, 
  Search, 
  FileSignature, 
  Printer, 
  Wrench, 
  ClipboardList, 
  FileSpreadsheet, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  X, 
  ShieldAlert, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '~/utils';
import { SignaturePad } from './SignaturePad';
import { exportHeightsToExcel } from './exportHeights';
import { saveAs } from 'file-saver';
import { SGSSTToolbar, ToolbarButton } from './SGSSTToolbar';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExportDropdown from './ExportDropdown';
import { UpgradeWall } from './UpgradeWall';

interface EquipoAlturas {
  id: string;
  nombre: string;
  marca: string;
  referencia: string;
  serial: string;
  fechaFabricacion: string;
  fechaCompra: string;
  fechaUltimaInspeccion: string;
  fechaProximaInspeccion: string;
  inspeccionadoPor: string;
  resultadoInspeccion: 'Aprobado' | 'Rechazado' | 'N/A';
  estado: 'Vigente' | 'Vencido' | 'Requiere Inspección' | 'Retirado';
  firmaTrabajador?: string;
  observaciones?: string;
}

interface WorkerHeightsDoc {
  workerId: string;
  nombreTrabajador: string;
  cargo: string;
  equipos: EquipoAlturas[];
}

interface SocioWorker {
  id: string;
  nombre: string;
  identificacion: string;
  cargo: string;
  firmaDigital?: string;
}

function getDaysUntil(dateStr?: string): { days: number | null; status: 'ok' | 'warning' | 'expired' | 'none'; text: string } {
  if (!dateStr) return { days: null, status: 'none', text: 'No registrado' };
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
    if (isNaN(target.getTime())) return { days: null, status: 'none', text: dateStr };
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { days: diffDays, status: 'expired', text: `Vencido hace ${Math.abs(diffDays)}d` };
    }
    if (diffDays <= 30) {
      return { days: diffDays, status: 'warning', text: `Vence en ${diffDays}d` };
    }
    return { days: diffDays, status: 'ok', text: `${diffDays}d vigentes` };
  } catch (e) {
    return { days: null, status: 'none', text: dateStr };
  }
}

export default function HeightsWorkspace() {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [workers, setWorkers] = useState<SocioWorker[]>([]);
  const [heightsDocs, setHeightsDocs] = useState<WorkerHeightsDoc[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<SocioWorker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Collapsible states
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  // AI Report States
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.7-flash');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const editorContentRef = useRef<string | null>(null);

  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || Boolean(user?.isSubUser);
  const selectedDoc = heightsDocs.find(d => d.workerId === selectedWorker?.id);

  const handleGenerate = useCallback(async () => {
    if (!selectedWorker) {
      showToast({ message: 'Seleccione un trabajador primero', status: 'warning' });
      return;
    }
    const isNew = !conversationId || conversationId === 'new';
    if (!isPro && isNew) {
      try {
        const resCount = await fetch(`/api/sgsst/diagnostico/report-history?tags=sgsst-heights`, { headers: { Authorization: `Bearer ${token}` } });
        if (resCount.ok) {
          const data = await resCount.json();
          if (data.conversations?.length >= 1) {
            setShowUpgradeModal(true);
            return;
          }
        }
      } catch (e) {}
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/sgsst/heights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          workerId: selectedWorker.id, 
          nombreTrabajador: selectedWorker.nombre, 
          cargo: selectedWorker.cargo, 
          equipos: selectedDoc?.equipos || [], 
          modelName: selectedModel 
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al generar el informe');
      }
      const data = await response.json();
      setGeneratedReport(data.report);
      editorContentRef.current = data.report;
      liveEditorRef.current?.setHTML(data.report);
      setConversationId(null);
      setReportMessageId(null);
      showToast({ message: 'Informe generado exitosamente', status: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Error al generar informe', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedWorker, selectedDoc, selectedModel, token, isPro, conversationId, showToast]);

  const handleSave = useCallback(async () => {
    const contentToSave = editorContentRef.current || generatedReport;
    if (!contentToSave || !token) return;

    const isNew = !conversationId || conversationId === 'new';
    if (!isPro && isNew) {
      try {
        const resCount = await fetch(`/api/sgsst/diagnostico/report-history?tags=sgsst-heights`, { headers: { Authorization: `Bearer ${token}` } });
        if (resCount.ok) {
          const data = await resCount.json();
          if (data.conversations?.length >= 1) {
            setShowUpgradeModal(true);
            return;
          }
        }
      } catch (e) {}
    }

    try {
      if (conversationId && conversationId !== 'new' && reportMessageId) {
        const res = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ conversationId, messageId: reportMessageId, content: contentToSave }),
        });
        if (res.ok) { 
          setRefreshTrigger(p => p + 1); 
          showToast({ message: 'Informe actualizado exitosamente', status: 'success' }); 
        }
        return;
      }
      const res = await fetch('/api/sgsst/diagnostico/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          content: contentToSave,
          title: `Informe Alturas - ${selectedWorker?.nombre} - ${new Date().toLocaleDateString('es-CO')}`,
          tags: ['sgsst-heights'],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversationId);
        setReportMessageId(data.messageId);
        setRefreshTrigger(p => p + 1);
        showToast({ message: 'Guardado exitosamente', status: 'success' });
      }
    } catch (error: any) {
      showToast({ message: `Error: ${error.message}`, status: 'error' });
    }
  }, [generatedReport, conversationId, reportMessageId, token, isPro, selectedWorker, showToast]);

  const handleSelectReport = useCallback(async (selectedConvoId: string) => {
    if (!selectedConvoId) return;
    try {
      const res = await fetch(`/api/messages/${selectedConvoId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const messages = await res.json();
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.text) {
        setGeneratedReport(lastMsg.text);
        editorContentRef.current = lastMsg.text;
        liveEditorRef.current?.setHTML(lastMsg.text);
        setConversationId(selectedConvoId);
        setReportMessageId(lastMsg.messageId);
        showToast({ message: 'Informe cargado correctamente', status: 'success' });
      }
    } catch (e) {
      showToast({ message: 'Error al cargar el informe', status: 'error' });
    }
    setIsHistoryOpen(false);
  }, [token, showToast]);

  // Form states
  const [formNombre, setFormNombre] = useState('Arnés de cuerpo entero (4 argollas)');
  const [formMarca, setFormMarca] = useState('');
  const [formReferencia, setFormReferencia] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formFechaFabricacion, setFormFechaFabricacion] = useState('');
  const [formFechaCompra, setFormFechaCompra] = useState('');
  const [formFechaUltimaInspeccion, setFormFechaUltimaInspeccion] = useState('');
  const [formFechaProximaInspeccion, setFormFechaProximaInspeccion] = useState('');
  const [formInspeccionadoPor, setFormInspeccionadoPor] = useState('');
  const [formResultado, setFormResultado] = useState<'Aprobado' | 'Rechazado' | 'N/A'>('N/A');
  const [formEstado, setFormEstado] = useState<'Vigente' | 'Vencido' | 'Requiere Inspección' | 'Retirado'>('Vigente');
  const [formSignature, setFormSignature] = useState<string | null>(null);
  const [formObservaciones, setFormObservaciones] = useState('');

  // Fetch data
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const wRes = await fetch('/api/sgsst/perfil-sociodemografico/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const wData = await wRes.json();
      setWorkers(Array.isArray(wData?.trabajadores) ? wData.trabajadores : []);

      const hRes = await fetch('/api/sgsst/heights/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const hData = await hRes.json();
      setHeightsDocs(Array.isArray(hData) ? hData : []);
    } catch (err) {
      console.error(err);
      showToast({ message: 'Error al cargar hojas de vida de alturas', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const resetForm = () => {
    setFormNombre('Arnés de cuerpo entero (4 argollas)');
    setFormMarca('');
    setFormReferencia('');
    setFormSerial('');
    setFormFechaFabricacion('');
    setFormFechaCompra('');
    setFormFechaUltimaInspeccion('');
    setFormFechaProximaInspeccion('');
    setFormInspeccionadoPor('');
    setFormResultado('N/A');
    setFormEstado('Vigente');
    setFormSignature(null);
    setFormObservaciones('');
  };

  const handleLastInspectionChange = (dateVal: string) => {
    setFormFechaUltimaInspeccion(dateVal);
    if (dateVal) {
      const d = new Date(dateVal + 'T12:00:00');
      d.setFullYear(d.getFullYear() + 1); // Vence en 1 año
      setFormFechaProximaInspeccion(d.toISOString().substring(0, 10));
    }
  };

  // Guardar Equipo
  const handleSaveEquipment = async () => {
    if (!selectedWorker) return;
    if (!formSerial || !formMarca) {
      showToast({ message: 'Marca y Serial son obligatorios', status: 'warning' });
      return;
    }

    setLoading(true);

    const newEquip: EquipoAlturas = {
      id: crypto.randomUUID(),
      nombre: formNombre,
      marca: formMarca,
      referencia: formReferencia,
      serial: formSerial,
      fechaFabricacion: formFechaFabricacion,
      fechaCompra: formFechaCompra,
      fechaUltimaInspeccion: formFechaUltimaInspeccion,
      fechaProximaInspeccion: formFormularyProximaInspeccion(),
      inspeccionadoPor: formInspeccionadoPor,
      resultadoInspeccion: formResultado,
      estado: formEstado,
      firmaTrabajador: formSignature || selectedWorker.firmaDigital,
      observaciones: formObservaciones
    };

    const currentEquipos = selectedDoc ? selectedDoc.equipos : [];
    const updatedEquipos = [...currentEquipos, newEquip];

    const payload = {
      workerId: selectedWorker.id,
      nombreTrabajador: selectedWorker.nombre,
      cargo: selectedWorker.cargo || '',
      equipos: updatedEquipos
    };

    try {
      const res = await fetch('/api/sgsst/heights/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast({ message: 'Equipo de alturas guardado correctamente', status: 'success' });
        // Recargar localmente
        const docExists = heightsDocs.some(d => d.workerId === selectedWorker.id);
        if (docExists) {
          setHeightsDocs(heightsDocs.map(d => d.workerId === selectedWorker.id ? data.data : d));
        } else {
          setHeightsDocs([...heightsDocs, data.data]);
        }
        setIsModalOpen(false);
        resetForm();
      } else {
        showToast({ message: data.error || 'Error al guardar equipo', status: 'error' });
      }
    } catch (err) {
      console.error(err);
      showToast({ message: 'Error de servidor al guardar equipo', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  function formFormularyProximaInspeccion() {
    if (formFechaProximaInspeccion) return formFechaProximaInspeccion;
    if (formFechaUltimaInspeccion) {
      const d = new Date(formFechaUltimaInspeccion + 'T12:00:00');
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().substring(0, 10);
    }
    return '';
  };

  const handleExportExcel = async () => {
    try {
      showToast({ message: 'Generando reporte de Excel...', status: 'info' });
      await exportHeightsToExcel(heightsDocs);
      showToast({ message: 'Reporte Excel generado correctamente', status: 'success' });
    } catch (err) {
      console.error(err);
      showToast({ message: 'Error al exportar a Excel', status: 'error' });
    }
  };

  const buildHtmlFicha = (worker: SocioWorker, doc: WorkerHeightsDoc) => {
    let tableRows = '';
    doc.equipos.forEach(eq => {
      tableRows += `
        <tr>
          <td>${eq.nombre}</td>
          <td>${eq.marca}</td>
          <td>${eq.referencia || 'N/A'}</td>
          <td>${eq.serial}</td>
          <td>${eq.fechaProximaInspeccion || 'N/A'}</td>
          <td>${eq.estado}</td>
          <td style="text-align:center;">
            ${eq.firmaTrabajador ? `<img src="${eq.firmaTrabajador}" style="max-height: 40px; max-width: 100px;" />` : '<span style="color:#ef4444; font-size:10px;">Firma Faltante</span>'}
          </td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hoja de Vida de Alturas — ${worker.nombre}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 40px; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0f766e; text-align: right; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 10px; }
          .meta-label { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #64748b; margin-bottom: 2px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #0f766e; color: white; padding: 8px 12px; font-size: 11px; text-transform: uppercase; text-align: left; }
          .table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
          .signature-box { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; }
          .signature-img { max-height: 60px; max-width: 200px; display: block; margin: 0 auto 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Hoja de Vida de Equipos Contra Caídas<br><span style="font-size:11px; font-weight:normal; color:#64748b;">SG-SST Resolución 4272 de 2021</span></div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><div class="meta-label">Trabajador</div><strong>${worker.nombre}</strong></div>
          <div class="meta-item"><div class="meta-label">Identificación</div><strong>${worker.identificacion}</strong></div>
          <div class="meta-item"><div class="meta-label">Cargo</div><strong>${worker.cargo || 'Sin cargo'}</strong></div>
          <div class="meta-item"><div class="meta-label">Fecha Emisión</div><strong>${new Date().toLocaleDateString('es-CO')}</strong></div>
        </div>

        <h3 style="color:#0f766e; border-bottom:1px solid #e2e8f0; padding-bottom:5px; margin-bottom:15px; text-transform:uppercase; font-size:14px;">Equipos de Alturas Asignados</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Marca</th>
              <th>Referencia</th>
              <th>Serial</th>
              <th>Próxima Inspección</th>
              <th>Estado</th>
              <th style="text-align:center;">Firma Recibido</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="signatures">
          <div class="signature-box">
            ${worker.firmaDigital ? `<img class="signature-img" src="${worker.firmaDigital}" />` : '<div style="height:60px;"></div>'}
            <strong>${worker.nombre}</strong><br>Trabajador / Recibí Conforme
          </div>
          <div class="signature-box">
            <div style="height:60px;"></div>
            <strong>Responsable de Alturas (Coordinador)</strong><br>Entregado / Certificado
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintFicha = () => {
    if (!selectedWorker || !selectedDoc) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = buildHtmlFicha(selectedWorker, selectedDoc);
    html = html.replace('</body>', `
      <script>
        window.onload = function() { window.focus(); window.print(); }
      </script>
      </body>
    `);

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadFichaHtml = () => {
    if (!selectedWorker || !selectedDoc) return;
    const html = buildHtmlFicha(selectedWorker, selectedDoc);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `Ficha_Vida_Alturas_${selectedWorker.nombre.replace(/\s+/g, '_')}.html`);
  };

  // KPIs de Equipos de Alturas
  const totalEquipos = useMemo(() => {
    return heightsDocs.reduce((acc, d) => acc + (d.equipos?.length || 0), 0);
  }, [heightsDocs]);

  const expiredEquipos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    heightsDocs.forEach(d => {
      (d.equipos || []).forEach(eq => {
        if (eq.estado === 'Vencido' || eq.estado === 'Retirado') count++;
        else if (eq.fechaProximaInspeccion) {
          const prox = new Date(eq.fechaProximaInspeccion + 'T12:00:00');
          if (prox < today) count++;
        }
      });
    });
    return count;
  }, [heightsDocs]);

  const activeEquipos = useMemo(() => {
    return Math.max(0, totalEquipos - expiredEquipos);
  }, [totalEquipos, expiredEquipos]);

  const equipmentWithAlerts = useMemo(() => {
    const list: Array<{ worker: SocioWorker; equipo: EquipoAlturas; daysInfo: ReturnType<typeof getDaysUntil> }> = [];
    heightsDocs.forEach(d => {
      const worker = workers.find(w => w.id === d.workerId);
      if (!worker) return;
      (d.equipos || []).forEach(eq => {
        const daysInfo = getDaysUntil(eq.fechaProximaInspeccion);
        if (eq.estado === 'Vencido' || eq.estado === 'Retirado' || daysInfo.status === 'expired' || daysInfo.status === 'warning') {
          list.push({ worker, equipo: eq, daysInfo });
        }
      });
    });
    return list;
  }, [heightsDocs, workers]);

  const filteredWorkers = workers.filter(w => 
    (w.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.identificacion || '').includes(searchQuery)
  );

  return (
    <div className="w-full space-y-6">
      
      {/* ─── TOOLBAR SUPERIOR ESTÁNDAR SGSST CON BOTONES EXPANDIBLES ──────── */}
      <SGSSTToolbar
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        historyButtons={[
          {
            id: 'tb-tab-alturas',
            onClick: () => {},
            label: `Equipos de Alturas (${totalEquipos})`,
            icon: Shield,
            title: 'Ver Equipos Contra Caídas Asignados',
            variant: 'history',
            active: true,
            badge: totalEquipos > 0 ? totalEquipos : undefined,
          },
        ]}
        customSections={[
          <div key="heights-custom-toolbar" className="flex items-center gap-1.5">
            {selectedWorker && (
              <ToolbarButton
                id="tb-new-equipment"
                onClick={() => setIsModalOpen(true)}
                label="Registrar Equipo"
                icon={Plus}
                title={`Registrar nuevo equipo de alturas para ${selectedWorker.nombre}`}
                variant="ai"
              />
            )}
            <ToolbarButton
              id="tb-export-excel-heights"
              onClick={handleExportExcel}
              label="Exportar Excel"
              icon={FileSpreadsheet}
              title="Descargar registro de equipos de alturas en Excel"
              variant="excel"
            />
          </div>
        ]}
        onAnalyze={handleGenerate}
        isAnalyzing={isGenerating}
        exportContent={selectedWorker && selectedDoc && selectedDoc.equipos && selectedDoc.equipos.length > 0 ? buildHtmlFicha(selectedWorker, selectedDoc) : ''}
        exportFileName={selectedWorker ? `Ficha_Vida_Alturas_${selectedWorker.nombre.replace(/\s+/g, '_')}` : 'Registro_Alturas'}
        onExportExcel={handleExportExcel}
      />

      {/* ─── ENCABEZADO DE SECCIÓN ACTIVA (WAPPY DESIGN SYSTEM) ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light dark:border-white/10 pb-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Hoja de Vida y Trazabilidad de Equipos Contra Caídas (Alturas)</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Gestión y control anual de inspección de arneses, eslingas, conectores y líneas de vida (Resolución 4272 de 2021).
          </p>
        </div>
      </div>

      {/* 4 Métricas Clave / KPIs (Alturas) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: Colaboradores Autorizados */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-surface-primary border border-border-medium shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <User className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Colaboradores</p>
            <p className="text-sm font-black text-text-primary">{workers.length} <span className="text-[10px] font-semibold text-text-secondary">personal</span></p>
          </div>
        </div>

        {/* KPI 2: Total Equipos */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-surface-primary border border-border-medium shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Equipos Asignados</p>
            <p className="text-sm font-black text-text-primary">{totalEquipos} <span className="text-[10px] font-semibold text-text-secondary">elementos</span></p>
          </div>
        </div>

        {/* KPI 3: Equipos Operativos / Vigentes */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-surface-primary border border-border-medium shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Inspección Vigente</p>
            <p className="text-sm font-black text-emerald-500">{activeEquipos} <span className="text-[10px] font-semibold text-text-secondary">aptos</span></p>
          </div>
        </div>

        {/* KPI 4: Vencidos / Alertas */}
        <div className={cn(
          "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border shadow-2xs transition-colors",
          expiredEquipos > 0 ? "bg-red-500/5 border-red-500/30" : "bg-surface-primary border-border-medium"
        )}>
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            expiredEquipos > 0 ? "bg-red-500/15 text-red-500" : "bg-slate-500/10 text-text-tertiary"
          )}>
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Vencidos / Alerta</p>
            <p className={cn("text-sm font-black", expiredEquipos > 0 ? "text-red-500" : "text-text-secondary")}>
              {expiredEquipos} <span className="text-[10px] font-semibold text-text-secondary">inspecciones</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[780px] w-full border border-border-light dark:border-white/10 rounded-3xl bg-surface-primary shadow-lg overflow-hidden animate-in fade-in duration-200">
      
      {/* SECTOR IZQUIERDO: LISTA TRABAJADORES */}
      <div className={cn("w-full md:w-80 lg:w-96 border-r border-border-light dark:border-white/10 flex flex-col bg-surface-secondary/40 shrink-0 h-full", selectedWorker && "hidden md:flex")}>
        <div className="p-4 md:p-5 border-b border-border-light dark:border-white/10 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-500" /> Trabajadores (Alturas)
            </h2>
            <div className="flex items-center gap-1.5">
              <ToolbarButton
                id="heights-list-excel"
                onClick={handleExportExcel}
                label="Excel"
                icon={FileSpreadsheet}
                title="Descargar reporte general de alturas en Excel"
                variant="excel"
              />
              <span className="bg-teal-500/10 text-teal-400 text-xs px-2.5 py-1 rounded-full font-bold">
                {workers.length}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar trabajador o cédula..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-border-medium rounded-xl text-sm text-text-primary outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredWorkers.map(w => {
            const isSelected = selectedWorker?.id === w.id;
            const workerDoc = heightsDocs.find(d => d.workerId === w.id);
            const userEquipos = workerDoc?.equipos || [];
            const hasEquip = userEquipos.length > 0;

            const hasAlert = userEquipos.some(eq => {
              const info = getDaysUntil(eq.fechaProximaInspeccion);
              return eq.estado === 'Vencido' || eq.estado === 'Retirado' || info.status === 'expired' || info.status === 'warning';
            });

            const initials = (w.nombre || '')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map(p => p[0]?.toUpperCase())
              .join('') || 'A';

            return (
              <button
                key={w.id}
                onClick={() => {
                  setSelectedWorker(w);
                  resetForm();
                  setGeneratedReport(null);
                  editorContentRef.current = null;
                  setConversationId(null);
                  setReportMessageId(null);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all hover:scale-[1.01] cursor-pointer",
                  isSelected 
                    ? "bg-teal-500/10 border-teal-500 shadow-sm shadow-teal-500/10" 
                    : "bg-surface-primary border-border-light dark:border-white/5 text-text-primary hover:bg-surface-secondary/70 hover:border-teal-500/30"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={cn(
                    "w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400 shadow-xs"
                      : "bg-gradient-to-br from-surface-secondary to-surface-tertiary text-text-secondary border-border-medium"
                  )}>
                    {initials}
                  </div>
                  <div className="truncate">
                    <p className={cn("font-bold text-sm truncate", isSelected ? "text-teal-600 dark:text-teal-400 font-extrabold" : "text-text-primary")}>
                      {w.nombre}
                    </p>
                    <p className="text-[11px] text-text-secondary truncate mt-0.5">{w.cargo || 'Sin cargo'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {hasAlert ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Vencido
                    </span>
                  ) : hasEquip ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {userEquipos.length}
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-tertiary px-1.5 py-0.5 rounded bg-surface-secondary">
                      0 eq.
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTOR DERECHO: DETALLE E INVENTARIO */}
      <div className={cn("flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-surface-primary", !selectedWorker && "hidden md:flex")}>
        {selectedWorker ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden h-full">
            <div className="p-4 md:p-6 border-b border-border-light dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-secondary/20 shrink-0">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="md:hidden inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver a trabajadores
                </button>
                <h2 className="text-xl font-extrabold text-text-primary">{selectedWorker.nombre}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-text-secondary">
                  <span>C.C. {selectedWorker.identificacion}</span>
                  <span>•</span>
                  <span className="text-teal-600 dark:text-teal-400">{selectedWorker.cargo || 'Sin cargo'}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-2xs">
                    {selectedDoc?.equipos?.length || 0} Equipos Asignados
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ToolbarButton
                  id="hw-new-equipment"
                  onClick={() => setIsModalOpen(true)}
                  label="Registrar Equipo"
                  icon={Plus}
                  title={`Registrar nuevo equipo de alturas para ${selectedWorker.nombre}`}
                  variant="ai"
                />
                <ToolbarButton
                  id="hw-print-ficha"
                  onClick={handlePrintFicha}
                  label="Imprimir Ficha"
                  icon={Printer}
                  title="Imprimir hoja de vida de equipos"
                  variant="default"
                />
                <ToolbarButton
                  id="hw-download-html"
                  onClick={handleDownloadFichaHtml}
                  label="Descargar HTML"
                  icon={Download}
                  title="Descargar hoja de vida en HTML"
                  variant="default"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Inventario de Equipos */}
              <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                <button 
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)} 
                  className="w-full flex items-center justify-between p-4 bg-surface-tertiary"
                >
                  <div className="flex items-center gap-2">
                    {isHistoryExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <Wrench className="w-5 h-5 text-teal-500" />
                    <span className="font-semibold text-text-primary">Equipos Contra Caídas Asignados</span>
                  </div>
                </button>
                {isHistoryExpanded && (
                  <div className="p-5 border-t border-border-medium bg-surface-primary space-y-3.5">
                    <div className="border border-border-light dark:border-white/5 rounded-2xl overflow-hidden shadow-sm bg-surface-primary">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-surface-secondary text-text-secondary font-bold border-b border-border-light dark:border-white/5">
                            <th className="p-3">Equipo</th>
                            <th className="p-3">Marca / Ref.</th>
                            <th className="p-3">Serial</th>
                            <th className="p-3 text-center">Última Inspección</th>
                            <th className="p-3 text-center">Próxima Inspección</th>
                            <th className="p-3 text-center">Semáforo Anual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDoc?.equipos.map((eq, idx) => {
                            const days = getDaysUntil(eq.fechaProximaInspeccion);
                            return (
                              <tr key={idx} className="border-b border-border-light dark:border-white/5 hover:bg-surface-hover/30 transition-colors">
                                <td className="p-3 font-semibold text-text-primary">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                    <span>{eq.nombre}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-text-secondary">{eq.marca} {eq.referencia ? `(${eq.referencia})` : ''}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border-medium font-mono text-2xs text-text-primary font-bold">
                                    {eq.serial}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-text-secondary">{eq.fechaUltimaInspeccion || 'N/A'}</td>
                                <td className="p-3 text-center text-text-secondary font-bold">{eq.fechaProximaInspeccion || 'N/A'}</td>
                                <td className="p-3 text-center">
                                  <span className={cn(
                                    "px-2.5 py-0.5 rounded-full font-bold text-2xs inline-block",
                                    days.status === 'expired' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                    days.status === 'warning' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                    "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  )}>
                                    {days.text}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {(!selectedDoc || selectedDoc.equipos.length === 0) && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-text-tertiary italic">
                                No se han registrado equipos de alturas para este trabajador. Haga clic en "+ Registrar Equipo" para agregarlos.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Banner de Bienvenida y Control Alturas */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900/15 via-slate-900/10 to-teal-900/15 border border-teal-500/30 shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-300 text-2xs font-extrabold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Resolución 4272 de 2021
                  </div>
                  <h3 className="text-xl font-black text-text-primary">
                    Centro de Trazabilidad e Inspección de Alturas
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Hojas de vida, control de seriales y seguimiento a la inspección periódica anual obligatoria de arneses, eslingas, líneas de vida y conectores certificados.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Exportar Matriz Alturas
                  </button>
                </div>
              </div>
            </div>

            {/* Accesos Rápidos de Gestión */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => {
                  if (workers.length > 0) setSelectedWorker(workers[0]);
                  setIsModalOpen(true);
                }}
                className="p-4 rounded-2xl bg-surface-primary border border-border-medium hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-primary">Registrar Equipo</h4>
                <p className="text-2xs text-text-secondary mt-1">Vincular arnés, eslinga o línea de vida con serial y fechas de inspección.</p>
              </div>

              <div
                onClick={handleExportExcel}
                className="p-4 rounded-2xl bg-surface-primary border border-border-medium hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-primary">Matriz Alturas (Excel)</h4>
                <p className="text-2xs text-text-secondary mt-1">Descargar inventario consolidado y estado de revisión de todos los colaboradores.</p>
              </div>

              <div
                onClick={handleGenerate}
                className="p-4 rounded-2xl bg-surface-primary border border-border-medium hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-text-primary">Auditoría IA Alturas</h4>
                <p className="text-2xs text-text-secondary mt-1">Generar dictamen pericial de cumplimiento normativo conforme a Res. 4272.</p>
              </div>
            </div>

            {/* Equipos con Alertas o Vencidos */}
            {equipmentWithAlerts.length > 0 && (
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wider">Equipos con Inspección Anual Vencida o Próxima ({equipmentWithAlerts.length})</h4>
                  </div>
                  <span className="text-2xs font-semibold text-text-secondary">Plazo Máximo: 365 días</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {equipmentWithAlerts.map(({ worker, equipo, daysInfo }, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedWorker(worker)}
                      className="p-3 bg-surface-primary rounded-xl border border-amber-500/20 hover:border-amber-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-text-primary truncate">{equipo.nombre}</span>
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full shrink-0",
                          daysInfo.status === 'expired' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                        )}>
                          {daysInfo.text}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-2xs text-text-secondary">
                        <p>Trabajador: <strong className="text-text-primary">{worker.nombre}</strong></p>
                        <p>Serial: <span className="font-mono">{equipo.serial}</span> • Marca: {equipo.marca}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nota de Cumplimiento Normativo */}
            <div className="p-4 rounded-2xl bg-surface-secondary/40 border border-border-light dark:border-white/5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs text-text-secondary space-y-1 leading-relaxed">
                <p className="font-bold text-text-primary">Artículo 24 de la Resolución 4272 de 2021:</p>
                <p>
                  Todos los elementos y equipos de protección contra caídas deben ser sometidos a inspección al menos una vez al año por una persona calificada o avalada por el fabricante. Dicha inspección debe quedar consignada en la respectiva hoja de vida del equipo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Editor de Informe de Alturas (Nivel Raíz — Siempre Visible a Todo Ancho) */}
      <CollapsibleReportBox
        onSave={handleSave}
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        title="Informe IA - Control de Equipos de Alturas"
        icon={<ShieldAlert className="h-5 w-5" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName={`Informe_Alturas_${selectedWorker?.nombre ? selectedWorker.nombre.replace(/\s+/g, '_') : 'General'}`}
            reportType="general"
          />
        }
      >
        <div className="w-full min-w-0">
          <LiveEditor
            ref={liveEditorRef}
            paperMode={true}
            initialContent={generatedReport}
            onUpdate={(html) => { editorContentRef.current = html; }}
            reportSourceData={{ worker: selectedWorker, doc: selectedDoc }}
          />
        </div>
      </CollapsibleReportBox>

      {/* Modal: Registrar Equipo */}
      {isModalOpen && selectedWorker && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface-primary border border-border-light dark:border-white/10 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border-light dark:border-white/10 flex justify-between items-center bg-surface-secondary/40">
              <h3 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-500" /> Registrar Equipo de Alturas
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-text-secondary hover:bg-surface-hover transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-2xs uppercase font-bold text-text-secondary">Nombre del Equipo</label>
                <select value={formNombre} onChange={e => setFormNombre(e.target.value)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs">
                  <option value="Arnés de cuerpo entero (4 argollas)">Arnés de cuerpo entero (4 argollas)</option>
                  <option value="Eslinga de posicionamiento regulable">Eslinga de posicionamiento regulable</option>
                  <option value="Eslinga doble con absorbedor de choque">Eslinga doble con absorbedor de choque</option>
                  <option value="Línea de vida vertical (Cuerda)">Línea de vida vertical (Cuerda)</option>
                  <option value="Mosquetón de seguridad automático">Mosquetón de seguridad automático</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-2xs uppercase font-bold text-text-secondary">Marca *</label>
                  <input type="text" value={formMarca} onChange={e => setFormMarca(e.target.value)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs uppercase font-bold text-text-secondary">Referencia</label>
                  <input type="text" value={formReferencia} onChange={e => setFormReferencia(e.target.value)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs uppercase font-bold text-text-secondary">Serial / Lote *</label>
                  <input type="text" value={formSerial} onChange={e => setFormSerial(e.target.value)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs uppercase font-bold text-text-secondary">Fecha Fabricación</label>
                  <input type="date" value={formFechaFabricacion} onChange={e => setFormFechaFabricacion(e.target.value)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border-light dark:border-white/5 pt-3">
                <div className="space-y-1">
                  <label className="text-2xs uppercase font-bold text-text-secondary">Última Inspección</label>
                  <input type="date" value={formFechaUltimaInspeccion} onChange={e => handleLastInspectionChange(e.target.value)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs uppercase font-bold text-text-secondary">Próxima Inspección (Anual)</label>
                  <input type="date" value={formFechaProximaInspeccion} onChange={e => setFormFechaProximaInspeccion(e.target.value)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs uppercase font-bold text-text-secondary">Resultado Inspección</label>
                  <select value={formResultado} onChange={e => setFormResultado(e.target.value as any)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs">
                    <option value="N/A">Sin evaluación</option>
                    <option value="Aprobado">Aprobado para Servicio</option>
                    <option value="Rechazado">Rechazado / Retirar</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs uppercase font-bold text-text-secondary">Estado General</label>
                  <select value={formEstado} onChange={e => setFormEstado(e.target.value as any)} className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs">
                    <option value="Vigente">Vigente</option>
                    <option value="Vencido">Vencido</option>
                    <option value="Requiere Inspección">Requiere Inspección</option>
                    <option value="Retirado">Retirado del Servicio</option>
                  </select>
                </div>
              </div>

              {/* Firma Aceptación */}
              <div className="p-3 border border-border-light dark:border-white/5 rounded-2xl bg-surface-secondary/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xs uppercase font-bold text-text-secondary">Firma del Trabajador (Recibido)</span>
                  {selectedWorker.firmaDigital ? (
                    <span className="bg-teal-500/10 text-teal-400 font-bold px-2 py-0.5 rounded text-[10px]">Guardada</span>
                  ) : (
                    <button onClick={() => setIsSignatureOpen(true)} className="text-xs text-teal-500 font-bold hover:underline">
                      {formSignature ? 'Cambiar Firma' : 'Firmar en Pantalla'}
                    </button>
                  )}
                </div>
                {formSignature ? (
                  <div className="flex items-center gap-4 bg-teal-500/5 p-2 rounded-lg border border-teal-500/20">
                    <img src={formSignature} style={{ maxHeight: '35px' }} className="bg-white rounded p-1" />
                    <button onClick={() => setFormSignature(null)} className="text-red-400 text-xs ml-auto font-bold hover:underline">Remover</button>
                  </div>
                ) : selectedWorker.firmaDigital ? (
                  <div className="flex items-center gap-4 bg-teal-500/5 p-2 rounded-lg border border-teal-500/20">
                    <img src={selectedWorker.firmaDigital} style={{ maxHeight: '35px' }} className="bg-white rounded p-1" />
                    <p className="text-[10px] text-text-secondary leading-relaxed">Se vinculará la firma registrada en sociodemográfico.</p>
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-border-medium rounded-lg text-xs text-text-tertiary">
                    Ninguna firma capturada
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-2xs uppercase font-bold text-text-secondary">Observaciones</label>
                <textarea
                  value={formObservaciones}
                  onChange={e => setFormObservaciones(e.target.value)}
                  className="w-full p-2 bg-surface-secondary border border-border-medium rounded-lg text-xs"
                  rows={2}
                />
              </div>
            </div>

            <div className="p-6 border-t border-border-light dark:border-white/10 bg-surface-secondary/40 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border-medium text-text-primary rounded-xl font-bold text-xs">Cancelar</button>
              <button onClick={handleSaveEquipment} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs">Registrar Equipo</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <SignaturePad
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onSave={setFormSignature}
        title={`Firma de Conformidad: ${selectedWorker?.nombre}`}
      />

      <ReportHistory 
        onSelectReport={handleSelectReport} 
        isOpen={isHistoryOpen} 
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} 
        refreshTrigger={refreshTrigger} 
        tags={['sgsst-heights']} 
      />

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowUpgradeModal(false)} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm"
            >
              Cerrar [X]
            </button>
            <UpgradeWall 
              isCompact={true}
              title="Actualizar a Somos SST Pro"
              description="Has alcanzado el límite de 1 informe gratuito en el plan básico. Actualiza a Pro para generar informes ilimitados con Inteligencia Artificial."
            />
          </div>
        </div>
      )}
    </div>
  );
}
