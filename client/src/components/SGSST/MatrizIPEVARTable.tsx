import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import store from '~/store';
import { 
  Save, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useAuthContext } from '~/hooks';

interface MatrixRow {
  proceso: string;
  zona: string;
  actividad: string;
  tareas: string;
  rutinaria: 'Sí' | 'No';
  peligro_descripcion: string;
  peligro_clasificacion: string;
  efectos_posibles: string;
  controles_fuente: string;
  controles_medio: string;
  controles_individuo: string;
  nd: number;
  ne: number;
  np: number;
  nc: number;
  nr: number;
  interpretacion_nr: string;
  aceptabilidad: string;
}

export default function MatrizIPEVARTable({ conversationId }: { conversationId: string | null }) {
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { token } = useAuthContext();

  // Real-time conversation state (updates before the URL changes from 'new')
  const conversation = useRecoilValue(store.conversationByIndex(0));
  const actualConvoId = conversation?.conversationId && conversation.conversationId !== 'new' 
    ? conversation.conversationId 
    : conversationId;

  // Refetch when AI finishes submitting
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));
  const pendingFetchRef = React.useRef(false);

  const fetchMatrix = async (id?: string | null) => {
    const targetId = id ?? actualConvoId;
    if (!targetId || targetId === 'new') {
      console.warn('[MatrizIPEVARTable] Fetch aborted: ID is missing or "new"', { id, actualConvoId });
      return;
    }
    
    console.log(`[MatrizIPEVARTable] Fetching matrix for conversation: ${targetId}`);
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sgsst/gtc45-workspace/matrix/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.matrixRows) {
        console.log(`[MatrizIPEVARTable] Loaded ${data.matrixRows.length} rows`);
        setMatrixRows(data.matrixRows);
      } else {
        console.log('[MatrizIPEVARTable] No rows returned or empty array');
      }
    } catch (e) {
      console.error("[MatrizIPEVARTable] Error fetching matrix data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when conversationId changes (e.g. URL goes from /c/new → /c/<uuid>),
  // or just immediately pull on mount if a valid ID exists.
  useEffect(() => {
    if (!actualConvoId || actualConvoId === 'new') return;
    fetchMatrix(actualConvoId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualConvoId]);

  // Active Live Polling: While the AI is responding, query the DB every 3 seconds to pull UI updates.
  // This allows the matrix to appear the instant LangGraph's tool writes to MongoDB.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting && actualConvoId && actualConvoId !== 'new') {
      interval = setInterval(() => {
        fetchMatrix(actualConvoId);
      }, 3000);
    }
    // Final fetch when submission completes
    if (!isSubmitting && actualConvoId && actualConvoId !== 'new') {
       fetchMatrix(actualConvoId);
    }
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, actualConvoId]);
  const saveMatrixData = async (rows: MatrixRow[]) => {
    if (!actualConvoId || actualConvoId === 'new') return;
    try {
      setIsSaving(true);
      await fetch(`/api/sgsst/gtc45-workspace/matrix/${actualConvoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrixRows: rows })
      });
    } catch (e) {
      console.error("Error saving matrix", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCellChange = (index: number, field: keyof MatrixRow, value: any) => {
    const newRows = [...matrixRows];
    // @ts-ignore
    newRows[index][field] = value;

    // Autocalculate if nd, ne, nc
    if (['nd', 'ne', 'nc'].includes(field)) {
      const row = newRows[index];
      row.np = (Number(row.nd) || 0) * (Number(row.ne) || 0);
      row.nr = row.np * (Number(row.nc) || 0);
      
      if (row.nr >= 4000 || row.nr === 4000) row.interpretacion_nr = 'I';
      else if (row.nr >= 500) row.interpretacion_nr = 'I';
      else if (row.nr >= 150) row.interpretacion_nr = 'II';
      else if (row.nr >= 40) row.interpretacion_nr = 'III';
      else row.interpretacion_nr = 'IV';

      row.aceptabilidad = row.interpretacion_nr === 'II' 
        ? 'No Aceptable o Aceptable con Control Específico' 
        : row.interpretacion_nr === 'I' ? 'No Aceptable' : 'Aceptable';
    }

    setMatrixRows(newRows);
  };

  const addRow = () => {
    const newRow: MatrixRow = {
      proceso: '', zona: '', actividad: '', tareas: '', rutinaria: 'Sí',
      peligro_descripcion: '', peligro_clasificacion: '', efectos_posibles: '',
      controles_fuente: 'Ninguno', controles_medio: 'Ninguno', controles_individuo: 'Ninguno',
      nd: 0, ne: 0, np: 0, nc: 0, nr: 0, interpretacion_nr: '', aceptabilidad: ''
    };
    setMatrixRows([...matrixRows, newRow]);
  };

  const removeRow = (index: number) => {
    const newRows = matrixRows.filter((_, i) => i !== index);
    setMatrixRows(newRows);
    saveMatrixData(newRows);
  };

  if (!actualConvoId || actualConvoId === 'new') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-text-primary bg-surface-primary border-l border-border-light">
        <div className="mb-4 rounded-full bg-surface-tertiary p-4 border border-border-medium shadow-sm">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold dark:text-gray-100">Matriz Inactiva</h3>
        <p className="text-sm text-text-secondary max-w-sm">
          Envía el primer mensaje en el chat para instanciar la matriz IPEVAR. Los riesgos se guardarán automáticamente aquí.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-surface-primary transition-all duration-300 border-l border-border-light ${isMaximized ? 'fixed inset-0 z-50 p-6' : 'w-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light bg-surface-secondary px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Matriz IPEVAR Live</h2>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Sincronización Activa
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-text-secondary" />}
          
          <button
            onClick={() => saveMatrixData(matrixRows)}
            className="flex items-center gap-2 rounded-lg bg-surface-tertiary px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover border border-border-light"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors border border-transparent hover:border-border-light"
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto bg-surface-primary p-4">
        {matrixRows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-medium bg-surface-secondary p-8 text-center">
            <div className="mb-4 rounded-full bg-surface-tertiary p-3">
              <AlertTriangle className="h-6 w-6 text-text-secondary" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-text-primary">Matriz Vacía</h3>
            <p className="text-xs text-text-secondary max-w-xs mb-4">
              Pídele al Agente que evalúe un riesgo para insertarlo automáticamente.
            </p>
            <button onClick={addRow} className="flex items-center gap-2 text-sm text-green-500 hover:text-green-600 bg-green-500/10 px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="h-4 w-4" /> Añadir Fila Manual
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border-light overflow-hidden bg-surface-secondary shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-secondary">
                <thead className="bg-surface-tertiary text-xs uppercase text-text-primary sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Proceso</th>
                    <th className="px-4 py-3 whitespace-nowrap">Zona</th>
                    <th className="px-4 py-3 whitespace-nowrap">Actividad</th>
                    <th className="px-4 py-3 whitespace-nowrap">Tareas</th>
                    <th className="px-4 py-3 whitespace-nowrap">Rutinaria</th>
                    <th className="px-4 py-3 whitespace-nowrap">Peligro</th>
                    <th className="px-4 py-3 whitespace-nowrap">Clasificación</th>
                    <th className="px-4 py-3 whitespace-nowrap">Efectos</th>
                    <th className="px-4 py-3 whitespace-nowrap text-center text-blue-500 bg-blue-500/5">ND</th>
                    <th className="px-4 py-3 whitespace-nowrap text-center text-blue-500 bg-blue-500/5">NE</th>
                    <th className="px-4 py-3 whitespace-nowrap text-center text-purple-500 bg-purple-500/5">NP</th>
                    <th className="px-4 py-3 whitespace-nowrap text-center text-blue-500 bg-blue-500/5">NC</th>
                    <th className="px-4 py-3 whitespace-nowrap text-center text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 transition-colors">NR</th>
                    <th className="px-4 py-3 whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light bg-surface-primary">
                  {matrixRows.map((row, index) => (
                    <tr key={index} className="hover:bg-surface-secondary/50 transition-colors group">
                      <td className="px-4 py-2"><input className="w-full bg-transparent outline-none dark:text-gray-200" value={row.proceso} onChange={e => handleCellChange(index, 'proceso', e.target.value)} /></td>
                      <td className="px-4 py-2"><input className="w-full bg-transparent outline-none dark:text-gray-200" value={row.zona} onChange={e => handleCellChange(index, 'zona', e.target.value)} /></td>
                      <td className="px-4 py-2"><input className="w-full bg-transparent outline-none dark:text-gray-200" value={row.actividad} onChange={e => handleCellChange(index, 'actividad', e.target.value)} /></td>
                      <td className="px-4 py-2"><input className="w-full min-w-[150px] bg-transparent outline-none dark:text-gray-200" value={row.tareas} onChange={e => handleCellChange(index, 'tareas', e.target.value)} /></td>
                      <td className="px-4 py-2">
                        <select className="bg-transparent outline-none cursor-pointer dark:text-gray-200" value={row.rutinaria} onChange={e => handleCellChange(index, 'rutinaria', e.target.value as any)}>
                          <option value="Sí" className="bg-surface-primary">Sí</option>
                          <option value="No" className="bg-surface-primary">No</option>
                        </select>
                      </td>
                      <td className="px-4 py-2"><input className="w-full min-w-[200px] bg-transparent outline-none font-medium text-text-primary" value={row.peligro_descripcion} onChange={e => handleCellChange(index, 'peligro_descripcion', e.target.value)} /></td>
                      <td className="px-4 py-2"><input className="w-full min-w-[120px] bg-transparent outline-none dark:text-gray-200" value={row.peligro_clasificacion} onChange={e => handleCellChange(index, 'peligro_clasificacion', e.target.value)} /></td>
                      <td className="px-4 py-2"><input className="w-full min-w-[150px] bg-transparent outline-none dark:text-gray-200" value={row.efectos_posibles} onChange={e => handleCellChange(index, 'efectos_posibles', e.target.value)} /></td>
                      <td className="px-4 py-2 border-l border-border-light bg-blue-500/5"><input type="number" className="w-12 text-center bg-transparent outline-none font-mono" value={row.nd} onChange={e => handleCellChange(index, 'nd', e.target.value)} /></td>
                      <td className="px-4 py-2 bg-blue-500/5"><input type="number" className="w-12 text-center bg-transparent outline-none font-mono" value={row.ne} onChange={e => handleCellChange(index, 'ne', e.target.value)} /></td>
                      <td className="px-4 py-2 font-bold text-center text-purple-600 dark:text-purple-400 bg-purple-500/5" title="Nivel Probabilidad (ND x NE)">{row.np}</td>
                      <td className="px-4 py-2 bg-blue-500/5"><input type="number" className="w-12 text-center bg-transparent outline-none font-mono" value={row.nc} onChange={e => handleCellChange(index, 'nc', e.target.value)} /></td>
                      <td className="px-4 py-2 text-center border-l-2 border-orange-500/20 bg-orange-500/5 font-black text-orange-600 dark:text-orange-400" title={`Interpretación: ${row.interpretacion_nr}\nAceptabilidad: ${row.aceptabilidad}`}>
                        {row.nr}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => removeRow(index)} className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 rounded-md">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border-light bg-surface-tertiary px-4 py-2">
              <button onClick={addRow} className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                <Plus className="h-3 w-3" /> Añadir Fila
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
