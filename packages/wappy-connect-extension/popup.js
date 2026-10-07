/**
 * WAPPY Connect - Google NotebookLM Sync
 * Manifest V3 Extension Script
 */

// Elementos del DOM
const googleStatusEl = document.getElementById('google-status');
const googleDetailsEl = document.getElementById('google-details');
const loginCtaEl = document.getElementById('login-cta');
const btnOpenNotebook = document.getElementById('btn-open-notebook');
const wappyUrlInput = document.getElementById('wappy-url');
const urlProdBtn = document.getElementById('url-prod');
const urlLocalBtn = document.getElementById('url-local');
const alertBox = document.getElementById('alert-box');
const alertIcon = document.getElementById('alert-icon');
const alertText = document.getElementById('alert-text');
const btnSync = document.getElementById('btn-sync');
const btnSyncIcon = document.getElementById('btn-sync-icon');
const btnSyncText = document.getElementById('btn-sync-text');
const btnCopy = document.getElementById('btn-copy');
const btnTest = document.getElementById('btn-test');

let detectedCookies = [];

/**
 * Muestra alertas visuales dinámicas
 */
function showAlert(message, type = 'info') {
  alertBox.className = `alert ${type}`;
  alertText.textContent = message;

  if (type === 'success') {
    alertIcon.textContent = '✅';
  } else if (type === 'error') {
    alertIcon.textContent = '❌';
  } else if (type === 'warning') {
    alertIcon.textContent = '⚠️';
  } else {
    alertIcon.textContent = 'ℹ️';
  }
}

function hideAlert() {
  alertBox.className = 'alert';
}

/**
 * Guarda y restaura URL de WAPPY
 */
async function initServerUrl() {
  const stored = await chrome.storage.local.get('wappy_server_url');
  if (stored && stored.wappy_server_url) {
    wappyUrlInput.value = stored.wappy_server_url;
  }
}

async function saveServerUrl(url) {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  wappyUrlInput.value = cleanUrl;
  await chrome.storage.local.set({ wappy_server_url: cleanUrl });
  return cleanUrl;
}

/**
 * Extrae las cookies críticas de Google para NotebookLM
 */
async function fetchGoogleCookies() {
  try {
    googleStatusEl.className = 'status-badge checking';
    googleStatusEl.innerHTML = '<span class="dot"></span> Verificando...';

    // Consultar cookies de .google.com y notebooklm.google.com
    const [domainCookies, urlCookies] = await Promise.all([
      chrome.cookies.getAll({ domain: 'google.com' }),
      chrome.cookies.getAll({ url: 'https://notebooklm.google.com' }),
    ]);

    const allRaw = [...(domainCookies || []), ...(urlCookies || [])];
    const cookieMap = new Map();

    // Filtro de cookies esenciales para autenticación de Google
    const targetNames = new Set([
      '__Secure-1PSID',
      '__Secure-1PSIDTS',
      '__Secure-3PSID',
      '__Secure-3PSIDTS',
      'SID',
      'HSID',
      'SSID',
      'APISID',
      'SAPISID',
      'NID',
      'SNID',
    ]);

    for (const c of allRaw) {
      if (targetNames.has(c.name)) {
        let sameSite = c.sameSite || 'Lax';
        if (sameSite === 'no_restriction' || sameSite === 'unspecified') {
          sameSite = 'Lax';
        }
        cookieMap.set(c.name, {
          name: c.name,
          value: c.value,
          domain: c.domain || '.google.com',
          path: c.path || '/',
          secure: Boolean(c.secure),
          httpOnly: Boolean(c.httpOnly),
          sameSite: sameSite.charAt(0).toUpperCase() + sameSite.slice(1).toLowerCase(),
        });
      }
    }

    const filtered = Array.from(cookieMap.values());
    detectedCookies = filtered;

    const hasPsid = cookieMap.has('__Secure-1PSID');
    const hasSid = cookieMap.has('SID');
    const hasPsidts = cookieMap.has('__Secure-1PSIDTS');

    if ((hasPsid || hasPsidts) && hasSid) {
      googleStatusEl.className = 'status-badge connected';
      googleStatusEl.innerHTML = '<span class="dot"></span> Conectado';

      googleDetailsEl.innerHTML = `
        <span>✓ <strong>${filtered.length} cookies</strong> listas para sincronizar.</span>
        <div>
          <span class="cookie-tag">SID</span>
          <span class="cookie-tag">__Secure-1PSID</span>
          ${hasPsidts ? '<span class="cookie-tag">1PSIDTS</span>' : ''}
        </div>
      `;

      loginCtaEl.style.display = 'none';
      btnSync.disabled = false;
      btnCopy.disabled = false;
      btnTest.disabled = false;
    } else {
      googleStatusEl.className = 'status-badge disconnected';
      googleStatusEl.innerHTML = '<span class="dot"></span> No detectado';

      googleDetailsEl.innerHTML = `
        <span>No se encontraron las cookies de sesión de Google requeridas.</span>
      `;

      loginCtaEl.style.display = 'block';
      btnSync.disabled = true;
      btnCopy.disabled = true;
      btnTest.disabled = true;
    }
  } catch (err) {
    console.error('Error obteniendo cookies:', err);
    googleStatusEl.className = 'status-badge disconnected';
    googleStatusEl.innerHTML = '<span class="dot"></span> Error';
    googleDetailsEl.textContent = 'Error al leer cookies del navegador: ' + err.message;
  }
}

/**
 * Obtiene el token de autenticación del usuario en WAPPY
 */
