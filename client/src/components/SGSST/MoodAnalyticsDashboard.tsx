import React, { useEffect, useState, useMemo } from 'react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { 
  Building2, QrCode, Printer, Heart, Smile, Meh, Frown, 
  TrendingUp, Sparkles, Users, BarChart2, Calendar, 
  ArrowLeft, Download, Eye, AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface MoodRecord {
  _id: string;
  mood: 'happy' | 'neutral' | 'sad';
  stressors: string[];
  details?: string;
  department?: string;
  createdAt: string;
}

export default function MoodAnalyticsDashboard() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [moodData, setMoodData] = useState<MoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState<number>(30);

  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Company Info
        const companyRes = await axios.get('/api/sgsst/company-info', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompanyInfo(companyRes.data);

        // 2. Fetch Mood Telemetry Data
        const moodRes = await axios.get('/api/sgsst/estadisticas/mood', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMoodData(moodRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast({ message: 'Error al cargar datos del panel psicosocial.', status: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // QR Code URL pointing to public mood tracker page
  const publicQrUrl = useMemo(() => {
    if (!companyInfo?._id) return '';
    return `${window.location.origin}/sgsst-public/animo/${companyInfo._id}`;
  }, [companyInfo]);

  // QR API Endpoint
  const qrImageSrc = useMemo(() => {
    if (!publicQrUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicQrUrl)}&color=0e9f6e&bgcolor=ffffff&margin=10`;
  }, [publicQrUrl]);

  // Filtered Data based on days
  const filteredData = useMemo(() => {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - filterDays);
    return moodData.filter(item => new Date(item.createdAt) >= limitDate);
  }, [moodData, filterDays]);

  // Metrics Calculations
  const stats = useMemo(() => {
    const total = filteredData.length;
    let happy = 0;
    let neutral = 0;
    let sad = 0;
    const stressorsMap: Record<string, number> = {};
    const departmentMap: Record<string, { total: number; happy: number; neutral: number; sad: number }> = {};

    filteredData.forEach(item => {
      // Count moods
      if (item.mood === 'happy') happy++;
      else if (item.mood === 'neutral') neutral++;
      else if (item.mood === 'sad') sad++;

      // Count stressors
      if (Array.isArray(item.stressors)) {
        item.stressors.forEach(s => {
          stressorsMap[s] = (stressorsMap[s] || 0) + 1;
        });
      }

      // Group by department
      const depName = item.department?.trim() || 'General';
      if (!departmentMap[depName]) {
        departmentMap[depName] = { total: 0, happy: 0, neutral: 0, sad: 0 };
      }
      departmentMap[depName].total++;
      if (item.mood === 'happy') departmentMap[depName].happy++;
      else if (item.mood === 'neutral') departmentMap[depName].neutral++;
      else if (item.mood === 'sad') departmentMap[depName].sad++;
    });

    // Sort stressors
    const topStressors = Object.entries(stressorsMap)
      .map(([id, count]) => {
        let label = id;
        if (id === 'sobrecarga') label = 'Sobrecarga de trabajo';
        else if (id === 'liderazgo') label = 'Clima laboral / Liderazgo';
        else if (id === 'entorno') label = 'Entorno físico / Equipos';
        else if (id === 'personal') label = 'Problemas familiares/personales';
        else if (id === 'funciones') label = 'Incertidumbre de funciones';
        else if (id === 'fatiga') label = 'Fatiga física o mental';
        return { id, label, count, pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0' };
      })
      .sort((a, b) => b.count - a.count);

    // Sort departments by total responses
    const departmentStats = Object.entries(departmentMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    return {
      total,
      happy,
      neutral,
      sad,
      happyPct: total > 0 ? ((happy / total) * 100).toFixed(1) : '0',
      neutralPct: total > 0 ? ((neutral / total) * 100).toFixed(1) : '0',
      sadPct: total > 0 ? ((sad / total) * 100).toFixed(1) : '0',
      topStressors,
      departmentStats
    };
  }, [filteredData]);

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Poster Termómetro Psicosocial - ${companyInfo?.companyName || 'Wappy'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f9fafb;
              color: #111827;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .poster-card {
              width: 100%;
              max-width: 650px;
              background: white;
              border: 3px solid #0e9f6e;
              border-radius: 32px;
              padding: 50px 40px;
              box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
              text-align: center;
              box-sizing: border-box;
            }
            .logo-placeholder {
              font-size: 28px;
              font-weight: 800;
              color: #0e9f6e;
              margin-bottom: 25px;
            }
            h1 {
              font-size: 38px;
              font-weight: 800;
              margin: 0 0 10px 0;
              color: #111827;
              letter-spacing: -1px;
            }
            h2 {
              font-size: 20px;
              font-weight: 600;
              color: #059669;
              margin: 0 0 30px 0;
            }
            .desc {
              font-size: 16px;
              color: #4b5563;
              line-height: 1.6;
              margin-bottom: 40px;
              padding: 0 20px;
            }
            .qr-wrapper {
              display: inline-block;
              padding: 20px;
              background: #f3f4f6;
              border-radius: 24px;
              border: 1px dashed #d1d5db;
              margin-bottom: 30px;
            }
            .qr-img {
              width: 230px;
              height: 230px;
              display: block;
            }
            .tagline {
              font-size: 15px;
              font-weight: 600;
              color: #6d28d9;
              margin-bottom: 20px;
            }
            .footer {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 40px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body { background: white; }
              .poster-card {
                border: none;
                box-shadow: none;
                padding: 20px;
                max-width: 100%;
              }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="logo-placeholder">${companyInfo?.companyName?.toUpperCase() || 'MI EMPRESA'}</div>
            <h1>¿Cómo te sientes hoy?</h1>
            <h2>Termómetro Psicosocial Confidencial</h2>
            <p class="desc">
              Tu salud mental y bienestar son la máxima prioridad para nosotros. Escanea el código QR de abajo con la cámara de tu celular, cuéntanos tu estado de ánimo de hoy y conversa si lo deseas con nuestro Psicólogo Especialista en SST. Es 100% privado y anónimo.
            </p>
            <div class="qr-wrapper">
              <img class="qr-img" src="${qrImageSrc}" alt="QR code" />
            </div>
            <div class="tagline">¡Tu voz importa, cuidémonos juntos!</div>
            <div class="footer">
              En cumplimiento con las normas éticas de la Batería de Riesgo Psicosocial.
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 text-gray-200">
        <Loader2 className="w-12 h-12 text-[#0e9f6e] animate-spin mb-4" />
        <h3 className="font-bold text-lg">Cargando Analítica Psicosocial...</h3>
        <p className="text-sm text-gray-400 mt-1">Procesando registros de clima laboral</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-gray-100 pb-12">
      
      {/* Upper Grid: Overview & Poster printing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Title, Filters & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="bg-[#0e1322]/40 border border-gray-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <TrendingUp className="w-32 h-32 text-[#0e9f6e]" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0e9f6e] tracking-wider uppercase">
                  <Sparkles className="w-4 h-4" />
                  Módulo de Gestión de Riesgo Psicosocial
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Analítica de Estado de Ánimo</h2>
                <p className="text-xs text-gray-400">Consolidado estadístico y tendencias de bienestar de los colaboradores.</p>
              </div>

              {/* Day filter buttons */}
              <div className="inline-flex bg-gray-900/80 border border-gray-800 rounded-xl p-1 gap-1 self-start sm:self-center">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilterDays(d)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      filterDays === d
                        ? 'bg-[#0e9f6e] text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
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
            <div className="bg-[#0e1322]/40 border border-gray-800 rounded-2xl p-5 space-y-3 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Users className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Respuestas Totales</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{stats.total}</h3>
              <p className="text-[10px] text-gray-500 font-semibold">En los últimos {filterDays} días</p>
            </div>

            {/* Happy */}
            <div className="bg-[#0e1322]/40 border border-gray-800 rounded-2xl p-5 space-y-3 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Smile className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Feliz / Motivado</p>
              <h3 className="text-3xl font-black text-emerald-300 tracking-tight">{stats.happy}</h3>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${stats.happyPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold">{stats.happyPct}% del total</p>
            </div>

            {/* Neutral */}
            <div className="bg-[#0e1322]/40 border border-gray-800 rounded-2xl p-5 space-y-3 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Meh className="w-10 h-10 text-yellow-400" />
              </div>
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Tranquilo / Normal</p>
              <h3 className="text-3xl font-black text-yellow-300 tracking-tight">{stats.neutral}</h3>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full" style={{ width: `${stats.neutralPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold">{stats.neutralPct}% del total</p>
            </div>

            {/* Sad/Stressed */}
            <div className="bg-[#0e1322]/40 border border-gray-800 rounded-2xl p-5 space-y-3 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Frown className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Estresado / Agotado</p>
              <h3 className="text-3xl font-black text-purple-300 tracking-tight">{stats.sad}</h3>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${stats.sadPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold">{stats.sadPct}% del total</p>
            </div>
          </div>
        </div>

        {/* Right Col: Print QR Poster Card */}
        <div className="bg-gradient-to-b from-[#0e9f6e]/10 to-[#0e1322]/40 border border-[#0e9f6e]/20 rounded-3xl p-6 flex flex-col items-center justify-between backdrop-blur-sm text-center">
          <div className="space-y-2">
            <div className="inline-flex p-3 bg-[#0e9f6e]/10 border border-[#0e9f6e]/20 rounded-2xl text-[#0e9f6e] mb-1">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Termómetro QR Imprimible</h3>
            <p className="text-[11px] text-gray-400 px-4 leading-relaxed">
              Imprime el cartel con el código QR y pégalo en zonas comunes para que tus colaboradores registren su estado de ánimo a diario.
            </p>
          </div>

          {/* QR Image Display */}
          {qrImageSrc ? (
            <div className="bg-white p-4 rounded-2xl border border-gray-700 shadow-xl my-4">
              <img src={qrImageSrc} alt="QR Code" className="w-36 h-36" />
            </div>
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-xs text-gray-500 my-4">
              Generando...
            </div>
          )}

          <button
            onClick={handlePrintPoster}
            className="w-full bg-[#0e9f6e] hover:bg-[#0b8a5f] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-[#0e9f6e]/10 flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Cartel QR
          </button>
        </div>

      </div>

      {/* Lower Grid: Stressors, Departments, Recent Comments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Top Stressors & Departments */}
        <div className="space-y-6">
          
          {/* Stressors */}
          <div className="bg-[#0e1322]/40 border border-gray-800 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#0e9f6e]" />
              Factores de Estrés Principales (Agregado)
            </h3>
            {stats.topStressors.length > 0 ? (
              <div className="space-y-4 pt-2">
                {stats.topStressors.map((s, i) => (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300">{i + 1}. {s.label}</span>
                      <span className="text-purple-300 font-bold">{s.count} reportes ({s.pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-800/80 h-2.5 rounded-full overflow-hidden border border-gray-700/50">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" 
                        style={{ width: `${s.pct}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500">
                No hay factores de estrés registrados en este periodo.
              </div>
            )}
          </div>

          {/* Departments breakdown */}
          <div className="bg-[#0e1322]/40 border border-gray-800 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Diagnóstico por Departamento / Área
            </h3>
            {stats.departmentStats.length > 0 ? (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 font-bold">
                      <th className="pb-2">Área</th>
                      <th className="pb-2 text-center">Muestras</th>
                      <th className="pb-2 text-center text-emerald-400">😄</th>
                      <th className="pb-2 text-center text-yellow-400">😐</th>
                      <th className="pb-2 text-center text-purple-400">😩</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {stats.departmentStats.map((dep, i) => (
                      <tr key={i} className="hover:bg-gray-800/20">
                        <td className="py-2.5 font-bold text-gray-200">{dep.name}</td>
                        <td className="py-2.5 text-center text-gray-400">{dep.total}</td>
                        <td className="py-2.5 text-center font-bold text-emerald-300">{dep.happy}</td>
                        <td className="py-2.5 text-center font-bold text-yellow-300">{dep.neutral}</td>
                        <td className="py-2.5 text-center font-bold text-purple-300">{dep.sad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500">
                No hay desglose por área registrado en este periodo.
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Recent AI Psychologist Conversations (Confidential details) */}
        <div className="bg-[#0e1322]/40 border border-gray-800 rounded-3xl p-6 space-y-4 backdrop-blur-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400 animate-pulse" />
            Hallazgos y Comentarios de IA Psicólogo (Anónimos)
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] scrollbar-thin pr-1 pt-2">
            {filteredData.some(d => d.details) ? (
              filteredData
                .filter(d => d.details)
                .map((d, i) => (
                  <div key={i} className="p-3.5 bg-gray-900/60 border border-gray-800/80 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(d.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border ${
                        d.mood === 'happy'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : d.mood === 'neutral'
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                          : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                      }`}>
                        {d.mood === 'happy' ? 'Feliz' : d.mood === 'neutral' ? 'Neutral' : 'Estresado'}
                      </span>
                    </div>

                    <p className="text-gray-300 leading-relaxed font-medium">
                      {d.details}
                    </p>

                    {d.stressors && d.stressors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {d.stressors.map((st, sIdx) => {
                          const tag = stressorsList.find(x => x.id === st);
                          return (
                            <span key={sIdx} className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[9px] font-bold px-2 py-0.5 rounded-md">
                              {tag?.label || st}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="text-center py-12 text-xs text-gray-500 h-full flex items-center justify-center">
                No hay hallazgos de conversaciones registrados aún.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
