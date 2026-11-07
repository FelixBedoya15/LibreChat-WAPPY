import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  ShieldCheck,
  Search,
  FileText,
  Download,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scale,
  Building2,
  Car,
  Award,
  Stethoscope,
  UserCheck,
  Loader2,
  X,
  RefreshCw,
  HardHat,
  Sparkles,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import ExpandableButton from '~/components/Common/ExpandableButton';
import { cn } from '~/utils';

export interface WorkerOsint360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCedula?: string;
  initialTipoDoc?: string;
  initialNombre?: string;
  initialPlaca?: string;
}

export interface MinTrabajoCursoRow {
  programa?: string;
  nivel?: string;
  fechaInicio?: string;
  fechaFin?: string;
  organizacion?: string;
  entrenador?: string;
  sede?: string;
  vigente?: boolean;
  tipo?: string;
  diasDesdeFin?: number;
  mesesDesdeFin?: number;
  eventTarget?: string;
}

export interface MinTrabajoResult {
  encontrado?: boolean;
  activoEnAlturas?: boolean;
  activoEnConfinados?: boolean;
  titular?: string;
  ultimoCursoAlturas?: MinTrabajoCursoRow | null;
  ultimoCursoConfinados?: MinTrabajoCursoRow | null;
  pdfBase64?: string | null;
  pdfFileName?: string | null;
  historialCompleto?: MinTrabajoCursoRow[];
  mensaje?: string;
  error?: string;
}

export interface RamaJudicialProceso {
  idProceso?: string | number;
  llaveProceso?: string;
  despacho?: string;
  departamento?: string;
  fechaProceso?: string;
  fechaUltimaActuacion?: string;
  sujetosProcesales?: string;
  esPrivado?: boolean;
}

export interface RamaJudicialResult {
  consultado?: boolean;
  nombreConsultado?: string;
  totalProcesos?: number;
  procesos?: RamaJudicialProceso[];
  mensaje?: string;
  error?: string;
}

export interface PortalOficialItem {
  id: string;
  nombre: string;
  entidad?: string;
  categoria:
    | 'ARL y Seguridad Social'
    | 'SIMIT y RUNT (PESV)'
    | 'Alto Riesgo y SENA'
    | 'Matrículas RETIE/Salud/Ing'
    | 'Antecedentes';
  url: string;
  descripcion: string;
  usaPlaca?: boolean;
  norma?: string;
}

const CATEGORIAS_FILTRO = [
  'Todos',
  'ARL y Seguridad Social',
  'SIMIT y RUNT (PESV)',
  'Alto Riesgo y SENA',
  'Matrículas RETIE/Salud/Ing',
  'Antecedentes',
] as const;

type CategoriaFiltro = (typeof CATEGORIAS_FILTRO)[number];

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'CC - Cédula de Ciudadanía' },
  { value: 'CE', label: 'CE - Cédula de Extranjería' },
  { value: 'PP', label: 'PP - Permiso por Protección Temporal (PPT)' },
  { value: 'PE', label: 'PE - Permiso Especial de Permanencia (PEP)' },
  { value: 'TI', label: 'TI - Tarjeta de Identidad' },
  { value: 'PA', label: 'PA - Pasaporte' },
];

