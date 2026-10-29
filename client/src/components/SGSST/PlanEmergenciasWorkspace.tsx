import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FileText,
  Building2,
  RefreshCw,
  Pencil,
  Send,
  Loader2,
  Compass,
  Stethoscope,
  Trello,
  X,
  ExternalLink,
  GraduationCap,
  ClipboardCheck,
  UserCheck,
  Award,
  HardHat,
  HeartPulse,
  Flame,
  Siren,
  Users,
  PhoneCall,
  MapPin,
  FileCheck2,
  CalendarClock,
  Activity,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExpandableButton from '~/components/Common/ExpandableButton';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import CollapsibleReportBox from './CollapsibleReportBox';
import { useAutoLoadReport } from './useAutoLoadReport';

export interface SedeData {
  nombreSede: string;
  ciudad: string;
  direccion: string;
  telefonoEmergencia: string;
  horarioOperacion: string;
  trabajadoresFijos: number;
  contratistasFlotantes: number;
  visitantesPromedio: number;
  construccionTipo: string;
  puntoEncuentroPrincipal: string;
  puntoEncuentroAlterno: string;
  rutasEvacuacionDesc: string;
  sistemaAlarma: string;
  clinicaMedevac: string;
  direccionClinica: string;
  tiempoTrasladoMedevac: string;
  ambulanciaContacto: string;
  arlNombre: string;
  arlLineaEmergencia: string;
}

export interface EscenarioAmenaza {
  id: string;
  amenaza: string;
  tipo: 'Natural' | 'Tecnológica' | 'Social';
  origenSst: string;
  calificacionDiamante: 'Inminente' | 'Probable' | 'Posible';
  nivelVulnerabilidad: 'Alta' | 'Media' | 'Baja';
  riesgoGlobal: 'Alto' | 'Medio' | 'Bajo';
  areaAfectada: string;
  medidasPrevencion: string;
  medidasMitigacion: string;
  responsable: string;
  sentToKanban?: boolean;
}

export interface EstructuraSciItem {
  id: string;
  rolSci: string;
  nombreAsignado: string;
  cargoEmpresa: string;
  telefonoContacto: string;
  especialidadBrigada: string;
  funcionesAntes: string;
  funcionesDurante: string;
  funcionesDespues: string;
  origenSst?: string;
}

export interface ProcedimientoPon {
  id: string;
  codigo: string;
  tituloEscenario: string;
  amenazaAsociada: string;
  faseAntes: string;
  faseDurante: string;
  faseDespues: string;
  recursosNecesarios: string;
  responsableOperativo: string;
  estado: 'Vigente' | 'En Revisión' | 'En Simulacro';
  sentToKanban?: boolean;
}

export interface RecursoEquipo {
  id: string;
  tipoRecurso:
    | 'Extintor'
    | 'Botiquín'
    | 'Camilla'
    | 'Alarma / Detección'
    | 'Gabinete / Hidrante'
    | 'Kit Derrames SGA'
    | 'Señalización / Iluminación';
  descripcion: string;
  ubicacion: string;
  cantidad: number;
  estado: 'Operativo' | 'Por Recargar / Mantenimiento' | 'Proyectado';
  fechaInspeccion: string;
  responsable: string;
  origenSst?: string;
}

export interface DirectorioExterno {
  id: string;
  entidad: string;
  lineaTelefonica: string;
  direccionDistancia: string;
  tipoApoyo: string;
  tiempoRespuestaEstimado: string;
}

export interface SimulacroPlan {
  id: string;
  tituloSimulacro: string;
  escenario: string;
  fechaProgramada: string;
  participantesEsperados: number;
  tiempoRespuestaMeta: string;
  estado: 'Programado' | 'Ejecutado' | 'Evaluado';
  hallazgosMejora: string;
  responsable: string;
  sentToKanban?: boolean;
}

interface EcosystemMetrics {
  diagnosticoScore: number;
  totalWorkers: number;
  totalCargos: number;
  avgFitScore: number;
  workersWithFitAlerts: number;
  totalPeligros: number;
  peligrosCriticos: number;
  legalTotal: number;
  legalNoCumple: number;
  pesvRiesgosCount: number;
  vehiculosCount: number;
  quimicosCount: number;
  incompatibilidadesQuimicas: number;
  vulnerabilidadAmenazasCount: number;
  brigadistasCount: number;
  comitesActivos: number;
  capacitacionesTotal: number;
  capacitacionesEjecutadas: number;
  capacitacionesCompliancePct: number;
  auditoriaScore: number;
  auditoriaNoConformidades: number;
  altaDireccionCumple: number;
  altaDireccionTotalItems: number;
  altaDireccionCompromisosPendientes: number;
  permisosAlturasCount: number;
  atsCount: number;
  eppCount: number;
  kanbanPending: number;
  kanbanTotal: number;
  escenariosCount?: number;
  sciCount?: number;
  ponCount?: number;
  recursosCount?: number;
  simulacrosCount?: number;
}

const DEFAULT_SEDE_DATA: SedeData = {
  nombreSede: 'Sede Principal Operativa y Administrativa',
  ciudad: 'Medellín, Antioquia',
  direccion: 'Instalación Principal Corporativa',
  telefonoEmergencia: 'Línea 123 / Recepción SST',
  horarioOperacion: 'Lunes a Sábado 7:00 a.m. - 5:30 p.m.',
  trabajadoresFijos: 15,
  contratistasFlotantes: 4,
  visitantesPromedio: 6,
  construccionTipo:
    'Estructura sismorresistente en concreto reforzado, mampostería confinada, cubierta liviana y redes eléctricas entubadas.',
  puntoEncuentroPrincipal:
    'Punto de Encuentro N° 1: Zona exterior despejada frente al acceso principal (señalizada NTC 1461).',
  puntoEncuentroAlterno:
    'Punto de Encuentro N° 2: Plazoleta / Parqueadero externo a más de 50 metros de líneas de media tensión.',
  rutasEvacuacionDesc:
    'Pasillos principales libres de obstáculos con señalización fotoluminiscente NTC 1461, lámparas de emergencia autónomas y puertas con apertura hacia el exterior.',
  sistemaAlarma:
    'Sirena acústica-estroboscópica codificada (1 tono intermitente: Alerta y alistamiento · 1 tono continuo: Evacuación inmediata) + Silbatos de brigadistas.',
  clinicaMedevac: 'Hospital Pablo Tobón Uribe / Clínica Las Américas Auna',
  direccionClinica: 'Red Hospitalaria de Urgencias y Trauma de Alta Complejidad',
  tiempoTrasladoMedevac: '10 a 15 minutos en ambulancia medicalizada (TAB/TAM)',
  ambulanciaContacto: 'Línea Única 123 / Asistencia Médica ARL 24/7',
  arlNombre: 'ARL SURA / Positiva',
  arlLineaEmergencia: '01 8000 511 414 / Línea Directa Urgencias ATEL 24/7',
};

const DUMMY_ESCENARIOS: EscenarioAmenaza[] = [
  {
    id: 'am_dummy_1',
    amenaza: 'Sismo o Terremoto de Magnitud Moderada a Fuerte (Amenaza Sísmica)',
    tipo: 'Natural',
    origenSst: 'Análisis de Vulnerabilidad (Diamante)',
    calificacionDiamante: 'Probable',
    nivelVulnerabilidad: 'Media',
    riesgoGlobal: 'Alto',
    areaAfectada: 'Toda la instalación operativa, bodegas y oficinas administrativas',
    medidasPrevencion:
      'Anclaje de estanterías y gabinetes a muros portantes, película de seguridad en vidrios e inspección estructural anual NSR-10.',
    medidasMitigacion:
      'Protección durante el sismo (Agacharse, Cubrirse y Sujetarse), corte de suministro eléctrico/gas y evacuación ordenada hacia Punto de Encuentro N° 1.',
    responsable: 'Comandante del Incidente / Líder Brigada de Evacuación',
    sentToKanban: false,
  },
  {
    id: 'am_dummy_2',
    amenaza: 'Incendio Estructural, Cortocircuito Eléctrico o Conato en Almacenamiento',
    tipo: 'Tecnológica',
    origenSst: 'Matriz GTC-45 & Equipos de Emergencia',
    calificacionDiamante: 'Probable',
    nivelVulnerabilidad: 'Media',
    riesgoGlobal: 'Alto',
    areaAfectada: 'Cuartos eléctricos, almacén de insumos, oficinas y planta operativa',
    medidasPrevencion:
      'Mantenimiento preventivo RETIE, termografía de tableros eléctricos, orden y aseo y recarga anual de extintores ABC y Solkaflam.',
    medidasMitigacion:
      'Ataque inicial del conato con extintor portátil por brigadistas contraincendios, desenergización del circuito y enlace con Bomberos (119).',
    responsable: 'Líder Brigada Contraincendios / Responsable SG-SST',
    sentToKanban: false,
  },
  {
    id: 'am_dummy_3',
    amenaza: 'Derrame, Fuga o Reacción de Sustancias Químicas Peligrosas (SGA Dec. 1496)',
    tipo: 'Tecnológica',
    origenSst: 'Matriz de Compatibilidad Química SGA',
    calificacionDiamante: 'Probable',
    nivelVulnerabilidad: 'Media',
    riesgoGlobal: 'Medio',
    areaAfectada: 'Bodega de almacenamiento químico y frentes de dosificación/limpieza',
    medidasPrevencion:
      'Segregación según matriz SGA, diques de contención secundaria, disponibilidad de FDS de 16 secciones y ventilación cruzada.',
    medidasMitigacion:
      'Aislamiento del área (10 m), uso de EPP químico especializado y contención con Kit Antiderrames SGA (absorbentes y neutralizantes).',
    responsable: 'Líder Brigada HAZMAT / Responsable SG-SST',
    sentToKanban: false,
  },
  {
    id: 'am_dummy_4',
    amenaza: 'Emergencia Médica Aguda, Accidente Grave o Evacuación Asistida (FIT Biocéntrico)',
    tipo: 'Social',
    origenSst: 'Compatibilidad Colaborador-Cargo (FIT) & ATEL',
    calificacionDiamante: 'Inminente',
    nivelVulnerabilidad: 'Media',
    riesgoGlobal: 'Alto',
    areaAfectada: 'Frentes de trabajo operativo, alturas y puestos administrativos',
    medidasPrevencion:
      'Monitoreo de colaboradores con restricciones médicas o alertas cardiovasculares/osteomusculares y padrinos de evacuación asignados.',
    medidasMitigacion:
      'Valoración primaria ABC por Brigada de Primeros Auxilios, estabilización e inmovilización en camilla rígida y activación inmediata del MEDEVAC con ARL.',
    responsable: 'Líder Brigada de Primeros Auxilios / Coordinador MEDEVAC',
    sentToKanban: false,
  },
  {
    id: 'am_dummy_5',
    amenaza: 'Siniestro Vial o Emergencia en Desplazamiento Misional (PESV)',
    tipo: 'Tecnológica',
    origenSst: 'Matriz de Riesgos Viales PESV',
    calificacionDiamante: 'Probable',
    nivelVulnerabilidad: 'Baja',
    riesgoGlobal: 'Medio',
    areaAfectada: 'Rutas externas de transporte, mensajería y operación vehicular',
    medidasPrevencion:
      'Inspección preoperacional diaria de vehículos, control de fatiga y dotación completa de equipo de carretera y botiquín vehicular.',
    medidasMitigacion:
      'Aseguramiento de la escena vial con conos reflectivos, activación de Línea 123 / #767, atención prehospitalaria y reporte inmediato a ARL.',
    responsable: 'Comité PESV / Comandante del Incidente',
    sentToKanban: false,
  },
];

