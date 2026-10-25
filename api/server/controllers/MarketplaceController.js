const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const MarketplaceProduct = require('~/models/MarketplaceProduct');
const MarketplaceOrder = require('~/models/MarketplaceOrder');
const MarketplaceCategory = require('~/models/MarketplaceCategory');
const MarketplaceCoupon = require('~/models/MarketplaceCoupon');
const { getAppConfig } = require('~/server/services/Config');
const { logger } = require('~/config');

// Default initial categories for Occupational Health & SG-SST
const DEFAULT_CATEGORIES = [
  { name: 'Complementos WAPPY', slug: 'complementos_wappy', description: 'Empresas adicionales, automatizaciones 24/7 y cupos de subusuarios para tu cuenta', icon: 'Sparkles', order: 0 },
  { name: 'Medicina Laboral', slug: 'medicina_laboral', description: 'Exámenes médicos ocupacionales de ingreso, periódicos y retiro', icon: 'Stethoscope', order: 1 },
  { name: 'Matrices & Peligros', slug: 'gtc45_ipevar', description: 'Matrices IPEVAR, GTC-45 y evaluación técnica de riesgos', icon: 'FileSpreadsheet', order: 2 },
  { name: 'Seguridad Vial PESV', slug: 'pesv', description: 'Diseño e implementación del Plan Estratégico de Seguridad Vial', icon: 'Car', order: 3 },
  { name: 'Riesgo Psicosocial', slug: 'psicosocial', description: 'Baterías de riesgo psicosocial y diagnóstico de clima laboral', icon: 'HeartPulse', order: 4 },
  { name: 'Ergonomía & Biomecánica', slug: 'ergonomia', description: 'Estudios de puestos de trabajo y análisis de carga física', icon: 'Activity', order: 5 },
  { name: 'Auditoría & Consultoría', slug: 'auditoria', description: 'Auditorías de estándares mínimos Res. 0312 e inspecciones', icon: 'ClipboardCheck', order: 6 },
  { name: 'Capacitación Certificada', slug: 'capacitaciones', description: 'Formación normativa en SST, COPASST y brigadas', icon: 'GraduationCap', order: 7 }
];

// Official primary course product (visible to all users)
const OFFICIAL_COURSE_PRODUCT = {
  title: 'Curso Ecosistema Autónomo SST: De la Operatividad a la Prevención Real',
  slug: 'curso-ecosistema-autonomo-sst',
  sku: 'WAPPY-CURSO-01',
  shortDescription: '6 Clases grupales en vivo (martes 7 a 9 PM vía Google Meet, inicia Octubre 20) + 1 sesión final VIP personalizada (3 a 4 horas). Conecta WAPPY con Antigravity, Tenshi Voice, NotebookLM y Workspace.',
  description: 'Entrenamiento intensivo de alto nivel para profesionales y consultores SST en Colombia. Aprende a conectar WAPPY con Google Antigravity, Tenshi Voice (manos libres en campo), Google NotebookLM (citas normativas exactas y podcasts de capacitación), Google Workspace (Drive con archivo 20 años, Calendar y Gmail automatizados), Flow y la construcción de tu propio aplicativo o asistente SST llave en mano. Reduce el 50% de tu carga administrativa y documental desde la primera sesión.',
  category: 'capacitaciones',
  tags: ['Curso SST', 'Antigravity', 'Tenshi Voice', 'NotebookLM', 'WAPPY IA', 'Inteligencia Artificial', 'Normativa Colombiana'],
  serviceType: 'service_virtual',
  regularPrice: 620000,
  salePrice: 620000,
  hasDiscount: false,
  hasVariants: false,
  estimatedDeliveryDays: 'Inicio Martes 20 Octubre · 7:00 PM (Google Meet: meet.google.com/xvz-jmvv-iym)',
  deliverables: [
    'Enlace oficial Google Meet en vivo: https://meet.google.com/xvz-jmvv-iym',
    '6 Clases grupales en vivo los martes de 7:00 PM a 9:00 PM con streaming y grabaciones',
    '1 Sesión VIP personalizada 1 a 1 de 3 a 4 horas llave en mano (acordada individualmente)',
    'Ecosistema completo WAPPY + Antigravity + Tenshi Voice + NotebookLM + Workspace',
    'Plantillas y automatizaciones para inspecciones, matrices, actas y archivo digital',
    'Máximo 12 cupos disponibles · Se reciben inscripciones estrictamente hasta copar cupos',
    'Certificado oficial de finalización y aprobación emitido por WAPPY'
  ],
  requirements: [
    'Computador con Windows 10/11, macOS o Linux con 8GB+ RAM',
    'Conexión a internet estable para las sesiones en vivo'
  ],
  faqs: [
    {
      question: '¿Cuál es el enlace oficial de conexión a las clases?',
      answer: 'Nos conectaremos todos los martes de 7:00 PM a 9:00 PM (hora Colombia) a través de Google Meet en el siguiente enlace oficial: https://meet.google.com/xvz-jmvv-iym.'
    },
    {
      question: '¿Cuáles son las formas de pago?',
      answer: 'El valor es de contado ($620.000 COP). Puedes pagar de contado mediante QR oficial WAPPY, Nequi, Bancolombia, PSE o financiar a crédito en 4 cuotas de $155.000 COP sin interés con Bancolombia/Nequi BNPL (comienzas a pagar el próximo mes) o con tu tarjeta de crédito habitual.'
    },
    {
      question: '¿Cómo funciona la sesión final VIP personalizada?',
      answer: 'Es una sesión intensiva 1 a 1 de 3 a 4 horas directamente con Félix Bedoya. La fecha y el horario se acuerdan de forma flexible y personalizada con cada alumno para dejar su propio aplicativo o entorno de trabajo SST llave en mano.'
    },
    {
      question: '¿Cuántos cupos hay disponibles?',
      answer: 'El curso tiene un cupo estrictamente limitado a 12 participantes para garantizar la calidad pedagógica y el acompañamiento individual en la sesión VIP.'
    }
  ],
  featuredImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
  landingPageUrl: '/cursowappy01',
  status: 'published',
  isFeatured: true,
  isTest: false,
  stockType: 'limited',
  availableSlots: 12,
  rating: 5.0,
  reviewsCount: 12,
  paymentRecipient: 'WAPPY'
};

// Partner Course "Adelanto" connected to Mauricio Posada's Wompi Sandbox
const ADELANTO_COURSE_PRODUCT = {
  title: 'Curso Adelanto',
  slug: 'curso-adelanto',
  sku: 'WAPPY-ADELANTO-01',
  shortDescription: 'Curso especializado Adelanto con pasarela de pagos conectada directamente al proveedor aliado (Mauricio Posada).',
  description: 'Formación integral del programa Adelanto en el ecosistema WAPPY. Este producto procesa sus pagos directamente hacia la cuenta Wompi del proveedor aliado (Mauricio Posada) para validación y recaudo independiente.',
  category: 'capacitaciones',
  tags: ['Adelanto', 'Curso SST', 'Proveedor Aliado', 'WAPPY IA'],
  serviceType: 'service_virtual',
  regularPrice: 150000,
  salePrice: 0,
  hasDiscount: false,
  hasVariants: false,
  estimatedDeliveryDays: 'Acceso inmediato · Modalidad Virtual',
  deliverables: [
    'Acceso completo a las sesiones y contenidos del Curso Adelanto',
    'Material práctico descargable y plantillas aplicables',
    'Certificado de participación y acompañamiento especializado'
  ],
  requirements: [
    'Computador o dispositivo móvil con conexión a internet',
    'Correo electrónico y WhatsApp activos para envío de accesos'
  ],
  faqs: [
    {
      question: '¿A quién se realiza el pago de este curso?',
      answer: 'El pago se procesa de forma 100% segura a través de la pasarela Wompi conectada directamente al proveedor aliado Mauricio Posada.'
    }
  ],
  featuredImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  status: 'published',
  isFeatured: false,
  isTest: false,
  stockType: 'unlimited',
  availableSlots: 0,
  rating: 5.0,
  reviewsCount: 5,
  paymentRecipient: 'PROVIDER',
  providerName: 'Mauricio Posada',
  providerWompi: {
    publicKey: 'pub_test_2GjhltTKLs90rNb19ddrcv4Cj8xZujfk',
    privateKey: 'prv_test_UxyMfuX6vAhnhDfUMyNsCmpiViBlwpuu',
    eventsSecret: 'test_events_onGHUTU2i0mPJq1utJ6jVISerJrizpMn',
    integritySecret: 'test_integrity_MeG6viY2yh3tOrOpg2gxSLmUu3VxeCtm'
  }
};

