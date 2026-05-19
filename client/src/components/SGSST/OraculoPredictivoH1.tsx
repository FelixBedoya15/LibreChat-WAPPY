import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, HeartPulse, Briefcase, AlertTriangle, ShieldAlert, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { SGSSTToolbar } from './SGSSTToolbar';

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
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [evaluatingIAId, setEvaluatingIAId] = useState<string | null>(null);

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

    // ─── TAG → Score Map: Each IA tag maps to a score penalty ────────────────
    const TAG_RULES: Record<string, { pts: number; sev: string; cat: string; label: string; desc: string }> = {
        Lumbalgia:            { pts: 10, sev: 'warning',  cat: 'Osteomuscular',    label: 'Lumbalgia',             desc: 'Restricción lumbar detectada. Limita carga de peso y posturas prolongadas.' },
        Hernia_Discal:        { pts: 15, sev: 'critical', cat: 'Osteomuscular',    label: 'Hernia Discal',         desc: 'Condición discal que puede agravarse con esfuerzo físico.' },
        Cervicalgia:          { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',    label: 'Cervicalgia',           desc: 'Restricción cervical. Limita posiciones de cuello sostenidas.' },
        Epicondilitis:        { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',    label: 'Epicondilitis',         desc: 'Inflamación en el codo. Limita movimientos repetitivos del antebrazo.' },
        Tunel_Carpiano:       { pts: 8,  sev: 'warning',  cat: 'Osteomuscular',    label: 'Túnel Carpiano',        desc: 'Compresión del nervio mediano. Limita trabajo manual repetitivo.' },
        Restriccion_Hombro:   { pts: 10, sev: 'warning',  cat: 'Osteomuscular',    label: 'Restricción de Hombro', desc: 'Limitación en el complejo del hombro. Limita levantamiento sobre la cabeza.' },
        Restriccion_Rodilla:  { pts: 10, sev: 'warning',  cat: 'Osteomuscular',    label: 'Restricción de Rodilla',desc: 'Limitación articular en rodilla. Limita escaleras, cargas y bipedestación.' },
        No_Carga_Peso:        { pts: 8,  sev: 'warning',  cat: 'Restricción Física',label: 'No Carga de Peso',      desc: 'Restricción médica explícita de levantamiento o carga de objetos.' },
        No_Bipedestacion:     { pts: 5,  sev: 'info',     cat: 'Restricción Física',label: 'No Bipedestación Prolongada', desc: 'Limitación para permanecer de pie por períodos extendidos.' },
        No_Sedestacion:       { pts: 5,  sev: 'info',     cat: 'Restricción Física',label: 'No Sedestación Prolongada',   desc: 'Limitación para permanecer sentado por períodos extendidos.' },
        Hipoacusia:           { pts: 8,  sev: 'warning',  cat: 'Sensorial',        label: 'Hipoacusia',            desc: 'Pérdida auditiva detectada. Requiere protección auditiva y evaluación.' },
        Vision_Reducida:      { pts: 5,  sev: 'info',     cat: 'Sensorial',        label: 'Visión Reducida',       desc: 'Disminución visual. Requiere corrección óptica adecuada para el cargo.' },
        HTA:                  { pts: 15, sev: 'warning',  cat: 'Clínico',          label: 'Hipertensión Arterial', desc: 'Tensión arterial elevada. Requiere seguimiento y control de estrés.' },
        Cardiopatia:          { pts: 20, sev: 'critical', cat: 'Clínico',          label: 'Cardiopatía',           desc: 'Condición cardíaca declarada. Limita esfuerzos físicos intensos.' },
        Diabetes:             { pts: 10, sev: 'warning',  cat: 'Clínico',          label: 'Diabetes',              desc: 'Condición metabólica que requiere control glucémico y pausas.' },
        Epilepsia:            { pts: 25, sev: 'critical', cat: 'Neurológico',      label: 'Epilepsia / Convulsiones','desc': 'Alto riesgo en operación de maquinaria y alturas. Bloqueo preventivo.' },
        Vertigo:              { pts: 18, sev: 'critical', cat: 'Neurológico',      label: 'Vértigo / Mareo',       desc: 'Riesgo de caída en alturas o desequilibrio durante operación de equipos.' },
        EPOC:                 { pts: 15, sev: 'warning',  cat: 'Respiratorio',     label: 'EPOC / Bronquitis',     desc: 'Enfermedad pulmonar obstructiva. Limita exposición a polvo y químicos.' },
        Asma:                 { pts: 10, sev: 'warning',  cat: 'Respiratorio',     label: 'Asma',                  desc: 'Hipersensibilidad bronquial. Limita exposición a irritantes ambientales.' },
        Alergia_Quimica:      { pts: 10, sev: 'warning',  cat: 'Inmunológico',     label: 'Alergia Química',       desc: 'Sensibilidad a agentes químicos. Requiere EPP específico y restricción de área.' },
        Medicamento_SNC:      { pts: 15, sev: 'critical', cat: 'Farmacológico',    label: 'Medicamento Depresor SNC','desc': 'Uso de sedantes o psicotrópicos incompatible con maquinaria. Alerta de seguridad.' },
        Restriccion_Mental:   { pts: 12, sev: 'warning',  cat: 'Psicosocial',      label: 'Restricción de Salud Mental','desc': 'Condición de salud mental que puede afectar concentración y toma de decisiones.' },
        Patologia_Cronica:    { pts: 10, sev: 'warning',  cat: 'Clínico',          label: 'Patología Crónica',     desc: 'Enfermedad crónica base que requiere vigilancia epidemiológica.' },
        Diagnostico_Reciente: { pts: 5,  sev: 'info',     cat: 'Clínico',          label: 'Diagnóstico Reciente',  desc: 'Diagnóstico médico reciente. Amerita seguimiento y ajuste del puesto.' },
        Recomendacion_Leve:   { pts: 3,  sev: 'info',     cat: 'Preventivo',       label: 'Recomendación Médica',  desc: 'Recomendación preventiva activa que debe ser gestionada por SST.' },
    };

    const calcFit = useCallback((w: any, profile: any) => {
        let score = 100;
        const auditItems: { title: string; description: string; pts: number; severity: string; category: string }[] = [];
        const add = (title: string, desc: string, pts: number, sev: string, cat: string) => {
            score -= pts; auditItems.push({ title, description: desc, pts, severity: sev, category: cat });
        };
        if (!profile) return { score: 0, auditItems: [{ title: 'Sin rol asignado', description: 'No se encontró Perfil de Cargo.', pts: 100, severity: 'critical', category: 'Operativo' }] };

        // 1. BIOMETRÍA (valores exactos, sin ambigüedad — sistema determinístico)
        if (w.imc) {
            const imc = parseFloat(w.imc);
            if (imc >= 30) add('Obesidad detectada', `IMC ${imc} indica obesidad. Riesgo cardiovascular elevado.`, 10, 'warning', 'Clínico');
            else if (imc < 18.5) add('Bajo peso', `IMC ${imc} sugiere déficit nutricional.`, 5, 'info', 'Clínico');
        }
        if (w.presionArterial) {
            const [s1, d1] = w.presionArterial.split('/');
            if (parseInt(s1||'0') >= 135 || parseInt(d1||'0') >= 90) add('Riesgo de Hipertensión', `PA ${w.presionArterial} sobre rangos óptimos.`, 15, 'warning', 'Clínico');
        }
        if (w.frecuenciaCardiaca) {
            const fc = parseInt(w.frecuenciaCardiaca);
            if (fc > 100) add('Taquicardia en reposo', `FC ${fc} lpm, posible estrés cardiovascular.`, 10, 'warning', 'Clínico');
            else if (fc < 50) add('Bradicardia', `FC ${fc} lpm, valoración cardiológica recomendada.`, 5, 'info', 'Clínico');
        }

        // 2. HÁBITOS (opciones fijas del formulario — sistema determinístico)
        if (w.fuma === 'Sí, diario') add('Tabaquismo Activo', 'Consumo diario impacta capacidad pulmonar y oxigenación celular.', 10, 'warning', 'Clínico');
        if (w.alcohol === 'Sí (Frecuente)') add('Etilismo Frecuente', 'Aumenta accidentabilidad y vulnerabilidad hepática.', 15, 'warning', 'Psicosocial');

        // 3. CAMPOS DE TEXTO LIBRE → IA SEMÁNTICA (usa bioTagsIA si disponible, fallback básico si no)
        const iaTags: string[] = w.bioTagsIA || [];
        const hasIATags = iaTags.length > 0 && !iaTags.includes('Sin_Hallazgos');
        const hasAnyText = [
            w.limitacionesBiomecanicas, w.recomendacionesMedicas,
            w.diagnosticoMedico, w.enfermedades, w.alergiasQuimicas, w.medicamentos
        ].some(v => v && String(v).trim().length > 2 && !String(v).toLowerCase().includes('ninguna') && !String(v).toLowerCase().includes('ninguno'));

        if (hasAnyText) {
            if (hasIATags) {
                // IA semántica disponible: convertir etiquetas a penalizaciones
                iaTags.forEach(tag => {
                    const rule = TAG_RULES[tag];
                    if (!rule) return;
                    let pts = rule.pts;
                    // Multiplicadores por exigencias del cargo
                    if (tag === 'Lumbalgia' || tag === 'Hernia_Discal' || tag === 'Restriccion_Hombro' || tag === 'Restriccion_Rodilla') {
                        if (profile.exigenciaFisica === 'Alta') pts = Math.round(pts * 1.5);
                    }
                    if ((tag === 'Epilepsia' || tag === 'Vertigo' || tag === 'Medicamento_SNC' || tag === 'Restriccion_Mental') && profile.operaMaquinaria === 'Sí') {
                        pts = Math.round(pts * 2.0);
                    }
                    if (tag === 'Restriccion_Mental' && profile.exigenciaMental === 'Alta') {
                        pts = Math.round(pts * 1.5);
                    }
                    add(rule.label, rule.desc + (pts !== rule.pts ? ` ⚠️ Penalización agravada por exigencias del cargo.` : ''), pts, rule.sev, rule.cat);
                });
            } else {
                // Fallback básico mientras IA procesa (solo si no hay tags aún)
                const hasEnf = w.enfermedades?.trim() && !w.enfermedades.toLowerCase().includes('ninguna');
                const hasDiag = w.diagnosticoMedico?.trim() && !w.diagnosticoMedico.toLowerCase().includes('ninguno') && !w.diagnosticoMedico.toLowerCase().includes('apto');
                const hasRestr = w.limitacionesBiomecanicas?.trim() && !w.limitacionesBiomecanicas.toLowerCase().includes('ninguna');
                const hasRec = w.recomendacionesMedicas?.trim() && !w.recomendacionesMedicas.toLowerCase().includes('ninguna');
                const hasAl = w.alergiasQuimicas?.trim() && !w.alergiasQuimicas.toLowerCase().includes('ninguna');
                if (hasEnf) add('Patología Base (pendiente análisis IA)', `"${w.enfermedades}" — Procesando con IA semántica.`, 10, 'warning', 'Clínico');
                if (hasDiag && !hasEnf) add('Diagnóstico Médico (pendiente análisis IA)', `"${w.diagnosticoMedico}" — Procesando con IA semántica.`, 5, 'info', 'Clínico');
                if (hasRestr) add('Restricción Biomecánica (pendiente análisis IA)', `"${w.limitacionesBiomecanicas}" — Procesando con IA semántica.`, 8, 'warning', 'Osteomuscular');
                if (hasRec) add('Recomendación Médica (pendiente análisis IA)', `"${w.recomendacionesMedicas}" — Procesando con IA semántica.`, 3, 'info', 'Preventivo');
                if (hasAl) add('Alergia Química (pendiente análisis IA)', `"${w.alergiasQuimicas}" — Procesando con IA semántica.`, 8, 'warning', 'Inmunológico');
            }
        }

        // 4. VULNERABILIDAD SOCIODEMOGRÁFICA (datos estructurados del formulario)
        // NOTA: Para evitar sesgos discriminatorios (Ley y OIT), estos factores NO restan puntos al "Fit" (pts = 0).
        // Se mantienen únicamente como Alertas de Vigilancia Epidemiológica para el prevencionista SST.
        let vs = 0;
        let socialDesc: string[] = [];
        if (['1', '2'].includes(w.estrato)) { vs++; socialDesc.push('estrato socioeconómico bajo'); }
        if (w.personasCargo && Number(w.personasCargo) >= 3) { vs++; socialDesc.push('alta carga de dependientes'); }
        if (w.estadoCivil?.toLowerCase().includes('solter') || w.estadoCivil?.toLowerCase().includes('viud') || w.estadoCivil?.toLowerCase().includes('divorciad')) {
            if (w.personasCargo && Number(w.personasCargo) > 0) { vs++; socialDesc.push('monoparentalidad'); }
        }
        if (w.vivienda?.toLowerCase().includes('arrendada') || w.vivienda?.toLowerCase().includes('invasión')) { vs++; socialDesc.push('inestabilidad habitacional'); }

        if (vs >= 3) add('Vulnerabilidad Sociodemográfica', `Factores estresores: ${socialDesc.join(', ')}. Sugerido apoyo psicosocial.`, 0, 'info', 'Vigilancia Epidemiológica');
        else if (vs >= 2) add('Factores Psicosociales Externos', `Factores detectados: ${socialDesc.join(', ')}.`, 0, 'info', 'Vigilancia Epidemiológica');
        if (w.nivelEscolaridad?.toLowerCase().includes('primaria')) add('Escolaridad Básica', 'Requiere métodos de capacitación visuales y acompañamiento cercano en SST.', 0, 'info', 'Vigilancia Epidemiológica');

        // 5. CRUCE CARGO × DATOS FIJOS
        const hasEnfFijo = w.enfermedades?.trim() && !w.enfermedades.toLowerCase().includes('ninguna');
        const hasDiagFijo = w.diagnosticoMedico?.trim() && !w.diagnosticoMedico.toLowerCase().includes('ninguno') && !w.diagnosticoMedico.toLowerCase().includes('apto');
        if (profile.exigenciaFisica === 'Alta') {
            if (w.edad && Number(w.edad) > 55) add('Alerta Ergonómica por Edad', `Edad ${w.edad} años con alta exigencia física. Monitoreo preventivo requerido.`, 0, 'info', 'Preventivo');
            if (!hasIATags && (hasEnfFijo || hasDiagFijo)) add('Patología en Rol de Alta Exigencia', 'La carga física intensa puede agravar la condición clínica base.', 10, 'critical', 'Operativo');
        }
        if (profile.exigenciaMental === 'Alta') {
            if (w.terapiaPsicologica === 'Sí') add('Alerta de Burnout', 'Rol de alta tensión mental sumado a psicoterapia activa. Riesgo de agotamiento.', 15, 'critical', 'Psicosocial');
            if (vs >= 2) add('Contexto Psicosocial Estresante', 'Vulnerabilidad social + rol de alta exigencia mental. Requiere vigilancia activa de estrés.', 0, 'info', 'Vigilancia Epidemiológica');
        }
        if (profile.operaMaquinaria === 'Sí') {
            const medLower = (w.medicamentos || '').toLowerCase();
            const lethal = medLower.includes('psiquiátrico') || medLower.includes('dormir') || medLower.includes('sedante') || medLower.includes('ansiolítico');
            if (!hasIATags && (lethal || w.alcohol === 'Sí (Frecuente)')) add('🛑 BLOQUEO PREVENTIVO', 'Uso de depresores del SNC incompatible con maquinaria. Riesgo de accidente fatal.', 40, 'critical', 'Operativo');
        }
        if (profile.entrenamientosSeleccionados?.length > 0 && !w.curso50h && !w.curso20h) add('Brecha Formativa SST', `Cursos obligatorios sin acreditar: ${profile.entrenamientosSeleccionados.join(', ')}.`, 5, 'warning', 'Entrenamiento');

        return { score: Math.max(0, score), auditItems, hasIATags };
    }, [TAG_RULES]);



    const handleConsultOracle = async (worker: any, profile: any, fit: any) => {
        setGeneratingId(worker.id);
        try {
            const ctx = `Trabajador: ${worker.nombre}, Cargo: ${worker.cargo}, Edad: ${worker.edad}
Score Biocéntrico: ${fit.score}%
Alertas (${fit.auditItems.length}): ${fit.auditItems.map((a:any) => a.title).join(', ')}
Enfermedades: ${worker.enfermedades||'Ninguna'} | Diagnóstico: ${worker.diagnosticoMedico||'Ninguno'}
Hábitos: Fuma=${worker.fuma||'No'}, Alcohol=${worker.alcohol||'No'}, Terapia Psicológica=${worker.terapiaPsicologica||'No'}
Cargo exige Física: ${profile?.exigenciaFisica||'N/A'}, Mental: ${profile?.exigenciaMental||'N/A'}`;
            const inst = `Eres el Oráculo Predictivo H1 de WAPPY. Genera un informe maestro en HTML (párrafos con <p>, <strong>, <h3>, <ul><li>) de más de 3000 palabras con: 1) Análisis exhaustivo de aptitud desglosando dimensiones biomecánica, cognitiva y psicosocial, 2) Riesgos de incompatibilidad inminentes y crónicos a largo plazo, 3) Plan de mejora inmediata y vigilancia epidemiológica a 1 año para este trabajador.`;
            const res = await fetch('/api/live/ai-edit-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ selectedText: ctx, instruction: inst }),
            });
            const data = await res.json();
            if (data.editedText) {
                setAiConclusions(prev => ({ ...prev, [worker.id]: data.editedText }));
                setExpandedId(worker.id);
            }
        } catch { showToastRef.current({ message: 'Error consultando al Oráculo', status: 'error' }); }
        finally { setGeneratingId(null); }
    };

    const handleSaveDictamen = async (workerId: string) => {
        setSavingId(workerId);
        try {
            // Use ref to get current workers to avoid stale closure
            const updatedWorkers = workersRef.current.map(w =>
                w.id === workerId ? { ...w, dictamenPredictivoH1: aiConclusions[workerId] } : w
            );
            const res = await fetch('/api/sgsst/perfil-sociodemografico/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ trabajadores: updatedWorkers }),
            });
            if (!res.ok) throw new Error();
            // Update workers but do NOT touch aiConclusions
            setWorkers(updatedWorkers);
            showToastRef.current({ message: 'Dictamen guardado permanentemente ✅', status: 'success', severity: 'success' });
        } catch { showToastRef.current({ message: 'Error guardando el dictamen', status: 'error' }); }
        finally { setSavingId(null); }
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
            showToastRef.current({ message: 'Score IA actualizado ✅', status: 'success', severity: 'success' });
        } catch {
            showToastRef.current({ message: 'Error al evaluar con IA', status: 'error' });
        } finally {
            setEvaluatingIAId(null);
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
                <div className="relative z-10">
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
            </div>

            <div className="space-y-5">
                {workers.map(worker => {
                    const profile = profiles.find(p => (p.nombreCargo || '').toLowerCase().trim() === (worker.cargo || '').toLowerCase().trim());
                    const fit = calcFit(worker, profile);
                    // Score is always computed by the deterministic system (calcFit)
                    const score = fit.score;
                    const sc = SCORE_COLOR(score);
                    const displayAlerts = fit.auditItems;
                    const hasIATags = fit.hasIATags; // IA has processed this worker's text fields
                    const hasConclusion = !!aiConclusions[worker.id];
                    const isExpanded = expandedId === worker.id;


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
                                        <div className="-my-2">
                                            <SGSSTToolbar aiButtons={[{
                                                id: `consult-${worker.id}`,
                                                onClick: () => handleConsultOracle(worker, profile, fit),
                                                title: 'Consultar Oráculo',
                                                label: 'Consultar Oráculo',
                                                icon: 'sparkles',
                                                variant: 'ai',
                                                isLoading: generatingId === worker.id,
                                                disabled: generatingId === worker.id,
                                            }]} />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Conclusion Header with toolbar */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-teal-200/50 dark:border-teal-800/50">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : worker.id)}
                                                className="flex items-center gap-2 text-sm font-bold text-teal-800 dark:text-teal-300 hover:text-teal-600 transition-colors"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Dictamen Predictivo (Oráculo H1)
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            <div className="-my-2">
                                                <SGSSTToolbar
                                                    aiButtons={[{
                                                        id: `reeval-${worker.id}`,
                                                        onClick: () => handleConsultOracle(worker, profile, fit),
                                                        title: 'Re-evaluar',
                                                        label: 'Re-evaluar',
                                                        icon: 'brain',
                                                        variant: 'default',
                                                        isLoading: generatingId === worker.id,
                                                        disabled: generatingId === worker.id,
                                                    }]}
                                                    persistenceButtons={[{
                                                        id: `save-${worker.id}`,
                                                        onClick: () => handleSaveDictamen(worker.id),
                                                        title: 'Guardar Dictamen',
                                                        label: 'Guardar',
                                                        icon: 'database',
                                                        variant: 'database',
                                                        isLoading: savingId === worker.id,
                                                        disabled: savingId === worker.id,
                                                    }]}
                                                />
                                            </div>
                                        </div>
                                        {/* Conclusion content - collapsible */}
                                        {isExpanded && (
                                            <div
                                                className="px-5 py-4 prose prose-sm max-w-none text-text-primary text-xs leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: aiConclusions[worker.id] }}
                                            />
                                        )}
                                        {!isExpanded && (
                                            <button
                                                onClick={() => setExpandedId(worker.id)}
                                                className="w-full text-center py-2.5 text-xs text-teal-600 font-bold hover:text-teal-800 transition-colors"
                                            >
                                                Ver dictamen completo ↓
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
        </div>
    );
}
