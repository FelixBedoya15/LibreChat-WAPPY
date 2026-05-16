import React, { useState, useEffect, useCallback } from 'react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { Users, Trash2, Activity, ChevronRight, UserCircle, RefreshCw } from 'lucide-react';

interface Worker {
    _id: string;
    nombre: string;
    documento: string;
    fechaIngreso: string;
    condicionesSalud: string;
    genero?: string;
}

interface SocioWorker {
    id: string;
    nombre: string;
    identificacion: string;
    cargo: string;
    genero?: string;
    enfermedades?: string;
    diagnosticoMedico?: string;
    limitacionesBiomecanicas?: string;
    alergiasQuimicas?: string;
    edad?: number;
}

interface WorkersProfileListProps {
    perfilId: string;
    perfilNombre: string;
    onSelectWorker: (workerId: string) => void;
}

export default function WorkersProfileList({ perfilId, perfilNombre, onSelectWorker }: WorkersProfileListProps) {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Step 1: Fetch already-registered SgsstWorkers from DB for this perfil
    const fetchWorkers = useCallback(async () => {
        if (!token || !perfilId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sgsst/workers/${perfilId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkers(data.workers || []);
            }
        } catch (error) {
            console.error('Error fetching workers', error);
        } finally {
            setIsLoading(false);
        }
    }, [token, perfilId]);

    // Step 2: Sync workers from Perfil Sociodemografico that match this cargo
    const syncFromSociodemografico = useCallback(async () => {
        if (!token || !perfilId || !perfilNombre) return;
        setIsSyncing(true);
        try {
            // Fetch sociodemographic data
            const socioRes = await fetch('/api/sgsst/perfil-sociodemografico/data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!socioRes.ok) return;

            const socioData = await socioRes.json();
            const allWorkers: SocioWorker[] = socioData.trabajadores || [];

            // Filter workers whose cargo matches this perfil (case-insensitive)
            const cleanPerfilNombre = perfilNombre.trim().toLowerCase();
            const matching = allWorkers.filter(
                w => w.cargo && w.cargo.trim().toLowerCase() === cleanPerfilNombre
            );

            if (matching.length === 0) return;

            // Fetch existing SgsstWorkers to avoid duplicates
            const existingRes = await fetch(`/api/sgsst/workers/${perfilId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const existingData = existingRes.ok ? await existingRes.json() : { workers: [] };
            const existingDocs = new Set(
                (existingData.workers || []).map((w: Worker) => String(w.documento).trim())
            );

            // Register each missing worker via POST
            let addedCount = 0;
            for (const socioWorker of matching) {
                const cleanDoc = String(socioWorker.identificacion || '').trim();
                if (!cleanDoc || !socioWorker.nombre) continue;
                if (existingDocs.has(cleanDoc)) continue;

                const condicionesSalud = [
                    socioWorker.enfermedades,
                    socioWorker.diagnosticoMedico,
                    socioWorker.limitacionesBiomecanicas,
                    socioWorker.alergiasQuimicas
                ].filter(Boolean).join('; ');

                const postRes = await fetch('/api/sgsst/workers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        perfilId,
                        nombre: socioWorker.nombre,
                        documento: cleanDoc,
                        genero: socioWorker.genero || '',
                        fechaIngreso: new Date().toISOString().split('T')[0],
                        condicionesSalud,
                        observaciones: 'Importado automáticamente desde Perfil Sociodemográfico'
                    })
                });

                if (postRes.ok) {
                    addedCount++;
                    existingDocs.add(cleanDoc);
                }
            }

            if (addedCount > 0) {
                showToast({
                    message: `✅ ${addedCount} trabajador(es) sincronizado(s) automáticamente desde el Perfil Sociodemográfico`,
                    status: 'success'
                });
                await fetchWorkers();
            }
        } catch (error) {
            console.error('Error syncing workers from sociodemografico', error);
        } finally {
            setIsSyncing(false);
        }
    }, [token, perfilId, perfilNombre, fetchWorkers, showToast]);

    // On mount: fetch existing workers, then sync from sociodemografico
    useEffect(() => {
        const init = async () => {
            await fetchWorkers();
            await syncFromSociodemografico();
        };
        init();
    }, [token, perfilId, perfilNombre]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar a este trabajador?')) return;
        try {
            const res = await fetch(`/api/sgsst/workers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                showToast({ message: 'Trabajador eliminado', status: 'success' });
                fetchWorkers();
            }
        } catch (error) {
            showToast({ message: 'Error al eliminar', status: 'error' });
        }
    };

    return (
        <div className="bg-surface-secondary border border-border-medium rounded-2xl p-6 shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-600" />
                        Trabajadores Asociados
                        {(isLoading || isSyncing) && (
                            <RefreshCw className="h-4 w-4 text-teal-500 animate-spin ml-2" />
                        )}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Bio-individuos asignados al perfil: <strong className="text-teal-700 dark:text-teal-400">{perfilNombre}</strong>
                    </p>
                    {isSyncing && (
                        <p className="text-xs text-teal-600 mt-1 animate-pulse">
                            Sincronizando trabajadores del Perfil Sociodemográfico...
                        </p>
                    )}
                </div>
                <button
                    onClick={() => syncFromSociodemografico()}
                    disabled={isSyncing}
                    title="Sincronizar desde Perfil Sociodemográfico"
                    className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold border border-teal-200 dark:border-teal-800 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sincronizar
                </button>
            </div>

            {(isLoading && workers.length === 0) ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
            ) : workers.length === 0 ? (
                <div className="text-center py-12 bg-surface-tertiary rounded-xl border-2 border-dashed border-border-medium">
                    <UserCircle className="h-12 w-12 mx-auto text-text-tertiary mb-3 opacity-50" />
                    <p className="text-sm font-medium text-text-secondary">No hay trabajadores asignados a este perfil aún.</p>
                    <p className="text-xs text-text-tertiary mt-1">
                        Asigna el cargo <strong>"{perfilNombre}"</strong> a trabajadores en el Perfil Sociodemográfico y se sincronizarán automáticamente.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workers.map(w => (
                        <div
                            key={w._id}
                            onClick={() => onSelectWorker(w._id)}
                            className="group cursor-pointer bg-surface-primary border border-border-medium hover:border-teal-400 rounded-xl p-4 transition-all hover:shadow-md relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-bl-[40px] -z-10 group-hover:scale-110 transition-transform"></div>

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-200 rounded-full flex items-center justify-center font-bold text-lg">
                                        {w.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-primary text-sm line-clamp-1">{w.nombre}</h4>
                                        <p className="text-xs text-text-tertiary">CC: {w.documento}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(w._id, e)}
                                    className="text-text-tertiary hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {w.condicionesSalud && (
                                <div className="flex items-start gap-2 mt-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded-lg text-xs">
                                    <Activity className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{w.condicionesSalud}</span>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between text-teal-600 dark:text-teal-400 font-bold text-[11px] uppercase tracking-wider group-hover:underline">
                                <span>Matriz IPEVAR Bio-individual</span>
                                <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