// Official WAPPY Add-on Services (Extra Company, Automations 24/7, Sub-users)
const WAPPY_ADDON_PRODUCTS = [
  {
    title: 'Adquirir Empresa Adicional (+2 GB Cloud)',
    slug: 'cupo-empresa-adicional-wappy',
    sku: 'WAPPY-ADDON-EMPRESA',
    shortDescription: 'Amplía tu capacidad multi-empresa en WAPPY (Somos SST o Huella Biocéntrica). Incluye +1 empresa gestionable y +2 GB de almacenamiento en la nube.',
    description: 'Agrega empresas adicionales a tu cuenta de WAPPY Pro o WAPPY Vital para gestionar múltiples clientes, razones sociales o sedes independientes con separación total de trabajadores, matrices, indicadores y documentos. Cada cupo de empresa adicional incluye +2 GB extra de almacenamiento seguro en la nube.',
    category: 'complementos_wappy',
    tags: ['Empresa Adicional', 'Multi-empresa', 'Almacenamiento Cloud', 'Complemento WAPPY'],
    serviceType: 'service_virtual',
    regularPrice: 33350,
    salePrice: 0,
    hasDiscount: false,
    hasVariants: true,
    variants: [
      {
        name: 'Periodicidad del Cupo',
        options: [
          { label: 'Mensual ($33.350 COP / empresa)', priceDelta: 0, isDefault: true },
          { label: 'Trimestral ($96.620 COP / empresa)', priceDelta: 63270, isDefault: false },
          { label: 'Semestral ($187.240 COP / empresa)', priceDelta: 153890, isDefault: false },
          { label: 'Anual ($350.000 COP / empresa)', priceDelta: 316650, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: 'Activación automática e inmediata al aprobarse el pago',
    deliverables: [
      'Habilitación inmediata de +1 cupo de empresa adicional en tu cuenta WAPPY',
      'Ampliación automática de +2 GB de almacenamiento en la nube por cada empresa adquirida',
      'Gestión independiente de trabajadores, matrices, documentos y reportes por NIT'
    ],
    requirements: [
      'Contar con una cuenta activa en WAPPY (Plan Wappy Pro o Wappy Vital)'
    ],
    faqs: [
      {
        question: '¿Cómo se activa el cupo en mi cuenta?',
        answer: 'Una vez aprobado el pago en Wompi (o validada la transferencia), el sistema incrementa automáticamente el límite de empresas y el almacenamiento (+2 GB) en tu cuenta.'
      },
      {
        question: '¿Puedo comprar varias empresas a la vez?',
        answer: 'Sí. Puedes ajustar la cantidad en el carrito de compras (1, 2, 5 o más empresas) y seleccionar la periodicidad que prefieras (Mensual, Trimestral, Semestral o Anual).'
      }
    ],
    featuredImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    isTest: false,
    stockType: 'unlimited',
    availableSlots: 0,
    rating: 5.0,
    reviewsCount: 19,
    paymentRecipient: 'WAPPY'
  },
  {
    title: 'Adquirir Automatización 24/7 con Agentes IA',
    slug: 'cupo-automatizacion-ia-wappy',
    sku: 'WAPPY-ADDON-AUTOMATIZACION',
    shortDescription: 'Añade tareas programadas y agentes autónomos 24/7 adicionales en el Centro de Control para monitorear cronogramas, matrices, vencimientos y reportes.',
    description: 'Expande la capacidad de automatización autónoma de tu cuenta WAPPY. Cada cupo adicional te permite programar un nuevo flujo automático 24/7 con cualquiera de los 12 Agentes Especialistas SST (auditoría de vencimientos, seguimiento al Plan Anual de Trabajo, alertas de matriz legal, boletines preventivos y reportes ejecutivos en el Centro de Control).',
    category: 'complementos_wappy',
    tags: ['Automatizaciones', 'Agentes IA 24/7', 'Centro de Control', 'Complemento WAPPY'],
    serviceType: 'service_virtual',
    regularPrice: 25000,
    salePrice: 0,
    hasDiscount: false,
    hasVariants: true,
    variants: [
      {
        name: 'Periodicidad del Cupo',
        options: [
          { label: 'Mensual ($25.000 COP / automatización)', priceDelta: 0, isDefault: true },
          { label: 'Trimestral ($67.500 COP / automatización)', priceDelta: 42500, isDefault: false },
          { label: 'Semestral ($120.000 COP / automatización)', priceDelta: 95000, isDefault: false },
          { label: 'Anual ($210.000 COP / automatización)', priceDelta: 185000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: 'Activación automática e inmediata al aprobarse el pago',
    deliverables: [
      'Habilitación inmediata de +1 cupo de Automatización 24/7 en el Centro de Control',
      'Ejecución programada (diaria, semanal o mensual) con cualquiera de los 12 especialistas IA',
      'Historial completo de ejecuciones y reportes automáticos en tu cuenta'
    ],
    requirements: [
      'Contar con una cuenta activa en WAPPY'
    ],
    faqs: [
      {
        question: '¿Para qué sirve un cupo de automatización adicional?',
        answer: 'Te permite tener múltiples agentes trabajando en segundo plano 24/7 para distintas empresas o procesos (por ejemplo, un agente vigilando el cronograma de capacitación y otro auditando vencimientos de equipos o exámenes médicos).'
      },
      {
        question: '¿Se activa automáticamente tras el pago?',
        answer: 'Sí, al aprobarse la transacción el cupo se suma de inmediato a tu límite de automatizaciones en el Centro de Control.'
      }
    ],
    featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    isTest: false,
    stockType: 'unlimited',
    availableSlots: 0,
    rating: 5.0,
    reviewsCount: 15,
    paymentRecipient: 'WAPPY'
  },
  {
    title: 'Adquirir Subusuario Adicional (Colaborador / Asistente SST)',
    slug: 'cupo-subusuario-adicional-wappy',
    sku: 'WAPPY-ADDON-SUBUSUARIO',
    shortDescription: 'Delega la operación SST en tu equipo de trabajo, inspectores de campo o miembros del COPASST con cuentas de subusuario y permisos granulares por empresa.',
    description: 'Agrega cupos de subusuarios operativos a tu cuenta principal de WAPPY sin compartir tus credenciales de administrador. Ideal para auxiliares SST, inspectores de campo, coordinadores de sede o líderes del COPASST. Tú decides exactamente a qué empresa y a qué módulos tiene acceso cada subusuario.',
    category: 'complementos_wappy',
    tags: ['Subusuarios', 'Equipo SST', 'COPASST', 'Inspectores', 'Complemento WAPPY'],
    serviceType: 'service_virtual',
    regularPrice: 25000,
    salePrice: 0,
    hasDiscount: false,
    hasVariants: true,
    variants: [
      {
        name: 'Periodicidad del Cupo',
        options: [
          { label: 'Mensual ($25.000 COP / subusuario)', priceDelta: 0, isDefault: true },
          { label: 'Trimestral ($67.500 COP / subusuario)', priceDelta: 42500, isDefault: false },
          { label: 'Semestral ($120.000 COP / subusuario)', priceDelta: 95000, isDefault: false },
          { label: 'Anual ($210.000 COP / subusuario)', priceDelta: 185000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: 'Activación automática e inmediata al aprobarse el pago',
    deliverables: [
      'Habilitación inmediata de +1 cupo de Subusuario operativo en tu cuenta',
      'Panel de control de permisos granulares por módulo y asignación por empresa',
      'Acceso independiente con correo y contraseña propios para tu colaborador'
    ],
    requirements: [
      'Contar con una cuenta titular activa en WAPPY'
    ],
    faqs: [
      {
        question: '¿Qué permisos puedo asignarle a un subusuario?',
        answer: 'Desde el gestor de subusuarios puedes elegir qué empresa gestionará y a qué aplicativos tendrá acceso (inspecciones, entrega de EPP, matriz de peligros, perfil sociodemográfico, capacitaciones, etc.).'
      },
      {
        question: '¿Cuándo queda disponible el cupo?',
        answer: 'Inmediatamente después de que el pago es aprobado por la pasarela Wompi o confirmado por administración.'
      }
    ],
    featuredImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    isTest: false,
    stockType: 'unlimited',
    availableSlots: 0,
    rating: 5.0,
    reviewsCount: 14,
    paymentRecipient: 'WAPPY'
  }
];

const DEFAULT_TEST_SLUGS = [
  'bateria-riesgo-psicosocial-completa',
  'matriz-ipevar-gtc45-asistida',
  'diseno-implementacion-pesv',
  'paquete-examenes-medicos-ocupacionales-10',
  'estudio-puesto-trabajo-ergonomico',
  'auditoria-externa-estandares-minimos-0312',
  'investigacion-tecnica-accidente-trabajo-atel'
];

// Official downloadable Matriz IPVR HTML application ($50.000 COP)
const OFFICIAL_MATRIZ_IPVR_APP_PRODUCT = {
  title: 'Aplicativo Descargable Matriz IPVR (GTC-45 Offline + IA)',
  slug: 'aplicativo-descargable-matriz-ipvr',
  sku: 'WAPPY-MATRIZ-IPVR-APP',
  shortDescription: 'Aplicativo portable en formato .HTML 100% autónomo y funcional sin internet (Offline-First) + conexión directa con claves gratuitas de Google Gemini IA, Dashboard e Informe Gerencial A4.',
  description: 'Adquiere la versión descargable y portable del Aplicativo Matriz IPVR (GTC-45 / Decreto 1072 de 2015) en un único archivo .HTML autónomo para tu computador o celular. Funciona 100% sin conexión a internet para gestión manual y te permite conectar tus propias claves gratuitas de Google Gemini IA (con rotación automática) para evaluar peligros y controles inteligentes sin pagar mensualidades.',
  category: 'gtc45_ipevar',
  tags: ['Matriz IPVR', 'GTC-45', 'Aplicativo Descargable', 'Offline HTML', 'Gemini IA', 'Decreto 1072'],
  serviceType: 'digital_download',
  regularPrice: 50000,
  salePrice: 0,
  hasDiscount: false,
  hasVariants: false,
  estimatedDeliveryDays: 'Descarga digital inmediata al aprobarse el pago',
  deliverables: [
    'Archivo maestro .HTML descargable (Aplicativo_Matriz_IPVR_GTC45_WAPPY.html) de uso vitalicio',
    'Funcionamiento 100% Offline (sin internet) en Windows, Mac, Linux, Android o iOS',
    'Creación y gestión ilimitada de empresas, sedes y matrices GTC-45 en tu dispositivo',
    'Módulo de rotación inteligente para conectar tus propias claves gratuitas de Google Gemini IA',
    'Dashboard interactivo de gráficas, mapa de calor ND x NC y priorización de riesgos',
    'Generador automático de Informe Gerencial Ejecutivo A4 con firmas digitales o físicas listo para PDF y Excel'
  ],
  requirements: [
    'Cualquier navegador moderno (Google Chrome, Edge, Safari, Brave o Firefox) en PC o celular',
    'No requiere instalación de servidores ni pagos mensuales'
  ],
  faqs: [
    {
      question: '¿Cómo recibo el archivo descargable .HTML después de pagar?',
      answer: 'Una vez aprobado el pago de $50.000 COP por Wompi (Nequi, PSE, Bancolombia o Tarjeta), se habilita de inmediato el botón "Descargar Aplicativo (.HTML)" tanto en la pantalla de confirmación de tu pedido como en la sección final de /matrizipvr.'
    },
    {
      question: '¿Es un pago único o debo pagar mensualidad?',
      answer: 'Es un pago único de $50.000 COP. El archivo .HTML queda guardado en tu computador o celular para siempre y puedes registrar todas las empresas y matrices que necesites.'
    },
    {
      question: '¿Necesito internet para usar el aplicativo descargado?',
      answer: 'Toda la gestión manual, cálculos matemáticos GTC-45, gráficas, empresas e informes PDF/JSON funcionan 100% sin internet (Offline). Solo necesitas internet si deseas usar la autocompletación automática con tus claves gratuitas de Google Gemini.'
    }
  ],
  featuredImage: '/marketing/marketplace-matriz-ipvr-card-horizontal.png',
  featuredImagePosition: '50% 50%',
  featuredImageScale: 87,
  modalImage: '/marketing/marketplace-matriz-ipvr-modal-vertical.png',
  modalImagePosition: '50% 50%',
  modalImageScale: 65,
  landingPageUrl: '/matrizipvr.html#descargar-aplicativo',
  status: 'published',
  isFeatured: true,
  isTest: false,
  stockType: 'unlimited',
  availableSlots: 0,
  rating: 5.0,
  reviewsCount: 28,
  paymentRecipient: 'WAPPY'
};

// Default initial catalog products
const DEFAULT_PRODUCTS = [
  OFFICIAL_COURSE_PRODUCT,
  OFFICIAL_MATRIZ_IPVR_APP_PRODUCT,
  ...WAPPY_ADDON_PRODUCTS,
  ADELANTO_COURSE_PRODUCT,
  {
    title: 'Batería de Riesgo Psicosocial Completa (Res. 2764 / 2022)',
    slug: 'bateria-riesgo-psicosocial-completa',
    sku: 'SST-PSI-001',
    isTest: true, // Modo prueba solo admin
    shortDescription: 'Aplicación digital y presencial de la batería oficial por psicólogo especialista con licencia SST.',
    description: 'Servicio integral de evaluación del riesgo psicosocial intra-laboral, extra-laboral y de estrés conforme a la Resolución 2764 de 2022 del Ministerio del Trabajo. Incluye plataforma digital asistida, informe general de la empresa, informe individual confidencial y plan de intervención recomendado.',
    category: 'psicosocial',
    tags: ['Psicosocial', 'Res. 2764', 'Salud Mental', 'Psicología SST'],
    serviceType: 'service_hybrid',
    regularPrice: 750000,
    salePrice: 650000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Número de Trabajadores',
        options: [
          { label: '1 a 20 trabajadores', priceDelta: 0, isDefault: true },
          { label: '21 a 50 trabajadores', priceDelta: 250000, isDefault: false },
          { label: '51 a 100 trabajadores', priceDelta: 550000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: '7 a 10 días hábiles',
    deliverables: [
      'Informe epidemiológico general de la organización',
      'Informes individuales confidenciales',
      'Plan de intervención psicosocial priorizado',
      'Certificado de cumplimiento normativo firmado por Psicólogo Especialista en SST'
    ],
    requirements: [
      'Listado de trabajadores con correo y cargo',
      'Espacio u horario para responder el cuestionario (virtual o físico)',
      'Organigrama general de la empresa'
    ],
    faqs: [
      { question: '¿Quién firma el informe?', answer: 'Un psicólogo especialista en Seguridad y Salud en el Trabajo con licencia vigente.' },
      { question: '¿Con qué frecuencia debe realizarse?', answer: 'Cada año para empresas con riesgo medio/alto y cada 2 años para riesgo bajo.' }
    ],
    featuredImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 14
  },
  {
    title: 'Diseño y Actualización de Matriz IPEVAR (GTC-45)',
    slug: 'matriz-ipevar-gtc45-asistida',
    sku: 'SST-PEL-002',
    isTest: true, // Modo prueba solo admin
    shortDescription: 'Identificación de peligros y valoración de riesgos bajo GTC-45 con asistencia técnica experta.',
    description: 'Levantamiento y actualización de la Matriz de Peligros, Evaluación y Valoración de Riesgos (IPEVAR) conforme a la Guía Técnica Colombiana GTC-45 y el Decreto 1072 de 2015. Diseñada a la medida de los procesos, áreas operativas y cargos de su empresa.',
    category: 'gtc45_ipevar',
    tags: ['IPEVAR', 'GTC-45', 'Peligros', 'Decreto 1072'],
    serviceType: 'service_virtual',
    regularPrice: 420000,
    salePrice: 350000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Complejidad y Sedes',
        options: [
          { label: '1 Sede / Administrativo-Comercial', priceDelta: 0, isDefault: true },
          { label: '1 Sede / Operativo-Manufactura', priceDelta: 120000, isDefault: false },
          { label: 'Múltiples Sedes (hasta 3)', priceDelta: 280000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: '4 a 6 días hábiles',
    deliverables: [
      'Matriz IPEVAR completa en formato Excel formulado',
      'Jerarquía de controles (Eliminación, Sustitución, Ingeniería, Administrativos y EPP)',
      'Informe técnico ejecutivo con priorización de medidas preventivas',
      'Sesión de socialización virtual con el responsable SST de la empresa'
    ],
    requirements: [
      'Listado de procesos, actividades y cargos',
      'Inspección fotográfica o recorrido de áreas'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 22
  },
  {
    title: 'Plan Estratégico de Seguridad Vial (PESV - Res. 20223040040595)',
    slug: 'diseno-implementacion-pesv',
    sku: 'SST-VIA-003',
    isTest: true, // Modo prueba solo admin
    shortDescription: 'Estructuración y diseño del PESV según nivel Básico, Estándar o Avanzado.',
    description: 'Estructuración técnica del Plan Estratégico de Seguridad Vial conforme a la metodología de la Resolución 20223040040595 de 2022. Cubre los 4 pasos y 24 pasos según el nivel de su organización (Liderazgo, Gestión del Riesgo Vial, Talento Humano y Vehículos Seguros).',
    category: 'pesv',
    tags: ['PESV', 'Seguridad Vial', 'Movilidad', 'Mintransporte'],
    serviceType: 'service_hybrid',
    regularPrice: 950000,
    salePrice: 850000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Nivel PESV',
        options: [
          { label: 'Nivel Básico (11 a 19 vehículos)', priceDelta: 0, isDefault: true },
          { label: 'Nivel Estándar (20 a 50 vehículos)', priceDelta: 350000, isDefault: false },
          { label: 'Nivel Avanzado (>50 vehículos)', priceDelta: 750000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: '10 a 15 días hábiles',
    deliverables: [
      'Manual y Política de Seguridad Vial formalizada',
      'Matriz de Evaluación de Riesgos Viales en Rutas y Misión',
      'Plan Anual de Capacitación en Seguridad Vial',
      'Fichas técnicas y protocolos de mantenimiento de flota'
    ],
    requirements: [
      'Censo de vehículos propios, contratados y puestos a disposición',
      'Listado de conductores habituales y no habituales'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 9
  },
  {
    title: 'Paquete Exámenes Médicos Ocupacionales (x10 Trabajadores)',
    slug: 'paquete-examenes-medicos-ocupacionales-10',
    sku: 'SST-MED-004',
    isTest: true, // Modo prueba solo admin
    shortDescription: 'Exámenes de ingreso o periódicos con énfasis osteomuscular, visiometría y audiometría.',
    description: 'Paquete de exámenes médicos ocupacionales en red de IPS aliadas con cobertura nacional. Incluye valoración médica con énfasis osteomuscular, agudeza visual (visiometría), tamiz auditivo (audiometría) y expedición de certificados de aptitud laboral en formato digital.',
    category: 'medicina_laboral',
    tags: ['Exámenes Médicos', 'Medicina del Trabajo', 'Certificado Aptitud', 'IPS'],
    serviceType: 'service_onsite',
    regularPrice: 690000,
    salePrice: 620000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Tipo de Énfasis',
        options: [
          { label: 'General / Administrativo (x10)', priceDelta: 0, isDefault: true },
          { label: 'Con Énfasis en Alturas / Confinados (x10)', priceDelta: 180000, isDefault: false },
          { label: 'Manipulación de Alimentos + Laboratorio (x10)', priceDelta: 150000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: 'Agendamiento inmediato (24 a 48h)',
    deliverables: [
      'Certificados de Aptitud Laboral emitidos por Médico Ocupacional',
      'Informe de condiciones de salud consolidado para la empresa',
      'Recomendaciones médico-laborales individuales'
    ],
    requirements: [
      'Datos de los trabajadores (Nombre, CC, Cargo, Ciudad)',
      'Profesiograma o perfil del cargo'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 31
  },
  {
    title: 'Estudio de Puesto de Trabajo Ergonómico (Método OWAS / REBA)',
    slug: 'estudio-puesto-trabajo-ergonomico',
    sku: 'SST-ERG-005',
    isTest: true, // Modo prueba solo admin
    shortDescription: 'Evaluación biomecánica y postural para calificación de origen o prevención osteomuscular.',
    description: 'Análisis ergonómico detallado del puesto de trabajo mediante metodologías internacionales (OWAS, RULA, REBA o ROSA). Dirigido a casos de sospecha de enfermedad laboral, reintegros o rediseño preventivo de puestos operativos y de oficina.',
    category: 'ergonomia',
    tags: ['Ergonomía', 'OWAS', 'REBA', 'Biomecánica', 'Puesto de Trabajo'],
    serviceType: 'service_hybrid',
    regularPrice: 320000,
    salePrice: 280000,
    hasDiscount: true,
    hasVariants: false,
    estimatedDeliveryDays: '5 días hábiles tras visita/video',
    deliverables: [
      'Informe técnico ergonómico con registro fotográfico y ángulos biomecánicos',
      'Nivel de acción y valoración del riesgo de carga postural',
      'Recomendaciones de adecuación física, pausas activas y mobiliario',
      'Firma por Fisioterapeuta / Ergónomo especialista en SST con licencia'
    ],
    requirements: [
      'Videos o fotografías del colaborador en su ciclo de trabajo',
      'Dimensiones del plano de trabajo y silla utilizada'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 16
  },
  {
    title: 'Auditoría Externa de Estándares Mínimos (Res. 0312 / 2019)',
    slug: 'auditoria-externa-estandares-minimos-0312',
    sku: 'SST-AUD-006',
    isTest: true, // Modo prueba solo admin
    shortDescription: 'Evaluación imparcial del cumplimiento legal de su SG-SST (7, 21 o 60 estándares).',
    description: 'Auditoría independiente para verificar el grado de implementación y cumplimiento de los Estándares Mínimos del SG-SST establecidos en la Resolución 0312 de 2019. Ideal para preparación de visitas del Ministerio del Trabajo, ARL o auditorías de clientes.',
    category: 'auditoria',
    tags: ['Auditoría', 'Res. 0312', 'Estándares Mínimos', 'Mintrabajo'],
    serviceType: 'service_virtual',
    regularPrice: 620000,
    salePrice: 520000,
    hasDiscount: true,
    hasVariants: true,
    variants: [
      {
        name: 'Tipo de Empresa',
        options: [
          { label: '7 Estándares (Menos de 10 trab. Riesgo I, II, III)', priceDelta: 0, isDefault: true },
          { label: '21 Estándares (11 a 50 trab. Riesgo I, II, III)', priceDelta: 160000, isDefault: false },
          { label: '60 Estándares (>50 trab. o Riesgo IV y V)', priceDelta: 380000, isDefault: false }
        ]
      }
    ],
    estimatedDeliveryDays: '5 a 7 días hábiles',
    deliverables: [
      'Informe detallado de auditoría con porcentaje de cumplimiento',
      'Matriz de hallazgos (No conformidades, Observaciones y Oportunidades de mejora)',
      'Plan de Mejoramiento formulado para radicación ante la ARL',
      'Certificado de auditoría externa realizada'
    ],
    requirements: [
      'Acceso a la documentación digital del SG-SST de la empresa'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 5.0,
    reviewsCount: 18
  },
  {
    title: 'Investigación Técnica de Accidente de Trabajo (ATEL)',
    slug: 'investigacion-tecnica-accidente-trabajo-atel',
    sku: 'SST-INV-007',
    isTest: true, // Modo prueba solo admin
    shortDescription: 'Investigación formal con Árbol de Causas y radicación ante la ARL.',
    description: 'Acompañamiento especializado para la investigación de accidentes graves, leves o de alta potencialidad conforme a la Resolución 1401 de 2007. Se aplica la metodología de Árbol de Causas o 5 Porqués, determinando causas básicas e inmediatas.',
    category: 'auditoria',
    tags: ['Investigación ATEL', 'Res. 1401', 'Accidente Laboral', 'ARL'],
    serviceType: 'service_virtual',
    regularPrice: 380000,
    salePrice: 320000,
    hasDiscount: true,
    hasVariants: false,
    estimatedDeliveryDays: '48 a 72 horas hábiles',
    deliverables: [
      'Informe formal de investigación en formato institucional y formato ARL',
      'Diagrama de Árbol de Causas y análisis causal',
      'Plan de acción correctivo y preventivo con responsables',
      'Lección aprendida ilustrada para divulgación al personal'
    ],
    requirements: [
      'FURAT radicado ante la ARL',
      'Testimonios del accidentado y testigos',
      'Fotografías del lugar del evento'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    status: 'published',
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 11
  }
];

let seedInitialized = false;

// Helper: Strip sensitive provider Wompi keys for non-admin users
const sanitizeProductForClient = (product, isAdmin) => {
  if (!product) return product;
  const copy = { ...product };
  if (!isAdmin && copy.providerWompi) {
    copy.providerWompi = {
      publicKey: copy.providerWompi.publicKey || ''
    };
  }
  return copy;
};

// Helper: Automatically provision WAPPY add-on quotas (Extra Company, Automations, Sub-users) upon order approval
const provisionMarketplaceAddons = async (order) => {
  try {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) return;
    const alreadyProvisioned = (order.serviceTimeline || []).some(t => t.status === 'CUPOS_ACTIVADOS');
    if (alreadyProvisioned) return;

    const addonItems = order.items.filter(item =>
      ['WAPPY-ADDON-EMPRESA', 'WAPPY-ADDON-AUTOMATIZACION', 'WAPPY-ADDON-SUBUSUARIO'].includes(item.sku)
    );
    if (addonItems.length === 0) return;

    const User = mongoose.models.User || mongoose.model('User');
    const UserPlan = mongoose.models.UserPlan || require('~/db/models/UserPlan');

    let targetUser = null;
    if (order.userId) {
      targetUser = await User.findById(order.userId).lean();
    }
    if (!targetUser && order.customer?.email) {
      targetUser = await User.findOne({ email: order.customer.email.toLowerCase().trim() }).lean();
    }
    if (!targetUser) return;

    const userId = targetUser._id;
    let userPlan = await UserPlan.findOne({ userId });
    if (!userPlan) {
      userPlan = new UserPlan({ userId, plan: targetUser.role === 'USER_PRO' ? 'pro' : (targetUser.role === 'USER_IPEVAR' ? 'ipevar' : 'free') });
    }

    const isProRole = targetUser.role === 'USER_PRO' || userPlan.plan === 'pro';
    const activatedSummary = [];

    for (const item of addonItems) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (item.sku === 'WAPPY-ADDON-EMPRESA') {
        const baseCompanies = userPlan.companyLimit ?? 1;
        const baseStorage = userPlan.storageLimit ?? (3 * 1024 * 1024 * 1024);
        userPlan.companyLimit = baseCompanies + qty;
        userPlan.storageLimit = baseStorage + (qty * 2 * 1024 * 1024 * 1024);
        activatedSummary.push(`+${qty} Empresa(s) (+${qty * 2} GB Cloud)`);
      } else if (item.sku === 'WAPPY-ADDON-AUTOMATIZACION') {
        const baseAuto = userPlan.automationLimit ?? (isProRole ? 1 : 0);
        userPlan.automationLimit = baseAuto + qty;
        activatedSummary.push(`+${qty} Automatización(es) 24/7`);
      } else if (item.sku === 'WAPPY-ADDON-SUBUSUARIO') {
        const baseSub = userPlan.subUserLimit ?? (isProRole ? 1 : 0);
        userPlan.subUserLimit = baseSub + qty;
        activatedSummary.push(`+${qty} Subusuario(s)`);
      }
    }

    await userPlan.save();

    order.fulfillmentStatus = 'COMPLETADO';
    order.serviceTimeline.push({
      status: 'CUPOS_ACTIVADOS',
      comment: `Activación automática en cuenta (${targetUser.email}): ${activatedSummary.join(', ')}.`,
      updatedAt: new Date(),
      updatedBy: 'Sistema WAPPY'
    });
    logger.info(`[Marketplace Add-ons] Provisioned for ${targetUser.email}: ${activatedSummary.join(', ')}`);
  } catch (err) {
    logger.error('[Marketplace Add-ons] Error provisioning add-on quotas:', err);
  }
};

// Helper: Ensure default data on boot/first request
const ensureSeedData = async (force = false) => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  if (seedInitialized && !force) {
    return;
  }
  try {
    const catCount = await MarketplaceCategory.countDocuments();
    if (catCount === 0) {
      await MarketplaceCategory.insertMany(DEFAULT_CATEGORIES);
      logger.info('[Marketplace] Default categories seeded successfully.');
    } else {
      const addonCat = await MarketplaceCategory.findOne({ slug: 'complementos_wappy' });
      if (!addonCat) {
        await MarketplaceCategory.create(DEFAULT_CATEGORIES[0]);
      }
    }
    const prodCount = await MarketplaceProduct.countDocuments();
    if (prodCount === 0) {
      await MarketplaceProduct.insertMany(DEFAULT_PRODUCTS);
      logger.info('[Marketplace] Default SST products seeded successfully.');
    } else {
      // Ensure the official course product exists
      const course = await MarketplaceProduct.findOne({ slug: 'curso-ecosistema-autonomo-sst' });
      if (!course) {
        await MarketplaceProduct.create(OFFICIAL_COURSE_PRODUCT);
        logger.info('[Marketplace] Official Course seeded into database.');
      } else if (!course.landingPageUrl) {
        await MarketplaceProduct.updateOne(
          { slug: 'curso-ecosistema-autonomo-sst' },
          { $set: { landingPageUrl: '/cursowappy01' } }
        );
      }

      // Ensure the official downloadable Matriz IPVR HTML product exists ($50.000 COP)
      const matrizApp = await MarketplaceProduct.findOne({ slug: 'aplicativo-descargable-matriz-ipvr' });
      if (!matrizApp) {
        await MarketplaceProduct.create(OFFICIAL_MATRIZ_IPVR_APP_PRODUCT);
        logger.info('[Marketplace] Official Matriz IPVR Downloadable App seeded into database.');
      } else if (
        matrizApp.isTest ||
        matrizApp.status === 'draft' ||
        matrizApp.regularPrice !== 50000 ||
        matrizApp.featuredImage !== OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.featuredImage ||
        matrizApp.modalImage !== OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.modalImage
      ) {
        await MarketplaceProduct.updateOne(
          { slug: 'aplicativo-descargable-matriz-ipvr' },
          {
            $set: {
              status: 'published',
              isTest: false,
              isFeatured: true,
              regularPrice: 50000,
              serviceType: 'digital_download',
              featuredImage: OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.featuredImage,
              featuredImagePosition: OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.featuredImagePosition,
              featuredImageScale: OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.featuredImageScale,
              modalImage: OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.modalImage,
              modalImagePosition: OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.modalImagePosition,
              modalImageScale: OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.modalImageScale,
              landingPageUrl: OFFICIAL_MATRIZ_IPVR_APP_PRODUCT.landingPageUrl
            }
          }
        );
      }

      // Ensure the 3 official WAPPY Add-on products exist and are published
      for (const addonProd of WAPPY_ADDON_PRODUCTS) {
        const existingAddon = await MarketplaceProduct.findOne({ slug: addonProd.slug });
        if (!existingAddon) {
          await MarketplaceProduct.create(addonProd);
          logger.info(`[Marketplace] Add-on "${addonProd.title}" seeded into database.`);
        }
      }

      // Ensure the partner course "Adelanto" (Mauricio Posada) is published and visible
      const adelantoCourse = await MarketplaceProduct.findOne({ slug: 'curso-adelanto' });
      if (!adelantoCourse) {
        await MarketplaceProduct.create(ADELANTO_COURSE_PRODUCT);
        logger.info('[Marketplace] Partner Course "Adelanto" seeded into database.');
      } else if (!adelantoCourse.providerWompi?.publicKey || adelantoCourse.isTest || adelantoCourse.status === 'draft') {
        await MarketplaceProduct.updateOne(
          { slug: 'curso-adelanto' },
          {
            $set: {
              status: 'published',
              isTest: false,
              paymentRecipient: 'PROVIDER',
              providerName: ADELANTO_COURSE_PRODUCT.providerName,
              providerWompi: ADELANTO_COURSE_PRODUCT.providerWompi
            }
          }
        );
      }

      // Ensure only the 7 initial sample services remain marked as test products
      await MarketplaceProduct.updateMany(
        { slug: { $in: DEFAULT_TEST_SLUGS }, isTest: { $ne: true } },
        { $set: { isTest: true } }
      );
    }
    seedInitialized = true;
  } catch (err) {
    logger.error('[Marketplace] Error seeding default data:', err);
  }
};

// Auto-seed when mongoose connects
if (mongoose.connection.readyState === 1) {
  ensureSeedData();
} else {
  mongoose.connection.once('connected', () => ensureSeedData());
}

// ── Public Endpoints ──

// GET /api/marketplace/categories
const getCategories = async (req, res) => {
  try {
    let rawCategories = await MarketplaceCategory.find({ active: true }).sort({ order: 1 }).lean();
    if (rawCategories.length === 0) {
      await ensureSeedData(true);
      rawCategories = await MarketplaceCategory.find({ active: true }).sort({ order: 1 }).lean();
    }
    const seenSlugs = new Set();
    const categories = [];
    for (const cat of rawCategories) {
      if (cat.slug && !seenSlugs.has(cat.slug)) {
        seenSlugs.add(cat.slug);
        categories.push(cat);
      }
    }
    return res.json({ success: true, categories });
  } catch (error) {
    logger.error('[Marketplace] getCategories error:', error);
    return res.status(500).json({ error: 'Error al obtener categorías.' });
  }
};

// GET /api/marketplace/products
const getProducts = async (req, res) => {
  try {
    await ensureSeedData();
    const { category, search, tag, sort, featured, includeAll } = req.query;

    const isAdmin = !!(req.user && req.user.role === 'ADMIN');

    const query = {};
    if (!isAdmin) {
      // Non-admin users ONLY see official published products (never drafts or test products)
      query.status = 'published';
      query.isTest = { $ne: true };
    } else if (includeAll !== 'true') {
      query.status = { $ne: 'archived' };
    }

    if (category && category !== 'all') {
      query.category = category;
    }
    if (tag) {
      query.tags = tag;
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { shortDescription: regex },
        { tags: regex },
        { sku: regex },
        { providerName: regex }
      ];
    }

    let sortOption = includeAll === 'true'
      ? { isFeatured: -1, createdAt: -1 }
      : { isFeatured: -1, isTest: 1, updatedAt: -1, createdAt: -1 };
    if (sort === 'price_asc') sortOption = { salePrice: 1, regularPrice: 1 };
    if (sort === 'price_desc') sortOption = { salePrice: -1, regularPrice: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'sales') sortOption = { salesCount: -1 };

    const rawProducts = await MarketplaceProduct.find(query).sort(sortOption).lean();
    const products = rawProducts.map(p => sanitizeProductForClient(p, isAdmin));
    return res.json({ success: true, count: products.length, products, isAdmin });
  } catch (error) {
    logger.error('[Marketplace] getProducts error:', error);
    return res.status(500).json({ error: 'Error al obtener servicios.' });
  }
};

// GET /api/marketplace/products/:idOrSlug
const getProductBySlugOrId = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product = null;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await MarketplaceProduct.findById(idOrSlug).lean();
    } else {
      product = await MarketplaceProduct.findOne({ slug: idOrSlug.toLowerCase() }).lean();
    }

    if (!product) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    const isAdmin = !!(req.user && req.user.role === 'ADMIN');

    // If it is a test or draft product, only admins can view it
    if ((product.isTest || product.status === 'draft') && !isAdmin) {
      return res.status(404).json({ error: 'Servicio no disponible públicamente.' });
    }

    // Related products in the same category
    const relatedQuery = {
      category: product.category,
      _id: { $ne: product._id },
      status: 'published'
    };
    if (!isAdmin) {
      relatedQuery.isTest = { $ne: true };
    }
    const rawRelated = await MarketplaceProduct.find(relatedQuery).limit(3).lean();
    const related = rawRelated.map(p => sanitizeProductForClient(p, isAdmin));

    return res.json({
      success: true,
      product: sanitizeProductForClient(product, isAdmin),
      related,
      isAdmin
    });
  } catch (error) {
    logger.error('[Marketplace] getProductBySlugOrId error:', error);
    return res.status(500).json({ error: 'Error al obtener detalle del servicio.' });
  }
};

// POST /api/marketplace/validate-coupon
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount = 0 } = req.body;
    if (!code) return res.status(400).json({ error: 'Código requerido.' });

    const cleanCode = code.toUpperCase().trim();
    const coupon = await MarketplaceCoupon.findOne({ code: cleanCode, active: true }).lean();

    if (!coupon) {
      return res.status(404).json({ error: 'El cupón no es válido o ha expirado.' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Este cupón ha caducado.' });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'El cupón ha alcanzado el límite máximo de usos.' });
    }

    if (coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ error: `El monto mínimo para aplicar este cupón es de $${coupon.minOrderAmount.toLocaleString('es-CO')} COP.` });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((orderAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(orderAmount, coupon.discountValue);
    }

    return res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount: discount,
      message: `¡Cupón aplicado exitosamente! Descuento: $${discount.toLocaleString('es-CO')} COP`
    });
  } catch (error) {
    logger.error('[Marketplace] validateCoupon error:', error);
    return res.status(500).json({ error: 'Error al validar cupón.' });
  }
};

// POST /api/marketplace/checkout
const createCheckout = async (req, res) => {
  try {
    const { customer, items, paymentMethod = 'WOMPI', promoCode } = req.body;

    if (!customer || !customer.fullName || !customer.documentId || !customer.email || !customer.phone) {
      return res.status(400).json({ error: 'Faltan datos obligatorios del cliente o empresa.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito de compras está vacío.' });
    }

    // Recalculate prices directly from DB to prevent client-side manipulation
    let subtotal = 0;
    const verifiedItems = [];
    const loadedProducts = [];

    for (const item of items) {
      const product = await MarketplaceProduct.findById(item.productId).lean();
      if (!product || product.status === 'archived') {
        return res.status(400).json({ error: `El servicio "${item.title || 'seleccionado'}" no está disponible actualmente.` });
      }
      loadedProducts.push(product);

      const basePrice = (product.hasDiscount && product.salePrice > 0) ? product.salePrice : product.regularPrice;
      let variantDelta = 0;
      let selectedVariantData = null;

      if (item.selectedVariant && item.selectedVariant.label) {
        // verify variant price
        const variantGroup = product.variants?.find(v => v.name === item.selectedVariant.name);
        const opt = variantGroup?.options?.find(o => o.label === item.selectedVariant.label);
        if (opt) {
          variantDelta = opt.priceDelta || 0;
          selectedVariantData = {
            name: variantGroup.name,
            label: opt.label,
            priceDelta: variantDelta
          };
        }
      }

      const finalUnitPrice = Math.max(0, basePrice + variantDelta);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineSubtotal = finalUnitPrice * qty;

      subtotal += lineSubtotal;
      verifiedItems.push({
        productId: product._id,
        title: product.title,
        sku: product.sku,
        unitPrice: finalUnitPrice,
        quantity: qty,
        selectedVariant: selectedVariantData,
        subtotal: lineSubtotal
      });
    }

    // Determine Payment Recipient & Wompi Gateway (WAPPY vs Provider)
    let orderPaymentRecipient = 'WAPPY';
    let orderProviderName = 'WAPPY Oficial';
    let targetWompiPublicKey = process.env.WOMPI_PUBLIC_KEY;
    let targetWompiIntegritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';

    const providerProducts = loadedProducts.filter(p => p.paymentRecipient === 'PROVIDER');
    const wappyProducts = loadedProducts.filter(p => p.paymentRecipient !== 'PROVIDER');

    if (providerProducts.length > 0 && wappyProducts.length > 0) {
      return res.status(400).json({
        error: 'No es posible combinar en un mismo pago servicios de WAPPY con servicios de proveedores independientes. Por favor realiza el pago por separado.'
      });
    }

    if (providerProducts.length > 0) {
      const uniqueProviderKeys = new Set(providerProducts.map(p => (p.providerWompi?.publicKey || '').trim()));
      if (uniqueProviderKeys.size > 1) {
        return res.status(400).json({
          error: 'Tu carrito contiene productos de distintos proveedores con pasarelas diferentes. Por favor realiza el pago de cada proveedor por separado.'
        });
      }
      const mainProviderProduct = providerProducts[0];
      orderPaymentRecipient = 'PROVIDER';
      orderProviderName = mainProviderProduct.providerName?.trim() || 'Proveedor Aliado';
      targetWompiPublicKey = (mainProviderProduct.providerWompi?.publicKey || '').trim();
      targetWompiIntegritySecret = (mainProviderProduct.providerWompi?.integritySecret || '').trim();

      if (!targetWompiPublicKey) {
        return res.status(400).json({
          error: `El proveedor (${orderProviderName}) aún no tiene configurada su Llave Pública de Wompi.`
        });
      }
    }

    // Apply Promo Code
    let discountAmount = 0;
    let appliedPromo = '';

    if (promoCode) {
      const cleanCode = promoCode.toUpperCase().trim();
      const coupon = await MarketplaceCoupon.findOne({ code: cleanCode, active: true });
      if (coupon && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = Math.min(subtotal, coupon.discountValue);
        }
        appliedPromo = coupon.code;
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Generate readable Order Number
    const orderNumber = `ORD-WAP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create Order Document
    const order = new MarketplaceOrder({
      orderNumber,
      userId: req.user?._id || req.user?.id || undefined,
      customer: {
        fullName: customer.fullName.trim(),
        companyName: customer.companyName?.trim() || '',
        documentId: customer.documentId.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
        city: customer.city?.trim() || '',
        address: customer.address?.trim() || '',
        notes: customer.notes?.trim() || ''
      },
      items: verifiedItems,
      subtotal,
      discountAmount,
      promoCode: appliedPromo,
      totalAmount,
      currency: 'COP',
      paymentRecipient: orderPaymentRecipient,
      providerName: orderProviderName,
      paymentMethod,
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'NUEVO',
      serviceTimeline: [{
        status: 'NUEVO',
        comment: orderPaymentRecipient === 'PROVIDER'
          ? `Pedido generado en tienda SST (Pago directo a proveedor: ${orderProviderName}).`
          : 'Pedido generado en tienda SST (Pago WAPPY Oficial).',
        updatedAt: new Date(),
        updatedBy: 'Sistema Marketplace'
      }]
    });

    if (paymentMethod === 'WOMPI') {
      const reference = `WAP-MKT-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const amountInCents = Math.round(totalAmount * 100);

      order.wompiReference = reference;
      await order.save();

      if (!targetWompiPublicKey) {
        throw new Error('WOMPI_PUBLIC_KEY no configurada para este producto.');
      }

      let signature = '';
      if (targetWompiIntegritySecret) {
        // sha256(reference + amountInCents + currency + integritySecret)
        const stringToSign = `${reference}${amountInCents}COP${targetWompiIntegritySecret}`;
        signature = crypto.createHash('sha256').update(stringToSign, 'utf-8').digest('hex');
      }

      return res.json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentRecipient: orderPaymentRecipient,
        providerName: orderProviderName,
        wompi: {
          publicKey: targetWompiPublicKey,
          reference,
          amountInCents,
          currency: 'COP',
          signature,
          isSandbox: targetWompiPublicKey.startsWith('pub_test_')
        }
      });
    }

    // Manual transfer
    await order.save();
    return res.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: 'MANUAL_TRANSFER',
      message: 'Pedido registrado. Procede a adjuntar el comprobante de transferencia.'
    });

  } catch (error) {
    logger.error('[Marketplace] createCheckout error:', error);
    return res.status(500).json({ error: 'Error al procesar el pedido.', details: error.message });
  }
};

// POST /api/marketplace/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const { reference, transactionId } = req.body;
    if (!reference && !transactionId) {
      return res.status(400).json({ error: 'Referencia o ID de transacción requeridos.' });
    }

    const query = reference ? { wompiReference: reference } : { wompiTransactionId: transactionId };
    const order = await MarketplaceOrder.findOne(query);

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    if (order.paymentStatus === 'APPROVED') {
      return res.json({ success: true, paymentStatus: 'APPROVED', orderNumber: order.orderNumber });
    }

    // Determine Wompi environment & credentials from product if PROVIDER, else WAPPY env
    let publicKey = process.env.WOMPI_PUBLIC_KEY || '';
    let privateKey = process.env.WOMPI_PRIVATE_KEY || '';

    if (order.paymentRecipient === 'PROVIDER' && order.items?.length > 0) {
      const firstProduct = await MarketplaceProduct.findById(order.items[0].productId).lean();
      if (firstProduct?.providerWompi?.publicKey) {
        publicKey = firstProduct.providerWompi.publicKey.trim();
        privateKey = (firstProduct.providerWompi.privateKey || '').trim();
      }
    }

    const isSandbox = publicKey.startsWith('pub_test_') || privateKey.startsWith('prv_test_');
    const primaryBaseUrl = isSandbox ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';
    const fallbackBaseUrl = isSandbox ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';

    // If transactionId provided, consult Wompi API
    let isApproved = false;
    if (transactionId) {
      order.wompiTransactionId = transactionId;
      const headers = {};
      if (privateKey) {
        headers['Authorization'] = `Bearer ${privateKey}`;
      }

      let wompiData = null;
      try {
        const wompiRes = await axios.get(`${primaryBaseUrl}/transactions/${transactionId}`, {
          headers,
          timeout: 10000
        });
        wompiData = wompiRes.data?.data;
      } catch (err) {
        try {
          const fallbackRes = await axios.get(`${fallbackBaseUrl}/transactions/${transactionId}`, {
            timeout: 10000
          });
          wompiData = fallbackRes.data?.data;
        } catch (fallbackErr) {
          logger.warn('[Marketplace] Could not verify directly with Wompi API:', err.message);
        }
      }

      const status = wompiData?.status;
      if (status === 'APPROVED') {
        isApproved = true;
      } else if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') {
        order.paymentStatus = status === 'VOIDED' ? 'VOIDED' : 'DECLINED';
      }
    }

    if (isApproved) {
      order.paymentStatus = 'APPROVED';
      order.serviceTimeline.push({
        status: 'PAGO_APROBADO',
        comment: `Pago aprobado por Wompi${order.paymentRecipient === 'PROVIDER' ? ` (Proveedor: ${order.providerName || 'Aliado'})` : ''} (${order.wompiTransactionId || 'Ref: ' + order.wompiReference})`,
        updatedAt: new Date(),
        updatedBy: 'Wompi Gateway'
      });

      // Increment salesCount for each product
      for (const item of order.items) {
        if (item.productId) {
          await MarketplaceProduct.findByIdAndUpdate(item.productId, { $inc: { salesCount: item.quantity } });
        }
      }

      await provisionMarketplaceAddons(order);
    }

    await order.save();
    return res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      orderNumber: order.orderNumber
    });

  } catch (error) {
    logger.error('[Marketplace] verifyPayment error:', error);
    return res.status(500).json({ error: 'Error al verificar pago.' });
  }
};

// POST /api/marketplace/webhook (Wompi Events)
const handleWebhook = async (req, res) => {
  try {
    const { event, data, signature, timestamp } = req.body || {};
    if (event === 'transaction.updated' && data?.transaction) {
      const tx = data.transaction;
      const reference = tx.reference;
      const status = tx.status; // 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'
      const transactionId = tx.id;

      if (reference) {
        const order = await MarketplaceOrder.findOne({ wompiReference: reference });
        if (order) {
          // Optional checksum verification using either Provider's eventsSecret or WAPPY's eventsSecret
          if (signature?.checksum && Array.isArray(signature?.properties) && timestamp) {
            let eventsSecret = process.env.WOMPI_EVENTS_SECRET || '';
            if (order.paymentRecipient === 'PROVIDER' && order.items?.length > 0) {
              const firstProduct = await MarketplaceProduct.findById(order.items[0].productId).lean();
              if (firstProduct?.providerWompi?.eventsSecret) {
                eventsSecret = firstProduct.providerWompi.eventsSecret.trim();
              }
            }
            if (eventsSecret) {
              const propValues = signature.properties.map(prop => {
                const parts = prop.split('.');
                let val = data;
                for (const p of parts) {
                  val = val ? val[p] : '';
                }
                return val !== undefined && val !== null ? String(val) : '';
              }).join('');
              const stringToHash = `${propValues}${timestamp}${eventsSecret}`;
              const calculatedChecksum = crypto.createHash('sha256').update(stringToHash, 'utf-8').digest('hex');
              if (calculatedChecksum.toLowerCase() !== String(signature.checksum).toLowerCase()) {
                logger.warn(`[Marketplace Webhook] Checksum mismatch for order ${order.orderNumber}. Proceeding with caution.`);
              }
            }
          }

          order.wompiTransactionId = transactionId;
          if (status === 'APPROVED' && order.paymentStatus !== 'APPROVED') {
            order.paymentStatus = 'APPROVED';
            order.serviceTimeline.push({
              status: 'PAGO_APROBADO',
              comment: `Pago confirmado vía webhook Wompi${order.paymentRecipient === 'PROVIDER' ? ` (Proveedor: ${order.providerName || 'Aliado'})` : ''} (${transactionId})`,
              updatedAt: new Date(),
              updatedBy: 'Wompi Webhook'
            });

            // Increment salesCount for each product
            for (const item of order.items) {
              if (item.productId) {
                await MarketplaceProduct.findByIdAndUpdate(item.productId, { $inc: { salesCount: item.quantity } });
              }
            }

            await provisionMarketplaceAddons(order);
          } else if (status === 'DECLINED' && order.paymentStatus === 'PENDING') {
            order.paymentStatus = 'DECLINED';
          }
          await order.save();
          logger.info(`[Marketplace Webhook] Order ${order.orderNumber} updated to ${status}`);
        }
      }
    }
    return res.status(200).send('OK');
  } catch (error) {
    logger.error('[Marketplace Webhook] Error processing webhook:', error);
    return res.status(200).send('OK'); // always 200 for webhooks
  }
};

// GET /api/marketplace/orders/:orderNumber
const getOrderDetails = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await MarketplaceOrder.findOne({ orderNumber }).lean();
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    return res.json({ success: true, order });
  } catch (error) {
    logger.error('[Marketplace] getOrderDetails error:', error);
    return res.status(500).json({ error: 'Error al consultar pedido.' });
  }
};

// GET /api/marketplace/my-orders (Protected)
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = req.user?.email?.toLowerCase();

    const query = {
      $or: [
        { userId },
        { 'customer.email': userEmail }
      ]
    };

    const orders = await MarketplaceOrder.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, orders });
  } catch (error) {
    logger.error('[Marketplace] getMyOrders error:', error);
    return res.status(500).json({ error: 'Error al obtener tus pedidos.' });
  }
};

// ── Admin Endpoints ──

// GET /api/marketplace/admin/orders
const adminGetOrders = async (req, res) => {
  try {
    const { paymentStatus, fulfillmentStatus, search } = req.query;
    const query = {};

    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;
    if (fulfillmentStatus && fulfillmentStatus !== 'all') query.fulfillmentStatus = fulfillmentStatus;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: regex },
        { 'customer.fullName': regex },
        { 'customer.companyName': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex }
      ];
    }

    const orders = await MarketplaceOrder.find(query).sort({ createdAt: -1 }).lean();

    // Stats
    const totalRevenue = await MarketplaceOrder.aggregate([
      { $match: { paymentStatus: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const approvedCount = await MarketplaceOrder.countDocuments({ paymentStatus: 'APPROVED' });
    const pendingReviewCount = await MarketplaceOrder.countDocuments({ paymentStatus: 'MANUAL_REVIEW' });
    const activeFulfillmentCount = await MarketplaceOrder.countDocuments({ fulfillmentStatus: { $in: ['NUEVO', 'CONTACTADO', 'EN_EJECUCION'] } });

    return res.json({
      success: true,
      count: orders.length,
      orders,
      stats: {
        totalRevenue: totalRevenue[0]?.total || 0,
        approvedCount,
        pendingReviewCount,
        activeFulfillmentCount
      }
    });
  } catch (error) {
    logger.error('[Marketplace Admin] adminGetOrders error:', error);
    return res.status(500).json({ error: 'Error al obtener pedidos.' });
  }
};

// PUT /api/marketplace/admin/orders/:id/status
const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, fulfillmentStatus, comment, assignedSpecialist } = req.body;

    const order = await MarketplaceOrder.findById(id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

    let updated = false;

    if (paymentStatus && order.paymentStatus !== paymentStatus) {
      order.paymentStatus = paymentStatus;
      order.serviceTimeline.push({
        status: `PAGO_${paymentStatus}`,
        comment: comment || `Estado de pago actualizado manualmente a ${paymentStatus}`,
        updatedAt: new Date(),
        updatedBy: req.user?.name || req.user?.email || 'Administrador'
      });
      if (paymentStatus === 'APPROVED') {
        await provisionMarketplaceAddons(order);
      }
      updated = true;
    }

    if (fulfillmentStatus && order.fulfillmentStatus !== fulfillmentStatus) {
      order.fulfillmentStatus = fulfillmentStatus;
      order.serviceTimeline.push({
        status: fulfillmentStatus,
        comment: comment || `Estado operativo actualizado a ${fulfillmentStatus}`,
        updatedAt: new Date(),
        updatedBy: req.user?.name || req.user?.email || 'Administrador'
      });
      updated = true;
    }

    if (assignedSpecialist !== undefined) {
      order.assignedSpecialist = assignedSpecialist;
      updated = true;
    }

    if (updated) {
      await order.save();
    }

    return res.json({ success: true, order });
  } catch (error) {
    logger.error('[Marketplace Admin] adminUpdateOrderStatus error:', error);
    return res.status(500).json({ error: 'Error al actualizar estado del pedido.' });
  }
};

