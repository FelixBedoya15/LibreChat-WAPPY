import React, { useState, useEffect, useCallback } from 'react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { Users, Activity, ChevronRight, UserCircle, Loader2 } from 'lucide-react';

// This component reads workers DIRECTLY from Perfil Sociodemográfico,
// filtered by cargo name — no DB sync required.
// A SgsstWorker record is created lazily when the user opens the individual dashboard.

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
    const [isLoading, setIsLoading] = useState(false);
    const [openingWorker, setOpeningWorker] = useState<string | null>(null);

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
                    nombre: socioWorker.nombre,
                    documento: String(socioWorker.identificacion).trim(),
                    genero: socioWorker.genero || '',
                    fechaIngreso: new Date().toISOString().split('T')[0],
                    condicionesSalud,
                    observaciones: 'Importado desde Perfil Sociodemográfico'
                })
            });

            // Safe JSON parse — if server returns HTML (error page), log it
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

    const getHealthAlerts = (w: SocioDemoWorker) => {
        return [
            w.enfermedades,
            w.diagnosticoMedico,
            w.limitacionesBiomecanicas,
            w.alergiasQuimicas
        ].filter(v => v && !isNullLike(v)).join('; ');
    };

    return (
        <div className="bg-surface-secondary border border-border-medium rounded-2xl p-6 shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-600" />
                        Trabajadores Asociados
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Bio-individuos del perfil: <strong className="text-teal-700 dark:text-teal-400">{perfilNombre}</strong>
                    </p>
                </div>
                {!isLoading && workers.length > 0 && (
                    <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-bold px-3 py-1 rounded-full">
                        {workers.length} trabajador{workers.length !== 1 ? 'es' : ''}
                    </span>
                )}
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
                    <p className="text-xs text-text-tertiary mt-2 max-w-xs mx-auto">
                        En el módulo <strong>Perfil Sociodemográfico</strong>, asigna el cargo <strong>"{perfilNombre}"</strong> a los trabajadores y aparecerán aquí automáticamente.
                    </p>
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
                                    <span>{isOpening ? 'Abriendo...' : 'Ver Matriz IPEVAR'}</span>
                                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
