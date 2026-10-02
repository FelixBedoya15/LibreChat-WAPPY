import React, { useMemo, useState } from 'react';
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
    Lightbulb,
    Trash2,
    Filter,
    ChevronDown,
    ChevronUp,
    Inbox,
    Eye,
    Calendar,
    CheckCircle2
} from 'lucide-react';

interface ParticipacionEstadisticasDashboardProps {
    inboxPublico: any[];
    participacionesList: any[];
    onApplyConsolidadoToMatrix: (consolidadoData: any) => void;
    onDismissInbox?: (reportId: string) => void;
    onClose: () => void;
}

export default function ParticipacionEstadisticasDashboard({
    inboxPublico,
    participacionesList,
    onApplyConsolidadoToMatrix,
    onDismissInbox,
    onClose
}: ParticipacionEstadisticasDashboardProps) {

    const [filterSource, setFilterSource] = useState<'all' | 'inbox' | 'local'>('all');
    const [isAuditListOpen, setIsAuditListOpen] = useState(true);

    // ─── 1. EXTRACCIÓN, FILTRADO DE BORRADORES Y DEDUPLICACIÓN ──────────────────
    const unifiedReports = useMemo(() => {
        const reportMap = new Map<string, any>();

        // A) Procesar reportes del Inbox Público (enviados por trabajadores desde el QR / portal)
        (Array.isArray(inboxPublico) ? inboxPublico : []).forEach((item: any, idx: number) => {
            const nombre = item.trabajador?.nombre?.trim() || '';
            const cedula = item.trabajador?.cedula?.trim() || '';
            const peligros = item.data?.peligros?.trim() || item.data?.descripcion?.trim() || '';
            const tarea = item.data?.tarea?.trim() || '';
            const actividad = item.data?.actividad?.trim() || '';

            // Ignorar elementos absolutamente vacíos
            if (!nombre && !cedula && !peligros && !tarea && !actividad) {
                return;
            }

            // Normalizar categoría de peligro GTC-45
            const rawCat = item.data?.peligroClasificacion?.trim();
            let cat = 'Condiciones de Seguridad';
            if (rawCat) {
                if (rawCat.toLowerCase().includes('biomec')) cat = 'Biomecánicos';
                else if (rawCat.toLowerCase().includes('seguridad') || rawCat.toLowerCase().includes('locativ') || rawCat.toLowerCase().includes('mec')) cat = 'Condiciones de Seguridad';
                else if (rawCat.toLowerCase().includes('físic') || rawCat.toLowerCase().includes('fisic')) cat = 'Físico';
                else if (rawCat.toLowerCase().includes('psico')) cat = 'Psicosociales';
                else if (rawCat.toLowerCase().includes('biol')) cat = 'Biológico';
                else if (rawCat.toLowerCase().includes('quím') || rawCat.toLowerCase().includes('quim')) cat = 'Químico';
                else if (rawCat.toLowerCase().includes('natural')) cat = 'Fenómenos Naturales';
                else cat = rawCat;
            } else if (peligros) {
                const pLower = peligros.toLowerCase();
                if (pLower.includes('postur') || pLower.includes('ergon') || pLower.includes('carg') || pLower.includes('repetitiv') || pLower.includes('esfuerzo')) cat = 'Biomecánicos';
                else if (pLower.includes('ruido') || pLower.includes('iluminac') || pLower.includes('luz') || pLower.includes('calor') || pLower.includes('frio') || pLower.includes('vibrac')) cat = 'Físico';
                else if (pLower.includes('estrés') || pLower.includes('estres') || pLower.includes('acoso') || pLower.includes('carga mental')) cat = 'Psicosociales';
                else if (pLower.includes('quimic') || pLower.includes('químic') || pLower.includes('vapor') || pLower.includes('solvente')) cat = 'Químico';
                else if (pLower.includes('virus') || pLower.includes('bacteri') || pLower.includes('hongo') || pLower.includes('mordedura')) cat = 'Biológico';
                else cat = 'Condiciones de Seguridad';
            }

            const itemKey = item.id ? String(item.id) : `inbox-${cedula || nombre || idx}`;

            reportMap.set(itemKey, {
                id: itemKey,
                inboxId: item.id,
                source: 'inbox',
                status: item.status || 'pending',
                nombre: nombre || 'Colaborador Anónimo',
                cedula: cedula || '',
                cargo: item.trabajador?.cargo || 'Colaborador',
                centroTrabajo: item.data?.centroTrabajo || 'Bogotá D.C.',
                area: item.data?.area || item.data?.proceso || 'Operativo / Administrativo',
                actividad: actividad || 'General',
                tarea: tarea || '',
                peligroClasificacion: cat,
                factoresSeleccionados: Array.isArray(item.data?.factoresSeleccionados) ? item.data.factoresSeleccionados : [],
                peligros: peligros || '',
                consecuencias: item.data?.consecuencias || item.data?.efectosPosibles || '',
                severidadPercibida: item.data?.severidadPercibida || 'Media',
                controlesExistentes: item.data?.controlesExistentes || '',
                propuestaMejora: item.data?.propuestaMejora || item.data?.sugeridoIngenieria || '',
                rutinaria: item.data?.rutinaria || 'Sí',
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
            });
        });

        // B) Procesar participaciones locales en el editor
        (Array.isArray(participacionesList) ? participacionesList : []).forEach((item: any, idx: number) => {
            const trabajador = item.trabajadoresList?.[0] || {};
            const nombre = trabajador.nombre?.trim() || '';
            const cedula = trabajador.cedula?.trim() || '';
            const peligros = item.formData?.peligros?.trim() || '';
            const tarea = item.formData?.tarea?.trim() || '';
            const actividad = item.formData?.actividad?.trim() || '';
            const isDefaultBlankTitle = item.title === 'Nueva Participación';

            // ⚠️ FILTRAR BORRADORES VACÍOS:
            // Si no tiene nombre, ni cédula, ni peligros, ni tarea -> es un formulario en blanco, NO contar!
            if (!nombre && !cedula && !peligros && !tarea && !actividad) {
                return;
            }
            if (isDefaultBlankTitle && !nombre && !cedula && !peligros) {
                return;
            }

            // ⚠️ DEDUPLICACIÓN INTELIGENTE:
            // 1. Coincidencia por ID de Inbox explícito
            if (item.inboxItemId && reportMap.has(String(item.inboxItemId))) {
                const existing = reportMap.get(String(item.inboxItemId));
                reportMap.set(String(item.inboxItemId), {
                    ...existing,
                    source: 'synced',
                    localId: item.id,
                    status: item.status || existing.status,
                    peligros: peligros || existing.peligros,
                    controlesExistentes: item.formData?.controlesExistentes || existing.controlesExistentes,
                    propuestaMejora: item.formData?.sugeridoIngenieria || existing.propuestaMejora
                });
                return;
            }

            // 2. Coincidencia por cédula o nombre con un reporte existente del inbox
            let matchedKey: string | null = null;
            for (const [key, existing] of reportMap.entries()) {
                const sameCedula = cedula && existing.cedula && cedula === existing.cedula;
                const sameName = nombre && existing.nombre && nombre.toLowerCase() === existing.nombre.toLowerCase();
                if (sameCedula || sameName) {
                    matchedKey = key;
                    break;
                }
            }

            if (matchedKey) {
                const existing = reportMap.get(matchedKey);
                reportMap.set(matchedKey, {
                    ...existing,
                    source: 'synced',
                    localId: item.id,
                    status: item.status || existing.status,
                    peligros: peligros || existing.peligros,
                    controlesExistentes: item.formData?.controlesExistentes || existing.controlesExistentes,
                    propuestaMejora: item.formData?.sugeridoIngenieria || existing.propuestaMejora
                });
                return;
            }

            // 3. Es un reporte local genuino nuevo
            const rawCat = item.formData?.peligroClasificacion?.trim();
            let cat = 'Condiciones de Seguridad';
            if (rawCat) {
                if (rawCat.toLowerCase().includes('biomec')) cat = 'Biomecánicos';
                else if (rawCat.toLowerCase().includes('seguridad') || rawCat.toLowerCase().includes('locativ') || rawCat.toLowerCase().includes('mec')) cat = 'Condiciones de Seguridad';
                else if (rawCat.toLowerCase().includes('físic') || rawCat.toLowerCase().includes('fisic')) cat = 'Físico';
                else if (rawCat.toLowerCase().includes('psico')) cat = 'Psicosociales';
                else if (rawCat.toLowerCase().includes('biol')) cat = 'Biológico';
                else if (rawCat.toLowerCase().includes('quím') || rawCat.toLowerCase().includes('quim')) cat = 'Químico';
                else if (rawCat.toLowerCase().includes('natural')) cat = 'Fenómenos Naturales';
                else cat = rawCat;
            }

            const localKey = item.id ? String(item.id) : `local-${cedula || nombre || idx}`;
            reportMap.set(localKey, {
                id: localKey,
                localId: item.id,
                source: 'local',
                status: item.status || 'pending',
                nombre: nombre || 'Colaborador Registrado',
                cedula: cedula || '',
                cargo: trabajador.cargo || 'Operativo',
                centroTrabajo: item.formData?.centroTrabajo || 'Bogotá D.C.',
                area: item.formData?.proceso || 'Operativo / Administrativo',
                actividad: actividad || 'General',
                tarea: tarea || '',
                peligroClasificacion: cat,
                factoresSeleccionados: [],
                peligros: peligros || '',
                consecuencias: item.formData?.efectosPosibles || '',
                severidadPercibida: item.formData?.severidadPercibida || 'Media',
                controlesExistentes: item.formData?.controlesExistentes || '',
                propuestaMejora: item.formData?.sugeridoIngenieria || '',
                rutinaria: item.formData?.rutinaria || 'Sí',
                createdAt: item.formData?.fecha ? new Date(item.formData.fecha) : new Date()
            });
        });

        return Array.from(reportMap.values());
    }, [inboxPublico, participacionesList]);

    // Filtrar según selector de origen
    const filteredReports = useMemo(() => {
        if (filterSource === 'inbox') return unifiedReports.filter(r => r.source === 'inbox' || r.source === 'synced');
        if (filterSource === 'local') return unifiedReports.filter(r => r.source === 'local' || r.source === 'synced');
        return unifiedReports;
    }, [unifiedReports, filterSource]);

    // ─── 2. CÁLCULOS ESTADÍSTICOS CONSOLIDADOS ──────────────────────────────────
    const stats = useMemo(() => {
        const totalReportes = filteredReports.length;
        const uniqueWorkers = new Set(filteredReports.map(r => r.cedula || r.nombre).filter(Boolean));
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

        filteredReports.forEach(r => {
            const cat = r.peligroClasificacion;
            if (clasificacionCounts[cat] !== undefined) {
                clasificacionCounts[cat] += 1;
            } else {
                clasificacionCounts['Condiciones de Seguridad'] += 1;
            }
        });

        const rankingClasificaciones = Object.entries(clasificacionCounts)
            .map(([cat, count]) => ({
                cat,
                count,
                porcentaje: totalReportes > 0 ? Math.round((count / totalReportes) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);

        const riesgoMasReportado = rankingClasificaciones[0]?.count > 0 
            ? rankingClasificaciones[0] 
            : { cat: 'Sin reportes aún', count: 0, porcentaje: 0 };

        // 2. Conteo de Factores Específicos
        const factorCounts: Record<string, number> = {};
        filteredReports.forEach(r => {
            if (Array.isArray(r.factoresSeleccionados) && r.factoresSeleccionados.length > 0) {
                r.factoresSeleccionados.forEach((f: string) => {
                    factorCounts[f] = (factorCounts[f] || 0) + 1;
                });
            } else if (r.peligros) {
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

        // 3. Distribución de Severidad
        const severidadCounts: Record<string, number> = {
            'Crítica': 0,
            'Alta': 0,
            'Media': 0,
            'Baja': 0
        };

        filteredReports.forEach(r => {
            const s = r.severidadPercibida;
            if (severidadCounts[s] !== undefined) severidadCounts[s] += 1;
            else severidadCounts['Media'] += 1;
        });

        const porcentajeCriticoAlto = totalReportes > 0
            ? Math.round(((severidadCounts['Crítica'] + severidadCounts['Alta']) / totalReportes) * 100)
            : 0;

        const severidadPredominante = Object.entries(severidadCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Media';

        // 4. Centros de Trabajo / Sedes
        const sedesCounts: Record<string, number> = {};
        filteredReports.forEach(r => {
            const s = r.centroTrabajo || 'Bogotá D.C.';
            sedesCounts[s] = (sedesCounts[s] || 0) + 1;
        });

        const rankingSedes = Object.entries(sedesCounts)
            .map(([sede, count]) => ({ sede, count, porcentaje: totalReportes > 0 ? Math.round((count / totalReportes) * 100) : 0 }))
            .sort((a, b) => b.count - a.count);

        const sedeMasReportada = rankingSedes[0]?.sede || 'Principal';

        // 5. Áreas
        const areasCounts: Record<string, number> = {};
        filteredReports.forEach(r => {
            const a = r.area || 'Operaciones';
            areasCounts[a] = (areasCounts[a] || 0) + 1;
        });

        const rankingAreas = Object.entries(areasCounts)
            .map(([area, count]) => ({ area, count, porcentaje: totalReportes > 0 ? Math.round((count / totalReportes) * 100) : 0 }))
            .sort((a, b) => b.count - a.count);

        const areaMasReportada = rankingAreas[0]?.area || 'General';

        // 6. Textos de propuestas
        const propuestasTextos = filteredReports
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
            propuestasTextos
        };
    }, [filteredReports]);

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

    // ─── 3. ENVIAR CONSOLIDADO ESTADÍSTICO A LA MATRIZ IPEVR ─────────────────
    const handleSendConsolidado = () => {
        if (stats.totalReportes === 0) return;

        const topFactoresStr = stats.rankingFactores.length > 0 
            ? stats.rankingFactores.map(f => `${f.factor} (${f.porcentaje}%)`).join(', ') 
            : 'Múltiples factores identificados en la evaluación colectiva';

        const resumenPropuestasStr = stats.propuestasTextos.length > 0
            ? stats.propuestasTextos.join('. ')
            : 'Implementar medidas preventivas y controles ergonómicos/locativos conforme a la percepción laboral.';

        const consolidadoData = {
            proceso: stats.areaMasReportada || 'Consolidado Poblacional',
            zona: `Sedes principales (${stats.rankingSedes.slice(0, 3).map(s => s.sede).join(', ')})`,
            actividad: 'Actividades representativas de la población trabajadora',
            tarea: `Consolidado de tareas con mayor frecuencia (${stats.areaMasReportada})`,
            rutinaria: 'Sí',
            peligroClasificacion: stats.riesgoMasReportado.cat || 'Condiciones de Seguridad',
            peligros: `Consolidado Estadístico de Participación (N = ${stats.totalTrabajadores} colaboradores evaluados). El ${stats.riesgoMasReportado.porcentaje}% de la población reportó exposición a: ${topFactoresStr}.`,
            efectosPosibles: `Impacto en la salud reportado por la comunidad laboral: Fatiga física, molestias osteomusculares y riesgo de ausentismo.`,
            severidadPercibida: stats.severidadPredominante,
            controlesExistentes: `Controles actuales registrados por la población: Pausas activas y medidas básicas evidenciadas por los colaboradores.`,
            suficientes: false,
            sugeridoIngenieria: `Propuesta de Mejora Colectiva: ${resumenPropuestasStr}`,
            sugeridoEliminacion: '',
            sugeridoAdministrativo: `Programa de Vigilancia Epidemiológica enfocado en ${stats.riesgoMasReportado.cat} con seguimiento periódico a las áreas prioritarias.`,
            sugeridoEPP: 'Verificación y dotación oportuna de elementos de confort ergonómico y protección personal.',
            trabajadorNombre: `Consolidado Estadístico Comunitario (N = ${stats.totalTrabajadores} Colaboradores)`,
            trabajadorCedula: 'ESTADISTICA-COMUNITARIA',
            cargo: 'Población Trabajadora General'
        };

        onApplyConsolidadoToMatrix(consolidadoData);
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl h-[92vh] max-h-[900px] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 backdrop-blur-sm shrink-0">
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
                                Análisis cuantitativo deduplicado sin borradores vacíos para la Matriz Oficial
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Selector de Fuente */}
                        <div className="hidden sm:inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-zinc-800/80 text-[11px] font-bold">
                            <button
                                type="button"
                                onClick={() => setFilterSource('all')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${filterSource === 'all' ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs font-extrabold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'}`}
                            >
                                Todos ({unifiedReports.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterSource('inbox')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${filterSource === 'inbox' ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs font-extrabold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'}`}
                            >
                                Inbox ({unifiedReports.filter(r => r.source === 'inbox' || r.source === 'synced').length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterSource('local')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${filterSource === 'local' ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs font-extrabold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'}`}
                            >
                                Locales ({unifiedReports.filter(r => r.source === 'local' || r.source === 'synced').length})
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs shrink-0"
                            title="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>
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
                                    colaboradores ({stats.totalReportes} {stats.totalReportes === 1 ? 'reporte' : 'reportes'})
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
                                    {stats.totalReportes > 0 ? `${stats.riesgoMasReportado.porcentaje}% del total` : 'Sin datos'}
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

                    {/* 2. Sección de Auditoría y Detalle de Reportes Analizados */}
                    <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsAuditListOpen(prev => !prev)}
                            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                            <div className="flex items-center gap-2.5">
                                <Layers className="w-4 h-4 text-teal-600" />
                                <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                                    Detalle de Reportes Analizados ({filteredReports.length})
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    (Excluye borradores vacíos y duplicados unificados)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                                    {isAuditListOpen ? 'Ocultar detalle' : 'Ver detalle'}
                                </span>
                                {isAuditListOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </div>
                        </button>

                        {isAuditListOpen && (
                            <div className="p-4 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60 space-y-2.5">
                                {filteredReports.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400">
                                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-500" />
                                        <p className="font-semibold text-xs">No hay reportes válidos disponibles</p>
                                        <p className="text-[11px] mt-0.5">Comparte el enlace o código QR para que los trabajadores participen.</p>
                                    </div>
                                ) : (
                                    filteredReports.map((r, idx) => {
                                        const isApplied = r.status === 'applied_to_matrix';
                                        return (
                                            <div
                                                key={r.id || idx}
                                                className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs">
                                                            {r.nombre}
                                                        </span>
                                                        {r.cedula && (
                                                            <span className="text-[10px] font-mono text-slate-400">
                                                                (CC: {r.cedula})
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getCatColor(r.peligroClasificacion)}`}>
                                                            {r.peligroClasificacion}
                                                        </span>
                                                        {r.source === 'inbox' && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-[9px] font-bold">
                                                                📱 Portal Público
                                                            </span>
                                                        )}
                                                        {r.source === 'local' && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[9px] font-bold">
                                                                📋 Registro Local
                                                            </span>
                                                        )}
                                                        {r.source === 'synced' && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[9px] font-bold flex items-center gap-1">
                                                                <CheckCircle2 size={10} /> Unificado
                                                            </span>
                                                        )}
                                                        {isApplied && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-black">
                                                                En Matriz
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                                                        <span>🏢 {r.centroTrabajo}</span>
                                                        <span>• Área: {r.area}</span>
                                                        {r.tarea && <span className="italic truncate max-w-[280px]">"{r.tarea}"</span>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        r.severidadPercibida === 'Crítica' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                                                        r.severidadPercibida === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                                                        'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                    }`}>
                                                        Sev: {r.severidadPercibida}
                                                    </span>

                                                    {r.inboxId && onDismissInbox && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onDismissInbox(r.inboxId)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                            title="Descartar reporte del inbox"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. Gráfica de Familias de Peligro GTC-45 */}
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
                                            <span className="text-slate-500 dark:text-zinc-400 text-[11px]">{count} {count === 1 ? 'voto' : 'votos'}</span>
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

                    {/* 4. Top Factores de Peligro Específicos & Severidad */}
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

                    {/* 5. Banner Normativo y Metodológico */}
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
                        disabled={stats.totalReportes === 0}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs text-white transition-all shadow-md active:scale-95 ${
                            stats.totalReportes === 0 
                                ? 'bg-slate-400 cursor-not-allowed opacity-60' 
                                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-600/25 cursor-pointer'
                        }`}
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
