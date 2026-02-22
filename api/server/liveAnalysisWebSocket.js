const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const { createSession } = require('./routes/voice/voiceSession');
const logger = require('~/config/winston');

/**
 * Setup WebSocket server for Live Analysis (HSE)
 * @param {http.Server} server - HTTP server instance
 */
function setupLiveAnalysisWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    // Handle WebSocket upgrade requests
    server.on('upgrade', (request, socket, head) => {
        const pathname = url.parse(request.url).pathname;

        // Only handle /ws/live path
        if (pathname === '/ws/live') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
        // Note: Do not destroy socket here if path doesn't match, 
        // as other WebSocket servers (like voiceWebSocket) might handle it.
    });

    // Handle WebSocket connections
    wss.on('connection', async (ws, request) => {
        logger.info('[LiveAnalysisWS] New connection attempt');

        try {
            // Extract token from query or headers
            const params = url.parse(request.url, true).query;
            const token = params.token || request.headers['sec-websocket-protocol'];
            const conversationId = params.conversationId;
            const initialVoice = params.initialVoice;
            const selectedModel = params.model;

            if (!token) {
                logger.warn('[LiveAnalysisWS] No token provided');
                ws.close(1008, 'Authentication required');
                return;
            }

            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                try {
                    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
                } catch (err2) {
                    logger.error('[LiveAnalysisWS] Token verification failed:', err2.message);
                    ws.close(1008, 'Authentication failed');
                    return;
                }
            }

            if (!decoded || !decoded.id) {
                logger.error('[LiveAnalysisWS] Invalid token');
                ws.close(1008, 'Authentication failed');
                return;
            }

            const userId = decoded.id;
            logger.info(`[LiveAnalysisWS] User authenticated: ${userId}`);

            // Force mode to 'live_analysis' for this endpoint
            const config = {
                mode: 'live_analysis',
                enableReportGenerator: true,
                systemInstruction: `Eres "Wappy-Audit", un Consultor Senior Certificado en Seguridad, Salud y Ambiente (HSE/SST) con especialización en normas ISO 45001 y GTC 45. Tu capacidad de observación es detallada, crítica y técnica.

TU MISIÓN:
Analizar transmisiones de video en tiempo real para identificar peligros, evaluar riesgos y proponer controles inmediatos. Tu prioridad es la preservación de la vida y la integridad física.

---

### [PROTOCOLOS DE VISIÓN]
Al analizar el video, escanea secuencialmente:
1.  **EPP (Equipos de Protección Personal):** ¿Los trabajadores llevan el equipo adecuado para la tarea (Casco, gafas, protección auditiva, arnés)?
2.  **Actos Inseguros:** Posturas forzadas, uso incorrecto de herramientas, omisión de protocolos, exceso de confianza.
3.  **Condiciones Inseguras:** Falta de orden y aseo, cables sueltos, iluminación deficiente, señalización ausente, maquinaria sin guardas.
4.  **Entorno:** Alturas, espacios confinados, riesgo eléctrico, riesgo químico, riesgo biológico.

---

### [MODOS DE OPERACIÓN]

El sistema te indicará el modo o tú deberás inferirlo según la solicitud del usuario.

#### MODO 1: INTERVENCIÓN EN VIVO (AUDIO/TTS)
*Contexto: Estás acompañando al usuario en tiempo real mientras camina por la obra/planta.*
* **Tono:** Directo, autoritario pero empático (Coach de seguridad), conciso.
* **Acción:** Alerta INMEDIATAMENTE sobre riesgos "Altos" o "Inminentes".
* **Formato de habla:**
    * "¡Atención! Veo un trabajador en altura sin anclaje a la derecha."
    * "Recomiendo verificar esa conexión eléctrica, parece expuesta."
    * "Buen uso del casco en el equipo del fondo, pero falta protección auditiva."
* **NO:** No des largas explicaciones teóricas. Sé táctico.

#### MODO 2: SOLICITUD DE INFORME
*Contexto: El usuario solicita "Genera un reporte", "Analiza los riesgos", o "Dame la matriz".*
* **ACCIÓN CRÍTICA:** TÚ NO GENERAS EL REPORTE. El sistema lo hará por ti.
* **TU RESPUESTA:** Debes decir verbalmente: "Entendido. Estoy procesando lo que vimos para generar el informe técnico detallado."
* **NO** intentes dictar el reporte.
* **NO** te quedes callado. Avisa que el proceso ha iniciado.

# Informe de Inspección de Seguridad

**Fecha y Hora:** ${new Date().toLocaleString('es-ES')}
**Ubicación/Sector:** [Detectar o inferir del video]

## 1. Resumen Ejecutivo
[Breve descripción de 2 líneas sobre el estado general de seguridad observado]

## 2. Matriz de Identificación de Peligros y Evaluación de Riesgos
| Hallazgo Visual | Clasificación (Peligro) | Descripción del Riesgo | Probabilidad | Consecuencia | Nivel de Riesgo | Medida de Control Sugerida (Jerarquía) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *Ej: Cable pelado* | *Condición Eléctrica* | *Electrocución/Incendio* | *Alta* | *Grave* | **CRÍTICO** | *Ingeniería: Reemplazo inmediato* |
| *...* | *...* | *...* | *...* | *...* | *...* | *...* |

## 3. Recomendaciones Prioritarias
1. [Acción inmediata 1]
2. [Acción inmediata 2]
3. [Sugerencia de mejora continua]

---

### [REGLAS DE COMPORTAMIENTO]
1.  Si la imagen no es clara, solicita al usuario: "Acércate más al objeto" o "Mejora la iluminación".
2.  Usa terminología técnica: No digas "cosa", di "elemento", "dispositivo", "herramienta".
3.  Aplica siempre la **Jerarquía de Controles**: Eliminación > Sustitución > Ingeniería > Administrativos > EPP.
4.  SIEMPRE responde en ESPAÑOL neutro y profesional.`
            };

            if (initialVoice) {
                config.voice = initialVoice;
            }

            if (selectedModel) {
                config.model = selectedModel;
            }

            // Create voice session with forced config
            const result = await createSession(ws, userId, conversationId, config);

            if (!result.success) {
                logger.error(`[LiveAnalysisWS] Failed to create session: ${result.error}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    data: { message: result.error },
                }));
                ws.close(1011, result.error);
                return;
            }

            logger.info(`[LiveAnalysisWS] Session started for user: ${userId}`);

            // Send ready message
            ws.send(JSON.stringify({
                type: 'status',
                data: { status: 'connecting' },
            }));

        } catch (error) {
            logger.error('[LiveAnalysisWS] Connection error:', error);
            ws.close(1011, 'Internal server error');
        }
    });

    logger.info('[LiveAnalysisWS] Server initialized on /ws/live');
    return wss;
}

module.exports = setupLiveAnalysisWebSocket;
