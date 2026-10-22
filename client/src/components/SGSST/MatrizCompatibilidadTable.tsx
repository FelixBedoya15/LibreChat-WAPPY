import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext } from '~/hooks';
import { isVitalUser } from '~/utils/planAccess';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useToastContext } from '@librechat/client';
import store from '~/store';
import {
  Beaker,
  Plus,
  Trash2,
  Save,
  Loader2,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
  Check,
  AlertTriangle,
  FileText as FileTextIcon,
  Info,
  Pin,
  CheckSquare,
  RefreshCw,
  Grid,
  Printer,
  ShieldAlert,
  Tag,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  MatrixRow,
  CLASES_ONU,
  ESTADO_OPCIONES,
  SGA_PICTOGRAMS,
  findSgaPictogram,
  getChemicalCompatibility
} from './MatrizCompatibilidadConstants';
import { exportCompatibilidadToExcel } from './exportCompatibilidad';
import MatrizCompatibilidadDashboard from './MatrizCompatibilidadDashboard';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import SGSSTToolbar from './SGSSTToolbar';
import CollapsibleReportBox from './CollapsibleReportBox';
import UniversalColumnMapperModal from './UniversalColumnMapperModal';
import ImportMethodModal from './ImportMethodModal';
import { MATRIZ_COMPATIBILIDAD_FIELDS } from './moduleFieldDefinitions';

const PICTOGRAMAS_SGA_LIST = SGA_PICTOGRAMS;

const DUMMY_CHEMICAL_ROWS: MatrixRow[] = [
  {
    id: 'dummy-chem-1',
    nombre: 'Hipoclorito de sodio al 13%',
    fabricante: 'Químicos del Cauca S.A.S.',
    estado_fisico: 'Líquido',
    clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
    numero_onu: 'UN 1791',
    cas: '7681-52-9',
    palabra_advertencia: 'PELIGRO',
    pictogramas_sga: ['corrosivo', 'medio_ambiente'],
    cantidad_almacenada: '60 Galones',
    ubicacion: 'Bodega de Aseo y Desinfección',
    tiene_fds: 'Sí',
    tiene_rotulo: 'Sí',
    frases_h: 'H314: Provoca quemaduras graves en la piel y lesiones oculares graves. H400: Muy tóxico para los organismos acuáticos.',
    consejos_p: 'P260: No respirar vapores. P280: Usar guantes de nitrilo, ropa de protección y gafas de seguridad. P305+P351+P338: En caso de contacto con los ojos, enjuagar con agua cuidadosamente durante varios minutos.',
    epp_recomendado: 'Guantes de nitrilo caña larga, monogafas con ventilación indirecta, delantal de PVC y respirador con cartucho para gases ácidos/cloro.',
    primeros_auxilios: 'Inhalación: aire fresco inmediato. Piel/Ojos: lavar con abundante agua en ducha lavaojos mínimo 15 minutos. Ingestión: no inducir el vómito, atención médica inmediata.',
    control_derrames: 'Contener con dique absorbente inerte (arena o vermiculita). No usar aserrín. Evitar ingreso a alcantarillas.',
    incompatibilidades: 'Ácidos fuertes (libera gas cloro altamente tóxico), amoníaco, agentes reductores y metales.',
    requisitos_almacenamiento: 'Almacenar sobre estiba plástica antiderrame, envase opaco cerrado, ventilación natural y lejos de ácidos.'
  },
  {
    id: 'dummy-chem-2',
    nombre: 'Ácido clorhídrico (ácido muriático) 33%',
    fabricante: 'Sucroal S.A.',
    estado_fisico: 'Líquido',
    clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
    numero_onu: 'UN 1789',
    cas: '7647-01-0',
    palabra_advertencia: 'PELIGRO',
    pictogramas_sga: ['corrosivo', 'signo_exclamacion'],
    cantidad_almacenada: '25 Galones',
    ubicacion: 'Bodega de Mantenimiento',
    tiene_fds: 'Sí',
    tiene_rotulo: 'Sí',
    frases_h: 'H290: Puede ser corrosivo para los metales. H314: Provoca quemaduras graves en la piel y lesiones oculares graves. H335: Puede irritar las vías respiratorias.',
    consejos_p: 'P260: No respirar los vapores. P280: Usar guantes de neopreno/nitrilo, careta facial y delantal químico.',
    epp_recomendado: 'Guantes de neopreno para ácidos, careta facial + monogafas, traje/delantal antiácido y respirador con filtro para gases ácidos.',
    primeros_auxilios: 'Lavar inmediatamente con abundante agua durante 15-20 minutos retirando ropa contaminada. Trasladar al aire fresco.',
    control_derrames: 'Neutralizar cuidadosamente con carbonato de sodio o cal apagada bajo supervisión técnica. Absorber con material inerte.',
    incompatibilidades: 'Hipocloritos, bases fuertes (hidróxido de sodio), metales activos (genera hidrógeno inflamable).',
    requisitos_almacenamiento: 'Segregar de bases e hipocloritos mediante gabinete anticorrosivo con bandeja de contención al 110%.'
  },
  {
    id: 'dummy-chem-3',
    nombre: 'Thinner acrílico industrial',
    fabricante: 'Pintuco / Orbis',
    estado_fisico: 'Líquido',
    clasificacion_onu: 'Clase 3: Líquidos Inflamables',
    numero_onu: 'UN 1263',
    cas: '108-88-3',
    palabra_advertencia: 'PELIGRO',
    pictogramas_sga: ['inflamable', 'peligro_salud', 'signo_exclamacion'],
    cantidad_almacenada: '40 Galones',
    ubicacion: 'Almacén de Pinturas y Solventes',
    tiene_fds: 'Sí',
    tiene_rotulo: 'Sí',
    frases_h: 'H225: Líquido y vapores muy inflamables. H304: Puede ser mortal en caso de ingestión y penetración en las vías respiratorias. H336: Puede provocar somnolencia o vértigo.',
    consejos_p: 'P210: Mantener alejado del calor, chispas y llamas abiertas. No fumar. P240: Toma de tierra y enlace equipotencial del recipiente.',
    epp_recomendado: 'Respirador media cara con cartuchos para vapores orgánicos (VO), guantes de nitrilo o PVA, gafas de seguridad y calzado antiestático.',
    primeros_auxilios: 'Inhalación: llevar al aire libre. Contacto dérmico: lavar con agua y jabón. Ingestión: NO inducir el vómito por riesgo de aspiración pulmonar.',
    control_derrames: 'Eliminar toda fuente de ignición. Absorber con tierra o arena seca con herramientas antichispa. Extintor PQS ABC o espuma.',
    incompatibilidades: 'Sustancias comburentes (peróxidos, nitratos), ácidos fuertes y fuentes de ignición o chispas.',
    requisitos_almacenamiento: 'Gabinete certificado FM para líquidos inflamables con puesta a tierra, extintor multipropósito ABC y ventilación mecánica.'
  },
  {
    id: 'dummy-chem-4',
    nombre: 'Peróxido de hidrógeno al 50%',
    fabricante: 'Evonik / Brenntag',
    estado_fisico: 'Líquido',
    clasificacion_onu: 'Clase 5.1: Sustancias Comburentes',
    numero_onu: 'UN 2014',
    cas: '7722-84-1',
    palabra_advertencia: 'PELIGRO',
    pictogramas_sga: ['comburente', 'corrosivo'],
    cantidad_almacenada: '15 Garrafas (300 Kg)',
    ubicacion: 'Bodega Planta de Tratamiento',
    tiene_fds: 'Sí',
    tiene_rotulo: 'Sí',
    frases_h: 'H271: Puede provocar un incendio o una explosión; muy comburente. H302+H332: Nocivo en caso de ingestión o inhalación. H314: Provoca quemaduras graves en la piel y lesiones oculares.',
    consejos_p: 'P220: Mantener alejado de la ropa y otros materiales combustibles. P280: Usar protección ocular, facial y guantes resistentes a químicos.',
    epp_recomendado: 'Careta facial completa, monogafas, guantes de caucho butílico o nitrilo, delantal impermeable y botas de PVC.',
    primeros_auxilios: 'Enjuagar piel y ojos inmediatamente con abundante agua por 15 minutos. No aplicar ungüentos.',
    control_derrames: 'Diluir con abundante agua. Nunca devolver producto derramado al envase original (riesgo de descomposición explosiva).',
    incompatibilidades: 'Líquidos inflamables (solventes, thinner), materia orgánica, metales pesados y agentes reductores.',
    requisitos_almacenamiento: 'Aislar estrictamente de inflamables y combustibles (distancia mínima 3m o muro cortafuego), envases con válvula de venteo.'
  },
  {
    id: 'dummy-chem-5',
    nombre: 'Hidróxido de sodio en escamas (soda cáustica)',
    fabricante: 'Brinsa S.A.',
    estado_fisico: 'Sólido',
    clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
    numero_onu: 'UN 1823',
    cas: '1310-73-2',
    palabra_advertencia: 'PELIGRO',
    pictogramas_sga: ['corrosivo'],
    cantidad_almacenada: '8 Bultos (200 Kg)',
    ubicacion: 'Bodega Planta de Tratamiento',
    tiene_fds: 'Sí',
    tiene_rotulo: 'Sí',
    frases_h: 'H290: Puede ser corrosivo para los metales. H314: Provoca quemaduras graves en la piel y lesiones oculares graves.',
    consejos_p: 'P260: No respirar el polvo. P280: Usar guantes, ropa de protección, gafas y máscara facial.',
    epp_recomendado: 'Guantes de nitrilo/neopreno, monogafas herméticas, careta facial, mascarilla para polvos alcalinos N95/P100 y delantal de PVC.',
    primeros_auxilios: 'Retirar polvo seco y lavar inmediatamente con abundante agua corriente durante al menos 15 minutos.',
    control_derrames: 'Recoger en seco con pala plástica evitando levantar polvo. No agregar agua directamente en grandes cantidades por reacción exotérmica.',
    incompatibilidades: 'Ácidos fuertes (reacción exotérmica violenta), agua en contacto directo masivo, aluminio y zinc.',
    requisitos_almacenamiento: 'Almacenar en lugar seco sobre estiba plástica, separado de ácidos por compartimento estanco, ducha lavaojos a menos de 10 segundos.'
  }
];

const DropdownSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      const handleScroll = () => setOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [open]);

  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between rounded-xl border border-border-medium bg-surface-primary px-2.5 py-1.5 text-left text-xs text-text-primary hover:bg-surface-hover focus:outline-none"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0 ml-1" />
      </button>
      {open &&
        createPortal(
          <div
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            className="fixed z-[99999] max-h-60 overflow-auto rounded-xl border border-border-medium bg-surface-primary p-1 shadow-xl"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  value === opt
                    ? 'bg-teal-500/10 font-semibold text-teal-600 dark:text-teal-400'
                    : 'text-text-primary hover:bg-surface-secondary'
                }`}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check className="h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

const PictogramsSelect = ({
  selected = [],
  onChange,
}: {
  selected: string[];
  onChange: (val: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePic = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(i => i !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[34px] w-full flex-wrap items-center gap-1.5 rounded-xl border border-border-medium bg-surface-primary px-2 py-1 text-left text-xs text-text-primary hover:bg-surface-hover"
      >
        {selected.length === 0 ? (
          <span className="text-text-secondary opacity-60">Seleccionar pictogramas...</span>
        ) : (
          selected.map(id => {
            const pic = findSgaPictogram(id);
            return (
              <span
                key={id}
                title={pic ? `${pic.ghsCode} - ${pic.name}` : id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300 border border-red-500/20"
              >
                {pic?.svgUrl ? (
                  <img
                    src={pic.svgUrl}
                    alt={pic.name}
                    className="w-4 h-4 object-contain shrink-0 bg-white rounded-xs"
                  />
                ) : (
                  <span>{pic?.icon || '⚠️'}</span>
                )}
                <span>{pic?.name || id}</span>
              </span>
            );
          })
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-[9999] mt-1 w-64 rounded-xl border border-border-medium bg-surface-primary p-2 shadow-xl">
          <div className="mb-1.5 text-[10px] font-bold uppercase text-text-secondary px-1 flex items-center justify-between">
            <span>Pictogramas Oficiales SGA</span>
            <span className="text-[9px] text-teal-600">ONU / PubChem</span>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {PICTOGRAMAS_SGA_LIST.map((pic) => {
              const isSelected = selected.includes(pic.key) || selected.includes(pic.name);
              return (
                <button
                  key={pic.key}
                  type="button"
                  onClick={() => togglePic(pic.key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-red-500/10 font-bold text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'text-text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="rounded border-border-medium text-teal-600 focus:ring-0"
                  />
                  <img
                    src={pic.svgUrl}
                    alt={pic.name}
                    className="w-6 h-6 object-contain shrink-0 bg-white rounded-sm p-0.5 border border-red-200"
                  />
                  <div className="flex flex-col leading-tight">
                    <span>{pic.name}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">{pic.ghsCode} • {pic.signalWord}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function MatrizCompatibilidadTable({
  conversationId,
  isOfficialApp = false,
  onRefreshOfficialList,
}: {
  conversationId: string | null;
  isOfficialApp?: boolean;
  onRefreshOfficialList?: () => void;
}) {
  const { token, user } = useAuthContext();
  const isVital = isVitalUser(user);
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));
  const { showToast } = useToastContext();

  const [activeTab, setActiveTab] = useState<'inventario' | 'matriz_cruzada' | 'dashboard' | 'reporte'>('inventario');
  const [officialSubView, setOfficialSubView] = useState<'inventario' | 'matriz_cruzada'>('inventario');
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isSyncingKanban, setIsSyncingKanban] = useState(false);
  const [isSyncingHito5, setIsSyncingHito5] = useState(false);
  const [aiRowLoading, setAiRowLoading] = useState<number | null>(null);
  
  // Analítica & Reporte
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [chartConclusions, setChartConclusions] = useState<Record<string, string>>({});
  const editorRef = useRef<LiveEditorHandle>(null);

  // Maximizar
  const [isMaximized, setIsMaximized] = useRecoilState(store.chemicalCompatibilityMaximized);

  // Estado Modal Importar Excel
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingRawRows, setPendingRawRows] = useState<any[]>([]);
  const [pendingDirectRows, setPendingDirectRows] = useState<MatrixRow[]>([]);
  const [isAiImportLoading, setIsAiImportLoading] = useState(false);
  const [columnMapperBuffer, setColumnMapperBuffer] = useState<ArrayBuffer | null>(null);
  const [isColumnMapperOpen, setIsColumnMapperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detalle Celda Grid Cruzado
  const [selectedCrossCell, setSelectedCrossCell] = useState<{
    prodA: MatrixRow;
    prodB: MatrixRow;
    result: any;
  } | null>(null);

  // Modal Tarjeta del Producto Químico / Rótulo SGA
  const [selectedProductCardIdx, setSelectedProductCardIdx] = useState<number | null>(null);

  const fetchMatrix = useCallback(async () => {
    if (!conversationId || conversationId === 'new') {
      setMatrixRows([]);
      setChartConclusions({});
      setReportContent('');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sgsst/chemical-compatibility/matrix/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMatrixRows(data.matrixRows || []);
        setChartConclusions(data.chartConclusions || {});
        if (data.reportHtml) {
          setReportContent(data.reportHtml);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      if (conversationId && conversationId !== 'new') {
        interval = setInterval(() => fetchMatrix(), 3000);
      }
    }
    if (!isSubmitting) {
      if (conversationId && conversationId !== 'new') {
        fetchMatrix();
      }
    }
    return () => clearInterval(interval);
  }, [isSubmitting, conversationId, fetchMatrix]);

  // Guardar Matriz en Backend
  const saveMatrix = async (rowsToSave = matrixRows, notify = true, customReportHtml?: string) => {
    if (!conversationId) return;
    setIsSaving(true);
    try {
      const currentReport = customReportHtml !== undefined
        ? customReportHtml
        : (editorRef.current?.getHTML() || reportContent || '');
      const res = await fetch(`/api/sgsst/chemical-compatibility/matrix/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows: rowsToSave, reportHtml: currentReport })
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('sgsst-diagnostic-updated'));
        if (notify) {
          showToast({ message: 'Matriz de compatibilidad química guardada exitosamente.', status: 'success', severity: 'success' });
          if (onRefreshOfficialList) onRefreshOfficialList();
        }
      }
    } catch (e) {
      console.error(e);
      if (notify) showToast({ message: 'Error al guardar el inventario.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Fijar matriz del chat como Matriz Oficial de Compatibilidad Química
  const handlePromoteToOfficial = async () => {
    if (!conversationId || matrixRows.length === 0) {
      showToast({ message: 'La matriz no tiene productos para fijar en el aplicativo.', status: 'warning' });
      return;
    }
    setIsPromoting(true);
    try {
      const currentReport = editorRef.current?.getHTML() || reportContent || '';
      const res = await fetch('/api/sgsst/chemical-compatibility/set-official', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceConversationId: conversationId,
          matrixRows,
          chartConclusions,
          reportHtml: currentReport,
          officialTitle: 'Matriz Oficial de Compatibilidad Química'
        })
      });
      if (res.ok) {
        showToast({ message: 'Matriz fijada exitosamente en el aplicativo oficial del Hito 1.', status: 'success' });
        if (onRefreshOfficialList) onRefreshOfficialList();
      } else {
        showToast({ message: 'Error al fijar la matriz como oficial.', status: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al conectar con el servidor.', status: 'error' });
    } finally {
      setIsPromoting(false);
    }
  };

  // Sincronizar desde Inventario Químico del Hito 5
  const handleSyncFromHito5 = async () => {
    setIsSyncingHito5(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/sync-hito5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId })
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data.matrixRows) && data.matrixRows.length > 0) {
          setMatrixRows(data.matrixRows);
          if (onRefreshOfficialList) onRefreshOfficialList();
        }
        showToast({ message: data.message || 'Sincronización con Hito 5 completada.', status: 'success' });
      } else {
        showToast({ message: data.error || 'Error al sincronizar con Hito 5.', status: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al sincronizar con el Hito 5.', status: 'error' });
    } finally {
      setIsSyncingHito5(false);
    }
  };

  // Sincronizar controles químicos y brechas FDS/Rótulo con Centro de Control (Kanban ACPM)
  const handleSyncControlesQuimicos = async () => {
    if (matrixRows.length === 0) {
      showToast({ message: 'No hay productos en la matriz para sincronizar controles.', status: 'warning' });
      return;
    }
    setIsSyncingKanban(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/sync-controles-quimicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows })
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ message: data.message || 'Controles químicos sincronizados con el Centro de Control.', status: 'success' });
      } else {
        showToast({ message: data.error || 'Error al sincronizar controles químicos.', status: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al sincronizar con el Centro de Control.', status: 'error' });
    } finally {
      setIsSyncingKanban(false);
    }
  };

  // Datos de prueba (Dummy)
  const handleFillDummy = () => {
    setMatrixRows(DUMMY_CHEMICAL_ROWS);
    saveMatrix(DUMMY_CHEMICAL_ROWS, true);
  };

  // Agregar fila
  const addRow = () => {
    const newRow: MatrixRow = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      nombre: '',
      fabricante: 'Desconocido',
      estado_fisico: 'Líquido',
      clasificacion_onu: 'No Peligroso',
      pictogramas_sga: [],
      cantidad_almacenada: '',
      ubicacion: 'Bodega General',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      incompatibilidades: 'Ninguna',
      requisitos_almacenamiento: 'Almacenar en lugar ventilado y señalizado'
    };
    const updated = [...matrixRows, newRow];
    setMatrixRows(updated);
  };

  // Montar producto y abrir de inmediato el generador de Tarjeta del Producto Químico / Rótulo SGA
  const addRowAndOpenCard = () => {
    const newRow: MatrixRow = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      nombre: '',
      fabricante: '',
      estado_fisico: 'Líquido',
      clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
      numero_onu: '',
      cas: '',
      palabra_advertencia: 'PELIGRO',
      pictogramas_sga: [],
      cantidad_almacenada: '',
      ubicacion: 'Bodega General',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      frases_h: '',
      consejos_p: '',
      epp_recomendado: '',
      primeros_auxilios: '',
      control_derrames: '',
      incompatibilidades: '',
      requisitos_almacenamiento: 'Almacenar en área ventilada, con dique de contención y señalización SGA.'
    };
    const nextIdx = matrixRows.length;
    const updated = [...matrixRows, newRow];
    setMatrixRows(updated);
    setSelectedProductCardIdx(nextIdx);
  };

  const buildProductSgaCardHtml = (prod: MatrixRow) => {
    const pictos = (prod.pictogramas_sga || [])
      .map((k) => findSgaPictogram(k))
      .filter(Boolean);
    const signalWord =
      prod.palabra_advertencia ||
      (pictos.some((p) => p?.signalWord === 'PELIGRO') ? 'PELIGRO' : 'ATENCIÓN');
    const isDanger = signalWord.toUpperCase().includes('PELIGRO');
    const defaultH = pictos.map((p) => p?.defaultH).filter(Boolean).join(' ');
    const defaultP = pictos.map((p) => p?.defaultP).filter(Boolean).join(' ');
    const frasesH = prod.frases_h || defaultH || 'Consultar Sección 2 de la Ficha de Datos de Seguridad (FDS).';
    const consejosP = prod.consejos_p || defaultP || 'P280: Usar guantes, ropa de protección y equipo de protección para los ojos y la cara.';

    // Cruces incompatibles con otros químicos de la matriz actual
    const incompatCrosses = matrixRows
      .filter((other) => other.id !== prod.id && other.nombre && other.nombre !== prod.nombre)
      .map((other) => ({
        other,
        compat: getChemicalCompatibility(prod.clasificacion_onu, other.clasificacion_onu),
      }))
      .filter((x) => x.compat.status === 'incompatible' || x.compat.status === 'caution');

    const pictosHtml = pictos.length > 0
      ? pictos
          .map(
            (p) => `
          <div style="display:inline-flex;flex-direction:column;align-items:center;margin:6px 10px;">
            <div style="width:74px;height:74px;background:#fff;border:2px solid #dc2626;border-radius:10px;padding:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(220,38,38,0.15);">
              <img src="${p!.svgUrl}" alt="${p!.name}" style="width:62px;height:62px;object-fit:contain;" />
            </div>
            <span style="font-size:10px;font-weight:800;color:#991b1b;margin-top:4px;text-transform:uppercase;">${p!.ghsCode} · ${p!.name}</span>
          </div>`
          )
          .join('')
      : '<div style="font-size:12px;color:#64748b;font-style:italic;">Sin pictogramas SGA asignados</div>';

    return `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:850px;margin:0 auto;border:3px solid #dc2626;border-radius:14px;overflow:hidden;background:#ffffff;color:#1e293b;">
        <div style="background:linear-gradient(90deg,#b91c1c,#dc2626);color:#ffffff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;">SISTEMA GLOBALMENTE ARMONIZADO (SGA) • DECRETO 1496 DE 2018 • RES. 773 DE 2021</div>
            <div style="font-size:20px;font-weight:900;margin-top:2px;text-transform:uppercase;">TARJETA DEL PRODUCTO QUÍMICO Y RÓTULO SGA</div>
          </div>
          <div style="background:#ffffff;color:${isDanger ? '#dc2626' : '#d97706'};padding:6px 16px;border-radius:8px;font-size:16px;font-weight:900;letter-spacing:1px;border:2px solid #ffffff;">
            ${signalWord}
          </div>
        </div>

        <div style="padding:20px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
            <tr>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:700;width:22%;">NOMBRE DEL PRODUCTO:</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;font-weight:900;font-size:15px;color:#0f172a;" colspan="3">${prod.nombre || 'SIN NOMBRE'}</td>
            </tr>
            <tr>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:700;">FABRICANTE / PROVEEDOR:</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;">${prod.fabricante || 'No especificado'}</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:700;width:20%;">CLASE PELIGRO ONU:</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;font-weight:700;color:#b91c1c;">${prod.clasificacion_onu || 'No Peligroso'}</td>
            </tr>
            <tr>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:700;">NÚMERO ONU / CAS:</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;">${prod.numero_onu || 'N/A'} / CAS: ${prod.cas || 'N/A'}</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:700;">ESTADO FÍSICO / CANTIDAD:</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;">${prod.estado_fisico || 'Líquido'} (${prod.cantidad_almacenada || 'N/A'})</td>
            </tr>
            <tr>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:700;">UBICACIÓN EN PLANTA:</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;">${prod.ubicacion || 'Almacén General'}</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:700;">CONFORMIDAD FDS / RÓTULO:</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;">FDS 16 Secc: <strong>${prod.tiene_fds}</strong> | Rótulo SGA: <strong>${prod.tiene_rotulo}</strong></td>
            </tr>
          </table>

          <div style="text-align:center;padding:12px;background:#fff5f5;border:2px dashed #fca5a5;border-radius:10px;margin-bottom:16px;">
            <div style="font-size:11px;font-weight:800;color:#991b1b;text-transform:uppercase;margin-bottom:6px;">PICTOGRAMAS OFICIALES SGA (NACIONES UNIDAS / API PUBCHEM NIH)</div>
            ${pictosHtml}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:8px;padding:10px;">
              <div style="font-size:11px;font-weight:800;color:#991b1b;text-transform:uppercase;margin-bottom:4px;">INDICACIONES DE PELIGRO (FRASES H)</div>
              <div style="font-size:12px;line-height:1.45;">${frasesH}</div>
            </div>
            <div style="border:1px solid #bae6fd;background:#f0f9ff;border-radius:8px;padding:10px;">
              <div style="font-size:11px;font-weight:800;color:#0369a1;text-transform:uppercase;margin-bottom:4px;">CONSEJOS DE PRUDENCIA (CONSEJOS P)</div>
              <div style="font-size:12px;line-height:1.45;">${consejosP}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:8px;padding:10px;">
              <div style="font-size:11px;font-weight:800;color:#c2410c;text-transform:uppercase;margin-bottom:4px;">INCOMPATIBILIDADES QUÍMICAS Y REACTIVIDAD</div>
              <div style="font-size:12px;line-height:1.45;">${prod.incompatibilidades || 'Verificar Sección 10 de la FDS.'}</div>
            </div>
            <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;padding:10px;">
              <div style="font-size:11px;font-weight:800;color:#15803d;text-transform:uppercase;margin-bottom:4px;">ALMACENAMIENTO SEGURO Y SEGREGACIÓN (NTC 3966)</div>
              <div style="font-size:12px;line-height:1.45;">${prod.requisitos_almacenamiento || 'Almacenar en área ventilada con dique de contención.'}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
            <div style="border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:10px;">
              <div style="font-size:10px;font-weight:800;color:#0f766e;text-transform:uppercase;margin-bottom:4px;">EPP OBLIGATORIO</div>
              <div style="font-size:11px;line-height:1.4;">${prod.epp_recomendado || 'Guantes resistentes a químicos, gafas de seguridad con protección lateral y protección respiratoria según FDS.'}</div>
            </div>
            <div style="border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:10px;">
              <div style="font-size:10px;font-weight:800;color:#b91c1c;text-transform:uppercase;margin-bottom:4px;">PRIMEROS AUXILIOS</div>
              <div style="font-size:11px;line-height:1.4;">${prod.primeros_auxilios || 'Ojos/Piel: Lavar con abundante agua durante 15 min en ducha/lavaojos. Inhalación: Aire fresco. Acudir al médico con la FDS.'}</div>
            </div>
            <div style="border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:10px;">
              <div style="font-size:10px;font-weight:800;color:#4338ca;text-transform:uppercase;margin-bottom:4px;">CONTROL DE DERRAMES</div>
              <div style="font-size:11px;line-height:1.4;">${prod.control_derrames || 'Aislar el área, contener con kit antiderrame absorbente inerte y disponer como residuo peligroso.'}</div>
            </div>
          </div>

          ${
            incompatCrosses.length > 0
              ? `<div style="border:1px solid #fecaca;background:#fff1f2;border-radius:8px;padding:10px;margin-top:8px;">
                  <div style="font-size:11px;font-weight:800;color:#be123c;text-transform:uppercase;margin-bottom:4px;">ALERTAS DE SEGREGACIÓN CON OTROS PRODUCTOS DE LA EMPRESA (${incompatCrosses.length})</div>
                  <ul style="margin:0;padding-left:18px;font-size:11px;color:#881337;">
                    ${incompatCrosses
                      .map(
                        (c) =>
                          `<li><strong>${c.other.nombre}</strong> (${c.other.clasificacion_onu}): <strong>${
                            c.compat.status === 'incompatible' ? 'INCOMPATIBLE - SEGREGAR' : 'PRECAUCIÓN'
                          }</strong> — ${c.compat.recommendation}</li>`
                      )
                      .join('')}
                  </ul>
                </div>`
              : ''
          }
        </div>
      </div>
    `;
  };

  const handlePrintProductCard = (prod: MatrixRow) => {
    const html = buildProductSgaCardHtml(prod);
    const win = window.open('', '_blank', 'width=950,height=800');
    if (!win) {
      showToast({ message: 'Permite las ventanas emergentes para imprimir la Tarjeta SGA.', status: 'warning' });
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tarjeta SGA - ${prod.nombre || 'Producto Químico'}</title>
          <style>
            body { margin: 20px; background: #fff; }
            @media print {
              body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${html}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleSendCardToEditor = async (prod: MatrixRow) => {
    const cardHtml = buildProductSgaCardHtml(prod);
    const nextReport = reportContent ? `${reportContent}<hr style="margin:28px 0;border:0;border-top:2px dashed #cbd5e1;" />${cardHtml}` : cardHtml;
    setReportContent(nextReport);
    editorRef.current?.setHTML(nextReport);
    if (!isOfficialApp) {
      setActiveTab('reporte');
    }
    await saveMatrix(matrixRows, false, nextReport);
    setSelectedProductCardIdx(null);
    showToast({ message: `Tarjeta SGA de "${prod.nombre}" enviada al Editor en Vivo.`, status: 'success' });
  };

  // Eliminar fila
  const deleteRow = (idx: number) => {
    const updated = matrixRows.filter((_, i) => i !== idx);
    setMatrixRows(updated);
    saveMatrix(updated, false);
  };

  // Modificar valor en celda
  const handleCellChange = (idx: number, field: keyof MatrixRow, val: any) => {
    const updated = [...matrixRows];
    updated[idx] = { ...updated[idx], [field]: val };
    setMatrixRows(updated);
  };

  // Completar fila con IA
  const handleAiUpdateRow = async (idx: number) => {
    const row = matrixRows[idx];
    if (!row.nombre) {
      showToast({ message: 'Escribe primero el nombre del producto.', status: 'warning' });
      return;
    }
    setAiRowLoading(idx);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/ai-update-row', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ row, modelName: selectedModel })
      });
      if (res.ok) {
        const data = await res.json();
        const updated = [...matrixRows];
        updated[idx] = { ...updated[idx], ...data.updatedFields };
        setMatrixRows(updated);
        saveMatrix(updated, false);
        showToast({ message: 'Producto completado exitosamente con IA.', status: 'success' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al completar con IA.', status: 'error' });
    } finally {
      setAiRowLoading(null);
    }
  };

  // Generar reporte IA completo
  const handleAnalyzeMatrix = async () => {
    if (matrixRows.length === 0) {
      showToast({ message: 'El inventario está vacío.', status: 'warning' });
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/ai-analyze-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ matrixRows, modelName: selectedModel, conversationId })
      });
      if (res.ok) {
        const data = await res.json();
        setReportContent(data.analysis);
        if (!isOfficialApp) {
          setActiveTab('reporte');
        }
        showToast({ message: 'Auditoría técnica de compatibilidad química generada con éxito.', status: 'success' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al generar auditoría.', status: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Guardar conclusiones del dashboard
  const handleConclusionSaved = (type: string, text: string) => {
    setChartConclusions(prev => ({ ...prev, [type]: text }));
  };

  // Manejo de Excel Import
  const triggerExcelImport = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmColumnMapping = (mappedRows: any[]) => {
    const mapped: MatrixRow[] = mappedRows
      .map((r: any) => {
        let estado_fisico: 'Líquido' | 'Sólido' | 'Gas' = 'Líquido';
        const rawEst = String(r.estado_fisico || '').toLowerCase();
        if (rawEst.includes('solid') || rawEst.includes('sólid')) estado_fisico = 'Sólido';
        else if (rawEst.includes('gas')) estado_fisico = 'Gas';

        let clasificacion_onu = String(r.clasificacion_onu || 'No Peligroso').trim();
        const matchedClase = CLASES_ONU.find(
          (c) =>
            c.toLowerCase().includes(clasificacion_onu.toLowerCase()) ||
            clasificacion_onu.toLowerCase().includes(c.toLowerCase()),
        );
        if (matchedClase) clasificacion_onu = matchedClase;

        let pictogramas: string[] = [];
        const rawPics = r.pictogramas_sga || '';
        if (Array.isArray(rawPics)) {
          pictogramas = rawPics;
        } else if (typeof rawPics === 'string') {
          pictogramas = rawPics
            .split(/[,;\s]+/)
            .map((p: string) => p.trim().toLowerCase())
            .filter(Boolean);
        }

        const rawFds = String(r.tiene_fds || '').toLowerCase();
        const tiene_fds: 'Sí' | 'No' =
          rawFds.includes('si') ||
          rawFds.includes('sí') ||
          rawFds.includes('yes') ||
          rawFds === 'true'
            ? 'Sí'
            : 'No';

        const rawRot = String(r.tiene_rotulo || '').toLowerCase();
        const tiene_rotulo: 'Sí' | 'No' =
          rawRot.includes('si') ||
          rawRot.includes('sí') ||
          rawRot.includes('yes') ||
          rawRot === 'true'
            ? 'Sí'
            : 'No';

        return {
          id: r.id || 'chem-' + Date.now().toString() + Math.random().toString(36).substring(7),
          nombre: String(r.nombre || '').trim(),
          fabricante: String(r.fabricante || 'Desconocido').trim(),
          estado_fisico,
          clasificacion_onu,
          pictogramas_sga: pictogramas,
          cantidad_almacenada: String(r.cantidad_almacenada || '1 Unidad').trim(),
          ubicacion: String(r.ubicacion || 'Bodega General').trim(),
          tiene_fds,
          tiene_rotulo,
          incompatibilidades: String(r.incompatibilidades || 'Ninguna').trim(),
          requisitos_almacenamiento: String(r.requisitos_almacenamiento || 'Ninguno').trim(),
        };
      })
      .filter((r) => r.nombre);

    if (mapped.length === 0) {
      showToast({
        message: 'No se encontraron registros químicos válidos para importar.',
        status: 'warning',
      });
      return;
    }

    let combined = mapped;
    let actualizados = 0;
    let nuevos = 0;

    if (matrixRows.length > 0) {
      const shouldReplace = window.confirm(
        `Ya existen ${matrixRows.length} productos en el inventario químico.\n\n¿Deseas REEMPLAZAR todo el inventario con las ${mapped.length} nuevas sustancias?\n\n• Aceptar: Reemplazar completamente.\n• Cancelar: Actualizar productos existentes y agregar los nuevos sin duplicar.`,
      );
      if (shouldReplace) {
        combined = mapped;
        nuevos = mapped.length;
      } else {
        const list = [...matrixRows];
        mapped.forEach((newChem) => {
          const chemName = newChem.nombre.trim().toLowerCase();
          const existingIdx = list.findIndex((c) => c.nombre.trim().toLowerCase() === chemName);
          if (existingIdx >= 0) {
            const existing = list[existingIdx];
            list[existingIdx] = {
              ...existing,
              ...newChem,
              id: existing.id, // preserve id
            };
            actualizados++;
          } else {
            list.push(newChem);
            nuevos++;
          }
        });
        combined = list;
      }
    } else {
      nuevos = mapped.length;
    }

    setMatrixRows(combined);
    saveMatrix(combined, false);
    setIsColumnMapperOpen(false);
    setColumnMapperBuffer(null);
    showToast({
      message: `¡${mapped.length} productos químicos procesados con el Homologador Visual (${actualizados} actualizados, ${nuevos} nuevos)!`,
      status: 'success',
    });
  };

  const handleDirectImport = () => {
    setIsConfirmModalOpen(false);
    let rowsToImport = pendingDirectRows;
    if (!rowsToImport || rowsToImport.length === 0) {
      rowsToImport = pendingRawRows
        .map((r: any) => ({
          id: 'chem-' + Date.now().toString() + Math.random().toString(36).substring(7),
          nombre: String(r.nombre || r['Nombre del Producto'] || r['Producto'] || '').trim(),
          fabricante: String(r.fabricante || r['Fabricante / Proveedor'] || 'Desconocido').trim(),
          estado_fisico: 'Líquido' as const,
          clasificacion_onu: String(r.clasificacion_onu || r['Clase de Peligro ONU'] || 'No Peligroso').trim(),
          pictogramas_sga: [],
          cantidad_almacenada: String(r.cantidad_almacenada || '1 Unidad').trim(),
          ubicacion: String(r.ubicacion || 'Bodega General').trim(),
          tiene_fds: 'Sí' as const,
          tiene_rotulo: 'Sí' as const,
          incompatibilidades: 'Ninguna',
          requisitos_almacenamiento: 'Ninguno',
        }))
        .filter((r: any) => r.nombre);
    }

    if (rowsToImport.length === 0) {
      showToast({ message: 'No hay filas válidas para importar directamente.', status: 'warning' });
      return;
    }

    let combined = rowsToImport;
    if (matrixRows.length > 0) {
      const shouldReplace = window.confirm(
        `Ya existen ${matrixRows.length} productos en el inventario químico.\n\n¿Deseas REEMPLAZAR todo el inventario con los ${rowsToImport.length} nuevos registros?\n\n(Aceptar: Reemplazar / Cancelar: Anexar al final)`,
      );
      combined = shouldReplace ? rowsToImport : [...matrixRows, ...rowsToImport];
    }

    setMatrixRows(combined);
    saveMatrix(combined, false);
    showToast({
      message: `¡Se importaron ${rowsToImport.length} productos químicos directamente!`,
      status: 'success',
    });
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) return;
        setColumnMapperBuffer(buffer);

        let rawJson: any[] = [];
        if (file.name.endsWith('.json')) {
          const text = new TextDecoder('utf-8').decode(buffer);
          const parsed = JSON.parse(text);
          rawJson = Array.isArray(parsed) ? parsed : (parsed.data || parsed.rows || [parsed]);
        } else {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          rawJson = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
        }

        if (rawJson.length === 0) {
          showToast({ message: 'El archivo está vacío.', status: 'warning' });
          return;
        }

        const directMapped: MatrixRow[] = rawJson
          .map((r: any) => {
            const nombre = String(
              r.nombre ||
                r['Nombre del Producto'] ||
                r['Producto'] ||
                r['nombre_comercial'] ||
                r['Sustancia'] ||
                '',
            ).trim();
            const fabricante = String(
              r.fabricante ||
                r['Fabricante / Proveedor'] ||
                r['Proveedor'] ||
                r['Fabricante'] ||
                'Desconocido',
            ).trim();

            let estado_fisico: 'Líquido' | 'Sólido' | 'Gas' = 'Líquido';
            const rawEst = String(
              r.estado_fisico || r['Estado Físico'] || r['Estado'] || '',
            ).toLowerCase();
            if (rawEst.includes('solid') || rawEst.includes('sólid')) estado_fisico = 'Sólido';
            else if (rawEst.includes('gas')) estado_fisico = 'Gas';

            let clasificacion_onu = String(
              r.clasificacion_onu ||
                r['Clase de Peligro ONU'] ||
                r['Clase de Peligro'] ||
                r['Clase ONU'] ||
                r['Clase'] ||
                'No Peligroso',
            ).trim();
            const matchedClase = CLASES_ONU.find(
              (c) =>
                c.toLowerCase().includes(clasificacion_onu.toLowerCase()) ||
                clasificacion_onu.toLowerCase().includes(c.toLowerCase()),
            );
            if (matchedClase) clasificacion_onu = matchedClase;

            let pictogramas: string[] = [];
            const rawPics =
              r.pictogramas_sga || r['Pictogramas SGA'] || r['Pictogramas'] || '';
            if (Array.isArray(rawPics)) {
              pictogramas = rawPics;
            } else if (typeof rawPics === 'string') {
              pictogramas = rawPics
                .split(/[,;\s]+/)
                .map((p) => p.trim().toLowerCase())
                .filter(Boolean);
            }

            const cantidad = String(
              r.cantidad_almacenada ||
                r['Cantidad Almacenada'] ||
                r['Cantidad'] ||
                '',
            ).trim();
            const ubicacion = String(
              r.ubicacion ||
                r['Ubicación en Almacén'] ||
                r['Ubicación'] ||
                r['Ubicacion'] ||
                'Bodega General',
            ).trim();

            const rawFds = String(
              r.tiene_fds || r['¿Tiene FDS?'] || r['FDS'] || '',
            ).toLowerCase();
            const tiene_fds: 'Sí' | 'No' =
              rawFds.includes('si') ||
              rawFds.includes('sí') ||
              rawFds.includes('yes') ||
              rawFds === 'true'
                ? 'Sí'
                : 'No';

            const rawRot = String(
              r.tiene_rotulo || r['¿Tiene Rótulo SGA?'] || r['¿Tiene Rotulo?'] || r['Rótulo'] || r['Rotulo'] || '',
            ).toLowerCase();
            const tiene_rotulo: 'Sí' | 'No' =
              rawRot.includes('si') ||
              rawRot.includes('sí') ||
              rawRot.includes('yes') ||
              rawRot === 'true'
                ? 'Sí'
                : 'No';

            const incomp = String(
              r.incompatibilidades ||
                r['Incompatibilidades'] ||
                r['Sustancias Incompatibles'] ||
                'Ninguna',
            ).trim();
            const reqAlm = String(
              r.requisitos_almacenamiento ||
                r['Requisitos de Almacenamiento'] ||
                r['Almacenamiento'] ||
                'Ninguno',
            ).trim();

            return {
              id:
                r.id ||
                'chem-' + Date.now().toString() + Math.random().toString(36).substring(7),
              nombre: nombre || '',
              fabricante,
              estado_fisico,
              clasificacion_onu,
              pictogramas_sga: pictogramas,
              cantidad_almacenada: cantidad || '1 Unidad',
              ubicacion,
              tiene_fds,
              tiene_rotulo,
              incompatibilidades: incomp,
              requisitos_almacenamiento: reqAlm,
            };
          })
          .filter((r) => r.nombre);

        setPendingDirectRows(directMapped);
        setPendingRawRows(rawJson);
        setIsConfirmModalOpen(true);
      } catch (err) {
        console.error(err);
        showToast({ message: 'Error leyendo el archivo Excel.', status: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmAiImport = async () => {
    setIsConfirmModalOpen(false);
    setIsAiImportLoading(true);
    try {
      const res = await fetch('/api/sgsst/chemical-compatibility/ai-parse-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rawRows: pendingRawRows, modelName: selectedModel })
      });
      if (res.ok) {
        const data = await res.json();
        const merged = [...matrixRows, ...data.matrixRows];
        setMatrixRows(merged);
        saveMatrix(merged, false);
        showToast({ message: `Importados ${data.matrixRows.length} productos químicos con IA.`, status: 'success' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al parsear archivo con IA.', status: 'error' });
    } finally {
      setIsAiImportLoading(false);
      setPendingRawRows([]);
    }
  };

  // Manejo de Excel Export
  const handleExportExcel = async () => {
    try {
      await exportCompatibilidadToExcel(matrixRows);
      showToast({ message: 'Excel exportado exitosamente.', status: 'success' });
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error exportando Excel.', status: 'error' });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await exportCompatibilidadToExcel([]);
      showToast({ message: 'Plantilla de Compatibilidad Química descargada exitosamente.', status: 'success' });
    } catch (e) {
      console.error(e);
      showToast({ message: 'Error al descargar la plantilla Excel.', status: 'error' });
    }
  };

  // Paginación
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return matrixRows.slice(start, start + pageSize);
  }, [matrixRows, currentPage, pageSize]);

  // ── SUB-RENDER: Tabla de Inventario ──
  const renderInventoryTable = () => (
    <div className="flex flex-col flex-1 gap-4">
      {matrixRows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-text-secondary py-12">
          <AlertTriangle className="h-12 w-12 opacity-30 text-teal-500 animate-bounce" />
          <p className="text-center text-sm font-semibold max-w-md">
            Aún no hay productos en el inventario químico. Agrégalos manualmente, sincronízalos desde el Hito 5 o pídele al agente en el chat que los documente.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={addRow}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Añadir Producto Químico
            </button>
            <button
              onClick={handleSyncFromHito5}
              disabled={isSyncingHito5}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              {isSyncingHito5 ? <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> : <RefreshCw className="h-4 w-4 text-teal-600" />}
              <span>Traer Inventario del Hito 5</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border-medium bg-surface-primary shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border-medium bg-surface-secondary font-bold text-text-secondary uppercase">
                  <th className="px-3 py-3 min-w-[180px]">Nombre del Producto</th>
                  <th className="px-3 py-3 min-w-[140px]">Fabricante</th>
                  <th className="px-3 py-3 min-w-[100px]">Estado</th>
                  <th className="px-3 py-3 min-w-[210px]">Clase ONU Peligro</th>
                  <th className="px-3 py-3 min-w-[180px]">SGA Pictogramas</th>
                  <th className="px-3 py-3 min-w-[110px]">Cant. Almacenada</th>
                  <th className="px-3 py-3 min-w-[140px]">Ubicación</th>
                  <th className="px-3 py-3 min-w-[75px] text-center">FDS</th>
                  <th className="px-3 py-3 min-w-[75px] text-center">Rótulo</th>
                  <th className="px-3 py-3 min-w-[200px]">Incompatibilidades</th>
                  <th className="px-3 py-3 min-w-[220px]">Requisitos Almacenamiento</th>
                  <th className="px-3 py-3 text-center min-w-[110px]">IA / Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-medium">
                {paginatedRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.nombre}
                        onChange={(e) => handleCellChange(idx, 'nombre', e.target.value)}
                        placeholder="Ej. Hipoclorito de Sodio"
                        className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs font-semibold text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.fabricante}
                        onChange={(e) => handleCellChange(idx, 'fabricante', e.target.value)}
                        className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <DropdownSelect
                        value={row.estado_fisico}
                        onChange={(v) => handleCellChange(idx, 'estado_fisico', v)}
                        options={ESTADO_OPCIONES}
                        placeholder="Estado"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <DropdownSelect
                        value={row.clasificacion_onu}
                        onChange={(v) => handleCellChange(idx, 'clasificacion_onu', v)}
                        options={CLASES_ONU}
                        placeholder="Clase ONU"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <PictogramsSelect
                        selected={row.pictogramas_sga || []}
                        onChange={(v) => handleCellChange(idx, 'pictogramas_sga', v)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.cantidad_almacenada}
                        onChange={(e) => handleCellChange(idx, 'cantidad_almacenada', e.target.value)}
                        placeholder="Ej. 10 Gal"
                        className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.ubicacion}
                        onChange={(e) => handleCellChange(idx, 'ubicacion', e.target.value)}
                        placeholder="Ej. Bodega Principal"
                        className="w-full rounded-xl border-border-medium bg-transparent px-2.5 py-1 text-xs text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={row.tiene_fds}
                        onChange={(e) => handleCellChange(idx, 'tiene_fds', e.target.value)}
                        className={`rounded-xl border-border-medium bg-transparent py-1 text-xs font-bold focus:border-teal-500 focus:ring-0 ${
                          row.tiene_fds === 'No' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={row.tiene_rotulo}
                        onChange={(e) => handleCellChange(idx, 'tiene_rotulo', e.target.value)}
                        className={`rounded-xl border-border-medium bg-transparent py-1 text-xs font-bold focus:border-teal-500 focus:ring-0 ${
                          row.tiene_rotulo === 'No' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        rows={2}
                        value={row.incompatibilidades || ''}
                        onChange={(e) => handleCellChange(idx, 'incompatibilidades', e.target.value)}
                        placeholder="Ej. Ácidos fuertes, inflamables"
                        className="w-full rounded-xl border border-border-medium bg-transparent px-2 py-1 text-[11px] text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        rows={2}
                        value={row.requisitos_almacenamiento || ''}
                        onChange={(e) => handleCellChange(idx, 'requisitos_almacenamiento', e.target.value)}
                        placeholder="Ej. Dique de contención, ventilación"
                        className="w-full rounded-xl border border-border-medium bg-transparent px-2 py-1 text-[11px] text-text-primary focus:border-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedProductCardIdx(idx)}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 transition-all duration-300 px-1.5 shadow-sm active:scale-95"
                          title="Crear / Ver Tarjeta del Producto Químico y Rótulo SGA (Decreto 1496/2018)"
                        >
                          <Tag className="h-3.5 w-3.5 shrink-0" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Tarjeta SGA</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAiUpdateRow(idx)}
                          disabled={aiRowLoading === idx}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100 transition-all duration-300 px-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                          title="Autocompletar producto químico con API PubChem + IA (ONU, Pictogramas SGA, Frases H/P)"
                        >
                          {aiRowLoading === idx ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">IA</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(idx)}
                          className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all duration-300 px-1.5 shadow-sm active:scale-95"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" />
                          <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[80px] group-hover:opacity-100 sm:flex">
                            <span className="text-[10px] font-bold">Borrar</span>
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" /> Añadir Producto Químico
              </button>
              <button
                type="button"
                onClick={addRowAndOpenCard}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-95"
              >
                <Tag className="h-4 w-4" /> Montar Producto con Tarjeta SGA (API PubChem + IA)
              </button>
            </div>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Total sustancias registradas: <strong>{matrixRows.length}</strong>
            </span>
          </div>
        </>
      )}
    </div>
  );

  // ── SUB-RENDER: Cuadrícula Cruzada de Compatibilidad ──
  const renderCrossMatrixGrid = () => (
    <div className="flex flex-col gap-5 relative">
      <div className="rounded-2xl border border-border-medium bg-surface-primary p-4 shadow-sm">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Info className="h-4 w-4 text-teal-600" /> Cuadrícula de Compatibilidad Química (NTC 3966 / SGA)
        </h3>
        <p className="mt-1 text-xs text-text-secondary">
          Cruza cada producto del inventario para evaluar la seguridad de almacenamiento conjunto. Haz clic en cualquier celda del semáforo para ver la justificación técnica y distancia de segregación recomendada.
        </p>
      </div>

      {matrixRows.length <= 1 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-text-secondary py-12">
          <AlertTriangle className="h-10 w-10 opacity-30 text-teal-500" />
          <p className="text-xs text-center">Registra al menos 2 productos en el inventario para construir la cuadrícula cruzada de compatibilidad.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="overflow-auto max-w-full rounded-2xl border border-border-medium bg-surface-primary shadow-sm p-4">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary text-center min-w-[130px] max-w-[180px] truncate">
                    Productos
                  </th>
                  {matrixRows.map(p => (
                    <th
                      key={p.id || p.nombre}
                      className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary text-center min-w-[100px] max-w-[150px] truncate"
                      title={`${p.nombre} (${p.clasificacion_onu})`}
                    >
                      {p.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((rowI) => (
                  <tr key={rowI.id || rowI.nombre}>
                    <td
                      className="border border-border-medium bg-surface-secondary p-3 text-xs font-bold text-text-primary truncate max-w-[180px]"
                      title={`${rowI.nombre} (${rowI.clasificacion_onu})`}
                    >
                      {rowI.nombre}
                    </td>
                    {matrixRows.map((rowJ) => {
                      const compat = getChemicalCompatibility(rowI.clasificacion_onu, rowJ.clasificacion_onu);
                      let bgClass = 'bg-emerald-500 hover:bg-emerald-600';
                      if (compat.status === 'incompatible') bgClass = 'bg-red-500 hover:bg-red-600';
                      else if (compat.status === 'caution') bgClass = 'bg-amber-500 hover:bg-amber-600';

                      return (
                        <td key={rowJ.id || rowJ.nombre} className="border border-border-medium p-2 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCrossCell({ prodA: rowI, prodB: rowJ, result: compat })}
                            className={`mx-auto h-6 w-6 rounded-full ${bgClass} shadow-md transition-all hover:scale-110 flex items-center justify-center text-[10px] font-bold text-white`}
                            title={`${rowI.nombre} vs ${rowJ.nombre}: ${compat.status.toUpperCase()}`}
                          >
                            {compat.status === 'incompatible' ? 'X' : compat.status === 'caution' ? '!' : '✓'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-6 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-text-secondary font-semibold">Compatible (Almacenamiento conjunto permitido)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-text-secondary font-semibold">Precaución / Verificar FDS (Sección 7 y 10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-text-secondary font-semibold">Incompatible / Segregar estrictamente</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderImportModals = () => (
    <>
      <UniversalColumnMapperModal
        isOpen={isColumnMapperOpen}
        onClose={() => {
          setIsColumnMapperOpen(false);
          setColumnMapperBuffer(null);
        }}
        moduleKey="matriz-compatibilidad"
        moduleTitle="Matriz de Compatibilidad Química"
        targetFields={MATRIZ_COMPATIBILIDAD_FIELDS}
        fileData={columnMapperBuffer}
        onConfirmImport={handleConfirmColumnMapping}
      />

      {isAiImportLoading && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-teal-500/20 bg-surface-secondary/90 p-8 shadow-2xl">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-teal-500/40" />
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-text-primary">Adaptando Matriz Química con IA</h3>
              <p className="mt-2 text-sm text-text-secondary max-w-xs">
                Nuestra IA está mapeando las sustancias químicas, asignando clases ONU y analizando pictogramas SGA...
              </p>
            </div>
          </div>
        </div>
      )}

      <ImportMethodModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setPendingRawRows([]);
          setPendingDirectRows([]);
          setColumnMapperBuffer(null);
        }}
        rowsCount={pendingDirectRows.length || pendingRawRows.length || 0}
        hasColumnMapper={!!columnMapperBuffer}
        onSelectColumnMapper={() => {
          setIsConfirmModalOpen(false);
          setIsColumnMapperOpen(true);
        }}
        hasAi={true}
        onSelectAi={handleConfirmAiImport}
        onSelectDirect={handleDirectImport}
        moduleTitle="Compatibilidad Química"
        columnMapperDescription="Compara las columnas de tu Excel frente al estándar oficial de Compatibilidad Química y SGA (Decreto 1496/2018) en tiempo real. Previsualiza las filas, guarda plantillas y procesa cientos de productos al instante sin límites de IA."
        aiDescription="Identifica y clasifica automáticamente los productos según la clasificación ONU y pictogramas SGA, infiere incompatibilidades y formula los requisitos de almacenamiento con IA."
        directDescription="Mapea las columnas existentes exactamente como vienen en el archivo Excel de forma instantánea, sin intervención ni procesamiento de IA."
      />
    </>
  );

  const renderProductCardModal = () => {
    if (selectedProductCardIdx === null || !matrixRows[selectedProductCardIdx]) return null;
    const idx = selectedProductCardIdx;
    const prod = matrixRows[idx];
    const selectedPictos = Array.isArray(prod.pictogramas_sga) ? prod.pictogramas_sga : [];
    const resolvedPictos = selectedPictos.map((k) => findSgaPictogram(k)).filter(Boolean);
    const signalWord =
      prod.palabra_advertencia ||
      (resolvedPictos.some((p) => p?.signalWord === 'PELIGRO') ? 'PELIGRO' : 'ATENCIÓN');
    const isDanger = signalWord.toUpperCase().includes('PELIGRO');

    const toggleCardPictogram = (key: string) => {
      const next = selectedPictos.includes(key)
        ? selectedPictos.filter((k) => k !== key)
        : [...selectedPictos, key];
      handleCellChange(idx, 'pictogramas_sga', next);
      handleCellChange(idx, 'tiene_rotulo', 'Sí');
    };

    const incompatCrosses = matrixRows
      .filter((other, i) => i !== idx && other.nombre && other.nombre.trim() !== '')
      .map((other) => ({
        other,
        compat: getChemicalCompatibility(prod.clasificacion_onu, other.clasificacion_onu),
      }))
      .filter((x) => x.compat.status === 'incompatible' || x.compat.status === 'caution');

    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Oficial SGA */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-red-700 via-red-600 to-rose-600 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-red-100">
                  SGA Naciones Unidas • Decreto 1496 de 2018 • Res. 773 de 2021 • API PubChem NIH
                </div>
                <h3 className="text-base font-black tracking-tight">
                  Tarjeta del Producto Químico y Rótulo SGA
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase border-2 border-white shadow-sm ${
                  isDanger ? 'bg-white text-red-700' : 'bg-amber-300 text-slate-900'
                }`}
              >
                {signalWord}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProductCardIdx(null)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Barra de Autocompletado Rápido PubChem + IA */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/50">
              <div className="flex-1 min-w-[220px]">
                <label className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 block mb-1">
                  Nombre de la Sustancia o Producto Químico (Consulta directa a PubChem NIH + IA)
                </label>
                <input
                  type="text"
                  value={prod.nombre}
                  onChange={(e) => handleCellChange(idx, 'nombre', e.target.value)}
                  placeholder="Ej. Hipoclorito de sodio, Ácido sulfúrico, Acetona, Hidróxido de sodio..."
                  className="w-full rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-bold text-slate-900 dark:text-zinc-100 focus:border-orange-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAiUpdateRow(idx)}
                disabled={aiRowLoading === idx || !prod.nombre.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50"
              >
                {aiRowLoading === idx ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {aiRowLoading === idx
                    ? 'Consultando PubChem NIH + IA...'
                    : 'Autocompletar Tarjeta SGA (API PubChem + IA)'}
                </span>
              </button>
            </div>

            {/* Vista Previa Visual de Pictogramas Oficiales SGA (API PubChem NIH) */}
            <div className="rounded-2xl border-2 border-red-500/40 bg-red-50/30 dark:bg-red-950/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Pictogramas Oficiales SGA (Haz clic para activar/desactivar en el Rótulo)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Conectado a los pictogramas vectoriales oficiales GHS01–GHS09 de Naciones Unidas / PubChem NIH
                  </p>
                </div>
                {prod.pubchem_cid && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    ✓ Verificado PubChem CID #{prod.pubchem_cid}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {SGA_PICTOGRAMS.map((pic) => {
                  const isActive =
                    selectedPictos.includes(pic.key) || selectedPictos.includes(pic.name);
                  return (
                    <button
                      key={pic.key}
                      type="button"
                      onClick={() => toggleCardPictogram(pic.key)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${
                        isActive
                          ? 'bg-white dark:bg-zinc-800 border-2 border-red-600 shadow-md ring-2 ring-red-500/20'
                          : 'bg-white/60 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 opacity-55 hover:opacity-100'
                      }`}
                      title={`${pic.ghsCode}: ${pic.name} (${pic.signalWord})`}
                    >
                      <img
                        src={pic.svgUrl}
                        alt={pic.name}
                        className="w-11 h-11 object-contain bg-white rounded-md p-0.5"
                      />
                      <span className="text-[9px] font-black text-slate-800 dark:text-zinc-200 mt-1 text-center leading-tight">
                        {pic.name}
                      </span>
                      <span className="text-[8px] font-bold text-red-600 dark:text-red-400">
                        {pic.ghsCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Datos de Identificación y Clasificación ONU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Fabricante / Proveedor
                </label>
                <input
                  type="text"
                  value={prod.fabricante || ''}
                  onChange={(e) => handleCellChange(idx, 'fabricante', e.target.value)}
                  placeholder="Ej. Químicos S.A.S."
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Clase de Peligro ONU
                </label>
                <select
                  value={prod.clasificacion_onu}
                  onChange={(e) => handleCellChange(idx, 'clasificacion_onu', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100"
                >
                  {CLASES_ONU.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Número ONU / CAS
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={prod.numero_onu || ''}
                    onChange={(e) => handleCellChange(idx, 'numero_onu', e.target.value)}
                    placeholder="UN 1791"
                    className="w-1/2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={prod.cas || ''}
                    onChange={(e) => handleCellChange(idx, 'cas', e.target.value)}
                    placeholder="CAS 7681-52-9"
                    className="w-1/2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Palabra de Advertencia SGA
                </label>
                <select
                  value={signalWord}
                  onChange={(e) => handleCellChange(idx, 'palabra_advertencia', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400"
                >
                  <option value="PELIGRO">PELIGRO</option>
                  <option value="ATENCIÓN">ATENCIÓN</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Estado Físico
                </label>
                <select
                  value={prod.estado_fisico}
                  onChange={(e) => handleCellChange(idx, 'estado_fisico', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-100"
                >
                  {ESTADO_OPCIONES.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Cantidad Almacenada
                </label>
                <input
                  type="text"
                  value={prod.cantidad_almacenada || ''}
                  onChange={(e) => handleCellChange(idx, 'cantidad_almacenada', e.target.value)}
                  placeholder="Ej. 20 Galones"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Ubicación / Área en Planta
                </label>
                <input
                  type="text"
                  value={prod.ubicacion || ''}
                  onChange={(e) => handleCellChange(idx, 'ubicacion', e.target.value)}
                  placeholder="Ej. Bodega Central"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Frases H y Consejos P */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 block mb-1">
                  Indicaciones de Peligro (Frases H - SGA)
                </label>
                <textarea
                  rows={2}
                  value={
                    prod.frases_h ??
                    resolvedPictos.map((p) => p?.defaultH).filter(Boolean).join(' ')
                  }
                  onChange={(e) => handleCellChange(idx, 'frases_h', e.target.value)}
                  placeholder="Ej. H314: Provoca quemaduras graves en la piel y lesiones oculares graves."
                  className="w-full rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 p-2.5 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-400 block mb-1">
                  Consejos de Prudencia (Consejos P - SGA)
                </label>
                <textarea
                  rows={2}
                  value={
                    prod.consejos_p ??
                    resolvedPictos.map((p) => p?.defaultP).filter(Boolean).join(' ')
                  }
                  onChange={(e) => handleCellChange(idx, 'consejos_p', e.target.value)}
                  placeholder="Ej. P280: Usar guantes, ropa de protección y equipo de protección ocular."
                  className="w-full rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/30 dark:bg-sky-950/10 p-2.5 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Incompatibilidades y Almacenamiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block mb-1">
                  Incompatibilidades Químicas (Sección 10 FDS)
                </label>
                <textarea
                  rows={2}
                  value={prod.incompatibilidades || ''}
                  onChange={(e) => handleCellChange(idx, 'incompatibilidades', e.target.value)}
                  placeholder="Sustancias con las que no debe mezclarse ni almacenarse cerca..."
                  className="w-full rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 p-2.5 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block mb-1">
                  Requisitos de Almacenamiento Seguro (NTC 3966)
                </label>
                <textarea
                  rows={2}
                  value={prod.requisitos_almacenamiento || ''}
                  onChange={(e) => handleCellChange(idx, 'requisitos_almacenamiento', e.target.value)}
                  placeholder="Condiciones de ventilación, dique de contención, gabinete..."
                  className="w-full rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10 p-2.5 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* EPP, Primeros Auxilios y Control de Derrames */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-400 block mb-1">
                  EPP Recomendado
                </label>
                <textarea
                  rows={2}
                  value={prod.epp_recomendado || ''}
                  onChange={(e) => handleCellChange(idx, 'epp_recomendado', e.target.value)}
                  placeholder="Guantes de nitrilo, monogafas, respirador..."
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 p-2 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block mb-1">
                  Primeros Auxilios de Emergencia
                </label>
                <textarea
                  rows={2}
                  value={prod.primeros_auxilios || ''}
                  onChange={(e) => handleCellChange(idx, 'primeros_auxilios', e.target.value)}
                  placeholder="Actuación ante contacto ocular, dérmico o inhalación..."
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 p-2 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400 block mb-1">
                  Control de Derrames e Incendios
                </label>
                <textarea
                  rows={2}
                  value={prod.control_derrames || ''}
                  onChange={(e) => handleCellChange(idx, 'control_derrames', e.target.value)}
                  placeholder="Kit antiderrames, agente extintor..."
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 p-2 text-xs text-slate-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Alertas Automáticas de Cruce de Incompatibilidad con el resto de la Matriz */}
            {incompatCrosses.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60">
                <div className="text-[11px] font-black uppercase text-rose-700 dark:text-rose-300 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Alertas de Segregación Detectadas en la Matriz Actual ({incompatCrosses.length})
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {incompatCrosses.map((item, cIdx) => (
                    <div key={cIdx} className="text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black text-white shrink-0 mt-0.5 ${
                          item.compat.status === 'incompatible' ? 'bg-red-600' : 'bg-amber-500'
                        }`}
                      >
                        {item.compat.status === 'incompatible' ? 'INCOMPATIBLE' : 'PRECAUCIÓN'}
                      </span>
                      <span>
                        Con <strong>{item.other.nombre}</strong> ({item.other.clasificacion_onu}):{' '}
                        {item.compat.recommendation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Botonera WAPPY */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrintProductCard(prod)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
              >
                <Printer className="w-4 h-4 text-teal-600" />
                <span>Imprimir / PDF Tarjeta SGA</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendCardToEditor(prod)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
              >
                <FileTextIcon className="w-4 h-4 text-purple-600" />
                <span>Enviar al Editor en Vivo</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const updated = [...matrixRows];
                  updated[idx] = { ...updated[idx], tiene_rotulo: 'Sí' };
                  setMatrixRows(updated);
                  await saveMatrix(updated, true);
                  setSelectedProductCardIdx(null);
                }}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Guardar Producto y Tarjeta SGA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── MODO APLICATIVO OFICIAL (HITO 1) ──
  if (isOfficialApp) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Input oculto para importar Excel */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleExcelFileChange}
          accept=".xlsx,.xls,.json,.csv"
          className="hidden"
        />

        {/* 1. Barra de Herramientas Flotante Cápsula (SGSSTToolbar) */}
        <SGSSTToolbar
          onHistory={() => setShowHistory(true)}
          isHistoryOpen={showHistory}
          onAnalyze={handleAnalyzeMatrix}
          isAnalyzing={isAnalyzing}
          analyzeLabel="Auditar Matriz Química con IA"
          aiButtons={[
            {
              id: 'btn-mount-sga-card',
              label: 'Montar Producto con Tarjeta SGA (PubChem + IA)',
              onClick: addRowAndOpenCard,
              icon: Tag,
            },
            {
              id: 'btn-sync-hito5',
              label: 'Traer Inventario Químico del Hito 5',
              onClick: handleSyncFromHito5,
              isLoading: isSyncingHito5,
              icon: RefreshCw,
            },
            {
              id: 'btn-sync-kanban',
              label: 'Sincronizar Controles SGA con Centro de Control',
              onClick: handleSyncControlesQuimicos,
              isLoading: isSyncingKanban,
              icon: CheckSquare,
            },
          ]}
          onSaveLocal={() => saveMatrix(matrixRows, true)}
          isSaving={isSaving}
          onImportExcel={triggerExcelImport}
          onExportExcel={handleExportExcel}
          onDownloadTemplate={handleDownloadTemplate}
          onDummy={handleFillDummy}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          hasContent={!!reportContent || matrixRows.length > 0}
          exportContent={reportContent || ''}
          exportFileName={`Auditoria_Compatibilidad_Quimica_${new Date().toISOString().slice(0, 10)}`}
        />

        {/* 2. Tarjeta Colapsable: Inventario y Cuadrícula Cruzada */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Beaker className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  Inventario y Matriz Cruzada de Compatibilidad Química (SGA / NTC 3966)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {matrixRows.length} sustancias químicas evaluadas • Decreto 1496 de 2018
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Selector de vista interna: Inventario vs Cuadrícula Cruzada */}
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => {
                    setOfficialSubView('inventario');
                    setIsTableCollapsed(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    officialSubView === 'inventario'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Beaker className="w-3.5 h-3.5" />
                  <span>Inventario SGA ({matrixRows.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOfficialSubView('matriz_cruzada');
                    setIsTableCollapsed(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    officialSubView === 'matriz_cruzada'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Cuadrícula Cruzada</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 transition-all"
                title={isTableCollapsed ? 'Expandir sección' : 'Contraer sección'}
              >
                {isTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isTableCollapsed && (
            <div className="p-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  <span className="text-xs font-semibold">Cargando Matriz de Compatibilidad Química...</span>
                </div>
              ) : officialSubView === 'inventario' ? (
                renderInventoryTable()
              ) : (
                renderCrossMatrixGrid()
              )}
            </div>
          )}
        </div>

        {/* 3. Tarjeta Colapsable: Dashboard y Analítica Química */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  Dashboard Analítico de Riesgo Químico y Almacenamiento
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Distribución por Clase ONU, Pictogramas SGA, Cumplimiento FDS/Rótulo y Semáforo de Segregación
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDashboardCollapsed(!isDashboardCollapsed)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 transition-all"
            >
              {isDashboardCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!isDashboardCollapsed && (
            <div className="p-2 sm:p-4 w-full min-w-0 max-w-full overflow-hidden">
              <MatrizCompatibilidadDashboard
                matrixRows={matrixRows}
                conversationId={conversationId}
                token={token}
                savedConclusions={chartConclusions}
                onConclusionSaved={handleConclusionSaved}
                isMaximized={false}
              />
            </div>
          )}
        </div>

        {/* 4. Informe Ejecutivo en Editor en Vivo (CollapsibleReportBox + LiveEditor) */}
        <CollapsibleReportBox
          title="Informe de Auditoría Técnica y Almacenamiento Seguro de Sustancias Químicas (SGA)"
          hasContent={!!reportContent}
          defaultExpanded={!!reportContent}
          onHistory={() => setShowHistory(true)}
          onSave={async () => {
            const currentHtml = editorRef.current?.getHTML() || reportContent || '';
            setReportContent(currentHtml);
            await saveMatrix(matrixRows, true, currentHtml);
            if (currentHtml && token) {
              try {
                await fetch('/api/sgsst/diagnostico/save-report', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({
                    content: currentHtml,
                    title: `Auditoría Compatibilidad Química SGA - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-matriz-compatibilidad'],
                  }),
                });
                window.dispatchEvent(new CustomEvent('sgsst-diagnostic-updated'));
              } catch (e) {
                console.error('[MatrizCompatibilidad] Error saving report history:', e);
              }
            }
          }}
          isSaving={isSaving}
          actions={
            <ExportDropdown
              content={reportContent || ''}
              fileName={`Auditoria_Compatibilidad_Quimica_${new Date().toISOString().slice(0, 10)}`}
              title="Auditoría Técnica y Matriz de Compatibilidad Química"
              onExportExcel={handleExportExcel}
            />
          }
        >
          <LiveEditor
            ref={editorRef}
            initialContent={reportContent}
            onUpdate={(html) => setReportContent(html)}
            isGenerating={isAnalyzing}
            placeholder="Haz clic en la varita mágica de la barra superior para generar el Informe de Auditoría Técnica y Matriz de Compatibilidad Química con IA..."
          />
        </CollapsibleReportBox>

        {/* Modal Historial de Informes */}
        <ReportHistory
          isOpen={showHistory}
          toggleOpen={() => setShowHistory(false)}
          tags={['sgsst-matriz-compatibilidad']}
          onSelectReport={(content) => {
            setReportContent(content);
            editorRef.current?.setHTML(content);
            setShowHistory(false);
          }}
        />

        {/* Popup Detalle de Celda Cruzada */}
        {selectedCrossCell && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border-medium bg-surface-primary p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border-medium pb-3">
                <h3 className="text-sm font-bold text-text-primary">Detalle de Almacenamiento Conjunto (NTC 3966)</h3>
                <button
                  onClick={() => setSelectedCrossCell(null)}
                  className="text-text-secondary hover:text-text-primary text-sm font-bold"
                >
                  Cerrar
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3 text-xs">
                  <div>
                    <div className="font-bold text-text-primary">{selectedCrossCell.prodA.nombre}</div>
                    <div className="text-[10px] text-text-secondary">{selectedCrossCell.prodA.clasificacion_onu}</div>
                  </div>
                  <div className="text-sm font-bold text-text-secondary">VS</div>
                  <div className="text-right">
                    <div className="font-bold text-text-primary">{selectedCrossCell.prodB.nombre}</div>
                    <div className="text-[10px] text-text-secondary">{selectedCrossCell.prodB.clasificacion_onu}</div>
                  </div>
                </div>
                <div className="text-xs">
                  <strong className="text-text-primary block mb-1">Razón Técnica:</strong>
                  <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.reason}</p>
                </div>
                <div className="text-xs">
                  <strong className="text-text-primary block mb-1">Recomendación de Segregación:</strong>
                  <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modales de Importación (Paralelo de Casillas, IA, Directo) */}
        {renderImportModals()}
        {renderProductCardModal()}
      </div>
    );
  }

  // ── MODO PANEL LATERAL DEL CHAT (HERRAMIENTA) ──
  return (
    <div className={`flex h-full flex-col border-l border-border-light transition-colors duration-300 ${isMaximized ? 'fixed inset-0 z-[999999] m-0 h-screen w-screen rounded-none bg-surface-primary shadow-2xl' : 'w-full h-full bg-surface-primary text-text-primary'}`}>
      {/* ── BARRA SUPERIOR DE ACCIONES ── */}
      <div
        className="relative z-[300] flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-light bg-surface-secondary px-3 py-2 sm:px-4 sm:py-0"
        style={{ minHeight: '4rem' }}
      >
        <div className="flex min-w-0 flex-shrink items-center gap-2 sm:gap-3 overflow-hidden text-ellipsis">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm">
            <Beaker className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <h2 className="truncate text-sm font-semibold text-text-primary">Matriz de Compatibilidad Química</h2>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-500" />
              <span className="truncate text-xs text-text-secondary">Sincronizada con Hito 1</span>
            </div>
          </div>
        </div>

        {/* Controles de Acción */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2 overflow-visible py-1">
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            hideTooltip={true}
          />

          {/* Fijar como Matriz Oficial en Hito 1 (Oculto para Plan Vital) */}
          {!isVital && (
            <button
              onClick={handlePromoteToOfficial}
              disabled={isPromoting || matrixRows.length === 0}
              className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-amber-500/40 bg-surface-primary px-2.5 text-amber-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
              title="Fijar esta matriz como la Matriz Oficial de Compatibilidad Química en el Hito 1"
            >
              {isPromoting ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Pin className="h-4 w-4 shrink-0" />
              )}
              <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
                Fijar en Aplicativo
              </span>
            </button>
          )}

          {/* Sincronizar Controles con Centro de Control */}
          <button
            onClick={handleSyncControlesQuimicos}
            disabled={isSyncingKanban || matrixRows.length === 0}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-orange-500/40 bg-surface-primary px-2.5 text-orange-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-orange-50 disabled:opacity-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
            title="Sincronizar controles de almacenamiento y brechas FDS/Rótulo con el Centro de Control"
          >
            {isSyncingKanban ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Enviar Controles
            </span>
          </button>

          {/* Añadir Producto */}
          <button
            onClick={addRow}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-surface-primary px-2.5 text-teal-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Añadir Producto
            </span>
          </button>

          {/* Auditar con IA */}
          <button
            onClick={handleAnalyzeMatrix}
            disabled={isAnalyzing || matrixRows.length === 0}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-purple-500/40 bg-surface-primary px-2.5 text-purple-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              {isAnalyzing ? 'Generando…' : 'Auditar con IA'}
            </span>
          </button>

          {/* Importar */}
          <button
            onClick={triggerExcelImport}
            disabled={isAiImportLoading}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary px-2.5 text-text-primary shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-surface-hover"
          >
            {isAiImportLoading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              Importar
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelFileChange}
            accept=".xlsx,.xls,.json,.csv"
            className="hidden"
          />

          {/* Exportar */}
          <ExportDropdown
            content={reportContent || ''}
            fileName={`Informe_Compatibilidad_Quimica_${new Date().toISOString().slice(0, 10)}`}
            reportType="general"
            onExportExcel={handleExportExcel}
            onDownloadTemplate={handleDownloadTemplate}
          />

          {/* Guardar */}
          <button
            onClick={() => saveMatrix()}
            disabled={isSaving}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-green-500/40 bg-surface-primary px-2.5 text-green-600 shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Save className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              {isSaving ? 'Guardando…' : 'Guardar'}
            </span>
          </button>

          {/* Maximizar */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="group flex h-10 min-w-[40px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary px-2.5 text-text-primary shadow-sm outline-none transition-all duration-300 hover:-rotate-3 hover:scale-105 hover:bg-surface-hover"
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4 shrink-0" />
            ) : (
              <Maximize2 className="h-4 w-4 shrink-0" />
            )}
            <span className="flex max-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100">
              {isMaximized ? 'Restaurar' : 'Expandir'}
            </span>
          </button>
        </div>
      </div>

      {/* ── MENÚ DE PESTAÑAS ── */}
      <div className="flex flex-shrink-0 border-b border-border-medium bg-surface-secondary px-4">
        {(['inventario', 'matriz_cruzada', 'dashboard', 'reporte'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 ${
              activeTab === tab
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ── CONTENIDO DE LAS PESTAÑAS ── */}
      <div className="flex-1 overflow-auto bg-surface-secondary/30 custom-scrollbar-ipevar">
        {activeTab === 'inventario' && (
          <div className="h-full flex flex-col p-4">
            {renderInventoryTable()}
          </div>
        )}

        {activeTab === 'matriz_cruzada' && (
          <div className="p-6 h-full flex flex-col gap-6 relative">
            {renderCrossMatrixGrid()}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <MatrizCompatibilidadDashboard
            matrixRows={matrixRows}
            conversationId={conversationId}
            token={token}
            savedConclusions={chartConclusions}
            onConclusionSaved={handleConclusionSaved}
            isMaximized={isMaximized}
          />
        )}

        {activeTab === 'reporte' && (
          <div className="p-6 h-full flex flex-col gap-6">
            {!reportContent ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-secondary py-16">
                <FileTextIcon className="h-12 w-12 opacity-30 text-purple-600 animate-bounce" />
                <p className="text-center text-sm font-semibold max-w-sm">
                  Aún no se ha generado la Auditoría Técnica e Informe de Almacenamiento Seguro.
                </p>
                <button
                  onClick={handleAnalyzeMatrix}
                  disabled={isAnalyzing || matrixRows.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span>Auditar con IA ahora</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div className="rounded-2xl border border-border-medium bg-surface-primary p-6 shadow-sm">
                  <LiveEditor
                    initialContent={reportContent}
                    onUpdate={(html) => setReportContent(html)}
                    ref={editorRef}
                    isEditable={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popup Detalle Celda Cruzada */}
      {selectedCrossCell && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border-medium bg-surface-primary p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-medium pb-3">
              <h3 className="text-sm font-bold text-text-primary">Detalle de Almacenamiento Conjunto</h3>
              <button
                onClick={() => setSelectedCrossCell(null)}
                className="text-text-secondary hover:text-text-primary text-sm font-bold"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3 text-xs">
                <div>
                  <div className="font-bold text-text-primary">{selectedCrossCell.prodA.nombre}</div>
                  <div className="text-[10px] text-text-secondary">{selectedCrossCell.prodA.clasificacion_onu}</div>
                </div>
                <div className="text-sm font-bold text-text-secondary">VS</div>
                <div className="text-right">
                  <div className="font-bold text-text-primary">{selectedCrossCell.prodB.nombre}</div>
                  <div className="text-[10px] text-text-secondary">{selectedCrossCell.prodB.clasificacion_onu}</div>
                </div>
              </div>
              <div className="text-xs">
                <strong className="text-text-primary block mb-1">Razón Técnica:</strong>
                <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.reason}</p>
              </div>
              <div className="text-xs">
                <strong className="text-text-primary block mb-1">Recomendación de Segregación:</strong>
                <p className="text-text-secondary bg-surface-secondary/40 p-2.5 rounded-xl border border-border-light">{selectedCrossCell.result.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modales de Importación (Paralelo de Casillas, IA, Directo) ── */}
      {renderImportModals()}
      {renderProductCardModal()}
    </div>
  );
}