// POST /api/marketplace/admin/orders/:id/notes
const adminAddOrderNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note) return res.status(400).json({ error: 'Nota requerida.' });

    const order = await MarketplaceOrder.findById(id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

    order.internalNotes.push({
      note,
      author: req.user?.name || req.user?.email || 'Administrador',
      createdAt: new Date()
    });

    await order.save();
    return res.json({ success: true, internalNotes: order.internalNotes });
  } catch (error) {
    logger.error('[Marketplace Admin] adminAddOrderNote error:', error);
    return res.status(500).json({ error: 'Error al añadir nota.' });
  }
};

// POST /api/marketplace/admin/products
const adminCreateProduct = async (req, res) => {
  try {
    const productData = req.body;
    if (!productData.title || !productData.regularPrice || !productData.category) {
      return res.status(400).json({ error: 'Título, precio y categoría son obligatorios.' });
    }

    // Generate slug
    const cleanSlug = productData.slug
      ? productData.slug.toLowerCase().trim().replace(/[^a-z0-9\-]/g, '-')
      : productData.title.toLowerCase().trim().replace(/[^a-z0-9\-]/g, '-');

    const existing = await MarketplaceProduct.findOne({ slug: cleanSlug });
    if (existing) {
      productData.slug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    } else {
      productData.slug = cleanSlug;
    }

    productData.createdBy = req.user?._id || req.user?.id;
    const product = new MarketplaceProduct(productData);
    await product.save();

    return res.json({ success: true, product });
  } catch (error) {
    logger.error('[Marketplace Admin] adminCreateProduct error:', error);
    return res.status(500).json({ error: 'Error al crear producto.', details: error.message });
  }
};

