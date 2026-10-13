import React, { useState, useEffect, useCallback } from 'react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import {
    Users,
    Activity,
    ChevronRight,
    UserCircle,
    Loader2,
    UserPlus,
    X,
    Check,
    FileSpreadsheet,
    UserCheck,
    UserMinus,
    ShieldCheck,
} from 'lucide-react';
import { cn } from '~/utils';
import ExpandingButton from '~/components/SGSST/ExpandingButton';

// This component reads workers DIRECTLY from Perfil Sociodemográfico,
// filtered by cargo name — with direct assignment capabilities to link or create workers.

interface SocioDemoWorker {
    id: string;
    nombre: string;
    identificacion: string;
    cargo: string;
    genero?: string;
    edad?: number;
    enfermedades?: string;
    diagnosticoMedico?: string;
    limitacionesBiomecanicas?: string;
    alergiasQuimicas?: string;
}

interface WorkersProfileListProps {
    perfilId: string;
    perfilNombre: string;
    onSelectWorker: (workerId: string) => void;
}

export default function WorkersProfileList({ perfilId, perfilNombre, onSelectWorker }: WorkersProfileListProps) {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();

    const [workers, setWorkers] = useState<SocioDemoWorker[]>([]);
    const [allCompanyWorkers, setAllCompanyWorkers] = useState<SocioDemoWorker[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [openingWorker, setOpeningWorker] = useState<string | null>(null);

    // Modal state for linking/adding worker to this cargo
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addMode, setAddMode] = useState<'new' | 'existing'>('new');
    const [newWorkerNombre, setNewWorkerNombre] = useState('');
    const [newWorkerDoc, setNewWorkerDoc] = useState('');
    const [selectedExistingId, setSelectedExistingId] = useState('');
    const [isSavingWorker, setIsSavingWorker] = useState(false);

    // Read workers directly from Perfil Sociodemográfico, filtered by cargo
    const fetchWorkers = useCallback(async () => {
        if (!token || !perfilNombre) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/sgsst/perfil-sociodemografico/data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error('[WorkersProfileList] Failed to fetch sociodemografico data:', res.status);
                return;
            }
            const data = await res.json();
            const allWorkers: SocioDemoWorker[] = data.trabajadores || [];
            setAllCompanyWorkers(allWorkers);

            // Filter by cargo name (case-insensitive, trimmed)
            const cleanCargo = perfilNombre.trim().toLowerCase();
            const matching = allWorkers.filter(
                w => w.cargo && w.cargo.trim().toLowerCase() === cleanCargo
            );

            console.log(`[WorkersProfileList] Found ${matching.length} workers with cargo "${perfilNombre}" out of ${allWorkers.length} total.`);
            setWorkers(matching);
        } catch (error) {
            console.error('[WorkersProfileList] Error fetching workers:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token, perfilNombre]);

    useEffect(() => {
        fetchWorkers();
        window.addEventListener('wappy-reload-sgsst-data', fetchWorkers);
        return () => window.removeEventListener('wappy-reload-sgsst-data', fetchWorkers);
    }, [fetchWorkers]);

    // Values considered as "no data" — should not be displayed as health alerts
    const NULLISH_PATTERNS = [
        /^ninguna?$/i,
        /^ninguna? conocida?$/i,
        /^ninguna? reportada?$/i,
        /^ninguna? registrada?$/i,
        /^no$/i,
        /^n\/a$/i,
        /^sin datos?$/i,
        /^sin informaci[oó]n$/i,
        /^apto( sin hallazgos)?$/i,
        /^-+$/,
    ];

    const isNullLike = (value: string) => {
        if (!value || !value.trim()) return true;
        return NULLISH_PATTERNS.some(p => p.test(value.trim()));
    };

    // When user clicks a worker: find or create their SgsstWorker record, then open dashboard
    const handleOpenWorker = async (socioWorker: SocioDemoWorker) => {
        if (!token || openingWorker) return;
        setOpeningWorker(socioWorker.id);
        try {
            const condicionesSalud = [
                socioWorker.enfermedades,
                socioWorker.diagnosticoMedico,
                socioWorker.limitacionesBiomecanicas,
                socioWorker.alergiasQuimicas,
            ].filter(v => v && !isNullLike(v)).join('; ');

            // POST is now idempotent (find-or-create) — safe to call always
            const createRes = await fetch('/api/sgsst/workers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    perfilId,
                    cargo: perfilNombre,
                    nombre: socioWorker.nombre,
                    documento: String(socioWorker.identificacion).trim(),
                    genero: socioWorker.genero || '',
                    fechaIngreso: new Date().toISOString().split('T')[0],
                    condicionesSalud,
                    observaciones: `Perfil del Cargo: ${perfilNombre}`
                })
            });

            let createData: any = {};
            const rawText = await createRes.text();
            try {
                createData = JSON.parse(rawText);
            } catch {
                console.error('[WorkersProfileList] Server returned non-JSON:', rawText.substring(0, 500));
                showToast({ message: `Error del servidor al abrir perfil (HTTP ${createRes.status})`, status: 'error' });
                return;
            }

            if (!createRes.ok) {
                console.error('[WorkersProfileList] Failed to open worker:', createData);
                showToast({ message: `Error al abrir: ${createData.error || 'Error desconocido'}`, status: 'error' });
                return;
            }

            const workerId = createData.worker?._id;
            if (workerId) {
                onSelectWorker(workerId);
            } else {
                console.error('[WorkersProfileList] No workerId in response:', createData);
                showToast({ message: 'No se pudo obtener el ID del trabajador', status: 'error' });
            }
        } catch (error) {
            console.error('[WorkersProfileList] Error opening worker:', error);
            showToast({ message: 'Error de conexión al abrir el perfil', status: 'error' });
        } finally {
            setOpeningWorker(null);
        }
    };

    // Handler to create or link worker to this cargo
    const handleAddOrLinkWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !perfilNombre) return;
        setIsSavingWorker(true);
        try {
            let updatedList = [...allCompanyWorkers];
            let targetWorkerName = '';
            let targetWorkerDoc = '';

            if (addMode === 'new') {
                if (!newWorkerNombre.trim() || !newWorkerDoc.trim()) {
                    showToast({ message: 'Nombre y documento son requeridos', status: 'warning' });
                    setIsSavingWorker(false);
                    return;
                }
                targetWorkerName = newWorkerNombre.trim();
                targetWorkerDoc = newWorkerDoc.trim();

                const existingIndex = updatedList.findIndex(w => 
                    String(w.identificacion).trim() === targetWorkerDoc
                );
                if (existingIndex >= 0) {
                    updatedList[existingIndex] = {
                        ...updatedList[existingIndex],
                        nombre: targetWorkerName,
                        cargo: perfilNombre
                    };
                } else {
                    updatedList.push({
                        id: crypto.randomUUID(),
                        nombre: targetWorkerName,
                        identificacion: targetWorkerDoc,
                        cargo: perfilNombre,
                    });
                }
            } else {
                if (!selectedExistingId) {
                    showToast({ message: 'Selecciona un colaborador', status: 'warning' });
                    setIsSavingWorker(false);
                    return;
                }
                const existingIndex = updatedList.findIndex(w => w.id === selectedExistingId);
                if (existingIndex >= 0) {
                    targetWorkerName = updatedList[existingIndex].nombre;
                    targetWorkerDoc = updatedList[existingIndex].identificacion;
                    updatedList[existingIndex] = {
                        ...updatedList[existingIndex],
                        cargo: perfilNombre
                    };
                }
            }

            // 1. Guardar en Perfil Sociodemográfico (Master source)
            const saveRes = await fetch('/api/sgsst/perfil-sociodemografico/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ trabajadores: updatedList })
            });

            if (!saveRes.ok) {
                throw new Error('Error al guardar el colaborador en el perfil');
            }

            // 2. Asegurar registro en SgsstWorker para este cargo
            if (targetWorkerDoc && targetWorkerName) {
                await fetch('/api/sgsst/workers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        perfilId,
                        nombre: targetWorkerName,
                        documento: targetWorkerDoc,
                        cargo: perfilNombre,
                        fechaIngreso: new Date().toISOString().split('T')[0],
                        observaciones: `Asignado al cargo ${perfilNombre} desde Perfiles del Cargo`
                    })
                }).catch(() => {});
            }

            // 3. Notificar a toda la plataforma
            window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));

            showToast({
                message: `¡Colaborador "${targetWorkerName}" asignado a "${perfilNombre}" exitosamente!`,
                status: 'success'
            });

            setIsAddModalOpen(false);
            setNewWorkerNombre('');
            setNewWorkerDoc('');
            setSelectedExistingId('');
            await fetchWorkers();
        } catch (err: any) {
            showToast({ message: err.message || 'Error al vincular colaborador', status: 'error' });
        } finally {
            setIsSavingWorker(false);
        }
    };

    const handleUnlinkWorker = async (w: SocioDemoWorker, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!token || !perfilNombre) return;
        if (!window.confirm(`¿Deseas desvincular a "${w.nombre}" del cargo "${perfilNombre}"?`)) return;

        try {
            const updatedList = allCompanyWorkers.map(item => 
                String(item.identificacion).trim() === String(w.identificacion).trim()
                    ? { ...item, cargo: '' }
                    : item
            );

            const saveRes = await fetch('/api/sgsst/perfil-sociodemografico/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ trabajadores: updatedList })
            });

            if (!saveRes.ok) throw new Error('Error al desvincular colaborador');

            showToast({
                message: `"${w.nombre}" fue desvinculado de "${perfilNombre}" correctamente.`,
                status: 'success'
            });

            window.dispatchEvent(new CustomEvent('wappy-reload-sgsst-data'));
            await fetchWorkers();
        } catch (err: any) {
            showToast({ message: err.message || 'Error al desvincular', status: 'error' });
        }
    };

    const getHealthAlerts = (w: SocioDemoWorker) => {
        return [
            w.enfermedades,
            w.diagnosticoMedico,
            w.limitacionesBiomecanicas,
            w.alergiasQuimicas
        ].filter(v => v && !isNullLike(v)).join('; ');
    };

    // Workers of company not yet assigned to this specific cargo
    const cleanCurrentCargo = perfilNombre.trim().toLowerCase();
    const otherCompanyWorkers = allCompanyWorkers.filter(
        w => !w.cargo || w.cargo.trim().toLowerCase() !== cleanCurrentCargo
    );

    return (
        <div className="bg-surface-secondary/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4 transition-all">
            {/* Header: Title + Counter + Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60 dark:border-zinc-800">
                <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-teal-500/10 dark:bg-teal-400/10 flex items-center justify-center border border-teal-500/20 shrink-0">
                            <Users className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <span className="truncate">Trabajadores Asociados</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>Bio-individuos del perfil:</span>
                        <span className="font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-lg border border-teal-200/60 dark:border-teal-800/60 inline-block truncate max-w-[260px] sm:max-w-md">
                            {perfilNombre}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-start sm:self-auto">
                    {!isLoading && workers.length > 0 && (
                        <span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 text-xs font-bold px-3 py-1.5 rounded-full border border-teal-300/60 dark:border-teal-700/60 whitespace-nowrap shadow-2xs">
                            {workers.length} {workers.length === 1 ? 'colaborador' : 'colaboradores'}
                        </span>
                    )}
                    <ExpandingButton
                        label="Asignar Colaborador"
                        icon={UserPlus}
                        variant="teal"
                        size="md"
                        onClick={() => setIsAddModalOpen(true)}
                        title="Vincular o registrar colaborador para este cargo"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-teal-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm font-semibold">Cargando colaboradores asociados...</span>
                </div>
            ) : workers.length === 0 ? (
                <div className="text-center py-12 px-4 bg-surface-tertiary/40 dark:bg-zinc-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
                    <UserCircle className="h-12 w-12 mx-auto text-slate-400 dark:text-zinc-600 mb-3 opacity-60" />
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No hay trabajadores asignados a este perfil aún.</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 max-w-sm mx-auto mb-5 leading-relaxed">
                        Puedes asignar colaboradores existentes de la empresa o registrar un nuevo colaborador con este cargo directamente.
                    </p>
                    <ExpandingButton
                        label={`Asignar Colaborador a "${perfilNombre}"`}
                        icon={UserPlus}
                        variant="teal"
                        size="md"
                        onClick={() => setIsAddModalOpen(true)}
                    />
                </div>
            ) : (
                <div className={cn(
                    "grid gap-4",
                    workers.length === 1 
                        ? "grid-cols-1 md:max-w-xl" 
                        : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                )}>
                    {workers.map(w => {
                        const healthAlerts = getHealthAlerts(w);
                        const isOpening = openingWorker === w.id;
                        return (
                            <div
                                key={w.id}
                                className="group relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500" />

                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-md shadow-teal-500/20 shrink-0">
                                                {w.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate" title={w.nombre}>
                                                    {w.nombre}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 flex-wrap">
                                                    <span className="font-semibold">CC: {w.identificacion}</span>
                                                    {w.genero && <span>•</span>}
                                                    {w.genero && <span>{w.genero}{w.edad ? ` · ${w.edad} años` : ''}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center">
                                            {isOpening ? (
                                                <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Activo
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {healthAlerts ? (
                                        <div className="mt-2.5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-2.5 text-xs flex items-start gap-2 shadow-2xs">
                                            <Activity className="h-3.5 w-3.5 mt-0.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-rose-800 dark:text-rose-200 text-[11px] leading-snug break-words">
                                                    {healthAlerts}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 rounded-xl p-2 text-xs flex items-center gap-2">
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                                Examen médico ocupacional sin restricciones
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Micro-Buttons Bar: WAPPY Design System (Expanding on hover) */}
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-1.5 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenWorker(w)}
                                            title="Ver Matriz IPEVR de este colaborador"
                                            className="group/btn flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-2 shadow-2xs active:scale-95 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200/60 dark:border-teal-800/60 cursor-pointer"
                                        >
                                            <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover/btn:ml-1.5 group-hover/btn:max-w-[120px] group-hover/btn:opacity-100 sm:flex">
                                                <span className="text-[10px] font-bold">Matriz IPEVR</span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenWorker(w)}
                                            title="Ver Ficha Médica y Paraclínicos"
                                            className="group/btn flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-2 shadow-2xs active:scale-95 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/60 cursor-pointer"
                                        >
                                            <UserCheck className="h-3.5 w-3.5 shrink-0" />
                                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover/btn:ml-1.5 group-hover/btn:max-w-[120px] group-hover/btn:opacity-100 sm:flex">
                                                <span className="text-[10px] font-bold">Ficha Médica</span>
                                            </div>
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => handleUnlinkWorker(w, e)}
                                        title="Desvincular a este colaborador del cargo"
                                        className="group/btn flex h-7 min-w-[28px] items-center justify-center rounded-lg transition-all duration-300 px-2 shadow-2xs active:scale-95 text-slate-400 dark:text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/40 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-800/60 cursor-pointer"
                                    >
                                        <UserMinus className="h-3.5 w-3.5 shrink-0" />
                                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover/btn:ml-1.5 group-hover/btn:max-w-[100px] group-hover/btn:opacity-100 sm:flex">
                                            <span className="text-[10px] font-bold">Desvincular</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal para Vincular / Registrar Colaborador */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-surface-primary border border-border-medium rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-border-light mb-4">
                            <div>
                                <h4 className="font-black text-text-primary text-base">Asignar Colaborador al Cargo</h4>
                                <p className="text-xs text-teal-600 dark:text-teal-400 font-bold mt-0.5">{perfilNombre}</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-text-tertiary hover:text-text-primary p-1.5 rounded-xl hover:bg-surface-secondary transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Mode Selector */}
                        <div className="flex rounded-xl bg-surface-secondary p-1 mb-5 border border-border-light">
                            <button
                                type="button"
                                onClick={() => setAddMode('new')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${addMode === 'new' ? 'bg-teal-600 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Nuevo Colaborador
                            </button>
                            <button
                                type="button"
                                onClick={() => setAddMode('existing')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${addMode === 'existing' ? 'bg-teal-600 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                De la Empresa ({otherCompanyWorkers.length})
                            </button>
                        </div>

                        <form onSubmit={handleAddOrLinkWorker} className="space-y-4">
                            {addMode === 'new' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary mb-1">Nombre Completo *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newWorkerNombre}
                                            onChange={e => setNewWorkerNombre(e.target.value)}
                                            placeholder="Ej. Juan Pérez Gómez"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary text-text-primary text-sm focus:outline-none focus:border-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary mb-1">Cédula / Documento *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newWorkerDoc}
                                            onChange={e => setNewWorkerDoc(e.target.value)}
                                            placeholder="Ej. 1020304050"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary text-text-primary text-sm focus:outline-none focus:border-teal-500"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1">Seleccionar Colaborador *</label>
                                    {otherCompanyWorkers.length === 0 ? (
                                        <p className="text-xs text-text-tertiary py-3 text-center bg-surface-secondary rounded-xl">
                                            Todos los colaboradores registrados ya están asignados a este cargo.
                                        </p>
                                    ) : (
                                        <select
                                            value={selectedExistingId}
                                            onChange={e => setSelectedExistingId(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary text-text-primary text-sm focus:outline-none focus:border-teal-500"
                                        >
                                            <option value="">Selecciona un colaborador...</option>
                                            {otherCompanyWorkers.map(w => (
                                                <option key={w.id} value={w.id}>
                                                    {w.nombre} (CC: {w.identificacion}) - {w.cargo || 'Sin cargo'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-secondary border border-border-light transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingWorker || (addMode === 'existing' && !selectedExistingId)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {isSavingWorker ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    <span>Vincular al Cargo</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
