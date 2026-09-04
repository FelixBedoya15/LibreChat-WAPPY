import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Loader2, HeartPulse, Briefcase, AlertTriangle, ShieldAlert, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp, History } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { SGSSTToolbar } from './SGSSTToolbar';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import { generateDummyData } from '~/utils/dummyDataGenerator';
import { DummyGenerateButton } from '~/components/ui/DummyGenerateButton';

const SCORE_COLOR = (s: number) => {
    if (s >= 80) return { ring: 'border-green-400', text: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
    if (s >= 60) return { ring: 'border-amber-400', text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
    return { ring: 'border-red-400', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
};

const SEV_STYLES: Record<string, { icon: React.ReactNode; border: string; pts: string }> = {
    critical: { icon: <ShieldAlert className="w-4 h-4 text-red-500" />, border: 'border-red-200 dark:border-red-800', pts: 'text-red-600 dark:text-red-400' },
    warning:  { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, border: 'border-amber-200 dark:border-amber-800', pts: 'text-amber-600 dark:text-amber-400' },
    info:     { icon: <HeartPulse className="w-4 h-4 text-blue-400" />, border: 'border-blue-100 dark:border-blue-800', pts: 'text-blue-500 dark:text-blue-400' },
};

export default function OraculoPredictivoH1() {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;

    const [workers, setWorkers] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiConclusions, setAiConclusions] = useState<Record<string, string>>({});
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
    const [evaluatingIAId, setEvaluatingIAId] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyWorkerId, setHistoryWorkerId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Store workers in ref to avoid stale closure in save
    const workersRef = useRef<any[]>([]);
    workersRef.current = workers;

    useEffect(() => {
        if (!token) return;
        const fetchData = async () => {
            try {
                const [s, p] = await Promise.all([
                    fetch('/api/sgsst/perfil-sociodemografico/data', { headers: { Authorization: `Bearer ${token}` } }),
                    fetch('/api/sgsst/perfiles-cargo/data', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                const sd = await s.json();
                const pd = await p.json();
                const ws: any[] = sd.trabajadores || [];
                const ps: any[] = pd.perfilesList || [];
                setWorkers(ws);
                setProfiles(ps);
                const init: Record<string, string> = {};
                ws.forEach((w: any) => { if (w.dictamenPredictivoH1) init[w.id] = w.dictamenPredictivoH1; });
                setAiConclusions(init);
            } catch {
                showToastRef.current({ message: 'Error cargando datos', status: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        window.addEventListener('wappy-reload-sgsst-data', fetchData);
        return () => window.removeEventListener('wappy-reload-sgsst-data', fetchData);
    }, [token]);

    // Helper para matching flexible de perfiles de cargo
    const findMatchingProfile = useCallback((workerCargo: string, profList: any[]) => {
        if (!workerCargo) return null;
        const clean = String(workerCargo).trim().toLowerCase();
        let match = (profList || []).find(p => String(p.nombreCargo || '').trim().toLowerCase() === clean);
        if (match) return match;
        match = (profList || []).find(p => {
            const cargoClean = String(p.nombreCargo || '').trim().toLowerCase();
            return cargoClean && (clean.includes(cargoClean) || cargoClean.includes(clean));
        });
        if (match) return match;
        return {
            nombreCargo: workerCargo,
            exigenciaFisica: 'Media',
            exigenciaMental: 'Media',
            operaMaquinaria: 'No',
            entrenamientosSeleccionados: []
        };
    }, []);

    // ─── TAG → Score Map: Each IA tag maps to a score penalty ────────────────
    const TAG_RULES: Record<string, { pts: number; sev: string; cat: string; label: string; desc: string }> = {
        Lumbalgia:            { pts: 10, sev: 'warning',  cat: 'Osteomuscular',    label: 'Lumbalgia Mecánica',          desc: 'Restricción lumbar. Requiere control de levantamiento de cargas y pausas.' },
        Hernia_Discal:        { pts: 15, sev: 'critical', cat: 'Osteomuscular',    label: 'Hernia Discal / Discopatía',  desc: 'Condición discal que puede agravarse con esfuerzos mecánicos intensos.' },
        Cervicalgia:          { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',    label: 'Cervicalgia Ocupacional',     desc: 'Restricción cervical. Requiere evitar posturas estáticas de cuello.' },
        Epicondilitis:        { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',    label: 'Epicondilitis / Tendinitis',  desc: 'Inflamación articular. Limita movimientos repetitivos de flexo-extensión.' },
        Tunel_Carpiano:       { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',    label: 'Síndrome de Túnel Carpiano',  desc: 'Compresión nerviosa en muñeca. Limita digitación y agarre de fuerza.' },
        Restriccion_Hombro:   { pts: 10, sev: 'warning',  cat: 'Osteomuscular',    label: 'Manguito Rotador / Hombro',   desc: 'Limitación glenohumeral. Evitar trabajos con brazos elevados.' },
        Restriccion_Rodilla:  { pts: 10, sev: 'warning',  cat: 'Osteomuscular',    label: 'Restricción Articular Rodilla',desc: 'Limitación en rodillas. Evitar cuclillas y sobrecargas.' },
        No_Carga_Peso:        { pts: 8,  sev: 'warning',  cat: 'Restricción Física',label: 'Restricción de Levantamiento',desc: 'Límite estricto de carga de peso según concepto médico.' },
        No_Bipedestacion:     { pts: 5,  sev: 'info',     cat: 'Restricción Física',label: 'Restricción Bipedestación',   desc: 'Requiere alternancia postural para evitar fatiga vascular y articular.' },
        No_Sedestacion:       { pts: 5,  sev: 'info',     cat: 'Restricción Física',label: 'Restricción Sedestación',     desc: 'Requiere pausas activas y estaciones de trabajo ergonómicas.' },
        Hipoacusia:           { pts: 8,  sev: 'warning',  cat: 'Sensorial',        label: 'Hipoacusia Neurosensorial',   desc: 'Disminución auditiva. Protección auditiva de alta atenuación obligatoria.' },
        Vision_Reducida:      { pts: 5,  sev: 'info',     cat: 'Sensorial',        label: 'Defecto de Refracción Visual',desc: 'Requiere lentes de seguridad con prescripción óptica verificada.' },
        HTA:                  { pts: 10, sev: 'warning',  cat: 'Cardiovascular',   label: 'Hipertensión Diagnosticada',  desc: 'Enfermedad cardiovascular bajo tratamiento médico.' },
        Cardiopatia:          { pts: 20, sev: 'critical', cat: 'Cardiovascular',   label: 'Cardiopatía / Arritmia',      desc: 'Condición cardíaca mayor. Incompatible con sobreesfuerzos físicos extremos.' },
        Diabetes:             { pts: 10, sev: 'warning',  cat: 'Metabólico',       label: 'Diabetes Mellitus',           desc: 'Requiere control glucémico, hidratación y prevención de fatiga súbita.' },
        Epilepsia:            { pts: 25, sev: 'critical', cat: 'Neurológico',      label: 'Epilepsia / Convulsiones',    desc: 'Alto riesgo de pérdida de conciencia. Bloqueo en alturas y maquinaria.' },
        Vertigo:              { pts: 18, sev: 'critical', cat: 'Neurológico',      label: 'Síndrome Vertiginoso / Mareo',desc: 'Riesgo de desequilibrio. Restricción en alturas y plataformas elevadas.' },
        EPOC:                 { pts: 15, sev: 'warning',  cat: 'Respiratorio',     label: 'EPOC / Enfisema Pulmonar',    desc: 'Limitación ventilatoria crónica. Evitar polvos, humos y químicos volátiles.' },
        Asma:                 { pts: 10, sev: 'warning',  cat: 'Respiratorio',     label: 'Asma Ocupacional / Bronquial',desc: 'Hiperreactividad bronquial ante alergenos e irritantes ambientales.' },
        Alergia_Quimica:      { pts: 10, sev: 'warning',  cat: 'Inmunológico',     label: 'Alergia Química / Dermatitis',desc: 'Hipersensibilidad de contacto. EPP de barrera química obligatorio.' },
        Medicamento_SNC:      { pts: 15, sev: 'critical', cat: 'Farmacológico',    label: 'Fármaco Depresor del SNC',    desc: 'Sedantes o ansiolíticos que alteran tiempos de reacción y alerta motora.' },
        Restriccion_Mental:   { pts: 12, sev: 'warning',  cat: 'Psicoemocional',   label: 'Afección Psicoemocional',     desc: 'Condición que compromete tolerancia a la sobrecarga mental o turnos nocturnos.' },
        Patologia_Cronica:    { pts: 8,  sev: 'warning',  cat: 'Clínico',          label: 'Patología Crónica de Base',   desc: 'Enfermedad diagnosticada que requiere vigilancia epidemiológica.' },
        Diagnostico_Reciente: { pts: 4,  sev: 'info',     cat: 'Clínico',          label: 'Diagnóstico Clínico Reciente',desc: 'Seguimiento preventivo y verificación de adherencia al tratamiento.' },
        Recomendacion_Leve:   { pts: 2,  sev: 'info',     cat: 'Preventivo',       label: 'Recomendación Preventiva',    desc: 'Medida ergonómica o de autocuidado emitida por medicina laboral.' },
    };

    const calcFit = useCallback((w: any, profile: any) => {
        let score = 100;
        const auditItems: { title: string; description: string; pts: number; severity: string; category: string }[] = [];
        const add = (title: string, desc: string, pts: number, sev: string, cat: string) => {
            score -= pts; auditItems.push({ title, description: desc, pts, severity: sev, category: cat });
        };
        const prof = profile || { exigenciaFisica: 'Media', exigenciaMental: 'Media', operaMaquinaria: 'No', entrenamientosSeleccionados: [] };

        // 1. BIOMETRÍA Y SIGNOS VITALES (Graduación Clínica OMS / AHA)
        if (w.imc) {
            const imc = parseFloat(w.imc);
            if (!isNaN(imc)) {
                if (imc >= 35) add('Obesidad Severa (Grado II/III)', `IMC ${imc} — Alto riesgo cardiovascular, metabólico y sobrecarga articular.`, 10, 'critical', 'Clínico');
                else if (imc >= 30) add('Obesidad (Grado I)', `IMC ${imc} — Requiere monitoreo nutricional y acondicionamiento físico.`, 6, 'warning', 'Clínico');
                else if (imc >= 25) add('Sobrepeso Leve', `IMC ${imc} — Monitoreo preventivo en programa de estilo de vida saludable.`, 3, 'info', 'Clínico');
                else if (imc < 18.5) add('Bajo Peso', `IMC ${imc} — Sugiere déficit nutricional o fatiga temprana ante esfuerzo.`, 4, 'info', 'Clínico');
            }
        }
        if (w.presionArterial) {
            const [s1, d1] = w.presionArterial.split('/');
            const sis = parseInt(s1 || '0', 10);
            const dia = parseInt(d1 || '0', 10);
            if (!isNaN(sis) && !isNaN(dia)) {
                if (sis >= 160 || dia >= 100) add('Hipertensión Severa (Estadio 2)', `Presión Arterial ${w.presionArterial} mmHg. Alto riesgo vascular en esfuerzos intensos.`, 15, 'critical', 'Clínico');
                else if (sis >= 140 || dia >= 90) add('Hipertensión (Estadio 1)', `Presión Arterial ${w.presionArterial} mmHg. Requiere control médico ocupacional.`, 8, 'warning', 'Clínico');
                else if (sis >= 130 || dia >= 85) add('Tensión Arterial Elevada', `Presión Arterial ${w.presionArterial} mmHg. Monitoreo preventivo de estrés y sal.`, 4, 'info', 'Clínico');
            }
        }
        if (w.frecuenciaCardiaca) {
            const fc = parseInt(w.frecuenciaCardiaca, 10);
            if (!isNaN(fc)) {
                if (fc > 100) add('Taquicardia en Reposo', `FC ${fc} lpm — Posible sobrecarga cardiovascular, estrés o deshidratación.`, 8, 'warning', 'Clínico');
                else if (fc < 50) {
                    const isAthlete = w.deporte && (w.deporte.toLowerCase().includes('sí') || w.deporte.toLowerCase().includes('frecuente') || w.deporte.toLowerCase().includes('diario'));
                    if (!isAthlete) add('Bradicardia en Reposo', `FC ${fc} lpm — Sugiere valoración médica si se acompaña de mareos.`, 4, 'info', 'Clínico');
                    else add('Bradicardia Sinusal Fisiológica', `FC ${fc} lpm — Respuesta cardíaca eficiente adaptada al acondicionamiento físico.`, 0, 'info', 'Preventivo');
                }
            }
        }

        // 2. HÁBITOS Y ESTILO DE VIDA
        if (w.fuma === 'Sí, diario') add('Tabaquismo Activo Diario', 'Reduce la capacidad de difusión pulmonar y la resistencia aeróbica.', 6, 'warning', 'Clínico');
        if (w.alcohol === 'Sí (Frecuente)') {
            if (prof.operaMaquinaria === 'Sí') add('🛑 Consumo Frecuente de Alcohol + Maquinaria', 'Alto riesgo de accidentabilidad grave en labores mecanizadas.', 25, 'critical', 'Psicosocial');
            else add('Consumo Frecuente de Alcohol', 'Vigilancia preventiva y programa de prevención de adicciones.', 10, 'warning', 'Psicosocial');
        }

        // 3. CAMPOS DE TEXTO LIBRE → IA SEMÁNTICA (9 Dominios)
        const iaTags: string[] = w.bioTagsIA || [];
        const hasIATags = iaTags.length > 0 && !iaTags.includes('Sin_Hallazgos');
        const hasAnyText = [
            w.limitacionesBiomecanicas, w.recomendacionesMedicas,
            w.diagnosticoMedico, w.enfermedades, w.alergiasQuimicas, w.medicamentos
        ].some(v => v && String(v).trim().length > 2 && !String(v).toLowerCase().includes('ninguna') && !String(v).toLowerCase().includes('ninguno'));

        if (hasAnyText) {
            if (hasIATags) {
                iaTags.forEach(tag => {
                    const rule = TAG_RULES[tag];
                    if (!rule) return;
                    let pts = rule.pts;
                    if ((tag === 'Lumbalgia' || tag === 'Hernia_Discal' || tag === 'Restriccion_Hombro' || tag === 'Restriccion_Rodilla') && prof.exigenciaFisica === 'Alta') {
                        pts = Math.round(pts * 1.5);
                    }
                    if ((tag === 'Epilepsia' || tag === 'Vertigo' || tag === 'Medicamento_SNC') && prof.operaMaquinaria === 'Sí') {
                        pts = Math.round(pts * 2.0);
                    }
                    if (tag === 'Restriccion_Mental' && prof.exigenciaMental === 'Alta') {
                        pts = Math.round(pts * 1.5);
                    }
                    add(rule.label, rule.desc + (pts !== rule.pts ? ' ⚠️ Agravado por exigencias del puesto.' : ''), pts, rule.sev, rule.cat);
                });
            } else {
                const hasEnf = w.enfermedades?.trim() && !w.enfermedades.toLowerCase().includes('ninguna');
                const hasDiag = w.diagnosticoMedico?.trim() && !w.diagnosticoMedico.toLowerCase().includes('ninguno') && !w.diagnosticoMedico.toLowerCase().includes('apto');
                const hasRestr = w.limitacionesBiomecanicas?.trim() && !w.limitacionesBiomecanicas.toLowerCase().includes('ninguna');
                const hasRec = w.recomendacionesMedicas?.trim() && !w.recomendacionesMedicas.toLowerCase().includes('ninguna');
                const hasAl = w.alergiasQuimicas?.trim() && !w.alergiasQuimicas.toLowerCase().includes('ninguna');
                if (hasEnf) add('Patología Base Declarada', `${w.enfermedades}`, 8, 'warning', 'Clínico');
                if (hasDiag && !hasEnf) add('Diagnóstico Médico Ocupacional', `${w.diagnosticoMedico}`, 5, 'info', 'Clínico');
                if (hasRestr) add('Restricción Biomecánica', `${w.limitacionesBiomecanicas}`, 8, 'warning', 'Osteomuscular');
                if (hasRec) add('Recomendación Médica Ocupacional', `${w.recomendacionesMedicas}`, 3, 'info', 'Preventivo');
                if (hasAl) add('Alergia Química Declarada', `${w.alergiasQuimicas}`, 6, 'warning', 'Inmunológico');
            }
        }

        // 4. VULNERABILIDAD SOCIAL Y FAMILIAR (Alertas Éticas — 0 pts de deducción)
        let vs = 0;
        let socialDesc: string[] = [];
        if (['1', '2'].includes(String(w.estrato || ''))) { vs++; socialDesc.push('estrato socioeconómico bajo'); }
        if (w.personasCargo && Number(w.personasCargo) >= 3) { vs++; socialDesc.push('alta carga de dependientes'); }
        if (w.estadoCivil?.toLowerCase().includes('solter') || w.estadoCivil?.toLowerCase().includes('viud') || w.estadoCivil?.toLowerCase().includes('divorciad')) {
            if (w.personasCargo && Number(w.personasCargo) > 0) { vs++; socialDesc.push('monoparentalidad'); }
        }
        if (w.vivienda?.toLowerCase().includes('arrendada') || w.vivienda?.toLowerCase().includes('invasión')) { vs++; socialDesc.push('inestabilidad habitacional'); }

        if (vs >= 3) add('Vulnerabilidad Sociodemográfica', `Factores estresores: ${socialDesc.join(', ')}. Sugerido programa de bienestar psicosocial.`, 0, 'info', 'Vigilancia Epidemiológica');
        else if (vs >= 2) add('Factores Psicosociales Externos', `Factores detectados: ${socialDesc.join(', ')}.`, 0, 'info', 'Vigilancia Epidemiológica');
        if (w.nivelEscolaridad?.toLowerCase().includes('primaria')) add('Escolaridad Básica', 'Requiere métodos de inducción visuales y acompañamiento cercano en SST.', 0, 'info', 'Vigilancia Epidemiológica');

        // 5. CRUCE CON EXIGENCIAS CRÍTICAS DEL CARGO
        if (prof.exigenciaFisica === 'Alta') {
            if (w.edad && Number(w.edad) > 55) add('Alerta de Carga Fisiológica por Edad', 'Colaborador mayor de 55 años en rol de alta exigencia física. Monitoreo ergonómico preventivo.', 0, 'info', 'Preventivo');
        }
        if (prof.exigenciaMental === 'Alta') {
            if (w.terapiaPsicologica === 'Sí') add('Vigilancia de Sobrecarga y Burnout', 'Rol de alta tensión mental sumado a acompañamiento psicológico activo.', 10, 'warning', 'Psicoemocional');
        }
        if (prof.operaMaquinaria === 'Sí' && !hasIATags) {
            const medLower = (w.medicamentos || '').toLowerCase();
            const hasMedsLethal = medLower.includes('psiquiátrico') || medLower.includes('dormir') || medLower.includes('sedante') || medLower.includes('ansiolítico');
            if (hasMedsLethal) add('🛑 BLOQUEO PREVENTIVO: Sedantes + Maquinaria', 'Uso de fármacos depresores del SNC incompatible con operación de maquinaria.', 35, 'critical', 'Operativo');
        }

        // 6. FORMACIÓN Y HABILITACIÓN LEGAL REAL
        if (prof.entrenamientosSeleccionados?.length > 0) {
            const list: string[] = prof.entrenamientosSeleccionados;
            const requiresAlturas = list.some(c => String(c).toLowerCase().includes('alturas'));
            const hasAlturas = !!(w.fechaCursoAlturasAutorizado || w.fechaCursoAlturasCoordinador);
            if (requiresAlturas && !hasAlturas) {
                add('Falta Certificación de Alturas', 'El cargo exige trabajo en alturas y no registra curso vigente acreditado.', 10, 'critical', 'Entrenamiento');
            }
            const requiresSST = list.some(c => String(c).toLowerCase().includes('50') || String(c).toLowerCase().includes('20') || String(c).toLowerCase().includes('sst'));
            const hasSST = !!(w.curso50h || w.curso20h);
            if (requiresSST && !hasSST) {
                add('Pendiente Curso 50h/20h SG-SST', 'Curso legal obligatorio de SG-SST pendiente por certificar.', 5, 'warning', 'Entrenamiento');
            }
        }

        return { score: Math.max(0, score), auditItems, hasIATags };
    }, [TAG_RULES]);



    const historyTags = useMemo(() => {
        return historyWorkerId ? ['sgsst-oraculo-h1', `worker-${historyWorkerId}`] : ['sgsst-oraculo-h1'];
    }, [historyWorkerId]);

    const handleSelectReport = useCallback(async (convId: string) => {
        if (!convId) return;
        try {
            const res = await fetch(`/api/messages/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            const messages = await res.json();
            const reportMsg = messages.reverse().find((m: any) =>
                m.sender === 'SGSST Diagnóstico' || (m.isCreatedByUser === false && m.text?.length > 100)
            ) || (messages.length > 0 ? messages[messages.length - 1] : null);

            if (reportMsg?.text) {
                const content = reportMsg.text;
                let targetId = historyWorkerId;

                // Si el historial se abrió de forma global, deducir el worker desde los tags de la conversación
                if (!targetId) {
                    try {
                        const convoRes = await fetch(`/api/convos/${convId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (convoRes.ok) {
                            const convoData = await convoRes.json();
                            const wTag = (convoData.tags || []).find((t: string) => t.startsWith('worker-'));
                            if (wTag) {
                                targetId = wTag.replace('worker-', '');
                            }
                        }
                    } catch (e) {
                        /* ignore */
                    }
                }

                if (targetId) {
                    setAiConclusions(prev => ({ ...prev, [targetId]: content }));
                    setCollapsedCards(prev => ({ ...prev, [targetId]: false }));
                    setWorkers(prev => prev.map(w => w.id === targetId ? { ...w, dictamenPredictivoH1: content } : w));
                    // Persistir en MongoDB en segundo plano
                    fetch(`/api/sgsst/perfil-sociodemografico/worker/${targetId}/dictamen`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ dictamen: content }),
                    }).catch(() => {});
                    showToastRef.current({ message: 'Dictamen cargado del historial ✅', status: 'success' });
                } else {
                    showToastRef.current({ message: 'Dictamen recuperado del historial', status: 'info' });
                }
            }
        } catch {
            showToastRef.current({ message: 'Error cargando dictamen del historial', status: 'error' });
        }
        setIsHistoryOpen(false);
    }, [historyWorkerId, token]);

    const handleConsultOracle = async (worker: any, profile: any, fit: any) => {
        setGeneratingId(worker.id);
        try {
            const calculatedScore = (worker.biocentricScore !== undefined && worker.biocentricScore !== null)
                ? worker.biocentricScore
                : fit.score;

            const ctx = `DATOS DEL TRABAJADOR (BIOINDIVIDUO):
- Nombre: ${worker.nombre}
- Identificación: ${worker.identificacion || 'N/A'}
- Cargo: ${worker.cargo || 'No especificado'}
- Edad: ${worker.edad || 'N/A'} años | Género: ${worker.genero || 'N/A'}
- Diagnóstico Médico: ${worker.diagnosticoMedico || 'Apto / Sin Hallazgos'}
- Recomendaciones Médicas: ${worker.recomendacionesMedicas || 'Ninguna'}
- Signos Vitales y Biometría: IMC=${worker.imc || 'N/A'}, Presión Arterial=${worker.presionArterial || 'N/A'} mmHg, Frecuencia Cardíaca=${worker.frecuenciaCardiaca || 'N/A'} lpm
- Hábitos: Fuma=${worker.fuma || 'No'}, Alcohol=${worker.alcohol || 'No'}, Terapia Psicológica=${worker.terapiaPsicologica || 'No'}
- Restricciones/Alertas detectadas: ${fit.auditItems.map((a: any) => `${a.title}: ${a.description}`).join('; ') || 'Ninguna'}

DATOS DEL CARGO (DEMANDA DEL PUESTO):
- Exigencia Física: ${profile?.exigenciaFisica || 'Media'}
- Exigencia Mental: ${profile?.exigenciaMental || 'Media'}
- Opera Maquinaria: ${profile?.operaMaquinaria || 'No'}
- Nivel de Cargo: ${profile?.nivelCargo || 'Operativo'}
- Score Biocéntrico Calculado: ${calculatedScore}% FIT`;

            const inst = `Eres el Oráculo Predictivo H1 de WAPPY IA, especialista en Medicina Laboral y Seguridad y Salud en el Trabajo bajo el Modelo Causal ATENEA.
Genera un DICTAMEN PREDICTIVO H1 DE APTITUD Y RIESGO BIOCÉNTRICO en formato HTML profesional y enriquecido para LiveEditor.
Debe tener un diseño ejecutivo de altísima calidad visual (estilo informe pericial médico-laboral) con las siguientes secciones obligatorias:

1. ENCABEZADO EJECUTIVO Y TARJETA DEL TRABAJADOR:
   - Título: DICTAMEN PREDICTIVO H1 — EVALUACIÓN DE APTITUD Y VULNERABILIDAD BIOCÉNTRICA
   - Banner estilizado con gradiente teal/cyan, datos generales del colaborador, cargo y badge destacado con el Score Biocéntrico (${calculatedScore}% FIT) y Categoría de Aptitud (ej. Apto con Observaciones / Requiere Intervención / Apto Pleno).

2. MATRIZ COMPARATIVA DE COMPATIBILIDAD: DEMANDA DEL PUESTO (8M ATENEA) vs. CAPACIDAD BIOINDIVIDUAL:
   Diseña una tabla HTML estilizada (<table style="width:100%; border-collapse:separate; border-spacing:0; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; margin:16px 0;">) con encabezados color teal (#0f766e, texto blanco), filas alternas y columnas:
   - Factor 8M (Personas, Procedimientos, Máquinas, Herramientas, EPP, Gerencia, Entorno, Materiales)
   - Exigencia Operativa del Cargo
   - Condición Bioindividual del Trabajador
   - Nivel de Compatibilidad (Compatible / Control Preventivo / Alerta Crítica) con badges de color.

3. ANÁLISIS DE VULNERABILIDAD BIOCÉNTRICA Y DIFERENCIACIÓN DE CAUSALIDAD ATENEA:
   - Evaluación multidimensional detallada: Dimensión Biomecánica (ergonomía, cargas, posturas), Dimensión Cardiovascular y Fisiológica, Dimensión Psicoemocional y Cognitiva.
   - Causa Suficiente: Identifica el factor crítico en origen que debe ser mitigado por ingeniería para blindar la salud del trabajador.
   - Causas Coadyuvantes: Factores agravantes del entorno o hábitos que requieren acompañamiento.

4. PLAN DE INTERVENCIÓN JERARQUIZADO (Eliminación, Sustitución, Ingeniería, Administrativo, EPP):
   Medidas concretas y accionables adaptadas a las alertas y patologías específicas del trabajador.

5. PLAN DE ACCIÓN PAC 5W2H Y VIGILANCIA EPIDEMIOLÓGICA A 1 AÑO:
   Cronograma de monitoreo médico, periodicidad de valoraciones, exámenes paraclínicos requeridos y metas preventivas.

6. SECCIÓN OFICIAL DE FIRMAS Y AVAL:
   Bloque de 3 firmas: Responsable SG-SST, Representante Legal, y Firma del Colaborador evaluado.

IMPORTANTE: Responde ÚNICAMENTE con el código HTML interno (sin etiquetas <html> o <body>), usando etiquetas semánticas <div>, <h3>, <h4>, <p>, <table>, <tr>, <th>, <td>, <ul>, <li>, <strong> con estilos en línea limpios y legibles.`;

            const res = await fetch('/api/live/ai-edit-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    selectedText: ctx,
                    instruction: inst,
                    reportSourceData: {
                        trabajador: worker,
                        perfilCargo: profile,
                        score: calculatedScore,
                        alertas: fit.auditItems,
                    }
                }),
            });
            const data = await res.json();
            if (data.editedText) {
                const text = data.editedText;
                setAiConclusions(prev => ({ ...prev, [worker.id]: text }));
                setCollapsedCards(prev => ({ ...prev, [worker.id]: false }));
                // Auto-guardado ultra rápido directo al subdocumento en MongoDB
                fetch(`/api/sgsst/perfil-sociodemografico/worker/${worker.id}/dictamen`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ dictamen: text }),
                }).catch(() => {});
                setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, dictamenPredictivoH1: text } : w));
                showToastRef.current({ message: 'Dictamen predictivo generado con éxito ✅', status: 'success' });
            }
        } catch {
            showToastRef.current({ message: 'Error consultando al Oráculo', status: 'error' });
        } finally {
            setGeneratingId(null);
        }
    };

    const handleSaveDictamen = async (workerId: string) => {
        setSavingId(workerId);
        try {
            const currentWorker = workersRef.current.find(w => w.id === workerId);
            const content = aiConclusions[workerId] || currentWorker?.dictamenPredictivoH1 || '';
            if (!content) {
                showToastRef.current({ message: 'No hay contenido para guardar', status: 'warning' });
                return;
            }

            // 1. Guardado ultra rápido en MongoDB (< 30ms)
            const fastRes = await fetch(`/api/sgsst/perfil-sociodemografico/worker/${workerId}/dictamen`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ dictamen: content }),
            });
            if (!fastRes.ok) throw new Error('Error al actualizar trabajador');

            // 2. Guardar snapshot en historial de reportes (para auditoría y versionado)
            const workerName = currentWorker?.nombre || 'Trabajador';
            try {
                await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        content,
                        title: `Dictamen Predictivo H1 - ${workerName} - ${new Date().toLocaleDateString('es-CO')}`,
                        tags: ['sgsst-oraculo-h1', `worker-${workerId}`],
                    }),
                });
            } catch (histErr) {
                console.warn('[OraculoH1] Error saving report history snapshot:', histErr);
            }

            // 3. Actualizar estado local
            setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, dictamenPredictivoH1: content } : w));
            setRefreshTrigger(prev => prev + 1);
            showToastRef.current({ message: 'Dictamen guardado permanentemente ✅', status: 'success' });
        } catch {
            showToastRef.current({ message: 'Error guardando el dictamen', status: 'error' });
        } finally {
            setSavingId(null);
        }
    };

    const handleForceIAEval = async (workerId: string) => {
        setEvaluatingIAId(workerId);
        try {
            const res = await fetch(`/api/sgsst/perfil-sociodemografico/evaluate-ia/${workerId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            // Reload workers to get fresh IA score
            const socioRes = await fetch('/api/sgsst/perfil-sociodemografico/data', { headers: { Authorization: `Bearer ${token}` } });
            const socioData = await socioRes.json();
            setWorkers(socioData.trabajadores || []);
            window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
            showToastRef.current({ message: 'Score IA actualizado ✅', status: 'success' });
        } catch {
            showToastRef.current({ message: 'Error al evaluar con IA', status: 'error' });
        } finally {
            setEvaluatingIAId(null);
        }
    };

    const handleLoadDummyData = async () => {
        const dummyWorkers = generateDummyData.perfilSociodemografico();
        const dummyProfiles = generateDummyData.perfilesCargo();

        setWorkers(dummyWorkers);
        setProfiles(dummyProfiles);

        const init: Record<string, string> = {};
        dummyWorkers.forEach((w: any) => { if (w.dictamenPredictivoH1) init[w.id] = w.dictamenPredictivoH1; });
        setAiConclusions(init);
        setCollapsedCards({});

        try {
            await Promise.all([
                fetch('/api/sgsst/perfil-sociodemografico/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ trabajadores: dummyWorkers }),
                }),
                fetch('/api/sgsst/perfiles-cargo/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ perfilesList: dummyProfiles }),
                }),
            ]);
            window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
            showToastRef.current({ message: '20 trabajadores y perfiles con dictámenes predictivos cargados con éxito', status: 'success' });
        } catch {
            showToastRef.current({ message: 'Error guardando datos de prueba', status: 'error' });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 p-8 text-white shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-400 blur-3xl -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-cyan-400 blur-3xl -ml-10 -mb-10" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-teal-400/20 backdrop-blur-sm border border-teal-400/30 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-teal-300" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight">Oráculo Predictivo H1</h1>
                        </div>
                        <p className="text-teal-100/80 text-sm max-w-2xl leading-relaxed">
                            Motor Bio-Fit WAPPY · Cruza datos clínicos con exigencias del rol para emitir dictámenes de aptitud laboral basados en evidencia.
                        </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                        <button
                            onClick={() => {
                                setHistoryWorkerId(null);
                                setIsHistoryOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/20 backdrop-blur-sm shadow-sm"
                            title="Ver todos los dictámenes predictivos guardados"
                        >
                            <History className="w-4 h-4" />
                            <span>Historial General</span>
                        </button>
                        <DummyGenerateButton onClick={handleLoadDummyData} />
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                {workers.map(worker => {
                    const profile = findMatchingProfile(worker.cargo, profiles);
                    const fit = calcFit(worker, profile);
                    // ─── FUENTE ÚNICA DE VERDAD: El score canónico es el calculado por el backend
                    // y guardado en la BD (biocentricScore). El calcFit() del frontend se usa
                    // únicamente para generar los auditItems (alertas) de display. Esto garantiza
                    // paridad matemática absoluta con la Matriz Bio-IPEVAR que también lee biocentricScore.
                    const score = (worker.biocentricScore !== undefined && worker.biocentricScore !== null)
                        ? worker.biocentricScore
                        : fit.score;
                    const sc = SCORE_COLOR(score);
                    const displayAlerts = fit.auditItems;
                    const hasIATags = fit.hasIATags; // IA has processed this worker's text fields
                    const conclusionContent = aiConclusions[worker.id] || worker.dictamenPredictivoH1 || '';
                    const hasConclusion = !!conclusionContent;
                    const isExpanded = !collapsedCards[worker.id];



                    return (
                        <div key={worker.id} className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden">
                            {/* Worker Header */}
                            <div className="flex items-center gap-4 p-5 border-b border-border-light bg-surface-primary/50">
                                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black ${sc.ring} ${sc.bg} ${sc.text} shrink-0`}>
                                    {(worker.nombre || 'U')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base text-text-primary truncate">{worker.nombre}</h3>
                                    <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                                        {worker.cargo || 'Sin cargo'} · {worker.edad || '?'} años
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${sc.badge}`}>
                                        {score}% FIT
                                    </div>
                                    {hasIATags ? (
                                        <div className="flex items-center gap-1 text-[9px] text-teal-600 dark:text-teal-400 font-bold">
                                            <Sparkles className="w-2.5 h-2.5" /> Análisis IA · {worker.bioScoreIAAptitud || 'Evaluado'}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[9px] text-amber-500 font-bold">
                                            <Clock className="w-2.5 h-2.5" /> Procesando análisis IA…
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Split View: Score + Profile */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border-light">
                                {/* Left - Salud */}
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <HeartPulse className="w-4 h-4 text-teal-500" />
                                        <span className="text-xs font-black uppercase tracking-wider text-text-secondary">Índice Biocéntrico · Salud</span>
                                    </div>
                                    <div className="flex items-start gap-5">
                                        {/* Score ring */}
                                        <div className="shrink-0 flex flex-col items-center">
                                            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${sc.ring} ${sc.text} shadow-lg`}>
                                                <span className="text-xl font-black">{score}%</span>
                                            </div>
                                            <span className="text-[10px] text-text-secondary font-bold mt-1.5 uppercase">Score</span>
                                        </div>
                                        {/* Audit Items */}
                                        <div className="flex-1 space-y-2">
                                            {displayAlerts.length === 0 ? (
                                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" /> Aptitud clínica óptima
                                                </div>
                                            ) : (
                                                displayAlerts.map((item: any, i: number) => {
                                                    const s = SEV_STYLES[item.severity] || SEV_STYLES.info;
                                                    return (
                                                        <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl border ${s.border} bg-surface-primary`}>
                                                            <div className={`text-xs font-black w-7 shrink-0 text-right mt-0.5 ${s.pts}`}>-{Math.abs(item.pts)}</div>
                                                            <div className="shrink-0 mt-0.5">{s.icon}</div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-bold text-text-primary">{item.title}</p>
                                                                <p className="text-[10px] text-text-secondary leading-tight mt-0.5 line-clamp-2">{item.description}</p>
                                                                <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${s.pts} bg-current/10`} style={{opacity: 0.85}}>{item.category}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            {!hasIATags && (
                                                <button
                                                    onClick={() => handleForceIAEval(worker.id)}
                                                    disabled={evaluatingIAId === worker.id}
                                                    className="mt-2 w-full text-[10px] font-bold text-teal-600 hover:text-teal-800 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                                                >
                                                    {evaluatingIAId === worker.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                    {evaluatingIAId === worker.id ? 'Analizando con IA...' : 'Forzar análisis IA'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right - Cargo */}
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Briefcase className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-black uppercase tracking-wider text-text-secondary">Perfil de Cargo · Exigencias</span>
                                    </div>
                                    {!profile ? (
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                                No se encontró perfil de cargo <strong>"{worker.cargo}"</strong> en la base de datos.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'Exigencia Física', value: profile.exigenciaFisica },
                                                { label: 'Exigencia Mental', value: profile.exigenciaMental },
                                                { label: 'Opera Maquinaria', value: profile.operaMaquinaria || 'No' },
                                                { label: 'Nivel de Cargo', value: profile.nivelCargo || 'N/A' },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="bg-surface-primary rounded-xl p-3 border border-border-light text-center">
                                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-wider mb-1">{label}</p>
                                                    <p className={`text-base font-black ${value === 'Alta' || value === 'Sí' ? 'text-red-500' : value === 'Media' ? 'text-amber-500' : 'text-teal-600'}`}>{value || 'N/A'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Conclusion Zone */}
                            <div className="border-t border-border-light bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-900/10 dark:to-cyan-900/10">
                                {!hasConclusion ? (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4">
                                        <div>
                                            <p className="text-sm font-bold text-teal-800 dark:text-teal-300 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> Conclusión Predictiva H1
                                            </p>
                                            <p className="text-xs text-teal-700/70 dark:text-teal-400/70 mt-0.5">Dictamen IA cruzando salud y exigencias del rol.</p>
                                        </div>
                                        <div className="-my-2 flex items-center gap-2">
                                            <SGSSTToolbar
                                                historyButtons={[{
                                                    id: `hist-init-${worker.id}`,
                                                    onClick: () => {
                                                        setHistoryWorkerId(worker.id);
                                                        setIsHistoryOpen(true);
                                                    },
                                                    title: 'Historial de Dictámenes',
                                                    label: 'Historial',
                                                    icon: 'history',
                                                    variant: 'history',
                                                }]}
                                                aiButtons={[{
                                                    id: `consult-${worker.id}`,
                                                    onClick: () => handleConsultOracle(worker, profile, fit),
                                                    title: 'Generar con IA',
                                                    label: 'Generar IA',
                                                    icon: 'sparkles',
                                                    variant: 'ai',
                                                    isLoading: generatingId === worker.id,
                                                    disabled: generatingId === worker.id,
                                                }]}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-b-2xl overflow-hidden bg-surface-primary">
                                        {/* Conclusion Header with toolbar */}
                                        <div
                                            onClick={() => setCollapsedCards(prev => ({ ...prev, [worker.id]: !prev[worker.id] }))}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-border-medium bg-gradient-to-r from-teal-50/80 to-transparent dark:from-teal-950/40 cursor-pointer hover:bg-teal-500/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                                                    <Sparkles className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                                                        Dictamen Predictivo (Oráculo H1)
                                                    </h4>
                                                    <p className="text-[10px] text-text-secondary font-medium">
                                                        Editor en Vivo · Modifica, formatea y exporta este informe
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="-my-2">
                                                    <SGSSTToolbar
                                                        historyButtons={[{
                                                            id: `hist-${worker.id}`,
                                                            onClick: () => {
                                                                setHistoryWorkerId(worker.id);
                                                                setIsHistoryOpen(true);
                                                            },
                                                            title: 'Historial de Dictámenes',
                                                            label: 'Historial',
                                                            icon: 'history',
                                                            variant: 'history',
                                                        }]}
                                                        aiButtons={[{
                                                            id: `reeval-${worker.id}`,
                                                            onClick: () => handleConsultOracle(worker, profile, fit),
                                                            title: 'Generar con IA',
                                                            label: 'Generar IA',
                                                            icon: 'sparkles',
                                                            variant: 'ai',
                                                            isLoading: generatingId === worker.id,
                                                            disabled: generatingId === worker.id,
                                                        }]}
                                                        persistenceButtons={[{
                                                            id: `save-${worker.id}`,
                                                            onClick: () => handleSaveDictamen(worker.id),
                                                            title: 'Guardar Dictamen en BD e Historial',
                                                            label: 'Guardar',
                                                            icon: 'database',
                                                            variant: 'database',
                                                            isLoading: savingId === worker.id,
                                                            disabled: savingId === worker.id,
                                                        }]}
                                                        exportContent={conclusionContent}
                                                        exportFileName={`Dictamen_Predictivo_${(worker.nombre || 'Trabajador').replace(/\s+/g, '_')}`}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setCollapsedCards(prev => ({ ...prev, [worker.id]: !prev[worker.id] }))}
                                                    className="p-2 rounded-xl text-text-secondary hover:bg-surface-secondary transition-colors"
                                                    title={isExpanded ? 'Contraer' : 'Expandir'}
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Conclusion content - LiveEditor with Paper Canvas */}
                                        {isExpanded ? (
                                            <div className="p-4 bg-zinc-100/70 dark:bg-zinc-950/40 border-t border-border-light">
                                                <div className="mx-auto w-full max-w-5xl rounded-2xl border border-border-medium/60 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                                                    <div style={{ minHeight: '400px', overflowX: 'auto', width: '100%' }}>
                                                        <div style={{ minWidth: '850px' }}>
                                                            <LiveEditor
                                                                paperMode={true}
                                                                initialContent={conclusionContent}
                                                                onUpdate={(html) => {
                                                                    setAiConclusions(prev => ({ ...prev, [worker.id]: html }));
                                                                }}
                                                                reportSourceData={{
                                                                    trabajador: worker,
                                                                    perfilCargo: profile,
                                                                    fitScore: score,
                                                                    alertas: displayAlerts
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setCollapsedCards(prev => ({ ...prev, [worker.id]: false }))}
                                                className="w-full text-center py-3 text-xs text-teal-600 dark:text-teal-400 font-bold hover:bg-teal-500/5 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <span>Ver dictamen completo ↓</span>
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {workers.length === 0 && (
                    <div className="text-center py-12 text-text-secondary">
                        <HeartPulse className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay trabajadores registrados en Condiciones de Salud.</p>
                    </div>
                )}
            </div>

            {/* ═══ History Modal (Popup) ═══ */}
            <ReportHistory
                onSelectReport={handleSelectReport}
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(prev => !prev)}
                refreshTrigger={refreshTrigger}
                tags={historyTags}
            />
        </div>
    );
}