// PUT /api/marketplace/admin/products/:id
const adminUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await MarketplaceProduct.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });

    return res.json({ success: true, product });
  } catch (error) {
    logger.error('[Marketplace Admin] adminUpdateProduct error:', error);
    return res.status(500).json({ error: 'Error al actualizar producto.' });
  }
};

// DELETE /api/marketplace/admin/products/:id
const adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await MarketplaceProduct.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Producto eliminado correctamente.' });
  } catch (error) {
    logger.error('[Marketplace Admin] adminDeleteProduct error:', error);
    return res.status(500).json({ error: 'Error al eliminar producto.' });
  }
};

// GET /api/marketplace/admin/coupons
const adminGetCoupons = async (req, res) => {
  try {
    const coupons = await MarketplaceCoupon.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, coupons });
  } catch (error) {
    logger.error('[Marketplace Admin] adminGetCoupons error:', error);
    return res.status(500).json({ error: 'Error al obtener cupones.' });
  }
};

// POST /api/marketplace/admin/coupons
const adminCreateCoupon = async (req, res) => {
  try {
    const couponData = req.body;
    if (!couponData.code || couponData.discountValue === undefined) {
      return res.status(400).json({ error: 'Código y valor de descuento son requeridos.' });
    }
    couponData.code = couponData.code.toUpperCase().trim();
    const coupon = new MarketplaceCoupon(couponData);
    await coupon.save();
    return res.json({ success: true, coupon });
  } catch (error) {
    logger.error('[Marketplace Admin] adminCreateCoupon error:', error);
    return res.status(500).json({ error: 'Error al crear cupón.' });
  }
};