const DEFAULT_26_PORTALES_OFICIALES: PortalOficialItem[] = [
  // 1. ARL y Seguridad Social (8 fuentes)
  {
    id: 'ruaf-sispro',
    nombre: 'RUAF SISPRO (Afiliaciones EPS, ARL, AFP, Caja)',
    entidad: 'Ministerio de Salud y Protección Social',
    categoria: 'ARL y Seguridad Social',
    url: 'https://ruaf.sispro.gov.co/Filtro.aspx',
    descripcion: 'Consulta integral de afiliaciones vigentes a EPS, ARL, Fondo de Pensiones, Cesantías y Caja de Compensación.',
    norma: 'Dec. 1072/2015 · Est. 3.1.1',
  },
  {
    id: 'adres-bdua',
    nombre: 'ADRES - Consulta BDUA (Afiliación EPS)',
    entidad: 'ADRES',
    categoria: 'ARL y Seguridad Social',
    url: 'https://www.adres.gov.co/consulte-su-eps',
    descripcion: 'Base de Datos Única de Afiliados al Sistema General de Seguridad Social en Salud.',
    norma: 'Ley 100/1993',
  },
  {
    id: 'arl-sura',
    nombre: 'ARL SURA - Certificados y Afiliación',
    entidad: 'Seguros de Vida Suramericana S.A.',
    categoria: 'ARL y Seguridad Social',
    url: 'https://www.arlsura.com/index.php/consulta-de-afiliados',
    descripcion: 'Verificación de cobertura de riesgos laborales y carnet en ARL SURA.',
    norma: 'Dec. 1295/1994',
  },
  {
    id: 'arl-positiva',
    nombre: 'ARL Positiva - Certificados en Línea',
    entidad: 'Positiva Compañía de Seguros',
    categoria: 'ARL y Seguridad Social',
    url: 'https://www.positivaenlinea.gov.co/',
    descripcion: 'Descarga de certificados de afiliación y cobertura en ARL Positiva.',
    norma: 'Dec. 1295/1994',
  },
  {
    id: 'arl-colmena',
    nombre: 'ARL Colmena Seguros - Consulta Afiliados',
    entidad: 'Colmena Seguros',
    categoria: 'ARL y Seguridad Social',
    url: 'https://www.colmenaseguros.com/',
    descripcion: 'Validación de afiliación activa y estado de cobertura en ARL Colmena.',
    norma: 'Dec. 1295/1994',
  },
  {
    id: 'arl-bolivar',
    nombre: 'ARL Seguros Bolívar - Certificados',
    entidad: 'Seguros Bolívar',
    categoria: 'ARL y Seguridad Social',
    url: 'https://www.segurosbolivar.com/arl',
    descripcion: 'Verificación de afiliación a riesgos laborales en ARL Bolívar.',
    norma: 'Dec. 1295/1994',
  },
  {
    id: 'arl-axa-colpatria',
    nombre: 'ARL AXA Colpatria - Portal Afiliados',
    entidad: 'AXA Colpatria',
    categoria: 'ARL y Seguridad Social',
    url: 'https://www.axacolpatria.co/portalpublico/arl',
    descripcion: 'Consulta de estado de afiliación y certificados ARL AXA Colpatria.',
    norma: 'Dec. 1295/1994',
  },
  {
    id: 'arl-equidad',
    nombre: 'ARL La Equidad Seguros',
    entidad: 'La Equidad Seguros de Vida',
    categoria: 'ARL y Seguridad Social',
    url: 'https://www.laequidadseguros.coop/arl',
    descripcion: 'Consulta de cobertura y afiliación activa en ARL La Equidad.',
    norma: 'Dec. 1295/1994',
  },

  // 2. SIMIT y RUNT (PESV) (4 fuentes)
  {
    id: 'simit-cedula',
    nombre: 'SIMIT - Multas y Comparendos por Cédula',
    entidad: 'Federación Colombiana de Municipios',
    categoria: 'SIMIT y RUNT (PESV)',
    url: 'https://fcm.org.co/simit/#/home-public',
    descripcion: 'Estado de cuenta de comparendos, multas de tránsito y acuerdos de pago del conductor por documento.',
    norma: 'Res. 40595/2022 PESV',
  },
  {
    id: 'simit-placa',
    nombre: 'SIMIT - Comparendos y Fotomultas por Placa',
    entidad: 'Federación Colombiana de Municipios',
    categoria: 'SIMIT y RUNT (PESV)',
    url: 'https://fcm.org.co/simit/#/home-public',
    descripcion: 'Verificación de infracciones asociadas al vehículo por número de placa.',
    usaPlaca: true,
    norma: 'Res. 40595/2022 PESV',
  },
  {
    id: 'runt-conductor',
    nombre: 'RUNT - Consulta de Licencias por Documento',
    entidad: 'Concesión RUNT 2.0 / MinTransporte',
    categoria: 'SIMIT y RUNT (PESV)',
    url: 'https://portalpublico.runt.gov.co/#/consulta-ciudadano-documento/consulta/consulta-ciudadano-documento',
    descripcion: 'Vigencia de licencias de conducción, categoría autorizada, restricciones y certificados de aptitud en conducción.',
    norma: 'Res. 40595/2022 PESV',
  },
  {
    id: 'runt-vehiculo',
    nombre: 'RUNT - Consulta de Vehículo por Placa (SOAT y RTM)',
    entidad: 'Concesión RUNT 2.0 / MinTransporte',
    categoria: 'SIMIT y RUNT (PESV)',
    url: 'https://portalpublico.runt.gov.co/#/consulta-vehiculo/consulta/consulta-ciudadana',
    descripcion: 'Validación en tiempo real de vigencia de SOAT, Revisión Técnico-Mecánica y datos técnicos del automotor.',
    usaPlaca: true,
    norma: 'Res. 40595/2022 PESV',
  },

  // 3. Alto Riesgo y SENA (3 fuentes)
  {
    id: 'mintrabajo-alturas-confinados',
    nombre: 'MinTrabajo - Certificados Trabajo en Alturas y Confinados',
    entidad: 'Ministerio del Trabajo',
    categoria: 'Alto Riesgo y SENA',
    url: 'https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx',
    descripcion: 'Registro oficial de entrenamientos de Trabajo Seguro en Alturas (Res. 4272/2021) y Espacios Confinados (Res. 0491/2020).',
    norma: 'Res. 4272/2021 · Res. 0491/2020',
  },
  {
    id: 'sena-sofia-certificados',
    nombre: 'SENA SOFIA Plus - Certificados y Curso 50h / 20h SG-SST',
    entidad: 'Servicio Nacional de Aprendizaje (SENA)',
    categoria: 'Alto Riesgo y SENA',
    url: 'https://certificados.sena.edu.co/',
    descripcion: 'Descarga y validación de certificados SENA (Curso Virtual 50 Horas / 20 Horas SG-SST, Alturas, formación titulada).',
    norma: 'Res. 0312/2019 · Est. 1.1.2',
  },
  {
    id: 'onac-organismos',
    nombre: 'ONAC - Directorio de Certificación de Competencias / Equipos',
    entidad: 'Organismo Nacional de Acreditación de Colombia',
    categoria: 'Alto Riesgo y SENA',
    url: 'https://onac.org.co/directorio-de-acreditados/',
    descripcion: 'Verificación de organismos acreditados para certificación de personas (izaje, aparejadores, alturas) e inspección.',
    norma: 'Dec. 1595/2015',
  },

  // 4. Matrículas RETIE/Salud/Ing (5 fuentes)
  {
    id: 'conte-electricistas',
    nombre: 'CONTE - Matrícula Profesional de Técnicos Electricistas',
    entidad: 'Consejo Nacional de Técnicos Electricistas',
    categoria: 'Matrículas RETIE/Salud/Ing',
    url: 'https://www.conte.org.co/consulta-de-matriculas/',
    descripcion: 'Verificación de vigencia y clases (TE-1 a TE-6) para trabajos eléctricos bajo RETIE y Res. 5018/2019.',
    norma: 'Res. 5018/2019 · RETIE',
  },
  {
    id: 'copnia-ingenieros',
    nombre: 'COPNIA - Matrícula Profesional de Ingenieros y Afines',
    entidad: 'Consejo Profesional Nacional de Ingeniería',
    categoria: 'Matrículas RETIE/Salud/Ing',
    url: 'https://tramites.copnia.gov.co/Copnia_Micrositio/ConsultaCertificado/ConsultaCertificado',
    descripcion: 'Consulta de matrícula profesional y certificado de vigencia y antecedentes disciplinarios de ingenieros y tecnólogos.',
    norma: 'Ley 842/2003',
  },
  {
    id: 'conaltel-tecnologos',
    nombre: 'CONALTEL - Tecnólogos en Electricidad y Electromecánica',
    entidad: 'Consejo Nacional de Tecnólogos en Electricidad',
    categoria: 'Matrículas RETIE/Salud/Ing',
    url: 'https://conaltel.org/',
    descripcion: 'Validación de matrícula profesional para tecnólogos electricistas, electrónicos y afines.',
    norma: 'Res. 5018/2019',
  },
  {
    id: 'rethus-salud',
    nombre: 'ReTHUS - Registro Único Nacional del Talento Humano en Salud',
    entidad: 'Ministerio de Salud - SISPRO',
    categoria: 'Matrículas RETIE/Salud/Ing',
    url: 'https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
    descripcion: 'Verificación de médicos laborales, psicólogos especialistas en SST, enfermeros y profesionales de la salud.',
    norma: 'Ley 1164/2007 · Res. 0312/2019',
  },
  {
    id: 'licencias-sst-minsalud',
    nombre: 'MinSalud - Licencias de Seguridad y Salud en el Trabajo',
    entidad: 'Ministerio de Salud y Protección Social',
    categoria: 'Matrículas RETIE/Salud/Ing',
    url: 'https://www.minsalud.gov.co/proteccionsocial/RiesgosLaborales/Paginas/licencias-seguridad-salud-trabajo.aspx',
    descripcion: 'Consulta normativa y validación de Licencias en Seguridad y Salud en el Trabajo (Res. 0754/2021).',
    norma: 'Res. 0754/2021 · Est. 1.1.1',
  },

  // 5. Antecedentes (6 fuentes)
  {
    id: 'policia-antecedentes',
    nombre: 'Policía Nacional - Antecedentes Judiciales',
    entidad: 'Policía Nacional de Colombia',
    categoria: 'Antecedentes',
    url: 'https://antecedentes.policia.gov.co:7005/WebJudicial/',
    descripcion: 'Consulta en línea de antecedentes judiciales por cédula de ciudadanía.',
    norma: 'Art. 248 Constitución Política',
  },
  {
    id: 'policia-rnmc',
    nombre: 'Policía Nacional - Medidas Correctivas (RNMC)',
    entidad: 'Policía Nacional de Colombia',
    categoria: 'Antecedentes',
    url: 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
    descripcion: 'Registro Nacional de Medidas Correctivas y comparendos del Código de Seguridad y Convivencia (Ley 1801/2016).',
    norma: 'Ley 1801/2016',
  },
  {
    id: 'procuraduria-siri',
    nombre: 'Procuraduría General - Antecedentes Disciplinarios (SIRI)',
    entidad: 'Procuraduría General de la Nación',
    categoria: 'Antecedentes',
    url: 'https://www.procuraduria.gov.co/Pages/Consulta-de-Antecedentes.aspx',
    descripcion: 'Certificado ordinario o especial de antecedentes disciplinarios, penales y contractuales.',
    norma: 'Ley 1952/2019',
  },
  {
    id: 'contraloria-sibor',
    nombre: 'Contraloría General - Responsabilidad Fiscal (SIBOR)',
    entidad: 'Contraloría General de la República',
    categoria: 'Antecedentes',
    url: 'https://www.contraloria.gov.co/control-fiscal/responsabilidad-fiscal/certificado-de-antecedentes-fiscales',
    descripcion: 'Certificado de no inclusión en el Boletín de Responsables Fiscales.',
    norma: 'Ley 610/2000',
  },
  {
    id: 'rama-judicial-portal',
    nombre: 'Rama Judicial - Consulta Nacional de Procesos Unificada',
    entidad: 'Consejo Superior de la Judicatura',
    categoria: 'Antecedentes',
    url: 'https://consultaprocesos.ramajudicial.gov.co/Procesos/Index',
    descripcion: 'Portal web oficial de Consulta de Procesos Nacional Unificada por nombre o razón social.',
    norma: 'Rama Judicial v2',
  },
  {
    id: 'inhabilidades-delitos-sexuales',
    nombre: 'Policía Nacional - Inhabilidades por Delitos contra Menores',
    entidad: 'Policía Nacional / ICBF',
    categoria: 'Antecedentes',
    url: 'https://inhabilidades.policia.gov.co:8080/',
    descripcion: 'Verificación obligatoria para cargos con contacto con menores de edad (transporte escolar, colegios, recreación).',
    norma: 'Ley 1918/2018',
  },
];

