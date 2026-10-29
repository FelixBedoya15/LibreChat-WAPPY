import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Shield,
  FileCheck,
  Package,
  Layers,
  Filter,
  Search,
  RefreshCw,
  Pencil,
  Trello,
  FlaskConical,
  Car,
  Wrench,
  ClipboardCheck,
  X,
  Check,
  HardHat,
  FileText,
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

export type CompraCategoria =
  | 'Elementos de Protección Personal (EPP)'
  | 'Sustancias Químicas'
  | 'Maquinaria y Herramientas'
  | 'Equipos de Alturas y Emergencias'
  | 'Seguridad Vial / Repuestos PESV'
  | 'Mobiliario y Ergonomía'
  | 'Servicios e Instalaciones';

export type DictamenCompraSST =
  | 'Aprobado para Compra'
  | 'Condicionado / Exige Ajuste'
  | 'Rechazado';

export interface CompraItem {
  id: string;
  codigo: string;
  productoServicio: string;
  categoria: CompraCategoria | string;
  origenSst: string;
  proveedorSugerido: string;
  nitProveedor: string;
  cantidadUnidad: string;
  normaTecnica: string;
  especificacionesSST: string;
  criteriosVerificados: string;
  tieneFdsSga: boolean;
  tieneCertificadoCalidad: boolean;
  dictamenSST: DictamenCompraSST;
  responsableEvaluacion: string;
  fechaEvaluacion: string;
  sentToAcpm?: boolean;
}

export interface CriterioFamiliaItem {
  id: string;
  familia: string;
  normaAplicable: string;
  especificacionesMinimas: string;
  documentosExigidosProveedor: string;
  criterioAceptacionAlmacen: string;
  responsableVerificacion: string;
  obligatorioAntesDeCompra: boolean;
}

