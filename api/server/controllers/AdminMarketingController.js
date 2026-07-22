const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const sendEmail = require('~/server/utils/sendEmail');
const { logger } = require('@librechat/data-schemas');
const { getUserKey } = require('~/server/services/UserService');

const THEMES = {
  slate: {
    primaryColor: '#38bdf8', // sky-400
    accentBg: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    buttonShadow: 'rgba(59, 130, 246, 0.4)',
  },
  emerald: {
    primaryColor: '#34d399', // emerald-400
    accentBg: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #059669 100%)',
    buttonBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    buttonShadow: 'rgba(16, 185, 129, 0.4)',
  },
  indigo: {
    primaryColor: '#818cf8', // indigo-400
    accentBg: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #4f46e5 100%)',
    buttonBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    buttonShadow: 'rgba(99, 102, 241, 0.4)',
  },
  amber: {
    primaryColor: '#fbbf24', // amber-400
    accentBg: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #d97706 100%)',
    buttonBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    buttonShadow: 'rgba(245, 158, 11, 0.4)',
  }
};

const getSystemGoogleKey = async () => {
  const envKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (envKey && envKey !== 'user_provided') {
    return envKey.split(',')[0].trim();
  }

  // Fallback: look up the ADMIN's google API key in the database
  try {
    const User = mongoose.model('User');
    const adminUser = await User.findOne({ role: 'ADMIN' });
    if (adminUser) {
      const stored = await getUserKey({ userId: adminUser._id, name: 'google' });
      if (stored && stored !== 'user_provided') {
        let keyStr = stored;
        try {
          const parsed = JSON.parse(stored);
          keyStr = parsed.GOOGLE_API_KEY || parsed.GOOGLE_KEY || Object.values(parsed)[0];
        } catch {
          // not JSON
        }
        if (keyStr) {
          return keyStr.split(',')[0].trim();
        }
      }
    }
  } catch (err) {
    logger.warn('[AdminMarketingController] Fallback ADMIN key search failed:', err.message);
  }

  return null;
};

const generateMarketingEmail = async (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'El prompt/instrucción es requerido.' });
  }

  try {
    const apiKey = await getSystemGoogleKey();
    if (!apiKey) {
      return res.status(400).json({ message: 'No hay claves API de Google configuradas en el servidor.' });
    }

    // Load dynamic knowledge: Wappy platform description and user manual (same as Tenshi)
    let wappyDescription = '';
    try {
      const descPath = path.resolve(__dirname, '../../../Agentes/marketin/descripcion_plataforma_WAPPY.md');
      if (fs.existsSync(descPath)) {
        wappyDescription = fs.readFileSync(descPath, 'utf8');
      }
    } catch (err) {
      logger.warn('[AdminMarketingController] No se pudo leer descripcion_plataforma_WAPPY.md:', err.message);
    }

    let userManual = '';
    try {
      const manualPath = path.resolve(__dirname, '../../../client/public/manual_usuario.md');
      if (fs.existsSync(manualPath)) {
        userManual = fs.readFileSync(manualPath, 'utf8');
      } else {
        const fallbackPath = path.resolve(__dirname, '../manual_wappy.md');
        if (fs.existsSync(fallbackPath)) {
          userManual = fs.readFileSync(fallbackPath, 'utf8');
        }
      }
    } catch (err) {
      logger.warn('[AdminMarketingController] No se pudo leer el manual de usuario:', err.message);
    }

    // Limit manual context to save tokens if needed (similar to Tenshi)
    if (userManual && userManual.length > 4000) {
      userManual = userManual.substring(0, 4000) + '\n...(manual truncado para eficiencia)...';
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const chosenModel = model || 'gemini-3.1-flash-lite';
    const modelInstance = genAI.getGenerativeModel({
      model: chosenModel,
      systemInstruction: `Eres un redactor de marketing profesional experto. Generarás correos persuasivos, limpios y muy bonitos.
Tu tarea es retornar una respuesta estructurada en formato JSON válido con las claves "subject" y "bodyHtml".
El "bodyHtml" debe estar escrito en español y contener etiquetas HTML seguras (como <p>, <strong>, <ul>, <li>, <br>, <h2>) para estructurar el correo de manera atractiva. NO incluyas las etiquetas <html>, <head> ni <body>, solo el contenido del cuerpo.
No uses markdown adicional fuera de las etiquetas HTML and el JSON. Asegúrate de que el JSON sea válido y sin caracteres de control extraños.

=== REGLAS CRÍTICAS COMERCIALES (Alineado con wappy.club/portafolio) ===
- Los únicos planes comerciales ACTIVOS y vigentes que se ofrecen actualmente son:
  * **Wappy Vital** (Acceso de Por Vida / Lifetime Access): Ideal para consultores independientes que inician. Incluye 20 chats activos, 15+ Agentes Expertos, Skill de Canvas, Skill Editor RIT y Matriz IPEVAR GTC-45, y videollamadas con el Agente Biomecánico.
  * **Wappy Pro** (Suscripción Anual): Para asesores avanzados y empresas. Incluye todo lo de Vital, chats 100% ilimitados, la suite **Somos SST completa (todos los hitos activos)**, termómetro psicosocial y creación/personalización de agentes propios.
- **PROHIBIDO:** Los planes 'Plus', 'Go', 'Gratis' y otras modalidades de suscripciones mensuales están **desactivados** comercialmente y **NUNCA** deben mencionarse en tus redacciones.
- **CONCISIÓN Y ENFOQUE:** No abrumes al lector listando todas las herramientas y tecnicismos de la plataforma a menos que sea estrictamente necesario. Mantén los correos cortos, directos al grano, muy persuasivos y limpios. Enfócate en el beneficio del tema que solicita el usuario administrador.

A continuación, tienes la base de conocimientos de apoyo sobre la plataforma WAPPY IA y su funcionamiento:

=== INFORMACIÓN Y PRECIOS DE WAPPY IA ===
${wappyDescription || 'Wappy es una plataforma de IA especializada en SST.'}

=== MANUAL DE FUNCIONAMIENTO ===
${userManual || ''}`,
    });

    const promptText = `Escribe un correo de mercadeo según las siguientes instrucciones: "${prompt}"`;
    const result = await modelInstance.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    res.status(200).json(parsedData);
  } catch (error) {
    logger.error('[generateMarketingEmail] Error generating content with Gemini:', error);
    res.status(500).json({ message: `Error al generar contenido con la IA: ${error.message}` });
  }
};

