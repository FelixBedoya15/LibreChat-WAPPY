import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Save,
  Hammer,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  Share2,
  Send,
  Eye,
  Megaphone,
  Globe,
  Users
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import CollapsibleReportBox from './CollapsibleReportBox';
import ExpandingButton from './ExpandingButton';
import { useAutoLoadReport } from './useAutoLoadReport';

interface ComunicacionItem {
  id: string;
  tipo: 'Interna' | 'Externa';
  tema: string;
  audiencia: string;
  frecuencia: string;
  canal: string;
  responsable: string;
  requiereRegistro: boolean;
}

const INITIAL_COMUNICACIONES: ComunicacionItem[] = [
  {
    id: '1',
    tipo: 'Interna',
    tema: 'Política, Objetivos y Compromisos del SG-SST',
    audiencia: 'Todos los trabajadores directos, temporales y contratistas',
    frecuencia: 'Inducción inicial y reinducción anual',
    canal: 'WAPPY LMS, carteleras digitales y folleto de bienvenida',
    responsable: 'Coordinador SG-SST / Gestión Humana',
    requiereRegistro: true
  },
  {
    id: '2',
    tipo: 'Interna',
    tema: 'Resultados de Investigación de Accidentes y Lecciones Aprendidas',
    audiencia: 'Áreas operativas, líderes de proceso y COPASST',
    frecuencia: 'Dentro de los 5 días posteriores a la investigación',
    canal: 'Charlas de 5 minutos, cartelera de seguridad y WhatsApp SST',
    responsable: 'COPASST y Responsable SG-SST',
    requiereRegistro: true
  },
  {
    id: '3',
    tipo: 'Interna',
    tema: 'Alerta y Activación ante Emergencias o Evacuación',
    audiencia: 'Todo el personal en planta y visitantes',
    frecuencia: 'En caso de conato, sismo o simulacro programado',
    canal: 'Sirena acústica, altavoces perimetrales y radios VHF brigadistas',
    responsable: 'Comandante de Brigada / Jefe de Emergencias',
    requiereRegistro: true
  },
  {
    id: '4',
    tipo: 'Externa',
    tema: 'Vocería Oficial y Declaraciones ante Incidentes Mayores o Catástrofes',
    audiencia: 'Medios de comunicación, redes sociales y opinión pública',
    frecuencia: 'Inmediato tras ocurrencia de un siniestro grave',
    canal: 'Comunicado de prensa oficial y rueda de prensa presencial',
    responsable: 'Gerente General / Director de Comunicaciones Autorizado',
    requiereRegistro: true
  },
  {
    id: '5',
    tipo: 'Externa',
    tema: 'Coordinación Operativa y Plan de Ayuda Mutua en Emergencias',
    audiencia: 'Cuerpo de Bomberos, Defensa Civil, Policía y Vecinos Industriales',
    frecuencia: 'Semestral o actualización de directorio de emergencias',
    canal: 'Reunión de comité local de gestión del riesgo y oficios formales',
    responsable: 'Líder del Plan de Emergencias (PPRE)',
    requiereRegistro: true
  },
  {
    id: '6',
    tipo: 'Externa',
    tema: 'Radicación de Informes y Autoevaluación de Estándares Mínimos',
    audiencia: 'Ministerio del Trabajo y Administradora de Riesgos Laborales (ARL)',
    frecuencia: 'Anual (Diciembre) conforme a Res. 0312/19',
    canal: 'Ventanilla electrónica del Fondo de Riesgos Laborales',
    responsable: 'Responsable SG-SST con Licencia Vigente',
    requiereRegistro: true
  }
];