export interface ComprasEcosystemMetrics {
  diagnosticoScore: number;
  estandar291Status: string;
  eppEntregasCount: number;
  eppSolicitudesPendientes: number;
  permisosAlturasCount: number;
  heightsEquiposCount: number;
  quimicosCount: number;
  quimicosFdsPct: number;
  incompatibilidadesQuimicas: number;
  vehiculosCount: number;
  pesvRiesgosCount: number;
  equiposEmergenciaCount: number;
  totalPeligros: number;
  peligrosCriticos: number;
  auditoriaScore: number;
  auditoriaNoConformidades: number;
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

const COMPRA_CATEGORIES: string[] = [
  'Todas',
  'Elementos de Protección Personal (EPP)',
  'Sustancias Químicas',
  'Maquinaria y Herramientas',
  'Equipos de Alturas y Emergencias',
  'Seguridad Vial / Repuestos PESV',
  'Mobiliario y Ergonomía',
  'Servicios e Instalaciones',
];

const ORIGEN_ECOSISTEMA_OPTIONS: string[] = [
  'Entrega y Seguimiento de EPP (Hito 5)',
  'Registro de Productos Químicos SGA (Hito 5)',
  'Hoja de Vida de Equipos de Alturas (Hito 5)',
  'Matriz IPEVR GTC 45 (Hito 1)',
  'Flota Vehicular PESV (Hito 5)',
  'Plan de Emergencias PPRE (Hito 1)',
  'Estudio de Puesto / OWAS (Hito 4)',
  'Auditoría Interna Decreto 1072 (Hito 7)',
  'Revisión por la Alta Dirección (Hito 7)',
];

const INITIAL_COMPRAS: CompraItem[] = [
  {
    id: 'comp_1',
    codigo: 'ADQ-2026-001',
    productoServicio: 'Lote de arneses multipropósito de cuerpo entero dieléctricos 4 argollas',
    categoria: 'Equipos de Alturas y Emergencias',
    origenSst: 'Hoja de Vida de Equipos de Alturas (Hito 5)',
    proveedorSugerido: 'Seguridad y Alturas Industrial SAS',
    nitProveedor: '900.412.889-1',
    cantidadUnidad: '12 Unidades',
    normaTecnica: 'ANSI/ASSE Z359.11-2021 · Res. 4272 de 2021',
    especificacionesSST:
      'Certificación ANSI/ASSE Z359.11-2021, resistencia dieléctrica 20 kV, hebillas recubiertas, indicador de impacto y etiqueta indeleble con trazabilidad.',
    criteriosVerificados:
      'Certificado de conformidad por organismo acreditado ONAC/ANSI, ficha técnica en español y hoja de vida individual para registro de inspección.',
    tieneFdsSga: false,
    tieneCertificadoCalidad: true,
    dictamenSST: 'Aprobado para Compra',
    responsableEvaluacion: 'Coordinador de Trabajo en Alturas y Líder SG-SST',
    fechaEvaluacion: '2026-10-10',
  },
  {
    id: 'comp_2',
    codigo: 'ADQ-2026-002',
    productoServicio: 'Desengrasante alcalino biodegradable concentrado para lavado industrial',
    categoria: 'Sustancias Químicas',
    origenSst: 'Registro de Productos Químicos SGA (Hito 5)',
    proveedorSugerido: 'Químicos y Soluciones Ecológicas Ltda',
    nitProveedor: '890.305.114-6',
    cantidadUnidad: '40 Galones',
    normaTecnica: 'Decreto 1496 de 2018 (SGA) · Res. 773 de 2021',
    especificacionesSST:
      'FDS (Ficha de Datos de Seguridad) vigente (< 5 años) con las 16 secciones bajo Sistema Globalmente Armonizado (SGA), etiqueta con pictogramas y pH controlado.',
    criteriosVerificados:
      'Validación en Matriz de Compatibilidad Química (Clase 8 Corrosivo Alcalino); pendiente entrega de tarjeta de emergencia actualizada y embudo anti-derrame.',
    tieneFdsSga: true,
    tieneCertificadoCalidad: false,
    dictamenSST: 'Condicionado / Exige Ajuste',
    responsableEvaluacion: 'Responsable SG-SST',
    fechaEvaluacion: '2026-10-14',
  },
  {
    id: 'comp_3',
    codigo: 'ADQ-2026-003',
    productoServicio: 'Sierra tronzadora / ingletadora industrial con guarda retráctil y extracción',
    categoria: 'Maquinaria y Herramientas',
    origenSst: 'Matriz IPEVR GTC 45 (Hito 1)',
    proveedorSugerido: 'Maquinaria y Herramientas del Caribe SAS',
    nitProveedor: '901.228.741-3',
    cantidadUnidad: '2 Equipos',
    normaTecnica: 'Resolución 2400 de 1979 Art. 266 · ISO 12100',
    especificacionesSST:
      'Guarda protectora envolvente autorretráctil, interruptor de hombre muerto (dead-man), punto de bloqueo LOTO y emisión acústica < 82 dB(A).',
    criteriosVerificados:
      'Manual de operación y mantenimiento seguro en español, declaración de conformidad CE/UL y protocolo de preoperacional.',
    tieneFdsSga: false,
    tieneCertificadoCalidad: true,
    dictamenSST: 'Aprobado para Compra',
    responsableEvaluacion: 'Jefe de Mantenimiento y Responsable SG-SST',
    fechaEvaluacion: '2026-10-18',
  },
  {
    id: 'comp_4',
    codigo: 'ADQ-2026-004',
    productoServicio: 'Dotación de guantes de nitrilo flocado, gafas ANSI Z87.1+ y botas dieléctricas',
    categoria: 'Elementos de Protección Personal (EPP)',
    origenSst: 'Entrega y Seguimiento de EPP (Hito 5)',
    proveedorSugerido: 'Dotaciones y Protección Integral S.A.',
    nitProveedor: '800.915.332-9',
    cantidadUnidad: '45 Kits',
    normaTecnica: 'ANSI Z87.1-2020 · ASTM F2413-18 · EN 374',
    especificacionesSST:
      'Lentes en policarbonato con filtro UV 99.9% antiempañante, puntera compuesta dieléctrica 18 kV y resistencia química a hidrocarburos y álcalis.',
    criteriosVerificados:
      'Sello grabado en el EPP, fichas técnicas por referencia y tallaje validado con el padrón de trabajadores.',
    tieneFdsSga: false,
    tieneCertificadoCalidad: true,
    dictamenSST: 'Aprobado para Compra',
    responsableEvaluacion: 'Responsable SG-SST',
    fechaEvaluacion: '2026-10-20',
  },
];

const INITIAL_CRITERIOS_MATRIZ: CriterioFamiliaItem[] = [
  {
    id: 'crit_1',
    familia: 'Elementos de Protección Personal (EPP)',
    normaAplicable: 'Ley 9/1979 Art. 122-124 · Res. 2400/1979 · ANSI Z87.1 / Z89.1 / ASTM F2413 / NIOSH',
    especificacionesMinimas:
      'Marcación indeleble del estándar internacional en el elemento, diseño anatómico compatible con otros EPP y materiales hipoalergénicos.',
    documentosExigidosProveedor:
      'Ficha técnica en español, certificado de laboratorio acreditado y guía de limpieza, almacenamiento y vida útil.',
    criterioAceptacionAlmacen:
      'Inspección visual de costuras/sellos, empaque original íntegro y lote vigente antes de ingresar al kardex de EPP.',
    responsableVerificacion: 'Responsable SG-SST y Almacenista',
    obligatorioAntesDeCompra: true,
  },
  {
    id: 'crit_2',
    familia: 'Sustancias Químicas e Insumos Peligrosos (SGA)',
    normaAplicable: 'Ley 55 de 1993 · Decreto 1496 de 2018 · Resolución 773 de 2021 (SGA)',
    especificacionesMinimas:
      'Envase original resistente a la sustancia con tapa de seguridad, etiqueta SGA en español (pictogramas, palabra de advertencia, frases H y P).',
    documentosExigidosProveedor:
      'Ficha de Datos de Seguridad (FDS) de 16 secciones en español con fecha de emisión menor a 5 años y Tarjeta de Emergencia NTC 4532.',
    criterioAceptacionAlmacen:
      'Rechazo inmediato en portería/almacén de envases reenvasados sin rótulo SGA o sin FDS de 16 secciones adjunta.',
    responsableVerificacion: 'Responsable SG-SST y Jefe de Bodega',
    obligatorioAntesDeCompra: true,
  },
  {
    id: 'crit_3',
    familia: 'Maquinaria, Equipos y Herramientas Motorizadas',
    normaAplicable: 'Resolución 2400 de 1979 · ISO 12100 · RETIE (Res. 90708)',
    especificacionesMinimas:
      'Guardas físicas en partes móviles/transmisión, botón de parada de emergencia tipo hongo, aislamiento eléctrico certificado y puntos para bloqueo LOTO.',
    documentosExigidosProveedor:
      'Manual de operación y mantenimiento en español, declaración de emisiones de ruido/vibración y certificado RETIE cuando aplique.',
    criterioAceptacionAlmacen:
      'Prueba preoperacional en vacío, verificación de guardas instaladas y entrega de lista de chequeo preoperacional.',
    responsableVerificacion: 'Jefe de Mantenimiento y Responsable SG-SST',
    obligatorioAntesDeCompra: true,
  },
  {
    id: 'crit_4',
    familia: 'Equipos de Protección Contra Caídas y Emergencias',
    normaAplicable: 'Resolución 4272 de 2021 · ANSI/ASSE Z359 · NTC 2885 (Extintores)',
    especificacionesMinimas:
      'Arneses, eslingas y líneas de vida con resistencia mínima de 5.000 lb (22.2 kN); extintores presurizados con manómetro y sello de seguridad.',
    documentosExigidosProveedor:
      'Certificado de conformidad de producto bajo norma técnica nacional/internacional y hoja de vida para trazabilidad de inspección anual.',
    criterioAceptacionAlmacen:
      'Verificación de etiqueta serial legible, ausencia de cortes o corrosión y registro inmediato en Hoja de Vida de Equipos.',
    responsableVerificacion: 'Coordinador de Trabajo en Alturas y Brigada SST',
    obligatorioAntesDeCompra: true,
  },
  {
    id: 'crit_5',
    familia: 'Vehículos, Repuestos Críticos e Insumos Viales (PESV)',
    normaAplicable: 'Resolución 20223040040595 de 2022 (PESV) · Ley 769 de 2002 · ISO 39001',
    especificacionesMinimas:
      'Repuestos genuinos u homologados para sistemas críticos (frenos, dirección, suspensión, llantas no regrabadas en dirección) y cintas reflectivas.',
    documentosMinimos: '',
    documentosExigidosProveedor:
      'Certificado de homologación de autopartes, garantía de fábrica y soporte técnico del proveedor de mantenimiento.',
    criterioAceptacionAlmacen:
      'Validación por el líder de flota PESV e inclusión en la hoja de vida del automotor antes de despacho a ruta.',
    responsableVerificacion: 'Líder del PESV y Mantenimiento Automotriz',
    obligatorioAntesDeCompra: true,
  } as CriterioFamiliaItem,
  {
    id: 'crit_6',
    familia: 'Mobiliario, Puestos de Trabajo y Ayudas Ergonómicas',
    normaAplicable: 'ISO 11226 · NTC 5693 · GATISO DME · Estudio de Puesto (EPT)',
    especificacionesMinimas:
      'Sillas con 5 ruedas, ajuste neumático de altura, soporte lumbar regulable y reposabrazos; ayudas mecánicas para cargas > 25 kg (hombres) / 12.5 kg (mujeres).',
    documentosExigidosProveedor:
      'Ficha ergonómica de dimensiones antropométricas, capacidad de carga certificada y garantía estructural.',
    criterioAceptacionAlmacen:
      'Verificación de estabilidad, regulaciones funcionales y conformidad frente a recomendaciones médicas ocupacionales.',
    responsableVerificacion: 'Responsable SG-SST y Talento Humano',
    obligatorioAntesDeCompra: true,
  },
];

function normalizeCompraItem(raw: any, idx: number): CompraItem {
  const rawDictamen = safeStr(raw?.dictamenSST || raw?.dictamen, 'Aprobado para Compra');
  let dictamenSST: DictamenCompraSST = 'Aprobado para Compra';
  if (/rechazad/i.test(rawDictamen)) {
    dictamenSST = 'Rechazado';
  } else if (/condicionad|ajuste|pendiente/i.test(rawDictamen)) {
    dictamenSST = 'Condicionado / Exige Ajuste';
  }

  const cat = safeStr(raw?.categoria, 'Elementos de Protección Personal (EPP)');
  return {
    id: safeStr(raw?.id, `comp_${Date.now()}_${idx}`),
    codigo: safeStr(raw?.codigo, `ADQ-2026-${String(idx + 1).padStart(3, '0')}`),
    productoServicio: safeStr(raw?.productoServicio || raw?.producto, 'Requerimiento técnico SST'),
    categoria: cat,
    origenSst: safeStr(
      raw?.origenEcosistema || raw?.origenSst || raw?.origenSST,
      cat.includes('Químic')
        ? 'Registro de Productos Químicos SGA (Hito 5)'
        : cat.includes('Alturas')
        ? 'Hoja de Vida de Equipos de Alturas (Hito 5)'
        : 'Entrega y Seguimiento de EPP (Hito 5)'
    ),
    proveedorSugerido: safeStr(raw?.proveedorSugerido || raw?.proveedor, 'Proveedor Homologado SST'),
    nitProveedor: safeStr(raw?.nitProveedor || raw?.nit, '900.000.000-1'),
    cantidadUnidad: safeStr(raw?.cantidadUnidad || raw?.cantidad, '1 Lote'),
    normaTecnica: safeStr(
      raw?.normaTecnica || raw?.norma,
      'Dec. 1072 Art. 2.2.4.6.27 · Res. 0312 Est. 2.9.1'
    ),
    especificacionesSST: safeStr(
      raw?.especificacionesSST || raw?.especificaciones,
      'Cumplimiento de especificaciones técnicas de seguridad y salud en el trabajo.'
    ),
    criteriosVerificados: safeStr(
      raw?.criteriosVerificados || raw?.criterios,
      'Verificación documental de ficha técnica y certificado de calidad.'
    ),
    tieneFdsSga: Boolean(
      raw?.tieneFdsSga ?? raw?.requiereFdsSga ?? cat.toLowerCase().includes('químic')
    ),
    tieneCertificadoCalidad: Boolean(
      raw?.tieneCertificadoCalidad ??
        raw?.requiereCertificadoCalidad ??
        dictamenSST === 'Aprobado para Compra'
    ),
    dictamenSST,
    responsableEvaluacion: safeStr(
      raw?.responsableEvaluacion || raw?.responsable,
      'Responsable SG-SST'
    ),
    fechaEvaluacion: safeStr(raw?.fechaEvaluacion, new Date().toISOString().split('T')[0]),
    sentToAcpm: Boolean(raw?.sentToAcpm || raw?.sentToKanban),
  };
}

function normalizeCriterioItem(raw: any, idx: number): CriterioFamiliaItem {
  return {
    id: safeStr(raw?.id, `crit_${Date.now()}_${idx}`),
    familia: safeStr(raw?.familia, 'Familia de Adquisición SST'),
    normaAplicable: safeStr(
      raw?.normaAplicable || raw?.normaExigida || raw?.norma,
      'Dec. 1072 Art. 2.2.4.6.27 · Res. 0312 Est. 2.9.1'
    ),
    especificacionesMinimas: safeStr(
      raw?.especificacionesMinimas || raw?.requisitosObligatorios || raw?.especificaciones,
      'Verificación previa de especificaciones técnicas SST.'
    ),
    documentosExigidosProveedor: safeStr(
      raw?.documentosExigidosProveedor || raw?.documentosRecepcion || raw?.documentosExigidos,
      'Ficha técnica en español y certificado de conformidad'
    ),
    criterioAceptacionAlmacen: safeStr(
      raw?.criterioAceptacionAlmacen || raw?.documentosRecepcion || raw?.criterioAceptacion,
      'Verificación física y documental al ingreso a almacén'
    ),
    responsableVerificacion: safeStr(
      raw?.responsableVerificacion || raw?.responsable,
      'Responsable SG-SST'
    ),
    obligatorioAntesDeCompra:
      raw?.obligatorioAntesDeCompra !== undefined ? Boolean(raw.obligatorioAntesDeCompra) : true,
  };
}

export const ComprasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [activeTab, setActiveTab] = useState<'compras' | 'criterios'>('compras');
  const [compras, setCompras] = useState<CompraItem[]>(INITIAL_COMPRAS);
  const [criteriosMatriz, setCriteriosMatriz] = useState<CriterioFamiliaItem[]>(INITIAL_CRITERIOS_MATRIZ);
  const [company, setCompany] = useState<any>(null);

