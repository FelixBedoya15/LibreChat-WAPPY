import re

file_path = "client/src/components/SGSST/CondicionesSalud.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Imports
if "Stethoscope," not in content:
    content = content.replace("AlertTriangle\n}", "AlertTriangle,\n    Activity,\n    Stethoscope,\n    UserCircle\n}")

# 2. Extract markers
# We replace EVERYTHING from "{/* Worker Body */}" (inclusive) up to (but excluding) "{/* Add Worker Button */}"
# Note: we need to keep the structure inside map loop:
# So we need to end it with the correct closing div and the closing braces of the map.

start_marker = "{/* Worker Body */}"
end_marker = "{/* Add Worker Button */}"

start_index = content.find(start_marker)
end_index = content.find(end_marker)

if start_index != -1 and end_index != -1:
    new_jsx = """{/* Worker Body, Premium Medical Dashboard UI */}
                                {expandedWorkers.has(w.id) && (
                                    <div className="p-0 border-t border-border-light animate-in fade-in duration-300 bg-surface-primary/20 relative">
                                        
                                        {/* Bio-Fit Radar Premium Card */}
                                        {w.cargo && cargosDisponibles.length > 0 && (
                                            <div className="p-5 md:p-8 border-b border-border-light bg-gradient-to-br from-surface-secondary/80 to-surface-primary relative overflow-hidden">
                                                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 pointer-events-none ${scoreBg}`}></div>
                                                
                                                <div className={`p-6 rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-md transition-all duration-500 hover:shadow-lg relative overflow-hidden bg-white/40 dark:bg-[#1a1a1a]/40 group`}>
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-700 ${fitData.score >= 80 ? 'bg-gradient-to-b from-green-400 to-emerald-600' : fitData.score >= 60 ? 'bg-gradient-to-b from-yellow-400 to-orange-500' : 'bg-gradient-to-b from-red-500 to-rose-700'}`}></div>

                                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pl-4">
                                                        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                                                            <div className="relative group-hover:scale-105 transition-transform duration-500">
                                                                <svg className="w-28 h-28 transform -rotate-90">
                                                                    <circle cx="56" cy="56" r="50" fill="none" stroke="currentColor" strokeWidth="6" className="text-border-light dark:text-white/5" />
                                                                    <circle cx="56" cy="56" r="50" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="314.159" strokeDashoffset={314.159 - (fitData.score / 100) * 314.159} className={`transition-all duration-1000 ease-out ${scoreColor}`} strokeLinecap="round" />
                                                                </svg>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                    <span className={`text-3xl font-black tracking-tighter ${scoreColor}`}>{fitData.score}%</span>
                                                                    <span className="text-[9px] uppercase font-bold tracking-widest text-text-secondary">FIT</span>
                                                                </div>
                                                            </div>

                                                            <div className="text-center md:text-left">
                                                                <h4 className="text-lg font-black text-text-primary uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start gap-2">
                                                                    <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse"/> Índice Biocéntrico Integral
                                                                </h4>
                                                                <p className="text-sm font-medium text-text-secondary leading-relaxed max-w-sm">Evaluación clínica vs exigencias del rol: <span className="font-bold text-text-primary p-1 bg-surface-secondary rounded-md border border-border-light">{w.cargo}</span>.</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2.5 w-full md:flex-1 md:max-w-md">
                                                            {fitData.alerts.length === 0 ? (
                                                                <div className="flex items-center gap-3 text-sm font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-2xl shadow-sm">
                                                                    <div className="p-2bg-green-100 dark:bg-green-800/50 rounded-full"><CheckCircle className="w-5 h-5"/></div>
                                                                    Aptitud Operativa Óptima.
                                                                </div>
                                                            ) : (
                                                                fitData.alerts.map((alert, idx) => (
                                                                    <div key={idx} className={`flex text-xs font-bold px-4 py-3 rounded-2xl gap-3 items-center border transition-all duration-300 hover:-translate-x-1 ${alert.includes('BLOQUEO') ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg animate-[pulse_2s_ease-in-out_infinite] border-red-400' : 'text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50'}`}>
                                                                         <AlertTriangle className="w-5 h-5 flex-shrink-0 opacity-90"/> <span className="leading-tight">{alert}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Clinical Database Forms */}
                                        <div className="p-5 md:p-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                
                                                {/* Grupo 1: Fisiología */}
                                                <div className="lg:col-span-4 pb-3 mb-2 flex items-center justify-between border-b border-border-light">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
                                                            <Stethoscope className="w-4 h-4" />
                                                        </div>
                                                        <h4 className="font-black text-sm text-text-primary uppercase tracking-wider">Línea Base Fisiológica</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 ">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Peso (kg)</label>
                                                    <input type="number" value={w.peso} onChange={e => updateWorkerField(w.id, 'peso', e.target.value)}
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary font-medium outline-none" />
                                                </div>
                                                <div className="space-y-1.5 ">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Talla (m)</label>
                                                    <input type="number" value={w.talla} onChange={e => updateWorkerField(w.id, 'talla', e.target.value)} step="0.01" placeholder="Ej: 1.75"
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary font-medium outline-none" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">IMC (Calculado)</label>
                                                    <div className="relative">
                                                        <input type="text" readOnly value={w.imc} placeholder="Automático"
                                                            className={`w-full text-sm font-black py-2.5 px-3 rounded-xl border outline-none ${w.imc && parseFloat(w.imc) > 25 ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 shadow-[inset_0_2px_10px_rgba(251,146,60,0.1)]' : 'border-border-light bg-surface-tertiary text-text-tertiary'}`} />
                                                        {w.imc && <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full w-2 h-2 bg-current opacity-50"></div>}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Tipo Sangre</label>
                                                    <SingleSelect value={w.tipoSangre || ''} onChange={val => updateWorkerField(w.id, 'tipoSangre', val)} placeholder="Seleccione..." options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']} />
                                                </div>
                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Presión Arterial</label>
                                                    <input type="text" value={w.presionArterial} onChange={e => updateWorkerField(w.id, 'presionArterial', e.target.value)}
                                                        placeholder="Sistólica / Diastólica (Ej: 120/80)" className="w-full text-sm py-2.5 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary outline-none" />
                                                </div>
                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Frec. Cardíaca (lpm)</label>
                                                    <input type="number" value={w.frecuenciaCardiaca} onChange={e => updateWorkerField(w.id, 'frecuenciaCardiaca', e.target.value)}
                                                        placeholder="Latidos por minuto" className="w-full text-sm py-2.5 px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary outline-none" />
                                                </div>

                                                {/* Grupo 2: Patológico */}
                                                <div className="lg:col-span-4 pb-3 mb-2 mt-6 flex items-center justify-between border-b border-border-light">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
                                                            <Activity className="w-4 h-4" />
                                                        </div>
                                                        <h4 className="font-black text-sm text-text-primary uppercase tracking-wider">Restricciones Clínicas y Patológicas</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Alergias Químicas / Asma</label>
                                                    <input type="text" value={w.alergiasQuimicas} onChange={e => updateWorkerField(w.id, 'alergiasQuimicas', e.target.value)}
                                                        placeholder="Riesgo de choque anafiláctico / respiratorio..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-rose-200/50 bg-rose-50/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-text-primary dark:border-rose-900/30 dark:bg-rose-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Limitaciones Biomecánicas</label>
                                                    <input type="text" value={w.limitacionesBiomecanicas} onChange={e => updateWorkerField(w.id, 'limitacionesBiomecanicas', e.target.value)}
                                                        placeholder="Hernia, manguito rotador, rodillas..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-rose-200/50 bg-rose-50/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-text-primary dark:border-rose-900/30 dark:bg-rose-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-4">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Enfermedades Preexistentes Diagnosticadas</label>
                                                    <input type="text" value={w.enfermedades} onChange={e => updateWorkerField(w.id, 'enfermedades', e.target.value)}
                                                        placeholder="Patologías metabólicas, diabetes, cardíacas..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-rose-200/50 bg-rose-50/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-text-primary dark:border-rose-900/30 dark:bg-rose-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Hallazgos Examen Ocupacional</label>
                                                    <div className="[&>div>div]:border-rose-200/50 dark:[&>div>div]:border-rose-900/30 [&>div>div]:bg-rose-50/30 dark:[&>div>div]:bg-rose-900/10">
                                                        <SingleSelect value={w.diagnosticoMedico || ''} onChange={val => updateWorkerField(w.id, 'diagnosticoMedico', val)} placeholder="Seleccione dictamen principal..." options={['Apto / Sin Hallazgos / Ninguno', 'Espalda: Lumbalgia / Cervicalgia / Hernias', 'M. Superiores: Túnel carpiano / Epicondilitis / Manguito', 'Vicios de refracción', 'Hipoacusia', 'Otros Clínicos']} />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-2">
                                                    <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Medicamentos de Consumo</label>
                                                    <input type="text" value={w.medicamentos} onChange={e => updateWorkerField(w.id, 'medicamentos', e.target.value)}
                                                        placeholder="Psiquiátricos, dopaminérgicos, relajantes (riesgo maquinaria)..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-rose-200/50 bg-rose-50/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-text-primary dark:border-rose-900/30 dark:bg-rose-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-3">
                                                    <label className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Recomendaciones & Restricciones Médicas (SST)</label>
                                                    <input type="text" value={w.recomendacionesMedicas || ''} onChange={e => updateWorkerField(w.id, 'recomendacionesMedicas', e.target.value)}
                                                        placeholder="Pautas del médico para reubicación laboral..."
                                                        className="w-full text-sm py-2.5 px-3 rounded-xl border border-orange-200/50 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-text-primary dark:border-orange-900/30 dark:bg-orange-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Fecha Evaluación</label>
                                                    <input type="date" value={w.fechaExamenMedico} onChange={e => updateWorkerField(w.id, 'fechaExamenMedico', e.target.value)}
                                                        className="w-full text-sm py-[9px] px-3 rounded-xl border border-orange-200/50 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-text-primary dark:border-orange-900/30 dark:bg-orange-900/10 dark:focus:bg-surface-primary outline-none" />
                                                </div>

                                                {/* Grupo 3: Estilos de Vida Inadecuados */}
                                                <div className="lg:col-span-4 pb-3 mb-2 mt-6 flex items-center justify-between border-b border-border-light">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                                                            <UserCircle className="w-4 h-4" />
                                                        </div>
                                                        <h4 className="font-black text-sm text-text-primary uppercase tracking-wider">Estilos de Vida & Carga Mental</h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Tabaquismo</label>
                                                    <div className="[&>div>div]:border-amber-200/50 [&>div>div]:bg-amber-50/30 dark:[&>div>div]:border-amber-900/30  dark:[&>div>div]:bg-amber-900/10">
                                                        <SingleSelect value={w.fuma || ''} onChange={val => updateWorkerField(w.id, 'fuma', val)} placeholder="Seleccione..." options={['No', 'Sí, diario', 'Ocasional']} />
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Etilismo (Alcohol)</label>
                                                    <div className="[&>div>div]:border-amber-200/50 [&>div>div]:bg-amber-50/30 dark:[&>div>div]:border-amber-900/30  dark:[&>div>div]:bg-amber-900/10">
                                                        <SingleSelect value={w.alcohol || ''} onChange={val => updateWorkerField(w.id, 'alcohol', val)} placeholder="Anotador de Riesgo Letal..." options={['No', 'Mensual', 'Semanal', 'Sí (Frecuente)']} />
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Acompañamiento Psicológico</label>
                                                    <div className="[&>div>div]:border-indigo-200/50 [&>div>div]:bg-indigo-50/30 dark:[&>div>div]:border-indigo-900/30  dark:[&>div>div]:bg-indigo-900/10">
                                                        <SingleSelect value={w.terapiaPsicologica || ''} onChange={val => updateWorkerField(w.id, 'terapiaPsicologica', val)} placeholder="Indicador de Burnout..." options={['No', 'Sí', 'Anteriormente']} />
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 lg:col-span-1">
                                                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Próximo Segumiento</label>
                                                    <input type="date" value={w.fechaSeguimiento} onChange={e => updateWorkerField(w.id, 'fechaSeguimiento', e.target.value)}
                                                        className="w-full text-sm py-[9px] px-3 rounded-xl border border-border-medium bg-surface-secondary focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-text-primary outline-none" />
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                        })}
"""
    
    # We slice content up to start_marker and then from end_marker down
    final_content = content[:start_index] + new_jsx + "\n                        " + content[end_index:]
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    
    print("Script ejecutado y CondicionesSalud modificado exítosamente.")
else:
    print("No encontré los delimitadores")
