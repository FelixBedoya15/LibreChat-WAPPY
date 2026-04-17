const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');

class ConsultarAgenteEspecializado extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'consultar_agente_especializado';
    this.description =
      'Herramienta de enrutamiento: Utiliza esta herramienta SÓLO para delegar una consulta a un Agente Especialista del sistema cuando el usuario hace preguntas o solicitudes técnicas que salen de tu jurisdicción inicial. Debes pasar siempre el nombre exacto del especialista y la instrucción explícita del usuario.';
    this.req = fields.req;

    this.schema = z.object({
      nombre_especialista: z
        .string()
        .describe(
          'El nombre del Agente Especialista en el sistema. Ejemplo: "Médico Laboral" o el especialista más apropiado según tu análisis del texto.',
        ),
      consulta_completa: z
        .string()
        .describe(
          'La consulta íntegra y detallada proporcionada por el usuario original, que el especialista deberá responder.',
        ),
    });
  }

  async _call(input) {
    try {
      const userId = this.req?.user?.id;
      if (!userId) {
        return "❌ Error: Usuario no autenticado para invocar agentes.";
      }

      const { nombre_especialista, consulta_completa } = input;

      const Agent = mongoose.models.Agent;
      if (!Agent) {
        return "❌ Error: No se pudo cargar el modelo de Agentes del sistema central.";
      }

      // Buscar todos los especialistas activos
      const agents = await Agent.find({ is_whatsapp_enabled: true });
      if (!agents || agents.length === 0) {
        return "❌ Error: No hay especialistas disponibles con el permiso de WhatsApp activado.";
      }

      // Funcion de limpieza para comparar (quita tildes, @ por a, minusculas, espacios extra)
      const cleanString = (str) => {
        return (str || '').toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quita tildes
          .replace(/@/g, 'a') // Cambia @ por a (medic@ -> medica)
          .replace(/[^a-z0-9 ]/g, '') // Quita caracteres especiales
          .replace(/\s+/g, ' ').trim();
      };

      const queryStr = cleanString(nombre_especialista);
      let agent = null;

      // 1. Intento de coincidencia exacta mejorada (limpia)
      agent = agents.find((a) => cleanString(a.name) === queryStr);

      // 2. Búsqueda por similitud si el usuario cometió un gran error de tipeo
      if (!agent) {
        const queryWords = queryStr.split(' ').filter((w) => w.length > 2);
        let maxScore = 0;
        
        for (const a of agents) {
          const agName = cleanString(a.name);
          let score = 0;
          
          for (const w of queryWords) {
            if (agName.includes(w)) score++;
          }
          if (agName.includes(queryStr)) score += 5; // Bonus grande si la frase encaja junta
          
          if (score > maxScore && score > 0) {
            maxScore = score;
            agent = a;
          }
        }
      }

      if (!agent) {
        // Enviar al LLM la lista de los válidos para que en su segundo intento lo haga perfecto.
        const validos = agents.map((a) => a.name).join(', ');
        return `❌ No se encontró ningún Agente Especialista que coincida con "${nombre_especialista}".\n💡 SUGERENCIA: Aquí tienes la lista de los únicos especialistas válidos: [${validos}]. Usa esta herramienta de nuevo copiando textualmente uno de estos.`;
      }

      // Generar token JWT derivado del req actual para invocar el endpoint interno
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
        expiresIn: '5m',
      });

      // Crear hilo o convo efímera
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(`whatsapp-specialist-${agent._id.toString()}-${userId}`);
      const conversationId = hash.digest('hex').substring(0, 24);

      console.log(`[RouterTool] Derivando consulta a: ${agent.name}`);

      const payload = {
        convoId: conversationId,
        text: consulta_completa,
        endpointOption: {
          endpoint: 'agents',
          agent_id: agent._id.toString(),
        },
        ephemeralAgent: {
          // Si el especialista tiene sus propias herramientas (ej. "somos_sst"), se usarán.
          tools: agent.tools || [],
        }
      };

      const response = await fetch('http://localhost:3080/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return `❌ Error interno conectando con el especialista ${agent.name} (HTTP ${response.status}).`;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let finalResponseText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (let line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.final && dataObj.responseMessage?.text) {
                 finalResponseText = dataObj.responseMessage.text;
              } else if (!finalResponseText && dataObj.text) {
                 finalResponseText = dataObj.text;
              }
            } catch (e) {
              // Ignore stream partial parsing errors
            }
          }
        }
      }

      if (finalResponseText) {
        return `✅ [Respuesta de Especialista ${agent.name}]:\n${finalResponseText}`;
      } else {
        return `❌ El especialista ${agent.name} procesó la solicitud pero no generó respuesta legible.`;
      }

    } catch (error) {
      console.error('[ConsultarAgenteEspecializado Tool] Error:', error);
      return `❌ Hubo un error de orquestación al contactar al especialista: ${error.message}`;
    }
  }
}

module.exports = ConsultarAgenteEspecializado;
