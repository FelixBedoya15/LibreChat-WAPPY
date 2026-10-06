const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { ContentTypes, EImageOutputType } = require('librechat-data-provider');
const paths = require('~/config/paths');

const displayMessage =
  'La imagen técnica de Seguridad y Salud en el Trabajo ha sido generada exitosamente y está visible para el usuario.';

class GenerarImagenSST extends Tool {
  constructor(fields = {}) {
    super();

    this.userId = fields.userId;
    this.req = fields.req;
    this.isAgent = fields.isAgent ?? true;
    this.imageOutputType = fields.imageOutputType || EImageOutputType.PNG;

    this.name = 'generar_imagen_sst';
    this.description =
      'Genera imágenes e ilustraciones fotorrealistas de alta calidad para Seguridad y Salud en el Trabajo (SG-SST): escenas de campo, trabajadores con EPP adecuado (casco, gafas, arnés, botas), inspecciones, señalización preventiva, simulacros de emergencia, actos y condiciones seguras.';

    this.schema = z.object({
      prompt: z
        .string()
        .describe(
          'Descripción detallada de la escena u objeto de seguridad a generar (en español o inglés).',
        ),
      aspecto: z
        .enum(['cuadrada', 'horizontal', 'vertical'])
        .optional()
        .default('cuadrada')
        .describe('Relación de aspecto: cuadrada (1:1), horizontal (16:9), vertical (9:16).'),
      estilo: z
        .enum(['fotorrealista', 'ilustracion_tecnica', 'afiche_seguridad'])
        .optional()
        .default('fotorrealista')
        .describe(
          'Estilo visual: fotorrealista (fotografía profesional de alta definición), ilustracion_tecnica (diagrama didáctico), o afiche_seguridad (campaña visual preventiva).',
        ),
    });
  }

  /**
   * Resuelve la clave de API de Google (del usuario, variables de entorno o super admin del sistema)
   */
  async resolveGoogleApiKey() {
    let key = null;

    // 1. Clave guardada por el usuario en base de datos
    if (this.userId) {
      try {
        const { getUserKey } = require('~/server/services/UserService');
        const userKeyData = await getUserKey({ userId: this.userId, name: 'google' });
        if (userKeyData && userKeyData !== 'user_provided') {
          try {
            const parsed = typeof userKeyData === 'string' ? JSON.parse(userKeyData) : userKeyData;
            key = parsed.GOOGLE_API_KEY || parsed.GOOGLE_KEY || Object.values(parsed)[0];
          } catch {
            key = userKeyData;
          }
        }
      } catch (err) {
        logger.debug('[generar_imagen_sst] No user Google key found:', err.message);
      }
    }

    // 2. Clave en variables de entorno del servidor
    if (!key) {
      const envKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (envKey && envKey !== 'user_provided') {
        key = envKey;
      }
    }

    // 3. Clave del Super Administrador del sistema WAPPY
    if (!key) {
      try {
        const { getSystemGoogleKey } = require('~/server/controllers/AdminMarketingController');
        const sysKey = await getSystemGoogleKey();
        if (sysKey) {
          key = sysKey;
        }
      } catch (err) {
        logger.debug('[generar_imagen_sst] Fallback system Google key error:', err.message);
      }
    }

    if (key && typeof key === 'string') {
      key = key.split(',')[0].trim();
    }

    return key;
  }

  /**
   * Optimiza y enriquece el prompt para modelos de difusión visual enfocados en SST
   */
  enhancePrompt(prompt, estilo = 'fotorrealista', aspecto = 'cuadrada') {
    let styleDetails = '';
    if (estilo === 'fotorrealista') {
      styleDetails =
        'cinematic, 8k resolution, photorealistic, professional photography, natural lighting, highly detailed industrial environment, realistic textures, workers properly equipped with certified PPE (hard hat, safety glasses, high visibility vest, safety harness)';
    } else if (estilo === 'ilustracion_tecnica') {
      styleDetails =
        'clean technical illustration, educational occupational safety poster style, crisp vector lines, clear educational safety visual, modern flat design, sharp details';
    } else {
      styleDetails =
        'workplace safety awareness campaign poster, eye-catching visual, clear safety message, high impact graphic design, professional hazard prevention graphic';
    }

    let aspectDetails = '';
    if (aspecto === 'horizontal') {
      aspectDetails = ', wide shot, 16:9 aspect ratio';
    } else if (aspecto === 'vertical') {
      aspectDetails = ', portrait shot, 9:16 aspect ratio';
    } else {
      aspectDetails = ', 1:1 square ratio';
    }

    return `${prompt.trim()}, ${styleDetails}${aspectDetails}`;
  }

  /**
   * Guarda el buffer de la imagen en el directorio estático público del sistema
   */
  async saveImageToDisk(buffer, ext = 'png') {
    const fileId = uuidv4();
    const filename = `sst_${fileId}.${ext}`;
    const outputDir = paths.imageOutput || path.resolve(__dirname, '../../../../client/public/images');

    await fs.promises.mkdir(outputDir, { recursive: true });
    const fullPath = path.join(outputDir, filename);
    await fs.promises.writeFile(fullPath, buffer);

    const publicUrl = `/images/${filename}`;
    return { fileId, filename, fullPath, publicUrl };
  }

  returnValue(val) {
    if (this.isAgent && typeof val === 'string') {
      return [val, {}];
    }
    return val;
  }