// DELETE /api/marketplace/admin/coupons/:id
const adminDeleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await MarketplaceCoupon.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Cupón eliminado.' });
  } catch (error) {
    logger.error('[Marketplace Admin] adminDeleteCoupon error:', error);
    return res.status(500).json({ error: 'Error al eliminar cupón.' });
  }
};

// GET /api/marketplace/orders/:orderNumber/download-ipvr
const downloadMatrizIpvrApp = async (req, res) => {
  try {
    const rawCode = (req.params.orderNumber || '').trim();
    if (!rawCode) {
      return res.status(400).json({ error: 'Número de orden requerido para descargar el aplicativo.' });
    }

    const isAdmin = !!(req.user && req.user.role === 'ADMIN');

    if (rawCode.toUpperCase() !== 'ADMIN-PREVIEW' || !isAdmin) {
      const regex = new RegExp(`^${rawCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const order = await MarketplaceOrder.findOne({
        $or: [{ orderNumber: regex }, { wompiReference: regex }]
      });

      if (!order) {
        return res.status(404).json({
          error: `No se encontró ninguna orden con el código "${rawCode}". Verifica el número de orden (ej. ORD-WAP-...).`
        });
      }

      if (order.paymentStatus !== 'APPROVED' && !isAdmin) {
        return res.status(403).json({
          error: `La orden ${order.orderNumber} aún se encuentra en estado "${order.paymentStatus}". La descarga se habilita automáticamente en cuanto el pago es aprobado.`
        });
      }

      const hasMatrizApp = (order.items || []).some(
        (item) =>
          item.sku === 'WAPPY-MATRIZ-IPVR-APP' ||
          /matriz\s*ipvr/i.test(item.title || '') ||
          /aplicativo\s*descargable/i.test(item.title || '')
      );

      if (!hasMatrizApp && !isAdmin) {
        return res.status(403).json({
          error: 'Esta orden no incluye el Aplicativo Descargable Matriz IPVR.'
        });
      }

      if (order.fulfillmentStatus !== 'ENTREGADO') {
        order.fulfillmentStatus = 'ENTREGADO';
        order.serviceTimeline.push({
          status: 'ENTREGADO',
          comment: 'Aplicativo Descargable Matriz IPVR (.HTML) descargado exitosamente por el cliente.',
          updatedAt: new Date(),
          updatedBy: order.customer?.email || 'Cliente'
        });
        await order.save();
      }
    }

    const candidatePaths = [
      path.resolve(__dirname, '../../../client/dist/matrizipvr.html'),
      path.resolve(__dirname, '../../../client/public/matrizipvr.html'),
      path.resolve(__dirname, '../../../matriz_ipvr_gtc45_offline.html')
    ];

    const targetFile = candidatePaths.find((p) => fs.existsSync(p));
    if (!targetFile) {
      return res.status(404).json({ error: 'Archivo del aplicativo no encontrado en el servidor.' });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Aplicativo_Matriz_IPVR_GTC45_WAPPY.html"'
    );
    return res.sendFile(targetFile);
  } catch (error) {
    logger.error('[Marketplace] downloadMatrizIpvrApp error:', error);
    return res.status(500).json({ error: 'Error al generar la descarga del aplicativo.' });
  }
};

// GET /api/marketplace/customer-profile
const getCustomerProfile = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const cookies = require('cookie');
    const CompanyInfo = require('~/models/CompanyInfo');
    const User = mongoose.models.User || mongoose.model('User');
    const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let resolvedUser = req.user || null;

    // 1. Fallback: Bearer token in Authorization header
    if (!resolvedUser && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const uid = decoded?.id || decoded?._id;
        if (uid) {
          resolvedUser = await User.findById(uid).lean();
          if (resolvedUser) resolvedUser.id = String(resolvedUser._id);
        }
      } catch (_) {}
    }

    // 2. Fallback: HTTP-only refreshToken cookie
    if (!resolvedUser && req.headers.cookie && process.env.JWT_REFRESH_SECRET) {
      try {
        const parsedCookies = cookies.parse(req.headers.cookie);
        if (parsedCookies?.refreshToken) {
          const payload = jwt.verify(parsedCookies.refreshToken, process.env.JWT_REFRESH_SECRET);
          const uid = payload?.id || payload?._id;
          if (uid) {
            resolvedUser = await User.findById(uid).lean();
            if (resolvedUser) resolvedUser.id = String(resolvedUser._id);
          }
        }
      } catch (_) {}
    }

    const isValidEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    const isValidPhone = (v) => typeof v === 'string' && v.replace(/\D/g, '').length >= 7;
    const isValidText = (v) => {
      if (typeof v !== 'string') return false;
      const t = v.trim();
      if (t.length < 3) return false;
      if (/^(asd[a-z]*|zsd[a-z]*|zxc[a-z]*|zdf[a-z]*|adv|n\/a|no registrado|sin nombre)$/i.test(t)) {
        return false;
      }
      return true;
    };
    const pickFirst = (validator, ...candidates) => {
      for (const c of candidates) {
        if (validator(c)) return String(c).trim();
      }
      return '';
    };

    const queryNitRaw = String(req.query?.nit || '').trim();
    const queryEmailRaw = String(req.query?.email || '').trim();
    const baseNit = queryNitRaw.replace(/[^0-9]/g, '').slice(0, 9);

    if (!resolvedUser && !baseNit && !isValidEmail(queryEmailRaw)) {
      return res.json({ success: true, profile: null });
    }

    const userId = resolvedUser ? String(resolvedUser.id || resolvedUser._id) : null;
    const targetUserId =
      resolvedUser?.isSubUser && resolvedUser?.parentUser
        ? String(resolvedUser.parentUser)
        : userId;

    const userDoc = userId ? await User.findById(userId).lean().catch(() => null) : null;
    const emailRaw = pickFirst(isValidEmail, resolvedUser?.email, userDoc?.email, queryEmailRaw);
    const emailRegex = emailRaw ? new RegExp(`^${escapeRegex(emailRaw)}$`, 'i') : null;

    // 3. Gather all candidate CompanyInfo records (active first, then other user companies, then by email or NIT)
    let userCompanies = [];
    if (targetUserId) {
      if (resolvedUser?.isSubUser && resolvedUser?.assignedCompany) {
        const assigned = await CompanyInfo.findOne({
          _id: resolvedUser.assignedCompany,
          user: targetUserId
        }).lean();
        if (assigned) userCompanies.push(assigned);
      } else {
        userCompanies = await CompanyInfo.find({ user: targetUserId })
          .sort({ isActive: -1, updatedAt: -1 })
          .lean();
      }
    }

    if (emailRegex) {
      const byEmail = await CompanyInfo.find({ email: emailRegex })
        .sort({ isActive: -1, updatedAt: -1 })
        .lean();
      for (const c of byEmail) {
        if (!userCompanies.some((uc) => String(uc._id) === String(c._id))) {
          userCompanies.push(c);
        }
      }
      if (userCompanies.length === 1 && targetUserId && !resolvedUser?.isSubUser && String(userCompanies[0].user) !== targetUserId) {
        await CompanyInfo.updateOne(
          { _id: userCompanies[0]._id },
          { $set: { user: targetUserId, isActive: true } }
        ).catch(() => {});
      }
    }

    if (baseNit && baseNit.length >= 6) {
      const byNit = await CompanyInfo.find({ nit: new RegExp(`^${escapeRegex(baseNit)}`) })
        .sort({ isActive: -1, updatedAt: -1 })
        .lean();
      for (const c of byNit) {
        if (!userCompanies.some((uc) => String(uc._id) === String(c._id))) {
          userCompanies.push(c);
        }
      }
    }

    const activeCompany = userCompanies.find((c) => c.isActive) || userCompanies[0] || null;

    // 4. Previous MarketplaceOrder
    let lastOrderCustomer = null;
    if (userId || emailRegex) {
      const orConds = [];
      if (userId) orConds.push({ userId });
      if (emailRegex) orConds.push({ 'customer.email': emailRegex });
      const lastOrder = await MarketplaceOrder.findOne({ $or: orConds })
        .sort({ createdAt: -1 })
        .lean()
        .catch(() => null);
      if (lastOrder?.customer) {
        lastOrderCustomer = lastOrder.customer;
      }
    }

    // 5. Fallback from Leads, ComunidadPurchases, Ambassadors, or SupportTickets
    let extraPhone = '';
    let extraDoc = '';
    let extraCompany = '';
    let extraCity = '';
    if (emailRegex && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const [lead, purchase, ambassador, ticket] = await Promise.all([
        db.collection('leads').findOne({ email: emailRegex }, { sort: { createdAt: -1 } }).catch(() => null),
        db.collection('comunidadpurchases').findOne({ email: emailRegex }, { sort: { createdAt: -1 } }).catch(() => null),
        db.collection('ambassadors').findOne({ email: emailRegex }).catch(() => null),
        db.collection('supporttickets').findOne({ userEmail: emailRegex }, { sort: { createdAt: -1 } }).catch(() => null)
      ]);
      extraPhone = pickFirst(isValidPhone, lead?.phone, purchase?.phone, ambassador?.phone, ticket?.userWhatsapp);
      extraDoc = pickFirst(isValidText, purchase?.documentId, purchase?.nit, ambassador?.documentId, lead?.nit);
      extraCompany = pickFirst(isValidText, lead?.company, purchase?.companyName);
      extraCity = pickFirst(isValidText, purchase?.city, lead?.city);
    }

    const companyResponsibleCandidates = userCompanies.flatMap((c) => [c.responsibleSST, c.legalRepresentative]);
    const companyNameCandidates = userCompanies.map((c) => c.companyName);
    const companyNitCandidates = userCompanies.flatMap((c) => [c.nit, c.legalRepresentativeId]);
    const companyEmailCandidates = userCompanies.map((c) => c.email);
    const companyPhoneCandidates = userCompanies.flatMap((c) => [c.phone, c.responsibleSSTPhone]);
    const companyCityCandidates = userCompanies.map((c) =>
      c.city && isValidText(c.city)
        ? c.departamento && isValidText(c.departamento) && !c.city.toLowerCase().includes(c.departamento.toLowerCase())
          ? `${c.city.trim()}, ${c.departamento.trim()}`
          : c.city.trim()
        : ''
    );
    const companyAddressCandidates = userCompanies.map((c) => c.address);

    const resolvedCity = pickFirst(
      isValidText,
      ...companyCityCandidates,
      userDoc?.ciudad && userDoc?.departamento ? `${userDoc.ciudad}, ${userDoc.departamento}` : '',
      userDoc?.ciudad,
      userDoc?.city,
      lastOrderCustomer?.city,
      extraCity
    );

    const resolvedAddress = pickFirst(
      isValidText,
      ...companyAddressCandidates,
      lastOrderCustomer?.address
    );

    const arlVal = pickFirst(isValidText, ...userCompanies.map((c) => c.arl));
    const riskVal = pickFirst((v) => typeof v === 'string' && v.trim().length > 0, ...userCompanies.map((c) => c.riskLevel));
    const workersVal = userCompanies.find((c) => Number(c.workerCount) > 0)?.workerCount || '';

    const summaryParts = [];
    if (resolvedAddress) summaryParts.push(`Dir: ${resolvedAddress}`);
    if (arlVal) summaryParts.push(`ARL: ${arlVal}`);
    if (riskVal) summaryParts.push(`Riesgo: ${riskVal}`);
    if (workersVal) summaryParts.push(`${workersVal} trabajadores`);

    const profile = {
      fullName: pickFirst(
        isValidText,
        userDoc?.name,
        resolvedUser?.name,
        ...companyResponsibleCandidates,
        lastOrderCustomer?.fullName
      ),
      companyName: pickFirst(
        isValidText,
        ...companyNameCandidates,
        userDoc?.company,
        lastOrderCustomer?.companyName,
        extraCompany
      ),
      documentId: pickFirst(
        isValidText,
        ...companyNitCandidates,
        userDoc?.nit,
        userDoc?.documentId,
        lastOrderCustomer?.documentId,
        extraDoc
      ),
      email: pickFirst(
        isValidEmail,
        emailRaw,
        ...companyEmailCandidates,
        lastOrderCustomer?.email
      ),
      phone: pickFirst(
        isValidPhone,
        ...companyPhoneCandidates,
        userDoc?.phoneNumber,
        userDoc?.phone,
        lastOrderCustomer?.phone,
        extraPhone
      ),
      city: resolvedCity,
      address: resolvedAddress,
      notes: summaryParts.join(' · ')
    };

    return res.json({
      success: true,
      authenticated: Boolean(resolvedUser),
      profile,
      company: activeCompany
    });
  } catch (error) {
    logger.error('[Marketplace] getCustomerProfile error:', error);
    return res.status(500).json({ error: 'Error al consultar perfil del cliente.' });
  }
};

// POST /api/marketplace/admin/reseed
const adminReseedCatalog = async (req, res) => {
  try {
    await MarketplaceProduct.deleteMany({});
    await MarketplaceCategory.deleteMany({});
    await MarketplaceCategory.insertMany(DEFAULT_CATEGORIES);
    await MarketplaceProduct.insertMany(DEFAULT_PRODUCTS);
    return res.json({ success: true, message: 'Catálogo de Salud Ocupacional reinicializado con éxito.' });
  } catch (error) {
    logger.error('[Marketplace Admin] adminReseedCatalog error:', error);
    return res.status(500).json({ error: 'Error al reiniciar catálogo.' });
  }
};

module.exports = {
  getCategories,
  getProducts,
  getProductBySlugOrId,
  validateCoupon,
  createCheckout,
  verifyPayment,
  handleWebhook,
  getOrderDetails,
  downloadMatrizIpvrApp,
  getCustomerProfile,
  getMyOrders,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminAddOrderNote,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetCoupons,
  adminCreateCoupon,
  adminDeleteCoupon,
  adminReseedCatalog
};
