import React, { useState, useEffect } from 'react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { Users, Plus, Trash2, Edit, Activity, ChevronRight, UserCircle } from 'lucide-react';
import { cn } from '~/utils';

interface Worker {
    _id: string;
    nombre: string;
    documento: string;
    fechaIngreso: string;
    condicionesSalud: string;
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
    const [isAdding, setIsAdding] = useState(false);
    
    const [newWorker, setNewWorker] = useState({
        nombre: '',
        documento: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        condicionesSalud: '',
    });

    useEffect(() => {
        if (!token || !perfilId) return;
        fetchWorkers();
    }, [token, perfilId]);

    const fetchWorkers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sgsst/workers/${perfilId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkers(data.workers);
            }
        } catch (error) {
            console.error('Error fetching workers', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorker.nombre || !newWorker.documento) return;
        
        try {
            const res = await fetch('/api/sgsst/workers', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ ...newWorker, perfilId })
            });
            
            if (res.ok) {
                showToast({ message: 'Trabajador añadido exitosamente', status: 'success' });
                setIsAdding(false);
                setNewWorker({ nombre: '', documento: '', fechaIngreso: new Date().toISOString().split('T')[0], condicionesSalud: '' });
                fetchWorkers();
            }
        } catch (error) {
            showToast({ message: 'Error al añadir trabajador', status: 'error' });
        }
    };

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
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Bio-individuos asignados al perfil: <strong className="text-teal-700 dark:text-teal-400">{perfilNombre}</strong>
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                >
                    {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {isAdding ? 'Cancelar' : 'Añadir Trabajador'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddWorker} className="mb-6 bg-surface-tertiary p-5 rounded-xl border border-teal-200 dark:border-teal-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase">Nombre Completo</label>
                        <input required type="text" value={newWorker.nombre} onChange={e => setNewWorker({...newWorker, nombre: e.target.value})} className="w-full rounded-lg border border-border-medium px-3 py-2 text-sm bg-surface-primary" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase">Documento / ID</label>
                        <input required type="text" value={newWorker.documento} onChange={e => setNewWorker({...newWorker, documento: e.target.value})} className="w-full rounded-lg border border-border-medium px-3 py-2 text-sm bg-surface-primary" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase">Fecha de Ingreso</label>
                        <input type="date" value={newWorker.fechaIngreso} onChange={e => setNewWorker({...newWorker, fechaIngreso: e.target.value})} className="w-full rounded-lg border border-border-medium px-3 py-2 text-sm bg-surface-primary" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-text-secondary uppercase">Condiciones de Salud Previas (Breve)</label>
                        <input type="text" value={newWorker.condicionesSalud} onChange={e => setNewWorker({...newWorker, condicionesSalud: e.target.value})} placeholder="Ej: Restricción lumbar leve" className="w-full rounded-lg border border-border-medium px-3 py-2 text-sm bg-surface-primary" />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-teal-700 transition-colors">Guardar Bio-individuo</button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
            ) : workers.length === 0 ? (
                <div className="text-center py-12 bg-surface-tertiary rounded-xl border-2 border-dashed border-border-medium">
                    <UserCircle className="h-12 w-12 mx-auto text-text-tertiary mb-3 opacity-50" />
                    <p className="text-sm font-medium text-text-secondary">No hay trabajadores asignados a este perfil aún.</p>
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
                                        <p className="text-xs text-text-tertiary">ID: {w.documento}</p>
                                    </div>
                                </div>
                                <button onClick={(e) => handleDelete(w._id, e)} className="text-text-tertiary hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
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