  async _call(data) {
    const { prompt, aspecto = 'cuadrada', estilo = 'fotorrealista' } = data;

    if (!prompt) {
      return this.returnValue('Por favor indica una descripción de la escena de seguridad a generar.');
    }

    const enhancedPrompt = this.enhancePrompt(prompt, estilo, aspecto);
    logger.info(`[generar_imagen_sst] Generating image for prompt: "${prompt.slice(0, 60)}..."`);

    let imageBuffer = null;
    let mimeType = 'image/png';
    let generationSource = '';

    // INTENTO 1: Google Gemini Native Image Generation (Nano Banana: gemini-2.5-flash-image)
    try {
      const googleApiKey = await this.resolveGoogleApiKey();
      if (googleApiKey) {
        logger.info('[generar_imagen_sst] Intentando con Google gemini-2.5-flash-image...');
        const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-image:generateContent?key=${googleApiKey}`;
        const requestBody = {
          contents: [
            {
              parts: [{ text: enhancedPrompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        };

        const response = await axios.post(url, requestBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000,
        });

        const candidates = response.data?.candidates;
        if (candidates && candidates.length > 0) {
          const imagePart = candidates[0].content?.parts?.find((part) => part.inlineData);
          if (imagePart?.inlineData?.data) {
            imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
            mimeType = imagePart.inlineData.mimeType || 'image/png';
            generationSource = 'Google Gemini (gemini-2.5-flash-image)';
          }
        }
      }
    } catch (googleError) {
      logger.warn(
        '[generar_imagen_sst] Error en Google gemini-2.5-flash-image:',
        googleError.response?.data?.error?.message || googleError.message,
      );
    }

    // INTENTO 2: Google Imagen 3 (imagen-3.0-generate-002:predict)
    if (!imageBuffer) {
      try {
        const googleApiKey = await this.resolveGoogleApiKey();
        if (googleApiKey) {
          logger.info('[generar_imagen_sst] Intentando con Google Imagen 3 (imagen-3.0-generate-002)...');
          const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${googleApiKey}`;
          const ratioMap = {
            cuadrada: '1:1',
            horizontal: '16:9',
            vertical: '9:16',
          };
          const imagenBody = {
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: ratioMap[aspecto] || '1:1',
            },
          };

          const response = await axios.post(imagenUrl, imagenBody, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 45000,
          });

          const predictions = response.data?.predictions;
          if (predictions && predictions[0]?.bytesBase64Encoded) {
            imageBuffer = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
            mimeType = predictions[0].mimeType || 'image/png';
            generationSource = 'Google Imagen 3';
          }
        }
      } catch (imagenError) {
        logger.warn(
          '[generar_imagen_sst] Error en Google Imagen 3:',
          imagenError.response?.data?.error?.message || imagenError.message,
        );
      }
    }

    // INTENTO 3: OpenAI DALL-E 3 (si hay clave de OpenAI en entorno o usuario)
    if (!imageBuffer) {
      try {
        const openaiKey = process.env.OPENAI_API_KEY !== 'user_provided' ? process.env.OPENAI_API_KEY : null;
        if (openaiKey) {
          logger.info('[generar_imagen_sst] Intentando con OpenAI DALL-E 3...');
          const oaiUrl = 'https://api.openai.com/v1/images/generations';
          const sizeMap = {
            cuadrada: '1024x1024',
            horizontal: '1792x1024',
            vertical: '1024x1792',
          };
          const oaiRes = await axios.post(
            oaiUrl,
            {
              model: 'dall-e-3',
              prompt: enhancedPrompt,
              n: 1,
              size: sizeMap[aspecto] || '1024x1024',
              response_format: 'b64_json',
            },
            {
              headers: {
                Authorization: `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 60000,
            },
          );
          const b64Data = oaiRes.data?.data?.[0]?.b64_json;
          if (b64Data) {
            imageBuffer = Buffer.from(b64Data, 'base64');
            mimeType = 'image/png';
            generationSource = 'OpenAI DALL-E 3';
          }
        }
      } catch (oaiErr) {
        logger.warn('[generar_imagen_sst] Error en OpenAI DALL-E 3:', oaiErr.message);
      }
    }

    // Si ningún proveedor pudo generar la imagen
    if (!imageBuffer) {
      return this.returnValue(
        `No fue posible generar la imagen técnica en este momento debido a saturación o indisponibilidad en los servicios de generación visual. Por favor intenta reformular tu solicitud o prueba de nuevo en unos minutos.`,
      );
    }

    // Guardar imagen en disco estático para servirla inmediatamente vía HTTP /images/...
    try {
      const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
      const { fileId, publicUrl } = await this.saveImageToDisk(imageBuffer, ext);
      const base64String = imageBuffer.toString('base64');

      logger.info(
        `[generar_imagen_sst] Imagen guardada con éxito en ${publicUrl} (${generationSource}, ${imageBuffer.length} bytes)`,
      );

      const responseMarkdown = `### 🎨 Escena de Seguridad y Salud en el Trabajo Generada
![${prompt.slice(0, 100)}](${publicUrl})

* **Detalle:** ${prompt}
* **Motor visual:** ${generationSource}
* **Ubicación local:** \`${publicUrl}\`

${displayMessage}`;

      if (this.isAgent) {
        const content = [
          {
            type: ContentTypes.IMAGE_URL,
            image_url: {
              url: `data:${mimeType};base64,${base64String}`,
            },
          },
        ];

        const responseMsg = [
          {
            type: ContentTypes.TEXT,
            text: responseMarkdown,
          },
        ];

        return [responseMsg, { content, file_ids: [fileId] }];
      }

      return responseMarkdown;
    } catch (saveError) {
      logger.error('[generar_imagen_sst] Error guardando archivo de imagen:', saveError);
      return this.returnValue(`Error procesando la imagen generada: ${saveError.message}`);
    }
  }
}

module.exports = GenerarImagenSST;