export const ComunicacionesWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [comunicaciones, setComunicaciones] = useState<ComunicacionItem[]>(INITIAL_COMUNICACIONES);
  const [filterTipo, setFilterTipo] = useState<string>('todos');

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Formulario nuevo canal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTipo, setNewTipo] = useState<'Interna' | 'Externa'>('Interna');
  const [newTema, setNewTema] = useState('');
  const [newAudiencia, setNewAudiencia] = useState('');
  const [newFrecuencia, setNewFrecuencia] = useState('');
  const [newCanal, setNewCanal] = useState('');
  const [newResponsable, setNewResponsable] = useState('');

  const countInternas = comunicaciones.filter(c => c.tipo === 'Interna').length;
  const countExternas = comunicaciones.filter(c => c.tipo === 'Externa').length;

  const handleAddComunicacion = () => {
    if (!newTema.trim() || !newAudiencia.trim() || !newCanal.trim()) {
      showToast({ message: 'Completa el tema a comunicar, la audiencia y el canal.', status: 'warning' });
      return;
    }

    const newItem: ComunicacionItem = {
      id: Date.now().toString(),
      tipo: newTipo,
      tema: newTema.trim(),
      audiencia: newAudiencia.trim(),
      frecuencia: newFrecuencia.trim() || 'Periódica / Según evento',
      canal: newCanal.trim(),
      responsable: newResponsable.trim() || 'Coordinador SG-SST',
      requiereRegistro: true
    };

    setComunicaciones(prev => [newItem, ...prev]);
    setNewTema('');
    setNewAudiencia('');
    setNewFrecuencia('');
    setNewCanal('');
    setNewResponsable('');
    setIsFormOpen(false);
    showToast({ message: 'Canal de comunicación registrado en la matriz.', status: 'success' });
  };

  const handleDeleteComunicacion = (id: string) => {
    setComunicaciones(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveLocal = () => {
    setIsSavingLocal(true);
    try {
      localStorage.setItem('wappy_iso45001_comunicaciones', JSON.stringify(comunicaciones));
      showToast({ message: 'Matriz de Comunicaciones guardada localmente.', status: 'success' });
    } catch {
      showToast({ message: 'Error al guardar los datos en almacenamiento local.', status: 'error' });
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const rowsHtml = comunicaciones.map(c => `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: ${c.tipo === 'Interna' ? '#0f766e' : '#b45309'}; text-align: center;">${c.tipo}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 500;">${c.tema}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.audiencia}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.frecuencia}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.canal}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.responsable}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center;">${c.requiereRegistro ? 'Sí (Acta / Senc)' : 'No'}</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
            PLAN Y MATRIZ DE COMUNICACIONES INTERNAS Y EXTERNAS DEL SG-SST
          </h1>
          <p><strong>Normativa Técnica Internacional:</strong> ISO 45001:2018 Cláusula 7.4 (Comunicación)</p>
          <p><strong>Alineación Jurídica Nacional:</strong> Decreto 1072 de 2015 Art. 2.2.4.6.14 · Resolución 0312 de 2019 Estándar 2.8.1</p>
          <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h2 style="color: #0f766e; margin-top: 24px;">1. Objeto y Alcance</h2>
          <p>Establecer, implementar y mantener los procesos necesarios para las comunicaciones internas y externas pertinentes al SG-SST, determinando qué comunicar, cuándo comunicar, a quién comunicar, cómo comunicar y quién es el portavoz oficial autorizado.</p>

          <h2 style="color: #0f766e; margin-top: 24px;">2. Matriz de Canales y Flujos de Comunicación SST</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0f766e; color: white;">
                <th style="padding: 8px; border: 1px solid #0f766e;">Tipo</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">¿Qué comunicar? (Tema)</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">¿A quién? (Audiencia)</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">¿Cuándo? (Frecuencia)</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">¿Cómo? (Canal)</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">¿Quién comunica?</th>
                <th style="padding: 8px; border: 1px solid #0f766e;">Registro</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <h2 style="color: #0f766e; margin-top: 28px;">3. Protocolo de Comunicación Externa ante Emergencias y Medios</h2>
          <p>Queda expresamente restringida la emisión de comunicados o declaraciones a medios de comunicación y redes sociales sobre contingencias laborales, salvo previa autorización expresa del Gerente General o su portavoz oficial designado, garantizando veracidad, respeto a las familias y estricto apego legal.</p>
        </div>
      `;
      setGeneratedReport(html);
      editorContentRef.current = html;
      showToast({ message: 'Plan de Comunicaciones generado con éxito.', status: 'success' });
    } catch {
      showToast({ message: 'Error al compilar el plan de comunicaciones con IA.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  useAutoLoadReport({
    token,
    tags: ['sgsst-comunicaciones'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  const filtered = filterTipo === 'todos'
    ? comunicaciones
    : comunicaciones.filter(c => c.tipo.toLowerCase() === filterTipo.toLowerCase());

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── BANNER PRINCIPAL COMUNICACIONES (WAPPY DESIGN SYSTEM) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-500 text-white shadow-lg shadow-teal-500/20">
              <Megaphone className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  Plan y Matriz de Comunicaciones SST (Internas y Externas)
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Hammer className="w-3 h-3" /> En construcción
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${countInternas} Canales de Comunicación Interna`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-surface-primary text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {countInternas} Canales Internos
                    </span>
                  </div>
                </div>

                <div
                  title={`${countExternas} Protocolos de Comunicación Externa`}
                  className="group flex h-8 min-w-[32px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-amber-500/30 bg-surface-primary text-amber-700 dark:text-amber-300 px-2 sm:px-2.5 shadow-sm transition-all duration-300 sm:hover:scale-105"
                >
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-sm font-bold tracking-wide">
                      {countExternas} Protocolos Externos
                    </span>
                  </div>
                </div>

                {/* ISO 45001 Num. 7.4 · Res. 0312 Est. 2.8.1: CUMPLE */}
                <SGSSTLegalBadge
                  standardCode="2.8.1"
                  label="ISO 45001 Num. 7.4 · Res. 0312 Est. 2.8.1: CUMPLE"
                  tooltip="ISO 45001:2018 Cláusula 7.4 (Comunicación interna y externa) · Dec. 1072/15 Art. 2.2.4.6.14 y Res. 0312/2019 Estándar 2.8.1"
                  moduleName="Plan y Matriz de Comunicaciones SST"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandingButton
              onClick={() => setIsFormOpen(!isFormOpen)}
              icon={Plus}
              label={isFormOpen ? "Cerrar Formulario" : "Nuevo Canal"}
              variant="teal"
            />
            <ExpandingButton
              onClick={handleSaveLocal}
              icon={Save}
              label="Guardar Matriz"
              variant="outline-teal"
              isLoading={isSavingLocal}
            />
          </div>
        </div>
      </div>

      {/* ─── BANNER ELEGANTE EN CONSTRUCCIÓN / VISTA PREVIA ACTIVA ─── */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 flex items-start sm:items-center gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          <Hammer className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Módulo en Construcción (Fase Beta · Matriz de Comunicaciones ISO 45001)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            Este aplicativo da cumplimiento integral a la <strong>Cláusula 7.4 de ISO 45001:2018 y Decreto 1072 Art. 2.2.4.6.14</strong>.
            Estructura los flujos de comunicación con colaboradores, contratistas, brigada y la vocería oficial ante entidades de control, vecinos y medios de comunicación.
          </p>
        </div>
      </div>

      {/* ─── FORMULARIO REGISTRO NUEVO CANAL ─── */}
      {isFormOpen && (
        <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/70 backdrop-blur-md shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-500" /> Registrar Nuevo Flujo de Comunicación
            </h3>
            <span className="text-[11px] text-text-tertiary">ISO 45001 Cláusula 7.4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Ámbito de Comunicación</label>
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Interna">Interna (Colaboradores / Contratistas en planta)</option>
                <option value="Externa">Externa (Medios / Vecinos / Autoridades / ARL)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Tema / Asunto a Comunicar</label>
              <input
                type="text"
                placeholder="Ej: Resultados de mediciones higiénicas de ruido e iluminación..."
                value={newTema}
                onChange={(e) => setNewTema(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">¿A quién comunicar? (Audiencia)</label>
              <input
                type="text"
                placeholder="Ej: Personal del taller de mecanizado y COPASST..."
                value={newAudiencia}
                onChange={(e) => setNewAudiencia(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">¿Cómo? (Canal o Medio)</label>
              <input
                type="text"
                placeholder="Ej: Cartelera informativa, reunión y correo..."
                value={newCanal}
                onChange={(e) => setNewCanal(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1 block">Frecuencia / Oportunidad</label>
              <input
                type="text"
                placeholder="Ej: Semestral / Posterior a la medición..."
                value={newFrecuencia}
                onChange={(e) => setNewFrecuencia(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <input
              type="text"
              placeholder="¿Quién comunica? (Responsable)..."
              value={newResponsable}
              onChange={(e) => setNewResponsable(e.target.value)}
              className="w-full sm:w-auto flex-1 px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-secondary"
              >
                Cancelar
              </button>
              <ExpandingButton
                onClick={handleAddComunicacion}
                icon={Plus}
                label="Registrar Canal"
                variant="teal"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TABLA DE FLUJOS Y MATRIZ DE COMUNICACIONES ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary">Filtrar por ámbito:</span>
            <div className="flex items-center gap-1">
              {['todos', 'Interna', 'Externa'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterTipo(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    filterTipo === st
                      ? 'bg-teal-500 text-white shadow-xs'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  {st === 'todos' ? 'Todos los Canales' : st}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-text-tertiary">
            Mostrando {filtered.length} de {comunicaciones.length} flujos de comunicación
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3 text-center">Tipo</th>
                <th className="p-3">¿Qué comunicar? (Tema)</th>
                <th className="p-3">¿A quién? (Audiencia)</th>
                <th className="p-3">Frecuencia</th>
                <th className="p-3">Canal / Medio</th>
                <th className="p-3">Portavoz / Responsable</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-white/5 bg-surface-primary/40">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.tipo === 'Interna'
                        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-text-primary max-w-xs">{c.tema}</td>
                  <td className="p-3 text-text-secondary max-w-xs text-[11px]">{c.audiencia}</td>
                  <td className="p-3 text-text-secondary text-[11px]">{c.frecuencia}</td>
                  <td className="p-3 text-teal-600 dark:text-teal-400 font-medium text-[11px] max-w-xs">{c.canal}</td>
                  <td className="p-3 text-text-secondary text-[11px]">{c.responsable}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteComunicacion(c.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                      title="Eliminar flujo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── TOOLBAR FLOTANTE CÁPSULA WAPPY ─── */}
      <SGSSTToolbar
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onAnalyze={handleGenerate}
        isAnalyzing={isGenerating}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSaveLocal={handleSaveLocal}
        isSavingLocal={isSavingLocal}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Matriz_Comunicaciones_ISO45001_${Date.now()}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Plan y Protocolo de Comunicaciones SST (ISO 45001 Num. 7.4)"
        icon={<MessageSquare className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName="Plan_Comunicaciones_ISO45001"
            reportType="general"
          />
        }
      >
        <div className="w-full min-w-0">
          <LiveEditor
            ref={liveEditorRef}
            paperMode={true}
            initialContent={generatedReport || ''}
            onUpdate={(html) => {
              editorContentRef.current = html;
            }}
            reportSourceData={comunicaciones}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default ComunicacionesWorkspace;
