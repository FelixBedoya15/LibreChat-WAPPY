import React, { useMemo } from 'react';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Users,
    AlertTriangle,
    CheckCircle,
    Sparkles,
    Shield,
    ArrowRight,
    MapPin,
    Building2,
    Briefcase,
    Activity,
    FileText,
    X,
    Layers,
    Lightbulb
} from 'lucide-react';

interface ParticipacionEstadisticasDashboardProps {
    inboxPublico: any[];
    participacionesList: any[];
    onApplyConsolidadoToMatrix: (consolidadoData: any) => void;
    onClose: () => void;
}

export default function ParticipacionEstadisticasDashboard({
    inboxPublico,
    participacionesList,
    onApplyConsolidadoToMatrix,
    onClose
}: ParticipacionEstadisticasDashboardProps) {

    // ─── CÁLCULOS ESTADÍSTICOS CONSOLIDADOS ──────────────────────────────────
    const stats = useMemo(() => {
        // Unificar todos los reportes (inbox público + participaciones locales guardadas)
        const allReports: any[] = [];

        inboxPublico.forEach(item => {
            allReports.push({
                nombre: item.trabajador?.nombre || 'Colaborador',
                cedula: item.trabajador?.cedula || '',
                cargo: item.trabajador?.cargo || '',
                centroTrabajo: item.data?.centroTrabajo || 'Bogotá D.C.',
                area: item.data?.area || item.data?.proceso || 'Operativo / Administrativo',
                actividad: item.data?.actividad || 'General',
                tarea: item.data?.tarea || '',
                peligroClasificacion: item.data?.peligroClasificacion || 'Biomecánicos',
                factoresSeleccionados: Array.isArray(item.data?.factoresSeleccionados) ? item.data.factoresSeleccionados : [],
                peligros: item.data?.peligros || '',
                consecuencias: item.data?.consecuencias || item.data?.efectosPosibles || '',
                severidadPercibida: item.data?.severidadPercibida || 'Media',
                controlesExistentes: item.data?.controlesExistentes || '',
                propuestaMejora: item.data?.propuestaMejora || item.data?.sugeridoIngenieria || '',
                rutinaria: item.data?.rutinaria || 'Sí',
                createdAt: item.createdAt
            });
        });

        participacionesList.forEach(item => {
            allReports.push({
                nombre: item.trabajadoresList?.[0]?.nombre || 'Colaborador',
                cedula: item.trabajadoresList?.[0]?.cedula || '',
                cargo: item.trabajadoresList?.[0]?.cargo || '',
                centroTrabajo: item.formData?.centroTrabajo || 'Bogotá D.C.',
                area: item.formData?.proceso || 'Operativo / Administrativo',
                actividad: item.formData?.actividad || 'General',
                tarea: item.formData?.tarea || '',
                peligroClasificacion: item.formData?.peligroClasificacion || 'Biomecánicos',
                factoresSeleccionados: [],
                peligros: item.formData?.peligros || '',
                consecuencias: item.formData?.efectosPosibles || '',
                severidadPercibida: item.formData?.severidadPercibida || 'Media',
                controlesExistentes: item.formData?.controlesExistentes || '',
                propuestaMejora: item.formData?.sugeridoIngenieria || '',
                rutinaria: item.formData?.rutinaria || 'Sí',
                createdAt: new Date()
            });
        });

        const totalReportes = allReports.length;
        const uniqueWorkers = new Set(allReports.map(r => r.cedula || r.nombre).filter(Boolean));
        const totalTrabajadores = uniqueWorkers.size || (totalReportes > 0 ? totalReportes : 0);

        // 1. Conteo por Clasificación GTC-45
        const clasificacionCounts: Record<string, number> = {
            'Biomecánicos': 0,
            'Condiciones de Seguridad': 0,
            'Físico': 0,
            'Psicosociales': 0,
            'Biológico': 0,
            'Químico': 0,
            'Fenómenos Naturales': 0
        };

        allReports.forEach(r => {
            const cat = r.peligroClasificacion;
            if (clasificacionCounts[cat] !== undefined) {
                clasificacionCounts[cat] += 1;
            } else {
                // Mapear aproximados
                if (cat.toLowerCase().includes('biomec')) clasificacionCounts['Biomecánicos'] += 1;
                else if (cat.toLowerCase().includes('seguridad') || cat.toLowerCase().includes('locativ') || cat.toLowerCase().includes('mec')) clasificacionCounts['Condiciones de Seguridad'] += 1;
                else if (cat.toLowerCase().includes('físic') || cat.toLowerCase().includes('fisic')) clasificacionCounts['Físico'] += 1;
                else if (cat.toLowerCase().includes('psico')) clasificacionCounts['Psicosociales'] += 1;
                else if (cat.toLowerCase().includes('biol')) clasificacionCounts['Biológico'] += 1;
                else if (cat.toLowerCase().includes('quím') || cat.toLowerCase().includes('quim')) clasificacionCounts['Químico'] += 1;
                else clasificacionCounts['Condiciones de Seguridad'] += 1;
            }
        });

        // Ordenar clasificaciones de mayor a menor
        const rankingClasificaciones = Object.entries(clasificacionCounts)
            .map(([cat, count]) => ({
                cat,
                count,
                porcentaje: totalReportes > 0 ? Math.round((count / totalReportes) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);

        const riesgoMasReportado = rankingClasificaciones[0] || { cat: 'Biomecánicos', count: 0, porcentaje: 0 };

        // 2. Conteo de Factores Específicos más reportados
        const factorCounts: Record<string, number> = {};
        allReports.forEach(r => {
            if (Array.isArray(r.factoresSeleccionados) && r.factoresSeleccionados.length > 0) {
                r.factoresSeleccionados.forEach((f: string) => {
                    factorCounts[f] = (factorCounts[f] || 0) + 1;
                });
            } else if (r.peligros) {
                // Extraer de texto
                const pLower = r.peligros.toLowerCase();
                if (pLower.includes('postura') || pLower.includes('ergon')) factorCounts['Postura prolongada / mantenida'] = (factorCounts['Postura prolongada / mantenida'] || 0) + 1;
                if (pLower.includes('repetitiv')) factorCounts['Movimiento repetitivo'] = (factorCounts['Movimiento repetitivo'] || 0) + 1;
                if (pLower.includes('carga') || pLower.includes('peso')) factorCounts['Manipulación manual de cargas'] = (factorCounts['Manipulación manual de cargas'] || 0) + 1;
                if (pLower.includes('altura') || pLower.includes('andamio')) factorCounts['Trabajo en Alturas / Caídas'] = (factorCounts['Trabajo en Alturas / Caídas'] || 0) + 1;
                if (pLower.includes('orden') || pLower.includes('locativ') || pLower.includes('piso')) factorCounts['Condiciones Locativas / Orden y Aseo'] = (factorCounts['Condiciones Locativas / Orden y Aseo'] || 0) + 1;
                if (pLower.includes('iluminac') || pLower.includes('luz')) factorCounts['Iluminación deficiente o excesiva'] = (factorCounts['Iluminación deficiente o excesiva'] || 0) + 1;
                if (pLower.includes('ruido')) factorCounts['Ruido continuo o de impacto'] = (factorCounts['Ruido continuo o de impacto'] || 0) + 1;
                if (pLower.includes('estrés') || pLower.includes('estres')) factorCounts['Carga mental / Psicosocial'] = (factorCounts['Carga mental / Psicosocial'] || 0) + 1;
            }
        });

        const rankingFactores = Object.entries(factorCounts)
            .map(([factor, count]) => ({
                factor,
                count,
                porcentaje: totalReportes > 0 ? Math.round((count / totalReportes) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 3. Distribución de Severidad Percibida
        const severidadCounts: Record<string, number> = {
            'Crítica': 0,
            'Alta': 0,
            'Media': 0,
            'Baja': 0
        };

        allReports.forEach(r => {
            const s = r.severidadPercibida;
            if (severidadCounts[s] !== undefined) severidadCounts[s] += 1;
            else severidadCounts['Media'] += 1;
        });

        const porcentajeCriticoAlto = totalReportes > 0
            ? Math.round(((severidadCounts['Crítica'] + severidadCounts['Alta']) / totalReportes) * 100)
            : 0;

        // Severidad predominante
        const severidadPredominante = Object.entries(severidadCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Media';

        // 4. Centros de Trabajo / Sedes más reportadas
        const sedesCounts: Record<string, number> = {};
        allReports.forEach(r => {
            const s = r.centroTrabajo || 'Bogotá D.C.';
            sedesCounts[s] = (sedesCounts[s] || 0) + 1;
        });

        const rankingSedes = Object.entries(sedesCounts)
            .map(([sede, count]) => ({ sede, count, porcentaje: totalReportes > 0 ? Math.round((count / totalReportes) * 100) : 0 }))
            .sort((a, b) => b.count - a.count);

        const sedeMasReportada = rankingSedes[0]?.sede || 'Principal';

        // 5. Áreas más reportadas
        const areasCounts: Record<string, number> = {};
        allReports.forEach(r => {
            const a = r.area || 'Operaciones';
            areasCounts[a] = (areasCounts[a] || 0) + 1;
        });

        const rankingAreas = Object.entries(areasCounts)
            .map(([area, count]) => ({ area, count, porcentaje: totalReportes > 0 ? Math.round((count / totalReportes) * 100) : 0 }))
            .sort((a, b) => b.count - a.count);

        const areaMasReportada = rankingAreas[0]?.area || 'General';

        // 6. Síntesis de propuestas de mejora de los trabajadores
        const propuestasTextos = allReports
            .map(r => r.propuestaMejora)
            .filter(Boolean)
            .slice(0, 5);

        return {
            totalReportes,
            totalTrabajadores,
            rankingClasificaciones,
            riesgoMasReportado,
            rankingFactores,
            severidadCounts,
            porcentajeCriticoAlto,
            severidadPredominante,
            rankingSedes,
            sedeMasReportada,
            rankingAreas,
            areaMasReportada,
            propuestasTextos,
            allReports
        };
    }, [inboxPublico, participacionesList]);

    // Color por categoría GTC-45
    const getCatColor = (cat: string) => {
        switch (cat) {
            case 'Biomecánicos': return 'from-teal-500 to-emerald-600 bg-teal-500 text-teal-600 border-teal-200 dark:border-teal-800';
            case 'Condiciones de Seguridad': return 'from-amber-500 to-orange-600 bg-amber-500 text-amber-600 border-amber-200 dark:border-amber-800';
            case 'Físico': return 'from-blue-500 to-indigo-600 bg-blue-500 text-blue-600 border-blue-200 dark:border-blue-800';
            case 'Psicosociales': return 'from-purple-500 to-violet-600 bg-purple-500 text-purple-600 border-purple-200 dark:border-purple-800';
            case 'Biológico': return 'from-rose-500 to-red-600 bg-rose-500 text-rose-600 border-rose-200 dark:border-rose-800';
            case 'Químico': return 'from-yellow-500 to-amber-600 bg-yellow-500 text-yellow-600 border-yellow-200 dark:border-yellow-800';
            default: return 'from-slate-500 to-zinc-600 bg-slate-500 text-slate-600 border-slate-200 dark:border-slate-800';
        }
    };

    // ─── ACCIÓN: ENVIAR CONSOLIDADO ESTADÍSTICO A LA MATRIZ IPEVR ─────────────
    const handleSendConsolidado = () => {
        const topFactoresStr = stats.rankingFactores.length > 0 
            ? stats.rankingFactores.map(f => `${f.factor} (${f.porcentaje}%)`).join(', ') 
            : 'Múltiples factores identificados en la evaluación colectiva';

        const resumenPropuestasStr = stats.propuestasTextos.length > 0
            ? stats.propuestasTextos.join('. ')
            : 'Implementar medidas correctivas prioritarias en ergonomía, condiciones locativas y capacitación continua en autocuidado.';

        // Objeto consolidado sin nombres individuales, basado en la base estadística
        const consolidadoData = {
            proceso: stats.areaMasReportada || 'Consolidado Poblacional',
            zona: `Sedes principales (${stats.rankingSedes.slice(0, 3).map(s => s.sede).join(', ')})`,
            actividad: 'Actividades representativas de la población trabajadora',
            tarea: `Consolidado de tareas con mayor frecuencia (${stats.areaMasReportada})`,
            rutinaria: 'Sí',
            peligroClasificacion: stats.riesgoMasReportado.cat || 'Biomecánicos',
            peligros: `Consolidado Estadístico de Participación (N = ${stats.totalTrabajadores} trabajadores evaluados). El ${stats.riesgoMasReportado.porcentaje}% de la población reportó exposición crítica a: ${topFactoresStr}.`,
            efectosPosibles: `Impacto en la salud consolidado: Fatiga física, molestias osteomusculares y riesgo de ausentismo reportado por la comunidad laboral.`,
            severidadPercibida: stats.severidadPredominante,
            controlesExistentes: `Controles actuales registrados por la población: Pausas activas y medidas básicas evidenciadas por los colaboradores.`,
            suficientes: false,
            sugeridoIngenieria: `Propuesta de Mejora Colectiva: ${resumenPropuestasStr}`,
            sugeridoEliminacion: '',
            sugeridoAdministrativo: `Programa de Vigilancia Epidemiológica enfocado en ${stats.riesgoMasReportado.cat} con seguimiento semestral a las áreas con mayor índice de reporte.`,
            sugeridoEPP: 'Verificación y dotación oportuna de elementos de confort ergonómico y seguridad personal.',
            trabajadorNombre: `Consolidado Estadístico Comunitario (N = ${stats.totalTrabajadores} Colaboradores)`,
            trabajadorCedula: 'ESTADISTICA-COMUNITARIA',
            cargo: 'Población Trabajadora General'
        };

        onApplyConsolidadoToMatrix(consolidadoData);
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl h-[92vh] max-h-[900px] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* ── Header con Diseño Somos SST ── */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                            <BarChart3 size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight flex items-center gap-2">
                                Base Estadística de Participación IPEVR
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300/40">
                                    Anonimizada
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                                Análisis cuantitativo de peligros reportados por la comunidad laboral para la Matriz Oficial
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Contenido con Métricas y Gráficas ── */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
                    
                    {/* 1. KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 shadow-xs flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-teal-600" /> Población Evaluada
                            </span>
                            <div className="mt-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                                    {stats.totalTrabajadores}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-1.5 font-medium">
                                    colaboradores ({stats.totalReportes} reportes)
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-950/20 shadow-xs flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Riesgo #1 Más Reportado
                            </span>
                            <div className="mt-2">
                                <span className="text-lg font-black text-teal-900 dark:text-teal-200 block truncate" title={stats.riesgoMasReportado.cat}>
                                    {stats.riesgoMasReportado.cat}
                                </span>
                                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                                    {stats.riesgoMasReportado.porcentaje}% del total de reportes
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Severidad Crítica / Alta
                            </span>
                            <div className="mt-2">
                                <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                                    {stats.porcentajeCriticoAlto}%
                                </span>
                                <span className="text-[11px] text-amber-700 dark:text-amber-300 ml-1.5 font-medium">
                                    nivel prioritario GTC-45
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Sede / Área Clave
                            </span>
                            <div className="mt-2">
                                <span className="text-base font-black text-blue-900 dark:text-blue-200 block truncate" title={stats.sedeMasReportada}>
                                    {stats.sedeMasReportada.split('(')[0]}
                                </span>
                                <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium truncate block">
                                    Área: {stats.areaMasReportada}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Gráfica de Familias de Peligro GTC-45 */}
                    <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-teal-600" />
                                    Distribución de Peligros Reportados por Categoría GTC-45
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                    Porcentaje de colaboradores que identificaron cada familia de riesgo
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">Total: {stats.totalReportes} reportes</span>
                        </div>

                        <div className="space-y-3">
                            {stats.rankingClasificaciones.map(({ cat, count, porcentaje }, idx) => (
                                <div key={cat} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 text-slate-400 font-black text-[10px]">#{idx + 1}</span>
                                            <span className="font-bold text-slate-800 dark:text-zinc-200">{cat}</span>
                                            {idx === 0 && count > 0 && (
                                                <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[9px] font-black uppercase">
                                                    Mayor Incidencia
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 font-mono">
                                            <span className="text-slate-500 dark:text-zinc-400 text-[11px]">{count} votos</span>
                                            <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs w-10 text-right">{porcentaje}%</span>
                                        </div>
                                    </div>
                                    {/* Barra horizontal de porcentaje */}
                                    <div className="w-full h-3 rounded-full bg-slate-200/70 dark:bg-zinc-800 overflow-hidden relative">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getCatColor(cat)}`}
                                            style={{ width: `${Math.max(porcentaje, count > 0 ? 5 : 0)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Top Factores de Peligro Específicos & Severidad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Top Factores Específicos */}
                        <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-teal-600" /> Top Factores de Peligro Más Frecuentes
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
                                    Condiciones específicas señaladas en los formularios
                                </p>

                                <div className="space-y-2">
                                    {stats.rankingFactores.length > 0 ? (
                                        stats.rankingFactores.map(({ factor, count, porcentaje }, idx) => (
                                            <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-700/70 flex items-center justify-between">
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    <span className="w-4 h-4 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate text-[11px]">{factor}</span>
                                                </div>
                                                <span className="font-mono font-bold text-teal-600 dark:text-teal-400 shrink-0 text-xs">
                                                    {count} ({porcentaje}%)
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-slate-400 text-xs italic">
                                            No hay factores específicos registrados aún.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Distribución de Severidad Percibida */}
                        <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <PieChart className="w-3.5 h-3.5 text-teal-600" /> Percepción de Severidad y Urgencia
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
                                    Calificación otorgada por los colaboradores
                                </p>

                                {/* Barra segmentada de Severidad */}
                                <div className="w-full h-4 rounded-full bg-slate-200/80 dark:bg-zinc-800 overflow-hidden flex mb-3 shadow-inner">
                                    {stats.totalReportes > 0 ? (
                                        <>
                                            <div style={{ width: `${(stats.severidadCounts['Crítica'] / stats.totalReportes) * 100}%` }} className="bg-rose-500 h-full transition-all" title="Crítica" />
                                            <div style={{ width: `${(stats.severidadCounts['Alta'] / stats.totalReportes) * 100}%` }} className="bg-orange-500 h-full transition-all" title="Alta" />
                                            <div style={{ width: `${(stats.severidadCounts['Media'] / stats.totalReportes) * 100}%` }} className="bg-amber-500 h-full transition-all" title="Media" />
                                            <div style={{ width: `${(stats.severidadCounts['Baja'] / stats.totalReportes) * 100}%` }} className="bg-emerald-500 h-full transition-all" title="Baja" />
                                        </>
                                    ) : (
                                        <div className="w-full bg-slate-300 dark:bg-zinc-700 h-full" />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40 flex justify-between items-center">
                                        <span className="font-bold text-rose-800 dark:text-rose-300 text-[11px]">Crítica</span>
                                        <span className="font-mono font-black text-rose-700 dark:text-rose-400">{stats.severidadCounts['Crítica']} ({stats.totalReportes > 0 ? Math.round((stats.severidadCounts['Crítica'] / stats.totalReportes) * 100) : 0}%)</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-800/40 flex justify-between items-center">
                                        <span className="font-bold text-orange-800 dark:text-orange-300 text-[11px]">Alta</span>
                                        <span className="font-mono font-black text-orange-700 dark:text-orange-400">{stats.severidadCounts['Alta']} ({stats.totalReportes > 0 ? Math.round((stats.severidadCounts['Alta'] / stats.totalReportes) * 100) : 0}%)</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 flex justify-between items-center">
                                        <span className="font-bold text-amber-800 dark:text-amber-300 text-[11px]">Media</span>
                                        <span className="font-mono font-black text-amber-700 dark:text-amber-400">{stats.severidadCounts['Media']} ({stats.totalReportes > 0 ? Math.round((stats.severidadCounts['Media'] / stats.totalReportes) * 100) : 0}%)</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 flex justify-between items-center">
                                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">Baja</span>
                                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">{stats.severidadCounts['Baja']} ({stats.totalReportes > 0 ? Math.round((stats.severidadCounts['Baja'] / stats.totalReportes) * 100) : 0}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* 4. Banner Normativo y Metodológico */}
                    <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-teal-900 dark:text-teal-200 text-xs">
                                Integración Estadística Anonimizada (Dec. 1072/15 Art. 2.2.4.6.15)
                            </h4>
                            <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 mt-0.5 leading-relaxed">
                                Al enviar el <strong>Consolidado Estadístico</strong>, la Matriz IPEVR Oficial no registrará nombres individuales de los colaboradores, sino el hallazgo colectivo representativo de los <strong>{stats.totalTrabajadores} trabajadores participantes</strong>. Esto garantiza la confidencialidad y cumple con los estándares de auditoría del SG-SST.
                            </p>
                        </div>
                    </div>

                </div>

                {/* ── Footer con Botón Primario de Envío Estadístico a la Matriz ── */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all text-xs active:scale-95 shadow-2xs cursor-pointer"
                    >
                        Cerrar Analítica
                    </button>

                    <button
                        type="button"
                        onClick={handleSendConsolidado}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-md shadow-teal-600/25 active:scale-95 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Enviar Consolidado Estadístico a la Matriz IPEVR</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div>
    );
}
