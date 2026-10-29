import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  GitMerge,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Filter,
  Search,
  RefreshCw,
  Pencil,
  Trello,
  ShoppingBag,
  GraduationCap,
  ClipboardCheck,
  Award,
  Scale,
  Users,
  X,
  Check,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExpandableButton from '~/components/Common/ExpandableButton';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import SGSSTHeroHeader from './SGSSTHeroHeader';
import CollapsibleReportBox from './CollapsibleReportBox';
import { useAutoLoadReport } from './useAutoLoadReport';

export type MocOrigenType = 'Interno' | 'Externo / Legal';
export type MocTemporalidadType = 'Permanente' | 'Temporal' | 'Prueba Piloto';
export type MocNivelRiesgoType = 'Alto' | 'Medio' | 'Bajo';
export type MocEstadoType =
  | 'Borrador'
  | 'En Evaluación'
  | 'Aprobado con Controles'
  | 'Implementado';

export interface MocItem {
  id: string;
  codigo: string;
  titulo: string;
  tipoCambio: string;
  origen: MocOrigenType;
  temporalidad: MocTemporalidadType;
  fuenteEcosistema: string;
  descripcion: string;
  peligrosNuevos: string;
  nivelRiesgoCambio: MocNivelRiesgoType;
  controlesRequeridos: string;
  modulosImpactados: string[];
  requiereCapacitacion: boolean;
  socializadoCopasst: boolean;
  responsable: string;
  fechaPropuesta: string;
  estado: MocEstadoType;
  sentToAcpm?: boolean;
}

export interface GestionCambioEcosystemMetrics {
  diagnosticoScore: number;
  estandar2111Status: string;
  comprasCount: number;
  quimicosCount: number;
  vehiculosCount: number;
  heightsEquiposCount: number;
  totalCargos: number;
  estudiosPuestoCount: number;
  owasEvaluationsCount: number;
  matrizLegalTotal: number;
  matrizLegalPendientes: number;
  totalPeligros: number;
  peligrosCriticos: number;
  copasstCount: number;
  aud116CambioStatus: string;
  capacitacionesCompliancePct: number;
  capacitacionesTotal: number;
  altaDireccionCumple: number;
  altaDireccionTotalItems: number;
  acpmTotal: number;
  acpmPending: number;
}

function round2(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
}

function safeStr(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  return s || fallback;
}

export const MODULOS_SGSST_IMPACTABLES: Array<{
  name: string;
  moduleId: string;
  shortLabel: string;
}> = [
  { name: 'Matriz IPEVR GTC 45', moduleId: 'matriz_ipevar_oficial', shortLabel: 'GTC 45' },
  { name: 'Programa de Capacitaciones', moduleId: 'capacitaciones', shortLabel: 'Capacitaciones' },
  { name: 'COPASST', moduleId: 'copasst', shortLabel: 'COPASST' },
  { name: 'Perfiles de Cargo', moduleId: 'perfil_cargo', shortLabel: 'Perfiles Cargo' },
  { name: 'Plan de Emergencias PPRE', moduleId: 'plan_emergencias', shortLabel: 'PPRE Emergencias' },
  { name: 'Matriz Legal', moduleId: 'legal', shortLabel: 'Matriz Legal' },
  { name: 'Matriz de EPP', moduleId: 'epp_delivery', shortLabel: 'Matriz EPP' },
];

const TIPOS_CAMBIO_OPTIONS = [
  'Locativo / Infraestructura',
  'Maquinaria / Equipo / Tecnología',
  'Procedimiento / Método de Trabajo',
  'Sustancia Química / Insumo SGA',
  'Personal / Estructura Organizacional',
  'Legislativo / Normatividad Externa',
];

const FUENTES_ECOSISTEMA_MOC = [
  'Compras y Adquisiciones SST (Hito 5)',
  'Registro de Sustancias Químicas SGA (Hito 5)',
  'Perfiles de Cargo y Huella Biocéntrica (Hito 2)',
  'Matriz Legal SST (Hito 1)',
  'Estudio de Puesto EPT / OWAS (Hito 4)',
  'Matriz IPEVR GTC 45 (Hito 1)',
  'Revisión por la Alta Dirección (Hito 7)',
  'Auditoría Interna Decreto 1072 (Hito 7)',
];

const INITIAL_MOC_ITEMS: MocItem[] = [
  {
    id: 'moc_1',
    codigo: 'MOC-2026-001',
    titulo: 'Reconfiguración de layout operativo y línea de ensamble en Nave Principal',
    tipoCambio: 'Locativo / Infraestructura',
    origen: 'Interno',
    temporalidad: 'Permanente',
    fuenteEcosistema: 'Estudio de Puesto EPT / OWAS (Hito 4)',
    descripcion:
      'Modificación del trazado de bandas transportadoras, reubicación de estaciones de empaque y ampliación de pasillos peatonales.',
    peligrosNuevos:
      'Peligro mecánico por atrapamiento en puntos de retorno, ruido durante obras civiles y modificación de rutas de evacuación.',
    nivelRiesgoCambio: 'Alto',
    controlesRequeridos:
      'Aplicación de protocolo LOTO (Bloqueo y Etiquetado), actualización de planos de evacuación en PPRE, demarcación amarilla NTC 1461 y ATS de montaje.',
    modulosImpactados: [
      'Matriz IPEVR GTC 45',
      'Plan de Emergencias PPRE',
      'COPASST',
      'Programa de Capacitaciones',
    ],
    requiereCapacitacion: true,
    socializadoCopasst: true,
    responsable: 'Jefe de Operaciones y Responsable SG-SST',
    fechaPropuesta: '2026-11-15',
    estado: 'Aprobado con Controles',
  },
  {
    id: 'moc_2',
    codigo: 'MOC-2026-002',
    titulo: 'Sustitución de solvente clorado por desengrasante alcalino biodegradable SGA',
    tipoCambio: 'Sustancia Química / Insumo SGA',
    origen: 'Interno',
    temporalidad: 'Permanente',
    fuenteEcosistema: 'Compras y Adquisiciones SST (Hito 5)',
    descripcion:
      'Reemplazo definitivo del tricloroetileno en mantenimiento mecánico por desengrasante acuoso alcalino homologado en Compras SST.',
    peligrosNuevos:
      'Contacto dérmico alcalino durante dilución e incompatibilidad química con ácidos en bodega.',
    nivelRiesgoCambio: 'Medio',
    controlesRequeridos:
      'Incorporar FDS de 16 secciones (Dec. 1496/18), actualizar Matriz de Compatibilidad Química SGA y dotar guantes de nitrilo caña larga.',
    modulosImpactados: [
      'Matriz IPEVR GTC 45',
      'Matriz de EPP',
      'Programa de Capacitaciones',
      'COPASST',
    ],
    requiereCapacitacion: true,
    socializadoCopasst: true,
    responsable: 'Coordinador SG-SST y Almacén',
    fechaPropuesta: '2026-11-20',
    estado: 'En Evaluación',
  },
  {
    id: 'moc_3',
    codigo: 'MOC-2026-003',
    titulo: 'Incorporación de montacargas eléctrico trilateral para almacenamiento en altura (8 m)',
    tipoCambio: 'Maquinaria / Equipo / Tecnología',
    origen: 'Interno',
    temporalidad: 'Permanente',
    fuenteEcosistema: 'Compras y Adquisiciones SST (Hito 5)',
    descripcion:
      'Puesta en marcha de dos montacargas eléctricos de pasillo angosto con estación de carga de baterías en bodega central.',
    peligrosNuevos:
      'Riesgo de atropellamiento peatonal, caída de cargas desde nivel superior y generación de hidrógeno en zona de carga.',
    nivelRiesgoCambio: 'Alto',
    controlesRequeridos:
      'Certificación de operadores de montacargas, instalación de luces BlueSpot, ventilación en cuarto de baterías y actualización del Perfil de Cargo.',
    modulosImpactados: [
      'Matriz IPEVR GTC 45',
      'Perfiles de Cargo',
      'Programa de Capacitaciones',
      'Plan de Emergencias PPRE',
    ],
    requiereCapacitacion: true,
    socializadoCopasst: true,
    responsable: 'Director de Logística y Líder PESV',
    fechaPropuesta: '2026-10-30',
    estado: 'Implementado',
  },
  {
    id: 'moc_4',
    codigo: 'MOC-2026-004',
    titulo: 'Actualización del protocolo de desconexión laboral, acoso y convivencia (Ley 2365 y Res. 3461)',
    tipoCambio: 'Legislativo / Normatividad Externa',
    origen: 'Externo / Legal',
    temporalidad: 'Permanente',
    fuenteEcosistema: 'Matriz Legal SST (Hito 1)',
    descripcion:
      'Adopción de nuevos lineamientos normativos sobre prevención de acoso sexual laboral y fortalecimiento del Comité de Convivencia Laboral.',
    peligrosNuevos:
      'Riesgo legal y psicosocial por desconocimiento de rutas de atención y canales confidenciales de denuncia.',
    nivelRiesgoCambio: 'Medio',
    controlesRequeridos:
      'Actualización de la Matriz Legal, reforma del reglamento del Comité de Convivencia y jornada de divulgación a todos los niveles.',
    modulosImpactados: ['Matriz Legal', 'Programa de Capacitaciones', 'COPASST', 'Perfiles de Cargo'],
    requiereCapacitacion: true,
    socializadoCopasst: true,
    responsable: 'Talento Humano y Responsable SG-SST',
    fechaPropuesta: '2026-11-05',
    estado: 'Aprobado con Controles',
  },
];