function normalizeCategoria(rawCat?: string): PortalOficialItem['categoria'] {
  const c = (rawCat || '').toLowerCase();
  if (/(arl|seguridad social|ruaf|adres|eps|pila|salud)/.test(c) && !/(rethus|matr|retie)/.test(c)) {
    return 'ARL y Seguridad Social';
  }
  if (/(simit|runt|pesv|vial|tránsito|transito|placa|vehic|conduc)/.test(c)) {
    return 'SIMIT y RUNT (PESV)';
  }
  if (/(alto riesgo|alturas|confinados|sena|mintrabajo|onac)/.test(c)) {
    return 'Alto Riesgo y SENA';
  }
  if (/(matr|retie|conte|copnia|conaltel|rethus|licencia|ing)/.test(c)) {
    return 'Matrículas RETIE/Salud/Ing';
  }
  if (/(antecedente|judicial|polic|procuradur|contralor|rnmc|inhabilidad)/.test(c)) {
    return 'Antecedentes';
  }
  return 'ARL y Seguridad Social';
}

export const WorkerOsint360Modal: React.FC<WorkerOsint360ModalProps> = ({
  isOpen,
  onClose,
  initialCedula = '',
  initialTipoDoc = 'CC',
  initialNombre = '',
  initialPlaca = '',
}) => {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();

  const [tipoDoc, setTipoDoc] = useState<string>(initialTipoDoc || 'CC');
  const [cedula, setCedula] = useState<string>(initialCedula || '');
  const [nombre, setNombre] = useState<string>(initialNombre || '');
  const [placa, setPlaca] = useState<string>(initialPlaca || '');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadingTarget, setDownloadingTarget] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [minTrabajo, setMinTrabajo] = useState<MinTrabajoResult | null>(null);
  const [ramaJudicial, setRamaJudicial] = useState<RamaJudicialResult | null>(null);
  const [portalesRemotos, setPortalesRemotos] = useState<PortalOficialItem[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaFiltro>('Todos');
  const [copiedPortalId, setCopiedPortalId] = useState<string | null>(null);

  // Sync props when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      setTipoDoc(initialTipoDoc?.trim() || 'CC');
      setCedula(initialCedula?.trim() || '');
      setNombre(initialNombre?.trim() || '');
      setPlaca(initialPlaca?.trim().toUpperCase() || '');
    }
  }, [isOpen, initialCedula, initialTipoDoc, initialNombre, initialPlaca]);

  const handleOpenOrDownloadPdfBase64 = useCallback(
    (base64Data: string, customFileName?: string | null) => {
      try {
        const cleanBase64 = base64Data.includes(',')
          ? base64Data.split(',')[1]
          : base64Data;
        const byteCharacters = atob((cleanBase64 || '').trim());
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        // Open PDF in a new tab for immediate inspection
        window.open(blobUrl, '_blank', 'noopener,noreferrer');

        // Also trigger direct file download with official filename
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download =
          customFileName?.trim() ||
          `Constancia_MinTrabajo_${cedula.trim() || 'Trabajador'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        showToast({
          message: 'Constancia PDF abierta y descargada correctamente',
          status: 'success',
        });
      } catch (err) {
        console.error('Error procesando PDF base64:', err);
        showToast({
          message: 'No fue posible abrir el archivo PDF de MinTrabajo.',
          status: 'error',
        });
      }
    },
    [cedula, showToast],
  );

  const ejecutarInvestigacion360 = useCallback(
    async (overrideCedula?: string, overrideTipoDoc?: string, overrideNombre?: string, overridePlaca?: string) => {
      const targetCedula = (overrideCedula !== undefined ? overrideCedula : cedula).trim();
      const targetTipoDoc = (overrideTipoDoc !== undefined ? overrideTipoDoc : tipoDoc).trim() || 'CC';
      const targetNombre = (overrideNombre !== undefined ? overrideNombre : nombre).trim();
      const targetPlaca = (overridePlaca !== undefined ? overridePlaca : placa).trim().toUpperCase();

      if (!targetCedula) {
        showToast({
          message: 'Ingresa un número de documento (cédula) para iniciar la investigación 360°.',
          status: 'warning',
        });
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      try {
        const res = await fetch('/api/sgsst/workers/osint-360', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            tipoDoc: targetTipoDoc,
            cedula: targetCedula,
            nombre: targetNombre,
            placa: targetPlaca,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || data?.message || 'Error al consultar fuentes oficiales');
        }

        const rawMt = data?.minTrabajo || {};
        const rawHistorial = Array.isArray(rawMt.historialCompleto)
          ? rawMt.historialCompleto
          : Array.isArray(rawMt.certificados)
          ? rawMt.certificados
          : Array.isArray(rawMt.cursos)
          ? rawMt.cursos
          : [];
        const mt: MinTrabajoResult = {
          ...rawMt,
          encontrado: Boolean(rawMt.encontrado ?? rawHistorial.length > 0),
          activoEnAlturas: Boolean(rawMt.activoEnAlturas),
          activoEnConfinados: Boolean(rawMt.activoEnConfinados),
          titular: rawMt.titular || rawMt.nombreTitular || rawMt.nombre || '',
          historialCompleto: rawHistorial,
        };
        setMinTrabajo(mt);

        // Autocompletar Nombre Completo si MinTrabajo devuelve titular
        if (mt?.titular && typeof mt.titular === 'string' && mt.titular.trim()) {
          setNombre((prev) => (prev?.trim() ? prev : mt.titular!.trim()));
        }

        const rawRj = data?.ramaJudicial || {};
        const rawProcesos = Array.isArray(rawRj.procesos) ? rawRj.procesos : [];
        const rj: RamaJudicialResult = {
          ...rawRj,
          totalProcesos:
            typeof rawRj.totalProcesos === 'number'
              ? rawRj.totalProcesos
              : typeof rawRj.cantidadProcesos === 'number'
              ? rawRj.cantidadProcesos
              : rawProcesos.length,
          procesos: rawProcesos,
        };
        setRamaJudicial(rj);

        // Normalizar portalesOficiales si el backend los envía (array u objeto agrupado)
        const rawPortalesList = Array.isArray(data?.portalesOficiales)
          ? data.portalesOficiales
          : data?.portalesOficiales && typeof data.portalesOficiales === 'object'
          ? Object.entries(data.portalesOficiales).flatMap(([catKey, items]: [string, any]) =>
              Array.isArray(items)
                ? items.map((item) => ({ ...item, categoria: item?.categoria || catKey }))
                : [],
            )
          : [];

        if (rawPortalesList.length > 0) {
          const mapped: PortalOficialItem[] = rawPortalesList.map((p: any, idx: number) => ({
            id: String(p?.id || `portal-${idx}`),
            nombre: String(p?.nombre || p?.title || p?.name || 'Portal Oficial'),
            entidad: String(p?.entidad || p?.entity || ''),
            categoria:
              CATEGORIAS_FILTRO.includes(p?.categoria)
                ? p.categoria
                : normalizeCategoria(p?.categoria || p?.category || p?.nombre),
            url: String(p?.url || p?.link || '#'),
            descripcion: String(p?.descripcion || p?.description || p?.instruccion || ''),
            usaPlaca: Boolean(
              p?.usaPlaca ||
                p?.copiar === 'placa' ||
                /(placa|vehículo|vehiculo)/i.test(String(p?.nombre || '')),
            ),
            norma: String(p?.norma || ''),
          }));
          setPortalesRemotos(mapped);
        }

        showToast({
          message: mt?.encontrado
            ? `Investigación 360° completada: ${mt.titular || targetCedula}`
            : 'Consulta 360° ejecutada en fuentes oficiales',
          status: 'success',
        });
      } catch (err: any) {
        console.error('Error en OSINT 360:', err);
        showToast({
          message: err?.message || 'No se pudo completar la consulta en vivo.',
          status: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [cedula, tipoDoc, nombre, placa, token, showToast],
  );

  // Si se abre el modal con una cédula inicial pre-cargada, lanzar la consulta automáticamente
  useEffect(() => {
    if (isOpen && initialCedula && initialCedula.trim().length >= 5) {
      ejecutarInvestigacion360(
        initialCedula.trim(),
        initialTipoDoc?.trim() || 'CC',
        initialNombre?.trim() || '',
        initialPlaca?.trim() || '',
      );
    } else if (!isOpen) {
      setHasSearched(false);
      setMinTrabajo(null);
      setRamaJudicial(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialCedula]);

  const handleDownloadRowPdf = useCallback(
    async (row: MinTrabajoCursoRow, idx: number) => {
      const targetKey = row?.eventTarget || `row-${idx}`;
      if (!row?.eventTarget) {
        if (minTrabajo?.pdfBase64) {
          handleOpenOrDownloadPdfBase64(minTrabajo.pdfBase64, minTrabajo.pdfFileName);
          return;
        }
        showToast({
          message: 'Este registro no incluye identificador directo de descarga en MinTrabajo.',
          status: 'warning',
        });
        return;
      }

      setDownloadingTarget(targetKey);
      try {
        const res = await fetch('/api/sgsst/workers/osint-mintrabajo-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            tipoDoc: tipoDoc.trim() || 'CC',
            cedula: cedula.trim(),
            eventTarget: row.eventTarget,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/pdf')) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank', 'noopener,noreferrer');
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `Constancia_MinTrabajo_${cedula.trim() || 'Curso'}_${idx + 1}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          showToast({
            message: 'Constancia PDF descargada desde MinTrabajo',
            status: 'success',
          });
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.pdfBase64) {
          throw new Error(data?.error || 'MinTrabajo no devolvió el PDF para esta fila.');
        }

        handleOpenOrDownloadPdfBase64(
          data.pdfBase64,
          data.pdfFileName || data.fileName || `Constancia_MinTrabajo_${cedula.trim()}_${idx + 1}.pdf`,
        );
      } catch (err: any) {
        console.error('Error descargando PDF de fila MinTrabajo:', err);
        showToast({
          message: err?.message || 'Error al descargar la constancia desde MinTrabajo.',
          status: 'error',
        });
      } finally {
        setDownloadingTarget(null);
      }
    },
    [tipoDoc, cedula, token, minTrabajo, handleOpenOrDownloadPdfBase64, showToast],
  );

  const portalesList = useMemo<PortalOficialItem[]>(() => {
    return portalesRemotos.length > 0 ? portalesRemotos : DEFAULT_26_PORTALES_OFICIALES;
  }, [portalesRemotos]);

  const portalesFiltrados = useMemo<PortalOficialItem[]>(() => {
    if (categoriaActiva === 'Todos') return portalesList;
    return portalesList.filter((p) => p.categoria === categoriaActiva);
  }, [portalesList, categoriaActiva]);

  const handleOpenPortalAndCopy = useCallback(
    async (portal: PortalOficialItem) => {
      const cleanPlaca = (placa || '').trim().toUpperCase();
      const cleanCedula = (cedula || '').trim();
      const usePlateValue = Boolean(portal.usaPlaca && cleanPlaca);
      const valueToCopy = usePlateValue ? cleanPlaca : cleanCedula;

      if (valueToCopy && navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(valueToCopy);
        } catch {}
      }

      setCopiedPortalId(portal.id);
      setTimeout(() => {
        setCopiedPortalId((prev) => (prev === portal.id ? null : prev));
      }, 2500);

      showToast({
        message: usePlateValue
          ? `Cédula copiada al portapapeles (Placa: ${cleanPlaca})`
          : 'Cédula copiada al portapapeles',
        status: 'success',
      });

      window.open(portal.url, '_blank', 'noopener,noreferrer');
    },
    [cedula, placa, showToast],
  );

  const historialCursos = useMemo<MinTrabajoCursoRow[]>(() => {
    return Array.isArray(minTrabajo?.historialCompleto) ? minTrabajo!.historialCompleto! : [];
  }, [minTrabajo]);

  const procesosList = useMemo<RamaJudicialProceso[]>(() => {
    return Array.isArray(ramaJudicial?.procesos) ? ramaJudicial!.procesos! : [];
  }, [ramaJudicial]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 overflow-x-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] rounded-3xl border border-border-medium/60 bg-surface-primary dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luces ambientales WAPPY Design System */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* ═══ CABECERA DEL MODAL ═══ */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border-medium/50 bg-surface-secondary/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-300 shrink-0 shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent truncate">
                  Investigación 360° de Trabajadores y Conductores en Colombia
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[11px] font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Res. 4272 · Res. 0491 · PESV · 26 Fuentes
                </span>
              </div>
              <p className="text-xs text-text-secondary truncate">
                Verificación en vivo de Certificados MinTrabajo (Alturas y Confinados con descarga PDF), Rama Judicial, SIMIT, RUNT, ARL, RUAF y Matrículas Profesionales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExpandableButton
              variant="neutral"
              size="sm"
              icon={<X className="h-4 w-4" />}
              label="Cerrar"
              onClick={onClose}
            />
          </div>
        </div>

        {/* ═══ CUERPO SCROLLABLE ═══ */}
        <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6">
          {/* ─── FORMULARIO SUPERIOR DE CONSULTA 360° ─── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ejecutarInvestigacion360();
            }}
            className="rounded-2xl border border-border-medium/60 bg-surface-secondary/60 p-4 sm:p-5 backdrop-blur-sm shadow-xs space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* Selector Tipo de Documento */}
              <div className="lg:col-span-2 space-y-1 min-w-0">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Tipo Doc.
                </label>
                <select
                  value={tipoDoc}
                  onChange={(e) => setTipoDoc(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border-medium bg-surface-primary text-text-primary text-xs font-bold focus:ring-2 focus:ring-teal-500/40 outline-none"
                >
                  {TIPOS_DOCUMENTO.map((td) => (
                    <option key={td.value} value={td.value}>
                      {td.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Número de Cédula */}
              <div className="lg:col-span-3 space-y-1 min-w-0">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Número de Cédula / ID *
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value.replace(/[^0-9a-zA-Z-]/g, ''))}
                    placeholder="Ej: 43834447 o 1037589726"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-border-medium bg-surface-primary text-text-primary text-sm font-bold placeholder:font-normal placeholder:text-text-secondary/60 focus:ring-2 focus:ring-teal-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Input Opcional Nombre Completo */}
              <div className="lg:col-span-4 space-y-1 min-w-0">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Nombre Completo (Se autocompleta con MinTrabajo)
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Opcional para Rama Judicial (autocompletable)"
                  className="w-full h-10 px-3 rounded-xl border border-border-medium bg-surface-primary text-text-primary text-sm font-medium placeholder:text-text-secondary/60 focus:ring-2 focus:ring-teal-500/40 outline-none"
                />
              </div>

              {/* Input Opcional Placa Vehículo */}
              <div className="lg:col-span-3 space-y-1 min-w-0">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Placa Vehículo (SIMIT / RUNT PESV)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                    placeholder="Ej: ABC123"
                    className="w-full h-10 px-3 rounded-xl border border-border-medium bg-surface-primary text-text-primary text-sm font-mono font-bold uppercase placeholder:font-sans placeholder:font-normal placeholder:text-text-secondary/60 focus:ring-2 focus:ring-teal-500/40 outline-none"
                  />
                  <ExpandableButton
                    type="submit"
                    variant="cyan"
                    size="md"
                    disabled={isLoading || !cedula.trim()}
                    icon={
                      isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )
                    }
                    label={isLoading ? 'Investigando...' : 'Investigar 360°'}
                    title="Ejecutar consulta en vivo en MinTrabajo, Rama Judicial y 26 Portales Oficiales"
                  />
                </div>
              </div>
            </div>

            {/* Accesos rápidos de prueba y estado */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-text-secondary">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Consulta directa sin intermediarios:</span>
                <span>MinTrabajo (ViewState + Descarga PDF Real)</span>
                <span>•</span>
                <span>Rama Judicial API v2</span>
                <span>•</span>
                <span>26 Portales Oficiales</span>
              </div>
              {cedula.trim() && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-surface-primary border border-border-light font-mono text-xs font-bold text-text-primary">
                    {tipoDoc}: {cedula.trim()}
                    {placa.trim() ? ` · Placa: ${placa.trim()}` : ''}
                  </span>
                </div>
              )}
            </div>
          </form>

          {/* ─── SECCIÓN 1: CERTIFICADOS MINISTERIO DEL TRABAJO (ALTURAS RES. 4272 Y CONFINADOS RES. 0491) ─── */}
          <div className="rounded-2xl border border-border-medium/60 bg-surface-primary/70 p-4 sm:p-6 backdrop-blur-sm space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                  <HardHat className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-text-primary">
                    1. Certificados Ministerio del Trabajo (Alturas Res. 4272/2021 y Confinados Res. 0491/2020)
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Consulta en tiempo real en el Registro Oficial de Centros de Entrenamiento de MinTrabajo
                  </p>
                </div>
              </div>

              {/* Badge de Estado Oficial MinTrabajo */}
              {hasSearched && !isLoading && minTrabajo && (
                <div className="flex flex-wrap items-center gap-2">
                  {minTrabajo.activoEnAlturas === true ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border border-emerald-500/70 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30">
                      🟢 CERTIFICADO DE ALTURAS ACTIVO / VIGENTE
                    </span>
                  ) : minTrabajo.encontrado && !minTrabajo.activoEnAlturas ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                      🔴 CERTIFICADO VENCIDO (&gt; 18 MESES)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-zinc-300">
                      ⚪ SIN REGISTROS EN MINTRABAJO
                    </span>
                  )}

                  {/* Botón destacado para Descargar / Ver Constancia Vigente en PDF */}
                  {minTrabajo.pdfBase64 && (
                    <ExpandableButton
                      variant="green"
                      size="md"
                      icon={<Download className="h-4 w-4" />}
                      label="Descargar / Ver Constancia Vigente en PDF"
                      onClick={() =>
                        handleOpenOrDownloadPdfBase64(
                          minTrabajo.pdfBase64!,
                          minTrabajo.pdfFileName,
                        )
                      }
                    />
                  )}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-text-secondary gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                <span className="text-sm font-semibold">
                  Consultando servidor del Ministerio del Trabajo y extrayendo constancia PDF en vivo...
                </span>
              </div>
            ) : !hasSearched ? (
              <div className="rounded-xl border border-dashed border-border-medium p-5 text-center text-xs text-text-secondary">
                Ingresa la cédula del trabajador o conductor arriba y presiona el botón de búsqueda para verificar sus certificados de Trabajo en Alturas y Espacios Confinados directamente en MinTrabajo.
              </div>
            ) : minTrabajo ? (
              <div className="space-y-4">
                {/* Titular y Tarjetas Resumen Último Curso Alturas y Confinados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Titular Oficial */}
                  <div className="rounded-xl border border-border-medium/60 bg-surface-secondary/50 p-3.5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                      Titular Registrado en MinTrabajo
                    </span>
                    <p className="text-sm font-extrabold text-text-primary">
                      {minTrabajo.titular?.trim() || nombre?.trim() || 'Sin registro nominal en MinTrabajo'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Documento: {tipoDoc} {cedula.trim()}
                    </p>
                  </div>

                  {/* Resumen Último Curso de Alturas */}
                  <div className="rounded-xl border border-border-medium/60 bg-surface-secondary/50 p-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                        Último Curso de Alturas (Res. 4272)
                      </span>
                      {minTrabajo.ultimoCursoAlturas && (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-lg text-[10px] font-bold',
                            minTrabajo.ultimoCursoAlturas.vigente
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
                          )}
                        >
                          {minTrabajo.ultimoCursoAlturas.vigente ? 'Vigente' : 'Reentrenamiento Requerido'}
                        </span>
                      )}
                    </div>
                    {minTrabajo.ultimoCursoAlturas ? (
                      <>
                        <p className="text-xs font-extrabold text-text-primary">
                          {minTrabajo.ultimoCursoAlturas.nivel || minTrabajo.ultimoCursoAlturas.programa || 'Trabajo en Alturas'}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          Fecha Fin: <strong className="text-text-primary">{minTrabajo.ultimoCursoAlturas.fechaFin || '—'}</strong> · Centro: {minTrabajo.ultimoCursoAlturas.organizacion || '—'}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-text-secondary italic">
                        No registra cursos de Trabajo Seguro en Alturas.
                      </p>
                    )}
                  </div>

                  {/* Resumen Último Curso de Espacios Confinados */}
                  <div className="rounded-xl border border-border-medium/60 bg-surface-secondary/50 p-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                        Último Curso Espacios Confinados (Res. 0491)
                      </span>
                      {minTrabajo.ultimoCursoConfinados && (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-lg text-[10px] font-bold',
                            minTrabajo.ultimoCursoConfinados.vigente
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
                          )}
                        >
                          {minTrabajo.ultimoCursoConfinados.vigente ? 'Vigente' : 'Histórico'}
                        </span>
                      )}
                    </div>
                    {minTrabajo.ultimoCursoConfinados ? (
                      <>
                        <p className="text-xs font-extrabold text-text-primary">
                          {minTrabajo.ultimoCursoConfinados.nivel || minTrabajo.ultimoCursoConfinados.programa || 'Espacios Confinados'}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          Fecha Fin: <strong className="text-text-primary">{minTrabajo.ultimoCursoConfinados.fechaFin || '—'}</strong> · Centro: {minTrabajo.ultimoCursoConfinados.organizacion || '—'}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-text-secondary italic">
                        No registra cursos de Espacios Confinados.
                      </p>
                    )}
                  </div>
                </div>

                {/* Tabla Historial Completo de Cursos en MinTrabajo */}
                {historialCursos.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-border-medium/60">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-secondary/90 border-b border-border-medium/60 text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                          <th className="py-2.5 px-3">Programa</th>
                          <th className="py-2.5 px-3">Nivel</th>
                          <th className="py-2.5 px-3">Fecha Inicio</th>
                          <th className="py-2.5 px-3">Fecha Fin</th>
                          <th className="py-2.5 px-3">Centro / Organización</th>
                          <th className="py-2.5 px-3">Sede</th>
                          <th className="py-2.5 px-3">Estado</th>
                          <th className="py-2.5 px-3 text-right">Constancia PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {historialCursos.map((row, idx) => {
                          const rowKey = row.eventTarget || `row-${idx}`;
                          const isDownloadingThis = downloadingTarget === rowKey;
                          return (
                            <tr
                              key={rowKey}
                              className="hover:bg-surface-secondary/40 transition-colors"
                            >
                              <td className="py-2.5 px-3 font-bold text-text-primary">
                                {row.programa?.trim() || 'Formación Alto Riesgo'}
                              </td>
                              <td className="py-2.5 px-3 text-text-primary font-semibold">
                                {row.nivel?.trim() || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">
                                {row.fechaInicio?.trim() || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-text-primary font-semibold whitespace-nowrap">
                                {row.fechaFin?.trim() || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-text-secondary">
                                {row.organizacion?.trim() || row.entrenador?.trim() || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-text-secondary">
                                {row.sede?.trim() || '—'}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {row.vigente ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    🟢 Vigente
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                    🔴 Vencido (&gt;18m)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex justify-end">
                                  <ExpandableButton
                                    variant="green"
                                    size="sm"
                                    disabled={isDownloadingThis}
                                    icon={
                                      isDownloadingThis ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Download className="h-3.5 w-3.5" />
                                      )
                                    }
                                    label="Descargar PDF"
                                    title="Descargar constancia oficial en PDF de este curso desde MinTrabajo"
                                    onClick={() => handleDownloadRowPdf(row, idx)}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* ─── SECCIÓN 2: PROCESOS EN RAMA JUDICIAL (API OFICIAL V2) ─── */}
          <div className="rounded-2xl border border-border-medium/60 bg-surface-primary/70 p-4 sm:p-6 backdrop-blur-sm space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                  <Scale className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-text-primary">
                    2. Procesos en Rama Judicial (API Oficial Consulta Nacional Unificada v2)
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Búsqueda automática de procesos judiciales activos o históricos a nombre del titular
                  </p>
                </div>
              </div>

              {hasSearched && !isLoading && ramaJudicial && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border',
                    (ramaJudicial.totalProcesos ?? procesosList.length) === 0
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                  )}
                >
                  {(ramaJudicial.totalProcesos ?? procesosList.length) === 0
                    ? '0 Procesos Judiciales Encontrados'
                    : `${ramaJudicial.totalProcesos ?? procesosList.length} Procesos Encontrados`}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-text-secondary gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                <span className="text-xs font-semibold">
                  Consultando API Nacional de Procesos de la Rama Judicial...
                </span>
              </div>
            ) : !hasSearched ? (
              <div className="rounded-xl border border-dashed border-border-medium p-4 text-center text-xs text-text-secondary">
                Al ejecutar la consulta 360°, si se dispone del nombre del titular (o MinTrabajo lo autocompleta), se consultará automáticamente la API Oficial v2 de la Rama Judicial.
              </div>
            ) : procesosList.length === 0 ? (
              <div className="rounded-xl border border-border-medium/50 bg-surface-secondary/40 p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    {ramaJudicial?.mensaje ||
                      (nombre.trim() || minTrabajo?.titular
                        ? `No se encontraron procesos judiciales públicos para "${minTrabajo?.titular || nombre.trim()}".`
                        : 'Ingresa el nombre completo del trabajador para consultar procesos por sujeto procesal en Rama Judicial.')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border-medium/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-secondary/90 border-b border-border-medium/60 text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                      <th className="py-2.5 px-3">Radicado / Llave Proceso</th>
                      <th className="py-2.5 px-3">Despacho Judicial</th>
                      <th className="py-2.5 px-3">Departamento</th>
                      <th className="py-2.5 px-3">Última Actuación</th>
                      <th className="py-2.5 px-3">Sujetos Procesales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {procesosList.map((proc, pIdx) => (
                      <tr
                        key={proc.idProceso || proc.llaveProceso || pIdx}
                        className="hover:bg-surface-secondary/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-text-primary whitespace-nowrap">
                          {proc.llaveProceso?.trim() || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-text-primary font-medium">
                          {proc.despacho?.trim() || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">
                          {proc.departamento?.trim() || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">
                          {proc.fechaUltimaActuacion?.trim() || proc.fechaProceso?.trim() || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary max-w-xs truncate" title={proc.sujetosProcesales || ''}>
                          {proc.sujetosProcesales?.trim() || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─── SECCIÓN 3: CENTRAL DE VERIFICACIÓN EN LAS 26 FUENTES OFICIALES ─── */}
          <div className="rounded-2xl border border-border-medium/60 bg-surface-primary/70 p-4 sm:p-6 backdrop-blur-sm space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-300 shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-text-primary">
                    3. Central de Verificación en las 26 Fuentes Oficiales (ARL, RUAF, ADRES, SIMIT, RUNT, CONTE, COPNIA, ReTHUS, Antecedentes)
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Haz clic en cualquier portal para copiar automáticamente la cédula o placa al portapapeles y abrir la consulta oficial en nueva pestaña.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300">
                {portalesFiltrados.length} de {portalesList.length} Fuentes Oficiales
              </span>
            </div>

            {/* Filtro por Categoría */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-surface-secondary/80 border border-border-medium/50">
              {CATEGORIAS_FILTRO.map((cat) => {
                const active = categoriaActiva === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaActiva(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      active
                        ? 'bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-300 shadow-2xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary/60',
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Grid de 26 Portales Oficiales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {portalesFiltrados.map((portal) => {
                const isCopied = copiedPortalId === portal.id;
                const usesPlaca = Boolean(portal.usaPlaca && placa.trim());
                return (
                  <div
                    key={portal.id}
                    className="group rounded-2xl border border-border-medium/50 bg-surface-secondary/40 p-4 flex flex-col justify-between gap-3 transition-all duration-300 hover:border-teal-500/40 hover:shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                          {portal.categoria}
                        </span>
                        {portal.norma && (
                          <span className="text-[10px] font-semibold text-text-secondary">
                            {portal.norma}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-text-primary leading-snug">
                        {portal.nombre}
                      </h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {portal.descripcion}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-light/60">
                      <span className="text-[10px] font-mono text-text-secondary truncate">
                        {usesPlaca
                          ? `Placa: ${placa.trim()}`
                          : cedula.trim()
                          ? `${tipoDoc}: ${cedula.trim()}`
                          : 'Copia automática 1-Clic'}
                      </span>
                      <ExpandableButton
                        variant={isCopied ? 'teal' : 'fuchsia'}
                        size="sm"
                        icon={
                          isCopied ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                          )
                        }
                        label={
                          isCopied
                            ? '¡Copiado! Abriendo...'
                            : portal.usaPlaca
                            ? 'Ir y Copiar Cédula/Placa'
                            : 'Ir y Copiar Cédula'
                        }
                        title={`Copiar ${usesPlaca ? 'placa' : 'cédula'} al portapapeles y abrir ${portal.nombre}`}
                        onClick={() => handleOpenPortalAndCopy(portal)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(modalContent, document.body)
    : modalContent;
};

export default WorkerOsint360Modal;