const DUMMY_SCI: EstructuraSciItem[] = [
  {
    id: 'sci_dummy_1',
    rolSci: 'Comandante del Incidente (Jefe de Emergencias)',
    nombreAsignado: 'Representante Legal / Director de Operaciones',
    cargoEmpresa: 'Gerencia General',
    telefonoContacto: '310 291 3651',
    especialidadBrigada: 'Comando de Incidente (SCI)',
    funcionesAntes:
      'Aprobar el PPRE, garantizar recursos financieros para equipos y autorizar la programación anual de simulacros.',
    funcionesDurante:
      'Instalar el Puesto de Comando (PC), asumir el mando supremo, ordenar la evacuación general y autorizar el ingreso de organismos de socorro.',
    funcionesDespues:
      'Declarar el retorno seguro a la normalidad, liderar la evaluación post-incidente y aprobar planes de acción ACPM.',
    origenSst: 'Gobernanza SG-SST & Alta Dirección (9.3)',
  },
  {
    id: 'sci_dummy_2',
    rolSci: 'Oficial de Seguridad Operativa y Enlace SST',
    nombreAsignado: 'Coordinador / Responsable del SG-SST',
    cargoEmpresa: 'Líder SG-SST',
    telefonoContacto: '310 641 5385',
    especialidadBrigada: 'Seguridad Operativa & Enlace Externo',
    funcionesAntes:
      'Mantener actualizados los PONs, verificar el Diamante de Vulnerabilidad y capacitar a la Brigada de Emergencias.',
    funcionesDurante:
      'Monitorear condiciones inseguras en la escena, enlazar con Bomberos/Cruz Roja/ARL y supervisar la activación del MEDEVAC.',
    funcionesDespues:
      'Consolidar el censo de evacuados, investigar causas del evento y registrar acciones correctivas en el Centro de Control ACPM.',
    origenSst: 'Responsable SG-SST (Est. 1.1.1)',
  },
  {
    id: 'sci_dummy_3',
    rolSci: 'Líder de Brigada de Primeros Auxilios y MEDEVAC',
    nombreAsignado: 'Brigadista Líder APH',
    cargoEmpresa: 'Supervisor Operativo / SST',
    telefonoContacto: 'Línea Interna SST',
    especialidadBrigada: 'Primeros Auxilios y Atención Prehospitalaria',
    funcionesAntes:
      'Inspeccionar mensualmente botiquines tipo B, camillas rígidas, inmovilizadores y directorio de trabajadores con restricciones FIT.',
    funcionesDurante:
      'Instalar el Área de Concentración de Víctimas (ACV), realizar triage START, brindar primeros auxilios y coordinar remisión en ambulancia.',
    funcionesDespues:
      'Reponer insumos utilizados del botiquín y hacer seguimiento médico a los colaboradores trasladados.',
    origenSst: 'Brigada de Emergencias (Hito 3)',
  },
  {
    id: 'sci_dummy_4',
    rolSci: 'Líder de Brigada de Prevención y Control de Incendios',
    nombreAsignado: 'Brigadista Líder Contraincendios',
    cargoEmpresa: 'Jefe de Mantenimiento / Planta',
    telefonoContacto: 'Línea Interna Planta',
    especialidadBrigada: 'Control de Incendios y Materiales Peligrosos',
    funcionesAntes:
      'Inspeccionar manómetros y sellos de extintores, gabinetes, detectores de humo y Kits de Control de Derrames SGA.',
    funcionesDurante:
      'Intervenir conatos de incendio en fase incipiente, cortar fluido eléctrico/gas y apoyar al Cuerpo Oficial de Bomberos.',
    funcionesDespues:
      'Gestionar la recarga inmediata de extintores descargados y evaluar daños en redes eléctricas o locativas.',
    origenSst: 'Brigada de Emergencias (Hito 3)',
  },
  {
    id: 'sci_dummy_5',
    rolSci: 'Líder de Brigada de Evacuación, Búsqueda y Rescate',
    nombreAsignado: 'Brigadista Líder de Evacuación',
    cargoEmpresa: 'Coordinador Administrativo / Obra',
    telefonoContacto: 'Línea Interna Evacuación',
    especialidadBrigada: 'Evacuación y Rescate',
    funcionesAntes:
      'Verificar despeje de rutas de evacuación, señalización NTC 1461, iluminación de emergencia y asignar padrinos a personal vulnerable.',
    funcionesDurante:
      'Activar la alarma de evacuación, guiar al personal y visitantes hacia el Punto de Encuentro y realizar el conteo nominal.',
    funcionesDespues:
      'Verificar que ninguna persona haya quedado atrapada y dirigir el reingreso ordenado cuando el Comandante lo autorice.',
    origenSst: 'Brigada de Emergencias (Hito 3)',
  },
];

const DUMMY_PONS: ProcedimientoPon[] = [
  {
    id: 'pon_dummy_1',
    codigo: 'PON-01',
    tituloEscenario: 'PON de Evacuación General y Respuesta ante Sismo / Terremoto',
    amenazaAsociada: 'Sismo o Terremoto (Amenaza Natural)',
    faseAntes:
      '1. Verificar anclaje de estanterías y luminarias. 2. Mantener despejadas las rutas de evacuación y salidas de emergencia. 3. Socializar puntos de encuentro y asignar padrinos a trabajadores con restricciones médicas (FIT).',
    faseDurante:
      '1. Durante el sismo: conservar la calma, ubicarse en zonas seguras internas lejos de vidrios (Agacharse, Cubrirse y Sujetarse). 2. Al cesar el movimiento: activar alarma continua de evacuación, cortar energía/gas y desplazarse en fila por la derecha hacia el Punto de Encuentro N° 1.',
    faseDespues:
      '1. Realizar censo nominal de trabajadores, contratistas y visitantes en el Punto de Encuentro. 2. Inspeccionar fisuras estructurales con el Comandante del Incidente antes de autorizar el reingreso.',
    recursosNecesarios: 'Alarma codificada, megáfono, chalecos reflectivos, paleta PARE/SIGA, botiquín y lista de personal.',
    responsableOperativo: 'Comandante del Incidente y Brigada de Evacuación',
    estado: 'Vigente',
    sentToKanban: false,
  },
  {
    id: 'pon_dummy_2',
    codigo: 'PON-02',
    tituloEscenario: 'PON de Control de Conatos de Incendio y Emergencia Eléctrica',
    amenazaAsociada: 'Incendio Estructural o Cortocircuito',
    faseAntes:
      '1. Inspección mensual de extintores (ABC Multipropósito y Solkaflam/CO2). 2. Mantenimiento preventivo de instalaciones eléctricas RETIE y prohibición de sobrecarga de regletas.',
    faseDurante:
      '1. Quien detecte humo o fuego da la voz de alerta inmediata. 2. Desenergizar el brecker del área afectada. 3. Si es un conato incipiente, atacar a favor del viento con el extintor adecuado a 2-3 metros de la base del fuego. 4. Si el fuego supera la capacidad, evacuar y llamar al 119 (Bomberos).',
    faseDespues:
      '1. Ventilar el área, retirar extintores usados para recarga inmediata e investigar la causa raíz del conato.',
    recursosNecesarios: 'Extintores ABC 10-20 lb, Extintores Solkaflam 3700g, guantes de carnaza y línea 119.',
    responsableOperativo: 'Líder de Brigada Contraincendios',
    estado: 'Vigente',
    sentToKanban: false,
  },
  {
    id: 'pon_dummy_3',
    codigo: 'PON-03',
    tituloEscenario: 'PON de Atención Prehospitalaria y Evacuación Médica (MEDEVAC)',
    amenazaAsociada: 'Accidente de Trabajo Grave o Emergencia Médica Aguda',
    faseAntes:
      '1. Mantener dotado el Botiquín Tipo B y camilla rígida con spider e inmovilizador cervical. 2. Tener visible la línea de urgencias ATEL de la ARL y la ruta hacia la clínica de referencia.',
    faseDurante:
      '1. Asegurar la escena (PAS: Proteger, Avisar, Socorrer). 2. Evaluar signos vitales (valoración primaria ABC) sin movilizar bruscamente si hay sospecha de trauma cervical. 3. Comunicarse con la línea médica ARL / 123 para despacho de ambulancia y trasladar a la Clínica MEDEVAC.',
    faseDespues:
      '1. Acompañar al colaborador o informar a su contacto de emergencia. 2. Reportar el FURAT dentro de los 2 días hábiles siguientes e iniciar investigación ATEL (Res. 1401/2007).',
    recursosNecesarios: 'Botiquín portátil, camilla rígida con correas, cuello ortopédico, guantes de nitrilo y directorio MEDEVAC.',
    responsableOperativo: 'Líder de Brigada de Primeros Auxilios y Responsable SG-SST',
    estado: 'Vigente',
    sentToKanban: false,
  },
  {
    id: 'pon_dummy_4',
    codigo: 'PON-04',
    tituloEscenario: 'PON de Contención de Derrames de Sustancias Químicas (SGA)',
    amenazaAsociada: 'Derrame o Fuga de Producto Químico Peligroso',
    faseAntes:
      '1. Disponer de Kit Antiderrames SGA, Fichas de Datos de Seguridad (FDS) y matriz de compatibilidad en el sitio de almacenamiento.',
    faseDurante:
      '1. Aislar y ventilar el área eliminando toda fuente de ignición. 2. Consultar la Sección 6 de la FDS y colocarse EPP químico (gafas herméticas, respirador con cartucho y guantes de nitrilo). 3. Rodear el derrame con cordones absorbentes para evitar que llegue a sifones.',
    faseDespues:
      '1. Recoger el material contaminado en bolsa roja RESPEL rotulada, descontaminar herramientas y reponer el Kit Antiderrames.',
    recursosNecesarios: 'Kit Antiderrames SGA (cordones, paños oleofílicos/universales, pala antichispa, bolsa RESPEL) y FDS.',
    responsableOperativo: 'Brigada de Emergencias / Almacenista SST',
    estado: 'Vigente',
    sentToKanban: false,
  },
];

