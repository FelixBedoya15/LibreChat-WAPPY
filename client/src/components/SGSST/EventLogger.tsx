import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Activity, Calendar, DollarSign, User, ShieldAlert, FileText, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react';

export type AbsenceCategory = 'SALUD' | 'LICENCIA_LEY' | 'PERMISOS' | 'DISRUPCION';

export type EventType =
    | 'AT'           // Accidente de Trabajo (ARL 100%)
    | 'EL'           // Enfermedad Laboral (ARL 100%)
    | 'EG_EPS'       // Enfermedad General (EPS)
    | 'ACC_COMUN'    // Accidente Común (EPS)
    | 'CITA_MED'     // Cita Médica / Terapias
    | 'LIC_MAT'      // Licencia de Maternidad (EPS 100%)
    | 'LIC_PAT'      // Licencia de Paternidad (EPS 100%)
    | 'LUTO'         // Licencia por Luto (5 días remunerados)
    | 'CALAMIDAD'    // Calamidad Doméstica (Remunerado)
    | 'SUFRAGIO'     // Votación / Jurado
    | 'LEY_2174'     // Cuidado Hijos Menores Enfermos (EPS)
    | 'SINDICAL'     // Permiso Sindical (Remunerado)
    | 'PERM_REM'     // Permiso Personal Remunerado
    | 'LIC_NO_REM'   // Licencia No Remunerada (LNR - Suspensión)
    | 'SANCION_DISC' // Suspensión Disciplinaria
    | 'NO_JUSTIF'    // Falta Injustificada / Abandono
    | 'Ausentismo';  // Retrocompatibilidad

export interface EventFinancials {
    costoDirectoSalario: number;
    costoSeguridadSocial: number;
    costoSeguridadSocialCubiertoARL: number;
    costoPrestacional: number;
    costoReemplazo: number;
    costoIndirectoIceberg: number;
    costoTotalBruto: number;
    montoRecobroEPS: number;
    montoRecobroARL: number;
    perdidaNetaEmpresa: number;
}

export interface ATELContext {
    id: string;
    fecha: string;
    fechaFin?: string;
    tipo: EventType;
    causaInmediata?: string;
    peligro?: string;
    consecuencia?: string;
    diasIncapacidad: number;
    horasAusencia?: number;
    diasCargados?: number;
    parteCuerpo?: string;
    esProrroga?: boolean;
    colaborador?: {
        nombre: string;
        cedula?: string;
        cargo?: string;
        area?: string;
        ibcMensual: number;
    };
    diagnosticoCIE10?: string;
    porcentajeEmpresa?: number;
    requirioReemplazo?: boolean;
    costoReemplazo?: number;
    estadoRecobro?: 'PENDIENTE' | 'RADICADO' | 'COBRADO' | 'GLOSADO' | 'NO_APLICA';
    montoRecobrado?: number;
    financiero?: EventFinancials;
}

interface EventLoggerProps {
    events: ATELContext[];
    onChange: (events: ATELContext[]) => void;
    monthName: string;
}

