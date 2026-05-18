import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, HeartPulse, Briefcase, AlertTriangle, ShieldAlert, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
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
    }, [token]);

    const calcFit = useCallback((w: any, profile: any) => {
        let score = 100;
        const auditItems: { title: string; description: string; pts: number; severity: string; category: string }[] = [];
        const add = (title: string, desc: string, pts: number, sev: string, cat: string) => {
            score -= pts; auditItems.push({ title, description: desc, pts, severity: sev, category: cat });
        };
        if (!profile) return { score: 0, auditItems: [{ title: 'Sin rol asignado', description: 'No se encontró Perfil de Cargo.', pts: 100, severity: 'critical', category: 'Operativo' }] };

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
        if (w.fuma === 'Sí, diario') add('Tabaquismo Activo', 'Consumo diario impacta capacidad pulmonar.', 10, 'warning', 'Clínico');
        if (w.alcohol === 'Sí (Frecuente)') add('Etilismo Frecuente', 'Aumenta accidentabilidad y vulnerabilidad hepática.', 15, 'warning', 'Psicosocial');
        const hasEnf = w.enfermedades?.trim() && !w.enfermedades.toLowerCase().includes('ningun');
        if (hasEnf) add('Patología Base', `Condición: ${w.enfermedades}.`, 10, 'warning', 'Clínico');
        const hasDiag = w.diagnosticoMedico?.trim() && !w.diagnosticoMedico.toLowerCase().includes('ningun');
        if (hasDiag && !hasEnf) add('Diagnóstico Médico Reciente', 'Diagnóstico que amerita vigilancia médica.', 5, 'info', 'Clínico');
        const hasBio = w.limitacionesBiomecanicas && w.limitacionesBiomecanicas.length > 2 && !w.limitacionesBiomecanicas.toLowerCase().includes('ningun');
        if (hasBio) add('Limitación Biomecánica', `Restricción: ${w.limitacionesBiomecanicas}.`, 10, 'warning', 'Físico');
        const hasAl = w.alergiasQuimicas && w.alergiasQuimicas.length > 2 && !w.alergiasQuimicas.toLowerCase().includes('ningun');
        if (hasAl) add('Sensibilidad Inmunológica', 'Alergia química detectada. Peligro de anafilaxia.', 10, 'warning', 'Clínico');

        let vs = 0;
        if (['1', '2'].includes(w.estrato)) vs++;
        if (w.personasCargo && Number(w.personasCargo) >= 3) vs++;
        if (w.vivienda?.toLowerCase().includes('arrendada') || w.vivienda?.toLowerCase().includes('invasión')) vs++;
        if (vs >= 3) add('Alta Vulnerabilidad Sociodemográfica', 'Múltiples factores estresores crónicos activos.', 15, 'warning', 'Psicosocial');
        else if (vs >= 2) add('Riesgo Psicosocial Moderado', 'Factores de presión externa acumulados.', 5, 'info', 'Psicosocial');
        if (w.nivelEscolaridad?.toLowerCase().includes('primaria')) add('Escolaridad Básica', 'Requiere capacitación más visual en SST.', 5, 'info', 'Sociodemográfico');

        if (profile.exigenciaFisica === 'Alta') {
            if (w.edad && Number(w.edad) > 55) add('Desajuste Etario', 'Edad avanzada con alta exigencia física.', 10, 'warning', 'Operativo');
            if (hasEnf || hasDiag) add('Patología en Rol Exigente', 'Carga física puede agravar patología base.', 10, 'critical', 'Operativo');
            if (hasBio) add('Restricción Biomecánica Crítica', 'Peligro inminente de lesión osteomuscular.', 20, 'critical', 'Operativo');
        }
        if (profile.exigenciaMental === 'Alta') {
            if (w.terapiaPsicologica === 'Sí') add('Alerta de Burnout', 'Alta tensión mental + psicoterapia activa.', 15, 'critical', 'Psicosocial');
            if (vs >= 2) add('Sobrecarga Cognitiva', 'Vulnerabilidad social + rol estresante.', 10, 'warning', 'Psicosocial');
        }
        if (profile.operaMaquinaria === 'Sí') {
            const lethal = w.medicamentos?.toLowerCase().includes('psiquiátrico') || w.medicamentos?.toLowerCase().includes('dormir');
            if (lethal || w.alcohol === 'Sí (Frecuente)') add('🛑 BLOQUEO PREVENTIVO', 'SNC deprimido incompatible con maquinaria.', 40, 'critical', 'Operativo');
        }
        if (profile.entrenamientosSeleccionados?.length > 0 && !w.curso50h && !w.curso20h) add('Brecha Formativa SST', 'Ausencia de certificados obligatorios del perfil.', 5, 'warning', 'Entrenamiento');

        return { score: Math.max(0, score), auditItems };
    }, []);

    const handleConsultOracle = async (worker: any, profile: any, fit: any) => {
        setGeneratingId(worker.id);
        try {
            const ctx = `Trabajador: ${worker.nombre}, Cargo: ${worker.cargo}, Edad: ${worker.edad}
Score Biocéntrico: ${fit.score}%
Alertas (${fit.auditItems.length}): ${fit.auditItems.map((a:any) => a.title).join(', ')}
Enfermedades: ${worker.enfermedades||'Ninguna'} | Diagnóstico: ${worker.diagnosticoMedico||'Ninguno'}
Hábitos: Fuma=${worker.fuma||'No'}, Alcohol=${worker.alcohol||'No'}, Terapia Psicológica=${worker.terapiaPsicologica||'No'}
Cargo exige Física: ${profile?.exigenciaFisica||'N/A'}, Mental: ${profile?.exigenciaMental||'N/A'}`;
            const inst = `Eres el Oráculo Predictivo H1 de WAPPY. Genera un informe maestro en HTML (párrafos con <p>, <strong>, <h3>, <ul><li>) de más de 3000 palabras con: 1) Análisis exhaustivo de aptitud desglosando dimensiones biomecánica, cognitiva y psicosocial, 2) Riesgos de incompatibilidad inminentes y crónicos a largo plazo, 3) Plan de mejora inmediata y vigilancia epidemiológica a 5 años para este trabajador.`;
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
                    const sc = SCORE_COLOR(fit.score);
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
                                <div className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${sc.badge}`}>
                                    {fit.score}% FIT
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
                                                <span className="text-xl font-black">{fit.score}%</span>
                                            </div>
                                            <span className="text-[10px] text-text-secondary font-bold mt-1.5 uppercase">Score</span>
                                        </div>
                                        {/* Audit Items */}
                                        <div className="flex-1 space-y-2">
                                            {fit.auditItems.length === 0 ? (
                                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" /> Aptitud clínica óptima
                                                </div>
                                            ) : (
                                                fit.auditItems.slice(0, 4).map((item: any, i: number) => {
                                                    const s = SEV_STYLES[item.severity] || SEV_STYLES.info;
                                                    return (
                                                        <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border ${s.border} bg-surface-primary`}>
                                                            <div className={`text-xs font-black w-7 shrink-0 text-right ${s.pts}`}>-{item.pts}</div>
                                                            <div className="shrink-0">{s.icon}</div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-text-primary truncate">{item.title}</p>
                                                                <p className="text-[10px] text-text-secondary truncate">{item.category}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            {fit.auditItems.length > 4 && (
                                                <p className="text-[10px] text-text-secondary text-center font-bold pt-1">+{fit.auditItems.length - 4} alertas más</p>
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