async function getWappyAuthToken(baseUrl) {
  try {
    // Intentar obtener JWT renovado vía endpoint de refresh
    const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data && data.token) {
        return { token: data.token, user: data.user };
      }
    }
  } catch (e) {
    console.warn('Refresh endpoint check failed:', e);
  }

  // Fallback: Si el usuario tiene una pestaña abierta de WAPPY, consultar su token
  try {
    const tabs = await chrome.tabs.query({ url: [`${baseUrl}/*`] });
    if (tabs && tabs.length > 0) {
      const activeTab = tabs[0];
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          // Intentar obtener token de localStorage o cookie de sesión
          try {
            return window.localStorage.getItem('token') || null;
          } catch (e) {
            return null;
          }
        },
      });

      if (results && results[0] && results[0].result) {
        return { token: results[0].result };
      }
    }
  } catch (e) {
    console.warn('Tab script query fallback error:', e);
  }

  return null;
}

/**
 * Acción: Vincular con WAPPY en 1 Clic
 */
async function handleSyncWithWappy() {
  if (detectedCookies.length === 0) {
    showAlert('No hay cookies para sincronizar.', 'warning');
    return;
  }

  const baseUrl = await saveServerUrl(wappyUrlInput.value);

  // Animación de carga
  btnSync.disabled = true;
  btnSyncIcon.innerHTML = '<span class="spinner"></span>';
  btnSyncText.textContent = 'Vinculando con WAPPY...';
  hideAlert();

  try {
    // 1. Obtener token de WAPPY
    const auth = await getWappyAuthToken(baseUrl);

    if (!auth || !auth.token) {
      showAlert(
        `No has iniciado sesión en WAPPY (${baseUrl}). Abre WAPPY en una pestaña, inicia sesión y vuelve a hacer clic en Vincular. O usa "Copiar Clave JSON" para pegarla manualmente.`,
        'warning'
      );
      return;
    }

    // 2. Enviar cookies al backend de WAPPY
    const response = await fetch(`${baseUrl}/api/notebooklm/session`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        cookies: detectedCookies,
        source: 'extension',
        email: auth.user?.email || '',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showAlert(
        '¡Sesión vinculada con éxito en WAPPY! Tus agentes de IA ya tienen acceso a tus cuadernos de NotebookLM.',
        'success'
      );
      btnSyncText.textContent = '✓ ¡Vinculado con Éxito!';
      setTimeout(() => {
        btnSyncText.textContent = 'Vincular con WAPPY en 1 Clic';
      }, 4000);
    } else {
      const errMsg = data.error || data.message || 'Error al guardar la sesión en el servidor.';
      showAlert(`Error en WAPPY: ${errMsg}`, 'error');
    }
  } catch (err) {
    console.error('Error sincronizando:', err);
    showAlert(`Error de conexión con ${baseUrl}: ${err.message}`, 'error');
  } finally {
    btnSync.disabled = false;
    btnSyncIcon.textContent = '🚀';
  }
}

/**
 * Acción: Copiar Clave JSON
 */
async function handleCopyJson() {
  if (detectedCookies.length === 0) {
    showAlert('No hay cookies detectadas para copiar.', 'warning');
    return;
  }

  try {
    const payload = JSON.stringify({ cookies: detectedCookies }, null, 2);
    await navigator.clipboard.writeText(payload);
    showAlert('¡Copiado al portapapeles! Ve a WAPPY -> Ajustes -> Cuenta -> NotebookLM y pega la clave.', 'success');

    const originalText = btnCopy.innerHTML;
    btnCopy.innerHTML = '<span>✓</span><span>¡Copiado!</span>';
    setTimeout(() => {
      btnCopy.innerHTML = originalText;
    }, 2500);
  } catch (err) {
    console.error('Error al copiar:', err);
    showAlert('No se pudo copiar automáticamente: ' + err.message, 'error');
  }
}

/**
 * Acción: Probar Sesión con Google
 */
async function handleTestSession() {
  if (detectedCookies.length === 0) {
    showAlert('No hay cookies para probar.', 'warning');
    return;
  }

  btnTest.disabled = true;
  showAlert('Comprobando respuesta de Google NotebookLM...', 'info');

  try {
    const baseUrl = await saveServerUrl(wappyUrlInput.value);
    const auth = await getWappyAuthToken(baseUrl);

    if (auth && auth.token) {
      const res = await fetch(`${baseUrl}/api/notebooklm/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('✓ ¡Sesión activa y verificada exitosamente!', 'success');
      } else {
        showAlert(`Advertencia: ${data.reason || data.message || 'Google rechazó la sesión.'}`, 'warning');
      }
    } else {
      // Si no hay token de WAPPY, comprobamos que tengamos las cookies requeridas
      const hasPsid = detectedCookies.some((c) => c.name === '__Secure-1PSID');
      const hasSid = detectedCookies.some((c) => c.name === 'SID');
      if (hasPsid && hasSid) {
        showAlert('✓ Las cookies críticas de Google (__Secure-1PSID y SID) están presentes en el navegador.', 'success');
      } else {
        showAlert('Faltan credenciales indispensables en el navegador.', 'warning');
      }
    }
  } catch (err) {
    showAlert('Error al verificar: ' + err.message, 'error');
  } finally {
    btnTest.disabled = false;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  await initServerUrl();
  await fetchGoogleCookies();

  btnSync.addEventListener('click', handleSyncWithWappy);
  btnCopy.addEventListener('click', handleCopyJson);
  btnTest.addEventListener('click', handleTestSession);

  btnOpenNotebook.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://notebooklm.google.com' });
  });

  urlProdBtn.addEventListener('click', () => {
    saveServerUrl('https://wappy.club');
  });

  urlLocalBtn.addEventListener('click', () => {
    saveServerUrl('http://localhost:3080');
  });

  wappyUrlInput.addEventListener('change', () => {
    saveServerUrl(wappyUrlInput.value);
  });
});