  const [metrics, setMetrics] = useState<ComprasEcosystemMetrics>({
    diagnosticoScore: 88.5,
    estandar291Status: 'Cumple',
    eppEntregasCount: 18,
    eppSolicitudesPendientes: 2,
    permisosAlturasCount: 5,
    heightsEquiposCount: 8,
    quimicosCount: 12,
    quimicosFdsPct: 91.67,
    incompatibilidadesQuimicas: 3,
    vehiculosCount: 6,
    pesvRiesgosCount: 9,
    equiposEmergenciaCount: 14,
    totalPeligros: 22,
    peligrosCriticos: 4,
    auditoriaScore: 90,
    auditoriaNoConformidades: 1,
    acpmTotal: 10,
    acpmPending: 3,
  });

  // Filtros Pestaña 1
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('Todas');
  const [filterDictamen, setFilterDictamen] = useState<string>('todos');

  // Estados de carga / operaciones
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSuggestingAI, setIsSuggestingAI] = useState(false);
  const [isSendingAcpm, setIsSendingAcpm] = useState(false);
  const [sendingRowAcpmId, setSendingRowAcpmId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  // Formulario Crear / Editar Evaluación de Compra
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompraId, setEditingCompraId] = useState<string | null>(null);
  const [newProducto, setNewProducto] = useState('');
  const [newCategoria, setNewCategoria] = useState<string>('Elementos de Protección Personal (EPP)');
  const [newOrigenSst, setNewOrigenSst] = useState<string>('Entrega y Seguimiento de EPP (Hito 5)');
  const [newProveedor, setNewProveedor] = useState('');
  const [newNitProveedor, setNewNitProveedor] = useState('');
  const [newCantidadUnidad, setNewCantidadUnidad] = useState('10 Unidades');
  const [newNormaTecnica, setNewNormaTecnica] = useState('Dec. 1072 Art. 2.2.4.6.27 · Res. 0312 Est. 2.9.1');
  const [newEspecificaciones, setNewEspecificaciones] = useState('');
  const [newCriterios, setNewCriterios] = useState('');
  const [newTieneFdsSga, setNewTieneFdsSga] = useState(false);
  const [newTieneCertCalidad, setNewTieneCertCalidad] = useState(true);
  const [newDictamen, setNewDictamen] = useState<DictamenCompraSST>('Aprobado para Compra');
  const [newResponsableEval, setNewResponsableEval] = useState('Responsable SG-SST');
  const [newFechaEval, setNewFechaEval] = useState(() => new Date().toISOString().split('T')[0]);

  // Formulario Crear / Editar Familia de Especificaciones (Pestaña 2)
  const [isCriterioFormOpen, setIsCriterioFormOpen] = useState(false);
  const [editingCriterioId, setEditingCriterioId] = useState<string | null>(null);
  const [critFamilia, setCritFamilia] = useState('');
  const [critNorma, setCritNorma] = useState('');
  const [critEspecificaciones, setCritEspecificaciones] = useState('');
  const [critDocumentos, setCritDocumentos] = useState('');
  const [critAceptacion, setCritAceptacion] = useState('');
  const [critResponsable, setCritResponsable] = useState('Responsable SG-SST y Almacén');

  const navigateToModule = (moduleId: string) => {
    window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: moduleId } }));
  };

  const applyEcosystemMetrics = useCallback((em: any) => {
    if (!em || typeof em !== 'object') return;
    setMetrics((prev) => ({
      diagnosticoScore: round2(em.diagnosticoScore ?? em.score0312 ?? prev.diagnosticoScore),
      estandar291Status: safeStr(em.estandar291Status, 'Cumple'),
      eppEntregasCount: Number(
        em.eppEntregasCount ?? em.eppDeliveredCount ?? prev.eppEntregasCount ?? 0
      ),
      eppSolicitudesPendientes: Number(
        em.eppSolicitudesPendientes ?? em.eppSolicitudesCount ?? prev.eppSolicitudesPendientes ?? 0
      ),
      permisosAlturasCount: Number(
        em.permisosAlturasCount ?? em.heightsEquipmentCount ?? prev.permisosAlturasCount ?? 0
      ),
      heightsEquiposCount: Number(
        em.heightsEquiposCount ??
          em.heightsEquipmentCount ??
          em.permisosAlturasCount ??
          prev.heightsEquiposCount ??
          0
      ),
      quimicosCount: Number(
        em.quimicosCount ?? em.chemicalProductsCount ?? prev.quimicosCount ?? 0
      ),
      quimicosFdsPct: round2(
        em.quimicosFdsPct ?? em.fdsCompliancePct ?? prev.quimicosFdsPct ?? 100
      ),
      incompatibilidadesQuimicas: Number(
        em.incompatibilidadesQuimicas ??
          em.chemicalsMissingFdsCount ??
          prev.incompatibilidadesQuimicas ??
          0
      ),
      vehiculosCount: Number(em.vehiculosCount ?? em.vehiclesCount ?? prev.vehiculosCount ?? 0),
      pesvRiesgosCount: Number(em.pesvRiesgosCount ?? prev.pesvRiesgosCount ?? 0),
      equiposEmergenciaCount: Number(
        em.equiposEmergenciaCount ??
          em.emergencyEquipmentCount ??
          em.amenazasVulnerabilidadCount ??
          prev.equiposEmergenciaCount ??
          0
      ),
      totalPeligros: Number(
        em.totalPeligros ?? em.gtc45HazardsCount ?? em.peligrosGtc45 ?? prev.totalPeligros ?? 0
      ),
      peligrosCriticos: Number(em.peligrosCriticos ?? prev.peligrosCriticos ?? 0),
      auditoriaScore: round2(em.auditoriaScore ?? prev.auditoriaScore),
      auditoriaNoConformidades: Number(
        em.auditoriaNoConformidades ?? prev.auditoriaNoConformidades ?? 0
      ),
      acpmTotal: Number(
        em.acpmTotal ?? em.acpmComprasCount ?? em.acpmCount ?? prev.acpmTotal ?? 0
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
      const res = await fetch('/api/sgsst/compras/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.company) setCompany(data.company);
        if (Array.isArray(data.compras) && data.compras.length > 0) {
          setCompras(data.compras.map(normalizeCompraItem));
        }
        if (Array.isArray(data.criteriosMatriz) && data.criteriosMatriz.length > 0) {
          setCriteriosMatriz(data.criteriosMatriz.map(normalizeCriterioItem));
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
      console.warn('[Compras SST] Could not load saved data from backend:', err);
    }
  }, [token, applyEcosystemMetrics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useAutoLoadReport({
    token,
    tags: ['sgsst-compras', 'sgsst-compras-sst'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  // ─── GUARDAR EN MONGODB Y LOCALSTORAGE ─────────────────────────────────────
  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('wappy_iso45001_compras', JSON.stringify(compras));
      localStorage.setItem('wappy_iso45001_compras_criterios', JSON.stringify(criteriosMatriz));

      if (token) {
        const payloadCompras = compras.map((c) => ({
          ...c,
          origenEcosistema: c.origenSst,
          requiereFdsSga: c.tieneFdsSga,
          requiereCertificadoCalidad: c.tieneCertificadoCalidad,
          sentToKanban: Boolean(c.sentToAcpm),
        }));
        const payloadCriterios = criteriosMatriz.map((m) => ({
          ...m,
          normaExigida: m.normaAplicable,
          requisitosObligatorios: m.especificacionesMinimas,
          documentosRecepcion: m.documentosExigidosProveedor,
        }));
        const res = await fetch('/api/sgsst/compras/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            compras: payloadCompras,
            criteriosMatriz: payloadCriterios,
            lastGeneratedReport: editorContentRef.current || generatedReport || '',
            conversationId,
            messageId: reportMessageId,
          }),
        });
        if (!res.ok) {
          throw new Error('Error al guardar en la nube');
        }
      }

      showToast({
        message: 'Padrón de Compras y Matriz de Especificaciones SST guardados en MongoDB.',
        status: 'success',
      });
    } catch {
      showToast({
        message: 'Datos respaldados localmente.',
        status: 'success',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── SINCRONIZAR ECOSISTEMA 360° ───────────────────────────────────────────
  const handleSyncEcosystem = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sgsst/compras/sync-ecosystem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          compras,
          criteriosMatriz,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.compras) && data.compras.length > 0) {
          setCompras(data.compras.map(normalizeCompraItem));
        }
        if (Array.isArray(data.criteriosMatriz) && data.criteriosMatriz.length > 0) {
          setCriteriosMatriz(data.criteriosMatriz.map(normalizeCriterioItem));
        }
        if (data.ecosystemMetrics) {
          applyEcosystemMetrics(data.ecosystemMetrics);
        }
        showToast({
          message:
            data.message ||
            'Ecosistema 360° sincronizado: EPP, Sustancias Químicas SGA, Equipos de Alturas, Flota PESV y Matriz GTC 45 articulados.',
          status: 'success',
        });
      } else {
        throw new Error('Error en la sincronización');
      }
    } catch {
      showToast({
        message:
          'Métricas de EPP, Sustancias Químicas SGA, Equipos de Alturas, PESV y Estándar 2.9.1 sincronizadas.',
        status: 'success',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── SUGERIR CON WAPPY IA ──────────────────────────────────────────────────
  const handleAiSuggest = async () => {
    if (!token) return;
    setIsSuggestingAI(true);
    try {
      const res = await fetch('/api/sgsst/compras/ai-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          compras,
          criteriosMatriz,
          modelName: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.compras) && data.compras.length > 0) {
          setCompras(data.compras.map(normalizeCompraItem));
        }
        if (Array.isArray(data.criteriosMatriz) && data.criteriosMatriz.length > 0) {
          setCriteriosMatriz(data.criteriosMatriz.map(normalizeCriterioItem));
        }
        if (data.ecosystemMetrics) {
          applyEcosystemMetrics(data.ecosystemMetrics);
        }
        showToast({
          message:
            data.message ||
            'Wappy IA generó y auditó especificaciones técnicas de compras según Res. 0312 Est. 2.9.1 e ISO 45001 Cl. 8.1.4.1.',
          status: 'success',
        });
      } else {
        throw new Error('No se pudo obtener sugerencias de IA');
      }
    } catch (error: any) {
      showToast({
        message: error.message || 'Error al sugerir compras SST con Wappy IA.',
        status: 'error',
      });
    } finally {
      setIsSuggestingAI(false);
    }
  };

  // ─── ENVIAR A KANBAN ACPM (GLOBAL O INDIVIDUAL) ────────────────────────────
  const handleSendAcpm = async (targetItem?: CompraItem) => {
    if (!token) return;
    if (targetItem) {
      setSendingRowAcpmId(targetItem.id);
    } else {
      setIsSendingAcpm(true);
    }

    try {
      const itemsToSend = targetItem
        ? [targetItem]
        : compras.filter((c) => c.dictamenSST !== 'Aprobado para Compra');

      const res = await fetch('/api/sgsst/compras/send-acpm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          compras: itemsToSend.length > 0 ? itemsToSend : compras,
          item: targetItem || null,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (targetItem) {
          setCompras((prev) =>
            prev.map((c) => (c.id === targetItem.id ? { ...c, sentToAcpm: true } : c))
          );
        } else {
          setCompras((prev) =>
            prev.map((c) =>
              c.dictamenSST !== 'Aprobado para Compra' ? { ...c, sentToAcpm: true } : c
            )
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
            'Hallazgos y condicionamientos de Compras SST enviados al Tablero Kanban ACPM (Hito 7).',
          status: 'success',
        });
      } else {
        throw new Error('Error al enviar a ACPM');
      }
    } catch {
      showToast({
        message: 'No se pudo enviar al Tablero ACPM. Verifica tu conexión.',
        status: 'error',
      });
    } finally {
      setSendingRowAcpmId(null);
      setIsSendingAcpm(false);
    }
  };

  // ─── GENERAR INFORME OFICIAL CON IA ────────────────────────────────────────
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      let reportHtml = '';

      if (token) {
        const res = await fetch('/api/sgsst/compras/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            compras,
            criteriosMatriz,
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
        const rowsHtml = compras
          .map(
            (c) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${c.codigo}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">
              <strong>${c.productoServicio}</strong><br/>
              <span style="color: #64748b; font-size: 11px;">${c.categoria} · ${c.cantidadUnidad}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">
              <strong>${c.proveedorSugerido}</strong><br/>
              <span style="color: #64748b;">NIT: ${c.nitProveedor}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">
              <strong>${c.normaTecnica}</strong><br/>
              ${c.especificacionesSST}
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">
              ${c.criteriosVerificados}<br/>
              <span style="color: #0f766e; font-weight: bold;">
                ${c.tieneCertificadoCalidad ? '[Certificado OK] ' : ''}${c.tieneFdsSga ? '[FDS 16 Secc. SGA OK]' : ''}
              </span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold; color: ${
              c.dictamenSST === 'Aprobado para Compra'
                ? '#047857'
                : c.dictamenSST === 'Rechazado'
                ? '#b91c1c'
                : '#b45309'
            };">${c.dictamenSST}</td>
          </tr>`
          )
          .join('');

        const matrizHtml = criteriosMatriz
          .map(
            (m) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${m.familia}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${m.normaAplicable}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${m.especificacionesMinimas}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${m.documentosExigidosProveedor}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${m.criterioAceptacionAlmacen}</td>
          </tr>`
          )
          .join('');

        reportHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
            <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
              PROCEDIMIENTO Y DICTAMEN TÉCNICO DE COMPRAS Y ADQUISICIONES EN SST
            </h1>
            <p><strong>Empresa:</strong> ${safeStr(company?.companyName, 'Organización Activa')} · <strong>NIT:</strong> ${safeStr(company?.nit, 'N/A')}</p>
            <p><strong>Marco Normativo:</strong> Decreto 1072 de 2015 Art. 2.2.4.6.27 · Resolución 0312 de 2019 Estándar 2.9.1 · ISO 45001:2018 Cláusula 8.1.4.1</p>
            <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>

            <h2 style="color: #0f766e; margin-top: 24px;">1. Objeto y Alcance Normativo (Art. 2.2.4.6.27 y Estándar 2.9.1)</h2>
            <p>Establecer las especificaciones técnicas y de Seguridad y Salud en el Trabajo que deben cumplirse de forma obligatoria en la identificación, cotización, adquisición y recepción en almacén de productos, bienes, sustancias químicas, maquinaria, equipos de alturas/emergencias y elementos de protección personal (EPP), garantizando que ninguna compra introduzca peligros no controlados a los centros de trabajo.</p>

            <h2 style="color: #0f766e; margin-top: 24px;">2. Matriz de Especificaciones Técnicas SST por Familia de Adquisición</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
              <thead>
                <tr style="background-color: #0f766e; color: #ffffff;">
                  <th style="padding: 8px; border: 1px solid #0f766e;">Familia de Compra</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Norma Técnica Aplicable</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Especificaciones Mínimas SST</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Soportes Exigidos al Proveedor</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Recepción en Almacén</th>
                </tr>
              </thead>
              <tbody>${matrizHtml}</tbody>
            </table>

            <h2 style="color: #0f766e; margin-top: 24px;">3. Registro de Evaluaciones y Dictámenes Previos de Compras SST</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
              <thead>
                <tr style="background-color: #0f766e; color: #ffffff;">
                  <th style="padding: 8px; border: 1px solid #0f766e;">Código</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Producto / Servicio</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Proveedor & NIT</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Especificaciones SST</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Verificación Documental</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Dictamen SST</th>
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
        message: 'Procedimiento y Dictamen Técnico de Compras SST generado con éxito.',
        status: 'success',
      });
    } catch {
      showToast({ message: 'Error al generar el informe de Compras SST.', status: 'error' });
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

  // ─── CRUD EVALUACIONES DE COMPRA (PESTAÑA 1) ───────────────────────────────
  const resetCompraForm = () => {
    setEditingCompraId(null);
    setNewProducto('');
    setNewCategoria('Elementos de Protección Personal (EPP)');
    setNewOrigenSst('Entrega y Seguimiento de EPP (Hito 5)');
    setNewProveedor('');
    setNewNitProveedor('');
    setNewCantidadUnidad('10 Unidades');
    setNewNormaTecnica('Dec. 1072 Art. 2.2.4.6.27 · Res. 0312 Est. 2.9.1');
    setNewEspecificaciones('');
    setNewCriterios('');
    setNewTieneFdsSga(false);
    setNewTieneCertCalidad(true);
    setNewDictamen('Aprobado para Compra');
    setNewResponsableEval('Responsable SG-SST');
    setNewFechaEval(new Date().toISOString().split('T')[0]);
  };

  const handleSaveCompraForm = () => {
    if (!newProducto.trim() || !newEspecificaciones.trim()) {
      showToast({
        message: 'Completa el Producto/Servicio y las Especificaciones Técnicas SST.',
        status: 'warning',
      });
      return;
    }

    if (editingCompraId) {
      setCompras((prev) =>
        prev.map((c) =>
          c.id === editingCompraId
            ? {
                ...c,
                productoServicio: newProducto.trim(),
                categoria: newCategoria,
                origenSst: newOrigenSst,
                proveedorSugerido: newProveedor.trim() || 'Proveedor en homologación',
                nitProveedor: newNitProveedor.trim() || 'Por verificar',
                cantidadUnidad: newCantidadUnidad.trim() || '1 Lote',
                normaTecnica: newNormaTecnica.trim() || 'Res. 0312 Est. 2.9.1',
                especificacionesSST: newEspecificaciones.trim(),
                criteriosVerificados:
                  newCriterios.trim() || 'Verificación documental técnica de seguridad',
                tieneFdsSga: newTieneFdsSga,
                tieneCertificadoCalidad: newTieneCertCalidad,
                dictamenSST: newDictamen,
                responsableEvaluacion: newResponsableEval.trim() || 'Responsable SG-SST',
                fechaEvaluacion: newFechaEval,
              }
            : c
        )
      );
      showToast({ message: 'Evaluación de compra actualizada correctamente.', status: 'success' });
    } else {
      const nextCode = `ADQ-2026-${String(compras.length + 1).padStart(3, '0')}`;
      const newItem: CompraItem = {
        id: `comp_${Date.now()}`,
        codigo: nextCode,
        productoServicio: newProducto.trim(),
        categoria: newCategoria,
        origenSst: newOrigenSst,
        proveedorSugerido: newProveedor.trim() || 'Proveedor en homologación',
        nitProveedor: newNitProveedor.trim() || 'Por verificar',
        cantidadUnidad: newCantidadUnidad.trim() || '1 Lote',
        normaTecnica: newNormaTecnica.trim() || 'Res. 0312 Est. 2.9.1',
        especificacionesSST: newEspecificaciones.trim(),
        criteriosVerificados:
          newCriterios.trim() || 'Verificación documental técnica de seguridad',
        tieneFdsSga: newTieneFdsSga,
        tieneCertificadoCalidad: newTieneCertCalidad,
        dictamenSST: newDictamen,
        responsableEvaluacion: newResponsableEval.trim() || 'Responsable SG-SST',
        fechaEvaluacion: newFechaEval,
      };
      setCompras((prev) => [newItem, ...prev]);
      showToast({
        message: `Evaluación de compra ${newItem.codigo} registrada con éxito.`,
        status: 'success',
      });
    }

    resetCompraForm();
    setIsFormOpen(false);
  };

  const handleEditCompra = (item: CompraItem) => {
    setEditingCompraId(item.id);
    setNewProducto(item.productoServicio);
    setNewCategoria(item.categoria);
    setNewOrigenSst(item.origenSst);
    setNewProveedor(item.proveedorSugerido);
    setNewNitProveedor(item.nitProveedor);
    setNewCantidadUnidad(item.cantidadUnidad);
    setNewNormaTecnica(item.normaTecnica);
    setNewEspecificaciones(item.especificacionesSST);
    setNewCriterios(item.criteriosVerificados);
    setNewTieneFdsSga(item.tieneFdsSga);
    setNewTieneCertCalidad(item.tieneCertificadoCalidad);
    setNewDictamen(item.dictamenSST);
    setNewResponsableEval(item.responsableEvaluacion);
    setNewFechaEval(item.fechaEvaluacion);
    setIsFormOpen(true);
    setActiveTab('compras');
  };

  const handleInlineDictamenChange = (id: string, nextDictamen: DictamenCompraSST) => {
    setCompras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, dictamenSST: nextDictamen } : c))
    );
  };

  const handleToggleCheck = (id: string, field: 'tieneFdsSga' | 'tieneCertificadoCalidad') => {
    setCompras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: !c[field] } : c))
    );
  };

  const handleDeleteCompra = (id: string) => {
    setCompras((prev) => prev.filter((c) => c.id !== id));
    showToast({ message: 'Registro de compra eliminado.', status: 'info' });
  };

  // ─── CRUD MATRIZ DE ESPECIFICACIONES POR FAMILIA (PESTAÑA 2) ───────────────
  const handleSaveCriterio = () => {
    if (!critFamilia.trim() || !critEspecificaciones.trim()) {
      showToast({
        message: 'Indica la Familia de Compra y sus Especificaciones Mínimas SST.',
        status: 'warning',
      });
      return;
    }

    if (editingCriterioId) {
      setCriteriosMatriz((prev) =>
        prev.map((m) =>
          m.id === editingCriterioId
            ? {
                ...m,
                familia: critFamilia.trim(),
                normaAplicable: critNorma.trim() || 'Dec. 1072 Art. 2.2.4.6.27 · Res. 0312 Est. 2.9.1',
                especificacionesMinimas: critEspecificaciones.trim(),
                documentosExigidosProveedor:
                  critDocumentos.trim() || 'Ficha técnica y certificado de conformidad',
                criterioAceptacionAlmacen:
                  critAceptacion.trim() || 'Inspección técnica de ingreso en almacén',
                responsableVerificacion: critResponsable.trim() || 'Responsable SG-SST',
              }
            : m
        )
      );
      showToast({ message: 'Familia técnica SST actualizada.', status: 'success' });
    } else {
      const newCrit: CriterioFamiliaItem = {
        id: `crit_${Date.now()}`,
        familia: critFamilia.trim(),
        normaAplicable: critNorma.trim() || 'Dec. 1072 Art. 2.2.4.6.27 · Res. 0312 Est. 2.9.1',
        especificacionesMinimas: critEspecificaciones.trim(),
        documentosExigidosProveedor:
          critDocumentos.trim() || 'Ficha técnica y certificado de conformidad',
        criterioAceptacionAlmacen:
          critAceptacion.trim() || 'Inspección técnica de ingreso en almacén',
        responsableVerificacion: critResponsable.trim() || 'Responsable SG-SST',
        obligatorioAntesDeCompra: true,
      };
      setCriteriosMatriz((prev) => [...prev, newCrit]);
      showToast({ message: 'Nueva familia de especificaciones SST agregada.', status: 'success' });
    }

    setEditingCriterioId(null);
    setCritFamilia('');
    setCritNorma('');
    setCritEspecificaciones('');
    setCritDocumentos('');
    setCritAceptacion('');
    setIsCriterioFormOpen(false);
  };

  const handleEditCriterio = (item: CriterioFamiliaItem) => {
    setEditingCriterioId(item.id);
    setCritFamilia(item.familia);
    setCritNorma(item.normaAplicable);
    setCritEspecificaciones(item.especificacionesMinimas);
    setCritDocumentos(item.documentosExigidosProveedor);
    setCritAceptacion(item.criterioAceptacionAlmacen);
    setCritResponsable(item.responsableVerificacion);
    setIsCriterioFormOpen(true);
  };

  const handleDeleteCriterio = (id: string) => {
    setCriteriosMatriz((prev) => prev.filter((m) => m.id !== id));
    showToast({ message: 'Familia técnica eliminada de la matriz.', status: 'info' });
  };

  // ─── MÉTRICAS DERIVADAS Y FILTRADO ─────────────────────────────────────────
  const countAprobados = compras.filter((c) => c.dictamenSST === 'Aprobado para Compra').length;
  const countCondicionadas = compras.filter((c) => c.dictamenSST !== 'Aprobado para Compra').length;
  const pctAprobadas = compras.length > 0 ? round2((countAprobados / compras.length) * 100) : 100;

  const filteredCompras = compras.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      `${c.codigo} ${c.productoServicio} ${c.proveedorSugerido} ${c.normaTecnica} ${c.especificacionesSST}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesCat =
      filterCategoria === 'Todas' ||
      safeStr(c.categoria).toLowerCase() === filterCategoria.toLowerCase();
    const matchesDictamen =
      filterDictamen === 'todos' ||
      safeStr(c.dictamenSST).toLowerCase() === filterDictamen.toLowerCase();
    return matchesSearch && matchesCat && matchesDictamen;
  });

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* ─── HERO HEADER UNIFICADO COMPRAS SST (WAPPY 14-GROUP DESIGN SYSTEM) ─── */}
      <SGSSTHeroHeader
        categoryId="compras_sst"
        companyName={company?.companyName}
        icon={<ShoppingBag className="h-7 w-7" />}
        title="Compras y Adquisiciones en SST"
        badges={
          <>
            <div
              title={`${compras.length} Adquisiciones Evaluadas en SST (${pctAprobadas}% aprobadas)`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {compras.length} Evaluadas ({pctAprobadas}% Aprobadas)
                </span>
              </div>
            </div>

            <div
              title={`${countAprobados} Aprobadas · ${countCondicionadas} Condicionadas/Rechazadas`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 sm:px-2.5 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {countAprobados} Aprobadas · {countCondicionadas} Por Ajustar
                </span>
              </div>
            </div>

            <div
              title={`${criteriosMatriz.length} Familias Técnicas con Especificaciones SST`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 px-2 sm:px-2.5 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {criteriosMatriz.length} Familias Técnicas SST
                </span>
              </div>
            </div>

            <SGSSTLegalBadge
              standardCode="2.9.1"
              label="Res. 0312 Est. 2.9.1 · Dec. 1072 Art. 2.2.4.6.27 · ISO 45001 Cl. 8.1.4.1: CUMPLE"
              tooltip="Resolución 0312 de 2019 Estándar 2.9.1 (Identificación y evaluación de especificaciones en compras) · Decreto 1072 de 2015 Art. 2.2.4.6.27 · ISO 45001:2018 Cláusula 8.1.4.1"
              moduleName="Compras y Adquisiciones en SST"
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
              disabled={isSuggestingAI}
              variant="purple"
              icon={<Sparkles className={`h-4 w-4 ${isSuggestingAI ? 'animate-pulse' : ''}`} />}
              label="Sugerir con Wappy IA"
            />
            <ExpandableButton
              onClick={() => {
                if (isFormOpen) {
                  resetCompraForm();
                  setIsFormOpen(false);
                } else {
                  setActiveTab('compras');
                  setIsFormOpen(true);
                }
              }}
              variant="emerald"
              icon={<Plus className="h-4 w-4" />}
              label={isFormOpen ? 'Cerrar Formulario' : 'Nueva Evaluación'}
            />
            <ExpandableButton
              onClick={() => handleSendAcpm()}
              disabled={isSendingAcpm}
              variant="amber"
              icon={<Trello className="h-4 w-4" />}
              label="Enviar a ACPM"
              title="Derivar compras condicionadas o rechazadas al Tablero Kanban ACPM"
            />
            <ExpandableButton
              onClick={handleSaveData}
              disabled={isSaving}
              variant="teal"
              icon={<Save className="h-4 w-4" />}
              label="Guardar en Nube"
            />
          </>
        }
      />

      {/* ─── RADAR DE ECOSISTEMA DE COMPRAS 360° «SOMOS SST» (5 TARJETAS GLASSMORPHISM) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Adquisiciones Evaluadas */}
        <div
          onClick={() => setActiveTab('compras')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              1. Adquisiciones Evaluadas
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{compras.length}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {pctAprobadas}% Aprobadas
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{countAprobados}</strong> aprobadas · <strong>{countCondicionadas}</strong> condicionadas/rechazadas
          </p>
        </div>

        {/* 2. Dotación EPP & Alturas (Hito 5) */}
        <div
          onClick={() => navigateToModule('epp_delivery')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              2. Dotación EPP & Alturas
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{metrics.eppEntregasCount}</span>
            <span className="text-xs font-bold text-text-secondary">entregas EPP</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{metrics.eppSolicitudesPendientes}</strong> solicitudes · <strong>{metrics.heightsEquiposCount}</strong> equipos alturas ANSI Z359
          </p>
        </div>

        {/* 3. Sustancias Químicas SGA (Hito 1 y 5) */}
        <div
          onClick={() => navigateToModule('chemical_registry')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              3. Sustancias Químicas SGA
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{metrics.quimicosCount}</span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              {round2(metrics.quimicosFdsPct)}% FDS 16 Secc.
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            Dec. 1496/18 SGA · <strong>{metrics.incompatibilidadesQuimicas}</strong> alertas de segregación
          </p>
        </div>

        {/* 4. Flota PESV, Emergencias & GTC 45 */}
        <div
          onClick={() => navigateToModule('vehicles_pesv')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              4. Flota PESV & GTC 45
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{metrics.vehiculosCount}</span>
            <span className="text-xs font-bold text-text-secondary">vehículos PESV</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{metrics.equiposEmergenciaCount}</strong> eq. emergencia · <strong>{metrics.totalPeligros}</strong> peligros GTC 45
          </p>
        </div>

        {/* 5. Estándar 2.9.1, Auditoría & ACPM */}
        <div
          onClick={() => navigateToModule('control_acpm')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              5. Est. 2.9.1 & ACPM
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">
              {round2(metrics.diagnosticoScore)}%
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Est. 2.9.1 {metrics.estandar291Status}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            Auditoría {round2(metrics.auditoriaScore)}% · <strong>{metrics.acpmPending}</strong>/{metrics.acpmTotal} planes ACPM
          </p>
        </div>
      </div>

      {/* ─── SELECTOR DE PESTAÑAS OPERATIVAS ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('compras')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'compras'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500/40 text-teal-600 dark:text-teal-300 font-bold'
                : 'text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>1. Evaluación y Dictamen SST de Compras ({compras.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('criterios')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'criterios'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500/40 text-teal-600 dark:text-teal-300 font-bold'
                : 'text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Matriz de Especificaciones Técnicas SST por Familia ({criteriosMatriz.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'criterios' && (
            <ExpandableButton
              onClick={() => {
                setEditingCriterioId(null);
                setCritFamilia('');
                setCritNorma('');
                setCritEspecificaciones('');
                setCritDocumentos('');
                setCritAceptacion('');
                setIsCriterioFormOpen(!isCriterioFormOpen);
              }}
              variant="emerald"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              label={isCriterioFormOpen ? 'Cerrar Familia' : 'Añadir Familia Técnica'}
            />
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PESTAÑA 1: EVALUACIÓN Y DICTAMEN SST DE COMPRAS
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'compras' && (
        <div className="space-y-4">
          {/* FORMULARIO DE CREACIÓN / EDICIÓN COMPLETA */}
          {isFormOpen && (
            <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/80 backdrop-blur-md shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
                <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-teal-500" />
                  {editingCompraId
                    ? 'Editar Evaluación y Dictamen Técnico de Compra SST'
                    : 'Registrar Nueva Evaluación Previa de Compra SST'}
                </h3>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  Dec. 1072 Art. 2.2.4.6.27 · Res. 0312 Est. 2.9.1 · ISO 45001 Cl. 8.1.4.1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Producto / Servicio / Insumo a Adquirir *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Caretas de soldadura fotosensibles ANSI Z87.1+ / Solvente dieléctrico SGA..."
                    value={newProducto}
                    onChange={(e) => setNewProducto(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Categoría de Compra
                  </label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    {COMPRA_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Origen del Ecosistema SST
                  </label>
                  <select
                    value={newOrigenSst}
                    onChange={(e) => setNewOrigenSst(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    {ORIGEN_ECOSISTEMA_OPTIONS.map((orig) => (
                      <option key={orig} value={orig}>
                        {orig}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Proveedor Sugerido
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Seguridad Industrial S.A.S."
                    value={newProveedor}
                    onChange={(e) => setNewProveedor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    NIT del Proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 900.412.889-1"
                    value={newNitProveedor}
                    onChange={(e) => setNewNitProveedor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Cantidad / Unidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 25 Unidades / 50 Galones"
                    value={newCantidadUnidad}
                    onChange={(e) => setNewCantidadUnidad(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Norma Técnica Exigida
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: ANSI Z87.1 / Dec. 1496 SGA / Res. 4272"
                    value={newNormaTecnica}
                    onChange={(e) => setNewNormaTecnica(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Especificaciones Técnicas SST Requeridas *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe las condiciones técnicas, ergonómicas, de seguridad o rotulado exigidas antes de comprar..."
                    value={newEspecificaciones}
                    onChange={(e) => setNewEspecificaciones(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Criterios y Soportes Verificados
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ficha técnica en español, certificado de conformidad ONAC/ANSI, FDS de 16 secciones, prueba en campo..."
                    value={newCriterios}
                    onChange={(e) => setNewCriterios(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center pt-1">
                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newTieneCertCalidad}
                      onChange={(e) => setNewTieneCertCalidad(e.target.checked)}
                      className="rounded border-teal-500 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Certificado de Calidad / Conformidad</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newTieneFdsSga}
                      onChange={(e) => setNewTieneFdsSga(e.target.checked)}
                      className="rounded border-cyan-500 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>FDS 16 Secciones SGA (Dec. 1496/18)</span>
                  </label>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Dictamen SST
                  </label>
                  <select
                    value={newDictamen}
                    onChange={(e) => setNewDictamen(e.target.value as DictamenCompraSST)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-bold"
                  >
                    <option value="Aprobado para Compra">Aprobado para Compra</option>
                    <option value="Condicionado / Exige Ajuste">Condicionado / Exige Ajuste</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 sm:pt-0">
                  <ExpandableButton
                    onClick={() => {
                      resetCompraForm();
                      setIsFormOpen(false);
                    }}
                    variant="neutral"
                    size="sm"
                    icon={<X className="h-4 w-4" />}
                    label="Cancelar"
                  />
                  <ExpandableButton
                    onClick={handleSaveCompraForm}
                    variant="teal"
                    size="sm"
                    icon={<Check className="h-4 w-4" />}
                    label={editingCompraId ? 'Actualizar Dictamen' : 'Emitir Dictamen'}
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
                  placeholder="Buscar producto, proveedor, código o norma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                />
              </div>

              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-medium"
              >
                {COMPRA_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Todas' ? 'Todas las categorías' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-text-tertiary mr-1" />
              {(['todos', 'Aprobado para Compra', 'Condicionado / Exige Ajuste', 'Rechazado'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterDictamen(st)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      filterDictamen === st
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

          {/* TABLA DE EVALUACIÓN DE COMPRAS SST */}
          <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/60 backdrop-blur-sm shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/80 text-text-secondary uppercase text-[10px] tracking-wider font-bold border-b border-border-light dark:border-white/10">
                <tr>
                  <th className="p-3">Código & Fecha</th>
                  <th className="p-3">Producto / Servicio & Origen SST</th>
                  <th className="p-3">Proveedor & Cantidad</th>
                  <th className="p-3">Norma & Especificaciones SST</th>
                  <th className="p-3 text-center">Soportes Técnicos</th>
                  <th className="p-3 text-center">Dictamen SST</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {filteredCompras.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary">
                      No se encontraron evaluaciones de compra con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredCompras.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="p-3 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          {c.codigo}
                        </div>
                        <div className="text-[10px] text-text-tertiary mt-0.5">
                          {c.fechaEvaluacion}
                        </div>
                      </td>

                      <td className="p-3 align-top max-w-xs">
                        <div className="font-bold text-text-primary leading-snug">
                          {c.productoServicio}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                            {c.categoria}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-surface-secondary text-text-secondary border border-border-light dark:border-white/10">
                            {c.origenSst}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 align-top whitespace-nowrap">
                        <div className="font-bold text-text-primary text-[11px]">
                          {c.proveedorSugerido}
                        </div>
                        <div className="text-[10px] text-text-tertiary">NIT: {c.nitProveedor}</div>
                        <div className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5">
                          Cant: {c.cantidadUnidad}
                        </div>
                      </td>

                      <td className="p-3 align-top max-w-sm">
                        <div className="text-[10px] font-extrabold text-teal-700 dark:text-teal-300 mb-0.5">
                          {c.normaTecnica}
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          {c.especificacionesSST}
                        </p>
                        {c.criteriosVerificados && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                            ✓ {c.criteriosVerificados}
                          </p>
                        )}
                      </td>

                      <td className="p-3 align-top text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCheck(c.id, 'tieneCertificadoCalidad')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              c.tieneCertificadoCalidad
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-500/10 text-text-tertiary border-border-light'
                            }`}
                            title="Clic para alternar verificación de Certificado de Calidad"
                          >
                            {c.tieneCertificadoCalidad ? '✓ Cert. Calidad' : '○ Sin Cert. Calidad'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCheck(c.id, 'tieneFdsSga')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              c.tieneFdsSga
                                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                                : 'bg-slate-500/10 text-text-tertiary border-border-light'
                            }`}
                            title="Clic para alternar verificación de FDS 16 Secciones SGA"
                          >
                            {c.tieneFdsSga ? '✓ FDS 16 Secc. SGA' : '○ FDS N/A o Pend.'}
                          </button>
                        </div>
                      </td>

                      <td className="p-3 align-top text-center">
                        <select
                          value={c.dictamenSST}
                          onChange={(e) =>
                            handleInlineDictamenChange(c.id, e.target.value as DictamenCompraSST)
                          }
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer outline-none ${
                            c.dictamenSST === 'Aprobado para Compra'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : c.dictamenSST === 'Rechazado'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <option value="Aprobado para Compra">Aprobado para Compra</option>
                          <option value="Condicionado / Exige Ajuste">Condicionado / Exige Ajuste</option>
                          <option value="Rechazado">Rechazado</option>
                        </select>
                      </td>

                      <td className="p-3 align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          <ExpandableButton
                            size="sm"
                            variant="orange"
                            onClick={() => handleEditCompra(c)}
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            label="Editar"
                          />
                          {c.dictamenSST !== 'Aprobado para Compra' && (
                            <ExpandableButton
                              size="sm"
                              variant="amber"
                              disabled={sendingRowAcpmId === c.id}
                              onClick={() => handleSendAcpm(c)}
                              icon={<Trello className="h-3.5 w-3.5" />}
                              label={c.sentToAcpm ? 'En ACPM' : 'ACPM'}
                              title="Enviar hallazgo de compra a Kanban ACPM"
                            />
                          )}
                          <ExpandableButton
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteCompra(c.id)}
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
          PESTAÑA 2: MATRIZ DE ESPECIFICACIONES TÉCNICAS SST POR FAMILIA
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'criterios' && (
        <div className="space-y-4">
          {isCriterioFormOpen && (
            <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/80 backdrop-blur-md shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
                <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-500" />
                  {editingCriterioId
                    ? 'Editar Familia de Especificaciones Técnicas SST'
                    : 'Añadir Familia de Especificaciones Técnicas SST'}
                </h3>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  Res. 0312 Estándar 2.9.1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Familia de Adquisición *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Equipos de Izaje y Aparejos..."
                    value={critFamilia}
                    onChange={(e) => setCritFamilia(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Normativa Técnica Aplicable
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: ASME B30 · Res. 2400 de 1979"
                    value={critNorma}
                    onChange={(e) => setCritNorma(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Responsable de Verificación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Responsable SG-SST y Almacén"
                    value={critResponsable}
                    onChange={(e) => setCritResponsable(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Especificaciones Mínimas SST *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Requisitos técnicos de seguridad para autorizar la orden de compra..."
                    value={critEspecificaciones}
                    onChange={(e) => setCritEspecificaciones(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Documentos Exigidos al Proveedor
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Certificados, fichas técnicas, FDS 16 secciones..."
                    value={critDocumentos}
                    onChange={(e) => setCritDocumentos(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Criterio de Aceptación en Almacén
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Inspección física de recepción antes de dar ingreso a inventario..."
                    value={critAceptacion}
                    onChange={(e) => setCritAceptacion(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <ExpandableButton
                  size="sm"
                  variant="neutral"
                  onClick={() => setIsCriterioFormOpen(false)}
                  icon={<X className="h-4 w-4" />}
                  label="Cancelar"
                />
                <ExpandableButton
                  size="sm"
                  variant="teal"
                  onClick={handleSaveCriterio}
                  icon={<Check className="h-4 w-4" />}
                  label={editingCriterioId ? 'Actualizar Familia' : 'Guardar Familia'}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criteriosMatriz.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-text-primary">{item.familia}</h4>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-xl text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                        {item.normaAplicable}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <ExpandableButton
                        size="sm"
                        variant="orange"
                        onClick={() => handleEditCriterio(item)}
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        label="Editar"
                      />
                      <ExpandableButton
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteCriterio(item.id)}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Eliminar"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-surface-secondary/60 border border-border-light dark:border-white/5">
                      <span className="font-bold text-text-primary block text-[11px]">
                        Especificaciones Mínimas de Seguridad:
                      </span>
                      <span className="text-text-secondary text-[11px]">
                        {item.especificacionesMinimas}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-secondary/60 border border-border-light dark:border-white/5">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-[11px]">
                        Soportes Exigidos al Proveedor:
                      </span>
                      <span className="text-text-secondary text-[11px]">
                        {item.documentosExigidosProveedor}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-secondary/60 border border-border-light dark:border-white/5">
                      <span className="font-bold text-cyan-700 dark:text-cyan-300 block text-[11px]">
                        Recepción e Inspección en Almacén:
                      </span>
                      <span className="text-text-secondary text-[11px]">
                        {item.criterioAceptacionAlmacen}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-white/10 text-[11px] text-text-tertiary">
                  <span>Verifica: {item.responsableVerificacion}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Obligatorio Pre-Compra
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── HISTORIAL DE REPORTES ─── */}
      <ReportHistory
        onSelectReport={handleSelectReportFromHistory}
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-compras', 'sgsst-compras-sst']}
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
        exportFileName={`Procedimiento_Compras_Adquisiciones_SST_${safeStr(company?.companyName, 'ISO45001')}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Procedimiento y Dictamen Técnico de Compras SST (Res. 0312 Est. 2.9.1 · Dec. 1072 Art. 2.2.4.6.27)"
        icon={<ShoppingBag className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName={`Procedimiento_Compras_SST_${safeStr(company?.companyName, 'ISO45001')}`}
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
            reportSourceData={{ compras, criteriosMatriz, company }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default ComprasWorkspace;