export const EVENT_TYPES_CONFIG: Record<EventType, { label: string; category: AbsenceCategory; desc: string; badge: string }> = {
    AT: { label: 'Accidente de Trabajo (ARL)', category: 'SALUD', desc: '100% cubierto por ARL desde día 1 posterior. SS cubierta por ARL (Ley 776/02).', badge: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200' },
    EL: { label: 'Enfermedad Laboral (ARL)', category: 'SALUD', desc: '100% cubierto por ARL. SS cubierta por ARL (Ley 776/02).', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200' },
    EG_EPS: { label: 'Enfermedad General (EPS)', category: 'SALUD', desc: 'Días 1 y 2 Empleador. Días 3+ EPS al 66.67%. Pensión 12% a cargo patronal.', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200' },
    ACC_COMUN: { label: 'Accidente Común (EPS)', category: 'SALUD', desc: 'Fuera del trabajo. Manejo idéntico a Enfermedad General.', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200' },
    CITA_MED: { label: 'Citas Médicas / Terapias', category: 'SALUD', desc: 'Permiso médico en horas. Remunerado por la empresa.', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200' },
    Ausentismo: { label: 'Ausentismo Médico (General)', category: 'SALUD', desc: 'Incapacidad médica general retrocompatible.', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200' },
    
    LIC_MAT: { label: 'Licencia de Maternidad (18 sem)', category: 'LICENCIA_LEY', desc: '100% reconocido por la EPS. Pagado por anticipado en nómina.', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200' },
    LIC_PAT: { label: 'Licencia de Paternidad (2 sem)', category: 'LICENCIA_LEY', desc: '100% reconocido por la EPS. Pagado en nómina.', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200' },
    LUTO: { label: 'Licencia por Luto (5 días)', category: 'LICENCIA_LEY', desc: 'Ley 1280/2009. 5 días hábiles 100% remunerados por el empleador.', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
    CALAMIDAD: { label: 'Calamidad Doméstica', category: 'LICENCIA_LEY', desc: 'Art. 57 CST. Días razonables remunerados por el empleador.', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200' },
    SUFRAGIO: { label: 'Ejercicio del Voto / Jurado', category: 'LICENCIA_LEY', desc: '1/2 día por votación o 1 día por jurado. Remunerado 100%.', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' },
    LEY_2174: { label: 'Hijos Menores Enfermos (Ley 2174)', category: 'LICENCIA_LEY', desc: 'Hasta 10 días hábiles anuales pagados por la EPS.', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200' },
    
    LIC_NO_REM: { label: 'Licencia No Remunerada (LNR)', category: 'PERMISOS', desc: 'Suspende contrato. Sin salario. Empleador aporta salud (8.5%) y pensión (12%).', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200' },
    SANCION_DISC: { label: 'Suspensión Disciplinaria', category: 'PERMISOS', desc: 'Sanción RIT. Suspende salario. Empleador aporta salud y pensión.', badge: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300' },
    SINDICAL: { label: 'Permiso Sindical', category: 'PERMISOS', desc: 'Art. 57 CST. Remunerado según convención o ley.', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200' },
    PERM_REM: { label: 'Permiso Personal Remunerado', category: 'PERMISOS', desc: 'Cumpleaños, estudio, grado, etc. 100% asumido por empresa.', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200' },
    
    NO_JUSTIF: { label: 'Falta Injustificada / Abandono', category: 'DISRUPCION', desc: 'Descuento de salario y pérdida del descanso dominical remunerado.', badge: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-300 font-bold' }
};

export function calculateEventFinancials(event: Partial<ATELContext>): EventFinancials {
    const dias = Number(event.diasIncapacidad) || 0;
    const ibc = Number(event.colaborador?.ibcMensual) || 1600000;
    const sd = ibc / 30;
    const tipo = event.tipo || 'Ausentismo';
    const reemplazo = Number(event.costoReemplazo) || 0;

    let costSalario = 0;
    let costSS = 0;
    let costSS_ARL = 0;
    let costPrest = dias * sd * 0.2182; // Cesantías (8.33%), Prima (8.33%), Intereses (1%), Vacaciones (4.16%)
    let recobroEPS = 0;
    let recobroARL = 0;

    if (tipo === 'AT' || tipo === 'EL') {
        // ARL: 100% subsidio cubierto desde día 1 siguiente.
        recobroARL = dias * sd;
        // Ley 776 de 2002 Art. 3 Parágrafo 2: La ARL asume 100% aportes a Salud y Pensión
        costSS_ARL = dias * sd * 0.205; // 12% pensión + 8.5% salud
        costSS = 0; // Para la empresa es $0
        costSalario = 0; // Subsidio cubierto 100% por ARL
    } else if (tipo === 'EG_EPS' || tipo === 'ACC_COMUN' || tipo === 'Ausentismo') {
        // EPS: Días 1 y 2 asume la empresa
        const diasEmpresa = Math.min(2, dias);
        const diasEPS = Math.max(0, dias - 2);
        costSalario = diasEmpresa * sd;
        recobroEPS = diasEPS * sd * 0.6667;
        // Si la empresa asume el 100% garantizado:
        const brecha = diasEPS * sd * (1 - 0.6667);
        costSalario += brecha;
        // Pensión patronal obligatoria a cargo de empresa
        costSS = dias * sd * 0.12;
    } else if (['LUTO', 'CALAMIDAD', 'SUFRAGIO', 'PERM_REM', 'SINDICAL', 'CITA_MED'].includes(tipo)) {
        costSalario = dias * sd;
        costSS = dias * sd * 0.205;
    } else if (tipo === 'LIC_MAT' || tipo === 'LIC_PAT' || tipo === 'LEY_2174') {
        recobroEPS = dias * sd; // EPS reconoce 100%
        costSalario = 0;
        costSS = dias * sd * 0.205;
    } else if (tipo === 'LIC_NO_REM' || tipo === 'SANCION_DISC') {
        costSalario = 0;
        costSS = dias * sd * 0.205; // Empleador debe seguir cotizando salud y pensión patronal
        costPrest = 0;
    } else if (tipo === 'NO_JUSTIF') {
        costSalario = 0; // Descuento en nómina
        costSS = dias * sd * 0.205;
        costPrest = 0;
    }

    const bruto = costSalario + costSS + costPrest + reemplazo;
    const indirecto = Math.round((bruto - (recobroEPS + recobroARL)) * 1.5);
    const perdidaNeta = Math.max(0, Math.round(bruto + indirecto - (recobroEPS + recobroARL)));

    return {
        costoDirectoSalario: Math.round(costSalario),
        costoSeguridadSocial: Math.round(costSS),
        costoSeguridadSocialCubiertoARL: Math.round(costSS_ARL),
        costoPrestacional: Math.round(costPrest),
        costoReemplazo: Math.round(reemplazo),
        costoIndirectoIceberg: indirecto,
        costoTotalBruto: Math.round(bruto),
        montoRecobroEPS: Math.round(recobroEPS),
        montoRecobroARL: Math.round(recobroARL),
        perdidaNetaEmpresa: perdidaNeta
    };
}

const EventLogger: React.FC<EventLoggerProps> = ({ events, onChange, monthName }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [selectedEventForDetail, setSelectedEventForDetail] = useState<ATELContext | null>(null);

    const [newEvent, setNewEvent] = useState<Partial<ATELContext>>({
        tipo: 'EG_EPS',
        diasIncapacidad: 1,
        diasCargados: 0,
        fecha: new Date().toISOString().split('T')[0],
        colaborador: {
            nombre: '',
            cedula: '',
            cargo: '',
            area: '',
            ibcMensual: 1600000
        },
        requirioReemplazo: false,
        costoReemplazo: 0,
        estadoRecobro: 'PENDIENTE',
    });

    const liveFinancials = useMemo(() => {
        return calculateEventFinancials(newEvent);
    }, [newEvent]);

    const handleAdd = () => {
        if (!newEvent.fecha || !newEvent.tipo) return;

        const eventFin = calculateEventFinancials(newEvent);

        const event: ATELContext = {
            id: crypto.randomUUID(),
            fecha: newEvent.fecha,
            fechaFin: newEvent.fechaFin || newEvent.fecha,
            tipo: newEvent.tipo!,
            causaInmediata: newEvent.causaInmediata || '',
            peligro: newEvent.peligro || '',
            consecuencia: newEvent.consecuencia || '',
            diasIncapacidad: Number(newEvent.diasIncapacidad) || 0,
            horasAusencia: Number(newEvent.horasAusencia) || 0,
            diasCargados: Number(newEvent.diasCargados) || 0,
            parteCuerpo: newEvent.parteCuerpo || '',
            colaborador: {
                nombre: newEvent.colaborador?.nombre || 'Colaborador',
                cedula: newEvent.colaborador?.cedula || '',
                cargo: newEvent.colaborador?.cargo || '',
                area: newEvent.colaborador?.area || '',
                ibcMensual: Number(newEvent.colaborador?.ibcMensual) || 1600000
            },
            diagnosticoCIE10: newEvent.diagnosticoCIE10 || '',
            requirioReemplazo: Boolean(newEvent.requirioReemplazo),
            costoReemplazo: Number(newEvent.costoReemplazo) || 0,
            estadoRecobro: newEvent.estadoRecobro || 'PENDIENTE',
            financiero: eventFin
        };

        onChange([...events, event]);
        setNewEvent({
            tipo: 'EG_EPS',
            diasIncapacidad: 1,
            diasCargados: 0,
            fecha: new Date().toISOString().split('T')[0],
            colaborador: {
                nombre: '',
                cedula: '',
                cargo: '',
                area: '',
                ibcMensual: 1600000
            },
            requirioReemplazo: false,
            costoReemplazo: 0,
            estadoRecobro: 'PENDIENTE',
        });
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onChange(events.filter(e => e.id !== id));
    };

    const monthTotals = useMemo(() => {
        return events.reduce((acc, e) => {
            const fin = e.financiero || calculateEventFinancials(e);
            return {
                diasIncapacidad: acc.diasIncapacidad + (Number(e.diasIncapacidad) || 0),
                diasCargados: acc.diasCargados + (Number(e.diasCargados) || 0),
                perdidaNeta: acc.perdidaNeta + (fin.perdidaNetaEmpresa || 0),
                recobroEPS: acc.recobroEPS + (fin.montoRecobroEPS || 0),
                recobroARL: acc.recobroARL + (fin.montoRecobroARL || 0),
                seguridadSocialEmpresa: acc.seguridadSocialEmpresa + (fin.costoSeguridadSocial || 0),
                seguridadSocialCubiertoARL: acc.seguridadSocialCubiertoARL + (fin.costoSeguridadSocialCubiertoARL || 0),
            };
        }, {
            diasIncapacidad: 0,
            diasCargados: 0,
            perdidaNeta: 0,
            recobroEPS: 0,
            recobroARL: 0,
            seguridadSocialEmpresa: 0,
            seguridadSocialCubiertoARL: 0
        });
    }, [events]);

    return (
        <div className="space-y-4 border border-border-medium rounded-2xl p-4 bg-surface-primary/70 backdrop-blur-sm shadow-sm">
            {/* Header del Registro */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                            Libro de Novedades, Ausentismo & Siniestralidad — {monthName}
                        </h4>
                        <p className="text-[11px] text-text-secondary">
                            Cálculo de impacto salarial, aportes de seguridad social y subsidios a recobrar
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-sm transition-all active:scale-95"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isAdding ? 'Cerrar Formulario' : 'Registrar Novedad'}</span>
                </button>
            </div>

            {/* FORMULARIO DE CAPTURA INTEGRAL */}
            {isAdding && (
                <div className="p-4 bg-surface-secondary/90 border border-teal-500/30 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-md">
                    <div className="flex items-center justify-between border-b border-border-medium pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Datos de la Ausencia y Trabajador
                        </span>
                        <span className="text-[10px] text-text-tertiary">Campos obligatorios *</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* 1. Motivo de Ausencia */}
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-text-secondary">Motivo de Ausentismo / Evento *</label>
                            <select
                                value={newEvent.tipo}
                                onChange={e => setNewEvent({ ...newEvent, tipo: e.target.value as EventType })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary focus:border-teal-500 font-medium"
                            >
                                <optgroup label="🏥 Salud & Incapacidades Médicas">
                                    <option value="EG_EPS">Enfermedad General (EPS - Días 1 y 2 Empleador, 3+ EPS)</option>
                                    <option value="AT">Accidente de Trabajo (ARL 100% + SS por Ley 776/02)</option>
                                    <option value="EL">Enfermedad Laboral (ARL 100% + SS por Ley 776/02)</option>
                                    <option value="ACC_COMUN">Accidente Común (EPS)</option>
                                    <option value="CITA_MED">Cita Médica / Terapias (Horas)</option>
                                </optgroup>
                                <optgroup label="📜 Licencias Legales Obligatorias (CST)">
                                    <option value="LUTO">Licencia por Luto (5 días hábiles remunerados)</option>
                                    <option value="CALAMIDAD">Calamidad Doméstica Comprobada (Remunerada)</option>
                                    <option value="LIC_MAT">Licencia de Maternidad (18 semanas - EPS 100%)</option>
                                    <option value="LIC_PAT">Licencia de Paternidad (2 semanas - EPS 100%)</option>
                                    <option value="SUFRAGIO">Votación / Jurado de Votación</option>
                                    <option value="LEY_2174">Cuidado Hijos Menores Enfermos (Ley 2174)</option>
                                </optgroup>
                                <optgroup label="🤝 Permisos & Suspensión Contractual">
                                    <option value="LIC_NO_REM">Licencia No Remunerada (LNR - Suspende Contrato)</option>
                                    <option value="SANCION_DISC">Suspensión Disciplinaria (Sanción RIT)</option>
                                    <option value="SINDICAL">Permiso Sindical</option>
                                    <option value="PERM_REM">Permiso Personal Remunerado</option>
                                </optgroup>
                                <optgroup label="⚠️ Disrupción Operativa">
                                    <option value="NO_JUSTIF">Falta Injustificada / Abandono de Puesto</option>
                                </optgroup>
                            </select>
                            <p className="text-[10px] text-text-tertiary">
                                {EVENT_TYPES_CONFIG[newEvent.tipo as EventType]?.desc}
                            </p>
                        </div>

                        {/* 2. Fecha Inicio */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary">Fecha Inicio *</label>
                            <input
                                type="date"
                                value={newEvent.fecha || ''}
                                onChange={e => setNewEvent({ ...newEvent, fecha: e.target.value })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary focus:border-teal-500"
                            />
                        </div>

                        {/* 3. Días de Incapacidad */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary">Días Ausencia / Incap. *</label>
                            <input
                                type="number"
                                min="1"
                                value={newEvent.diasIncapacidad}
                                onChange={e => setNewEvent({ ...newEvent, diasIncapacidad: Math.max(1, Number(e.target.value)) })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary font-bold focus:border-teal-500"
                            />
                        </div>

                        {/* 4. Colaborador: Nombre */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary">Nombre del Trabajador</label>
                            <input
                                type="text"
                                placeholder="Ej: Carlos Mario Pérez"
                                value={newEvent.colaborador?.nombre || ''}
                                onChange={e => setNewEvent({
                                    ...newEvent,
                                    colaborador: { ...newEvent.colaborador!, nombre: e.target.value }
                                })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary focus:border-teal-500"
                            />
                        </div>

                        {/* 5. Cédula */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary">Cédula / Documento</label>
                            <input
                                type="text"
                                placeholder="Ej: 1020304050"
                                value={newEvent.colaborador?.cedula || ''}
                                onChange={e => setNewEvent({
                                    ...newEvent,
                                    colaborador: { ...newEvent.colaborador!, cedula: e.target.value }
                                })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary focus:border-teal-500"
                            />
                        </div>

                        {/* 6. Cargo / Área */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary">Cargo o Área</label>
                            <input
                                type="text"
                                placeholder="Ej: Conductor / Logística"
                                value={newEvent.colaborador?.cargo || ''}
                                onChange={e => setNewEvent({
                                    ...newEvent,
                                    colaborador: { ...newEvent.colaborador!, cargo: e.target.value }
                                })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary focus:border-teal-500"
                            />
                        </div>

                        {/* 7. IBC Mensual ($ COP) */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" /> Salario / IBC Mensual ($ COP) *
                            </label>
                            <input
                                type="number"
                                min="1000000"
                                step="50000"
                                placeholder="Ej: 1600000"
                                value={newEvent.colaborador?.ibcMensual || ''}
                                onChange={e => setNewEvent({
                                    ...newEvent,
                                    colaborador: { ...newEvent.colaborador!, ibcMensual: Number(e.target.value) }
                                })}
                                className="w-full text-xs p-2 rounded-xl border border-teal-500/40 bg-teal-50/20 text-text-primary font-black focus:border-teal-500"
                            />
                        </div>

                        {/* 8. Código Diagnóstico CIE-10 */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary">Diagnóstico CIE-10</label>
                            <input
                                type="text"
                                placeholder="Ej: M545 (Lumbago), J00 (Gripe)"
                                value={newEvent.diagnosticoCIE10 || ''}
                                onChange={e => setNewEvent({ ...newEvent, diagnosticoCIE10: e.target.value })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary uppercase focus:border-teal-500"
                            />
                        </div>

                        {/* 9. Causa / Descripción */}
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-text-secondary">Causa Inmediata / Descripción</label>
                            <input
                                type="text"
                                placeholder="Ej: Dolor lumbar severo tras manipulación manual de cargas"
                                value={newEvent.causaInmediata || ''}
                                onChange={e => setNewEvent({ ...newEvent, causaInmediata: e.target.value })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary focus:border-teal-500"
                            />
                        </div>

                        {/* 10. Costo Reemplazo (Horas extras) */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary">Horas Extras Reemplazo ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="10000"
                                placeholder="0"
                                value={newEvent.costoReemplazo || ''}
                                onChange={e => setNewEvent({ ...newEvent, costoReemplazo: Number(e.target.value) })}
                                className="w-full text-xs p-2 rounded-xl border border-border-medium bg-surface-primary text-text-primary focus:border-teal-500"
                            />
                        </div>
                    </div>

                    {/* Previsualización Financiera en Vivo */}
                    <div className="p-3 rounded-xl bg-surface-tertiary border border-border-medium grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                            <span className="text-[10px] text-text-secondary block">Salario Diario (SD):</span>
                            <span className="font-bold text-text-primary">
                                ${Math.round((newEvent.colaborador?.ibcMensual || 1600000) / 30).toLocaleString('es-CO')}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-text-secondary block">Recobro EPS / ARL:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                ${(liveFinancials.montoRecobroEPS + liveFinancials.montoRecobroARL).toLocaleString('es-CO')}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-text-secondary block">Seguridad Social Empresa:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                ${liveFinancials.costoSeguridadSocial.toLocaleString('es-CO')}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-text-secondary block">Pérdida Neta Empresa:</span>
                            <span className="font-black text-red-600 dark:text-red-400">
                                ${liveFinancials.perdidaNetaEmpresa.toLocaleString('es-CO')}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all"
                        >
                            Guardar Novedad
                        </button>
                    </div>
                </div>
            )}

            {/* TABLA PRINCIPAL DE EVENTOS */}
            {events.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm border-2 border-dashed border-border-medium/60 rounded-2xl bg-surface-tertiary/20">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-text-tertiary opacity-60" />
                    No hay ausencias ni siniestros registrados para este mes.
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-border-medium">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-surface-tertiary text-text-secondary uppercase font-semibold text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-3 py-2.5">Fecha</th>
                                    <th className="px-3 py-2.5">Trabajador</th>
                                    <th className="px-3 py-2.5">Motivo / Tipo</th>
                                    <th className="px-3 py-2.5">CIE-10 / Causa</th>
                                    <th className="px-3 py-2.5 text-center">Días</th>
                                    <th className="px-3 py-2.5 text-right">IBC Mensual</th>
                                    <th className="px-3 py-2.5 text-right">Recobro Entidad</th>
                                    <th className="px-3 py-2.5 text-right">Pérdida Neta</th>
                                    <th className="px-3 py-2.5 text-center w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-medium bg-surface-primary/40">
                                {events.map((event) => {
                                    const fin = event.financiero || calculateEventFinancials(event);
                                    const cfg = EVENT_TYPES_CONFIG[event.tipo] || EVENT_TYPES_CONFIG.Ausentismo;
                                    const recobro = fin.montoRecobroEPS + fin.montoRecobroARL;

                                    return (
                                        <tr key={event.id} className="hover:bg-surface-tertiary/40 transition-colors">
                                            <td className="px-3 py-2 whitespace-nowrap font-medium text-text-primary">
                                                {event.fecha}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="font-semibold text-text-primary">{event.colaborador?.nombre || 'Colaborador'}</div>
                                                <div className="text-[10px] text-text-tertiary">{event.colaborador?.cargo || event.colaborador?.cedula || '-'}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                                                    {cfg.label.split('(')[0].trim()}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 max-w-[200px] truncate">
                                                {event.diagnosticoCIE10 && (
                                                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400 mr-1">
                                                        [{event.diagnosticoCIE10}]
                                                    </span>
                                                )}
                                                <span className="text-text-secondary">{event.causaInmediata || event.peligro || '-'}</span>
                                            </td>
                                            <td className="px-3 py-2 text-center font-bold text-text-primary">
                                                {event.diasIncapacidad}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-text-secondary">
                                                ${Number(event.colaborador?.ibcMensual || 1600000).toLocaleString('es-CO')}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                                ${recobro.toLocaleString('es-CO')}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-red-600 dark:text-red-400">
                                                ${fin.perdidaNetaEmpresa.toLocaleString('es-CO')}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Micro-botón Ver/Examinar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedEventForDetail(event)}
                                                        title="Ver desglose financiero"
                                                        className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 transition-all duration-300 px-1.5 shadow-xs active:scale-95"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                                                            <span className="text-[10px] font-bold">Detalle</span>
                                                        </div>
                                                    </button>
                                                    
                                                    {/* Micro-botón Eliminar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(event.id)}
                                                        title="Eliminar evento"
                                                        className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all duration-300 px-1.5 shadow-xs active:scale-95"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {events.map((event) => {
                            const fin = event.financiero || calculateEventFinancials(event);
                            const cfg = EVENT_TYPES_CONFIG[event.tipo] || EVENT_TYPES_CONFIG.Ausentismo;
                            return (
                                <div key={event.id} className="p-3.5 bg-surface-primary border border-border-medium rounded-2xl shadow-xs space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                                                {cfg.label.split('(')[0]}
                                            </span>
                                            <div className="font-bold text-xs text-text-primary mt-1">
                                                {event.colaborador?.nombre || 'Colaborador'}
                                            </div>
                                            <div className="text-[10px] text-text-secondary">
                                                {event.fecha} · {event.diasIncapacidad} días
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="text-slate-400 hover:text-red-500 p-1.5"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border-medium/60">
                                        <div>
                                            <span className="block text-[10px] text-text-secondary">Recobro EPS/ARL:</span>
                                            <span className="font-bold text-emerald-600">${(fin.montoRecobroEPS + fin.montoRecobroARL).toLocaleString('es-CO')}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-text-secondary">Pérdida Neta:</span>
                                            <span className="font-bold text-red-600">${fin.perdidaNetaEmpresa.toLocaleString('es-CO')}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Barra de Totales Financieros Mensuales */}
                    <div className="p-4 bg-gradient-to-r from-teal-500/10 via-surface-secondary to-teal-500/10 rounded-2xl border border-teal-500/20 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-text-secondary block">Días Ausencia Mes:</span>
                            <span className="text-base font-black text-text-primary">{monthTotals.diasIncapacidad} días</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-text-secondary block">Recobros Radicados:</span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                ${(monthTotals.recobroEPS + monthTotals.recobroARL).toLocaleString('es-CO')}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-text-secondary block">Seg. Social Empresa:</span>
                            <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                                ${monthTotals.seguridadSocialEmpresa.toLocaleString('es-CO')}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-text-secondary block">Pérdida Neta Empresa:</span>
                            <span className="text-base font-black text-red-600 dark:text-red-400 font-mono">
                                ${monthTotals.perdidaNeta.toLocaleString('es-CO')}
                            </span>
                        </div>
                    </div>
                </>
            )}

            {/* Modal Detalle Financiero del Evento */}
            {selectedEventForDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-primary border border-border-medium rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-border-medium pb-2">
                            <div>
                                <h3 className="font-bold text-sm text-text-primary">Desglose Financiero de la Novedad</h3>
                                <p className="text-[11px] text-text-secondary">
                                    {selectedEventForDetail.colaborador?.nombre} · {selectedEventForDetail.diasIncapacidad} días
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEventForDetail(null)}
                                className="text-text-tertiary hover:text-text-primary text-xs font-bold p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {(() => {
                            const fin = selectedEventForDetail.financiero || calculateEventFinancials(selectedEventForDetail);
                            const cfg = EVENT_TYPES_CONFIG[selectedEventForDetail.tipo] || EVENT_TYPES_CONFIG.Ausentismo;
                            return (
                                <div className="space-y-3 text-xs">
                                    <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-medium space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Tipo de Contingencia:</span>
                                            <span className="font-bold text-text-primary">{cfg.label}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">IBC Trabajador:</span>
                                            <span className="font-mono font-bold">${Number(selectedEventForDetail.colaborador?.ibcMensual || 1600000).toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">CIE-10 / Diagnóstico:</span>
                                            <span className="font-mono text-teal-600">{selectedEventForDetail.diagnosticoCIE10 || 'No especificado'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-border-medium pt-2">
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Salario Asumido por Empresa:</span>
                                            <span className="font-mono">${fin.costoDirectoSalario.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Aportes Pensión/Salud Empresa:</span>
                                            <span className="font-mono">${fin.costoSeguridadSocial.toLocaleString('es-CO')}</span>
                                        </div>
                                        {fin.costoSeguridadSocialCubiertoARL > 0 && (
                                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                                <span>Aportes Cubiertos por ARL (Ley 776):</span>
                                                <span className="font-mono">-${fin.costoSeguridadSocialCubiertoARL.toLocaleString('es-CO')}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Pasivo Prestacional Causado:</span>
                                            <span className="font-mono">${fin.costoPrestacional.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Costos de Reemplazo (Horas extras):</span>
                                            <span className="font-mono">${fin.costoReemplazo.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">Costos Ocultos (Iceberg Heinrich/Simonds):</span>
                                            <span className="font-mono text-amber-600">${fin.costoIndirectoIceberg.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-border-medium/60 pt-1">
                                            <span>Subsidio Recobrado / por Recobrar:</span>
                                            <span className="font-mono">-${(fin.montoRecobroEPS + fin.montoRecobroARL).toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="flex justify-between text-red-600 dark:text-red-400 font-black text-sm border-t border-border-medium pt-2">
                                            <span>Pérdida Neta Total Asumida:</span>
                                            <span className="font-mono">${fin.perdidaNetaEmpresa.toLocaleString('es-CO')} COP</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setSelectedEventForDetail(null)}
                                className="px-4 py-1.5 rounded-xl font-bold text-xs bg-surface-secondary hover:bg-surface-hover text-text-primary border border-border-medium"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventLogger;
