const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function getAgentResponse(user, agentId, text, conversationId) {
  // Sign a short-lived token to represent this user on the LibreChat API
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });

  const payload = {
    convoId: conversationId || 'new',
    text,
    endpointOption: {
      endpoint: 'agents',
      agent_id: agentId,
    },
    // Adding the specific tools override to ensure SomosSST runs from WhatsApp
    ephemeralAgent: {
      tools: ['somos_sst'],
    }
  };

  try {
    // Dynamic import for fetch if needed or use native node fetch (Node 18+)
    const response = await fetch('http://localhost:3080/api/agents/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[WhatsApp Bridge] HTTP Error:', response.status, await response.text());
      return { text: "Error interno intentando comunicar con mi cerebro. Verifica los logs del servidor.", error: true };
    }

    // LibreChat sends SSE chunks. We need to parse them to get the final text.
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
              // Ignore parse errors for intermediate SSE chunks
            }
          }
        }
      }

      return { text: finalResponseText || "No pude generar una respuesta clara.", error: false };

  } catch (error) {
    console.error('[WhatsApp Bridge] Fetch Error:', error);
    return { text: "Error de red intentando contactar a tu Asistente. Vuelve a intentar más tarde.", error: true };
  }
}

async function initializeWhatsAppBridge() {
  console.log('[WhatsApp Bridge] Script cargado, esperando conexión Mongoose...');
  
  if (mongoose.connection.readyState !== 1) {
    // Si mongoose aúon no está listo, esperamos 5 segundos para montarlo
    setTimeout(initializeWhatsAppBridge, 5000);
    return;
  }
  
  console.log('[WhatsApp Bridge] Mongoose conectado, levantando cliente Puppeteer WhatsApp...');

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    console.log('\n=============================================');
    console.log('🤖 ESCANEA ESTE CÓDIGO QR EN TU WHATSAPP 🤖');
    console.log('=============================================');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('[WhatsApp Bridge] ✅ Conectado exitosamente y listo para procesar mensajes.');
  });

  client.on('message', async (msg) => {
    // Only accept chat messages
    if (msg.from === 'status@broadcast' || msg.isGroupPanel || msg.from.includes('@g.us')) return;

    try {
      const phoneNumber = msg.from.split('@')[0];
      
      const User = mongoose.connection.collection('users');
      // Busca un usuario por teléfono aproximado
      let user = await User.findOne({ phone: new RegExp(phoneNumber, 'i') });

      // Fallback a Felix/Admin
      if (!user) {
        user = await User.findOne({ role: 'ADMIN' });
      }

      if (!user) {
        msg.reply('❌ No tienes un perfil de usuario asignado en la plataforma para hablar con este agente.');
        return;
      }

      // Identify Agent (Medico Laboral)
      const Agent = mongoose.connection.collection('agents');
      const agent = await Agent.findOne({ name: /Médico Laboral/i });
      if (!agent) {
         msg.reply('❌ No pude encontrar al "Médico Laboral" configurado en el sistema.');
         return;
      }
      
      console.log(`[WhatsApp Bridge] Procesando mensaje de: ${phoneNumber} como Administrador/Usuario`);

      // Generar Conversation ID predecible para el contexto
      const hash = crypto.createHash('sha256');
      hash.update(`whatsapp-${user._id}-${agent._id}`);
      // Object ID style 24 hex characters
      const conversationId = hash.digest('hex').substring(0, 24);

      // Indicate typing status
      const chat = await msg.getChat();
      chat.sendStateTyping();

      // Get LibreChat Response natively
      const response = await getAgentResponse(user, agent.id || agent._id.toString(), msg.body, conversationId);

      // Reply back to WhatsApp
      await msg.reply(response.text);

    } catch (error) {
      console.error('[WhatsApp Bridge] Error on message processing:', error);
    }
  });

  client.initialize();
}

module.exports = { initializeWhatsAppBridge };