const DUMMY_RECURSOS: RecursoEquipo[] = [
  {
    id: 'rec_dummy_1',
    tipoRecurso: 'Extintor',
    descripcion: 'Extintor Multipropósito PQS ABC 10 lb con manómetro certificado NTC 2885',
    ubicacion: 'Pasillos operativos, bodega principal y acceso administrativo',
    cantidad: 4,
    estado: 'Operativo',
    fechaInspeccion: new Date().toISOString().slice(0, 10),
    responsable: 'Líder Brigada Contraincendios',
    origenSst: 'Dotación Contraincendios',
  },
  {
    id: 'rec_dummy_2',
    tipoRecurso: 'Extintor',
    descripcion: 'Extintor Agente Limpio Solkaflam 123 (3700 g) para tableros eléctricos y equipos de cómputo',
    ubicacion: 'Oficina administrativa y cuarto de servidores / tablero eléctrico',
    cantidad: 2,
    estado: 'Operativo',
    fechaInspeccion: new Date().toISOString().slice(0, 10),
    responsable: 'Líder Brigada Contraincendios',
    origenSst: 'Dotación Contraincendios',
  },
  {
    id: 'rec_dummy_3',
    tipoRecurso: 'Botiquín',
    descripcion: 'Botiquín de Primeros Auxilios Tipo B (Portátil en lona térmica dotado según Res. 0705)',
    ubicacion: 'Puesto de enfermería / Recepción principal y frente operativo',
    cantidad: 2,
    estado: 'Operativo',
    fechaInspeccion: new Date().toISOString().slice(0, 10),
    responsable: 'Líder Brigada Primeros Auxilios',
    origenSst: 'Atención Prehospitalaria',
  },
  {
    id: 'rec_dummy_4',
    tipoRecurso: 'Camilla',
    descripcion: 'Camilla rígida traslúcida en polietileno de alta densidad con inmovilizador cervical y correas spider',
    ubicacion: 'Soporte mural junto a salida de evacuación principal',
    cantidad: 1,
    estado: 'Operativo',
    fechaInspeccion: new Date().toISOString().slice(0, 10),
    responsable: 'Brigada de Evacuación y Rescate',
    origenSst: 'Rescate y MEDEVAC',
  },
  {
    id: 'rec_dummy_5',
    tipoRecurso: 'Kit Derrames SGA',
    descripcion: 'Kit de Control de Derrames Químicos e Hidrocarburos (20 galones) con absorbentes y EPP',
    ubicacion: 'Bodega de almacenamiento de productos químicos SGA',
    cantidad: 1,
    estado: 'Operativo',
    fechaInspeccion: new Date().toISOString().slice(0, 10),
    responsable: 'Almacenista / Brigada SST',
    origenSst: 'Matriz Química SGA',
  },
  {
    id: 'rec_dummy_6',
    tipoRecurso: 'Alarma / Detección',
    descripcion: 'Estación manual y sirena estroboscópica de evacuación + Lámparas de emergencia autónomas LED',
    ubicacion: 'Rutas de evacuación, escaleras y salidas principales',
    cantidad: 6,
    estado: 'Operativo',
    fechaInspeccion: new Date().toISOString().slice(0, 10),
    responsable: 'Líder SG-SST / Mantenimiento',
    origenSst: 'Seguridad Humana NTC 1461',
  },
];

const DUMMY_DIRECTORIOS: DirectorioExterno[] = [
  {
    id: 'dir_dummy_1',
    entidad: 'Línea Única de Emergencias Nacional y CRUE',
    lineaTelefonica: '123',
    direccionDistancia: 'Cobertura Metropolitana 24/7',
    tipoApoyo: 'Despacho integrado de ambulancias, bomberos, policía y gestión del riesgo',
    tiempoRespuestaEstimado: '8 - 12 min',
  },
  {
    id: 'dir_dummy_2',
    entidad: 'Cuerpo Oficial de Bomberos',
    lineaTelefonica: '119 / 123',
    direccionDistancia: 'Estación de Bomberos del sector (< 3.5 km)',
    tipoApoyo: 'Extinción de incendios estructurales, rescate vertical y materiales peligrosos (HAZMAT)',
    tiempoRespuestaEstimado: '10 - 15 min',
  },
  {
    id: 'dir_dummy_3',
    entidad: 'Cruz Roja Colombiana — Atención Prehospitalaria',
    lineaTelefonica: '132',
    direccionDistancia: 'Seccional Departamental',
    tipoApoyo: 'Ambulancia medicalizada, triage y soporte vital básico/avanzado',
    tiempoRespuestaEstimado: '12 - 18 min',
  },
  {
    id: 'dir_dummy_4',
    entidad: 'Defensa Civil Colombiana',
    lineaTelefonica: '144',
    direccionDistancia: 'Seccional Municipal',
    tipoApoyo: 'Búsqueda y rescate en estructuras colapsadas (BREC) y apoyo en evacuación',
    tiempoRespuestaEstimado: '15 - 20 min',
  },
  {
    id: 'dir_dummy_5',
    entidad: 'Policía Nacional / Cuadrante de Seguridad y Tránsito',
    lineaTelefonica: '112 / #767',
    direccionDistancia: 'CAI más cercano (< 1.5 km)',
    tipoApoyo: 'Acorralamiento perimetral, orden público y accidentes viales PESV',
    tiempoRespuestaEstimado: '5 - 10 min',
  },
  {
    id: 'dir_dummy_6',
    entidad: 'Línea Médica de Urgencias ATEL — ARL',
    lineaTelefonica: '01 8000 511 414 / #888',
    direccionDistancia: 'Red de Clínicas e IPS adscritas 24/7',
    tipoApoyo: 'Autorización inmediata MEDEVAC, traslado asistencial y direccionamiento a IPS de trauma',
    tiempoRespuestaEstimado: 'Inmediato (Telefónico)',
  },
];

const DUMMY_SIMULACROS: SimulacroPlan[] = [
  {
    id: 'sim_dummy_1',
    tituloSimulacro: 'Simulacro Anual de Evacuación General por Sismo (Art. 2.2.4.6.25 Num. 10)',
    escenario: 'Sismo de magnitud 6.4 con activación de alarma, evacuación total y censo en Punto de Encuentro N° 1',
    fechaProgramada: `${new Date().getFullYear()}-10-24`,
    participantesEsperados: 20,
    tiempoRespuestaMeta: '< 2 minutos 45 segundos hasta Punto de Encuentro',
    estado: 'Programado',
    hallazgosMejora: 'Evaluar audibilidad de la sirena en áreas operativas y acompañamiento a trabajadores con restricciones FIT.',
    responsable: 'Comandante del Incidente / Responsable SG-SST',
    sentToKanban: false,
  },
  {
    id: 'sim_dummy_2',
    tituloSimulacro: 'Simulacro Operativo de Control de Conato de Incendio y Derrame Químico SGA',
    escenario: 'Conato eléctrico y derrame en bodega con despliegue de extintores y Kit Antiderrames SGA',
    fechaProgramada: `${new Date().getFullYear()}-06-18`,
    participantesEsperados: 15,
    tiempoRespuestaMeta: '< 2 minutos para aislamiento y control del conato',
    estado: 'Ejecutado',
    hallazgosMejora: 'Se fortaleció la técnica de uso de extintores y consulta rápida de la Sección 6 de las FDS.',
    responsable: 'Líder Brigada Contraincendios y HAZMAT',
    sentToKanban: false,
  },
  {
    id: 'sim_dummy_3',
    tituloSimulacro: 'Simulacro Práctico de Primeros Auxilios, Inmovilización y Activación MEDEVAC',
    escenario: 'Atención de colaborador lesionado con empaquetamiento en camilla rígida y enlace real con ARL',
    fechaProgramada: `${new Date().getFullYear()}-08-22`,
    participantesEsperados: 12,
    tiempoRespuestaMeta: '< 4 minutos para estabilización primaria y llamado MEDEVAC',
    estado: 'Programado',
    hallazgosMejora: 'Verificar tiempos de colocación de collarín cervical y precisión en datos suministrados al CRUE/ARL.',
    responsable: 'Líder Brigada Primeros Auxilios',
    sentToKanban: false,
  },
];

const formatPct = (val?: number | null) => Number(Number(val || 0).toFixed(2));

