import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle, Activity, Calendar } from 'lucide-react';

export interface ATELContext {
    id: string;
    fecha: string;
    tipo: 'AT' | 'EL' | 'Ausentismo';
    causaInmediata?: string;
    peligro?: string;
    consecuencia?: string;
    diasIncapacidad: number;
    diasCargados?: number;
    parteCuerpo?: string;
}

interface EventLoggerProps {
    events: ATELContext[];
    onChange: (events: ATELContext[]) => void;
    monthName: string;
}

const EventLogger: React.FC<EventLoggerProps> = ({ events, onChange, monthName }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<ATELContext>>({
        tipo: 'AT',
        diasIncapacidad: 0,
        diasCargados: 0
    });

    const handleAdd = () => {
        if (!newEvent.fecha || !newEvent.tipo) return;

        const event: ATELContext = {
            id: crypto.randomUUID(),
            fecha: newEvent.fecha,
            tipo: newEvent.tipo!,
            causaInmediata: newEvent.causaInmediata || '',
            peligro: newEvent.peligro || '',
            consecuencia: newEvent.consecuencia || '',
            diasIncapacidad: Number(newEvent.diasIncapacidad) || 0,
            diasCargados: Number(newEvent.diasCargados) || 0,
            parteCuerpo: newEvent.parteCuerpo || '',
        };

        onChange([...events, event]);
        setNewEvent({ tipo: 'AT', diasIncapacidad: 0, diasCargados: 0, fecha: '' });
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onChange(events.filter(e => e.id !== id));
    };

    const getBadgeColor = (tipo: string) => {
        switch (tipo) {
            case 'AT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'EL': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Ausentismo': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-4 border border-border-medium rounded-lg p-4 bg-surface-primary/50">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-text-primary flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Registro de Eventos - {monthName}
                </h4>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                    <Plus className="h-3 w-3" /> Agregar Evento
                </button>
            </div>

            {isAdding && (
                <div className="p-3 bg-surface-tertiary rounded-lg space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-secondary">Fecha</label>
                            <input
                                type="date"
                                value={newEvent.fecha || ''}
                                onChange={e => setNewEvent({ ...newEvent, fecha: e.target.value })}
                                className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-secondary">Tipo</label>
                            <select
                                value={newEvent.tipo}
                                onChange={e => setNewEvent({ ...newEvent, tipo: e.target.value as any })}
                                className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary"
                            >
                                <option value="AT">Accidente de Trabajo</option>
                                <option value="EL">Enfermedad Laboral</option>
                                <option value="Ausentismo">Ausentismo Médico</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-secondary">Peligro Asociado</label>
                            <input
                                type="text"
                                placeholder="Ej: Trabajo en Alturas, Químico..."
                                value={newEvent.peligro || ''}
                                onChange={e => setNewEvent({ ...newEvent, peligro: e.target.value })}
                                className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-secondary">Causa Inmediata</label>
                            <input
                                type="text"
                                placeholder="Ej: Piso resbaloso, Falta EPP..."
                                value={newEvent.causaInmediata || ''}
                                onChange={e => setNewEvent({ ...newEvent, causaInmediata: e.target.value })}
                                className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-secondary">Días Incapacidad</label>
                            <input
                                type="number"
                                min="0"
                                value={newEvent.diasIncapacidad}
                                onChange={e => setNewEvent({ ...newEvent, diasIncapacidad: Number(e.target.value) })}
                                className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-text-secondary">Días Cargados</label>
                            <input
                                type="number"
                                min="0"
                                value={newEvent.diasCargados}
                                onChange={e => setNewEvent({ ...newEvent, diasCargados: Number(e.target.value) })}
                                className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary"
                            />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-xs font-medium text-text-secondary">Consecuencia / Lesión</label>
                            <input
                                type="text"
                                placeholder="Ej: Fractura tibia, Lumbago..."
                                value={newEvent.consecuencia || ''}
                                onChange={e => setNewEvent({ ...newEvent, consecuencia: e.target.value })}
                                className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setIsAdding(false)} className="text-xs text-text-secondary px-3 py-1 hover:bg-surface-hover rounded">Cancelar</button>
                        <button onClick={handleAdd} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Guardar Evento</button>
                    </div>
                </div>
            )}

            {events.length === 0 ? (
                <div className="text-center py-6 text-text-secondary text-sm border-2 border-dashed border-border-medium/50 rounded-lg">
                    No hay eventos registrados en este mes.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-surface-tertiary text-text-secondary uppercase font-medium">
                            <tr>
                                <th className="px-3 py-2 rounded-tl-lg">Fecha</th>
                                <th className="px-3 py-2">Tipo</th>
                                <th className="px-3 py-2">Peligro</th>
                                <th className="px-3 py-2">Causa</th>
                                <th className="px-3 py-2">Consecuencia</th>
                                <th className="px-3 py-2 text-center">Días Incap.</th>
                                <th className="px-3 py-2 text-center">Días Carg.</th>
                                <th className="px-3 py-2 rounded-tr-lg w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-medium">
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-surface-tertiary/30 transition-colors">
                                    <td className="px-3 py-2 whitespace-nowrap">{event.fecha}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getBadgeColor(event.tipo)}`}>
                                            {event.tipo}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-text-primary">{event.peligro || '-'}</td>
                                    <td className="px-3 py-2 text-text-secondary">{event.causaInmediata || '-'}</td>
                                    <td className="px-3 py-2 text-text-secondary">{event.consecuencia || '-'}</td>
                                    <td className="px-3 py-2 text-center font-medium">{event.diasIncapacidad}</td>
                                    <td className="px-3 py-2 text-center text-text-secondary">{event.diasCargados || 0}</td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-surface-tertiary/50 font-semibold text-text-primary border-t border-border-medium">
                            <tr>
                                <td colSpan={5} className="px-3 py-2 text-right">Totales Mes:</td>
                                <td className="px-3 py-2 text-center">{events.reduce((sum, e) => sum + (e.diasIncapacidad || 0), 0)}</td>
                                <td className="px-3 py-2 text-center">{events.reduce((sum, e) => sum + (e.diasCargados || 0), 0)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EventLogger;