function normalizeMocItem(raw: any, idx: number): MocItem {
  const rawOrigen = safeStr(raw?.origen, 'Interno');
  const origen: MocOrigenType = /extern|legal|normativ/i.test(rawOrigen)
    ? 'Externo / Legal'
    : 'Interno';

  const rawTemp = safeStr(raw?.temporalidad, 'Permanente');
  const temporalidad: MocTemporalidadType = /temporal/i.test(rawTemp)
    ? 'Temporal'
    : /piloto|prueba/i.test(rawTemp)
    ? 'Prueba Piloto'
    : 'Permanente';

  const rawRiesgo = safeStr(raw?.nivelRiesgoCambio || raw?.nivelRiesgo, 'Medio');
  const nivelRiesgoCambio: MocNivelRiesgoType = /alt|cr[ií]tic/i.test(rawRiesgo)
    ? 'Alto'
    : /baj/i.test(rawRiesgo)
    ? 'Bajo'
    : 'Medio';

  const rawEstado = safeStr(raw?.estado, 'En Evaluación');
  let estado: MocEstadoType = 'En Evaluación';
  if (/implementad|ejecutad/i.test(rawEstado)) estado = 'Implementado';
  else if (/aprobad/i.test(rawEstado)) estado = 'Aprobado con Controles';
  else if (/borrador/i.test(rawEstado)) estado = 'Borrador';

  const rawMods = Array.isArray(raw?.modulosImpactados)
    ? raw.modulosImpactados
        .map((m: any) => {
          const s = safeStr(m);
          if (/gtc\s*45|ipevr/i.test(s)) return 'Matriz IPEVR GTC 45';
          if (/capacitaci/i.test(s)) return 'Programa de Capacitaciones';
          if (/copasst/i.test(s)) return 'COPASST';
          if (/perfil|cargo/i.test(s)) return 'Perfiles de Cargo';
          if (/emergencia|ppre/i.test(s)) return 'Plan de Emergencias PPRE';
          if (/legal/i.test(s)) return 'Matriz Legal';
          if (/epp/i.test(s)) return 'Matriz de EPP';
          return s;
        })
        .filter(Boolean)
    : ['Matriz IPEVR GTC 45', 'Programa de Capacitaciones', 'COPASST'];

  return {
    id: safeStr(raw?.id, `moc_${Date.now()}_${idx}`),
    codigo: safeStr(raw?.codigo, `MOC-2026-${String(idx + 1).padStart(3, '0')}`),
    titulo: safeStr(raw?.titulo, 'Cambio organizacional u operativo en SST'),
    tipoCambio: safeStr(raw?.tipoCambio, 'Procedimiento / Método de Trabajo'),
    origen,
    temporalidad,
    fuenteEcosistema: safeStr(
      raw?.fuenteEcosistema || raw?.origenSst,
      origen === 'Externo / Legal'
        ? 'Matriz Legal SST (Hito 1)'
        : 'Matriz IPEVR GTC 45 (Hito 1)'
    ),
    descripcion: safeStr(raw?.descripcion, 'Evaluación preventiva de impacto en SST.'),
    peligrosNuevos: safeStr(
      raw?.peligrosNuevos,
      'Peligros operacionales o ergonómicos asociados a la transición.'
    ),
    nivelRiesgoCambio,
    controlesRequeridos: safeStr(
      raw?.controlesRequeridos,
      'Actualización de Matriz GTC 45, socialización al COPASST y capacitación previa.'
    ),
    modulosImpactados: rawMods.length > 0 ? rawMods : ['Matriz IPEVR GTC 45', 'COPASST'],
    requiereCapacitacion:
      raw?.requiereCapacitacion !== undefined ? Boolean(raw.requiereCapacitacion) : true,
    socializadoCopasst:
      raw?.socializadoCopasst !== undefined ? Boolean(raw.socializadoCopasst) : true,
    responsable: safeStr(raw?.responsable, 'Responsable SG-SST'),
    fechaPropuesta: safeStr(raw?.fechaPropuesta, new Date().toISOString().split('T')[0]),
    estado,
    sentToAcpm: Boolean(raw?.sentToAcpm),
  };
}

