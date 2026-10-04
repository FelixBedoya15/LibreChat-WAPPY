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
    Target,
    Calculator,
    HelpCircle,
    Info,
    Grid,
    Check,
    FileSpreadsheet,
    Scale
} from 'lucide-react';
import cn from '~/utils/cn';

interface ParticipacionEstadisticasDashboardProps {
    inboxPublico: any[];
    participacionesList: any[];
    onApplyConsolidadoToMatrix: (consolidadoData: any) => void;
    onDismissInbox?: (reportId: string) => void;
    onClose?: () => void;
    isEmbedded?: boolean;
}

export default function ParticipacionEstadisticasDashboard({
    inboxPublico,
    participacionesList,
    onApplyConsolidadoToMatrix,
    onDismissInbox,
    onClose,
    isEmbedded = true
}: ParticipacionEstadisticasDashboardProps) {

    const [activeTab, setActiveTab] = useState<'dashboard' | 'clusters' | 'metodologia'>('dashboard');
    const [filterSource, setFilterSource] = useState<'all' | 'inbox' | 'local'>('all');
    const [isAuditListOpen, setIsAuditListOpen] = useState(false);
    const [isSectionExpanded, setIsSectionExpanded] = useState(true);
    const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
    const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<string | null>(null);

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

    // ─── 2. AGRUPACIÓN Y PONDERACIÓN TÉCNICA OFICIAL GTC-45 ─────────────────────
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

        // Convertir y calcular parámetros matemáticos estrictos de la GTC 45:2012
        const clusters = Array.from(clusterMap.values()).map((c, idx) => {
            const reportesCount = c.reportes.length;

            // Severidad máxima percibida
            let maxSeveridad: 'Crítica' | 'Alta' | 'Media' | 'Baja' = 'Baja';
            if (c.severidades.includes('Crítica')) maxSeveridad = 'Crítica';
            else if (c.severidades.includes('Alta')) maxSeveridad = 'Alta';
            else if (c.severidades.includes('Media')) maxSeveridad = 'Media';

            // ── 1. NIVEL DE EXPOSICIÓN (NE) SEGÚN REPETICIÓN COLECTIVA ──
            // GTC-45: Continua (4), Frecuente (3), Ocasional (2), Esporádica (1)
            let ne = 2;
            let neDesc = 'Ocasional (1 trabajador expuesto)';
            if (reportesCount >= 4) {
                ne = 4;
                neDesc = 'Continua (4+ colaboradores en la tarea)';
            } else if (reportesCount >= 2) {
                ne = 3;
                neDesc = 'Frecuente (2 a 3 colaboradores)';
            }

            // ── 2. NIVEL DE DEFICIENCIA (ND) SEGÚN GRAVEDAD Y CONTROLES ──
            // GTC-45: Muy Alto (10), Alto (6), Medio (2), Bajo (0)
            let nd = 2;
            let ndDesc = 'Medio (Controles existentes mejorables)';
            if (maxSeveridad === 'Crítica') {
                nd = 10;
                ndDesc = 'Muy Alto (Peligros críticos sin controles eficaces)';
            } else if (maxSeveridad === 'Alta') {
                nd = 6;
                ndDesc = 'Alto (Deficiencias significativas reportadas)';
            } else if (maxSeveridad === 'Media') {
                nd = 2;
                ndDesc = 'Medio (Peligros con controles parciales)';
            } else {
                nd = 2;
                ndDesc = 'Bajo (Riesgo tolerable en puesto)';
            }

            // ── 3. NIVEL DE PROBABILIDAD (NP = ND * NE) ──
            const np = nd * ne;
            let npNivel = 'Bajo (B)';
            let npColor = 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-200';
            if (np >= 24) {
                npNivel = 'Muy Alto (MA)';
                npColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200';
            } else if (np >= 10) {
                npNivel = 'Alto (A)';
                npColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200';
            } else if (np >= 6) {
                npNivel = 'Medio (M)';
                npColor = 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200';
            }

            // ── 4. NIVEL DE CONSECUENCIA (NC) ──
            // GTC-45: Mortal / Catastrófico (100), Muy Grave (60), Grave (25), Leve (10)
            let nc = 25;
            let ncDesc = 'Lesiones con incapacidad laboral temporal';
            if (maxSeveridad === 'Crítica') {
                nc = 100;
                ncDesc = 'Mortal o invalidez permanente';
            } else if (maxSeveridad === 'Alta') {
                nc = 60;
                ncDesc = 'Lesiones graves con incapacidad permanente parcial';
            } else if (maxSeveridad === 'Media') {
                nc = 25;
                ncDesc = 'Lesiones con incapacidad temporal';
            } else {
                nc = 10;
                ncDesc = 'Molestias menores sin incapacidad';
            }

            // ── 5. NIVEL DE RIESGO OFICIAL (NR = NP * NC) ──
            const nr = np * nc;
            let nrNivel: 'I' | 'II' | 'III' | 'IV' = 'IV';
            let nrAceptabilidad = 'Aceptable';
            let nrBadgeClass = 'bg-emerald-500 text-white';
            let heatmapRow = 3; // 0=100, 1=60, 2=25, 3=10
            let heatmapCol = 3; // 0=MA, 1=A, 2=M, 3=B

            // Mapeo a filas y columnas de la Matriz Térmica GTC-45
            if (nc === 100) heatmapRow = 0;
            else if (nc === 60) heatmapRow = 1;
            else if (nc === 25) heatmapRow = 2;
            else heatmapRow = 3;

            if (np >= 24) heatmapCol = 0;
            else if (np >= 10) heatmapCol = 1;
            else if (np >= 6) heatmapCol = 2;
            else heatmapCol = 3;

            if (nr >= 600) {
                nrNivel = 'I';
                nrAceptabilidad = 'No Aceptable (Situación crítica - Intervención Urgente)';
                nrBadgeClass = 'bg-rose-600 text-white shadow-xs';
            } else if (nr >= 150) {
                nrNivel = 'II';
                nrAceptabilidad = 'No Aceptable o Aceptable con Control Específico';
                nrBadgeClass = 'bg-amber-500 text-white shadow-xs';
            } else if (nr >= 40) {
                nrNivel = 'III';
                nrAceptabilidad = 'Mejorable (Aceptable con medidas de intervención)';
                nrBadgeClass = 'bg-yellow-400 text-yellow-950 font-black';
            } else {
                nrNivel = 'IV';
                nrAceptabilidad = 'Aceptable (Mantener controles vigentes)';
                nrBadgeClass = 'bg-teal-600 text-white';
            }

            // Actividad y tarea principal
            const actividad = c.actividadesList.find((a: string) => a && a !== 'General') || c.actividadesList[0] || `Actividades del área de ${c.area}`;
            const tarea = c.tareasList.find(Boolean) || `Labores propias de ${c.cargo}`;
            const zona = Array.from(c.zonas).join(', ') || 'Sedes principales';
            const factores = Array.from(c.factoresSet);

            const isFullyApplied = c.reportes.every((r: any) => r.status === 'applied_to_matrix');

            // Síntesis técnica de controles y propuestas
            const controlesExistentes = c.controlesList.filter(Boolean).slice(0, 3).join('. ') || 'Medidas operativas básicas reportadas por el personal.';
            const propuestasMejora = c.propuestasList.filter(Boolean).slice(0, 3).join('. ') || 'Diseño de controles de ingeniería, pausas activas e inspección periódica.';

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
                actividad,
                tarea,
                controlesExistentes,
                propuestasMejora,
                isFullyApplied,
                // Parámetros oficiales GTC 45
                nd,
                ndDesc,
                ne,
                neDesc,
                np,
                npNivel,
                npColor,
                nc,
                ncDesc,
                nr,
                nrNivel,
                nrAceptabilidad,
                nrBadgeClass,
                heatmapRow,
                heatmapCol,
                heatmapCellKey: `${heatmapRow}-${heatmapCol}`,
                ponderacionScore: nr
            };
        });

        // Ordenar estrictamente por Nivel de Riesgo NR descendente
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

        // Distribución por nivel de riesgo GTC-45 de los clusters
        const nrDistribucion = {
            nivelI: weightedClusters.filter(c => c.nrNivel === 'I').length,
            nivelII: weightedClusters.filter(c => c.nrNivel === 'II').length,
            nivelIII: weightedClusters.filter(c => c.nrNivel === 'III').length,
            nivelIV: weightedClusters.filter(c => c.nrNivel === 'IV').length
        };

        // Ranking de cargos más expuestos
        const cargoMap: Record<string, { count: number; maxNrNivel: string }> = {};
        weightedClusters.forEach(c => {
            if (!cargoMap[c.cargo]) cargoMap[c.cargo] = { count: 0, maxNrNivel: c.nrNivel };
            cargoMap[c.cargo].count += c.reportesCount;
            if (c.nrNivel === 'I') cargoMap[c.cargo].maxNrNivel = 'I';
        });

        const rankingCargos = Object.entries(cargoMap)
            .map(([cargo, data]) => ({ cargo, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalReportes,
            totalTrabajadores,
            rankingClasificaciones,
            riesgoMasReportado,
            severidadCounts,
            porcentajeCriticoAlto,
            nrDistribucion,
            rankingCargos
        };
    }, [filteredReports, weightedClusters]);

    const getCatColor = (cat: string) => {
        switch (cat) {
            case 'Biomecánicos': return {
                gradient: 'from-teal-500 to-emerald-600',
                hex: '#0d9488',
                bg: 'bg-teal-500',
                text: 'text-teal-600',
                badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800'
            };
            case 'Condiciones de Seguridad': return {
                gradient: 'from-amber-500 to-orange-600',
                hex: '#f59e0b',
                bg: 'bg-amber-500',
                text: 'text-amber-600',
                badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            };
            case 'Físico': return {
                gradient: 'from-blue-500 to-indigo-600',
                hex: '#3b82f6',
                bg: 'bg-blue-500',
                text: 'text-blue-600',
                badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            };
            case 'Psicosociales': return {
                gradient: 'from-purple-500 to-violet-600',
                hex: '#a855f7',
                bg: 'bg-purple-500',
                text: 'text-purple-600',
                badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
            };
            case 'Biológico': return {
                gradient: 'from-rose-500 to-red-600',
                hex: '#f43f5e',
                bg: 'bg-rose-500',
                text: 'text-rose-600',
                badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            };
            case 'Químico': return {
                gradient: 'from-yellow-500 to-amber-600',
                hex: '#eab308',
                bg: 'bg-yellow-500',
                text: 'text-yellow-600',
                badge: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
            };
            default: return {
                gradient: 'from-slate-500 to-zinc-600',
                hex: '#64748b',
                bg: 'bg-slate-500',
                text: 'text-slate-600',
                badge: 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            };
        }
    };

    // ─── 4. DISPARAR APROBACIÓN DE UN CLUSTER PONDERADO ESPECÍFICO ────────────
    const handleApplyCluster = (cluster: any) => {
        const topFactoresStr = cluster.factores.length > 0 
            ? cluster.factores.join(', ') 
            : cluster.tarea;

        // Construir datos estructurados con la metodología técnica oficial GTC-45
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
            // Variables oficiales GTC-45 calculadas
            nd: cluster.nd,
            ne: cluster.ne,
            np: cluster.np,
            nc: cluster.nc,
            nr: cluster.nr,
            nivel_riesgo: cluster.nrNivel,
            interpretacion_nr: cluster.nrAceptabilidad,
            peligros: `Consolidado de ${cluster.reportesCount} reportes en el cargo ${cluster.cargo} (${cluster.area}). Factores recurrentes: ${topFactoresStr}. Ponderación GTC-45: NR ${cluster.nr} (Nivel ${cluster.nrNivel}).`,
            efectosPosibles: `Impacto colectivo en la salud: ${cluster.ncDesc}. Molestias y factores reportados por ${cluster.reportesCount} colaboradores expuestos.`,
            controlesExistentes: cluster.controlesExistentes,
            suficientes: false,
            sugeridoEliminacion: '',
            sugeridoIngenieria: `Propuesta de Mejora Colectiva: ${cluster.propuestasMejora}`,
            sugeridoAdministrativo: `Programa de Vigilancia Epidemiológica enfocado en ${cluster.peligroClasificacion} con seguimiento bimensual al cargo ${cluster.cargo}. Procedimiento seguro de trabajo.`,
            sugeridoEPP: 'Verificación, recambio y dotación oportuna de elementos de protección personal y ergonomía de confort.',
            peorConsecuencia: cluster.ncDesc,
            trabajadorNombre: `Consolidado Ponderado: ${cluster.cargo} (N = ${cluster.reportesCount} Colaboradores)`,
            trabajadorCedula: 'ESTADISTICA-GTC45'
        };

        onApplyConsolidadoToMatrix(consolidadoData);
    };

    // ─── 5. CLUSTERS FILTRADOS POR MATRIZ TÉRMICA (HEATMAP) ───────────────────
    const displayedClusters = useMemo(() => {
        if (!selectedHeatmapCell) return weightedClusters;
        return weightedClusters.filter(c => c.heatmapCellKey === selectedHeatmapCell);
    }, [weightedClusters, selectedHeatmapCell]);

    // Matriz térmica GTC-45: definición de celdas 4x4
    const heatmapGrid = useMemo(() => {
        // Filas: NC (100, 60, 25, 10), Columnas: NP (MA=40-24, A=20-10, M=8-6, B=4-2)
        const rows = [
            { nc: 100, label: 'Mortal (100)' },
            { nc: 60, label: 'Muy Grave (60)' },
            { nc: 25, label: 'Grave (25)' },
            { nc: 10, label: 'Leve (10)' }
        ];
        const cols = [
            { npLabel: 'Muy Alta (MA)', minNP: 24 },
            { npLabel: 'Alta (A)', minNP: 10 },
            { npLabel: 'Media (M)', minNP: 6 },
            { npLabel: 'Baja (B)', minNP: 2 }
        ];

        // Matriz de Nivel de Riesgo oficial GTC-45 (I, II, III, IV)
        const levels = [
            ['I', 'I', 'I', 'II'],     // NC 100
            ['I', 'I', 'II', 'II'],    // NC 60
            ['I', 'II', 'II', 'III'],  // NC 25
            ['II', 'III', 'III', 'IV'] // NC 10
        ];

        return rows.map((r, rIdx) => {
            return cols.map((c, cIdx) => {
                const cellKey = `${rIdx}-${cIdx}`;
                const cellLevel = levels[rIdx][cIdx];
                const matchingClusters = weightedClusters.filter(cl => cl.heatmapCellKey === cellKey);
                return {
                    rIdx,
                    cIdx,
                    cellKey,
                    cellLevel,
                    nc: r.nc,
                    ncLabel: r.label,
                    npLabel: c.npLabel,
                    clusters: matchingClusters,
                    count: matchingClusters.length
                };
            });
        });
    }, [weightedClusters]);

    const renderCard = (
        <div className={isEmbedded ? "w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-teal-500/30 bg-surface-secondary shadow-md transition-all duration-300 my-4 sm:my-6" : "bg-white dark:bg-zinc-950 w-full max-w-5xl h-[92vh] max-h-[920px] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"}>
            
            {/* ── Header Principal con Botonera de Vistas Adaptativa ── */}
            <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:px-6 sm:py-5 border-b border-border-light gap-3.5 shrink-0 w-full min-w-0 ${isEmbedded ? 'bg-surface-tertiary/60' : 'bg-slate-50/70 dark:bg-zinc-900/60 backdrop-blur-sm'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() => isEmbedded && setIsSectionExpanded(!isSectionExpanded)}
                        className={`flex items-center gap-2.5 text-left font-semibold text-text-primary min-w-0 flex-1 ${isEmbedded ? 'hover:text-teal-600 transition-colors cursor-pointer' : 'cursor-default'}`}
                    >
                        {isEmbedded && (
                            isSectionExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary shrink-0" /> : <ChevronRight className="h-5 w-5 text-text-secondary shrink-0" />
                        )}
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                            <Target size={20} className="stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight flex items-center gap-2 flex-wrap">
                                <span className="truncate">Base Estadística y Ponderación GTC-45</span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300/40 shrink-0">
                                    Matriz Oficial
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate mt-0.5">
                                De la percepción individual de los colaboradores a la constitución técnica del riesgo
                            </p>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                    {/* Botonera de 3 Vistas con soporte para scroll horizontal en móviles */}
                    <div className="w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5">
                        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-surface-primary border border-border-medium text-[11px] font-bold shadow-2xs whitespace-nowrap">
                            <button
                                type="button"
                                onClick={() => { setActiveTab('dashboard'); setIsSectionExpanded(true); }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                                    activeTab === 'dashboard'
                                        ? "bg-teal-600 text-white shadow-xs font-black"
                                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                                )}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Gráficas & Métricas</span>
                                <span className="sm:hidden">Gráficas</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveTab('clusters'); setIsSectionExpanded(true); }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                                    activeTab === 'clusters'
                                        ? "bg-teal-600 text-white shadow-xs font-black"
                                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                                )}
                            >
                                <Target className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Riesgos Ponderados ({weightedClusters.length})</span>
                                <span className="sm:hidden">Riesgos ({weightedClusters.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveTab('metodologia'); setIsSectionExpanded(true); }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                                    activeTab === 'metodologia'
                                        ? "bg-teal-600 text-white shadow-xs font-black"
                                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                                )}
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">¿Cómo se define el riesgo?</span>
                                <span className="md:hidden">Metodología Legal</span>
                            </button>
                        </div>
                    </div>

                    {/* Selector de Fuente */}
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-primary border border-border-medium text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setFilterSource('all')}
                            className={cn(
                                "px-2 py-1 rounded-lg transition-all cursor-pointer",
                                filterSource === 'all' ? "bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            Todos ({unifiedReports.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterSource('inbox')}
                            className={cn(
                                "px-2 py-1 rounded-lg transition-all cursor-pointer",
                                filterSource === 'inbox' ? "bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            QR ({unifiedReports.filter(r => r.source === 'inbox' || r.source === 'synced').length})
                        </button>
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs shrink-0 cursor-pointer"
                            title={isEmbedded ? "Ocultar Base Estadística" : "Cerrar"}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Contenido Expandible ── */}
            {(!isEmbedded || isSectionExpanded) && (
                <div className={isEmbedded ? "p-4 sm:p-6 bg-surface-primary/30 space-y-6 text-xs w-full min-w-0" : "flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs w-full min-w-0"}>
                    
                    {/* 1. Tarjetas Superiores de Métricas Clave */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full min-w-0">
                        <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 shadow-xs flex flex-col justify-between min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 truncate">
                                <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <span className="truncate">Muestra Colectiva</span>
                            </span>
                            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100">
                                    {stats.totalTrabajadores}
                                </span>
                                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate">
                                    ({stats.totalReportes} reportes)
                                </span>
                            </div>
                        </div>

                        <div className="p-3 sm:p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex flex-col justify-between min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 truncate">
                                <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" /> <span className="truncate">Nivel I (Crítico)</span>
                            </span>
                            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
                                <span className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-200">
                                    {stats.nrDistribucion.nivelI}
                                </span>
                                <span className="text-[10px] sm:text-[11px] text-rose-700 dark:text-rose-300 font-bold truncate">
                                    {stats.porcentajeCriticoAlto}% crítico
                                </span>
                            </div>
                        </div>

                        <div className="p-3 sm:p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-950/20 shadow-xs flex flex-col justify-between min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 truncate">
                                <TrendingUp className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <span className="truncate">Más Frecuente</span>
                            </span>
                            <div className="mt-2">
                                <span className="text-base sm:text-lg font-black text-teal-900 dark:text-teal-200 block truncate" title={stats.riesgoMasReportado.cat}>
                                    {stats.riesgoMasReportado.cat}
                                </span>
                                <span className="text-[10px] sm:text-[11px] font-bold text-teal-700 dark:text-teal-300 truncate block">
                                    {stats.totalReportes > 0 ? `${stats.riesgoMasReportado.porcentaje}% incidencia` : 'Sin datos'}
                                </span>
                            </div>
                        </div>

                        <div className="p-3 sm:p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs flex flex-col justify-between min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5 truncate">
                                <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span className="truncate">Riesgos a Matriz</span>
                            </span>
                            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
                                <span className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-200">
                                    {weightedClusters.length}
                                </span>
                                <span className="text-[10px] sm:text-[11px] text-blue-700 dark:text-blue-300 font-medium truncate">
                                    filas consolidadas
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ════════════════════════════════════════════════════════════════════
                        TAB 1: DASHBOARD Y GRÁFICAS VISUALES INTERACTIVAS
                    ════════════════════════════════════════════════════════════════════ */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            
                            {/* Fila de Gráficas: Donut SVG + Heatmap Térmico GTC-45 */}
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full min-w-0">
                                
                                {/* ── Gráfica A: Donut Chart SVG de Categorías GTC-45 (5 cols) ── */}
                                <div className="xl:col-span-5 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs flex flex-col justify-between w-full min-w-0">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                                <PieChart className="w-4 h-4 text-teal-600" />
                                                Distribución de Peligros GTC-45
                                            </h3>
                                            <span className="text-[10px] font-bold text-slate-400">Total: {stats.totalReportes}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4">
                                            Proporción de peligros identificados por la fuerza laboral según clasificación oficial.
                                        </p>

                                        {/* SVG Donut Chart */}
                                        <div className="flex items-center justify-center my-3 relative">
                                            <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="60"
                                                    className="stroke-slate-100 dark:stroke-zinc-800"
                                                    strokeWidth="20"
                                                    fill="transparent"
                                                />
                                                {(() => {
                                                    const circumference = 2 * Math.PI * 60; // ~377
                                                    let accumulatedPct = 0;
                                                    return stats.rankingClasificaciones.map((item) => {
                                                        if (item.count === 0) return null;
                                                        const strokeDasharray = `${(item.porcentaje / 100) * circumference} ${circumference}`;
                                                        const strokeDashoffset = -((accumulatedPct / 100) * circumference);
                                                        accumulatedPct += item.porcentaje;
                                                        const color = getCatColor(item.cat).hex;

                                                        return (
                                                            <circle
                                                                key={item.cat}
                                                                cx="80"
                                                                cy="80"
                                                                r="60"
                                                                stroke={color}
                                                                strokeWidth="20"
                                                                strokeDasharray={strokeDasharray}
                                                                strokeDashoffset={strokeDashoffset}
                                                                fill="transparent"
                                                                className="transition-all duration-700 hover:opacity-80"
                                                            />
                                                        );
                                                    });
                                                })()}
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                                    {stats.totalReportes}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                                                    Reportes
                                                </span>
                                                <span className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                                                    100% Ponderado
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Leyenda con barras de progreso */}
                                    <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                                        {stats.rankingClasificaciones.slice(0, 5).map((item) => {
                                            const colors = getCatColor(item.cat);
                                            return (
                                                <div key={item.cat} className="flex items-center justify-between text-[11px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.hex }}></span>
                                                        <span className="font-semibold text-slate-700 dark:text-zinc-300">{item.cat}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 font-mono">
                                                        <span className="text-slate-400 text-[10px]">{item.count}</span>
                                                        <span className="font-bold text-slate-800 dark:text-zinc-200 w-8 text-right">{item.porcentaje}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── Gráfica B: Matriz Térmica / Heatmap Oficial GTC-45 4x4 (7 cols) ── */}
                                <div className="xl:col-span-7 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs flex flex-col justify-between w-full min-w-0">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                                <Grid className="w-4 h-4 text-teal-600" />
                                                Matriz Térmica Oficial GTC-45 (Consecuencia vs Probabilidad)
                                            </h3>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200/60">
                                                Mapa de Calor Colectivo
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
                                            Haz clic en cualquier celda para filtrar los peligros que constituyen ese cuadrante de riesgo.
                                        </p>

                                        {/* Heatmap Grid 4x4 */}
                                        <div className="overflow-x-auto scrollbar-thin">
                                            <div className="min-w-[340px] sm:min-w-[440px]">
                                                {/* Header Columnas: Probabilidad */}
                                                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold text-slate-400 mb-1">
                                                    <div className="text-left text-[9px] uppercase pl-1 text-slate-500">NC \ NP</div>
                                                    <div>Muy Alta (24-40)</div>
                                                    <div>Alta (10-20)</div>
                                                    <div>Media (6-8)</div>
                                                    <div>Baja (2-4)</div>
                                                </div>

                                                {/* Filas: Consecuencia */}
                                                <div className="space-y-1.5">
                                                    {heatmapGrid.map((row, rIdx) => (
                                                        <div key={rIdx} className="grid grid-cols-5 gap-1.5 items-center">
                                                            {/* Etiqueta Fila NC */}
                                                            <div className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 truncate pr-1" title={row[0].ncLabel}>
                                                                {row[0].ncLabel}
                                                            </div>

                                                            {/* 4 Celdas de la Fila */}
                                                            {row.map((cell) => {
                                                                const isSelected = selectedHeatmapCell === cell.cellKey;
                                                                const hasClusters = cell.count > 0;

                                                                // Color de celda según Nivel de Riesgo GTC-45
                                                                let cellBg = 'bg-slate-100 dark:bg-zinc-800 text-slate-700';
                                                                if (cell.cellLevel === 'I') cellBg = 'bg-rose-500 text-white';
                                                                else if (cell.cellLevel === 'II') cellBg = 'bg-amber-500 text-white';
                                                                else if (cell.cellLevel === 'III') cellBg = 'bg-yellow-400 text-yellow-950';
                                                                else if (cell.cellLevel === 'IV') cellBg = 'bg-emerald-500 text-white';

                                                                return (
                                                                    <button
                                                                        key={cell.cellKey}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (hasClusters) {
                                                                                setSelectedHeatmapCell(isSelected ? null : cell.cellKey);
                                                                                setActiveTab('clusters');
                                                                            }
                                                                        }}
                                                                        className={cn(
                                                                            "h-14 rounded-xl flex flex-col items-center justify-center transition-all p-1 relative cursor-pointer",
                                                                            cellBg,
                                                                            isSelected && "ring-4 ring-teal-500 scale-95 shadow-md",
                                                                            hasClusters ? "hover:opacity-90 hover:scale-102 shadow-xs" : "opacity-60 cursor-default"
                                                                        )}
                                                                    >
                                                                        <span className="text-[11px] font-black leading-none">
                                                                            Nivel {cell.cellLevel}
                                                                        </span>
                                                                        {hasClusters ? (
                                                                            <span className="mt-1 px-1.5 py-0.2 rounded-md bg-white text-slate-900 text-[9px] font-black shadow-2xs">
                                                                                {cell.count} {cell.count === 1 ? 'riesgo' : 'riesgos'}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[9px] opacity-60 mt-0.5">--</span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Leyenda de la Matriz Térmica */}
                                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex-wrap text-[10px]">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                                            <span className="font-bold text-slate-700 dark:text-zinc-300">Nivel I: No Aceptable (Crítico)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                                            <span className="font-bold text-slate-700 dark:text-zinc-300">Nivel II: Control Específico</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400"></span>
                                            <span className="font-bold text-slate-700 dark:text-zinc-300">Nivel III: Mejorable</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                                            <span className="font-bold text-slate-700 dark:text-zinc-300">Nivel IV: Aceptable</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Gráfica C: Ranking de Cargos Más Expuestos (Bar Chart) ── */}
                            <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-xs">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-teal-600" />
                                            Concentración de Participación por Cargos y Puestos Operativos
                                        </h3>
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                            Identifica qué puestos de trabajo tienen mayor volumen de reportes coincidentes y requieren intervención prioritaria.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('clusters')}
                                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                                    >
                                        Ver clusters ponderados <ArrowRight size={13} />
                                    </button>
                                </div>

                                <div className="space-y-3 pt-1">
                                    {stats.rankingCargos.length === 0 ? (
                                        <p className="text-center py-4 text-slate-400 text-xs">No hay datos suficientes para el ranking de cargos.</p>
                                    ) : (
                                        stats.rankingCargos.map((cargoItem, i) => {
                                            const maxCount = stats.rankingCargos[0]?.count || 1;
                                            const pct = Math.round((cargoItem.count / maxCount) * 100);
                                            const isCritico = cargoItem.maxNrNivel === 'I';

                                            return (
                                                <div key={cargoItem.cargo} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 text-slate-400 font-black text-[10px]">#{i + 1}</span>
                                                            <span className="font-bold text-slate-800 dark:text-zinc-200">{cargoItem.cargo}</span>
                                                            {isCritico && (
                                                                <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[9px] font-black uppercase">
                                                                    Riesgo Crítico I
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                                                            {cargoItem.count} {cargoItem.count === 1 ? 'colaborador' : 'colaboradores'}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-700",
                                                                isCritico ? "bg-gradient-to-r from-rose-500 to-amber-500" : "bg-gradient-to-r from-teal-500 to-emerald-500"
                                                            )}
                                                            style={{ width: `${Math.max(pct, 8)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════════════
                        TAB 2: LISTADO DE RIESGOS PONDERADOS PARA LA MATRIZ OFICIAL
                    ════════════════════════════════════════════════════════════════════ */}
                    {activeTab === 'clusters' && (
                        <div className="space-y-4">
                            
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-teal-600" />
                                        Peligros Consolidados para Integrar a la Matriz IPEVR Oficial (GTC-45)
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                        Cada tarjeta representa una fila técnica oficial obtenida de la fusión objetiva de múltiples reportes de colaboradores.
                                    </p>
                                </div>

                                {selectedHeatmapCell && (
                                    <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-300/60">
                                        <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
                                            Filtrando cuadrante térmico: {displayedClusters.length} encontrados
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedHeatmapCell(null)}
                                            className="text-teal-600 hover:text-red-500 font-bold text-xs"
                                        >
                                            ✕ Quitar filtro
                                        </button>
                                    </div>
                                )}
                            </div>

                            {displayedClusters.length === 0 ? (
                                <div className="text-center py-10 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 text-slate-400">
                                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-500" />
                                    <p className="font-semibold text-xs">No hay riesgos agrupados para este filtro</p>
                                    <p className="text-[11px] mt-0.5">Comparte el código QR o registra participaciones del personal para alimentar el sistema.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {displayedClusters.map((cluster, idx) => {
                                        const isPriority1 = idx === 0 && !selectedHeatmapCell;
                                        const isExpanded = expandedClusterId === cluster.id;
                                        const catColors = getCatColor(cluster.peligroClasificacion);

                                        return (
                                            <div
                                                key={cluster.id}
                                                className={cn(
                                                    "rounded-3xl border transition-all overflow-hidden shadow-xs",
                                                    isPriority1
                                                        ? "bg-gradient-to-r from-teal-50/70 via-white to-emerald-50/40 dark:from-teal-950/30 dark:via-zinc-900 dark:to-emerald-950/20 border-teal-300/80 dark:border-teal-700/80 shadow-md shadow-teal-500/5"
                                                        : "bg-white dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800"
                                                )}
                                            >
                                                {/* Header de la Tarjeta */}
                                                <div className="p-4 sm:p-5 pb-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                                                    isPriority1 ? "bg-rose-500 text-white" : "bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                                                )}>
                                                                    Prioridad #{idx + 1}
                                                                </span>

                                                                <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border", catColors.badge)}>
                                                                    {cluster.peligroClasificacion}
                                                                </span>

                                                                <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black", cluster.nrBadgeClass)}>
                                                                    Nivel de Riesgo {cluster.nrNivel} (NR: {cluster.nr})
                                                                </span>

                                                                {cluster.isFullyApplied && (
                                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-black flex items-center gap-1">
                                                                        <CheckCircle2 size={11} /> Integrado en Matriz
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2 pt-0.5">
                                                                <span>Cargo: {cluster.cargo}</span>
                                                                <span className="text-slate-400 font-normal">• Área: {cluster.area}</span>
                                                                <span className="text-slate-400 font-normal">• Sede: {cluster.zona}</span>
                                                            </h4>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-xl border border-teal-200/60 dark:border-teal-800/60">
                                                                👥 {cluster.reportesCount} {cluster.reportesCount === 1 ? 'colaborador' : 'colaboradores expuestos'}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleApplyCluster(cluster)}
                                                                title={cluster.isFullyApplied ? 'Re-integrar a Matriz' : 'Aprobar e Integrar a Matriz'}
                                                                className={cn(
                                                                    "group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] items-center justify-center rounded-xl transition-all duration-300 px-2 sm:px-3 shadow-sm active:scale-95 cursor-pointer shrink-0",
                                                                    cluster.isFullyApplied
                                                                        ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200"
                                                                        : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/20"
                                                                )}
                                                            >
                                                                <Sparkles className="w-4 h-4 shrink-0" />
                                                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                                                                    <span className="text-xs font-bold tracking-wide">
                                                                        {cluster.isFullyApplied ? 'Re-integrar a Matriz' : 'Aprobar e Integrar'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[11px] font-bold ml-1.5 sm:hidden">
                                                                    {cluster.isFullyApplied ? 'Re-integrar' : 'Aprobar'}
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Píldora de Cálculo Matemático Oficial GTC-45 en tiempo real */}
                                                    <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                                                                <Calculator size={13} className="text-teal-600" />
                                                                Fórmula GTC-45:
                                                            </span>
                                                            <span className="font-mono text-slate-700 dark:text-zinc-200">
                                                                NE ({cluster.ne}) × ND ({cluster.nd}) = <strong>NP {cluster.np} ({cluster.npNivel})</strong>
                                                            </span>
                                                            <span className="text-slate-400">•</span>
                                                            <span className="font-mono text-slate-700 dark:text-zinc-200">
                                                                NP ({cluster.np}) × NC ({cluster.nc}) = <strong className="text-rose-600 dark:text-rose-400">NR {cluster.nr}</strong>
                                                            </span>
                                                        </div>

                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 italic">
                                                            {cluster.nrAceptabilidad}
                                                        </span>
                                                    </div>

                                                    {/* Botón Innovador de Desglose de Fusión */}
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                                                            className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors cursor-pointer py-1"
                                                        >
                                                            <Eye size={14} />
                                                            <span>
                                                                {isExpanded
                                                                    ? 'Ocultar desglose de reportes fuente y síntesis'
                                                                    : `Ver cómo se constituyó este riesgo desde ${cluster.reportesCount} ${cluster.reportesCount === 1 ? 'reporte' : 'reportes'} de colaboradores`}
                                                            </span>
                                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </button>

                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            Labor: "{cluster.tarea}"
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* ── Vista Dividida de Fusión (Worker Reports vs Consolidated Matrix Row) ── */}
                                                {isExpanded && (
                                                    <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-zinc-950/60 border-t border-slate-200/80 dark:border-zinc-800 space-y-4 animate-in fade-in duration-200">
                                                        
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full min-w-0">
                                                            
                                                            {/* Columna Izquierda: Los Reportes de los Trabajadores */}
                                                            <div className="space-y-2.5 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                                                                        <Users size={12} className="text-teal-600" />
                                                                        Evidencias Fuente ({cluster.reportes.length} testimonios recibidos)
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-400 font-bold">Datos en bruto</span>
                                                                </div>

                                                                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                                                    {cluster.reportes.map((rep: any, rI: number) => (
                                                                        <div
                                                                            key={rep.id || rI}
                                                                            className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 shadow-2xs space-y-1.5 min-w-0"
                                                                        >
                                                                            <div className="flex items-center justify-between text-[10px]">
                                                                                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-200 truncate">
                                                                                    <span>👤 {rep.nombre}</span>
                                                                                    {rep.cedula && <span className="font-mono text-slate-400">({rep.cedula})</span>}
                                                                                </div>
                                                                                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold text-[9px] shrink-0">
                                                                                    {rep.source === 'inbox' ? 'Portal QR' : 'Local'}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[11px] text-slate-700 dark:text-zinc-300 italic bg-slate-50 dark:bg-zinc-800/40 p-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                                                                                "{rep.peligros || rep.tarea || 'Reporte de condición de riesgo'}"
                                                                            </p>
                                                                            {rep.propuestaMejora && (
                                                                                <p className="text-[10px] text-teal-700 dark:text-teal-300">
                                                                                    💡 <strong>Propuso:</strong> "{rep.propuestaMejora}"
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Columna Derecha: Fila Técnica Oficial que va a la Matriz */}
                                                            <div className="space-y-2.5 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                                                                        <FileSpreadsheet size={12} className="text-teal-600" />
                                                                        Fila Sintetizada Oficial para Matriz IPEVR
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-teal-600">Norma GTC-45</span>
                                                                </div>

                                                                <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-900/60 shadow-2xs space-y-2 text-[11px]">
                                                                    <div>
                                                                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Peligro Normalizado:</span>
                                                                        <p className="font-bold text-slate-900 dark:text-zinc-100">
                                                                            {cluster.peligroClasificacion} - {cluster.factores.length > 0 ? cluster.factores.join(', ') : cluster.tarea}
                                                                        </p>
                                                                    </div>

                                                                    <div>
                                                                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Efectos en la Salud / Peor Consecuencia:</span>
                                                                        <p className="text-slate-700 dark:text-zinc-300 font-medium">
                                                                            {cluster.ncDesc}. Molestias identificadas por {cluster.reportesCount} trabajadores.
                                                                        </p>
                                                                    </div>

                                                                    <div className="pt-1 border-t border-slate-100 dark:border-zinc-800">
                                                                        <span className="text-[9px] font-bold uppercase text-teal-600 block">Medidas de Intervención Sintetizadas (Jerarquía de Controles):</span>
                                                                        <ul className="list-disc list-inside text-[10px] text-slate-600 dark:text-zinc-300 space-y-0.5 mt-1 font-medium">
                                                                            <li><strong>Ingeniería:</strong> {cluster.propuestasMejora}</li>
                                                                            <li><strong>Administrativo:</strong> Procedimiento seguro, capacitación y vigilancia epidemiológica para el cargo {cluster.cargo}.</li>
                                                                            <li><strong>EPP:</strong> Dotación y reposición de elementos de protección personal certificados.</li>
                                                                        </ul>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleApplyCluster(cluster)}
                                                                        className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                                                    >
                                                                        <Sparkles size={14} />
                                                                        <span>Aprobar e Integrar este Riesgo Consolidado</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════════════
                        TAB 3: EXPLICADOR DE METODOLOGÍA Y TRIANGULACIÓN GTC-45
                    ════════════════════════════════════════════════════════════════════ */}
                    {activeTab === 'metodologia' && (
                        <div className="space-y-6">
                            
                            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                        <Scale className="w-4.5 h-4.5 text-teal-600" />
                                        ¿Cómo se constituye el riesgo a partir de múltiples reportes individuales?
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                                        El Decreto 1072 de 2015 (Art. 2.2.4.6.15) exige la participación activa de los trabajadores en la identificación de peligros. Sin embargo, <strong>la Matriz IPEVR de la empresa no debe llenarse de registros repetidos con nombres propios</strong>. Esta es la metodología matemática y técnica que aplica WAPPY:
                                    </p>
                                </div>

                                {/* Flujograma Visual en 4 Pasos */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pt-2 w-full min-w-0">
                                    
                                    <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/60 space-y-2 min-w-0">
                                        <div className="w-7 h-7 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                            1
                                        </div>
                                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                                            Captura Descentralizada
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                                            Los trabajadores escanean el QR desde sus puestos y reportan condiciones inseguras o dolores físicos en su lenguaje cotidiano.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/60 space-y-2 min-w-0">
                                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                            2
                                        </div>
                                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                                            Clusterización por IA
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                                            El sistema agrupa automáticamente los reportes que coinciden en <strong>Cargo + Proceso + Familia de Peligro</strong> (ej. Operarios de Empaque expuestos a movimientos repetitivos).
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 space-y-2 min-w-0">
                                        <div className="w-7 h-7 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                            3
                                        </div>
                                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                                            Ponderación GTC-45
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                                            La cantidad de expuestos fija el Nivel de Exposición (<strong>NE</strong>: 2 a 4) y la severidad fija el Nivel de Deficiencia (<strong>ND</strong>: 2 a 10). Se calculan matemáticamente <strong>NP</strong> y <strong>NR</strong>.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 space-y-2 min-w-0">
                                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                            4
                                        </div>
                                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                                            Fila Oficial en Matriz
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                                            Se crea o actualiza 1 sola fila en la Matriz IPEVR con terminología técnica, población expuesta ({stats.totalTrabajadores}) y jerarquía de controles de ingeniería y EPP.
                                        </p>
                                    </div>

                                </div>

                                {/* Tabla Explicativa de Fórmulas Matemáticas GTC-45 */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 space-y-3">
                                    <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                        <Calculator size={14} className="text-teal-600" />
                                        Tabla de Variables y Parámetros Oficiales (Guía Técnica Colombiana GTC-45)
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                        <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                                            <span className="font-black text-teal-700 dark:text-teal-400 block mb-1">
                                                Nivel de Exposición (NE) = Población Concurrente
                                            </span>
                                            <ul className="space-y-1 text-slate-600 dark:text-zinc-300">
                                                <li>• <strong>1 Reporte esporádico:</strong> NE = 2 (Ocasional).</li>
                                                <li>• <strong>2 a 3 Reportes coincidentes:</strong> NE = 3 (Frecuente).</li>
                                                <li>• <strong>4 o más Reportes coincidentes:</strong> NE = 4 (Continua durante la jornada).</li>
                                            </ul>
                                        </div>

                                        <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                                            <span className="font-black text-rose-700 dark:text-rose-400 block mb-1">
                                                Nivel de Deficiencia (ND) = Gravedad de Controles
                                            </span>
                                            <ul className="space-y-1 text-slate-600 dark:text-zinc-300">
                                                <li>• <strong>Severidad Crítica sin controles:</strong> ND = 10 (Muy Alto).</li>
                                                <li>• <strong>Severidad Alta con fallas de control:</strong> ND = 6 (Alto).</li>
                                                <li>• <strong>Severidad Media con controles parciales:</strong> ND = 2 (Medio).</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-xl border border-teal-200/80 dark:border-teal-800/80 text-[11px] text-teal-900 dark:text-teal-200">
                                        <strong>Resultado de la Ponderación:</strong> $NP = ND \times NE$, multiplicado por el Nivel de Consecuencia ($NC = 10, 25, 60, 100$). Si el $NR \ge 600$, el sistema lo clasifica como <strong>Nivel I (No Aceptable)</strong> y lo posiciona en la Prioridad #1 para que el Administrador SST lo apruebe e integre de inmediato a su Plan de Trabajo Anual.
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* 4. Sección Desplegable de Auditoría de Reportes Individuales */}
                    <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsAuditListOpen(prev => !prev)}
                            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
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
                                                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase border", getCatColor(r.peligroClasificacion).badge)}>
                                                            {r.peligroClasificacion}
                                                        </span>
                                                        {r.source === 'inbox' && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-[9px] font-bold">
                                                                📱 Portal QR
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
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                        r.severidadPercibida === 'Crítica' ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" :
                                                        r.severidadPercibida === 'Alta' ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" :
                                                        "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                                                    )}>
                                                        Sev: {r.severidadPercibida}
                                                    </span>

                                                    {r.inboxId && onDismissInbox && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onDismissInbox(r.inboxId)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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
            )}

            {/* ── Footer Modal (solo si no es embebido) ── */}
            {!isEmbedded && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            title="Cerrar Analítica"
                            className="group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all duration-300 px-2 sm:px-3 shadow-2xs active:scale-95 cursor-pointer"
                        >
                            <X className="w-4 h-4 shrink-0" />
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[120px] group-hover:opacity-100 sm:flex">
                                <span className="text-xs font-bold">Cerrar Analítica</span>
                            </div>
                            <span className="text-xs font-bold ml-1.5 sm:hidden">Cerrar</span>
                        </button>
                    )}

                    {weightedClusters.length > 0 && (
                        <button
                            type="button"
                            onClick={() => handleApplyCluster(weightedClusters[0])}
                            title="Integrar Peligro #1 Más Crítico a la Matriz"
                            className="group flex h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-600/25 transition-all duration-300 px-2.5 sm:px-3.5 active:scale-95 cursor-pointer ml-auto"
                        >
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[280px] group-hover:opacity-100 sm:flex">
                                <span className="text-xs font-black">Integrar Peligro #1 Más Crítico a la Matriz</span>
                            </div>
                            <ArrowRight className="w-4 h-4 shrink-0 ml-1.5" />
                            <span className="text-xs font-black ml-1.5 sm:hidden">Integrar Peligro #1</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    if (isEmbedded) {
        return renderCard;
    }

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            {renderCard}
        </div>
    );
}
