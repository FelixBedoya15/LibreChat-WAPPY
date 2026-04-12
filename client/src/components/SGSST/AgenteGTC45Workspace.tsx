import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Maximize2, Minimize2, Save, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { UpgradeWall } from './UpgradeWall';
import ChatRoute from '~/routes/ChatRoute';
import { useGetMessagesByConvoId } from '~/data-provider';
import { useToastContext } from '@librechat/client';

interface MatrixRow {
  proceso: string;
  zona: string;
  tareas: string;
  rutinaria: string;
  peligro_descripcion: string;
  peligro_clasificacion: string;
  efectos: string;
  control_fuente: string;
  control_medio: string;
  control_individuo: string;
  nd: number;
  ne: number;
  np: number;
  nc: number;
  nrv: number;
  aceptabilidad: string;
  medidas_intervencion: string;
}

export default function AgenteGTC45Workspace() {
  const { user } = useAuthContext();
  const { conversationId } = useParams();
  const currentConvoId = conversationId && conversationId !== 'new' ? conversationId : null;
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  // Redirect to /new if no conversationId is present, so ChatRoute can mount properly
  useEffect(() => {
    if (!conversationId) {
      navigate('/sgsst/agente-gtc45/new', { replace: true });
    }
  }, [conversationId, navigate]);

  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isTableMaximized, setIsTableMaximized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Matrix data from backend whenever valid conversationId changes
  useEffect(() => {
    let active = true;
    if (currentConvoId) {
      const token = localStorage.getItem('token');
      fetch(`/api/sgsst/gtc45-workspace/matrix/${currentConvoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (active && data.matrixRows) {
            setMatrixRows(data.matrixRows);
          }
        })
        .catch(console.error);
    } else {
      setMatrixRows([]);
    }
    return () => { active = false; };
  }, [currentConvoId]);

  // Hook into Native LibreChat Messages
  // Notice we use conversationId (which can be 'new') instead of currentConvoId
  // so we can intercept streaming messages BEFORE the URL officially redirects to the generated UUID
  const { data: messages } = useGetMessagesByConvoId(conversationId ?? 'new', {
    enabled: !!conversationId,
    refetchInterval: 2000, 
  });

  // Extract JSON from AI's latest message
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    // Find the latest message from the assistant
    const latestAsstMsg = [...messages].reverse().find(m => m.isCreatedByUser === false && m.sender !== 'User');
    
    if (latestAsstMsg && latestAsstMsg.text) {
      // Robust JSON extraction:
      // Try to find the JSON block either inside markdown or raw in the text, ensuring it contains our action keyword.
      let jsonStr: string | null = null;
      const blockMatch = latestAsstMsg.text.match(/```[a-z]*\s*(\{[\s\S]*?"action"\s*:\s*"update_matrix"[\s\S]*?\})\s*```/i);
      if (blockMatch) {
         jsonStr = blockMatch[1];
      } else {
         const rawMatch = latestAsstMsg.text.match(/(\{[\s\S]*?"action"\s*:\s*"update_matrix"[\s\S]*\})/i);
         if (rawMatch) {
            const content = rawMatch[1];
            // Strip trailing junk after the last brace
            jsonStr = content.substring(0, content.lastIndexOf('}') + 1);
         }
      }

      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.rows && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
            // Check if these rows are already in the table to avoid infinite state updates
            // A simple check is comparing lengths or a deep compare text
            const newRowsSerialized = JSON.stringify(parsed.rows);
            const currentRowsSerialized = JSON.stringify(matrixRows.slice(-parsed.rows.length));
            
            if (newRowsSerialized !== currentRowsSerialized) {
               // Append new rows or replace if it's sending the full table
               // Assuming the agent appends rows
               const mergedRows = [...matrixRows];
               parsed.rows.forEach(r => {
                 // Prevent duplicates by checking exact matches
                 if (!mergedRows.find(exc => exc.peligro_descripcion === r.peligro_descripcion && exc.tareas === r.tareas)) {
                    mergedRows.push(r);
                 }
               });
               
               if (mergedRows.length > matrixRows.length) {
                 setMatrixRows(mergedRows);
                 saveMatrixData(currentConvoId, mergedRows);
               }
            }
          }
        } catch (e) {
          console.error("Error parsing AI JSON", e);
        }
      }
    }
  }, [messages, matrixRows, currentConvoId]);

  const saveMatrixData = async (convoId: string | null, rows: MatrixRow[], showNotification = false) => {
    if (!convoId) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sgsst/gtc45-workspace/matrix/${convoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrixRows: rows })
      });
      if (res.ok && showNotification) {
         showToast({ message: 'Matriz guardada exitosamente.', status: 'success', severity: 'success' });
      }
    } catch (e) {
      if (showNotification) showToast({ message: 'Error guardando la matriz.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = () => {
    if (!currentConvoId) {
       showToast({ message: 'Debes enviar al menos un mensaje al chat antes de guardar datos.', status: 'warning' });
       return;
    }
    saveMatrixData(currentConvoId, matrixRows, true);
  };

  const handleCellEdit = (index: number, field: keyof MatrixRow, value: string | number) => {
    const newRows = [...matrixRows];
    
    // Auto-calculate risk if numbers are changed manually
    if (['nd', 'ne', 'nc'].includes(field as string)) {
      (newRows[index] as any)[field] = Number(value);
      const nd = Number(newRows[index].nd) || 0;
      const ne = Number(newRows[index].ne) || 0;
      newRows[index].np = nd * ne;
      const np = newRows[index].np;
      const nc = Number(newRows[index].nc) || 0;
      newRows[index].nrv = np * nc;
      
      const nrv = newRows[index].nrv;
      if (nrv >= 600) newRows[index].aceptabilidad = 'No Aceptable';
      else if (nrv >= 150) newRows[index].aceptabilidad = 'No Aceptable o Aceptable con control';
      else if (nrv >= 40) newRows[index].aceptabilidad = 'Aceptable';
      else newRows[index].aceptabilidad = 'Aceptable';
    } else {
      (newRows[index] as any)[field] = value;
    }

    setMatrixRows(newRows);
  };

  const currentRole = user?.role || 'USER';

  // Robust DOM Observer to teleport the SidePanel and its Toggle Button to the far right screen edge
  useEffect(() => {
    if (currentRole !== 'ADMIN') return;
    
    let resizeObserver: ResizeObserver | null = null;
    let controlsNavRef: HTMLElement | null = null;
    let toggleWrapperRef: HTMLElement | null = null;
    let handleRef: HTMLElement | null = null;

    // This runs periodically until it finds the ChatRoute elements
    const interval = setInterval(() => {
      const controlsNav = document.getElementById('controls-nav');
      const toggleBtn = document.getElementById('toggle-right-nav');
      
      if (controlsNav && toggleBtn) {
        clearInterval(interval);
        
        controlsNavRef = controlsNav;
        toggleWrapperRef = toggleBtn.closest('.w-px') as HTMLElement;
        handleRef = document.querySelector('.gtc-workspace .bg-presentation > [data-panel-resize-handle]') as HTMLElement;
        
        // 1. Teleport controls-nav to the far right
        controlsNav.style.setProperty('position', 'fixed', 'important');
        controlsNav.style.setProperty('right', '0', 'important');
        controlsNav.style.setProperty('top', '0', 'important');
        controlsNav.style.setProperty('bottom', '0', 'important');
        controlsNav.style.setProperty('height', '100dvh', 'important');
        controlsNav.style.setProperty('z-index', '1000', 'important');
        controlsNav.style.setProperty('border-left', '1px solid var(--border-light)', 'important');
        
        // Force max-width so the sidepanel doesn't stretch out of control like 50vw when fixed
        controlsNav.style.setProperty('max-width', '352px', 'important');
        
        // 2. Hide the drag handle
        if (handleRef) {
          handleRef.style.setProperty('display', 'none', 'important');
        }

        // 3. Teleport Toggle Button
        if (toggleWrapperRef) {
          toggleWrapperRef.style.setProperty('position', 'fixed', 'important');
          toggleWrapperRef.style.setProperty('top', '50%', 'important');
          toggleWrapperRef.style.setProperty('z-index', '1010', 'important');
        }

        // 4. Sycn Toggle Button position with SidePanel width
        resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
             const width = entry.contentRect.width;
             if (toggleWrapperRef) toggleWrapperRef.style.setProperty('right', `${width}px`, 'important');
          }
        });
        resizeObserver.observe(controlsNav);
      }
    }, 500);

    // Clean up function on unmount
    return () => {
      clearInterval(interval);
      if (resizeObserver) resizeObserver.disconnect();
      
      // Cleanup CSS pollution when leaving workspace
      if (controlsNavRef) {
        controlsNavRef.style.removeProperty('position');
        controlsNavRef.style.removeProperty('right');
        controlsNavRef.style.removeProperty('top');
        controlsNavRef.style.removeProperty('bottom');
        controlsNavRef.style.removeProperty('height');
        controlsNavRef.style.removeProperty('z-index');
        controlsNavRef.style.removeProperty('border-left');
        controlsNavRef.style.removeProperty('max-width');
      }
      if (toggleWrapperRef) {
        toggleWrapperRef.style.removeProperty('position');
        toggleWrapperRef.style.removeProperty('top');
        toggleWrapperRef.style.removeProperty('z-index');
        toggleWrapperRef.style.removeProperty('right');
      }
      if (handleRef) {
        handleRef.style.removeProperty('display');
      }
    };
  }, [currentConvoId, currentRole]);

  if (currentRole !== 'ADMIN') {
    return <UpgradeWall title="Acceso Restringido (Fase Beta)" description="El agente interactivo para creación de matrices GTC-45 se encuentra actualmente en fase de pruebas cerrada y es un módulo con acceso provisional únicamente para Administradores del sistema." plan="USER_PRO" />;
  }

  return (
    <div className="flex w-full h-full bg-surface-primary overflow-hidden font-sans relative gtc-workspace">
      
      {/* 
        LEFT PANE: Native ChatRoute 
        (Chat occupies the exact left half. SidePanel is DOM-yanked to the right browser edge) 
      */}
      <div className={`transition-all duration-300 border-r border-border-medium ${isTableMaximized ? 'w-0 overflow-hidden border-none opacity-0' : 'w-1/2 min-w-[350px] max-w-2xl opacity-100 flex-shrink-0'} gtc-chat-wrapper`}>
         <div className="h-full w-full relative">
            <ChatRoute />
         </div>
      </div>

      {/* 
        RIGHT PANE: Spreadsheet Table 
        (It returns to simple Flex layout, and gets slightly padded to avoid the fixed SidePanel) 
      */}
      <div className={`flex flex-col bg-[#f8f9fa] dark:bg-[#121212] transition-all duration-300 flex-1 min-w-0 gtc-matrix-container`} style={{ paddingRight: '50px' }}>
        <div className="flex-shrink-0 h-[3.5rem] border-b border-border-medium bg-surface-primary flex items-center justify-between px-4">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-500" />
            Matriz de Riesgos (Live)
          </h3>
          <div className="flex items-center gap-3">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
            <button onClick={handleManualSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Save className="w-3.5 h-3.5" /> Guardar
            </button>
            <button onClick={() => setIsTableMaximized(!isTableMaximized)} className="p-1.5 text-text-secondary hover:text-teal-600 hover:bg-surface-hover rounded-lg transition-colors">
              {isTableMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 min-h-0 relative">
          {!currentConvoId ? (
            <div className="h-full flex items-center justify-center text-text-tertiary">
              <p>Envía un primer mensaje para inicializar el documento.</p>
            </div>
          ) : matrixRows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border-strong rounded-xl bg-surface-primary/50 text-text-tertiary">
              <p className="mb-2">Documento Inicializado</p>
              <p className="text-xs max-w-xs text-center">Pide al Agente que genere un análisis GTC-45 y la matriz comenzará a dibujarse aquí automáticamente.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-border-medium rounded-xl shadow-xl overflow-hidden inline-block min-w-full relative">
              <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                <thead>
                   <tr className="bg-slate-100 dark:bg-zinc-800 border-b border-border-strong text-slate-700 dark:text-slate-300 [&>th]:px-3 [&>th]:py-2 [&>th]:font-bold [&>th]:border-r [&>th]:border-border-light">
                    <th>Proceso</th>
                    <th>Zona/Lugar</th>
                    <th>Tareas</th>
                    <th>Rutinaria</th>
                    <th>Peligro (Descripción)</th>
                    <th>Clasificación</th>
                    <th>Efectos</th>
                    <th className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">Cntrl. Fuente</th>
                    <th className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">Cntrl. Medio</th>
                    <th className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">Cntrl. Individuo</th>
                    <th className="bg-orange-50 dark:bg-orange-900/20" title="Nivel Deficiencia">ND</th>
                    <th className="bg-orange-50 dark:bg-orange-900/20" title="Nivel Exposición">NE</th>
                    <th className="bg-orange-50 dark:bg-orange-900/20 font-bold" title="Nivel Probabilidad">NP</th>
                    <th className="bg-orange-50 dark:bg-orange-900/20" title="Nivel Consecuencia">NC</th>
                    <th className="bg-red-50 dark:bg-red-900/20 font-bold text-red-800 dark:text-red-300" title="Nivel Riesgo">NRV</th>
                    <th className="bg-red-50 dark:bg-red-900/20 font-bold text-red-800 dark:text-red-300">Aceptabilidad</th>
                    <th className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300">Medidas de Intervención</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border-b border-border-light transition-colors [&>td]:px-3 [&>td]:py-2 [&>td]:border-r [&>td]:border-border-light [&>td]:max-w-[150px] [&>td]:truncate hover:[&>td]:whitespace-normal">
                      <td><input value={row.proceso} onChange={e=>handleCellEdit(idx, 'proceso', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1" /></td>
                      <td><input value={row.zona} onChange={e=>handleCellEdit(idx, 'zona', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1" /></td>
                      <td><input value={row.tareas} onChange={e=>handleCellEdit(idx, 'tareas', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1 bg-yellow-50/30 dark:bg-yellow-900/10 font-medium" /></td>
                      <td>
                        <select value={row.rutinaria} onChange={e=>handleCellEdit(idx, 'rutinaria', e.target.value)} className="bg-transparent outline-none cursor-pointer">
                          <option value="Si">Si</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                      <td><input value={row.peligro_descripcion} onChange={e=>handleCellEdit(idx, 'peligro_descripcion', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1 text-red-600 dark:text-red-400 font-medium" /></td>
                      <td><input value={row.peligro_clasificacion} onChange={e=>handleCellEdit(idx, 'peligro_clasificacion', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1" /></td>
                      <td><input value={row.efectos} onChange={e=>handleCellEdit(idx, 'efectos', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1 text-amber-600 dark:text-amber-500" /></td>
                      
                      <td className="bg-blue-50/30 dark:bg-blue-900/10"><input value={row.control_fuente} onChange={e=>handleCellEdit(idx, 'control_fuente', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1" /></td>
                      <td className="bg-blue-50/30 dark:bg-blue-900/10"><input value={row.control_medio} onChange={e=>handleCellEdit(idx, 'control_medio', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1" /></td>
                      <td className="bg-blue-50/30 dark:bg-blue-900/10"><input value={row.control_individuo} onChange={e=>handleCellEdit(idx, 'control_individuo', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1" /></td>
                      
                      <td className="bg-orange-50/40 dark:bg-orange-900/10 font-mono"><input type="number" value={row.nd} onChange={e=>handleCellEdit(idx, 'nd', e.target.value)} className="w-10 bg-transparent text-center outline-none focus:bg-white dark:focus:bg-zinc-800 rounded" /></td>
                      <td className="bg-orange-50/40 dark:bg-orange-900/10 font-mono"><input type="number" value={row.ne} onChange={e=>handleCellEdit(idx, 'ne', e.target.value)} className="w-10 bg-transparent text-center outline-none focus:bg-white dark:focus:bg-zinc-800 rounded" /></td>
                      <td className="bg-orange-50/40 dark:bg-orange-900/10 font-bold font-mono text-center">{row.np}</td>
                      <td className="bg-orange-50/40 dark:bg-orange-900/10 font-mono"><input type="number" value={row.nc} onChange={e=>handleCellEdit(idx, 'nc', e.target.value)} className="w-12 bg-transparent text-center outline-none focus:bg-white dark:focus:bg-zinc-800 rounded" /></td>
                      
                      <td className="bg-red-50/40 dark:bg-red-900/10 font-bold font-mono text-center">
                        <span className={`px-2 py-0.5 rounded ${row.nrv >= 600 ? 'bg-red-500 text-white' : row.nrv >= 150 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}>
                          {row.nrv}
                        </span>
                      </td>
                      <td className="bg-red-50/40 dark:bg-red-900/10 font-bold text-[10px] uppercase">{row.aceptabilidad}</td>
                      
                      <td className="bg-green-50/30 dark:bg-green-900/10 font-medium"><textarea value={row.medidas_intervencion} onChange={e=>handleCellEdit(idx, 'medidas_intervencion', e.target.value)} className="w-full min-w-[200px] h-8 bg-transparent outline-none focus:ring-1 ring-teal-500 rounded px-1 -mx-1 resize-y" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