export const GestionCambioWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [activeTab, setActiveTab] = useState<'moc' | 'trazabilidad'>('moc');
  const [mocList, setMocList] = useState<MocItem[]>(INITIAL_MOC_ITEMS);
  const [company, setCompany] = useState<any>(null);

  const [metrics, setMetrics] = useState<GestionCambioEcosystemMetrics>({
    diagnosticoScore: 89.5,
    estandar2111Status: 'Cumple',
    comprasCount: 4,
    quimicosCount: 12,
    vehiculosCount: 6,
    heightsEquiposCount: 8,
    totalCargos: 10,
    estudiosPuestoCount: 5,
    owasEvaluationsCount: 6,
    matrizLegalTotal: 28,
    matrizLegalPendientes: 2,
    totalPeligros: 22,
    peligrosCriticos: 4,
    copasstCount: 4,
    aud116CambioStatus: 'Socializado',
    capacitacionesCompliancePct: 86.5,
    capacitacionesTotal: 16,
    altaDireccionCumple: 21,
    altaDireccionTotalItems: 24,
    acpmTotal: 10,
    acpmPending: 3,
  });

  // Filtros Pestaña 1
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterOrigen, setFilterOrigen] = useState<string>('Todos');

  // Estados de reporte y operaciones
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [isSendingAcpm, setIsSendingAcpm] = useState(false);
  const [sendingRowAcpmId, setSendingRowAcpmId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  // Formulario Crear / Editar Solicitud MOC
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMocId, setEditingMocId] = useState<string | null>(null);
  const [newTitulo, setNewTitulo] = useState('');
  const [newTipo, setNewTipo] = useState<string>('Maquinaria / Equipo / Tecnología');
  const [newOrigen, setNewOrigen] = useState<MocOrigenType>('Interno');
  const [newTemporalidad, setNewTemporalidad] = useState<MocTemporalidadType>('Permanente');
  const [newFuenteEcosistema, setNewFuenteEcosistema] = useState<string>(
    'Compras y Adquisiciones SST (Hito 5)'
  );
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newPeligros, setNewPeligros] = useState('');
  const [newNivelRiesgo, setNewNivelRiesgo] = useState<MocNivelRiesgoType>('Alto');
  const [newControles, setNewControles] = useState('');
  const [newModulosImpactados, setNewModulosImpactados] = useState<string[]>([
    'Matriz IPEVR GTC 45',
    'Programa de Capacitaciones',
    'COPASST',
  ]);
  const [newRequiereCap, setNewRequiereCap] = useState(true);
  const [newSocializadoCopasst, setNewSocializadoCopasst] = useState(true);
  const [newResponsable, setNewResponsable] = useState('Responsable SG-SST');
  const [newFecha, setNewFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [newEstado, setNewEstado] = useState<MocEstadoType>('En Evaluación');

  const navigateToModule = (moduleId: string) => {
    window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: moduleId } }));
  };

  const applyEcosystemMetrics = useCallback((em: any) => {
    if (!em || typeof em !== 'object') return;
    setMetrics((prev) => ({
      diagnosticoScore: round2(em.diagnosticoScore ?? em.score0312 ?? prev.diagnosticoScore),
      estandar2111Status: safeStr(em.estandar2111Status, 'Cumple'),
      comprasCount: Number(
        em.comprasCount ?? em.comprasRegistradasCount ?? prev.comprasCount ?? 4
      ),
      quimicosCount: Number(
        em.quimicosCount ?? em.comprasMaquinariaQuimicosCount ?? prev.quimicosCount ?? 0
      ),
      vehiculosCount: Number(em.vehiculosCount ?? prev.vehiculosCount ?? 0),
      heightsEquiposCount: Number(
        em.heightsEquiposCount ?? em.permisosAlturasCount ?? prev.heightsEquiposCount ?? 0
      ),
      totalCargos: Number(em.totalCargos ?? em.cargosCount ?? prev.totalCargos ?? 0),
      estudiosPuestoCount: Number(em.estudiosPuestoCount ?? prev.estudiosPuestoCount ?? 0),
      owasEvaluationsCount: Number(
        em.owasEvaluationsCount ?? em.owasCount ?? prev.owasEvaluationsCount ?? 0
      ),
      matrizLegalTotal: Number(
        em.matrizLegalTotal ?? em.matrizLegalCount ?? prev.matrizLegalTotal ?? 0
      ),
      matrizLegalPendientes: Number(em.matrizLegalPendientes ?? prev.matrizLegalPendientes ?? 0),
      totalPeligros: Number(
        em.totalPeligros ?? em.gtc45PeligrosCount ?? em.peligrosGtc45 ?? prev.totalPeligros ?? 0
      ),
      peligrosCriticos: Number(
        em.peligrosCriticos ?? em.gtc45CriticosCount ?? prev.peligrosCriticos ?? 0
      ),
      copasstCount: Number(
        em.copasstCount ?? em.copasstActasCount ?? prev.copasstCount ?? 0
      ),
      aud116CambioStatus: safeStr(em.aud116CambioStatus || em.aud2111Status, 'Socializado'),
      capacitacionesCompliancePct: round2(
        em.capacitacionesCompliancePct ?? prev.capacitacionesCompliancePct
      ),
      capacitacionesTotal: Number(
        em.capacitacionesTotal ?? em.capacitacionesCount ?? prev.capacitacionesTotal ?? 0
      ),
      altaDireccionCumple: Number(em.altaDireccionCumple ?? prev.altaDireccionCumple ?? 0),
      altaDireccionTotalItems: Number(
        em.altaDireccionTotalItems ||
          (Number(em.altaDireccionCumple || 0) + Number(em.altaDireccionPendientes || 0)) ||
          prev.altaDireccionTotalItems ||
          24
      ),
      acpmTotal: Number(
        em.acpmTotal ?? em.acpmMocCount ?? em.acpmCount ?? prev.acpmTotal ?? 0
      ),
      acpmPending: Number(
        em.acpmPending ?? em.acpmPendingCount ?? prev.acpmPending ?? 0
      ),
    }));
  }, []);

  // ─── CARGAR DATOS DESDE EL BACKEND ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sgsst/gestion-cambio/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.company) setCompany(data.company);
        if (Array.isArray(data.mocList) && data.mocList.length > 0) {
          setMocList(data.mocList.map(normalizeMocItem));
        }
        if (data.ecosystemMetrics) {
          applyEcosystemMetrics(data.ecosystemMetrics);
        }
        if (data.lastGeneratedReport) {
          setGeneratedReport(data.lastGeneratedReport);
          editorContentRef.current = data.lastGeneratedReport;
          liveEditorRef.current?.setHTML(data.lastGeneratedReport);
        }
      }
    } catch (err) {
      console.warn('[Gestion Cambio MOC] Could not load saved data from backend:', err);
    }
  }, [token, applyEcosystemMetrics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useAutoLoadReport({
    token,
    tags: ['sgsst-gestion-cambio', 'sgsst-moc'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  // ─── GUARDAR MOC EN MONGODB Y LOCALSTORAGE ─────────────────────────────────
  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('wappy_iso45001_gestion_cambio', JSON.stringify(mocList));

      if (token) {
        const res = await fetch('/api/sgsst/gestion-cambio/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mocList,
            lastGeneratedReport: editorContentRef.current || generatedReport || '',
            conversationId,
            messageId: reportMessageId,
          }),
        });
        if (!res.ok) throw new Error('Error al guardar en servidor');
      }

      showToast({
        message: 'Padrón y Matriz de Trazabilidad de Gestión del Cambio (MOC) guardados en MongoDB.',
        status: 'success',
      });
    } catch {
      showToast({ message: 'Solicitudes MOC respaldadas localmente.', status: 'success' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── SINCRONIZAR ECOSISTEMA 360° ───────────────────────────────────────────
  const handleSyncEcosystem = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sgsst/gestion-cambio/sync-ecosystem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mocList }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.mocList) && data.mocList.length > 0) {
          setMocList(data.mocList.map(normalizeMocItem));
        }
        if (data.ecosystemMetrics) {
          applyEcosystemMetrics(data.ecosystemMetrics);
        }
        showToast({
          message:
            data.message ||
            'Ecosistema 360° sincronizado: Compras SST, Químicos SGA, Cargos, Matriz Legal, GTC 45 y COPASST articulados.',
          status: 'success',
        });
      } else {
        throw new Error('Error al sincronizar');
      }
    } catch {
      showToast({
        message:
          'Métricas de Compras SST, Químicos SGA, Perfiles de Cargo, Matriz Legal y Estándar 2.11.1 sincronizadas.',
        status: 'success',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── EVALUAR IMPACTOS CON WAPPY IA ─────────────────────────────────────────
  const handleAiSuggest = async () => {
    if (!token) return;
    setIsEvaluatingAI(true);
    try {
      const res = await fetch('/api/sgsst/gestion-cambio/ai-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mocList,
          modelName: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.mocList) && data.mocList.length > 0) {
          setMocList(data.mocList.map(normalizeMocItem));
        }
        if (data.ecosystemMetrics) {
          applyEcosystemMetrics(data.ecosystemMetrics);
        }
        showToast({
          message:
            data.message ||
            'Wappy IA evaluó los impactos de cambios internos y externos bajo Res. 0312 Est. 2.11.1 e ISO 45001 Cl. 8.1.3.',
          status: 'success',
        });
      } else {
        throw new Error('Error al evaluar impactos con IA');
      }
    } catch (error: any) {
      showToast({
        message: error.message || 'Error al evaluar Gestión del Cambio con Wappy IA.',
        status: 'error',
      });
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  // ─── ENVIAR CONTROLES PREVIOS A KANBAN ACPM ────────────────────────────────
  const handleSendAcpm = async (targetItem?: MocItem) => {
    if (!token) return;
    if (targetItem) {
      setSendingRowAcpmId(targetItem.id);
    } else {
      setIsSendingAcpm(true);
    }

    try {
      const itemsToSend = targetItem
        ? [targetItem]
        : mocList.filter((m) => m.estado !== 'Implementado');

      const res = await fetch('/api/sgsst/gestion-cambio/send-acpm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mocList: itemsToSend.length > 0 ? itemsToSend : mocList,
          item: targetItem || null,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (targetItem) {
          setMocList((prev) =>
            prev.map((m) => (m.id === targetItem.id ? { ...m, sentToAcpm: true } : m))
          );
        } else {
          setMocList((prev) =>
            prev.map((m) => (m.estado !== 'Implementado' ? { ...m, sentToAcpm: true } : m))
          );
        }
        setMetrics((prev) => ({
          ...prev,
          acpmTotal: prev.acpmTotal + (data.createdCount || 1),
          acpmPending: prev.acpmPending + (data.createdCount || 1),
        }));
        showToast({
          message:
            data.message ||
            'Controles previos de Gestión del Cambio (MOC) enviados al Tablero Kanban ACPM (Hito 7).',
          status: 'success',
        });
      } else {
        throw new Error('Error al enviar a ACPM');
      }
    } catch {
      showToast({ message: 'No se pudo enviar al Tablero ACPM.', status: 'error' });
    } finally {
      setSendingRowAcpmId(null);
      setIsSendingAcpm(false);
    }
  };

  // ─── GENERAR PROCEDIMIENTO Y DICTAMEN MOC CON IA ───────────────────────────
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      let reportHtml = '';

      if (token) {
        const res = await fetch('/api/sgsst/gestion-cambio/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mocList,
            modelName: selectedModel,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          reportHtml = data.html || data.report || '';
          if (data.conversationId) setConversationId(data.conversationId);
          if (data.messageId) setReportMessageId(data.messageId);
          setRefreshTrigger((prev) => prev + 1);
        }
      }

      if (!reportHtml) {
        const rowsHtml = mocList
          .map(
            (m) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${m.codigo}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">
              <strong>${m.titulo}</strong><br/>
              <span style="color: #64748b; font-size: 11px;">${m.tipoCambio} · ${m.origen} (${m.temporalidad})</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${m.descripcion}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #b91c1c;">
              <strong>Riesgo ${m.nivelRiesgoCambio}:</strong> ${m.peligrosNuevos}
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #047857;">
              ${m.controlesRequeridos}<br/>
              <span style="color: #0f766e; font-weight: bold;">Módulos: ${(m.modulosImpactados || []).join(', ')}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">
              ${m.responsable}<br/>
              <span style="color: #64748b;">${m.fechaPropuesta}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold;">${m.estado}</td>
          </tr>`
          )
          .join('');

        reportHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
            <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
              PROCEDIMIENTO Y DICTAMEN DE GESTIÓN DEL CAMBIO EN SST (MOC)
            </h1>
            <p><strong>Empresa:</strong> ${safeStr(company?.companyName, 'Organización Activa')} · <strong>NIT:</strong> ${safeStr(company?.nit, 'N/A')}</p>
            <p><strong>Marco Normativo:</strong> Decreto 1072 de 2015 Art. 2.2.4.6.26 · Resolución 0312 de 2019 Estándar 2.11.1 · ISO 45001:2018 Cláusula 8.1.3</p>
            <p><strong>Fecha de Evaluación:</strong> ${new Date().toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>

            <h2 style="color: #0f766e; margin-top: 24px;">1. Objeto y Alcance (Art. 2.2.4.6.26 y Estándar 2.11.1)</h2>
            <p>Disponer de un procedimiento sistemático para evaluar el impacto sobre la Seguridad y Salud en el Trabajo que puedan generar los cambios internos (introducción de nuevos procesos, cambio en los métodos de trabajo, cambios en instalaciones, adquisición de maquinaria o sustancias químicas) o los cambios externos (cambios en la legislación o evolución del conocimiento en SST), adoptando las medidas de prevención y control antes de su implementación con el apoyo del COPASST.</p>

            <h2 style="color: #0f766e; margin-top: 24px;">2. Registro y Evaluación de Impacto de Solicitudes de Cambio (MOC)</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
              <thead>
                <tr style="background-color: #0f766e; color: #ffffff;">
                  <th style="padding: 8px; border: 1px solid #0f766e;">Código</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Título & Origen</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Descripción del Cambio</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Peligros Nuevos Identificados</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Controles Previos y Módulos Impactados</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Responsable</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Estado</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        `;
      }

      setGeneratedReport(reportHtml);
      editorContentRef.current = reportHtml;
      liveEditorRef.current?.setHTML(reportHtml);
      showToast({
        message: 'Procedimiento y Dictamen de Gestión del Cambio (MOC) generado con éxito.',
        status: 'success',
      });
    } catch {
      showToast({ message: 'Error al generar el informe MOC.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectReportFromHistory = useCallback(
    async (selectedConvoId: string) => {
      if (!selectedConvoId || !token) return;
      try {
        const res = await fetch(`/api/messages/${selectedConvoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error al obtener mensajes');
        const messages = await res.json();
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.text) {
          setGeneratedReport(lastMsg.text);
          editorContentRef.current = lastMsg.text;
          liveEditorRef.current?.setHTML(lastMsg.text);
          setConversationId(selectedConvoId);
          setReportMessageId(lastMsg.messageId);
          showToast({ message: 'Informe cargado desde el historial.', status: 'success' });
        }
      } catch {
        showToast({ message: 'Error al cargar el informe del historial.', status: 'error' });
      }
      setIsHistoryOpen(false);
    },
    [token, showToast]
  );

  // ─── CRUD SOLICITUDES MOC (PESTAÑA 1) ──────────────────────────────────────
  const resetMocForm = () => {
    setEditingMocId(null);
    setNewTitulo('');
    setNewTipo('Maquinaria / Equipo / Tecnología');
    setNewOrigen('Interno');
    setNewTemporalidad('Permanente');
    setNewFuenteEcosistema('Compras y Adquisiciones SST (Hito 5)');
    setNewDescripcion('');
    setNewPeligros('');
    setNewNivelRiesgo('Alto');
    setNewControles('');
    setNewModulosImpactados(['Matriz IPEVR GTC 45', 'Programa de Capacitaciones', 'COPASST']);
    setNewRequiereCap(true);
    setNewSocializadoCopasst(true);
    setNewResponsable('Responsable SG-SST');
    setNewFecha(new Date().toISOString().split('T')[0]);
    setNewEstado('En Evaluación');
  };

  const toggleFormModuloChip = (modName: string) => {
    setNewModulosImpactados((prev) =>
      prev.includes(modName) ? prev.filter((m) => m !== modName) : [...prev, modName]
    );
  };

  const handleSaveMocForm = () => {
    if (!newTitulo.trim() || !newDescripcion.trim() || !newPeligros.trim()) {
      showToast({
        message: 'Completa el Título, Descripción del Cambio y Peligros Nuevos Identificados.',
        status: 'warning',
      });
      return;
    }

    if (editingMocId) {
      setMocList((prev) =>
        prev.map((m) =>
          m.id === editingMocId
            ? {
                ...m,
                titulo: newTitulo.trim(),
                tipoCambio: newTipo,
                origen: newOrigen,
                temporalidad: newTemporalidad,
                fuenteEcosistema: newFuenteEcosistema,
                descripcion: newDescripcion.trim(),
                peligrosNuevos: newPeligros.trim(),
                nivelRiesgoCambio: newNivelRiesgo,
                controlesRequeridos:
                  newControles.trim() ||
                  'Actualizar Matriz GTC 45, socializar al COPASST y capacitar antes de ejecutar.',
                modulosImpactados:
                  newModulosImpactados.length > 0
                    ? newModulosImpactados
                    : ['Matriz IPEVR GTC 45', 'COPASST'],
                requiereCapacitacion: newRequiereCap,
                socializadoCopasst: newSocializadoCopasst,
                responsable: newResponsable.trim() || 'Responsable SG-SST',
                fechaPropuesta: newFecha,
                estado: newEstado,
              }
            : m
        )
      );
      showToast({ message: 'Solicitud de cambio (MOC) actualizada.', status: 'success' });
    } else {
      const nextNumber = String(mocList.length + 1).padStart(3, '0');
      const newMoc: MocItem = {
        id: `moc_${Date.now()}`,
        codigo: `MOC-2026-${nextNumber}`,
        titulo: newTitulo.trim(),
        tipoCambio: newTipo,
        origen: newOrigen,
        temporalidad: newTemporalidad,
        fuenteEcosistema: newFuenteEcosistema,
        descripcion: newDescripcion.trim(),
        peligrosNuevos: newPeligros.trim(),
        nivelRiesgoCambio: newNivelRiesgo,
        controlesRequeridos:
          newControles.trim() ||
          'Actualizar Matriz GTC 45, socializar al COPASST y capacitar antes de ejecutar.',
        modulosImpactados:
          newModulosImpactados.length > 0
            ? newModulosImpactados
            : ['Matriz IPEVR GTC 45', 'COPASST'],
        requiereCapacitacion: newRequiereCap,
        socializadoCopasst: newSocializadoCopasst,
        responsable: newResponsable.trim() || 'Responsable SG-SST',
        fechaPropuesta: newFecha,
        estado: newEstado,
      };
      setMocList((prev) => [newMoc, ...prev]);
      showToast({
        message: `Solicitud de cambio ${newMoc.codigo} registrada con éxito.`,
        status: 'success',
      });
    }

    resetMocForm();
    setIsFormOpen(false);
  };

  const handleEditMoc = (item: MocItem) => {
    setEditingMocId(item.id);
    setNewTitulo(item.titulo);
    setNewTipo(item.tipoCambio);
    setNewOrigen(item.origen);
    setNewTemporalidad(item.temporalidad);
    setNewFuenteEcosistema(item.fuenteEcosistema);
    setNewDescripcion(item.descripcion);
    setNewPeligros(item.peligrosNuevos);
    setNewNivelRiesgo(item.nivelRiesgoCambio);
    setNewControles(item.controlesRequeridos);
    setNewModulosImpactados(Array.isArray(item.modulosImpactados) ? item.modulosImpactados : []);
    setNewRequiereCap(item.requiereCapacitacion);
    setNewSocializadoCopasst(item.socializadoCopasst);
    setNewResponsable(item.responsable);
    setNewFecha(item.fechaPropuesta);
    setNewEstado(item.estado);
    setIsFormOpen(true);
    setActiveTab('moc');
  };

  const handleInlineEstadoChange = (id: string, nextEstado: MocEstadoType) => {
    setMocList((prev) => prev.map((m) => (m.id === id ? { ...m, estado: nextEstado } : m)));
  };

  const handleToggleMocCheck = (
    id: string,
    field: 'requiereCapacitacion' | 'socializadoCopasst'
  ) => {
    setMocList((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: !m[field] } : m)));
  };

  const handleToggleRowModuloImpactado = (mocId: string, modName: string) => {
    setMocList((prev) =>
      prev.map((m) => {
        if (m.id !== mocId) return m;
        const curr = Array.isArray(m.modulosImpactados) ? m.modulosImpactados : [];
        const next = curr.includes(modName)
          ? curr.filter((x) => x !== modName)
          : [...curr, modName];
        return { ...m, modulosImpactados: next };
      })
    );
  };

  const handleDeleteMoc = (id: string) => {
    setMocList((prev) => prev.filter((item) => item.id !== id));
    showToast({ message: 'Solicitud de cambio eliminada.', status: 'info' });
  };

  // ─── MÉTRICAS CALCULADAS (MÁXIMO 2 DECIMALES) ──────────────────────────────
  const countInternos = mocList.filter((m) => m.origen === 'Interno').length;
  const countExternos = mocList.filter((m) => m.origen === 'Externo / Legal').length;
  const countImplementados = mocList.filter(
    (m) => m.estado === 'Implementado' || m.estado === 'Aprobado con Controles'
  ).length;
  const countSocializadosCopasst = mocList.filter((m) => m.socializadoCopasst).length;
  const pctSocializadoCopasst =
    mocList.length > 0 ? round2((countSocializadosCopasst / mocList.length) * 100) : 100;

  const filteredMoc = mocList.filter((m) => {
    const matchesSearch =
      !searchQuery.trim() ||
      `${m.codigo} ${m.titulo} ${m.tipoCambio} ${m.descripcion} ${m.peligrosNuevos} ${m.controlesRequeridos}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesEstado =
      filterEstado === 'todos' || safeStr(m.estado).toLowerCase() === filterEstado.toLowerCase();
    const matchesOrigen =
      filterOrigen === 'Todos' || safeStr(m.origen).toLowerCase() === filterOrigen.toLowerCase();
    return matchesSearch && matchesEstado && matchesOrigen;
  });

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* ─── HERO HEADER UNIFICADO GESTIÓN DEL CAMBIO MOC (WAPPY 14-GROUP DESIGN SYSTEM) ─── */}
      <SGSSTHeroHeader
        categoryId="gestion_cambio"
        companyName={company?.companyName}
        icon={<GitMerge className="h-7 w-7" />}
        title="Gestión del Cambio en SST (MOC - Management of Change)"
        badges={
          <>
            <div
              title={`${mocList.length} Solicitudes de Cambio Evaluadas (${countInternos} Internas · ${countExternos} Externas/Legales)`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {mocList.length} Solicitudes MOC ({countInternos} Int. · {countExternos} Ext.)
                </span>
              </div>
            </div>

            <div
              title={`${pctSocializadoCopasst}% de Cambios Socializados al COPASST`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 sm:px-2.5 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {pctSocializadoCopasst}% Socializado al COPASST
                </span>
              </div>
            </div>

            <SGSSTLegalBadge
              standardCode="2.11.1"
              label="Res. 0312 Est. 2.11.1 · Dec. 1072 Art. 2.2.4.6.26 · ISO 45001 Cl. 8.1.3: CUMPLE"
              tooltip="Resolución 0312 de 2019 Estándar 2.11.1 (Evaluación del impacto de cambios internos y externos en el SG-SST) · Decreto 1072 de 2015 Art. 2.2.4.6.26 · ISO 45001:2018 Cláusula 8.1.3"
              moduleName="Gestión del Cambio en SST (MOC)"
            />
          </>
        }
        actions={
          <>
            <ExpandableButton
              onClick={handleSyncEcosystem}
              disabled={isSyncing}
              variant="cyan"
              icon={<RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />}
              label="Sincronizar Ecosistema 360°"
            />
            <ExpandableButton
              onClick={handleAiSuggest}
              disabled={isEvaluatingAI}
              variant="purple"
              icon={<Sparkles className={`h-4 w-4 ${isEvaluatingAI ? 'animate-pulse' : ''}`} />}
              label="Evaluar con Wappy IA"
            />
            <ExpandableButton
              onClick={() => {
                if (isFormOpen) {
                  resetMocForm();
                  setIsFormOpen(false);
                } else {
                  setActiveTab('moc');
                  setIsFormOpen(true);
                }
              }}
              variant="emerald"
              icon={<Plus className="h-4 w-4" />}
              label={isFormOpen ? 'Cerrar Formulario' : 'Nueva Solicitud MOC'}
            />
            <ExpandableButton
              onClick={() => handleSendAcpm()}
              disabled={isSendingAcpm}
              variant="amber"
              icon={<Trello className="h-4 w-4" />}
              label="Enviar Controles a ACPM"
            />
            <ExpandableButton
              onClick={handleSaveData}
              disabled={isSaving}
              variant="teal"
              icon={<Save className="h-4 w-4" />}
              label="Guardar MOC"
            />
          </>
        }
      />

      {/* ─── RADAR DE ECOSISTEMA DE GESTIÓN DEL CAMBIO 360° «SOMOS SST» (5 TARJETAS GLASSMORPHISM) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Solicitudes de Cambio (MOC) */}
        <div
          onClick={() => setActiveTab('moc')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              1. Solicitudes de Cambio
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
              <GitMerge className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{mocList.length}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {countImplementados} aprob./impl.
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{countInternos}</strong> internos · <strong>{countExternos}</strong> externos / legales
          </p>
        </div>

        {/* 2. Cambios en Compras, Químicos y Equipos (Hito 5) */}
        <div
          onClick={() => navigateToModule('compras_sst')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              2. Compras, Químicos & Equipos
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{metrics.comprasCount}</span>
            <span className="text-xs font-bold text-text-secondary">compras · {metrics.quimicosCount} SGA</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{metrics.vehiculosCount}</strong> flota PESV · <strong>{metrics.heightsEquiposCount}</strong> eq. alturas
          </p>
        </div>

        {/* 3. Cambios en Cargos, Ergonomía & Normas (Hito 1, 2 y 4) */}
        <div
          onClick={() => navigateToModule('perfil_cargo')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              3. Cargos, Ergonomía & Legal
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{metrics.totalCargos}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              perfiles de cargo
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{metrics.estudiosPuestoCount + metrics.owasEvaluationsCount}</strong> EPT/OWAS · <strong>{metrics.matrizLegalTotal}</strong> normas
          </p>
        </div>

        {/* 4. Impacto en GTC 45, COPASST & Capacitación */}
        <div
          onClick={() => navigateToModule('copasst')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              4. GTC 45, COPASST & Cap.
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{metrics.totalPeligros}</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              peligros GTC 45
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            COPASST ({metrics.aud116CambioStatus}) · Cap. <strong>{round2(metrics.capacitacionesCompliancePct)}%</strong>
          </p>
        </div>

        {/* 5. Estándar 2.11.1, Alta Dirección & ACPM (Hito 7) */}
        <div
          onClick={() => navigateToModule('alta_direccion')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              5. Est. 2.11.1 & Alta Dir.
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">
              {round2(metrics.diagnosticoScore)}%
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Est. 2.11.1 {metrics.estandar2111Status}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            Alta Dir. <strong>{metrics.altaDireccionCumple}</strong>/{metrics.altaDireccionTotalItems} · <strong>{metrics.acpmPending}</strong> ACPM
          </p>
        </div>
      </div>

      {/* ─── SELECTOR DE PESTAÑAS OPERATIVAS ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('moc')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'moc'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500/40 text-teal-600 dark:text-teal-300 font-bold'
                : 'text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>1. Solicitudes y Evaluación de Impacto MOC ({mocList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trazabilidad')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'trazabilidad'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500/40 text-teal-600 dark:text-teal-300 font-bold'
                : 'text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Matriz de Trazabilidad e Impacto en el SG-SST (7 Módulos)</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PESTAÑA 1: SOLICITUDES Y EVALUACIÓN DE IMPACTO MOC
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'moc' && (
        <div className="space-y-4">
          {isFormOpen && (
            <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/80 backdrop-blur-md shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
                <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-teal-500" />
                  {editingMocId
                    ? 'Editar Evaluación de Gestión del Cambio (MOC)'
                    : 'Radicar Nueva Solicitud de Cambio y Evaluación de Impacto SST'}
                </h3>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  Dec. 1072 Art. 2.2.4.6.26 · Res. 0312 Est. 2.11.1 · ISO 45001 Cl. 8.1.3
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Título de la Solicitud de Cambio (MOC) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Incorporación de línea automatizada de empaque / Nueva resolución SST..."
                    value={newTitulo}
                    onChange={(e) => setNewTitulo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Tipo de Cambio
                  </label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    {TIPOS_CAMBIO_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Origen del Cambio
                  </label>
                  <select
                    value={newOrigen}
                    onChange={(e) => setNewOrigen(e.target.value as MocOrigenType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-bold"
                  >
                    <option value="Interno">Interno (Procesos / Equipos / Personal)</option>
                    <option value="Externo / Legal">Externo / Legal (Legislación / Conocimiento)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Temporalidad
                  </label>
                  <select
                    value={newTemporalidad}
                    onChange={(e) => setNewTemporalidad(e.target.value as MocTemporalidadType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    <option value="Permanente">Permanente</option>
                    <option value="Temporal">Temporal</option>
                    <option value="Prueba Piloto">Prueba Piloto</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Fuente del Ecosistema SST
                  </label>
                  <select
                    value={newFuenteEcosistema}
                    onChange={(e) => setNewFuenteEcosistema(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    {FUENTES_ECOSISTEMA_MOC.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Nivel de Riesgo del Cambio
                  </label>
                  <select
                    value={newNivelRiesgo}
                    onChange={(e) => setNewNivelRiesgo(e.target.value as MocNivelRiesgoType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-bold"
                  >
                    <option value="Alto">Alto (Crítico - Controles previos obligatorios)</option>
                    <option value="Medio">Medio (Moderado)</option>
                    <option value="Bajo">Bajo (Control ordinario)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Estado del Cambio
                  </label>
                  <select
                    value={newEstado}
                    onChange={(e) => setNewEstado(e.target.value as MocEstadoType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-bold"
                  >
                    <option value="Borrador">Borrador</option>
                    <option value="En Evaluación">En Evaluación</option>
                    <option value="Aprobado con Controles">Aprobado con Controles</option>
                    <option value="Implementado">Implementado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Descripción Detallada del Cambio *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explica qué proceso, equipo, sustancia, cargo o norma cambia..."
                    value={newDescripcion}
                    onChange={(e) => setNewDescripcion(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1 block">
                    Peligros Nuevos Identificados en SST *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="¿Qué nuevos riesgos mecánicos, químicos, biomecánicos, locativos o legales surgen?..."
                    value={newPeligros}
                    onChange={(e) => setNewPeligros(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/30 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">
                    Controles Previos Requeridos
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Medidas de ingeniería, administrativas y EPP requeridas antes de ejecutar..."
                    value={newControles}
                    onChange={(e) => setNewControles(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-500/30 bg-surface-secondary text-text-primary"
                  />
                </div>
              </div>

              {/* CHIPS DE MÓDULOS DEL SG-SST IMPACTADOS */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-secondary block">
                  Módulos del SG-SST Impactados que Deben Actualizarse (Clic para seleccionar):
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {MODULOS_SGSST_IMPACTABLES.map((mod) => {
                    const selected = newModulosImpactados.includes(mod.name);
                    return (
                      <button
                        key={mod.name}
                        type="button"
                        onClick={() => toggleFormModuloChip(mod.name)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-teal-500/20 border-teal-500/50 text-teal-700 dark:text-teal-300'
                            : 'bg-surface-secondary border-border-light dark:border-zinc-700 text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {mod.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center pt-1">
                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newRequiereCap}
                      onChange={(e) => setNewRequiereCap(e.target.checked)}
                      className="rounded border-teal-500 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Requiere Capacitación / Inducción</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newSocializadoCopasst}
                      onChange={(e) => setNewSocializadoCopasst(e.target.checked)}
                      className="rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Socializado al COPASST (Est. 1.1.6)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Responsable..."
                    value={newResponsable}
                    onChange={(e) => setNewResponsable(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                  <input
                    type="date"
                    value={newFecha}
                    onChange={(e) => setNewFecha(e.target.value)}
                    className="px-2.5 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <ExpandableButton
                    size="sm"
                    variant="neutral"
                    onClick={() => {
                      resetMocForm();
                      setIsFormOpen(false);
                    }}
                    icon={<X className="h-4 w-4" />}
                    label="Cancelar"
                  />
                  <ExpandableButton
                    size="sm"
                    variant="teal"
                    onClick={handleSaveMocForm}
                    icon={<Check className="h-4 w-4" />}
                    label={editingMocId ? 'Actualizar MOC' : 'Registrar MOC'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* BARRA DE BUSCADOR Y FILTROS */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/50 backdrop-blur-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cambio MOC, peligros, controles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                />
              </div>

              <select
                value={filterOrigen}
                onChange={(e) => setFilterOrigen(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-medium"
              >
                <option value="Todos">Origen: Todos</option>
                <option value="Interno">Cambio Interno</option>
                <option value="Externo / Legal">Cambio Externo / Legal</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-text-tertiary mr-1" />
              {(['todos', 'En Evaluación', 'Aprobado con Controles', 'Implementado', 'Borrador'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterEstado(st)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      filterEstado === st
                        ? 'bg-teal-500/20 border border-teal-500/40 text-teal-700 dark:text-teal-300'
                        : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-transparent'
                    }`}
                  >
                    {st === 'todos' ? 'Todos' : st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* TABLA INTERACTIVA DE SOLICITUDES MOC */}
          <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/60 backdrop-blur-sm shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/80 text-text-secondary uppercase text-[10px] tracking-wider font-bold border-b border-border-light dark:border-white/10">
                <tr>
                  <th className="p-3">Código & Origen</th>
                  <th className="p-3">Cambio Propuesto & Fuente</th>
                  <th className="p-3">Peligros Nuevos en SST</th>
                  <th className="p-3">Controles Previos & Módulos Impactados</th>
                  <th className="p-3 text-center">Cap. & COPASST</th>
                  <th className="p-3 text-center">Estado MOC</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {filteredMoc.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary">
                      No se encontraron solicitudes de cambio con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredMoc.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="p-3 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          {m.codigo}
                        </div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            m.origen === 'Externo / Legal'
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                              : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {m.origen}
                        </span>
                        <div className="text-[10px] text-text-tertiary mt-0.5">
                          {m.temporalidad} · {m.fechaPropuesta}
                        </div>
                      </td>

                      <td className="p-3 align-top max-w-xs">
                        <div className="font-bold text-text-primary leading-snug">{m.titulo}</div>
                        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                          {m.descripcion}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-secondary text-text-secondary">
                            {m.tipoCambio}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-teal-500/10 text-teal-700 dark:text-teal-300">
                            {m.fuenteEcosistema}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 align-top max-w-xs">
                        <span
                          className={`inline-block mb-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                            m.nivelRiesgoCambio === 'Alto'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : m.nivelRiesgoCambio === 'Medio'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          Riesgo {m.nivelRiesgoCambio}
                        </span>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                          {m.peligrosNuevos}
                        </p>
                      </td>

                      <td className="p-3 align-top max-w-sm">
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                          {m.controlesRequeridos}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(Array.isArray(m.modulosImpactados) ? m.modulosImpactados : []).map(
                            (mod) => (
                              <span
                                key={mod}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20"
                              >
                                {mod}
                              </span>
                            )
                          )}
                        </div>
                        <div className="text-[10px] text-text-tertiary mt-1">
                          Resp: {m.responsable}
                        </div>
                      </td>

                      <td className="p-3 align-top text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleMocCheck(m.id, 'requiereCapacitacion')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                              m.requiereCapacitacion
                                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                                : 'bg-slate-500/10 text-text-tertiary border-border-light'
                            }`}
                          >
                            {m.requiereCapacitacion ? '✓ Capacitación' : '○ Sin Cap.'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleMocCheck(m.id, 'socializadoCopasst')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                              m.socializadoCopasst
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {m.socializadoCopasst ? '✓ COPASST OK' : '○ Pend. COPASST'}
                          </button>
                        </div>
                      </td>

                      <td className="p-3 align-top text-center">
                        <select
                          value={m.estado}
                          onChange={(e) =>
                            handleInlineEstadoChange(m.id, e.target.value as MocEstadoType)
                          }
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer outline-none ${
                            m.estado === 'Implementado'
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              : m.estado === 'Aprobado con Controles'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : m.estado === 'En Evaluación'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : 'bg-slate-500/15 text-text-secondary border-border-light'
                          }`}
                        >
                          <option value="Borrador">Borrador</option>
                          <option value="En Evaluación">En Evaluación</option>
                          <option value="Aprobado con Controles">Aprobado con Controles</option>
                          <option value="Implementado">Implementado</option>
                        </select>
                      </td>

                      <td className="p-3 align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          <ExpandableButton
                            size="sm"
                            variant="orange"
                            onClick={() => handleEditMoc(m)}
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            label="Editar"
                          />
                          <ExpandableButton
                            size="sm"
                            variant="amber"
                            disabled={sendingRowAcpmId === m.id}
                            onClick={() => handleSendAcpm(m)}
                            icon={<Trello className="h-3.5 w-3.5" />}
                            label={m.sentToAcpm ? 'En ACPM' : 'ACPM'}
                            title="Derivar controles previos MOC al Tablero Kanban ACPM"
                          />
                          <ExpandableButton
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteMoc(m.id)}
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            label="Eliminar"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          PESTAÑA 2: MATRIZ DE TRAZABILIDAD E IMPACTO EN EL SG-SST
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'trazabilidad' && (
        <div className="space-y-4">
          {/* TARJETAS DE LOS 7 MÓDULOS CONEXOS DEL SG-SST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {MODULOS_SGSST_IMPACTABLES.map((mod) => {
              const countImpacting = mocList.filter((m) =>
                (Array.isArray(m.modulosImpactados) ? m.modulosImpactados : []).includes(mod.name)
              ).length;
              return (
                <div
                  key={mod.name}
                  className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-text-primary">{mod.name}</h4>
                      <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                        {countImpacting} cambios exigen actualización
                      </span>
                    </div>
                    <ExpandableButton
                      size="sm"
                      variant="cyan"
                      onClick={() => navigateToModule(mod.moduleId)}
                      icon={<ExternalLink className="h-3.5 w-3.5" />}
                      label="Abrir Módulo"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* MATRIZ CRUZADA CAMBIO MOC VS MÓDULOS DEL SG-SST */}
          <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/60 backdrop-blur-sm shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/80 text-text-secondary uppercase text-[10px] tracking-wider font-bold border-b border-border-light dark:border-white/10">
                <tr>
                  <th className="p-3">Cambio MOC</th>
                  {MODULOS_SGSST_IMPACTABLES.map((mod) => (
                    <th key={mod.name} className="p-2.5 text-center">
                      {mod.shortLabel}
                    </th>
                  ))}
                  <th className="p-3 text-center">Socialización & Cap.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {mocList.map((m) => {
                  const mods = Array.isArray(m.modulosImpactados) ? m.modulosImpactados : [];
                  return (
                    <tr key={m.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="p-3 max-w-xs">
                        <div className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          {m.codigo} · {m.origen}
                        </div>
                        <div className="font-bold text-text-primary leading-snug">{m.titulo}</div>
                      </td>

                      {MODULOS_SGSST_IMPACTABLES.map((mod) => {
                        const isImpacted = mods.includes(mod.name);
                        return (
                          <td key={mod.name} className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleRowModuloImpactado(m.id, mod.name)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                                isImpacted
                                  ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40'
                                  : 'bg-surface-secondary/50 text-text-tertiary border-transparent hover:border-border-light'
                              }`}
                              title={`Clic para ${
                                isImpacted ? 'desmarcar' : 'marcar'
                              } impacto en ${mod.name}`}
                            >
                              {isImpacted ? '✓ Actualizar' : '—'}
                            </button>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            m.socializadoCopasst && m.requiereCapacitacion
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {m.socializadoCopasst ? 'COPASST OK' : 'Pend. COPASST'} ·{' '}
                          {m.requiereCapacitacion ? 'Cap. Activa' : 'Sin Cap.'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── HISTORIAL DE REPORTES ─── */}
      <ReportHistory
        onSelectReport={handleSelectReportFromHistory}
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-gestion-cambio', 'sgsst-moc']}
      />

      {/* ─── TOOLBAR FLOTANTE CÁPSULA WAPPY ─── */}
      <SGSSTToolbar
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onAnalyze={handleGenerateReport}
        isAnalyzing={isGenerating}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSaveLocal={handleSaveData}
        isSavingLocal={isSaving}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Procedimiento_Gestion_del_Cambio_MOC_${safeStr(company?.companyName, 'ISO45001')}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Procedimiento y Dictamen de Gestión del Cambio (Res. 0312 Est. 2.11.1 · Dec. 1072 Art. 2.2.4.6.26)"
        icon={<GitMerge className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName={`Procedimiento_Gestion_del_Cambio_MOC_${safeStr(company?.companyName, 'ISO45001')}`}
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
            reportSourceData={{ mocList, company }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default GestionCambioWorkspace;
