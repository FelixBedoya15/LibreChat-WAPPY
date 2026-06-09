import React, { useEffect, useState, useMemo } from 'react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { 
  Building2, QrCode, Printer, ShieldAlert, AlertCircle, 
  TrendingUp, Sparkles, Users, BarChart2, Calendar, 
  Download, Eye, Loader2, CheckCircle2, Clock, 
  FileText, Activity, Trash2, Check
} from 'lucide-react';
import axios from 'axios';

interface ReporteReciente {
  id: string;
  fecha: string;
  trabajador: string;
  cargo: string;
  descripcion: string;
  ubicacion: string;
  status: 'pending' | 'processed';
  hasFoto: boolean;
  hasVideo: boolean;
}

interface StatsData {
  totalReportesBuzon: number;
  periodoDias: number;
  pendientes: number;
  procesados: number;
  finalizadosPdf: number;
  preliminarClasificacion: {
    actos: number;
    condiciones: number;
    mixto_no_clasificado: number;
  };
  areasFrecuentes: Array<{ name: string; count: number }>;
  reportesRecientes: ReporteReciente[];
}

export default function ActosCondicionesAnalyticsDashboard({ isMaximized }: { isMaximized?: boolean }) {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();
  
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState<number>(30);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const showFullView = isMaximized === undefined || isMaximized === true;

  const fetchData = async (days: number) => {
    try {
      setLoading(true);
      // 1. Fetch Company Info
      const companyRes = await axios.get('/api/sgsst/company-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyInfo(companyRes.data);

      // 2. Fetch Stats Data
      const statsRes = await axios.get(`/api/sgsst/reporte-actos/estadisticas?dias=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching actes & conditions dashboard data:', error);
      showToast({ message: 'Error al cargar datos del panel de analítica.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData(filterDays);
  }, [token, filterDays]);

  // QR Code URL pointing to public reporting portal page
  const publicQrUrl = useMemo(() => {
    if (!user?.id && !user?._id) return '';
    return `${window.location.origin}/sgsst-public/reportar/${user.id || user._id}`;
  }, [user]);

  // QR API Endpoint
  const qrImageSrc = useMemo(() => {
    if (!publicQrUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicQrUrl)}&color=ea580c&bgcolor=ffffff&margin=10`;
  }, [publicQrUrl]);

  const handleMarkProcessed = async (reportId: string) => {
    try {
      setProcessingId(reportId);
      const res = await axios.post('/api/sgsst/reporte-actos/inbox/mark-processed', 
        { reportId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast({ message: 'Reporte marcado como procesado con éxito.', status: 'success' });
        // Refresh stats
        fetchData(filterDays);
      }
    } catch (err) {
      console.error('Error marking report as processed:', err);
      showToast({ message: 'Error al actualizar el estado del reporte.', status: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    if (!window.confirm('¿Estás seguro de descartar este reporte? Se eliminará del buzón.')) return;
    try {
      setProcessingId(reportId);
      const res = await axios.post('/api/sgsst/reporte-actos/inbox/dismiss', 
        { reportId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast({ message: 'Reporte descartado correctamente.', status: 'success' });
        fetchData(filterDays);
      }
    } catch (err) {
      console.error('Error dismissing report:', err);
      showToast({ message: 'Error al descartar el reporte.', status: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Portal de Reporte de Actos y Condiciones - ${companyInfo?.companyName || 'Wappy'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #fcfcfc;
              color: #1f2937;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .poster-card {
              width: 100%;
              max-width: 650px;
              background: white;
              border: 4px solid #ea580c;
              border-radius: 36px;
              padding: 60px 45px;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
              text-align: center;
              box-sizing: border-box;
              position: relative;
            }
            .logo-placeholder {
              font-size: 26px;
              font-weight: 800;
              color: #ea580c;
              margin-bottom: 20px;
              letter-spacing: 1px;
            }
            h1 {
              font-size: 40px;
              font-weight: 800;
              margin: 0 0 12px 0;
              color: #111827;
              letter-spacing: -1px;
              line-height: 1.1;
            }
            h2 {
              font-size: 22px;
              font-weight: 600;
              color: #d97706;
              margin: 0 0 35px 0;
            }
            .desc {
              font-size: 16px;
              color: #4b5563;
              line-height: 1.6;
              margin-bottom: 45px;
              padding: 0 15px;
            }
            .qr-wrapper {
              display: inline-block;
              padding: 24px;
              background: #fff7ed;
              border-radius: 28px;
              border: 2px dashed #ffedd5;
              margin-bottom: 35px;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            }
            .qr-img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .tagline {
              font-size: 17px;
              font-weight: 800;
              color: #c2410c;
              margin-bottom: 25px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 45px;
              border-top: 1px solid #f3f4f6;
              padding-top: 25px;
            }
            @media print {
              body { background: white; }
              .poster-card {
                border: none;
                box-shadow: none;
                padding: 20px;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="logo-placeholder">${companyInfo?.companyName?.toUpperCase() || 'MI EMPRESA'}</div>
            <h1>¿Detectaste un peligro?</h1>
            <h2>Reporte Público de Actos y Condiciones Inseguras</h2>
            <p class="desc">
              Tu seguridad es nuestro compromiso. Si observas un acto inseguro de un compañero, una herramienta dañada, cables expuestos o pisos resbalosos en nuestras instalaciones, repórtalo escaneando este código QR. Puedes adjuntar fotos y es totalmente confidencial. ¡Nos ayuda a prevenir accidentes de trabajo!
            </p>
            <div class="qr-wrapper">
              <img class="qr-img" src="${qrImageSrc}" alt="QR code" />
            </div>
            <div class="tagline">¡Reportar a tiempo salva vidas!</div>
            <div class="footer">
              Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) · Resolución 0312 de 2019
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading && !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 text-text-secondary animate-fadeIn">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <h3 className="font-bold text-lg text-text-primary">Cargando Analítica de Actos y Condiciones...</h3>
        <p className="text-sm text-text-secondary mt-1">Sincronizando reportes del buzón público</p>
      </div>
    );
  }

  const data = stats || {
    totalReportesBuzon: 0,
    periodoDias: filterDays,
    pendientes: 0,
    procesados: 0,
    finalizadosPdf: 0,
    preliminarClasificacion: { actos: 0, condiciones: 0, mixto_no_clasificado: 0 },
    areasFrecuentes: [],
    reportesRecientes: []
  };

  const actosPct = data.totalReportesBuzon > 0 ? ((data.preliminarClasificacion.actos / data.totalReportesBuzon) * 100).toFixed(1) : '0';
  const condPct = data.totalReportesBuzon > 0 ? ((data.preliminarClasificacion.condiciones / data.totalReportesBuzon) * 100).toFixed(1) : '0';
  const mixtoPct = data.totalReportesBuzon > 0 ? ((data.preliminarClasificacion.mixto_no_clasificado / data.totalReportesBuzon) * 100).toFixed(1) : '0';

  if (!showFullView) {
    return (
      <div className="space-y-6 animate-fadeIn text-text-primary pb-6">
        {/* Right Col: Print QR Poster Card */}
        <div className="bg-surface-primary border border-border-medium rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm text-center">
          <div className="space-y-2">
            <div className="inline-flex p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-2xl mb-1">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Buzón de Reportes QR</h3>
            <p className="text-[11px] text-text-secondary px-4 leading-relaxed">
              Imprime este código QR y colócalo en carteleras de la empresa para que los colaboradores envíen reportes desde sus celulares.
            </p>
          </div>

          {/* QR Image Display */}
          {qrImageSrc ? (
            <div className="bg-white p-4 rounded-2xl border border-border-light shadow-md my-4">
              <img src={qrImageSrc} alt="QR Code" className="w-36 h-36" />
            </div>
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-surface-secondary border border-border-light flex items-center justify-center text-xs text-text-secondary my-4">
              Generando...
            </div>
          )}

          <button
            onClick={handlePrintPoster}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Cartel QR
          </button>
        </div>

        {/* Hazard Areas Breakdown */}
        <div className="bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Áreas de Riesgo Frecuente
          </h3>
          {data.areasFrecuentes.length > 0 ? (
            <div className="space-y-3 pt-2">
              {data.areasFrecuentes.slice(0, 5).map((area, i) => {
                const pct = data.totalReportesBuzon > 0 ? ((area.count / data.totalReportesBuzon) * 100).toFixed(0) : '0';
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">{area.name}</span>
                    <span className="font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-md">{area.count} reportes ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-text-secondary">
              No hay áreas frecuentes registradas en este periodo.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-text-primary pb-6">
      
      {/* Upper Grid: Overview & Poster printing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Title, Filters & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950 via-orange-900 to-amber-950 p-6 text-white shadow-md">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-400 blur-3xl -mr-20 -mt-20" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-300 tracking-wider uppercase">
                  <Sparkles className="w-4 h-4" />
                  Módulo de Gestión de Actos y Condiciones Inseguras
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">Analítica Predictiva ACI</h2>
                <p className="text-xs text-orange-100/80">Estadísticas y gestión activa de reportes del portal de trabajadores.</p>
              </div>

              {/* Day filter buttons */}
              <div className="inline-flex bg-orange-950/50 border border-orange-700/50 rounded-xl p-1 gap-1 self-start sm:self-center">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilterDays(d)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      filterDays === d
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-orange-200 hover:text-white hover:bg-orange-850/50'
                    }`}
                  >
                    {d} Días
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards for metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Answers */}
            <div className="bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Activity className="w-10 h-10 text-orange-500" />
              </div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Reportes Buzón</p>
              <h3 className="text-3xl font-black text-text-primary tracking-tight">{data.totalReportesBuzon}</h3>
              <p className="text-[10px] text-text-secondary/70 font-semibold">En los últimos {filterDays} días</p>
            </div>

            {/* Pending */}
            <div className="bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pendientes</p>
              <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{data.pendientes}</h3>
              <div className="w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full" 
                  style={{ width: `${data.totalReportesBuzon > 0 ? (data.pendientes / data.totalReportesBuzon) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[10px] text-text-secondary font-bold">Por clasificar/gestionar</p>
            </div>

            {/* Processed */}
            <div className="bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Procesados</p>
              <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{data.procesados}</h3>
              <div className="w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${data.totalReportesBuzon > 0 ? (data.procesados / data.totalReportesBuzon) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[10px] text-text-secondary font-bold">Revisados en sistema</p>
            </div>

            {/* Finalized PDF */}
            <div className="bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">PDF Finalizados</p>
              <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{data.finalizadosPdf}</h3>
              <div className="w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-full" />
              </div>
              <p className="text-[10px] text-text-secondary font-bold">Documentos firmados</p>
            </div>
          </div>
        </div>

        {/* Right Col: Print QR Poster Card */}
        <div className="bg-surface-primary border border-border-medium rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm text-center">
          <div className="space-y-2">
            <div className="inline-flex p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-2xl mb-1">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Buzón de Reportes QR</h3>
            <p className="text-[11px] text-text-secondary px-4 leading-relaxed">
              Imprime el cartel con el código QR y colócalo en carteleras de la empresa para recibir reportes de tus colaboradores.
            </p>
          </div>

          {/* QR Image Display */}
          {qrImageSrc ? (
            <div className="bg-white p-4 rounded-2xl border border-border-light shadow-md my-4">
              <img src={qrImageSrc} alt="QR Code" className="w-36 h-36" />
            </div>
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-surface-secondary border border-border-light flex items-center justify-center text-xs text-text-secondary my-4">
              Generando...
            </div>
          )}

          <button
            onClick={handlePrintPoster}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Cartel QR
          </button>
        </div>

      </div>

      {/* Lower Grid: Classification heuristics & Areas & Recent reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Classification Breakdown & Area Hazards */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Classification Breakdown */}
          <div className="bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-orange-500" />
              Tipología de Peligro (Preliminar)
            </h3>
            <div className="space-y-4 pt-2">
              {/* Acts */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-text-primary">Actos Inseguros</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">{data.preliminarClasificacion.actos} ({actosPct}%)</span>
                </div>
                <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${actosPct}%` }} />
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-text-primary">Condiciones Inseguras</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{data.preliminarClasificacion.condiciones} ({condPct}%)</span>
                </div>
                <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${condPct}%` }} />
                </div>
              </div>

              {/* Mixto / No clasificado */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-text-primary">Mixtos / Por definir</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{data.preliminarClasificacion.mixto_no_clasificado} ({mixtoPct}%)</span>
                </div>
                <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${mixtoPct}%` }} />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-text-secondary mt-2 leading-relaxed">
              * Clasificación preliminar basada en palabras clave descriptivas. Llama al Asistente de ACI para elaborar el ATS final.
            </p>
          </div>

          {/* Area Hazards */}
          <div className="bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              Ubicaciones más Reportadas
            </h3>
            {data.areasFrecuentes.length > 0 ? (
              <div className="space-y-3 pt-2">
                {data.areasFrecuentes.slice(0, 6).map((area, i) => {
                  const pct = data.totalReportesBuzon > 0 ? ((area.count / data.totalReportesBuzon) * 100).toFixed(0) : '0';
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="font-semibold text-text-primary">{area.name}</span>
                      </div>
                      <span className="font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-md">{area.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-text-secondary">
                No hay áreas registradas en el buzón.
              </div>
            )}
          </div>

        </div>

        {/* Right 2 Columns: Recent Reports List & Management */}
        <div className="md:col-span-2 bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border-light pb-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500 animate-pulse" />
              Buzón de Reportes Públicos Recibidos
            </h3>
            <span className="text-xs font-semibold text-text-secondary bg-surface-secondary px-2 py-1 rounded-md">
              {data.reportesRecientes.length} Registrados
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] scrollbar-thin pr-1 pt-2">
            {data.reportesRecientes.length > 0 ? (
              data.reportesRecientes.map((report) => (
                <div 
                  key={report.id} 
                  className={`p-4 bg-surface-secondary border rounded-xl space-y-3 text-xs transition-all ${
                    report.status === 'processed' 
                      ? 'border-border-light opacity-80' 
                      : 'border-orange-500/20 shadow-sm hover:border-orange-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                      {new Date(report.fecha).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${
                        report.status === 'processed'
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400'
                          : 'bg-amber-50 border-amber-250 text-amber-600 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400'
                      }`}>
                        {report.status === 'processed' ? 'Procesado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-primary">Colaborador: {report.trabajador} ({report.cargo})</span>
                      <span className="text-[10px] text-text-secondary bg-surface-primary border border-border-light px-2 py-0.5 rounded-md font-semibold">📍 {report.ubicacion}</span>
                    </div>
                    <p className="text-text-primary leading-relaxed bg-surface-primary/50 p-2.5 rounded-lg border border-border-light/50">
                      {report.descripcion}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-border-light/50">
                    <div className="flex gap-2">
                      {report.hasFoto && (
                        <span className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-md">
                          📷 Con Foto
                        </span>
                      )}
                      {report.hasVideo && (
                        <span className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded-md">
                          🎥 Con Video
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {report.status !== 'processed' && (
                        <button
                          disabled={processingId !== null}
                          onClick={() => handleMarkProcessed(report.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Marcar Procesado
                        </button>
                      )}
                      <button
                        disabled={processingId !== null}
                        onClick={() => handleDismissReport(report.id)}
                        className="bg-red-100 hover:bg-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Descartar
                      </button>
                    </div>
                  </div>

                </div>
              ))
            ) : (
              <div className="text-center py-16 text-xs text-text-secondary h-full flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="font-bold text-text-primary">¡Buzón al día!</p>
                <p className="text-[11px] text-text-secondary">No hay reportes de trabajadores pendientes en este periodo.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
