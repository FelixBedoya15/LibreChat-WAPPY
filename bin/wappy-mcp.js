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

server.tool(
  'wappy_actualizar_riesgo_gtc45',
  {
    id: z.string().describe('ID del riesgo en la matriz GTC-45 a actualizar'),
    proceso: z.string().optional().describe('Nuevo proceso'),
    zona_lugar: z.string().optional().describe('Nueva zona o lugar'),
    actividades: z.string().optional().describe('Nuevas actividades'),
    tareas: z.string().optional().describe('Nuevas tareas'),
    cargo: z.string().optional().describe('Nuevo cargo u ocupación'),
    rutinaria: z.enum(['Sí', 'No']).optional().describe('¿Es rutinaria?'),
    peligro_descripcion: z.string().optional().describe('Descripción del peligro'),
    peligro_clasificacion: z.string().optional().describe('Clasificación del peligro'),
    efectos_posibles: z.string().optional().describe('Efectos posibles'),
    nd: z.number().optional().describe('Nivel de deficiencia (0, 2, 6, 10)'),
    ne: z.number().optional().describe('Nivel de exposición (1, 2, 3, 4)'),
    nc: z.number().optional().describe('Nivel de consecuencia (10, 25, 60, 100)'),
    peor_consecuencia: z.string().optional().describe('Peor consecuencia'),
    medida_eliminacion: z.string().optional(),
    medida_sustitucion: z.string().optional(),
    medida_ingenieria: z.string().optional(),
    medida_administrativa: z.string().optional(),
    medida_eppu: z.string().optional(),
  },
  async (args) => {
    try {
      const { id, ...updates } = args;
      const data = await wappyRequest(`/gtc45/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_riesgo_gtc45',
  {
    id: z.string().describe('ID del riesgo a eliminar de la matriz GTC-45'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/gtc45/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_actualizar_riesgo_pesv',
  {
    id: z.string().describe('ID del registro de riesgo vial PESV a actualizar'),
    cargo: z.string().optional().describe('Cargo'),
    rol_via: z.string().optional().describe('Rol en la vía'),
    peligro_descripcion: z.string().optional().describe('Descripción del peligro'),
    plan_accion_vehiculo: z.string().optional().describe('Plan vehicular'),
    plan_accion_individuo: z.string().optional().describe('Plan individual'),
    estado: z.string().optional().describe('Estado de la acción'),
  },
  async (args) => {
    try {
      const { id, ...updates } = args;
      const data = await wappyRequest(`/pesv/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_riesgo_pesv',
  {
    id: z.string().describe('ID del registro de riesgo vial PESV a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/pesv/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 5. TRABAJADORES (SOCIODEMOGRÁFICO) ─────────────────────────────────────

server.tool(
  'wappy_consultar_trabajadores',
  {
    cedula: z.string().optional().describe('Cédula o documento del trabajador a buscar'),
    nombre: z.string().optional().describe('Filtro por nombre o apellido'),
    cargo: z.string().optional().describe('Filtro por cargo u ocupación'),
  },
  async ({ cedula, nombre, cargo }) => {
    try {
      const params = new URLSearchParams();
      if (cedula) params.append('cedula', cedula);
      if (nombre) params.append('nombre', nombre);
      if (cargo) params.append('cargo', cargo);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const data = await wappyRequest(`/workers${queryStr}`, { method: 'GET' });
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
    area: z.string().optional().describe('Área o departamento (ej: Operaciones, Administración, Obras)'),
    sede: z.string().optional().describe('Sede o centro de trabajo'),
    salario: z.string().optional().describe('Salario o remuneración mensual'),
    tipo_contrato: z.string().optional().describe('Tipo de contrato (Indefinido, Fijo, Obra o Labor, Aprendizaje, Prestación de Servicios)'),
    eps: z.string().optional().describe('Entidad Promotora de Salud (EPS)'),
    afp: z.string().optional().describe('Fondo de Pensiones (AFP)'),
    telefono: z.string().optional().describe('Número telefónico o celular'),
    correo: z.string().optional().describe('Correo electrónico'),
    direccion: z.string().optional().describe('Dirección de residencia'),
    municipio: z.string().optional().describe('Municipio o ciudad de residencia'),
    fecha_nacimiento: z.string().optional().describe('Fecha de nacimiento (AAAA-MM-DD)'),
    edad: z.number().optional().describe('Edad en años'),
    genero: z.string().optional().describe('Género (Masculino, Femenino, Otro)'),
    estado_civil: z.string().optional().describe('Estado civil (Soltero, Casado, Unión Libre, Divorciado, Viudo)'),
    rh: z.string().optional().describe('Grupo sanguíneo y factor RH (ej: O+, A+, B+, O-)'),
    peso: z.string().optional().describe('Peso en kilogramos (ej: 72)'),
    talla: z.string().optional().describe('Estatura o talla en centímetros o metros (ej: 175 o 1.75)'),
    enfermedades: z.string().optional().describe('Enfermedades diagnosticadas preexistentes'),
    medicamentos: z.string().optional().describe('Medicamentos de consumo habitual'),
    diagnostico_medico: z.string().optional().describe('Concepto o diagnóstico de aptitud médica ocupacional'),
    recomendaciones_medicas: z.string().optional().describe('Restricciones o recomendaciones médicas emitidas'),
    fecha_examen_medico: z.string().optional().describe('Fecha del último examen médico ocupacional (AAAA-MM-DD)'),
    estado_laboral: z.enum(['Activo', 'Retirado']).optional().describe('Estado laboral (Activo o Retirado)'),
    es_copasst: z.enum(['Sí', 'No']).optional().describe('¿Es miembro del COPASST o Vigía?'),
    es_convivencia: z.enum(['Sí', 'No']).optional().describe('¿Es miembro del Comité de Convivencia?'),
    es_brigadista: z.enum(['Sí', 'No']).optional().describe('¿Es miembro de la Brigada de Emergencias?'),
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

server.tool(
  'wappy_actualizar_trabajador',
  {
    idOrCedula: z.string().describe('Cédula, ID de MongoDB o nombre del trabajador a editar/actualizar'),
    nombre_completo: z.string().optional().describe('Nuevo nombre y apellidos'),
    cargo: z.string().optional().describe('Nuevo cargo u ocupación'),
    area: z.string().optional().describe('Nueva área o departamento'),
    sede: z.string().optional().describe('Nueva sede o centro de trabajo'),
    salario: z.string().optional().describe('Nuevo salario o remuneración mensual'),
    tipo_contrato: z.string().optional().describe('Nuevo tipo de contrato'),
    eps: z.string().optional().describe('Nueva EPS'),
    afp: z.string().optional().describe('Nuevo fondo de pensiones'),
    telefono: z.string().optional().describe('Nuevo teléfono o celular'),
    correo: z.string().optional().describe('Nuevo correo electrónico'),
    direccion: z.string().optional().describe('Nueva dirección de residencia'),
    municipio: z.string().optional().describe('Nuevo municipio de residencia'),
    rh: z.string().optional().describe('Grupo sanguíneo y factor RH'),
    peso: z.string().optional().describe('Peso en kg'),
    talla: z.string().optional().describe('Estatura en cm o m'),
    enfermedades: z.string().optional().describe('Enfermedades o diagnósticos'),
    medicamentos: z.string().optional().describe('Medicamentos'),
    diagnostico_medico: z.string().optional().describe('Concepto o diagnóstico médico ocupacional'),
    recomendaciones_medicas: z.string().optional().describe('Recomendaciones o restricciones médicas'),
    estado_laboral: z.enum(['Activo', 'Retirado']).optional().describe('Estado laboral: Activo o Retirado'),
    fecha_retiro: z.string().optional().describe('Fecha de retiro laboral (AAAA-MM-DD)'),
    motivo_retiro: z.string().optional().describe('Motivo de retiro del trabajador'),
    es_copasst: z.enum(['Sí', 'No']).optional().describe('Pertenencia al COPASST'),
    es_convivencia: z.enum(['Sí', 'No']).optional().describe('Pertenencia al Comité de Convivencia'),
    es_brigadista: z.enum(['Sí', 'No']).optional().describe('Pertenencia a la Brigada de Emergencias'),
  },
  async (args) => {
    try {
      const { idOrCedula, ...updates } = args;
      const data = await wappyRequest(`/workers/${encodeURIComponent(idOrCedula)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_trabajador',
  {
    idOrCedula: z.string().describe('Cédula, ID de MongoDB o nombre del trabajador a eliminar permanentemente'),
  },
  async (args) => {
    try {
      const data = await wappyRequest(`/workers/${encodeURIComponent(args.idOrCedula)}`, {
        method: 'DELETE',
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

server.tool(
  'wappy_eliminar_tarea_cronograma',
  {
    tareaId: z.string().describe('ID de la tarea a eliminar del cronograma SST'),
  },
  async ({ tareaId }) => {
    try {
      const data = await wappyRequest(`/tasks/${encodeURIComponent(tareaId)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_actualizar_requisito_legal',
  {
    id: z.string().describe('ID de la norma en la matriz legal a actualizar'),
    norma: z.string().optional().describe('Nombre de la norma'),
    articulo: z.string().optional().describe('Artículo'),
    descripcion: z.string().optional().describe('Descripción'),
    clasificacion: z.string().optional().describe('Clasificación'),
    evidencia: z.string().optional().describe('Evidencia de cumplimiento'),
    status: z.enum(['cumple', 'no_cumple', 'en_tramite', 'no_aplica']).optional().describe('Nuevo estado de cumplimiento'),
    responsable: z.string().optional().describe('Responsable'),
  },
  async (args) => {
    try {
      const { id, ...updates } = args;
      const data = await wappyRequest(`/matriz-legal/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_requisito_legal',
  {
    id: z.string().describe('ID o nombre exacto de la norma a eliminar de la matriz legal'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/matriz-legal/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_eliminar_miembro_comite',
  {
    tipoComite: z.enum(['copasst', 'convivencia', 'brigada']).describe('Tipo de comité ("copasst", "convivencia", "brigada")'),
    cedula: z.string().describe('Cédula del integrante a retirar'),
  },
  async ({ tipoComite, cedula }) => {
    try {
      const data = await wappyRequest(`/comites/${encodeURIComponent(tipoComite)}/${encodeURIComponent(cedula)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_actualizar_producto_quimico',
  {
    id: z.string().describe('ID o nombre del producto químico a actualizar'),
    nombre: z.string().optional().describe('Nuevo nombre comercial'),
    fabricante: z.string().optional().describe('Fabricante'),
    estadoFisico: z.enum(['Líquido', 'Sólido', 'Gaseoso']).optional(),
    pictogramasSga: z.array(z.string()).optional(),
    claseOnu: z.string().optional(),
    ubicacion: z.string().optional(),
    cantidadAlmacenada: z.string().optional(),
    incompatibilidades: z.array(z.string()).optional(),
    observaciones: z.string().optional(),
  },
  async (args) => {
    try {
      const { id, ...updates } = args;
      const data = await wappyRequest(`/quimicos/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_producto_quimico',
  {
    id: z.string().describe('ID o nombre exacto del producto químico a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/quimicos/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_actualizar_vehiculo',
  {
    placaOrId: z.string().describe('Placa o ID del vehículo a actualizar'),
    conductorNombre: z.string().optional().describe('Nuevo conductor asignado'),
    conductorCedula: z.string().optional().describe('Cédula del conductor asignado'),
    soatVencimiento: z.string().optional().describe('Nuevo vencimiento de SOAT (YYYY-MM-DD)'),
    tecnomecanicaVencimiento: z.string().optional().describe('Nuevo vencimiento Técnico-Mecánica (YYYY-MM-DD)'),
    kilometrajeActual: z.number().optional().describe('Kilometraje actual'),
  },
  async (args) => {
    try {
      const { placaOrId, ...updates } = args;
      const data = await wappyRequest(`/vehiculos/${encodeURIComponent(placaOrId)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_vehiculo',
  {
    placaOrId: z.string().describe('Placa o ID del vehículo a eliminar de la flota'),
  },
  async ({ placaOrId }) => {
    try {
      const data = await wappyRequest(`/vehiculos/${encodeURIComponent(placaOrId)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_eliminar_entrega_epp',
  {
    documento: z.string().describe('Cédula del trabajador'),
    entregaId: z.string().optional().describe('ID específico de la entrega a eliminar (si se omite, elimina todo el historial del trabajador)'),
  },
  async ({ documento, entregaId }) => {
    try {
      const suffix = entregaId ? `/${encodeURIComponent(entregaId)}` : '';
      const data = await wappyRequest(`/epp/${encodeURIComponent(documento)}${suffix}`, { method: 'DELETE' });
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

server.tool(
  'wappy_actualizar_reporte_acto_condicion',
  {
    id: z.string().describe('ID del reporte de acto o condición'),
    estado: z.string().optional().describe('Nuevo estado (Abierto, En gestión, Cerrado)'),
    accionInmediata: z.string().optional().describe('Medida o acción de mitigación aplicada'),
    nivelRiesgo: z.enum(['Bajo', 'Medio', 'Alto', 'Crítico']).optional().describe('Nivel de riesgo'),
  },
  async (args) => {
    try {
      const { id, ...updates } = args;
      const data = await wappyRequest(`/actos-condiciones/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_reporte_acto_condicion',
  {
    id: z.string().describe('ID del reporte de acto o condición a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/actos-condiciones/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_eliminar_perfil_cargo',
  {
    cargoOrId: z.string().describe('Nombre del cargo o ID del perfil a eliminar'),
  },
  async ({ cargoOrId }) => {
    try {
      const data = await wappyRequest(`/perfiles-cargo/${encodeURIComponent(cargoOrId)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_actualizar_caso_atel',
  {
    id: z.string().describe('ID del caso ATEL a actualizar'),
    severidad: z.enum(['Leve', 'Grave', 'Mortal']).optional().describe('Severidad'),
    accionesInmediatas: z.string().optional().describe('Acciones inmediatas'),
    descripcionAccidente: z.string().optional().describe('Descripción'),
    parteCuerpoAfectada: z.string().optional().describe('Parte del cuerpo'),
  },
  async (args) => {
    try {
      const { id, ...updates } = args;
      const data = await wappyRequest(`/atel/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_caso_atel',
  {
    id: z.string().describe('ID del caso ATEL a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/atel/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_actualizar_capacitacion',
  {
    id: z.string().describe('ID de la sesión de capacitación a actualizar'),
    tema: z.string().optional().describe('Tema de la capacitación'),
    fecha: z.string().optional().describe('Fecha (YYYY-MM-DD)'),
    hora: z.string().optional().describe('Hora'),
    duracion: z.string().optional().describe('Duración'),
    responsable: z.string().optional().describe('Responsable'),
    estado: z.string().optional().describe('Estado (Programada, Ejecutada, Cancelada)'),
  },
  async (args) => {
    try {
      const { id, ...updates } = args;
      const data = await wappyRequest(`/capacitaciones/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_capacitacion',
  {
    id: z.string().describe('ID de la sesión de capacitación a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/capacitaciones/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_actualizar_hallazgo_auditoria',
  {
    id: z.string().describe('ID o código del hallazgo de auditoría a actualizar'),
    observation: z.string().optional().describe('Plan de acción o avance'),
    status: z.enum(['cumple', 'no_cumple', 'en_tramite']).optional().describe('Estado del hallazgo'),
    responsable: z.string().optional().describe('Responsable'),
    fechaCompromiso: z.string().optional().describe('Fecha compromiso (YYYY-MM-DD)'),
  },
  async (args) => {
    try {
      const { id, ...updates } = args;
      const data = await wappyRequest(`/auditorias/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_hallazgo_auditoria',
  {
    id: z.string().describe('ID o código del hallazgo de auditoría a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/auditorias/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

server.tool(
  'wappy_eliminar_automatizacion',
  {
    id: z.string().describe('ID de la tarea automatizada a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/agentes-automatizaciones/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

// ─── 21. GESTIÓN MULTI-EMPRESAS ─────────────────────────────────────────────

server.tool(
  'wappy_consultar_empresas',
  {},
  async () => {
    try {
      const data = await wappyRequest('/companies', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_crear_empresa',
  {
    companyName: z.string().describe('Razón Social o Nombre de la nueva empresa'),
    nit: z.string().optional().describe('NIT de la empresa'),
    companyType: z.string().optional().describe('Persona Jurídica o Persona Natural'),
    workerCount: z.number().optional().describe('Número total de trabajadores'),
    arl: z.string().optional().describe('Nombre de la ARL'),
    riskLevel: z.string().optional().describe('Nivel de riesgo (I, II, III, IV o V)'),
    economicActivity: z.string().optional().describe('Actividad económica'),
    department: z.string().optional().describe('Departamento'),
    city: z.string().optional().describe('Municipio o Ciudad'),
    address: z.string().optional().describe('Dirección principal'),
    phone: z.string().optional().describe('Teléfono de contacto'),
    email: z.string().optional().describe('Correo electrónico'),
    isActive: z.boolean().optional().describe('Si debe activarse como empresa activa por defecto'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/companies', {
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
  'wappy_actualizar_empresa',
  {
    id: z.string().describe('ID de la empresa a actualizar'),
    companyName: z.string().optional().describe('Razón Social o Nombre'),
    nit: z.string().optional().describe('NIT'),
    companyType: z.string().optional().describe('Persona Jurídica o Natural'),
    workerCount: z.number().optional().describe('Número de trabajadores'),
    arl: z.string().optional().describe('ARL'),
    riskLevel: z.string().optional().describe('Nivel de riesgo principal'),
    economicActivity: z.string().optional().describe('Actividad económica'),
    department: z.string().optional().describe('Departamento'),
    city: z.string().optional().describe('Ciudad'),
    address: z.string().optional().describe('Dirección'),
    phone: z.string().optional().describe('Teléfono'),
    email: z.string().optional().describe('Correo'),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await wappyRequest(`/companies/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_activar_empresa',
  {
    id: z.string().describe('ID de la empresa que se desea activar como contexto de trabajo'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/companies/${encodeURIComponent(id)}/activate`, {
        method: 'POST',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_empresa',
  {
    id: z.string().describe('ID de la empresa a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/companies/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 22. ESTUDIOS DE PUESTO DE TRABAJO (EPT - ERGONOMÍA) ───────────────────

server.tool(
  'wappy_consultar_estudios_puesto',
  {},
  async () => {
    try {
      const data = await wappyRequest('/estudio-puesto', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_estudio_puesto',
  {
    workerName: z.string().describe('Nombre del trabajador evaluado'),
    cargo: z.string().describe('Cargo del trabajador'),
    workerId: z.string().optional().describe('ID o cédula del trabajador'),
    actividad: z.string().optional().describe('Actividad o tarea analizada ergonómicamente'),
    rulaScore: z.number().optional().describe('Puntaje RULA obtenido (1 a 7)'),
    rebaScore: z.number().optional().describe('Puntaje REBA obtenido (1 a 15)'),
    riskLevel: z.enum(['Bajo', 'Medio', 'Alto', 'Muy Alto']).optional().describe('Nivel de riesgo ergonómico'),
    notes: z.string().optional().describe('Conclusiones, hallazgos y recomendaciones ergonómicas'),
    evaluatorName: z.string().optional().describe('Nombre del profesional SST que realizó el estudio'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/estudio-puesto', {
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
  'wappy_actualizar_estudio_puesto',
  {
    id: z.string().describe('ID del estudio de puesto de trabajo a actualizar'),
    actividad: z.string().optional().describe('Actividad o tarea analizada'),
    rulaScore: z.number().optional().describe('Puntaje RULA'),
    rebaScore: z.number().optional().describe('Puntaje REBA'),
    riskLevel: z.enum(['Bajo', 'Medio', 'Alto', 'Muy Alto']).optional().describe('Nivel de riesgo ergonómico'),
    notes: z.string().optional().describe('Conclusiones y recomendaciones'),
    evaluatorName: z.string().optional().describe('Nombre del evaluador'),
    status: z.string().optional().describe('Estado (ej: completado, en_revision)'),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await wappyRequest(`/estudio-puesto/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_estudio_puesto',
  {
    id: z.string().describe('ID del estudio de puesto de trabajo a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/estudio-puesto/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 23. CURSOS Y ACADEMIA LMS ──────────────────────────────────────────────

server.tool(
  'wappy_consultar_cursos_lms',
  {},
  async () => {
    try {
      const data = await wappyRequest('/courses', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_crear_curso_lms',
  {
    title: z.string().describe('Título del curso'),
    description: z.string().optional().describe('Descripción detallada del curso'),
    thumbnail: z.string().optional().describe('URL de imagen de portada'),
    tags: z.array(z.string()).optional().describe('Etiquetas de clasificación (ej: ["SST", "Brigadas"])'),
    isPublished: z.boolean().optional().describe('Publicar de inmediato'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/courses', {
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
  'wappy_actualizar_curso_lms',
  {
    id: z.string().describe('ID del curso a modificar'),
    title: z.string().optional().describe('Título del curso'),
    description: z.string().optional().describe('Descripción'),
    thumbnail: z.string().optional().describe('URL de imagen'),
    tags: z.array(z.string()).optional().describe('Etiquetas'),
    isPublished: z.boolean().optional().describe('Estado de publicación'),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await wappyRequest(`/courses/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_curso_lms',
  {
    id: z.string().describe('ID del curso a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/courses/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_consultar_progreso_cursos',
  {},
  async () => {
    try {
      const data = await wappyRequest('/courses/progress', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 24. MARKETPLACE DE PRODUCTOS Y SERVICIOS SST ──────────────────────────

server.tool(
  'wappy_consultar_marketplace',
  {},
  async () => {
    try {
      const data = await wappyRequest('/marketplace/products', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_crear_producto_marketplace',
  {
    title: z.string().describe('Nombre del producto o servicio'),
    category: z.string().describe('Categoría (ej: Software, Consultoría, EPP, Capacitaciones)'),
    regularPrice: z.number().describe('Precio regular en pesos colombianos (COP)'),
    salePrice: z.number().optional().describe('Precio de oferta con descuento'),
    serviceType: z.string().optional().describe('Tipo (ej: service_virtual, product_physical)'),
    shortDescription: z.string().optional().describe('Descripción breve'),
    description: z.string().optional().describe('Descripción completa en Markdown'),
    deliverables: z.array(z.string()).optional().describe('Entregables incluidos'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/marketplace/products', {
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
  'wappy_actualizar_producto_marketplace',
  {
    id: z.string().describe('ID del producto a actualizar'),
    title: z.string().optional().describe('Nombre del producto'),
    category: z.string().optional().describe('Categoría'),
    regularPrice: z.number().optional().describe('Precio regular'),
    salePrice: z.number().optional().describe('Precio oferta'),
    shortDescription: z.string().optional().describe('Descripción breve'),
    description: z.string().optional().describe('Descripción detallada'),
    status: z.string().optional().describe('Estado (published, draft, archived)'),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await wappyRequest(`/marketplace/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_producto_marketplace',
  {
    id: z.string().describe('ID del producto a eliminar del marketplace'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/marketplace/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_consultar_pedidos_marketplace',
  {},
  async () => {
    try {
      const data = await wappyRequest('/marketplace/orders', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 25. BLOG DE SST ───────────────────────────────────────────────────────

server.tool(
  'wappy_consultar_blog',
  {},
  async () => {
    try {
      const data = await wappyRequest('/blog', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_crear_articulo_blog',
  {
    title: z.string().describe('Título del artículo'),
    content: z.string().describe('Contenido completo del artículo en Markdown'),
    description: z.string().optional().describe('Resumen breve o meta-descripción SEO'),
    tags: z.array(z.string()).optional().describe('Etiquetas del artículo (ej: ["GTC45", "Normativa"])'),
    isPublished: z.boolean().optional().describe('Publicar de inmediato'),
    isFeatured: z.boolean().optional().describe('Destacar en la portada del blog'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/blog', {
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
  'wappy_actualizar_articulo_blog',
  {
    id: z.string().describe('ID del artículo a actualizar'),
    title: z.string().optional().describe('Título'),
    content: z.string().optional().describe('Contenido en Markdown'),
    description: z.string().optional().describe('Resumen'),
    tags: z.array(z.string()).optional().describe('Etiquetas'),
    isPublished: z.boolean().optional().describe('Estado de publicación'),
    isFeatured: z.boolean().optional().describe('Destacado'),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await wappyRequest(`/blog/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_articulo_blog',
  {
    id: z.string().describe('ID del artículo a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/blog/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 26. EVENTOS Y WEBINARS ────────────────────────────────────────────────

server.tool(
  'wappy_consultar_eventos',
  {},
  async () => {
    try {
      const data = await wappyRequest('/events', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_crear_evento',
  {
    title: z.string().describe('Título del webinar o evento en vivo'),
    dateTime: z.string().describe('Fecha y hora del evento (ISO o YYYY-MM-DD HH:mm)'),
    meetLink: z.string().describe('Enlace de la videollamada (Google Meet, Zoom, Teams)'),
    description: z.string().optional().describe('Descripción del evento'),
    meetPassword: z.string().optional().describe('Contraseña o código de acceso'),
    tags: z.array(z.string()).optional().describe('Etiquetas'),
    isPublished: z.boolean().optional().describe('Publicar evento en la plataforma'),
    isFeatured: z.boolean().optional().describe('Destacar evento'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/events', {
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
  'wappy_actualizar_evento',
  {
    id: z.string().describe('ID del evento a actualizar'),
    title: z.string().optional().describe('Título'),
    dateTime: z.string().optional().describe('Fecha y hora'),
    meetLink: z.string().optional().describe('Enlace de videollamada'),
    description: z.string().optional().describe('Descripción'),
    meetPassword: z.string().optional().describe('Contraseña'),
    isPublished: z.boolean().optional().describe('Publicado'),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await wappyRequest(`/events/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_eliminar_evento',
  {
    id: z.string().describe('ID del evento a eliminar'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 27. EMBAJADORES Y AFILIADOS ───────────────────────────────────────────

server.tool(
  'wappy_consultar_embajador',
  {},
  async () => {
    try {
      const data = await wappyRequest('/partners', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_consultar_comisiones_embajador',
  {},
  async () => {
    try {
      const data = await wappyRequest('/partners/commissions', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_solicitar_pago_embajador',
  {
    amount: z.number().describe('Monto a solicitar en COP'),
    bankDetails: z.string().optional().describe('Datos bancarios o cuenta para la transferencia'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/partners/payout', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 28. TRABAJO SEGURO EN ALTURAS ─────────────────────────────────────────

server.tool(
  'wappy_consultar_equipos_alturas',
  {},
  async () => {
    try {
      const data = await wappyRequest('/alturas', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_equipo_alturas',
  {
    workerId: z.string().describe('ID o cédula del trabajador al que se le asigna el equipo'),
    nombre: z.string().describe('Nombre del equipo (ej: Arnés Multipropósito, Eslinga en Y, Línea de Vida)'),
    serial: z.string().describe('Número de serial único o lote del equipo'),
    nombreTrabajador: z.string().optional().describe('Nombre del colaborador'),
    cargo: z.string().optional().describe('Cargo del colaborador'),
    marca: z.string().optional().describe('Marca fabricante (ej: DBI-SALA, Miller, Steelpro)'),
    referencia: z.string().optional().describe('Referencia técnica o modelo'),
    fechaCompra: z.string().optional().describe('Fecha de compra o fabricación (YYYY-MM-DD)'),
    fechaProximaInspeccion: z.string().optional().describe('Fecha límite de la próxima inspección periódica (YYYY-MM-DD)'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/alturas', {
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
  'wappy_eliminar_equipo_alturas',
  {
    workerId: z.string().describe('ID o cédula del trabajador'),
    equipoId: z.string().describe('ID único o número de serial del equipo a retirar'),
  },
  async ({ workerId, equipoId }) => {
    try {
      const data = await wappyRequest(`/alturas/${encodeURIComponent(workerId)}/${encodeURIComponent(equipoId)}`, {
        method: 'DELETE',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 29. TICKETS DE SOPORTE ────────────────────────────────────────────────

server.tool(
  'wappy_consultar_tickets',
  {},
  async () => {
    try {
      const data = await wappyRequest('/tickets', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_crear_ticket',
  {
    name: z.string().describe('Nombre de quien reporta el ticket'),
    email: z.string().describe('Correo electrónico de contacto'),
    description: z.string().describe('Descripción detallada de la solicitud o incidencia'),
    phone: z.string().optional().describe('Teléfono de contacto'),
    type: z.enum(['Petición', 'Queja', 'Reclamo', 'Sugerencia', 'Soporte Técnico']).optional().describe('Tipo de ticket'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/tickets', {
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
  'wappy_actualizar_ticket',
  {
    id: z.string().describe('ID del ticket de soporte'),
    status: z.enum(['pending', 'in_progress', 'resolved', 'closed']).optional().describe('Nuevo estado'),
    response: z.string().optional().describe('Respuesta o solución brindada al usuario'),
  },
  async ({ id, ...updates }) => {
    try {
      const data = await wappyRequest(`/tickets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 30. TENSHI VOICE CONFIGURACIÓN ────────────────────────────────────────

server.tool(
  'wappy_consultar_config_tenshi',
  {},
  async () => {
    try {
      const data = await wappyRequest('/tenshi/config', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_actualizar_config_tenshi',
  {
    systemPrompt: z.string().optional().describe('Prompt del sistema o personalidad de Tenshi'),
    extraKnowledge: z.string().optional().describe('Base de conocimientos complementaria'),
    model: z.string().optional().describe('Modelo de lenguaje de IA para Tenshi'),
    location: z.string().optional().describe('Ubicación visual en pantalla (bottom-right, bottom-left, etc.)'),
    isActive: z.boolean().optional().describe('Habilitar o deshabilitar Tenshi Voice'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/tenshi/config', {
        method: 'PUT',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 31. NOTIFICACIONES Y ALERTAS DEL USUARIO ──────────────────────────────

server.tool(
  'wappy_consultar_notificaciones',
  {},
  async () => {
    try {
      const data = await wappyRequest('/notifications', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_crear_notificacion',
  {
    title: z.string().describe('Título de la notificación o alerta'),
    body: z.string().describe('Mensaje de la notificación'),
    type: z.enum([
      'ticket_created', 'ticket_responded', 'contact_request', 'payment_received',
      'sgsst_reporte_acto', 'sgsst_participacion_ipevar', 'sgsst_alta_direccion',
      'sgsst_perfil_update', 'sgsst_testimonio_atel', 'system_update', 'welcome_promo', 'group_invitation'
    ]).optional().describe('Tipo de notificación'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/notifications', {
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
  'wappy_marcar_notificacion_leida',
  {
    id: z.string().describe('ID de la notificación a marcar como leída'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 32. MATRIZ DE COMPATIBILIDAD QUÍMICA ──────────────────────────────────

server.tool(
  'wappy_consultar_compatibilidad_quimica',
  {},
  async () => {
    try {
      const data = await wappyRequest('/compatibilidad-quimica', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_guardar_compatibilidad_quimica',
  {
    officialTitle: z.string().optional().describe('Título del reporte oficial de compatibilidad'),
    matrixRows: z.array(z.any()).optional().describe('Filas de la matriz de compatibilidad (sustancias y cruces)'),
    chartConclusions: z.record(z.any()).optional().describe('Conclusiones técnicas de compatibilidad química'),
    reportHtml: z.string().optional().describe('Informe técnico en formato HTML'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/compatibilidad-quimica', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 33. CRM Y PROSPECTOS / LEADS ──────────────────────────────────────────

server.tool(
  'wappy_consultar_leads',
  {},
  async () => {
    try {
      const data = await wappyRequest('/leads', { method: 'GET' });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

server.tool(
  'wappy_registrar_lead',
  {
    fullName: z.string().describe('Nombre completo del prospecto o cliente'),
    email: z.string().describe('Correo electrónico'),
    phone: z.string().describe('Número telefónico de WhatsApp'),
    funnelKey: z.string().optional().describe('Canal o embudo de procedencia (ej: comunidad, web, webinar)'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/leads', {
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
  'wappy_eliminar_lead',
  {
    id: z.string().describe('ID del lead a eliminar del CRM'),
  },
  async ({ id }) => {
    try {
      const data = await wappyRequest(`/leads/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return formatMcpResponse(data);
    } catch (err) {
      return formatMcpError(err);
    }
  }
);

// ─── 34. PLAN, SUSCRIPCIÓN Y SALDO DE PUNTOS ───────────────────────────────

server.tool(
  'wappy_consultar_plan_y_balance',
  {},
  async () => {
    try {
      const data = await wappyRequest('/user/plan-balance', { method: 'GET' });
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
  console.error('[WAPPY MCP Bridge] Conectado exitosamente por stdio con 110+ herramientas especializadas.');
}

main().catch((err) => {
  console.error('[WAPPY MCP Bridge] Error fatal al iniciar:', err);
  process.exit(1);
});
