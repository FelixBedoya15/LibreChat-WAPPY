import React, { useState, useEffect, useRef } from 'react';
import { UpgradeWall } from './UpgradeWall';
import { useAuthContext } from '~/hooks';
import { Button, useToastContext } from '@librechat/client';
import { Plus, GraduationCap, Users, Calendar, Trash2, CheckCircle, Save, CalendarCheck, Loader2 } from 'lucide-react';

interface Trabajador {
    nombre: string;
    cedula: string;
    cargo: string;
    asistio: boolean;
}

interface SesionCapacitacion {
    id: string;
    tema: string;
    fecha: string;
    hora: string;
    duracion: string;
    responsable: string;
    descripcion: string;
    estado: 'Programada' | 'Completada' | 'Cancelada';
    trabajadoresRegistrados: Trabajador[];
    evidencias: string[];
}

export default function ProgramaCapacitaciones() {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();
    
    const [sesiones, setSesiones] = useState<SesionCapacitacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    
    // UI State
    const [selectedSesionId, setSelectedSesionId] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        fetchData();
    }, [token]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/sgsst/programa-capacitaciones/data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSesiones(data.sesiones || []);
            }
        } catch (error) {
            console.error('Error loading capacitaciones:', error);
            showToast({ message: 'Error al cargar cronograma', status: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (updatedSesiones: SesionCapacitacion[]) => {
        setIsSaving(true);
        setSesiones(updatedSesiones);
        try {
            const res = await fetch('/api/sgsst/programa-capacitaciones/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sesiones: updatedSesiones })
            });
            if (res.ok) {
                showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            console.error('Error saving:', error);
            showToast({ message: 'Error al guardar los cambios', status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSesion = () => {
        const newSesion: SesionCapacitacion = {
            id: Date.now().toString(),
            tema: '',
            fecha: '',
            hora: '',
            duracion: '',
            responsable: '',
            descripcion: '',
            estado: 'Programada',
            trabajadoresRegistrados: [],
            evidencias: []
        };
        const updated = [...sesiones, newSesion];
        setSesiones(updated);
        setSelectedSesionId(newSesion.id);
        handleSave(updated);
    };

    const handleUpdateSesion = (id: string, updates: Partial<SesionCapacitacion>) => {
        const updated = sesiones.map(s => s.id === id ? { ...s, ...updates } : s);
        setSesiones(updated);
    };

    const handleDeleteSesion = (id: string) => {
        if(!confirm('¿Estás seguro de eliminar esta capacitación?')) return;
        const updated = sesiones.filter(s => s.id !== id);
        if (selectedSesionId === id) setSelectedSesionId(null);
        handleSave(updated);
    };

    const handleGenerateActa = async (sesion: SesionCapacitacion) => {
        if (!sesion.tema || !sesion.fecha) {
            showToast({ message: 'El tema y la fecha son obligatorios', status: 'warning' });
            return;
        }
        setIsGenerating(sesion.id);
        
        try {
            const res = await fetch('/api/sgsst/programa-capacitaciones/generate-acta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sesion })
            });
            const data = await res.json();
            
            if (res.ok && data.report) {
                // To persist the generated report in LiveEditor/Inbox, we dispatch an event
                // This integrates with the platform's Live Documents architecture natively
                window.dispatchEvent(new CustomEvent('generate-sgsst-document', {
                    detail: {
                        module: 'capacitaciones',
                        type: 'Acta de Capacitación SG-SST',
                        content: data.report
                    }
                }));
                showToast({ message: 'Acta generada y enviada a bandeja', status: 'success' });
            } else {
                throw new Error(data.error || 'Generación fallida');
            }
        } catch (error: any) {
            console.error('Error generating acta:', error);
            showToast({ message: error.message || 'Error al compilar el acta', status: 'error' });
        } finally {
            setIsGenerating(null);
        }
    };

    // Workers Handlers
    const handleAddTrabajador = (sesionId: string) => {
        const sesion = sesiones.find(s => s.id === sesionId);
        if(!sesion) return;
        
        const newWorker: Trabajador = { nombre: '', cedula: '', cargo: '', asistio: false };
        const updated = sesiones.map(s => s.id === sesionId ? { ...s, trabajadoresRegistrados: [...s.trabajadoresRegistrados, newWorker] } : s);
        setSesiones(updated);
    };

    const handleUpdateTrabajador = (sesionId: string, index: number, updates: Partial<Trabajador>) => {
        const updated = sesiones.map(s => {
            if (s.id !== sesionId) return s;
            const newWorkers = [...s.trabajadoresRegistrados];
            newWorkers[index] = { ...newWorkers[index], ...updates };
            return { ...s, trabajadoresRegistrados: newWorkers };
        });
        setSesiones(updated);
    };

    const handleDeleteTrabajador = (sesionId: string, index: number) => {
        const updated = sesiones.map(s => {
            if (s.id !== sesionId) return s;
            const newWorkers = s.trabajadoresRegistrados.filter((_, i) => i !== index);
            return { ...s, trabajadoresRegistrados: newWorkers };
        });
        setSesiones(updated);
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>;
    }

    const selectedSesion = sesiones.find(s => s.id === selectedSesionId);

    return (
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1400px] mx-auto min-h-[600px]">
            {/* Sidebar: List of Sessions */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-surface-secondary/40 border border-border-light dark:border-white/5 rounded-2xl">
                    <div>
                        <h3 className="font-bold tracking-tight text-text-primary text-sm uppercase">Cronograma Anual</h3>
                        <p className="text-xs text-text-secondary">{sesiones.length} Eventos programados</p>
                    </div>
                    <Button onClick={handleAddSesion} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-9 px-3 border-none flex items-center gap-1">
                        <Plus className="w-4 h-4" /> <span className="hidden sm:inline font-bold">Nueva</span>
                    </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {sesiones.length === 0 ? (
                        <div className="text-center py-10 px-4 text-text-secondary/60 bg-surface-primary/30 rounded-2xl border border-dashed border-border-medium/50">
                            <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">No hay capacitaciones creadas.</p>
                        </div>
                    ) : (
                        sesiones.map(sesion => (
                            <div 
                                key={sesion.id}
                                onClick={() => setSelectedSesionId(sesion.id)}
                                className={`cursor-pointer p-4 rounded-xl border transition-all ${selectedSesionId === sesion.id ? 'bg-teal-50/50 dark:bg-teal-900/20 border-teal-500/50 shadow-sm' : 'bg-surface-primary/50 border-border-light hover:border-teal-400/50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-text-primary text-sm truncate max-w-[80%]">{sesion.tema || 'Sin tema definido'}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${sesion.estado === 'Completada' ? 'bg-green-100 text-green-700' : sesion.estado === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {sesion.estado}
                                    </span>
                                </div>
                                <div className="flex items-center text-xs text-text-secondary gap-3">
                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{sesion.fecha || 'Sin fecha'}</span>
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{sesion.trabajadoresRegistrados.length} pers.</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Column: Edit Session */}
            <div className="w-full lg:w-2/3 flex flex-col min-h-0 bg-surface-secondary/20 rounded-2xl border border-border-light dark:border-white/5 p-4 sm:p-6 overflow-y-auto relative">
                {!selectedSesion ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-secondary/50 opacity-opacity-60 my-20">
                        <GraduationCap className="w-16 h-16 mb-4 opacity-30" />
                        <h3 className="font-bold text-lg mb-1">Centro de Formación</h3>
                        <p className="text-sm font-medium text-center max-w-sm">Selecciona una capacitación del panel lateral o crea una nueva para empezar a registrar la asistencia.</p>
                    </div>
                ) : (
                    <div className="space-y-8 pb-10">
                        {/* HEADER ACTIONS */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-primary/50 p-4 rounded-xl border border-border-light">
                            <div>
                                <h2 className="font-black text-xl text-text-primary">Detalle de Sesión</h2>
                                <p className="text-xs text-text-secondary">Actualiza los datos y guarda antes de generar el acta</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button 
                                    onClick={() => handleSave(sesiones)} 
                                    className="bg-surface-tertiary text-text-primary hover:bg-surface-hover border border-border-medium rounded-lg px-3 py-1.5 flex-1 sm:flex-none h-9"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    <span className="font-semibold text-xs">Guardar</span>
                                </Button>
                                <Button 
                                    onClick={() => handleGenerateActa(selectedSesion)} 
                                    disabled={!!isGenerating}
                                    className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 border-none rounded-lg px-3 py-1.5 flex-1 sm:flex-none h-9 shadow-md"
                                >
                                    {isGenerating === selectedSesion.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    <span className="font-bold text-xs uppercase tracking-wide">Emitir Acta</span>
                                </Button>
                                <Button onClick={() => handleDeleteSesion(selectedSesion.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg px-2 py-1.5 h-9" title="Eliminar">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* FORM: BASIC INFO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Tema a Tratar *</label>
                                <input 
                                    type="text" 
                                    value={selectedSesion.tema} 
                                    onChange={e => handleUpdateSesion(selectedSesion.id, { tema: e.target.value })}
                                    className="w-full bg-surface-primary border border-border-medium rounded-xl px-4 py-2.5 text-sm text-text-primary focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ej. Uso y Mantenimiento de EPIs"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Fecha *</label>
                                    <input 
                                        type="date" 
                                        value={selectedSesion.fecha} 
                                        onChange={e => handleUpdateSesion(selectedSesion.id, { fecha: e.target.value })}
                                        className="w-full bg-surface-primary border border-border-medium rounded-xl px-4 py-2.5 text-sm text-text-primary focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Hora</label>
                                    <input 
                                        type="time" 
                                        value={selectedSesion.hora} 
                                        onChange={e => handleUpdateSesion(selectedSesion.id, { hora: e.target.value })}
                                        className="w-full bg-surface-primary border border-border-medium rounded-xl px-4 py-2.5 text-sm text-text-primary focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Responsable / Capacitador</label>
                                <input 
                                    type="text" 
                                    value={selectedSesion.responsable} 
                                    onChange={e => handleUpdateSesion(selectedSesion.id, { responsable: e.target.value })}
                                    className="w-full bg-surface-primary border border-border-medium rounded-xl px-4 py-2.5 text-sm text-text-primary focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    placeholder="Nombre del facilitador"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Duración</label>
                                    <input 
                                        type="text" 
                                        value={selectedSesion.duracion} 
                                        onChange={e => handleUpdateSesion(selectedSesion.id, { duracion: e.target.value })}
                                        className="w-full bg-surface-primary border border-border-medium rounded-xl px-4 py-2.5 text-sm text-text-primary focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        placeholder="Ej. 2 horas"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Estado</label>
                                    <select 
                                        value={selectedSesion.estado} 
                                        onChange={e => handleUpdateSesion(selectedSesion.id, { estado: e.target.value as any })}
                                        className="w-full bg-surface-primary border border-border-medium rounded-xl px-4 py-2.5 text-sm text-text-primary focus:ring-2 focus:ring-teal-500 outline-none transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="Programada">Programada</option>
                                        <option value="Completada">Completada</option>
                                        <option value="Cancelada">Cancelada</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Objetivo / Descripción Breve</label>
                                <textarea 
                                    rows={2}
                                    value={selectedSesion.descripcion} 
                                    onChange={e => handleUpdateSesion(selectedSesion.id, { descripcion: e.target.value })}
                                    className="w-full bg-surface-primary border border-border-medium rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                                    placeholder="Describe brevemente el alcance de la charla..."
                                />
                            </div>
                        </div>

                        <hr className="border-border-light my-2 dark:border-white/5" />

                        {/* FORM: WORKER ARRAY */}
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="font-black text-lg text-text-primary flex items-center gap-2">
                                        <Users className="w-5 h-5 text-teal-500" /> Asistencia y Personal
                                    </h3>
                                    <p className="text-xs text-text-secondary mt-1">Marca las casillas de quienes asistieron. Esto habilitará la casilla de firma en su reporte.</p>
                                </div>
                                <Button onClick={() => handleAddTrabajador(selectedSesion.id)} size="sm" className="bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary h-8 px-3 rounded-lg text-xs font-bold shadow-sm">
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar Persona
                                </Button>
                            </div>
                            
                            <div className="bg-surface-primary rounded-xl border border-border-light overflow-hidden">
                                <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr_80px_50px] gap-3 p-3 bg-surface-secondary/50 border-b border-border-light text-[10px] font-black uppercase text-text-secondary tracking-widest px-4">
                                    <div>Nombre y Apellidos</div>
                                    <div>Documento / CC</div>
                                    <div>Cargo / Rol</div>
                                    <div className="text-center">Asistió</div>
                                    <div></div>
                                </div>
                                
                                {selectedSesion.trabajadoresRegistrados.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-text-secondary font-medium">No hay personal inscrito en esta actividad. Crea registros manualmente.</div>
                                ) : (
                                    <div className="divide-y divide-border-light">
                                        {selectedSesion.trabajadoresRegistrados.map((worker, i) => (
                                            <div key={i} className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_1fr_80px_50px] gap-3 p-3 sm:items-center px-4 hover:bg-slate-50/50 dark:hover:bg-white-[0.02]">
                                                <input 
                                                    type="text" placeholder="Nombre completo" value={worker.nombre}
                                                    onChange={e => handleUpdateTrabajador(selectedSesion.id, i, { nombre: e.target.value })}
                                                    className="w-full bg-transparent border-none text-sm font-semibold focus:ring-0 px-0 placeholder:text-text-secondary/40 text-text-primary line-clamp-1"
                                                />
                                                <input 
                                                    type="text" placeholder="102938475" value={worker.cedula}
                                                    onChange={e => handleUpdateTrabajador(selectedSesion.id, i, { cedula: e.target.value })}
                                                    className="w-full bg-transparent border-none text-sm font-mono text-text-secondary focus:ring-0 px-0"
                                                />
                                                <input 
                                                    type="text" placeholder="Auxiliar" value={worker.cargo}
                                                    onChange={e => handleUpdateTrabajador(selectedSesion.id, i, { cargo: e.target.value })}
                                                    className="w-full bg-transparent border-none text-sm text-text-secondary focus:ring-0 px-0"
                                                />
                                                <div className="flex items-center sm:justify-center">
                                                    <label className="flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={worker.asistio}
                                                            onChange={e => handleUpdateTrabajador(selectedSesion.id, i, { asistio: e.target.checked })}
                                                            className="w-5 h-5 text-teal-600 bg-surface-primary border-border-medium rounded focus:ring-teal-500 focus:border-transparent transition-colors cursor-pointer"
                                                        />
                                                        <span className="ml-2 text-sm sm:hidden font-bold">Marcó asistencia</span>
                                                    </label>
                                                </div>
                                                <div className="flex justify-end">
                                                    <button onClick={() => handleDeleteTrabajador(selectedSesion.id, i)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
