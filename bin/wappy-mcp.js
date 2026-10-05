#!/usr/bin/env node

/**
 * WAPPY MCP Server Bridge
 * Conector Model Context Protocol (MCP) para LibreChat-WAPPY.
 * Permite a Antigravity (y otros clientes MCP) consultar y alimentar el perfil
 * de empresa, matriz GTC-45, PESV, trabajadores y cronograma de SST de cada usuario.
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
  version: '1.0.0',
});

// 1. Tool: Consultar Perfil de Empresa
server.tool(
  'wappy_consultar_perfil_empresa',
  {},
  async () => {
    try {
      const data = await wappyRequest('/profile', { method: 'GET' });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 2. Tool: Actualizar Perfil de Empresa
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
    generalActivities: z.string().optional().describe('Descripción detallada de actividades y procesos'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/profile', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 3. Tool: Consultar Matriz GTC-45
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 4. Tool: Alimentar Matriz GTC-45
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 5. Tool: Consultar Matriz PESV
server.tool(
  'wappy_consultar_matriz_pesv',
  {},
  async () => {
    try {
      const data = await wappyRequest('/pesv', { method: 'GET' });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 6. Tool: Alimentar Matriz PESV
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 7. Tool: Consultar Trabajadores (Sociodemográfico)
server.tool(
  'wappy_consultar_trabajadores',
  {},
  async () => {
    try {
      const data = await wappyRequest('/workers', { method: 'GET' });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 8. Tool: Registrar Trabajador
server.tool(
  'wappy_registrar_trabajador',
  {
    nombre_completo: z.string().describe('Nombre y apellidos del trabajador'),
    cedula: z.string().describe('Número de documento de identidad'),
    cargo: z.string().describe('Cargo u ocupación'),
    area: z.string().optional().describe('Área o departamento'),
    sede: z.string().optional().describe('Sede o centro de trabajo'),
    nivel_riesgo_arl: z.string().optional().describe('Nivel de riesgo ARL asignado'),
    tipo_contrato: z.string().optional().describe('Tipo de contrato (Indefinido, Fijo, Prestación, etc.)'),
  },
  async (args) => {
    try {
      const data = await wappyRequest('/workers', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 9. Tool: Consultar Cronograma SST
server.tool(
  'wappy_consultar_cronograma_sst',
  {},
  async () => {
    try {
      const data = await wappyRequest('/tasks', { method: 'GET' });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// 10. Tool: Crear Actividad en Cronograma SST
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: err.message }],
      };
    }
  }
);

// Conectar mediante transporte stdio estándar de MCP
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[WAPPY MCP Bridge] Conectado exitosamente por stdio.');
}

main().catch((err) => {
  console.error('[WAPPY MCP Bridge] Error fatal al iniciar:', err);
  process.exit(1);
});