const sendMarketingEmail = async (req, res) => {
  const { subject, bodyHtml, buttonText, buttonUrl, theme, testEmail, targetRole = 'USER' } = req.body;

  if (!subject || !bodyHtml) {
    return res.status(400).json({ message: 'El asunto y el cuerpo del correo son requeridos.' });
  }

  const themeConfig = THEMES[theme] || THEMES.slate;
  const year = new Date().getFullYear();
  const User = mongoose.model('User');

  try {
    // If a test email is provided, send to that address only
    if (testEmail) {
      const testUser = await User.findOne({ email: testEmail }).lean() || { name: 'Admin de Pruebas', email: testEmail };
      await sendEmail({
        email: testEmail,
        subject: subject,
        template: 'marketingEmail.handlebars',
        payload: {
          name: testUser.name || 'Usuario',
          title: subject,
          body: bodyHtml,
          buttonText: buttonText || 'Ver más',
          buttonUrl: buttonUrl || '',
          year,
          ...themeConfig,
        }
      });
      return res.status(200).json({ message: `Correo de prueba enviado con éxito a ${testEmail}.` });
    }

    // Bulk sending to role target (e.g. USER / Guest plan)
    const users = await User.find({ role: targetRole, email: { $exists: true, $ne: '' } }, 'name email').lean();

    if (users.length === 0) {
      return res.status(400).json({ message: `No se encontraron usuarios activos con el rol "${targetRole}".` });
    }

    // Run send loop in background to prevent client timeout
    (async () => {
      logger.info(`[Marketing Email] Iniciando envío masivo de "${subject}" a ${users.length} usuarios con rol ${targetRole}.`);
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        try {
          await sendEmail({
            email: user.email,
            subject: subject,
            template: 'marketingEmail.handlebars',
            payload: {
              name: user.name || 'Usuario',
              title: subject,
              body: bodyHtml,
              buttonText: buttonText || 'Ver más',
              buttonUrl: buttonUrl || '',
              year,
              ...themeConfig,
            }
          });
          // Rate-limiting to prevent SMTP block or spam classification (250ms gap)
          await new Promise(resolve => setTimeout(resolve, 250));
        } catch (err) {
          logger.error(`[Marketing Email] Error al enviar a ${user.email}:`, err);
        }
      }

      logger.info(`[Marketing Email] Envío masivo completado de forma exitosa.`);
    })();

    res.status(200).json({
      message: `El envío masivo a ${users.length} usuarios se ha iniciado exitosamente en segundo plano.`,
      count: users.length
    });
  } catch (error) {
    logger.error('[sendMarketingEmail] Error sending email:', error);
    res.status(500).json({ message: `Error al enviar correos: ${error.message}` });
  }
};

module.exports = {
  generateMarketingEmail,
  sendMarketingEmail,
};
