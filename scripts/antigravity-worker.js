/**
 * WAPPY Antigravity Background Worker
 * 
 * Este daemon se ejecuta en la máquina local o servidor y escucha de forma continua
 * las órdenes delegadas desde Tenshi a Antigravity.
 * 
 * Uso:
 *   WAPPY_URL=https://wappy.club WAPPY_API_KEY=wpy_live_... node scripts/antigravity-worker.js
 */

const WAPPY_URL = (process.env.WAPPY_URL || 'https://wappy.club').replace(/\/$/, '');
const WAPPY_API_KEY = process.env.WAPPY_API_KEY;
const INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 5000;

if (!WAPPY_API_KEY) {
  console.log('[Antigravity Worker] ADVERTENCIA: Variable WAPPY_API_KEY no configurada.');
  console.log('[Antigravity Worker] Para escuchar en vivo, ejecuta: WAPPY_API_KEY=wpy_live_... node scripts/antigravity-worker.js');
}

console.log(`[Antigravity Worker] Iniciado en ${WAPPY_URL}. Intervalo de sondeo: ${INTERVAL_MS / 1000}s`);

let isProcessing = false;

async function checkAndProcessOrders() {
  if (isProcessing || !WAPPY_API_KEY) return;
  isProcessing = true;

  try {
    const res = await fetch(`${WAPPY_URL}/api/mcp-bridge/antigravity/ordenes?estado=todo&limit=5`, {
      headers: {
        'Authorization': `Bearer ${WAPPY_API_KEY}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.error('[Antigravity Worker] Error 401: Clave API inválida.');
      }
      return;
    }

    const data = await res.json();
    const ordenes = data.ordenes || [];

    if (ordenes.length > 0) {
      console.log(`[Antigravity Worker] Se detectaron ${ordenes.length} orden(es) pendiente(s). Procesando...`);
      for (const orden of ordenes) {
        console.log(`[Antigravity Worker] Procesando orden: "${orden.titulo}" (ID: ${orden.id})...`);
        // La orden ya se auto-procesa en el servidor o se puede procesar localmente aquí
      }
    }
  } catch (err) {
    // Silencioso ante desconexiones transitorias
  } finally {
    isProcessing = false;
  }
}

if (WAPPY_API_KEY) {
  setInterval(checkAndProcessOrders, INTERVAL_MS);
  checkAndProcessOrders();
}
