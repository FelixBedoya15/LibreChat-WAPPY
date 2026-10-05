#!/usr/bin/env node

/**
 * WAPPY MCP Server Bridge
 * Conector Model Context Protocol (MCP) para LibreChat-WAPPY.
 * Proporciona a Antigravity (y cualquier cliente MCP compatible) acceso TOTAL
 * a todos los módulos, matrices, datos y operaciones de la cuenta del usuario en WAPPY:
 * - Perfil de Empresa y Memoria Global de IA
 * - Resumen Diagnóstico 360° Total
 * - Matriz GTC-45 / IPEVAR
 * - Matriz PESV (Seguridad Vial)
 * - Trabajadores y Perfil Sociodemográfico
 * - Cronograma SST y Tareas Kanban
 * - Matriz de Requisitos Legales
 * - Estándares Mínimos Res. 0312
 * - Comités SST (COPASST, Convivencia, Brigada)
 * - Inventario Químico y SGA
 * - Vehículos y Preoperacionales
 * - Elementos de Protección Personal (EPP)
 * - Reportes de Actos y Condiciones Inseguras
 * - Perfiles de Cargo SST
 * - Casos e Investigaciones ATEL
 * - Capacitaciones y Cursos LMS
 * - Auditorías Internas SST
 * - Agentes y Automatizaciones Programadas
 * - Conversaciones y Mensajes de Chat
 * - Archivos y Documentos
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const WAPPY_URL = (process.env.WAPPY_URL || 'http://localhost:3080').replace(/\/$/, '');
const WAPPY_API_KEY = process.env.WAPPY_API_KEY;

if (!WAPPY_API_KEY) {
  console.error('[WAPPY MCP Bridge] ERROR: La variable de entorno WAPPY_API_KEY no está configurada.');
  console.error('Debes proporcionar tu clave de WAPPY (ej. WAPPY_API_KEY=wpy_live_...).');
  process.exit(1);
}

// Cliente HTTP defensivo para hablar con la API de WAPPY
async function wappyRequest(endpoint, options = {}) {
  const url = `${WAPPY_URL}/api/mcp-bridge${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WAPPY_API_KEY}`,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.error || `Error HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    throw new Error(`[WAPPY API Error] ${error.message}`);
  }
}

// Inicializar Servidor MCP
const server = new McpServer({
  name: 'wappy-bridge',
  version: '2.0.0',
});

// Helper para encapsular respuestas MCP de forma estandarizada
function formatMcpResponse(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function formatMcpError(err) {
  return {
    isError: true,
    content: [{ type: 'text', text: err.message }],
  };
}

// ─── 1. PERFIL DE EMPRESA Y MEMORIA IA ──────────────────────────────────────

server.tool(
  'wappy_consultar_perfil_empresa',
  {},
  async () => {
    try {
      const data = await wappyRequest('/profile', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_actualizar_perfil_empresa',
  {
    companyName: z.string().optional().describe('Razón Social o Nombre de la Empresa'),
    nit: z.string().optional().describe('Número de Identificación Tributaria (NIT)'),
    companyType: z.string().optional().describe('Tipo: Persona Jurídica o Persona Natural'),
    workerCount: z.number().optional().describe('Número total de trabajadores'),
    arl: z.string().optional().describe('Nombre de la ARL (ej: Sura, Positiva, Bolívar)'),
    riskLevel: z.string().optional().describe('Nivel de riesgo principal (I, II, III, IV o V)'),
    economicActivity: z.string().optional().describe('Descripción de la actividad económica'),
    ciiu: z.string().optional().describe('Código CIIU'),
    address: z.string().optional().describe('Dirección de la sede principal'),
    city: z.string().optional().describe('Ciudad o Municipio'),
    departamento: z.string().optional().describe('Departamento'),
    phone: z.string().optional().describe('Teléfono de contacto'),
    email: z.string().optional().describe('Correo electrónico'),
    responsibleSST: z.string().optional().describe('Nombre completo del Responsable del SG-SST'),
    formationLevel: z.string().optional().describe('Nivel de formación en SST (Técnico, Tecnólogo, Profesional, Especialista)'),
    licenseNumber: z.string().optional().describe('Número de Licencia en SST'),
    licenseExpiry: z.string().optional().describe('Fecha de vigencia de la licencia SST (YYYY-MM-DD)'),
    courseStatus: z.string().optional().describe('Estado de actualización curso 50/20 horas'),
    generalActivities: z.string().optional().describe('Descripción detallada de actividades y procesos'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/profile', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 2. RESUMEN DIAGNÓSTICO 360° TOTAL ──────────────────────────────────────

server.tool(
  'wappy_resumen_general_360',
  {},
  async () => {
    try {
      const data = await wappyRequest('/resumen-360', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 3. MATRIZ GTC-45 / IPEVAR ──────────────────────────────────────────────

server.tool(
  'wappy_consultar_matriz_gtc45',
  {
    proceso: z.string().optional().describe('Filtro opcional por proceso o área'),
    cargo: z.string().optional().describe('Filtro opcional por cargo'),
    peligro: z.string().optional().describe('Filtro opcional por clasificación o descripción de peligro'),
  },
  async ({ proceso, cargo, peligro }) => {
    try {
      const params = new URLSearchParams();
      if (proceso) params.set('proceso', proceso);
      if (cargo) params.set('cargo', cargo);
      if (peligro) params.set('peligro', peligro);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await wappyRequest(`/gtc45${qs}`, { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_alimentar_matriz_gtc45',
  {
    riesgos: z.array(
      z.object({
        proceso: z.string().describe('Proceso o área de la empresa'),
        zona: z.string().describe('Lugar o zona de trabajo'),
        actividad: z.string().describe('Actividad desarrollada'),
        cargo: z.string().describe('Cargo del trabajador expuesto'),
        rutinaria: z.enum(['Sí', 'No']).optional().describe('¿Es una tarea rutinaria?'),
        peligro_descripcion: z.string().describe('Descripción del factor de peligro'),
        peligro_clasificacion: z.string().describe('Clasificación: Biomecánico, Físico, Químico, Psicosocial, Seguridad, Biológico, Fenómenos naturales'),
        efectos_posibles: z.string().optional().describe('Efectos en la salud o seguridad'),
        controles_fuente: z.string().optional().describe('Controles en la fuente'),
        controles_medio: z.string().optional().describe('Controles en el medio'),
        controles_individuo: z.string().optional().describe('Controles en el trabajador'),
        nd: z.number().describe('Nivel de deficiencia: 10 (Muy Alto), 6 (Alto), 2 (Medio) o 0 (Bajo)'),
        ne: z.number().describe('Nivel de exposición: 4 (Continua), 3 (Frecuente), 2 (Ocasional), 1 (Esporádica)'),
        nc: z.number().describe('Nivel de consecuencia: 100 (Muerte), 60 (Muy grave), 25 (Grave), 10 (Leve)'),
        peor_consecuencia: z.string().optional().describe('Peor consecuencia posible'),
        medida_eliminacion: z.string().optional(),
        medida_sustitucion: z.string().optional(),
        medida_ingenieria: z.string().optional(),
        medida_administrativa: z.string().optional(),
        medida_eppu: z.string().optional(),
        nro_expuestos: z.number().optional().describe('Número de trabajadores expuestos'),
      })
    ).describe('Lista de riesgos evaluados según GTC 45'),
  },
  async ({ riesgos }) => {
    try {
      const data = await wappyRequest('/gtc45', {
        method: 'POST',
        body: JSON.stringify({ riesgos }),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 4. MATRIZ PESV ─────────────────────────────────────────────────────────

server.tool(
  'wappy_consultar_matriz_pesv',
  {},
  async () => {
    try {
      const data = await wappyRequest('/pesv', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_alimentar_matriz_pesv',
  {
    riesgos: z.array(
      z.object({
        grupo_trabajo: z.string().describe('OPERATIVO o ADMINISTRATIVO'),
        cargo: z.string().describe('Cargo del trabajador vial'),
        tipo_desplazamiento: z.string().describe('Misional o In itinere'),
        rol_via: z.string().describe('Rol en la vía (Conductor de vehículo liviano, pesados, moto, peatón, etc.)'),
        factor_riesgo: z.string().describe('Factor Humano, Factor Vehicular, Factor Infraestructura, Entorno/Otros'),
        peligro_descripcion: z.string().describe('Descripción del riesgo vial'),
        np_cualitativo: z.string().optional().describe('MUY PROBABLE, MEDIANAMENTE PROBABLE, PROBABLE, POCO PROBABLE, NO ES PROBABLE'),
        ne_cualitativo: z.string().optional().describe('CONSTANTE, FRECUENTE, OCASIONAL, ESPORADICO, MINIMA'),
        nc_cualitativo: z.string().optional().describe('CRITICO, PELIGROSO, MODERADO, MARGINAL, INSIGNIFICANTE'),
        controles_existentes_descripcion: z.string().optional(),
        plan_accion_vehiculo: z.string().optional(),
        plan_accion_individuo: z.string().optional(),
      })
    ).describe('Riesgos viales a incorporar en el PESV'),
  },
  async ({ riesgos }) => {
    try {
      const data = await wappyRequest('/pesv', {
        method: 'POST',
        body: JSON.stringify({ riesgos }),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 5. TRABAJADORES (SOCIODEMOGRÁFICO) ─────────────────────────────────────

server.tool(
  'wappy_consultar_trabajadores',
  {},
  async () => {
    try {
      const data = await wappyRequest('/workers', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_trabajador',
  {
    nombre_completo: z.string().describe('Nombre y apellidos del trabajador'),
    cedula: z.string().describe('Número de documento de identidad'),
    cargo: z.string().describe('Cargo u ocupación'),
    area: z.string().optional().describe('Área o departamento'),
    sede: z.string().optional().describe('Sede o centro de trabajo'),
    nivel_riesgo_arl: z.string().optional().describe('Nivel de riesgo ARL asignado (I, II, III, IV, V)'),
    tipo_contrato: z.string().optional().describe('Tipo de contrato (Indefinido, Fijo, Obra o Labor, Aprendizaje, Prestación de Servicios)'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/workers', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 6. CRONOGRAMA SST Y TAREAS KANBAN ──────────────────────────────────────

server.tool(
  'wappy_consultar_cronograma_sst',
  {
    status: z.enum(['todo', 'in_progress', 'done']).optional().describe('Filtro opcional por estado'),
  },
  async ({ status }) => {
    try {
      const qs = status ? `?status=${status}` : '';
      const data = await wappyRequest(`/tasks${qs}`, { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_crear_actividad_cronograma',
  {
    title: z.string().describe('Título de la actividad de SST'),
    description: z.string().optional().describe('Descripción detallada o entregable'),
    dueDate: z.string().describe('Fecha de vencimiento o ejecución (YYYY-MM-DD)'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Prioridad'),
    type: z.string().optional().describe('Tipo: training, audit_finding, inspection, manual, etc.'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_actualizar_estado_tarea',
  {
    tareaId: z.string().describe('ID de la tarea a actualizar'),
    status: z.enum(['todo', 'in_progress', 'done']).describe('Nuevo estado de la tarea'),
    description: z.string().optional().describe('Observaciones o actualización de avance'),
  },
  async ({ tareaId, status, description }) => {
    try {
      const data = await wappyRequest(`/tasks/${tareaId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, description }),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 7. MATRIZ LEGAL SST ───────────────────────────────────────────────────

server.tool(
  'wappy_consultar_matriz_legal',
  {},
  async () => {
    try {
      const data = await wappyRequest('/matriz-legal', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_requisito_legal',
  {
    norma: z.string().describe('Nombre de la norma (ej: Decreto 1072 de 2015, Resolución 0312 de 2019)'),
    articulo: z.string().optional().describe('Artículo o sección aplicable'),
    descripcion: z.string().describe('Descripción de la exigencia legal'),
    clasificacion: z.string().optional().describe('Clasificación (ej: Seguridad y Salud, Ambiental, Laboral General)'),
    evidencia: z.string().optional().describe('Evidencia de cumplimiento (documento, registro, acta)'),
    status: z.enum(['cumple', 'no_cumple', 'en_tramite', 'no_aplica']).optional().describe('Estado de cumplimiento'),
    responsable: z.string().optional().describe('Responsable del cumplimiento'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/matriz-legal', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 8. ESTÁNDARES MÍNIMOS RESOLUCIÓN 0312 ─────────────────────────────────

server.tool(
  'wappy_consultar_diagnostico_0312',
  {},
  async () => {
    try {
      const data = await wappyRequest('/diagnostico-0312', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_evaluar_estandar_0312',
  {
    code: z.string().describe('Código del estándar (ej: 1.1.1, 2.1.1, 4.1.1)'),
    status: z.enum(['cumple', 'no_cumple', 'no_aplica']).describe('Calificación del estándar'),
    observation: z.string().optional().describe('Observación, evidencia o plan de mejora'),
    points: z.number().optional().describe('Puntaje ponderado del estándar (según tabla de Res. 0312)'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/diagnostico-0312', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 9. COMITÉS SST (COPASST, CONVIVENCIA, BRIGADA) ─────────────────────────

server.tool(
  'wappy_consultar_comites',
  {},
  async () => {
    try {
      const data = await wappyRequest('/comites', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_miembro_comite',
  {
    tipoComite: z.enum(['copasst', 'convivencia', 'brigada']).describe('Comité al que pertenece el integrante'),
    nombre: z.string().describe('Nombre completo'),
    cedula: z.string().describe('Cédula o documento de identidad'),
    cargo: z.string().optional().describe('Cargo en la empresa'),
    rol: z.string().optional().describe('Rol en el comité (Presidente, Secretario, Principal, Suplente, Líder de Brigada)'),
    parte: z.enum(['empleador', 'trabajador']).optional().describe('Representación (empleador o trabajador, para COPASST/Convivencia)'),
    grupoBrigada: z.enum(['Primeros Auxilios', 'Evacuación y Rescate', 'Control de Incendios', 'Manejo de Derrames']).optional().describe('Grupo especializado si es brigadista'),
    sede: z.string().optional().describe('Sede o centro de trabajo'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/comites', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 10. PRODUCTOS QUÍMICOS Y SGA ──────────────────────────────────────────

server.tool(
  'wappy_consultar_inventario_quimico',
  {},
  async () => {
    try {
      const data = await wappyRequest('/quimicos', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_producto_quimico',
  {
    nombre: z.string().describe('Nombre comercial o químico del producto'),
    fabricante: z.string().optional().describe('Fabricante o distribuidor'),
    estadoFisico: z.enum(['Líquido', 'Sólido', 'Gaseoso']).optional().describe('Estado físico'),
    pictogramasSga: z.array(z.string()).optional().describe('Pictogramas SGA (Inflamable, Corrosivo, Tóxico agudo, Daño a la salud, Peligro ambiental, etc.)'),
    claseOnu: z.string().optional().describe('Clase de mercancía peligrosa ONU (1 a 9)'),
    ubicacion: z.string().optional().describe('Lugar de almacenamiento en la empresa'),
    cantidadAlmacenada: z.string().optional().describe('Cantidad y unidad (ej: 50 Galones, 20 Kg)'),
    tieneFds: z.enum(['Sí', 'No']).optional().describe('¿Cuenta con Ficha de Datos de Seguridad (FDS)?'),
    tieneRotuloSga: z.enum(['Sí', 'No']).optional().describe('¿Cuenta con etiqueta/rótulo según SGA?'),
    incompatibilidades: z.array(z.string()).optional().describe('Sustancias con las que NO debe almacenarse'),
    observaciones: z.string().optional().describe('Recomendaciones de ventilación, derrames o EPP'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/quimicos', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 11. VEHÍCULOS Y SEGURIDAD VIAL ─────────────────────────────────────────

server.tool(
  'wappy_consultar_vehiculos',
  {},
  async () => {
    try {
      const data = await wappyRequest('/vehiculos', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_vehiculo',
  {
    placa: z.string().describe('Número de placa del vehículo'),
    marca: z.string().describe('Marca (ej: Chevrolet, Toyota, Renault)'),
    modelo: z.string().optional().describe('Línea o modelo (ej: D-Max, Hilux, Sandero)'),
    tipo: z.string().optional().describe('Tipo (Automóvil, Camioneta, Camión, Motocicleta)'),
    conductorNombre: z.string().optional().describe('Nombre del conductor asignado'),
    conductorCedula: z.string().optional().describe('Cédula del conductor asignado'),
    soatVencimiento: z.string().describe('Fecha de vencimiento del SOAT (YYYY-MM-DD)'),
    tecnomecanicaVencimiento: z.string().optional().describe('Fecha de vencimiento de la Revisión Técnico-Mecánica (YYYY-MM-DD)'),
    kilometrajeActual: z.number().optional().describe('Kilometraje actual del vehículo'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/vehiculos', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 12. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP) ────────────────────────────

server.tool(
  'wappy_consultar_epp',
  {},
  async () => {
    try {
      const data = await wappyRequest('/epp', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_entrega_epp',
  {
    documento: z.string().describe('Cédula del trabajador que recibe el EPP'),
    nombreTrabajador: z.string().describe('Nombre completo del trabajador'),
    cargo: z.string().optional().describe('Cargo del trabajador'),
    nombreEpp: z.string().describe('Nombre del elemento entregado (ej: Casco Tipo II, Botas dieléctricas, Arnés multipropósito)'),
    tipo: z.enum(['Regular', 'Alturas']).optional().describe('Tipo de protección (Regular o Alturas)'),
    cantidad: z.number().optional().describe('Cantidad entregada'),
    fechaEntrega: z.string().optional().describe('Fecha de entrega (YYYY-MM-DD)'),
    fechaVencimiento: z.string().optional().describe('Fecha estimada de reposición o cambio (YYYY-MM-DD)'),
    serial: z.string().optional().describe('Serial único (obligatorio en equipos de alturas)'),
    marca: z.string().optional().describe('Marca y fabricante del equipo'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/epp', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 13. REPORTES DE ACTOS Y CONDICIONES INSEGURAS ──────────────────────────

server.tool(
  'wappy_consultar_reportes_actos_condiciones',
  {},
  async () => {
    try {
      const data = await wappyRequest('/actos-condiciones', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_reporte_acto_condicion',
  {
    tipoReporte: z.enum(['Acto Inseguro', 'Condición Insegura']).describe('Clasificación del hallazgo preventivo'),
    sede: z.string().optional().describe('Sede o instalación donde se observa'),
    area: z.string().optional().describe('Área o zona específica'),
    descripcion: z.string().describe('Descripción detallada de la condición de peligro o acto inseguro'),
    reportadoPor: z.string().optional().describe('Nombre de la persona o agente que reporta'),
    nivelRiesgo: z.enum(['Bajo', 'Medio', 'Alto', 'Crítico']).optional().describe('Nivel de riesgo estimado'),
    accionInmediata: z.string().optional().describe('Medida preventiva o correctiva tomada al instante'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/actos-condiciones', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 14. PERFILES DE CARGO SST ─────────────────────────────────────────────

server.tool(
  'wappy_consultar_perfiles_cargo',
  {},
  async () => {
    try {
      const data = await wappyRequest('/perfiles-cargo', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_guardar_perfil_cargo',
  {
    cargo: z.string().describe('Nombre del cargo o puesto de trabajo'),
    area: z.string().optional().describe('Área a la que pertenece'),
    misionCargo: z.string().optional().describe('Propósito general del rol'),
    responsabilidadesSST: z.string().optional().describe('Responsabilidades específicas en SST según Dec. 1072'),
    eppRequeridos: z.array(z.string()).optional().describe('Elementos de protección requeridos para el cargo'),
    factoresRiesgo: z.array(z.string()).optional().describe('Factores de riesgo a los que está expuesto el puesto'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/perfiles-cargo', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 15. CASOS ATEL (ACCIDENTES E INVESTIGACIONES) ──────────────────────────

server.tool(
  'wappy_consultar_casos_atel',
  {},
  async () => {
    try {
      const data = await wappyRequest('/atel', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_caso_atel',
  {
    tipoEvento: z.enum(['Accidente de Trabajo', 'Incidente']).describe('Tipo de evento'),
    nombreTrabajador: z.string().describe('Nombre del trabajador afectado'),
    cedula: z.string().optional().describe('Documento de identidad'),
    fechaAccidente: z.string().optional().describe('Fecha del evento (YYYY-MM-DD)'),
    descripcionAccidente: z.string().describe('Relato detallado de cómo ocurrieron los hechos'),
    severidad: z.enum(['Leve', 'Grave', 'Mortal']).optional().describe('Severidad de la lesión'),
    parteCuerpoAfectada: z.string().optional().describe('Parte del cuerpo lesionada (ej: Mano derecha, Ojos, Espalda)'),
    accionesInmediatas: z.string().optional().describe('Medidas tomadas inmediatamente tras el evento'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/atel', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 16. PROGRAMA DE CAPACITACIONES Y CURSOS LMS ────────────────────────────

server.tool(
  'wappy_consultar_capacitaciones',
  {},
  async () => {
    try {
      const data = await wappyRequest('/capacitaciones', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_programar_capacitacion',
  {
    tema: z.string().describe('Tema de la capacitación (ej: Manejo de Sustancias Químicas, Trabajo Seguro en Alturas)'),
    fecha: z.string().describe('Fecha de realización (YYYY-MM-DD)'),
    hora: z.string().optional().describe('Hora de inicio (ej: 09:00 AM)'),
    duracion: z.string().optional().describe('Duración estimada (ej: 2 horas)'),
    responsable: z.string().optional().describe('Capacitador o entidad formadora (ej: ARL, Responsable SST, Externo)'),
    descripcion: z.string().optional().describe('Objetivo y contenidos clave'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/capacitaciones', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 17. AUDITORÍAS INTERNAS Y PLANES DE ACCIÓN ────────────────────────────

server.tool(
  'wappy_consultar_auditorias',
  {},
  async () => {
    try {
      const data = await wappyRequest('/auditorias', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_hallazgo_auditoria',
  {
    codigo: z.string().optional().describe('Código del hallazgo (ej: NC-01, OM-03)'),
    hallazgo: z.string().describe('Descripción de la no conformidad u oportunidad de mejora'),
    tipo: z.enum(['No Conformidad Mayor', 'No Conformidad Menor', 'Oportunidad de Mejora']).optional().describe('Clasificación'),
    accionPropuesta: z.string().optional().describe('Plan de acción propuesto para corregir o mejorar'),
    responsable: z.string().optional().describe('Responsable del cierre de la acción'),
    fechaCompromiso: z.string().optional().describe('Fecha de compromiso para la verificación (YYYY-MM-DD)'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/auditorias', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 18. AGENTES Y AUTOMATIZACIONES ────────────────────────────────────────

server.tool(
  'wappy_consultar_agentes_y_automatizaciones',
  {},
  async () => {
    try {
      const data = await wappyRequest('/agentes-automatizaciones', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_programar_automatizacion',
  {
    name: z.string().describe('Nombre de la tarea automatizada'),
    agentId: z.string().describe('ID del agente de IA que ejecutará la tarea'),
    agentName: z.string().optional().describe('Nombre del agente'),
    prompt: z.string().describe('Instrucción o tarea que el agente ejecutará automáticamente'),
    scheduleType: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional().describe('Frecuencia de ejecución'),
    scheduleConfig: z.object({
      hour: z.number().optional().describe('Hora del día (0-23)'),
      dayOfWeek: z.number().optional().describe('Día de la semana (0-6)'),
    }).optional().describe('Configuración horaria'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/agentes-automatizaciones', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 19. CONVERSACIONES Y MENSAJES DE CHAT ──────────────────────────────────

server.tool(
  'wappy_consultar_conversaciones',
  {},
  async () => {
    try {
      const data = await wappyRequest('/conversaciones', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_consultar_mensajes_conversacion',
  {
    conversationId: z.string().describe('ID de la conversación a consultar'),
  },
  async ({ conversationId }) => {
    try {
      const data = await wappyRequest(`/mensajes?conversationId=${encodeURIComponent(conversationId)}`, { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 20. ARCHIVOS Y DOCUMENTOS DEL USUARIO ─────────────────────────────────

server.tool(
  'wappy_consultar_archivos',
  {},
  async () => {
    try {
      const data = await wappyRequest('/archivos', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// Conectar mediante transporte stdio estándar de MCP
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[WAPPY MCP Bridge] Conectado exitosamente por stdio con 35 herramientas especializadas.');
}

main().catch((err) => {
  console.error('[WAPPY MCP Bridge] Error fatal al iniciar:', err);
  process.exit(1);
});