const PlanEmergenciasWorkspace: React.FC = () => {
  const { showToast } = useToastContext();
  const { token } = useAuthContext();

  const [activeTab, setActiveTab] = useState<'sede' | 'amenazas' | 'sci' | 'pon' | 'recursos'>(
    'sede',
  );
  const [sedeData, setSedeData] = useState<SedeData>(DEFAULT_SEDE_DATA);
  const [escenariosAmenaza, setEscenariosAmenaza] = useState<EscenarioAmenaza[]>([]);
  const [estructuraSci, setEstructuraSci] = useState<EstructuraSciItem[]>([]);
  const [procedimientosPon, setProcedimientosPon] = useState<ProcedimientoPon[]>([]);
  const [recursosEquipos, setRecursosEquipos] = useState<RecursoEquipo[]>([]);
  const [directoriosExternos, setDirectoriosExternos] = useState<DirectorioExterno[]>([]);
  const [simulacrosPlan, setSimulacrosPlan] = useState<SimulacroPlan[]>([]);

  const [company, setCompany] = useState<any>(null);
  const [ecosystemMetrics, setEcosystemMetrics] = useState<EcosystemMetrics | null>(null);
  const [lastSyncedSources, setLastSyncedSources] = useState<string[]>([]);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSavingData, setIsSavingData] = useState<boolean>(false);
  const [isSyncingEcosystem, setIsSyncingEcosystem] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isCompilingReport, setIsCompilingReport] = useState<boolean>(false);
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);
  const [sendingKanbanId, setSendingKanbanId] = useState<string | null>(null);

  const [amenazaFilter, setAmenazaFilter] = useState<'Todos' | 'Natural' | 'Tecnológica' | 'Social'>(
    'Todos',
  );
  const [amenazaAiPrompt, setAmenazaAiPrompt] = useState<string>('');
  const [ponAiPrompt, setPonAiPrompt] = useState<string>('');
  const [sciAiPrompt, setSciAiPrompt] = useState<string>('');
  const [recursoAiPrompt, setRecursoAiPrompt] = useState<string>('');
  const [simulacroAiPrompt, setSimulacroAiPrompt] = useState<string>('');

  const [editingAmenazaId, setEditingAmenazaId] = useState<string | null>(null);
  const [editingPonId, setEditingPonId] = useState<string | null>(null);
  const [editingSciId, setEditingSciId] = useState<string | null>(null);

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const editorContentRef = useRef<string>('');

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const navigateToModule = (moduleId: string) => {
    const el = document.getElementById(`sgsst-category-${moduleId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    window.dispatchEvent(new CustomEvent('sgsst-open-module', { detail: { moduleId } }));
  };

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/sgsst/plan-emergencias/data', {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Error al cargar Plan de Emergencias');
      const data = await res.json();

      if (data.sedeData) setSedeData({ ...DEFAULT_SEDE_DATA, ...data.sedeData });
      setEscenariosAmenaza(Array.isArray(data.escenariosAmenaza) ? data.escenariosAmenaza : []);
      setEstructuraSci(Array.isArray(data.estructuraSci) ? data.estructuraSci : []);
      setProcedimientosPon(Array.isArray(data.procedimientosPon) ? data.procedimientosPon : []);
      setRecursosEquipos(Array.isArray(data.recursosEquipos) ? data.recursosEquipos : []);
      setDirectoriosExternos(
        Array.isArray(data.directoriosExternos) && data.directoriosExternos.length > 0
          ? data.directoriosExternos
          : DUMMY_DIRECTORIOS,
      );
      setSimulacrosPlan(Array.isArray(data.simulacrosPlan) ? data.simulacrosPlan : []);
      if (data.company) setCompany(data.company);
      if (data.ecosystemMetrics) setEcosystemMetrics(data.ecosystemMetrics);

      if (data.lastGeneratedReport) {
        setGeneratedReport(data.lastGeneratedReport);
        editorContentRef.current = data.lastGeneratedReport;
      }
    } catch (err) {
      console.error('[PlanEmergenciasWorkspace] load error:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useAutoLoadReport('sgsst-plan-emergencias', (html) => {
    if (html && !generatedReport) {
      setGeneratedReport(html);
      editorContentRef.current = html;
    }
  });

  const handleSaveData = async () => {
    setIsSavingData(true);
    try {
      const res = await fetch('/api/sgsst/plan-emergencias/data', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          sedeData,
          escenariosAmenaza,
          estructuraSci,
          procedimientosPon,
          recursosEquipos,
          directoriosExternos,
          simulacrosPlan,
          lastGeneratedReport: editorContentRef.current || generatedReport || '',
        }),
      });
      if (!res.ok) throw new Error('Error guardando datos');
      showToast({
        message: 'Plan de Emergencias y Contingencias (PPRE) guardado en la nube.',
        status: 'success',
      });
    } catch (err: any) {
      showToast({
        message: err.message || 'No se pudo guardar el Plan de Emergencias.',
        status: 'error',
      });
    } finally {
      setIsSavingData(false);
    }
  };

  const handleSyncEcosystem = async () => {
    setIsSyncingEcosystem(true);
    try {
      const res = await fetch('/api/sgsst/plan-emergencias/sync-ecosystem', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en sincronización 360°');

      if (data.sedeData) setSedeData((prev) => ({ ...prev, ...data.sedeData }));
      if (Array.isArray(data.escenariosAmenaza)) setEscenariosAmenaza(data.escenariosAmenaza);
      if (Array.isArray(data.estructuraSci)) setEstructuraSci(data.estructuraSci);
      if (Array.isArray(data.procedimientosPon)) setProcedimientosPon(data.procedimientosPon);
      if (Array.isArray(data.recursosEquipos)) setRecursosEquipos(data.recursosEquipos);
      if (Array.isArray(data.directoriosExternos)) setDirectoriosExternos(data.directoriosExternos);
      if (Array.isArray(data.simulacrosPlan)) setSimulacrosPlan(data.simulacrosPlan);
      if (data.ecosystemMetrics) setEcosystemMetrics(data.ecosystemMetrics);
      if (Array.isArray(data.syncedSources)) setLastSyncedSources(data.syncedSources);

      showToast({
        message:
          data.message ||
          'Plan de Emergencias alimentado desde las 16 fuentes del Ecosistema 360° Somos SST.',
        status: 'success',
      });
    } catch (err: any) {
      showToast({
        message: err.message || 'Error al sincronizar desde el ecosistema.',
        status: 'error',
      });
    } finally {
      setIsSyncingEcosystem(false);
    }
  };

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/sgsst/plan-emergencias/generate-ai', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ modelName: selectedModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando PPRE con IA');

      if (data.sedeData) setSedeData((prev) => ({ ...prev, ...data.sedeData }));
      if (Array.isArray(data.escenariosAmenaza)) setEscenariosAmenaza(data.escenariosAmenaza);
      if (Array.isArray(data.estructuraSci)) setEstructuraSci(data.estructuraSci);
      if (Array.isArray(data.procedimientosPon)) setProcedimientosPon(data.procedimientosPon);
      if (Array.isArray(data.recursosEquipos)) setRecursosEquipos(data.recursosEquipos);
      if (Array.isArray(data.directoriosExternos)) setDirectoriosExternos(data.directoriosExternos);
      if (Array.isArray(data.simulacrosPlan)) setSimulacrosPlan(data.simulacrosPlan);
      if (data.ecosystemMetrics) setEcosystemMetrics(data.ecosystemMetrics);

      showToast({
        message:
          data.message ||
          'Plan de Emergencias (Amenazas, SCI, PONs, MEDEVAC y Simulacros) estructurado con WAPPY IA.',
        status: 'success',
      });
    } catch (err: any) {
      showToast({
        message: err.message || 'Error al generar el Plan de Emergencias con IA.',
        status: 'error',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleLoadDummy = () => {
    setSedeData({
      ...DEFAULT_SEDE_DATA,
      nombreSede: company?.companyName
        ? `Sede Principal — ${company.companyName}`
        : DEFAULT_SEDE_DATA.nombreSede,
      ciudad: company?.city || DEFAULT_SEDE_DATA.ciudad,
      direccion: company?.address || DEFAULT_SEDE_DATA.direccion,
      arlNombre: company?.arl || DEFAULT_SEDE_DATA.arlNombre,
      trabajadoresFijos: Number(
        ecosystemMetrics?.totalWorkers || company?.workerCount || DEFAULT_SEDE_DATA.trabajadoresFijos,
      ),
    });
    setEscenariosAmenaza(DUMMY_ESCENARIOS);
    setEstructuraSci(DUMMY_SCI);
    setProcedimientosPon(DUMMY_PONS);
    setRecursosEquipos(DUMMY_RECURSOS);
    setDirectoriosExternos(DUMMY_DIRECTORIOS);
    setSimulacrosPlan(DUMMY_SIMULACROS);
    showToast({
      message:
        'Datos de prueba 360° del Plan de Emergencias (MEDEVAC, Diamante, SCI, PONs, Equipos y Simulacros) cargados.',
      status: 'success',
    });
  };

  const handleSuggestItem = async (
    mode: 'amenaza' | 'pon' | 'sci' | 'recurso' | 'simulacro' | 'medevac',
  ) => {
    setIsSuggesting(mode);
    try {
      const inputMap: Record<string, any> = {
        amenaza: { amenaza: amenazaAiPrompt || 'Incendio o explosión en área crítica operativa' },
        pon: {
          tituloEscenario: ponAiPrompt || 'Evacuación y rescate ante emergencia crítica',
          codigo: `PON-0${procedimientosPon.length + 1}`,
        },
        sci: { rolSci: sciAiPrompt || 'Coordinador de Comunicaciones y Alarma de Emergencia' },
        recurso: { descripcion: recursoAiPrompt || 'Botiquín Trauma Portátil y Camilla Rígida' },
        simulacro: {
          tituloSimulacro:
            simulacroAiPrompt || 'Simulacro de Evacuación General y Rescate Medicalizado',
        },
        medevac: { ciudad: sedeData.ciudad, arlNombre: sedeData.arlNombre },
      };

      const res = await fetch('/api/sgsst/plan-emergencias/suggest-item', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          mode,
          inputData: inputMap[mode],
          modelName: selectedModel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.item) throw new Error(data.error || 'No se pudo generar la sugerencia');

      const item = data.item;
      if (mode === 'medevac') {
        setSedeData((prev) => ({
          ...prev,
          puntoEncuentroPrincipal: item.puntoEncuentroPrincipal || prev.puntoEncuentroPrincipal,
          puntoEncuentroAlterno: item.puntoEncuentroAlterno || prev.puntoEncuentroAlterno,
          rutasEvacuacionDesc: item.rutasEvacuacionDesc || prev.rutasEvacuacionDesc,
          sistemaAlarma: item.sistemaAlarma || prev.sistemaAlarma,
          clinicaMedevac: item.clinicaMedevac || prev.clinicaMedevac,
          direccionClinica: item.direccionClinica || prev.direccionClinica,
          tiempoTrasladoMedevac: item.tiempoTrasladoMedevac || prev.tiempoTrasladoMedevac,
          ambulanciaContacto: item.ambulanciaContacto || prev.ambulanciaContacto,
          arlLineaEmergencia: item.arlLineaEmergencia || prev.arlLineaEmergencia,
        }));
        showToast({ message: 'Ruta MEDEVAC y Alarma optimizadas con IA.', status: 'success' });
      } else if (mode === 'amenaza') {
        setEscenariosAmenaza((prev) => [
          {
            id: `am_ai_${Date.now()}`,
            amenaza: item.amenaza || 'Escenario de Amenaza',
            tipo: item.tipo || 'Tecnológica',
            origenSst: item.origenSst || 'Sugerencia WAPPY IA',
            calificacionDiamante: item.calificacionDiamante || 'Probable',
            nivelVulnerabilidad: item.nivelVulnerabilidad || 'Media',
            riesgoGlobal: item.riesgoGlobal || 'Alto',
            areaAfectada: item.areaAfectada || 'Instalaciones operativas',
            medidasPrevencion: item.medidasPrevencion || '',
            medidasMitigacion: item.medidasMitigacion || '',
            responsable: item.responsable || 'Comandante del Incidente',
            sentToKanban: false,
          },
          ...prev,
        ]);
        setAmenazaAiPrompt('');
        showToast({ message: 'Escenario de amenaza generado con IA.', status: 'success' });
      } else if (mode === 'pon') {
        setProcedimientosPon((prev) => [
          {
            id: `pon_ai_${Date.now()}`,
            codigo: item.codigo || `PON-0${prev.length + 1}`,
            tituloEscenario: item.tituloEscenario || 'Procedimiento Operativo Normalizado',
            amenazaAsociada: item.amenazaAsociada || 'Amenaza Crítica',
            faseAntes: item.faseAntes || '',
            faseDurante: item.faseDurante || '',
            faseDespues: item.faseDespues || '',
            recursosNecesarios: item.recursosNecesarios || 'Botiquín, Camilla, Extintores',
            responsableOperativo: item.responsableOperativo || 'Brigada de Emergencias',
            estado: 'Vigente',
            sentToKanban: false,
          },
          ...prev,
        ]);
        setPonAiPrompt('');
        showToast({ message: 'Procedimiento Operativo (PON) redactado con IA.', status: 'success' });
      } else if (mode === 'sci') {
        setEstructuraSci((prev) => [
          ...prev,
          {
            id: `sci_ai_${Date.now()}`,
            rolSci: item.rolSci || 'Rol Comando de Incidentes',
            nombreAsignado: item.nombreAsignado || 'Brigadista Designado',
            cargoEmpresa: item.cargoEmpresa || 'Líder Operativo',
            telefonoContacto: item.telefonoContacto || sedeData.telefonoEmergencia,
            especialidadBrigada: item.especialidadBrigada || 'Comando de Incidente (SCI)',
            funcionesAntes: item.funcionesAntes || '',
            funcionesDurante: item.funcionesDurante || '',
            funcionesDespues: item.funcionesDespues || '',
            origenSst: 'WAPPY IA / Brigada SST',
          },
        ]);
        setSciAiPrompt('');
        showToast({ message: 'Rol SCI y funciones agregados con IA.', status: 'success' });
      } else if (mode === 'recurso') {
        setRecursosEquipos((prev) => [
          {
            id: `rec_ai_${Date.now()}`,
            tipoRecurso: item.tipoRecurso || 'Extintor',
            descripcion: item.descripcion || 'Equipo de Atención de Emergencias',
            ubicacion: item.ubicacion || 'Área Operativa Principal',
            cantidad: Number(item.cantidad || 2),
            estado: 'Operativo',
            fechaInspeccion: new Date().toISOString().slice(0, 10),
            responsable: item.responsable || 'Brigada de Emergencias',
            origenSst: 'WAPPY IA',
          },
          ...prev,
        ]);
        setRecursoAiPrompt('');
        showToast({ message: 'Equipo de emergencia sugerido con IA.', status: 'success' });
      } else if (mode === 'simulacro') {
        setSimulacrosPlan((prev) => [
          {
            id: `sim_ai_${Date.now()}`,
            tituloSimulacro: item.tituloSimulacro || 'Simulacro de Evacuación',
            escenario: item.escenario || 'Hipótesis de emergencia con evacuación general',
            fechaProgramada: item.fechaProgramada || `${new Date().getFullYear()}-10-24`,
            participantesEsperados: Number(
              item.participantesEsperados || sedeData.trabajadoresFijos || 15,
            ),
            tiempoRespuestaMeta: item.tiempoRespuestaMeta || '< 3 minutos',
            estado: 'Programado',
            hallazgosMejora: item.hallazgosMejora || '',
            responsable: item.responsable || 'Responsable SG-SST / Brigada',
            sentToKanban: false,
          },
          ...prev,
        ]);
        setSimulacroAiPrompt('');
        showToast({ message: 'Simulacro estructurado con IA.', status: 'success' });
      }
    } catch (err: any) {
      showToast({
        message: err.message || 'Error generando sugerencia con IA.',
        status: 'error',
      });
    } finally {
      setIsSuggesting(null);
    }
  };

  const handleSendToKanban = async (
    itemId: string,
    itemType: 'amenaza' | 'pon' | 'simulacro',
    title: string,
    description: string,
    assignedTo: string,
  ) => {
    setSendingKanbanId(itemId);
    try {
      const res = await fetch('/api/sgsst/plan-emergencias/send-to-kanban', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          itemId,
          itemType,
          title,
          description,
          priority: 'alta',
          actionType: 'preventiva',
          assignedTo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error enviando al Centro de Control ACPM');

      if (itemType === 'amenaza') {
        setEscenariosAmenaza((prev) =>
          prev.map((e) => (e.id === itemId ? { ...e, sentToKanban: true } : e)),
        );
      } else if (itemType === 'pon') {
        setProcedimientosPon((prev) =>
          prev.map((p) => (p.id === itemId ? { ...p, sentToKanban: true } : p)),
        );
      } else if (itemType === 'simulacro') {
        setSimulacrosPlan((prev) =>
          prev.map((s) => (s.id === itemId ? { ...s, sentToKanban: true } : s)),
        );
      }

      showToast({
        message: data.message || 'Acción enviada al Centro de Control Kanban / ACPM.',
        status: 'success',
      });
    } catch (err: any) {
      showToast({
        message: err.message || 'No se pudo enviar al Centro de Control ACPM.',
        status: 'error',
      });
    } finally {
      setSendingKanbanId(null);
    }
  };

  const handleCompileReport = async () => {
    setIsCompilingReport(true);
    try {
      const res = await fetch('/api/sgsst/plan-emergencias/generate-report', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          sedeData,
          escenariosAmenaza,
          estructuraSci,
          procedimientosPon,
          recursosEquipos,
          directoriosExternos,
          simulacrosPlan,
          modelName: selectedModel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.html) throw new Error(data.error || 'Error compilando Documento Maestro');

      setGeneratedReport(data.html);
      editorContentRef.current = data.html;
      if (liveEditorRef.current) {
        liveEditorRef.current.setContent(data.html);
      }
      setRefreshTrigger((prev) => prev + 1);
      showToast({
        message:
          'Documento Maestro Oficial del Plan de Emergencias y Contingencias (PPRE) compilado exitosamente.',
        status: 'success',
      });
    } catch (err: any) {
      showToast({
        message: err.message || 'Error al compilar el Documento Maestro PPRE.',
        status: 'error',
      });
    } finally {
      setIsCompilingReport(false);
    }
  };

  const handleSelectReportFromHistory = (html: string) => {
    setGeneratedReport(html);
    editorContentRef.current = html;
    if (liveEditorRef.current) {
      liveEditorRef.current.setContent(html);
    }
    setIsHistoryOpen(false);
  };

  const totalAforo =
    Number(sedeData.trabajadoresFijos || 0) +
    Number(sedeData.contratistasFlotantes || 0) +
    Number(sedeData.visitantesPromedio || 0);

  const filteredAmenazas =
    amenazaFilter === 'Todos'
      ? escenariosAmenaza
      : escenariosAmenaza.filter((a) => a.tipo === amenazaFilter);

  return (
    <div className="space-y-6 w-full min-w-0 pb-10">
      {/* ─── 1. HERO HEADER & TOOLBAR WAPPY 14-GROUP DESIGN SYSTEM ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-border-light dark:border-white/10 bg-gradient-to-br from-white/95 via-surface-primary/90 to-teal-50/40 dark:from-[#161920]/95 dark:via-[#12151a]/95 dark:to-teal-950/20 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
                  Plan de Emergencias y Contingencias (PPRE)
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Operativo con IA
                </span>
                {company?.companyName && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                    <Building2 className="w-3.5 h-3.5" />
                    {company.companyName}
                    {company.nit ? ` · NIT ${company.nit}` : ''}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
                Articulación integral 360° del Sistema Comando de Incidentes (SCI), Diamante de
                Vulnerabilidad, Plan de Evacuación, MEDEVAC biocéntrico, Procedimientos Operativos
                Normalizados (PON), Inventario de Equipos y Programa Anual de Simulacros.
              </p>
              <div className="mt-2.5">
                <SGSSTLegalBadge
                  standardCode="5.1.1"
                  isoClause="Num. 8.2"
                  label="Est. 5.1.1 Res. 0312 · Art. 2.2.4.6.25 Dec. 1072: CUMPLE"
                  tooltip="Integra la preparación ante amenazas naturales, tecnológicas y sociales con la protección prioritaria del bioindividuo, la brigada de emergencias, PONs y la cadena de socorro MEDEVAC."
                  moduleName="Plan de Emergencias y Contingencias (PPRE)"
                />
              </div>
            </div>
          </div>

          {/* Barra de Acciones Principales (14-Group Design System) */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Grupo 9 (blue): Alimentar desde Ecosistema 360° */}
            <ExpandableButton
              onClick={handleSyncEcosystem}
              disabled={isSyncingEcosystem}
              variant="blue"
              icon={
                isSyncingEcosystem ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )
              }
              label={isSyncingEcosystem ? 'Sincronizando...' : 'Alimentar 360° SST'}
              title="Cruzar automáticamente Vulnerabilidad, Brigada, Compatibilidad FIT, Químicos SGA, PESV, Alturas y Auditoría"
            />

            {/* Grupo 6 (purple): Generar PPRE con IA */}
            <ExpandableButton
              onClick={handleGenerateAi}
              disabled={isGeneratingAi}
              variant="purple"
              icon={
                isGeneratingAi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
              label={isGeneratingAi ? 'Estructurando IA...' : 'Generar PPRE con IA'}
              title="Generar y enriquecer el Plan de Emergencias completo con Inteligencia Artificial"
            />

            {/* Grupo 8 (amber): Datos de Prueba (Dummy) */}
            <ExpandableButton
              onClick={handleLoadDummy}
              variant="amber"
              icon={<Flame className="w-4 h-4" />}
              label="Datos de Prueba (Dummy)"
              title="Cargar set completo de prueba con MEDEVAC, Amenazas, SCI, PONs, Equipos y Simulacros"
            />

            {/* Grupo 10 (green): Compilar Documento Maestro PPRE */}
            <ExpandableButton
              onClick={handleCompileReport}
              disabled={isCompilingReport}
              variant="green"
              icon={
                isCompilingReport ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )
              }
              label={isCompilingReport ? 'Compilando...' : 'Compilar PPRE Oficial'}
              title="Generar el Documento Maestro Oficial del Plan de Emergencias en el Editor Vivo"
            />

            {/* Grupo 3 (teal): Guardar Datos */}
            <ExpandableButton
              onClick={handleSaveData}
              disabled={isSavingData}
              variant="teal"
              icon={
                isSavingData ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )
              }
              label={isSavingData ? 'Guardando...' : 'Guardar en Nube'}
              title="Guardar todos los cambios del Plan de Emergencias en MongoDB"
            />
          </div>
        </div>

        {/* Banner de fuentes sincronizadas */}
        {lastSyncedSources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border-light/60 dark:border-white/10 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Fuentes 360° articuladas:
            </span>
            {lastSyncedSources.map((src, i) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/20 font-medium"
              >
                {src}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── 2. RADAR KPI 360° DEL ECOSISTEMA SOMOS SST (10 TARJETAS CON MÁXIMO 2 DECIMALES) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Vulnerabilidad (Diamante) */}
        <div
          onClick={() => navigateToModule('vulnerabilidad')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-rose-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Vulnerabilidad (Diamante)
            </span>
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">{escenariosAmenaza.length}</span>
            <span className="text-[11px] font-bold text-rose-500">Escenarios PPRE</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics?.vulnerabilidadAmenazasCount || 0} en Matriz Diamante</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
          </p>
        </div>

        {/* 2. Comando SCI & Brigada */}
        <div
          onClick={() => navigateToModule('brigada_emergencias')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-amber-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Comando SCI & Brigada
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Siren className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">{estructuraSci.length}</span>
            <span className="text-[11px] font-bold text-amber-500">Roles SCI</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics?.brigadistasCount || 0} brigadistas en Hito 3</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
          </p>
        </div>

        {/* 3. Evacuación Prioritaria & FIT */}
        <div
          onClick={() => navigateToModule('condiciones_salud')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-teal-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Evacuación & FIT Cargo
            </span>
            <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-500">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {formatPct(ecosystemMetrics?.avgFitScore)}%
            </span>
            <span className="text-[11px] font-bold text-teal-500">FIT Promedio</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics?.workersWithFitAlerts || 0} alertas médicas MEDEVAC</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* 4. Químicos SGA & Vial PESV */}
        <div
          onClick={() => navigateToModule('matriz_compatibilidad_oficial')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-purple-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              HAZMAT SGA & Vial PESV
            </span>
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemMetrics?.quimicosCount || 0}
            </span>
            <span className="text-[11px] font-bold text-purple-500">Químicos SGA</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics?.vehiculosCount || 0} vehículos en flota PESV</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
          </p>
        </div>

        {/* 5. Rescate Alturas, ATS & EPP */}
        <div
          onClick={() => navigateToModule('permiso_alturas')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-orange-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Alturas, ATS & Equipos
            </span>
            <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-500">
              <HardHat className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">{recursosEquipos.length}</span>
            <span className="text-[11px] font-bold text-orange-500">Equipos PPRE</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>
              {ecosystemMetrics?.permisosAlturasCount || 0} alturas · {ecosystemMetrics?.atsCount || 0}{' '}
              ATS
            </span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
          </p>
        </div>

        {/* 6. Capacitaciones & Simulacros */}
        <div
          onClick={() => navigateToModule('capacitaciones')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-indigo-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Capacitación & Simulacros
            </span>
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">{simulacrosPlan.length}</span>
            <span className="text-[11px] font-bold text-indigo-500">
              Simulacros ({formatPct(ecosystemMetrics?.capacitacionesCompliancePct)}% Cap.)
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{procedimientosPon.length} PONs normalizados</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
          </p>
        </div>

        {/* 7. Auditoría Interna 1072 */}
        <div
          onClick={() => navigateToModule('auditoria')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-violet-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Auditoría Interna 1072
            </span>
            <div className="p-1.5 rounded-xl bg-violet-500/10 text-violet-500">
              <ClipboardCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {formatPct(ecosystemMetrics?.auditoriaScore)}%
            </span>
            <span className="text-[11px] font-bold text-violet-500">Cumplimiento</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics?.auditoriaNoConformidades || 0} hallazgos / NC</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-violet-500" />
          </p>
        </div>

        {/* 8. Alta Dirección (9.3) */}
        <div
          onClick={() => navigateToModule('alta_direccion')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-cyan-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Alta Dirección (9.3)
            </span>
            <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemMetrics?.altaDireccionCumple || 0}/
              {ecosystemMetrics?.altaDireccionTotalItems || 0}
            </span>
            <span className="text-[11px] font-bold text-cyan-500">Numerales Art. 31</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics?.altaDireccionCompromisosPendientes || 0} compromisos pend.</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500" />
          </p>
        </div>

        {/* 9. Diagnóstico 0312 & Contexto DOFA */}
        <div
          onClick={() => navigateToModule('diagnostico')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-emerald-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Diagnóstico Res. 0312
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Compass className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {formatPct(ecosystemMetrics?.diagnosticoScore)}%
            </span>
            <span className="text-[11px] font-bold text-emerald-500">Est. Mínimos</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>Est. 5.1.1 Plan de Emergencias</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
          </p>
        </div>

        {/* 10. Centro de Control ACPM */}
        <div
          onClick={() => navigateToModule('control_acpm')}
          className="cursor-pointer group rounded-2xl border border-border-light dark:border-white/10 bg-white/80 dark:bg-[#181b22]/80 p-3.5 hover:border-blue-500/40 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
              Centro de Control ACPM
            </span>
            <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Trello className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {ecosystemMetrics?.kanbanPending || 0}
            </span>
            <span className="text-[11px] font-bold text-blue-500">Acciones abiertas</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics?.kanbanTotal || 0} planes totales ACPM</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
          </p>
        </div>
      </div>

      {/* ─── 3. NAVEGACIÓN DE 5 PESTAÑAS TIPO ISLA FLOTANTE ─── */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-surface-secondary/80 dark:bg-[#161920]/90 p-1.5 border border-border-light dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('sede')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'sede'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Sede, Evacuación & MEDEVAC</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/15 dark:bg-white/15">
            {totalAforo} Aforo
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('amenazas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'amenazas'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>2. Escenarios de Amenaza & Diamante</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/15 dark:bg-white/15">
            {escenariosAmenaza.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sci')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'sci'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. Comando de Incidentes (SCI) & Brigada</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/15 dark:bg-white/15">
            {estructuraSci.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pon')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'pon'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>4. Procedimientos Operativos (PON)</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/15 dark:bg-white/15">
            {procedimientosPon.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recursos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'recursos'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>5. Equipos & Plan de Simulacros</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/15 dark:bg-white/15">
            {recursosEquipos.length + simulacrosPlan.length}
          </span>
        </button>
      </div>

      {/* ─── CONTENIDO DE PESTAÑA 1: CARACTERIZACIÓN, EVACUACIÓN & MEDEVAC ─── */}
      {activeTab === 'sede' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tarjeta A: Datos Locativos y Carga Ocupacional */}
            <div className="rounded-3xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-500" />
                  Caracterización Locativa y Carga Ocupacional
                </h3>
                <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                  Aforo Total: {totalAforo} personas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Nombre de la Sede / Centro de Trabajo
                  </label>
                  <input
                    type="text"
                    value={sedeData.nombreSede}
                    onChange={(e) => setSedeData({ ...sedeData, nombreSede: e.target.value })}
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Ciudad / Municipio
                  </label>
                  <input
                    type="text"
                    value={sedeData.ciudad}
                    onChange={(e) => setSedeData({ ...sedeData, ciudad: e.target.value })}
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Dirección Operativa
                  </label>
                  <input
                    type="text"
                    value={sedeData.direccion}
                    onChange={(e) => setSedeData({ ...sedeData, direccion: e.target.value })}
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Horario de Operación
                  </label>
                  <input
                    type="text"
                    value={sedeData.horarioOperacion}
                    onChange={(e) => setSedeData({ ...sedeData, horarioOperacion: e.target.value })}
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Trabajadores Fijos
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sedeData.trabajadoresFijos}
                    onChange={(e) =>
                      setSedeData({ ...sedeData, trabajadoresFijos: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm font-bold text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Contratistas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sedeData.contratistasFlotantes}
                    onChange={(e) =>
                      setSedeData({ ...sedeData, contratistasFlotantes: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm font-bold text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Visitantes Prom.
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sedeData.visitantesPromedio}
                    onChange={(e) =>
                      setSedeData({ ...sedeData, visitantesPromedio: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm font-bold text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                  Características Constructivas y Estructurales (NSR-10)
                </label>
                <textarea
                  rows={2}
                  value={sedeData.construccionTipo}
                  onChange={(e) => setSedeData({ ...sedeData, construccionTipo: e.target.value })}
                  className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                />
              </div>
            </div>

            {/* Tarjeta B: Plan de Evacuación, Alarma y MEDEVAC */}
            <div className="rounded-3xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-rose-500" />
                  Plan de Evacuación, Alarma & MEDEVAC
                </h3>
                <ExpandableButton
                  onClick={() => handleSuggestItem('medevac')}
                  disabled={isSuggesting === 'medevac'}
                  variant="violet"
                  icon={
                    isSuggesting === 'medevac' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )
                  }
                  label="Optimizar MEDEVAC con IA"
                  title="Sugerir clínica de referencia, rutas de evacuación y código de alarma según la ciudad y ARL"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Punto de Encuentro Principal
                  </label>
                  <input
                    type="text"
                    value={sedeData.puntoEncuentroPrincipal}
                    onChange={(e) =>
                      setSedeData({ ...sedeData, puntoEncuentroPrincipal: e.target.value })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Punto de Encuentro Alterno
                  </label>
                  <input
                    type="text"
                    value={sedeData.puntoEncuentroAlterno}
                    onChange={(e) =>
                      setSedeData({ ...sedeData, puntoEncuentroAlterno: e.target.value })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Clínica / Hospital MEDEVAC (Nivel III-IV)
                  </label>
                  <input
                    type="text"
                    value={sedeData.clinicaMedevac}
                    onChange={(e) => setSedeData({ ...sedeData, clinicaMedevac: e.target.value })}
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Tiempo Traslado / Ambulancia
                  </label>
                  <input
                    type="text"
                    value={sedeData.tiempoTrasladoMedevac}
                    onChange={(e) =>
                      setSedeData({ ...sedeData, tiempoTrasladoMedevac: e.target.value })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Entidad ARL Afiliada
                  </label>
                  <input
                    type="text"
                    value={sedeData.arlNombre}
                    onChange={(e) => setSedeData({ ...sedeData, arlNombre: e.target.value })}
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                    Línea Urgencias ATEL ARL 24/7
                  </label>
                  <input
                    type="text"
                    value={sedeData.arlLineaEmergencia}
                    onChange={(e) =>
                      setSedeData({ ...sedeData, arlLineaEmergencia: e.target.value })
                    }
                    className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-text-secondary mb-1">
                  Sistema de Alarma Codificada y Rutas de Evacuación (NTC 1461)
                </label>
                <textarea
                  rows={2}
                  value={sedeData.sistemaAlarma}
                  onChange={(e) => setSedeData({ ...sedeData, sistemaAlarma: e.target.value })}
                  className="w-full rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
                />
              </div>
            </div>
          </div>

          {/* Tarjeta C: Directorio de Socorro Externo y Ayuda Mutua */}
          <div className="rounded-3xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-teal-500" />
                  Directorio de Entidades de Socorro Externo y Plan de Ayuda Mutua
                </h3>
                <p className="text-xs text-text-secondary">
                  Líneas de respuesta inmediata articuladas con el Centro Regulador de Urgencias y
                  Emergencias (CRUE), Bomberos, Cruz Roja, Defensa Civil y ARL.
                </p>
              </div>
              <ExpandableButton
                onClick={() =>
                  setDirectoriosExternos((prev) => [
                    ...prev,
                    {
                      id: `dir_${Date.now()}`,
                      entidad: 'Nueva Entidad de Socorro / Empresa Vecina Plan Ayuda Mutua',
                      lineaTelefonica: '123',
                      direccionDistancia: sedeData.ciudad,
                      tipoApoyo: 'Apoyo brigada conjunta, extintores y primeros auxilios',
                      tiempoRespuestaEstimado: '10 min',
                    },
                  ])
                }
                variant="teal"
                icon={<Plus className="w-4 h-4" />}
                label="Agregar Entidad"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {directoriosExternos.map((dir) => (
                <div
                  key={dir.id}
                  className="rounded-2xl border border-border-light dark:border-white/10 bg-surface-secondary/40 p-4 space-y-2 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="text"
                      value={dir.entidad}
                      onChange={(e) =>
                        setDirectoriosExternos((prev) =>
                          prev.map((d) =>
                            d.id === dir.id ? { ...d, entidad: e.target.value } : d,
                          ),
                        )
                      }
                      className="font-bold text-sm text-text-primary bg-transparent border-b border-transparent focus:border-teal-500 outline-none flex-1"
                    />
                    <ExpandableButton
                      onClick={() =>
                        setDirectoriosExternos((prev) => prev.filter((d) => d.id !== dir.id))
                      }
                      variant="red"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      label="Quitar"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-text-secondary block">
                        Línea Telefónica
                      </span>
                      <input
                        type="text"
                        value={dir.lineaTelefonica}
                        onChange={(e) =>
                          setDirectoriosExternos((prev) =>
                            prev.map((d) =>
                              d.id === dir.id ? { ...d, lineaTelefonica: e.target.value } : d,
                            ),
                          )
                        }
                        className="font-extrabold text-teal-600 dark:text-teal-400 bg-transparent outline-none w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-text-secondary block">
                        Tiempo Respuesta
                      </span>
                      <input
                        type="text"
                        value={dir.tiempoRespuestaEstimado}
                        onChange={(e) =>
                          setDirectoriosExternos((prev) =>
                            prev.map((d) =>
                              d.id === dir.id
                                ? { ...d, tiempoRespuestaEstimado: e.target.value }
                                : d,
                            ),
                          )
                        }
                        className="font-semibold text-text-primary bg-transparent outline-none w-full"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={dir.tipoApoyo}
                    onChange={(e) =>
                      setDirectoriosExternos((prev) =>
                        prev.map((d) =>
                          d.id === dir.id ? { ...d, tipoApoyo: e.target.value } : d,
                        ),
                      )
                    }
                    className="text-xs text-text-secondary bg-transparent outline-none w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENIDO DE PESTAÑA 2: ESCENARIOS DE AMENAZA & DIAMANTE ─── */}
      {activeTab === 'amenazas' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={amenazaAiPrompt}
                onChange={(e) => setAmenazaAiPrompt(e.target.value)}
                placeholder="Describe un escenario para analizar con IA (ej. Explosión de caldera, Inundación, Intrusión armada)..."
                className="flex-1 rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
              />
              <ExpandableButton
                onClick={() => handleSuggestItem('amenaza')}
                disabled={isSuggesting === 'amenaza'}
                variant="violet"
                icon={
                  isSuggesting === 'amenaza' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )
                }
                label="Sugerir Escenario con IA"
              />
              <ExpandableButton
                onClick={() =>
                  setEscenariosAmenaza((prev) => [
                    {
                      id: `am_man_${Date.now()}`,
                      amenaza: 'Nuevo Escenario de Amenaza',
                      tipo: 'Tecnológica',
                      origenSst: 'Análisis de Vulnerabilidad',
                      calificacionDiamante: 'Probable',
                      nivelVulnerabilidad: 'Media',
                      riesgoGlobal: 'Medio',
                      areaAfectada: 'Instalaciones operativas',
                      medidasPrevencion: 'Inspección periódica y mantenimiento preventivo.',
                      medidasMitigacion: 'Activación de alarma, brigada y PON específico.',
                      responsable: 'Comandante del Incidente / Brigada',
                      sentToKanban: false,
                    },
                    ...prev,
                  ])
                }
                variant="teal"
                icon={<Plus className="w-4 h-4" />}
                label="Agregar Manual"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(['Todos', 'Natural', 'Tecnológica', 'Social'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAmenazaFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    amenazaFilter === t
                      ? 'bg-teal-500 text-white'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAmenazas.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border-medium p-10 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-text-primary">
                  No hay escenarios de amenaza cargados en este filtro.
                </p>
                <p className="text-xs text-text-secondary">
                  Usa el botón &ldquo;Alimentar 360° SST&rdquo;, &ldquo;Generar PPRE con IA&rdquo; o
                  &ldquo;Datos de Prueba (Dummy)&rdquo; para estructurar la matriz de amenazas.
                </p>
              </div>
            ) : (
              filteredAmenazas.map((esc) => {
                const isEditing = editingAmenazaId === esc.id;
                const badgeColor =
                  esc.riesgoGlobal === 'Alto'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : esc.riesgoGlobal === 'Medio'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

                return (
                  <div
                    key={esc.id}
                    className="rounded-2xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                            {esc.tipo}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-surface-secondary text-text-secondary">
                            Origen: {esc.origenSst}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border ${badgeColor}`}
                          >
                            Riesgo {esc.riesgoGlobal} (Diamante: {esc.calificacionDiamante} · Vuln:{' '}
                            {esc.nivelVulnerabilidad})
                          </span>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={esc.amenaza}
                            onChange={(e) =>
                              setEscenariosAmenaza((prev) =>
                                prev.map((x) =>
                                  x.id === esc.id ? { ...x, amenaza: e.target.value } : x,
                                ),
                              )
                            }
                            className="w-full rounded-xl border border-teal-500 bg-surface-primary px-3 py-1.5 text-sm font-bold text-text-primary mt-1"
                          />
                        ) : (
                          <h4 className="text-base font-black text-text-primary">{esc.amenaza}</h4>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <ExpandableButton
                          onClick={() => setEditingAmenazaId(isEditing ? null : esc.id)}
                          variant="amber"
                          icon={
                            isEditing ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Pencil className="w-4 h-4" />
                            )
                          }
                          label={isEditing ? 'Listo' : 'Editar'}
                        />
                        <ExpandableButton
                          onClick={() =>
                            handleSendToKanban(
                              esc.id,
                              'amenaza',
                              `[PPRE Amenaza] ${esc.amenaza}`,
                              `Prevención: ${esc.medidasPrevencion} | Mitigación: ${esc.medidasMitigacion}`,
                              esc.responsable,
                            )
                          }
                          disabled={sendingKanbanId === esc.id}
                          variant="emerald"
                          icon={
                            sendingKanbanId === esc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )
                          }
                          label={esc.sentToKanban ? 'En ACPM' : 'Enviar a ACPM'}
                        />
                        <ExpandableButton
                          onClick={() =>
                            setEscenariosAmenaza((prev) => prev.filter((x) => x.id !== esc.id))
                          }
                          variant="red"
                          icon={<Trash2 className="w-4 h-4" />}
                          label="Eliminar"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-teal-500/5 border border-teal-500/20 p-3">
                        <span className="font-extrabold uppercase text-teal-700 dark:text-teal-300 block mb-1">
                          Controles Preventivos (Antes)
                        </span>
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={esc.medidasPrevencion}
                            onChange={(e) =>
                              setEscenariosAmenaza((prev) =>
                                prev.map((x) =>
                                  x.id === esc.id
                                    ? { ...x, medidasPrevencion: e.target.value }
                                    : x,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-border-medium bg-surface-primary p-2 text-xs text-text-primary"
                          />
                        ) : (
                          <p className="text-text-secondary leading-relaxed">
                            {esc.medidasPrevencion}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                        <span className="font-extrabold uppercase text-amber-700 dark:text-amber-300 block mb-1">
                          Respuesta y Mitigación (Durante / Después)
                        </span>
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={esc.medidasMitigacion}
                            onChange={(e) =>
                              setEscenariosAmenaza((prev) =>
                                prev.map((x) =>
                                  x.id === esc.id
                                    ? { ...x, medidasMitigacion: e.target.value }
                                    : x,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-border-medium bg-surface-primary p-2 text-xs text-text-primary"
                          />
                        ) : (
                          <p className="text-text-secondary leading-relaxed">
                            {esc.medidasMitigacion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── CONTENIDO DE PESTAÑA 3: COMANDO DE INCIDENTES (SCI) & BRIGADA ─── */}
      {activeTab === 'sci' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={sciAiPrompt}
                onChange={(e) => setSciAiPrompt(e.target.value)}
                placeholder="Rol SCI o especialidad de brigada a crear con IA (ej. Oficial de Enlace con Bomberos, Líder Rescate Alturas)..."
                className="flex-1 rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
              />
              <ExpandableButton
                onClick={() => handleSuggestItem('sci')}
                disabled={isSuggesting === 'sci'}
                variant="violet"
                icon={
                  isSuggesting === 'sci' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )
                }
                label="Generar Rol SCI con IA"
              />
              <ExpandableButton
                onClick={() =>
                  setEstructuraSci((prev) => [
                    ...prev,
                    {
                      id: `sci_man_${Date.now()}`,
                      rolSci: 'Brigadista Operativo / Líder de Área',
                      nombreAsignado: 'Por designar',
                      cargoEmpresa: 'Colaborador Brigadista',
                      telefonoContacto: sedeData.telefonoEmergencia,
                      especialidadBrigada: 'Integral (Evacuación, Incendios y Primeros Auxilios)',
                      funcionesAntes: 'Participar en capacitaciones e inspecciones de equipos.',
                      funcionesDurante: 'Apoyar evacuación y atención primaria del evento.',
                      funcionesDespues: 'Apoyar censo en punto de encuentro y evaluación.',
                      origenSst: 'Brigada de Emergencias',
                    },
                  ])
                }
                variant="teal"
                icon={<Plus className="w-4 h-4" />}
                label="Agregar Integrante SCI"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {estructuraSci.map((sci) => {
              const isEditing = editingSciId === sci.id;
              return (
                <div
                  key={sci.id}
                  className="rounded-2xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                          {sci.especialidadBrigada}
                        </span>
                        <span className="text-xs font-semibold text-text-secondary">
                          {sci.nombreAsignado} · {sci.cargoEmpresa}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-text-primary mt-1">{sci.rolSci}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ExpandableButton
                        onClick={() => setEditingSciId(isEditing ? null : sci.id)}
                        variant="amber"
                        icon={
                          isEditing ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Pencil className="w-4 h-4" />
                          )
                        }
                        label={isEditing ? 'Guardar' : 'Editar'}
                      />
                      <ExpandableButton
                        onClick={() =>
                          setEstructuraSci((prev) => prev.filter((x) => x.id !== sci.id))
                        }
                        variant="red"
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Eliminar"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <input
                        type="text"
                        value={sci.rolSci}
                        onChange={(e) =>
                          setEstructuraSci((prev) =>
                            prev.map((x) =>
                              x.id === sci.id ? { ...x, rolSci: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Rol SCI"
                        className="rounded-xl border border-border-medium bg-surface-primary px-3 py-1.5 text-xs text-text-primary"
                      />
                      <input
                        type="text"
                        value={sci.nombreAsignado}
                        onChange={(e) =>
                          setEstructuraSci((prev) =>
                            prev.map((x) =>
                              x.id === sci.id ? { ...x, nombreAsignado: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Nombre Asignado"
                        className="rounded-xl border border-border-medium bg-surface-primary px-3 py-1.5 text-xs text-text-primary"
                      />
                      <input
                        type="text"
                        value={sci.cargoEmpresa}
                        onChange={(e) =>
                          setEstructuraSci((prev) =>
                            prev.map((x) =>
                              x.id === sci.id ? { ...x, cargoEmpresa: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Cargo en la Empresa"
                        className="rounded-xl border border-border-medium bg-surface-primary px-3 py-1.5 text-xs text-text-primary"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl bg-surface-secondary/50 p-3">
                      <span className="font-extrabold uppercase text-teal-600 dark:text-teal-400 block mb-1">
                        1. ANTES (Prevención)
                      </span>
                      <p className="text-text-secondary leading-relaxed">{sci.funcionesAntes}</p>
                    </div>
                    <div className="rounded-xl bg-surface-secondary/50 p-3">
                      <span className="font-extrabold uppercase text-amber-600 dark:text-amber-400 block mb-1">
                        2. DURANTE (Respuesta SCI)
                      </span>
                      <p className="text-text-secondary leading-relaxed">{sci.funcionesDurante}</p>
                    </div>
                    <div className="rounded-xl bg-surface-secondary/50 p-3">
                      <span className="font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                        3. DESPUÉS (Recuperación)
                      </span>
                      <p className="text-text-secondary leading-relaxed">{sci.funcionesDespues}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CONTENIDO DE PESTAÑA 4: PROCEDIMIENTOS OPERATIVOS NORMALIZADOS (PON) ─── */}
      {activeTab === 'pon' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={ponAiPrompt}
                onChange={(e) => setPonAiPrompt(e.target.value)}
                placeholder="Describe el PON que deseas redactar con IA (ej. Rescate en alturas, Fuga de gas, Siniestro vial)..."
                className="flex-1 rounded-xl border border-border-medium bg-surface-primary px-3.5 py-2 text-sm text-text-primary"
              />
              <ExpandableButton
                onClick={() => handleSuggestItem('pon')}
                disabled={isSuggesting === 'pon'}
                variant="violet"
                icon={
                  isSuggesting === 'pon' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )
                }
                label="Redactar PON con IA"
              />
            </div>
          </div>

          <div className="space-y-3.5">
            {procedimientosPon.map((pon) => {
              const isEditing = editingPonId === pon.id;
              return (
                <div
                  key={pon.id}
                  className="rounded-2xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          {pon.codigo}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                          {pon.estado}
                        </span>
                        <span className="text-xs text-text-secondary">
                          Amenaza: {pon.amenazaAsociada}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-text-primary mt-1">
                        {pon.tituloEscenario}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <ExpandableButton
                        onClick={() => setEditingPonId(isEditing ? null : pon.id)}
                        variant="amber"
                        icon={
                          isEditing ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Pencil className="w-4 h-4" />
                          )
                        }
                        label={isEditing ? 'Listo' : 'Editar'}
                      />
                      <ExpandableButton
                        onClick={() =>
                          handleSendToKanban(
                            pon.id,
                            'pon',
                            `[Socializar ${pon.codigo}] ${pon.tituloEscenario}`,
                            `Recursos: ${pon.recursosNecesarios} | Durante: ${pon.faseDurante}`,
                            pon.responsableOperativo,
                          )
                        }
                        disabled={sendingKanbanId === pon.id}
                        variant="emerald"
                        icon={
                          sendingKanbanId === pon.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )
                        }
                        label={pon.sentToKanban ? 'En ACPM' : 'Enviar a ACPM'}
                      />
                      <ExpandableButton
                        onClick={() =>
                          setProcedimientosPon((prev) => prev.filter((x) => x.id !== pon.id))
                        }
                        variant="red"
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Eliminar"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl bg-teal-500/5 border border-teal-500/20 p-3">
                      <span className="font-extrabold uppercase text-teal-700 dark:text-teal-300 block mb-1">
                        1. ANTES (Preparación)
                      </span>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={pon.faseAntes}
                          onChange={(e) =>
                            setProcedimientosPon((prev) =>
                              prev.map((x) =>
                                x.id === pon.id ? { ...x, faseAntes: e.target.value } : x,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-border-medium bg-surface-primary p-2 text-xs text-text-primary"
                        />
                      ) : (
                        <p className="text-text-secondary leading-relaxed">{pon.faseAntes}</p>
                      )}
                    </div>
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                      <span className="font-extrabold uppercase text-amber-700 dark:text-amber-300 block mb-1">
                        2. DURANTE (Respuesta Operativa)
                      </span>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={pon.faseDurante}
                          onChange={(e) =>
                            setProcedimientosPon((prev) =>
                              prev.map((x) =>
                                x.id === pon.id ? { ...x, faseDurante: e.target.value } : x,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-border-medium bg-surface-primary p-2 text-xs text-text-primary"
                        />
                      ) : (
                        <p className="text-text-secondary leading-relaxed">{pon.faseDurante}</p>
                      )}
                    </div>
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
                      <span className="font-extrabold uppercase text-emerald-700 dark:text-emerald-300 block mb-1">
                        3. DESPUÉS (Vuelta a la Normalidad)
                      </span>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={pon.faseDespues}
                          onChange={(e) =>
                            setProcedimientosPon((prev) =>
                              prev.map((x) =>
                                x.id === pon.id ? { ...x, faseDespues: e.target.value } : x,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-border-medium bg-surface-primary p-2 text-xs text-text-primary"
                        />
                      ) : (
                        <p className="text-text-secondary leading-relaxed">{pon.faseDespues}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CONTENIDO DE PESTAÑA 5: EQUIPOS DE EMERGENCIA & PLAN DE SIMULACROS ─── */}
      {activeTab === 'recursos' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Sección 1: Inventario de Equipos de Emergencia */}
          <div className="rounded-3xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Inventario de Equipos y Recursos de Emergencia
              </h3>
              <div className="flex items-center gap-1.5">
                <ExpandableButton
                  onClick={() => handleSuggestItem('recurso')}
                  disabled={isSuggesting === 'recurso'}
                  variant="violet"
                  icon={
                    isSuggesting === 'recurso' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )
                  }
                  label="Sugerir Equipo IA"
                />
                <ExpandableButton
                  onClick={() =>
                    setRecursosEquipos((prev) => [
                      {
                        id: `rec_${Date.now()}`,
                        tipoRecurso: 'Extintor',
                        descripcion: 'Extintor PQS Multipropósito ABC 10 lb',
                        ubicacion: 'Pasillo Principal',
                        cantidad: 2,
                        estado: 'Operativo',
                        fechaInspeccion: new Date().toISOString().slice(0, 10),
                        responsable: 'Brigada Contraincendios',
                      },
                      ...prev,
                    ])
                  }
                  variant="teal"
                  icon={<Plus className="w-4 h-4" />}
                  label="Agregar"
                />
              </div>
            </div>

            <div className="space-y-3">
              {recursosEquipos.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-border-light dark:border-white/10 bg-surface-secondary/40 p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-500/30">
                        {rec.tipoRecurso} (x{rec.cantidad})
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                        {rec.estado}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-text-primary">{rec.descripcion}</p>
                    <p className="text-[11px] text-text-secondary">
                      Ubicación: {rec.ubicacion} · Resp: {rec.responsable}
                    </p>
                  </div>
                  <ExpandableButton
                    onClick={() =>
                      setRecursosEquipos((prev) => prev.filter((x) => x.id !== rec.id))
                    }
                    variant="red"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    label="Quitar"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sección 2: Programa Anual de Simulacros */}
          <div className="rounded-3xl border border-border-light dark:border-white/10 bg-white/90 dark:bg-[#161920]/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-500" />
                Programa Anual de Simulacros (Art. 2.2.4.6.25 Num. 10)
              </h3>
              <div className="flex items-center gap-1.5">
                <ExpandableButton
                  onClick={() => handleSuggestItem('simulacro')}
                  disabled={isSuggesting === 'simulacro'}
                  variant="violet"
                  icon={
                    isSuggesting === 'simulacro' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )
                  }
                  label="Diseñar Simulacro IA"
                />
                <ExpandableButton
                  onClick={() =>
                    setSimulacrosPlan((prev) => [
                      {
                        id: `sim_${Date.now()}`,
                        tituloSimulacro: 'Simulacro de Evacuación General',
                        escenario: 'Evacuación total hacia Punto de Encuentro Principal',
                        fechaProgramada: `${new Date().getFullYear()}-10-24`,
                        participantesEsperados: sedeData.trabajadoresFijos || 15,
                        tiempoRespuestaMeta: '< 3 minutos',
                        estado: 'Programado',
                        hallazgosMejora: 'Verificar tiempos de salida y conteo de personal.',
                        responsable: 'Comandante del Incidente / SST',
                      },
                      ...prev,
                    ])
                  }
                  variant="teal"
                  icon={<Plus className="w-4 h-4" />}
                  label="Programar"
                />
              </div>
            </div>

            <div className="space-y-3">
              {simulacrosPlan.map((sim) => (
                <div
                  key={sim.id}
                  className="rounded-2xl border border-border-light dark:border-white/10 bg-surface-secondary/40 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                          {sim.fechaProgramada} · {sim.estado}
                        </span>
                        <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                          Meta: {sim.tiempoRespuestaMeta}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-text-primary mt-1">
                        {sim.tituloSimulacro}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <ExpandableButton
                        onClick={() =>
                          handleSendToKanban(
                            sim.id,
                            'simulacro',
                            `[Simulacro PPRE] ${sim.tituloSimulacro}`,
                            `Escenario: ${sim.escenario} | Fecha: ${sim.fechaProgramada} | Meta: ${sim.tiempoRespuestaMeta}`,
                            sim.responsable,
                          )
                        }
                        disabled={sendingKanbanId === sim.id}
                        variant="emerald"
                        icon={<Send className="w-3.5 h-3.5" />}
                        label={sim.sentToKanban ? 'En ACPM' : 'ACPM'}
                      />
                      <ExpandableButton
                        onClick={() =>
                          setSimulacrosPlan((prev) => prev.filter((x) => x.id !== sim.id))
                        }
                        variant="red"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        label="Quitar"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary">{sim.escenario}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. BARRA DE HERRAMIENTAS INFERIOR & HISTORIAL DE REPORTES ─── */}
      <SGSSTToolbar
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onAnalyze={handleCompileReport}
        isAnalyzing={isCompilingReport}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSaveLocal={handleSaveData}
        isSavingLocal={isSavingData}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Plan_Emergencias_y_Contingencias_PPRE_${Date.now()}`}
      />

      <ReportHistory
        onSelectReport={handleSelectReportFromHistory}
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-plan-emergencias']}
      />

      {/* ─── 5. DOCUMENTO MAESTRO OFICIAL EN LIVE EDITOR (EXPORTABLE WORD / PDF) ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Documento Maestro: Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)"
        icon={<ShieldAlert className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName={`Plan_Emergencias_PPRE_${company?.companyName || 'SGSST'}`}
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
            reportSourceData={{
              sedeData,
              escenariosAmenaza,
              estructuraSci,
              procedimientosPon,
              recursosEquipos,
              directoriosExternos,
              simulacrosPlan,
              company,
            }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default PlanEmergenciasWorkspace;
