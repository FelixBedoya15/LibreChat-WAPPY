import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Send, Loader2, Plus, MessageSquare, Trash2, Maximize2, Minimize2, Save, FileSpreadsheet } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { UpgradeWall } from './UpgradeWall';

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

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

interface Session {
  _id: string;
  title: string;
  messages: Message[];
  matrixRows: MatrixRow[];
  updatedAt: string;
}

export default function AgenteGTC45Workspace() {
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTableMaximized, setIsTableMaximized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sgsst/gtc45-workspace/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !currentSession) {
          loadSession(data[0]._id);
        } else if (data.length === 0) {
          createNewSession();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sgsst/gtc45-workspace/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCurrentSession(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createNewSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sgsst/gtc45-workspace/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: `Análisis GTC-45 ${new Date().toLocaleDateString()}` })
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions([newSession, ...sessions]);
        setCurrentSession(newSession);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm('¿Eliminar esta sesión de análisis?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sgsst/gtc45-workspace/session/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s._id !== id));
        if (currentSession?._id === id) {
          setCurrentSession(null);
          if (sessions.length > 1) loadSession(sessions.find(s => s._id !== id)!._id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentSession || isLoading) return;

    const userMessageText = inputText;
    setInputText('');
    setIsLoading(true);

    // Optimistic update
    const optimisticSession = { ...currentSession };
    optimisticSession.messages = [...optimisticSession.messages, { role: 'user', text: userMessageText }];
    setCurrentSession(optimisticSession);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sgsst/gtc45-workspace/chat/${currentSession._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessageText })
      });

      if (res.ok) {
        const data = await res.json();
        // Server returns the new AI text and updated matrixRows
        setCurrentSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, { role: 'assistant', text: data.message }],
            matrixRows: data.matrixRows
          };
        });
      } else {
        alert('Error al comunicar con la IA');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const saveManualMatrixEdits = async () => {
    if (!currentSession) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/sgsst/gtc45-workspace/session/${currentSession._id}/matrix`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrixRows: currentSession.matrixRows })
      });
      alert('Matriz guardada manualmente.');
    } catch (e) {
      alert('Error guardando la matriz');
    }
  };

  const handleCellEdit = (index: number, field: keyof MatrixRow, value: string | number) => {
    if (!currentSession) return;
    const newRows = [...currentSession.matrixRows];
    
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

    setCurrentSession({ ...currentSession, matrixRows: newRows });
  };

  const currentRole = user?.role || 'USER';
  if (currentRole !== 'ADMIN') {
    return <UpgradeWall title="Acceso Restringido (Fase Beta)" description="El agente interactivo para creación de matrices GTC-45 se encuentra actualmente en fase de pruebas cerrada y es un módulo con acceso provisional únicamente para Administradores del sistema." plan="USER_PRO" />;
  }

  return (
    <div className="flex h-screen bg-surface-primary overflow-hidden font-sans">
      
      {/* SIDEBAR: History */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-surface-secondary border-r border-border-medium flex flex-col z-20"
          >
            <div className="p-4 border-b border-border-medium flex items-center justify-between">
              <h2 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <Network className="w-4 h-4 text-teal-500" />
                Agente GTC-45
              </h2>
              <button onClick={createNewSession} className="p-1.5 hover:bg-surface-hover rounded-md text-text-secondary transition-colors" title="Nuevo Análisis">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.map(s => (
                <div 
                  key={s._id}
                  onClick={() => loadSession(s._id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${currentSession?._id === s._id ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300' : 'bg-transparent border-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary'}`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate flex-1">{s.title}</span>
                  </div>
                  <span className="text-xs opacity-50 block mt-1 ml-6">{new Date(s.updatedAt).toLocaleDateString()}</span>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteSession(s._id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-400/20 rounded-md transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Toggle Sidebar Button (Mobile/Desktop) */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-30 p-1.5 bg-surface-primary border border-border-medium rounded-r-lg shadow-md text-text-secondary hover:text-text-primary"
        >
          <div className={`w-1 h-8 rounded-full bg-border-strong transition-transform ${isSidebarOpen ? '' : 'bg-teal-500'}`} />
        </button>

        {/* LEFT PANE: Chat */}
        <div className={`flex flex-col h-full bg-surface-primary border-r border-border-medium transition-all duration-300 ${isTableMaximized ? 'w-0 lg:w-0 overflow-hidden border-none' : 'w-full lg:w-1/3 min-w-[320px] max-w-xl'}`}>
          <div className="p-4 border-b border-border-light bg-surface-secondary/50 flex justify-between items-center h-14 shrink-0">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                 <Network className="w-4 h-4 text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-sm text-text-primary leading-tight">Agente Experto GTC-45</h3>
                 <p className="text-[10px] text-teal-600 font-semibold">ACTIVO E INTERACTUANDO</p>
               </div>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {currentSession?.messages?.length === 0 && (
              <div className="text-center text-text-tertiary my-10 animate-in fade-in slide-in-from-bottom-5">
                <Network className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h4 className="text-lg font-bold mb-2 text-text-secondary">Generación Automática GTC-45</h4>
                <p className="text-sm max-w-xs mx-auto">
                  Háblame de un puesto de trabajo, proceso o tarea y juntos construiremos la matriz en tiempo real.
                </p>
              </div>
            )}
            
            {currentSession?.messages?.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-surface-secondary border border-border-light text-text-primary rounded-tl-sm'}`}>
                  <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-secondary border border-border-light rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span className="text-sm font-medium text-text-secondary">Estructurando matriz...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-surface-primary border-t border-border-medium shrink-0">
            <form onSubmit={sendMessage} className="relative">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Ej: Hay un señor cortando madera con sierra..."
                className="w-full bg-surface-secondary border border-border-strong text-text-primary rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm transition-all text-sm"
                disabled={!currentSession || isLoading}
              />
              <button 
                type="submit"
                disabled={!inputText.trim() || !currentSession || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANE: Spreadsheet Table */}
        <div className={`flex flex-col h-full bg-[#f8f9fa] dark:bg-[#121212] transition-all duration-300 flex-1 min-w-0`}>
          <div className="flex-shrink-0 h-14 border-b border-border-medium bg-surface-primary flex items-center justify-between px-4">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-500" />
              Matriz de Riesgos Interactiva
            </h3>
            <div className="flex gap-2">
              <button onClick={saveManualMatrixEdits} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Save className="w-3.5 h-3.5" /> Guardar Cambios
              </button>
              <button onClick={() => setIsTableMaximized(!isTableMaximized)} className="p-1.5 text-text-secondary hover:text-teal-600 hover:bg-surface-hover rounded-lg transition-colors">
                {isTableMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4 sm:p-6 min-h-0 relative">
            {!currentSession ? (
              <div className="h-full flex items-center justify-center text-text-tertiary">
                <p>Selecciona o crea un nuevo análisis en la barra lateral.</p>
              </div>
            ) : currentSession.matrixRows.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-border-strong rounded-xl bg-surface-primary/50 text-text-tertiary">
               Cuentale al Agente sobre un puesto de trabajo para comenzar a diagramar...
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
                      <th className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300">Medidas de Intervención (Acción)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSession.matrixRows.map((row, idx) => (
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
    </div>
  );
}
