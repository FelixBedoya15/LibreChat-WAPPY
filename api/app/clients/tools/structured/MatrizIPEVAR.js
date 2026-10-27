const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const GTC45Matrix = require('~/models/GTC45WorkspaceSession');
const CompanyInfo = require('~/models/CompanyInfo');

class MatrizIPEVAR extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'matriz_ipevar';
    this.description =
      'Lee, añade, evalúa o actualiza riesgos laborales directamente en la Matriz GTC-45 de la conversación actual. Usa esta herramienta para leer, documentar o evaluar peligros en la matriz IPEVR/GTC-45. REGLAS CRÍTICAS: (1) Cuando el usuario pida generar la matriz de riesgos desde cero con IA para la empresa, ten en cuenta toda la información suministrada de la empresa y genera MÍNIMO 15 riesgos (entre 15 y 18 riesgos diversos y representativos que cubran los procesos y las 7 clasificaciones de peligros GTC-45). (2) Cuando se actualiza una matriz ya realizada o importada, NUNCA sobrescribas Descripción del Peligro (peligro_descripcion), Clasificación del Peligro (peligro_clasificacion), Control Fuente (controles_fuente), Control Medio (controles_medio), Control Individuo (controles_individuo) ni Nro. Expuestos (nro_expuestos); en cambio, Efectos Posibles (efectos_posibles) SÍ se puede editar siempre para mejorarlos técnica y clínicamente. (3) En los Controles Propuestos (medida_eliminacion, medida_sustitucion, medida_ingenieria, medida_administrativa, medida_eppu) ESTÁ PROHIBIDO recomendar algo que ya se usa en los Controles Existentes (ej. si en controles existentes dice que ya usan tapaoídos, NO proponer usar tapaoídos en los controles propuestos). (4) La Evaluación y Calificación del Riesgo (nd, ne, nc) debe tener muy en cuenta los Controles Existentes, los Efectos Posibles, el Nro. de Expuestos y todo lo suministrado por la empresa, EXCLUYENDO por completo los Controles Propuestos y el Factor de Reducción. (5) En Factores de Reducción (Anexo E - factores_reduccion), ten en cuenta toda la información de la fila y ESPECIALMENTE evalúa y compara los Controles Propuestos (Eliminación, Sustitución, Ingeniería, Administrativos y EPP) para decir en relación Costo-Beneficio cuál es el control propuesto que más le conviene a la empresa. (6) En cualquier informe de "Matriz Maestra GTC 45:2012 de Evaluación de Riesgos y Controles", en la columna de Controles SOLO debe aparecer el Anexo E ("🔬 Justificación Técnica del Factor de Reducción").';
    this.req = fields.req;
    this.schema = z.object({
      accion: z.enum(['leer', 'escribir', 'borrar', 'consultar_contexto_sgsst']).describe('Usa consultar_contexto_sgsst para datos de la empresa, leer para consultar, escribir para guardar, borrar para eliminar.'),
      filtro_proceso: z.string().optional().describe('Filtro para leer, o cargo a buscar en el contexto sgsst.'),
      filtro_cargo: z.string().optional().describe('Filtro por cargo para leer.'),
      filtro_actividad: z.string().optional().describe('Filtro para leer.'),
      filtro_peligro: z.string().optional().describe('Filtro para leer.'),
      ids_a_borrar: z.array(z.string()).optional().describe('Arreglo de IDs de los riesgos que deseas eliminar. Solamente usado cuando accion="borrar".'),
      riesgos: z.array(z.object({
        cargo: z.string().optional().describe('Cargo, puesto de trabajo o rol ocupacional expuesto al peligro (ej. "Soldador", "Operario de Producción", "Conductor", "Auxiliar Administrativo"). CRÍTICO: Parametriza directamente con el módulo de Perfiles de Cargo.'),
        proceso: z.string().describe('El proceso o área general.'),
        zona: z.string().describe('Lugar o zona de trabajo.'),
        actividad: z.string().describe('Actividad específica que realiza el trabajador.'),
        tareas: z.string().describe('Descripción de las tareas específicas.'),
        rutinaria: z.enum(['Sí', 'No']).describe('¿Es una tarea rutinaria?'),
        peligro_descripcion: z
          .string()
          .describe('Descripción del riesgo. CRÍTICO: Si es una matriz ya existente/importada, conserva el valor original. Si el peligro_clasificacion es "Psicosocial", DEBES extraer y prefijar estrictamente el "Dominio" y la "Dimensión". Ej: "[Dominio: Demandas del trabajo - Dimensión: Carga mental] Descripción...".'),
        peligro_clasificacion: z.string().describe('Clasificación (ej. Biomecánico, Físico, Químico). Si es matriz ya existente/importada, conserva el valor original.'),
        efectos_posibles: z.string().describe('Posibles efectos en la salud del trabajador. SIEMPRE puedes editarlos y enriquecerlos clínica/ocupacionalmente para mejorarlos.'),
        controles_fuente: z.string().default('Ninguno').describe('Controles existentes en la fuente. CRÍTICO: PROHIBIDO inventar controles existentes si la información suministrada por la empresa NO los menciona explícitamente; si no se mencionan o no existen, escribe estrictamente "Ninguno". Si ya existe en una matriz importada, consérvalo.'),
        controles_medio: z.string().default('Ninguno').describe('Controles existentes en el medio. CRÍTICO: PROHIBIDO inventar controles existentes si la información suministrada por la empresa NO los menciona explícitamente; si no se mencionan o no existen, escribe estrictamente "Ninguno". Si ya existe en una matriz importada, consérvalo.'),
        controles_individuo: z.string().default('Ninguno').describe('Controles existentes en el individuo. CRÍTICO: PROHIBIDO inventar controles existentes si la información suministrada por la empresa NO los menciona explícitamente; si no se mencionan o no existen, escribe estrictamente "Ninguno". Si ya existe en una matriz importada, consérvalo.'),
        nd: z.number().describe('Nivel de Deficiencia según Tabla 2 GTC-45 (ND: 10=Muy Alto sin controles eficaces en fuente/medio; 6=Alto eficacia baja; 2=Medio con controles existentes de eficacia moderada; 0=Bajo controlado). Evalúalo teniendo muy en cuenta los Controles Existentes, Efectos Posibles, Nro. de Expuestos y datos de la empresa, SIN tener en cuenta los Controles Propuestos ni el Factor de Reducción.'),
        ne: z.number().describe('Nivel de Exposición según Tabla 3 GTC-45 (NE: 4=Continua, 3=Frecuente, 2=Ocasional, 1=Esporádica). Evalúalo teniendo muy en cuenta la actividad/rutinaria, Nro. de Expuestos y datos de la empresa, SIN tener en cuenta los Controles Propuestos ni el Factor de Reducción.'),
        nc: z.number().describe('Nivel de Consecuencia según Tabla 6 GTC-45 (NC: 100=Mortal/Catastrófico, 60=Muy Grave invalidez/incapacidad permanente, 25=Grave incapacidad temporal, 10=Leve). Evalúalo teniendo muy en cuenta los Efectos Posibles, Peor Consecuencia y datos de la empresa, SIN tener en cuenta los Controles Propuestos ni el Factor de Reducción.'),
        medida_eliminacion: z.string().default('Ninguno').describe('Medidas: Eliminación. PROHIBIDO recomendar o solapar algo que ya figure en Controles Existentes.'),
        medida_sustitucion: z.string().default('Ninguno').describe('Medidas: Sustitución. PROHIBIDO recomendar o solapar algo que ya figure en Controles Existentes.'),
        medida_ingenieria: z.string().default('Ninguno').describe('Medidas: Controles de ingeniería nuevos/adicionales. PROHIBIDO recomendar o solapar algo que ya figure en Controles Existentes.'),
        medida_administrativa: z.string().default('Ninguno').describe('Medidas: Administrativos nuevos/adicionales. PROHIBIDO recomendar o solapar algo que ya figure en Controles Existentes.'),
        medida_eppu: z.string().default('Ninguno').describe('Medidas: EPP técnicos apropiados nuevos o superiores. PROHIBIDO recomendar un EPP que ya figure en Controles Existentes (ej. si ya usan tapaoídos o guantes, no volver a poner tapaoídos o guantes a secas; si el EPP existente es inadecuado para el peligro —ej. guante de vaqueta mecánico frente a vibración—, escribe explícitamente "Sustituir [EPP actual inadecuado] por [EPP certificado específico]").'),
        factores_reduccion: z.string().default('No aplica').describe('Factores de reducción (Anexo E GTC-45). CRÍTICO: Ten en cuenta toda la información de la fila y ESPECIALMENTE evalúa y compara los Controles Propuestos (Eliminación, Sustitución, Ingeniería, Administrativos y EPP) para decir en relación Costo-Beneficio cuál es el que más le conviene a la empresa: "Reducción del [X]% (NRi: [NR inicial] → NRf: [NR residual], Nivel [III o IV]). Análisis Costo/Beneficio (GTC 45 Anexo E): [Cita los controles propuestos y dictamina cuál de ellos —priorizando Ingeniería, Sustitución o Eliminación frente a Administrativos y EPP— le conviene más a la empresa (Factor J > 20) frente a costos de incapacidades, ausentismo o indemnizaciones por la peor consecuencia]".'),
        nd_cualitativo: z.number().optional().describe('ND cualitativo (MA=10, A=6, M=2, B=0).'),
        nro_expuestos: z.number().default(1).describe('Número de trabajadores expuestos al peligro. Si ya existe (> 0) en una matriz importada, consérvalo.'),
        peor_consecuencia: z.string().default('Ninguna').describe('Peor consecuencia posible si el peligro se materializa.'),
        requisito_legal: z.string().default('').describe('¿Existe un requisito legal específico asociado al peligro? ("Sí", "No", o vacío).'),
      })).optional().describe('Lista de riesgos. OBLIGATORIO si accion="escribir". Vacío en otros casos.')
    });
  }

  /**
   * _call receives (input, runManager) where runManager carries LangGraph metadata.
   * FORENSIC FINDING (2026-03-31):
   *   - LangGraph always injects thread_id into runManager.metadata.thread_id
   *   - runManager.configurable also contains thread_id
   *   - config/3rd arg is NEVER passed by LangChain's DynamicStructuredTool wrapper
   *   - This is the only reliable way to get conversationId inside a tool _call
   */
  async _call(input, runManager) {
    try {
      // ✅ PRIMARY: LangGraph thread_id via runManager
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No se encontró un ID de conversación válido para guardar la matriz.';
        console.error(`[MatrizIPEVAR Tool] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg });
      }

      const { accion, riesgos, filtro_proceso, filtro_cargo, filtro_actividad, filtro_peligro, ids_a_borrar } = input;

      // Obtener sesión
      const userId = this.req?.user?.id;
      let targetUserId = userId;
      try {
        const User = mongoose.models.User || require('~/models/User');
        const userDoc = await User.findById(userId).select('isSubUser parentUser assignedCompany').lean();
        if (userDoc?.isSubUser && userDoc?.parentUser) {
          targetUserId = userDoc.parentUser.toString();
        }
      } catch (_) {}

      let companyId = null;
      if (targetUserId) {
        let active = await CompanyInfo.findOne({ user: targetUserId, isActive: true });
        if (!active) active = await CompanyInfo.findOne({ user: targetUserId });
        companyId = active ? active._id : null;
      }

      // Obtener sesión
      let session = await GTC45Matrix.findOne({ conversationId });
      if (session && !session.companyId && companyId) {
        session.companyId = companyId;
        await session.save();
        console.log(`[MatrizIPEVAR Tool] Populated missing companyId ${companyId} for session ${conversationId}`);
      }
      
      if (!session && userId && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
        const tempId = `temp-${userId}`;
        const tempSession = await GTC45Matrix.findOne({ conversationId: tempId, user: userId });
        if (tempSession && tempSession.matrixRows && tempSession.matrixRows.length > 0) {
          tempSession.conversationId = conversationId;
          if (companyId) tempSession.companyId = companyId;
          await tempSession.save();
          session = tempSession;
          console.log(`[MatrizIPEVAR Tool] Migrated temporal matrix session (${tempSession.matrixRows.length} rows) for user ${userId} to conversation ${conversationId}`);
        }
      }

      // LOGICA DE CONTEXTO SGSST EXTERNO
      if (accion === 'consultar_contexto_sgsst') {
         if (!userId) { return JSON.stringify({ error: 'No autenticado para acceder al contexto.' }); }
         console.log(`[MatrizIPEVAR Tool] CONTEXTO SGSST solicitado para convo: ${conversationId}`);
         
         const CompanyInfo = mongoose.models.CompanyInfo;
         const PerfilCargoModel = mongoose.models.PerfilCargoData;
         const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData;

         let payload = {};

         // Extraer Macro Empresa
          if (CompanyInfo) {
              let companyConf = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
              if (!companyConf) companyConf = await CompanyInfo.findOne({ user: userId }).lean();
              if (companyConf) {
                 payload.informacion_empresa = {
                     nombre: companyConf.companyName || 'N/A',
                     nit: companyConf.nit || 'N/A',
                     representante_legal: companyConf.legalRepresentative || 'N/A',
                     actividad_economica: companyConf.economicActivity || 'N/A',
                     codigo_ciiu: companyConf.ciiu || 'N/A',
                     sector: companyConf.sector || 'N/A',
                     descripcion_actividades: companyConf.generalActivities || 'N/A',
                     sedes_adicionales: companyConf.sedes || [],
                     nivel_riesgo: companyConf.riskLevel || 'N/A',
                     arl: companyConf.arl || 'N/A',
                     numero_trabajadores: companyConf.workerCount || 'N/A',
                     responsable_sst: companyConf.responsibleSST || 'N/A',
                     licencia_sst: companyConf.licenseNumber || 'N/A',
                     vencimiento_licencia: companyConf.licenseExpiry || 'N/A',
                     curso_50_20h: companyConf.courseStatus || 'N/A'
                 };
             }
         }

         // Extraer Cargos
         if (PerfilCargoModel) {
             const cargoDataDoc = await PerfilCargoModel.findOne({ user: userId, ...(companyId ? { companyId } : {}) }).lean();
             if (cargoDataDoc && cargoDataDoc.perfiles) {
                 // Si nos mandan filtro_proceso (ej. "soldador"), filtramos para no aglomerar el payload, sino devolvemos todo.
                 let perfiles = cargoDataDoc.perfiles;
                 if (filtro_proceso) {
                     perfiles = perfiles.filter(p => p.nombreCargo && p.nombreCargo.toLowerCase().includes(filtro_proceso.toLowerCase()));
                 }
                 payload.perfiles_cargo_encontrados = perfiles.map(p => ({
                     cargo: p.nombreCargo,
                     responsabilidadesSST: p.responsabilidadesSST || 'Ninguna definida',
                     epp_estricto: p.elementosProteccion || 'No documentado',
                     restricciones: p.restricciones || 'Ninguna'
                 }));
             }
         }

         // Extraer Salud y Vencimientos
         if (PerfilSocioModel) {
             const socioDataDoc = await PerfilSocioModel.findOne({ user: userId, ...(companyId ? { companyId } : {}) }).lean();
             if (socioDataDoc && socioDataDoc.trabajadores) {
                 let trabajadores = socioDataDoc.trabajadores;
                 if (filtro_proceso) {
                     trabajadores = trabajadores.filter(t => t.cargo && t.cargo.toLowerCase().includes(filtro_proceso.toLowerCase()));
                 }
                 payload.frecuencia_patologias_y_habitos = trabajadores.map(t => ({
                     cargo_del_trabajador: t.cargo,
                     diagnosticoOcupacional: t.diagnosticoMedico || '',
                     recomendaciones: t.recomendacionesMedicas || '',
                     limitacionesBiomecanicas: t.limitacionesBiomecanicas || '',
                     alergias: t.alergiasQuimicas || ''
                 }));
             }
         }

         return JSON.stringify({
            mensaje: "Contexto SGSST de la compañía recuperado exitosamente.",
            advertencia: "MEMORIZA ESTA INFORMACIÓN PARA INYECTAR CONTROLES (ej. LOS EPP o RESTRICCIONES documentados) AL ESCRIBIR TUS FILAS DE MATRIZ DE PELIGROS.",
            datos: payload
         });
      }

      // LOGICA DE LECTURA
      if (accion === 'leer') {
        console.log(`[MatrizIPEVAR Tool] LECTURA para convo: ${conversationId}`);
        let rows = session?.matrixRows || [];

        // Fallback a matriz oficial o corporativa de la empresa si la sesión actual no tiene filas
        if (rows.length === 0 && (userId || targetUserId || companyId)) {
          const userFilter = [userId, targetUserId].filter(Boolean);
          const officialConvoIds = [
            companyId ? `official-${companyId}` : null,
            targetUserId ? `official-${targetUserId}` : null,
            userId ? `official-${userId}` : null,
          ].filter(Boolean);

          let fallbackDoc = await GTC45Matrix.findOne({
            user: { $in: userFilter },
            ...(companyId ? { companyId } : {}),
            isOfficial: true,
          });
          if (!fallbackDoc && officialConvoIds.length > 0) {
            fallbackDoc = await GTC45Matrix.findOne({ conversationId: { $in: officialConvoIds } });
          }
          if (!fallbackDoc) {
            fallbackDoc = await GTC45Matrix.findOne({
              ...(companyId ? { companyId } : { user: { $in: userFilter } }),
              'matrixRows.0': { $exists: true },
            }).sort({ updatedAt: -1 });
          }
          if (!fallbackDoc && userFilter.length > 0 && !companyId) {
            fallbackDoc = await GTC45Matrix.findOne({
              user: { $in: userFilter },
              'matrixRows.0': { $exists: true },
            }).sort({ updatedAt: -1 });
          }
          if (fallbackDoc && Array.isArray(fallbackDoc.matrixRows) && fallbackDoc.matrixRows.length > 0) {
            rows = fallbackDoc.matrixRows;
            console.log(`[MatrizIPEVAR Tool] Fallback exitoso a Matriz Oficial/Corporativa: ${rows.length} riesgos encontrados.`);
          }
        }

        if (!rows || rows.length === 0) {
          return JSON.stringify({ mensaje: 'La matriz está vacía. No hay riesgos registrados aún.', resultados: [] });
        }
        
        let filteredRows = rows;
        if (filtro_proceso) {
          filteredRows = filteredRows.filter(r => r.proceso && r.proceso.toLowerCase().includes(filtro_proceso.toLowerCase()));
        }
        if (filtro_cargo) {
          filteredRows = filteredRows.filter(r => r.cargo && r.cargo.toLowerCase().includes(filtro_cargo.toLowerCase()));
        }
        if (filtro_actividad) {
          filteredRows = filteredRows.filter(r => r.actividad && r.actividad.toLowerCase().includes(filtro_actividad.toLowerCase()));
        }
        if (filtro_peligro) {
          filteredRows = filteredRows.filter(r => r.peligro_clasificacion && r.peligro_clasificacion.toLowerCase().includes(filtro_peligro.toLowerCase()));
        }

        const MAX_TOOL_ROWS = 60;
        if (filteredRows.length > MAX_TOOL_ROWS) {
          const porNivelRiesgo = { I: 0, II: 0, III: 0, IV: 0 };
          const porClasificacion = {};
          const procesosSet = new Set();
          const cargosSet = new Set();

          filteredRows.forEach(r => {
            const niv = String(r.interpretacion_nr || '').trim().toUpperCase();
            if (porNivelRiesgo[niv] !== undefined) porNivelRiesgo[niv]++;
            const clas = String(r.peligro_clasificacion || 'Sin clasificar').trim();
            porClasificacion[clas] = (porClasificacion[clas] || 0) + 1;
            if (r.proceso) procesosSet.add(r.proceso);
            if (r.cargo) cargosSet.add(r.cargo);
          });

          const topCriticos = [...filteredRows]
            .sort((a, b) => (Number(b.nr) || 0) - (Number(a.nr) || 0))
            .slice(0, MAX_TOOL_ROWS);

          return JSON.stringify({
            mensaje: `Se encontraron ${filteredRows.length} riesgos en la matriz. Para optimizar la ventana de contexto y evitar errores de límite de tokens, se entrega el resumen estadístico completo de los ${filteredRows.length} registros junto con la muestra de los ${MAX_TOOL_ROWS} riesgos más críticos (ordenados por Nivel de Riesgo NR descendente). Puedes usar filtro_proceso, filtro_cargo, filtro_actividad o filtro_peligro para consultar segmentos específicos.`,
            totalRegistros: rows.length,
            registrosCoincidentes: filteredRows.length,
            resumenEstadistico: {
              porNivelRiesgo,
              porClasificacion,
              procesos: Array.from(procesosSet).slice(0, 50),
              cargos: Array.from(cargosSet).slice(0, 50),
            },
            resultadosMuestraCritica: topCriticos,
          });
        }
        
        return JSON.stringify({
          mensaje: `Se encontraron ${filteredRows.length} riesgos.`,
          totalRegistros: rows.length,
          resultados: filteredRows
        });
      }

      // LOGICA DE BORRADO
      if (accion === 'borrar') {
        if (!session || !session.matrixRows || session.matrixRows.length === 0) {
          return JSON.stringify({ error: 'La matriz está vacía. No hay riesgos para borrar.' });
        }
        if (!ids_a_borrar || !Array.isArray(ids_a_borrar) || ids_a_borrar.length === 0) {
          return JSON.stringify({ error: 'Debe proveer un arreglo "ids_a_borrar" con los IDs de los riesgos a eliminar.' });
        }
        const initialCount = session.matrixRows.length;
        session.matrixRows = session.matrixRows.filter(r => !ids_a_borrar.includes(r.id));
        const deletedCount = initialCount - session.matrixRows.length;
        
        session.markModified('matrixRows');
        await session.save();

        // Sincronización en paralelo con Somos SST (Matriz Oficial) al borrar
        if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
          const officialConvoId = `official-${companyId || userId}`;
          const isOfficialSource = session.isOfficial || (await GTC45Matrix.exists({ conversationId: officialConvoId, sourceConversationId: conversationId }));
          if (isOfficialSource && conversationId !== officialConvoId) {
            await GTC45Matrix.findOneAndUpdate(
              { conversationId: officialConvoId },
              {
                $set: {
                  matrixRows: session.matrixRows,
                  updatedAt: new Date(),
                },
              }
            );
            console.log(`[MatrizIPEVAR Tool] Borrado sincronizado en paralelo con la Matriz Oficial ("${officialConvoId}")`);
          }
        }
        
        return JSON.stringify({
          mensaje: `Se eliminaron exitosamente ${deletedCount} riesgos de la base de datos.`,
          totalRegistrosRestantes: session.matrixRows.length
        });
      }

      // LOGICA DE ESCRITURA
      if (!riesgos || !Array.isArray(riesgos)) {
        return JSON.stringify({ error: "El objeto debe contener un array 'riesgos' para escribir." });
      }

      console.log(`[MatrizIPEVAR Tool] Procesando ${riesgos.length} riesgos para convo: ${conversationId}`);
      
      if (!session) {
        session = new GTC45Matrix({
          conversationId,
          user: userId || undefined,
          companyId: companyId || undefined,
          matrixRows: []
        });
      }

      let insertedCount = 0;
      let updatedCount = 0;

      const snapVal = (v, allowed, fb) => {
        const n = Number(v);
        if (isNaN(n)) return fb;
        if (allowed.includes(n)) return n;
        return allowed.reduce((prev, curr) => (Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev), fb);
      };

      for (const riesgo of riesgos) {
        // Autocalculate levels per GTC-45
        const nd = snapVal(riesgo.nd, [0, 2, 6, 10], 2);
        const ne = snapVal(riesgo.ne, [1, 2, 3, 4], 2);
        const np = nd * ne;
        const nc = snapVal(riesgo.nc, [10, 25, 60, 100], 25);
        const nr = np * nc;

        let interpretacion_np = 'Bajo (B)';
        if (np >= 24) interpretacion_np = 'Muy Alto (MA)';
        else if (np >= 10) interpretacion_np = 'Alto (A)';
        else if (np >= 6) interpretacion_np = 'Medio (M)';

        let interpretacion_nr = 'IV';
        if (nr >= 600) interpretacion_nr = 'I';
        else if (nr >= 150) interpretacion_nr = 'II';
        else if (nr >= 40) interpretacion_nr = 'III';

        let aceptabilidad = 'Aceptable';
        if (interpretacion_nr === 'I') aceptabilidad = 'No Aceptable';
        else if (interpretacion_nr === 'II') aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
        else if (interpretacion_nr === 'III') aceptabilidad = 'Mejorable';

        const row = {
          cargo: riesgo.cargo || '',
          ...riesgo,
          np,
          interpretacion_np,
          nc,
          nr,
          interpretacion_nr,
          aceptabilidad,
        };

        // Find existing row using a composite key
        const targetIndex = session.matrixRows.findIndex(r => 
          (riesgo.cargo ? r.cargo?.toLowerCase() === riesgo.cargo?.toLowerCase() : true) &&
          r.proceso?.toLowerCase() === riesgo.proceso?.toLowerCase() &&
          r.actividad?.toLowerCase() === riesgo.actividad?.toLowerCase() &&
          r.tareas?.toLowerCase() === riesgo.tareas?.toLowerCase() &&
          r.peligro_clasificacion?.toLowerCase() === riesgo.peligro_clasificacion?.toLowerCase() &&
          r.peligro_descripcion?.toLowerCase() === riesgo.peligro_descripcion?.toLowerCase()
        );

        if (targetIndex !== -1) {
          // UPDATE: proteger campos originales de matrices ya realizadas/importadas (peligro_descripcion, peligro_clasificacion, controles_*, nro_expuestos),
          // pero permitir siempre mejorar efectos_posibles, medidas propuestas y factores_reduccion (Anexo E).
          const prev = session.matrixRows[targetIndex];
          const isValidField = (v) =>
            v !== undefined &&
            v !== null &&
            String(v).trim() !== '' &&
            !['ninguno', 'ninguna', 'no especificado', 'no detallado'].includes(String(v).trim().toLowerCase());

          const mergedRow = { ...prev, ...row };
          if (isValidField(prev.peligro_descripcion)) mergedRow.peligro_descripcion = prev.peligro_descripcion;
          if (isValidField(prev.peligro_clasificacion)) mergedRow.peligro_clasificacion = prev.peligro_clasificacion;
          mergedRow.controles_fuente = isValidField(prev.controles_fuente) ? prev.controles_fuente : 'Ninguno';
          mergedRow.controles_medio = isValidField(prev.controles_medio) ? prev.controles_medio : 'Ninguno';
          mergedRow.controles_individuo = isValidField(prev.controles_individuo) ? prev.controles_individuo : 'Ninguno';
          if (Number(prev.nro_expuestos) > 0) mergedRow.nro_expuestos = Number(prev.nro_expuestos);
          // efectos_posibles siempre se actualiza para mejorarlo si viene en row
          mergedRow.efectos_posibles = row.efectos_posibles || prev.efectos_posibles || '';

          session.matrixRows[targetIndex] = mergedRow;
          updatedCount++;
        } else {
          // INSERT NEW
          // Asegurar IDs únicos por fila
          row.id = Date.now().toString() + Math.random().toString(36).substring(7);
          session.matrixRows.push(row);
          insertedCount++;
        }
      }

      // Ensure user inheritance for orphaned sessions during upsert
      if (!session.user && userId) {
        session.user = userId;
      }
      if (!session.companyId && companyId) {
        session.companyId = companyId;
      }
      
      // Mongoose needs this flag if we modify mixed Arrays manually
      session.markModified('matrixRows');
      await session.save();

      // Clean up temporary session if this is a real conversation
      if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
        const tempId = `temp-${userId}`;
        await GTC45Matrix.deleteOne({ conversationId: tempId, user: userId });
        console.log(`[MatrizIPEVAR Tool] Cleaned up temporary session for user ${userId}`);

        // Sincronización en paralelo con Somos SST (Matriz Oficial)
        const officialConvoId = `official-${companyId || userId}`;
        const isOfficialSource = session.isOfficial || (await GTC45Matrix.exists({ conversationId: officialConvoId, sourceConversationId: conversationId }));
        if (isOfficialSource && conversationId !== officialConvoId) {
          await GTC45Matrix.findOneAndUpdate(
            { conversationId: officialConvoId },
            {
              $set: {
                matrixRows: session.matrixRows,
                updatedAt: new Date(),
              },
            }
          );
          console.log(`[MatrizIPEVAR Tool] Sincronizada en paralelo con la Matriz Oficial ("${officialConvoId}")`);
        }
      }

      console.log(`[MatrizIPEVAR Tool] Transacción Masiva Exitosa. Insertados: ${insertedCount}, Actualizados: ${updatedCount}`);

      return JSON.stringify({
        success: true,
        message: `Operación masiva completada satisfactoriamente. Se procesaron ${riesgos.length} riesgos.`,
        stats: { insertados: insertedCount, actualizados: updatedCount }
      });
    } catch (error) {
      console.error('[MatrizIPEVAR Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error procesando el arreglo de riesgos masivos.',
        details: error.message,
      });
    }
  }
}

module.exports = MatrizIPEVAR;
