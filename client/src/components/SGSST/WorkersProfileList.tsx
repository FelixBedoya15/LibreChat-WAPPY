import React, { useState, useEffect, useCallback } from 'react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { Users, Activity, ChevronRight, UserCircle, Loader2, UserPlus, X, Check } from 'lucide-react';

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
        <div className="bg-surface-secondary border border-border-medium rounded-2xl p-6 shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-600" />
                        Trabajadores Asociados
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Bio-individuos del perfil: <strong className="text-teal-700 dark:text-teal-400">{perfilNombre}</strong>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!isLoading && workers.length > 0 && (
                        <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-bold px-3 py-1.5 rounded-full">
                            {workers.length} trabajador{workers.length !== 1 ? 'es' : ''}
                        </span>
                    )}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md transition-all active:scale-95"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Asignar Colaborador</span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-teal-600">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm font-medium">Cargando trabajadores...</span>
                </div>
            ) : workers.length === 0 ? (
                <div className="text-center py-12 bg-surface-tertiary rounded-xl border-2 border-dashed border-border-medium">
                    <UserCircle className="h-12 w-12 mx-auto text-text-tertiary mb-3 opacity-50" />
                    <p className="text-sm font-semibold text-text-secondary">No hay trabajadores asignados a este perfil aún.</p>
                    <p className="text-xs text-text-tertiary mt-2 max-w-sm mx-auto mb-4">
                        Puedes asignar colaboradores existentes de la empresa o registrar nuevos para este cargo directamente.
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md transition-all active:scale-95"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Asignar Colaborador a "{perfilNombre}"</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workers.map(w => {
                        const healthAlerts = getHealthAlerts(w);
                        const isOpening = openingWorker === w.id;
                        return (
                            <div
                                key={w.id}
                                onClick={() => handleOpenWorker(w)}
                                className="group cursor-pointer bg-surface-primary border border-border-medium hover:border-teal-400 rounded-xl p-4 transition-all hover:shadow-md relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-bl-[40px] -z-10 group-hover:scale-110 transition-transform" />

                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-200 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                                            {w.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-text-primary text-sm truncate">{w.nombre}</h4>
                                            <p className="text-xs text-text-tertiary">CC: {w.identificacion}</p>
                                            {w.genero && <p className="text-xs text-text-tertiary">{w.genero}{w.edad ? ` · ${w.edad} años` : ''}</p>}
                                        </div>
                                    </div>
                                    {isOpening && (
                                        <Loader2 className="h-4 w-4 text-teal-500 animate-spin flex-shrink-0" />
                                    )}
                                </div>

                                {healthAlerts && (
                                    <div className="flex items-start gap-2 mt-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded-lg text-xs">
                                        <Activity className="h-3 w-3 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{healthAlerts}</span>
                                    </div>
                                )}

                                <div className="mt-4 flex items-center justify-between text-teal-600 dark:text-teal-400 font-bold text-[11px] uppercase tracking-wider">
                                    <span>{isOpening ? 'Abriendo...' : 'Ver Matriz IPEVR'}</span>
                                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
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
