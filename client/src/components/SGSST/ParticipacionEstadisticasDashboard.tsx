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
    CheckCircle2,
    Flame,
    Target
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
    const [isAuditListOpen, setIsAuditListOpen] = useState(false);

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
                cargo: item.trabajador?.cargo || 'Colaborador Operativo',
                centroTrabajo: item.data?.centroTrabajo || 'Bogotá D.C.',
                area: item.data?.area || item.data?.proceso || 'Operaciones',
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

            // Filtrar borradores vacíos
            if (!nombre && !cedula && !peligros && !tarea && !actividad) {
                return;
            }
            if (isDefaultBlankTitle && !nombre && !cedula && !peligros) {
                return;
            }

            // Deduplicación inteligente por ID o Cédula
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
                cargo: trabajador.cargo || 'Personal Operativo',
                centroTrabajo: item.formData?.centroTrabajo || 'Bogotá D.C.',
                area: item.formData?.proceso || 'Operaciones',
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

    // ─── 2. AGRUPACIÓN Y PONDERACIÓN POR CARGO, ÁREA, ZONA Y PELIGRO GTC-45 ──────
    const weightedClusters = useMemo(() => {
        const clusterMap = new Map<string, any>();

        filteredReports.forEach(r => {
            const cargo = r.cargo?.trim() || 'Personal Operativo';
            const area = r.area?.trim() || 'Operaciones';
            const cat = r.peligroClasificacion || 'Condiciones de Seguridad';

            const clusterKey = `${cargo.toLowerCase()}__${area.toLowerCase()}__${cat.toLowerCase()}`;

            if (!clusterMap.has(clusterKey)) {
                clusterMap.set(clusterKey, {
                    key: clusterKey,
                    cargo,
                    area,
                    zonas: new Set<string>(),
                    peligroClasificacion: cat,
                    reportes: [],
                    reportIds: [],
                    factoresSet: new Set<string>(),
                    actividadesList: [],
                    tareasList: [],
                    severidades: [],
                    controlesList: [],
                    propuestasList: []
                });
            }

            const c = clusterMap.get(clusterKey);
            c.reportes.push(r);
            if (r.id) c.reportIds.push(r.id);
            if (r.inboxId) c.reportIds.push(r.inboxId);
            if (r.centroTrabajo) c.zonas.add(r.centroTrabajo);
            if (r.actividad) c.actividadesList.push(r.actividad);
            if (r.tarea) c.tareasList.push(r.tarea);
            if (r.severidadPercibida) c.severidades.push(r.severidadPercibida);
            if (r.controlesExistentes) c.controlesList.push(r.controlesExistentes);
            if (r.propuestaMejora) c.propuestasList.push(r.propuestaMejora);

            if (Array.isArray(r.factoresSeleccionados)) {
                r.factoresSeleccionados.forEach((f: string) => c.factoresSet.add(f));
            }
        });

        // Convertir y calcular puntuación de ponderación (Riesgo Alto / Crítico + Repetición)
        const clusters = Array.from(clusterMap.values()).map((c, idx) => {
            const reportesCount = c.reportes.length;

            // Severidad máxima
            let maxSeveridad: 'Crítica' | 'Alta' | 'Media' | 'Baja' = 'Baja';
            if (c.severidades.includes('Crítica')) maxSeveridad = 'Crítica';
            else if (c.severidades.includes('Alta')) maxSeveridad = 'Alta';
            else if (c.severidades.includes('Media')) maxSeveridad = 'Media';

            // Puntuación ponderada:
            // Crítica: 50 pts | Alta: 35 pts | Media: 20 pts | Baja: 5 pts
            // + Repetición por cargo: (reportesCount * 12 pts)
            let severidadScore = 20;
            if (maxSeveridad === 'Crítica') severidadScore = 55;
            else if (maxSeveridad === 'Alta') severidadScore = 38;
            else if (maxSeveridad === 'Media') severidadScore = 22;
            else severidadScore = 8;

            const ponderacionScore = severidadScore + (reportesCount * 12);

            // Actividad y tarea principal
            const actividad = c.actividadesList.find((a: string) => a && a !== 'General') || c.actividadesList[0] || `Actividades del área de ${c.area}`;
            const tarea = c.tareasList.find(Boolean) || `Labores propias de ${c.cargo}`;
            const zona = Array.from(c.zonas).join(', ') || 'Sedes principales';
            const factores = Array.from(c.factoresSet);

            const isFullyApplied = c.reportes.every((r: any) => r.status === 'applied_to_matrix');

            // Síntesis de controles y propuestas
            const controlesExistentes = c.controlesList.filter(Boolean).slice(0, 3).join('. ') || 'Pausas activas y medidas básicas reportadas en puesto.';
            const propuestasMejora = c.propuestasList.filter(Boolean).slice(0, 3).join('. ') || 'Implementar controles ergonómicos, mantenimiento de áreas y capacitación continua.';

            return {
                id: `cluster-${idx}`,
                key: c.key,
                cargo: c.cargo,
                area: c.area,
                zona,
                peligroClasificacion: c.peligroClasificacion,
                reportesCount,
                reportes: c.reportes,
                reportIds: c.reportIds,
                factores,
                maxSeveridad,
                ponderacionScore,
                actividad,
                tarea,
                controlesExistentes,
                propuestasMejora,
                isFullyApplied
            };
        });

        // Ordenar: primero los de mayor puntuación (Riesgo Alto / Crítico y mayor repetición)
        return clusters.sort((a, b) => b.ponderacionScore - a.ponderacionScore);
    }, [filteredReports]);

    // ─── 3. CÁLCULOS ESTADÍSTICOS GENERALES ─────────────────────────────────────
    const stats = useMemo(() => {
        const totalReportes = filteredReports.length;
        const uniqueWorkers = new Set(filteredReports.map(r => r.cedula || r.nombre).filter(Boolean));
        const totalTrabajadores = uniqueWorkers.size || (totalReportes > 0 ? totalReportes : 0);

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

        return {
            totalReportes,
            totalTrabajadores,
            rankingClasificaciones,
            riesgoMasReportado,
            severidadCounts,
            porcentajeCriticoAlto
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

    // ─── 4. DISPARAR APROBACIÓN DE UN CLUSTER PONDERADO ESPECÍFICO ────────────
    const handleApplyCluster = (cluster: any) => {
        const topFactoresStr = cluster.factores.length > 0 
            ? cluster.factores.join(', ') 
            : cluster.tarea;

        // Construir datos estructurados para la Matriz Oficial
        const consolidadoData = {
            id: cluster.id,
            reportIds: cluster.reportIds,
            proceso: cluster.area,
            cargo: cluster.cargo,
            zona: cluster.zona,
            actividad: cluster.actividad,
            tarea: cluster.tarea,
            rutinaria: 'Sí',
            peligroClasificacion: cluster.peligroClasificacion,
            severidadPercibida: cluster.maxSeveridad,
            nro_expuestos: cluster.reportesCount,
            peligros: `Consolidado de ${cluster.reportesCount} reportes en el cargo ${cluster.cargo} (${cluster.area}). Factores recurrentes: ${topFactoresStr}.`,
            efectosPosibles: `Impacto en la salud: Fatiga física, molestias musculares y riesgo de incapacidad identificados por el personal expuesto.`,
            controlesExistentes: cluster.controlesExistentes,
            suficientes: false,
            sugeridoEliminacion: '',
            sugeridoIngenieria: `Propuesta de Mejora Colectiva: ${cluster.propuestasMejora}`,
            sugeridoAdministrativo: `Programa de Vigilancia Epidemiológica enfocado en ${cluster.peligroClasificacion} con seguimiento bimensual al cargo ${cluster.cargo}.`,
            sugeridoEPP: 'Verificación, recambio y dotación oportuna de elementos de protección personal y confort.',
            peorConsecuencia: 'Accidente de trabajo o enfermedad laboral con incapacidad permanente parcial',
            trabajadorNombre: `Consolidado Ponderado: ${cluster.cargo} (N = ${cluster.reportesCount} Colaboradores)`,
            trabajadorCedula: 'ESTADISTICA-GTC45'
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
                            <Target size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight flex items-center gap-2">
                                Base Estadística y Ponderación GTC-45
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300/40">
                                    Matriz Oficial
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                                Agrupación por Cargo, Área y Repetición de Riesgos Altos para Aprobación Colectiva
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

                {/* ── Contenido con Ponderación y Gráficas ── */}
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

                        <div className="p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5 text-rose-600" /> Riesgo Crítico / Alto
                            </span>
                            <div className="mt-2">
                                <span className="text-2xl font-black text-rose-900 dark:text-rose-200">
                                    {stats.porcentajeCriticoAlto}%
                                </span>
                                <span className="text-[11px] text-rose-700 dark:text-rose-300 ml-1.5 font-medium">
                                    prioridad en Matriz GTC-45
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-950/20 shadow-xs flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Peligro Más Frecuente
                            </span>
                            <div className="mt-2">
                                <span className="text-lg font-black text-teal-900 dark:text-teal-200 block truncate" title={stats.riesgoMasReportado.cat}>
                                    {stats.riesgoMasReportado.cat}
                                </span>
                                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                                    {stats.totalReportes > 0 ? `${stats.riesgoMasReportado.porcentaje}% de recurrencia` : 'Sin datos'}
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-blue-600" /> Peligros Ponderados
                            </span>
                            <div className="mt-2">
                                <span className="text-2xl font-black text-blue-900 dark:text-blue-200">
                                    {weightedClusters.length}
                                </span>
                                <span className="text-[11px] text-blue-700 dark:text-blue-300 ml-1.5 font-medium">
                                    grupos por Cargo / Área
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. SECCIÓN PRINCIPAL: PELIGROS PRIORITARIOS PONDERADOS PARA LA MATRIZ */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-teal-600" />
                                    Peligros Prioritarios Ponderados por Cargo, Área y Repetición (GTC-45)
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                    Solo se aprueban e integran a la matriz oficial los peligros colectivos con mayor ponderación y severidad
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
                                Ordenado por Ponderación GTC-45
                            </span>
                        </div>

                        {weightedClusters.length === 0 ? (
                            <div className="text-center py-8 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 text-slate-400">
                                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-500" />
                                <p className="font-semibold text-xs">No hay peligros reportados aún para ponderar</p>
                                <p className="text-[11px] mt-0.5">Comparte el código QR o registra participaciones del personal para generar la base estadística.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3.5">
                                {weightedClusters.map((cluster, idx) => {
                                    const isPriority1 = idx === 0;
                                    const isCritical = cluster.maxSeveridad === 'Crítica' || cluster.maxSeveridad === 'Alta';

                                    return (
                                        <div
                                            key={cluster.id}
                                            className={`p-4 rounded-3xl border transition-all shadow-xs ${
                                                isPriority1
                                                    ? 'bg-gradient-to-r from-teal-50/70 via-white to-emerald-50/40 dark:from-teal-950/30 dark:via-zinc-900 dark:to-emerald-950/20 border-teal-300/80 dark:border-teal-700/80 shadow-md shadow-teal-500/5'
                                                    : 'bg-white dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                            isPriority1 
                                                                ? 'bg-rose-500 text-white shadow-xs' 
                                                                : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                                                        }`}>
                                                            Prioridad #{idx + 1} • Ponderación: {cluster.ponderacionScore} pts
                                                        </span>

                                                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${getCatColor(cluster.peligroClasificacion)}`}>
                                                            {cluster.peligroClasificacion}
                                                        </span>

                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                                            cluster.maxSeveridad === 'Crítica' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                                                            cluster.maxSeveridad === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                                                            'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                        }`}>
                                                            Severidad: {cluster.maxSeveridad}
                                                        </span>

                                                        {cluster.isFullyApplied && (
                                                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-black flex items-center gap-1">
                                                                <CheckCircle2 size={11} /> Integrado en Matriz
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                                        <span>Cargo: {cluster.cargo}</span>
                                                        <span className="text-slate-400 font-normal">• Área: {cluster.area}</span>
                                                        <span className="text-slate-400 font-normal">• Sede: {cluster.zona}</span>
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-xl border border-teal-200/60 dark:border-teal-800/60">
                                                        👥 {cluster.reportesCount} {cluster.reportesCount === 1 ? 'reporte coincidente' : 'reportes coincidentes'}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyCluster(cluster)}
                                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer ${
                                                            cluster.isFullyApplied
                                                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200'
                                                                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/25'
                                                        }`}
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>{cluster.isFullyApplied ? 'Re-integrar a Matriz' : 'Aprobar e Integrar a Matriz'}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Detalles específicos del grupo */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-[11px]">
                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-slate-500 dark:text-zinc-400 block uppercase text-[10px]">Labor / Tarea Expuesta:</span>
                                                    <p className="text-slate-800 dark:text-zinc-200 font-medium">"{cluster.tarea}"</p>
                                                </div>

                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-slate-500 dark:text-zinc-400 block uppercase text-[10px]">Factores Específicos Reportados:</span>
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {cluster.factores.length > 0 ? (
                                                            cluster.factores.map((f: string, i: number) => (
                                                                <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-semibold">
                                                                    {f}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 italic">Condición general identificada</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-teal-700 dark:text-teal-400 block uppercase text-[10px]">Propuesta de Mejora Colectiva:</span>
                                                    <p className="text-teal-900 dark:text-teal-200 italic font-medium line-clamp-2">
                                                        "{cluster.propuestasMejora}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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
                                    Porcentaje acumulado de la comunidad laboral por clasificación de riesgo
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

                    {/* 4. Sección Desplegable de Auditoría de Reportes Individuales */}
                    <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsAuditListOpen(prev => !prev)}
                            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                            <div className="flex items-center gap-2.5">
                                <Layers className="w-4 h-4 text-teal-600" />
                                <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                                    Auditoría de Reportes de Origen ({filteredReports.length} reportes evaluados)
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    (Permite inspeccionar y descartar pruebas residuales)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                                    {isAuditListOpen ? 'Ocultar auditoría' : 'Ver detalle individual'}
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
                                                        {r.cargo && (
                                                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                                                                • {r.cargo}
                                                            </span>
                                                        )}
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

                    {/* 5. Banner Normativo */}
                    <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-teal-900 dark:text-teal-200 text-xs">
                                Integración Colectiva Ponderada a la Matriz IPEVR (Dec. 1072/15 Art. 2.2.4.6.15)
                            </h4>
                            <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 mt-0.5 leading-relaxed">
                                Ya no se integran registros individuales con nombres propios. El sistema pondera automáticamente la repetición de los peligros más críticos por cargo y área, integrando hallazgos estadísticos consolidados para alimentar de forma técnica la Matriz Oficial y su Plan de Trabajo.
                            </p>
                        </div>
                    </div>

                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all text-xs active:scale-95 shadow-2xs cursor-pointer"
                    >
                        Cerrar Analítica
                    </button>

                    {weightedClusters.length > 0 && (
                        <button
                            type="button"
                            onClick={() => handleApplyCluster(weightedClusters[0])}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-md shadow-teal-600/25 active:scale-95 transition-all cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Integrar Peligro #1 Más Crítico a la Matriz</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
