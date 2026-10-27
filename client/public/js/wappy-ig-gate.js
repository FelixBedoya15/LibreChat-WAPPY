/**
 * WAPPY APPs — Muro de Desbloqueo Obligatorio por Instagram (@wappy_ia + OpenReply)
 * Regla Opción 1: Todos los usuarios (registrados y visitantes) que ingresen a cualquier
 * aplicativo de WAPPY Apps (/matrizipvr, /wappystudio y futuros) deben seguir a @wappy_ia.
 * Se omite únicamente si el archivo se abre en protocolo local file:// (aplicativo descargable comprado).
 */
(function initWappyInstagramFollowGate() {
  if (typeof window === 'undefined' || window.location.protocol === 'file:') {
    return;
  }

  const STORAGE_PASS_KEY = 'wappy_ig_follow_pass_v2';
  const STORAGE_USER_KEY = 'wappy_ig_follow_username';
  const STORAGE_CODE_KEY = 'wappy_ig_gate_code_v2';

  function getOrCreateGateCode() {
    try {
      const existing = localStorage.getItem(STORAGE_CODE_KEY);
      if (existing && /^WAPPY-\d{4}$/.test(existing)) {
        return existing;
      }
      const code = 'WAPPY-' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem(STORAGE_CODE_KEY, code);
      return code;
    } catch (e) {
      return 'WAPPY-' + Math.floor(1000 + Math.random() * 9000);
    }
  }

  function savePass(passToken, username) {
    try {
      localStorage.setItem(STORAGE_PASS_KEY, passToken);
      if (username) {
        localStorage.setItem(STORAGE_USER_KEY, username);
      }
      document.cookie =
        'wappy_ig_follow_pass_v2=' +
        encodeURIComponent(passToken) +
        '; path=/; max-age=31536000; SameSite=Lax';
    } catch (e) {}
  }

  function getStoredPass() {
    try {
      return localStorage.getItem(STORAGE_PASS_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  let pollTimer = null;

  function removeGateModal() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    const existing = document.getElementById('wappyIgFollowGateOverlay');
    if (existing) {
      existing.remove();
    }
    document.body.style.overflow = '';
  }

  function renderGateModal() {
    if (document.getElementById('wappyIgFollowGateOverlay')) return;
    const gateCode = getOrCreateGateCode();
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'wappyIgFollowGateOverlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px;overflow-y:auto;background:rgba(2,6,23,0.78);backdrop-filter:blur(8px);font-family:Inter,Plus Jakarta Sans,system-ui,sans-serif;';

    overlay.innerHTML = `
      <div style="margin:auto;width:100%;max-width:440px;max-height:92dvh;overflow-y:auto;border-radius:16px;background:#ffffff;color:#0f172a;border:1px solid rgba(148,163,184,0.35);box-shadow:0 22px 50px -12px rgba(0,0,0,0.5);">
        <div style="height:6px;width:100%;background:linear-gradient(90deg,#f09433 0%,#dc2743 50%,#c7f303 100%);"></div>
        <div style="padding:16px 18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:10px;background:rgba(217,70,239,0.1);border:1px solid rgba(217,70,239,0.3);color:#a21caf;font-size:11px;font-weight:800;">
              🔒 COMUNIDAD @WAPPY_IA
            </span>
            <a href="/portal?view=apps" style="text-decoration:none;padding:5px 10px;border-radius:10px;background:rgba(100,116,139,0.1);border:1px solid rgba(148,163,184,0.4);color:#475569;font-size:11px;font-weight:700;">
              ← Volver
            </a>
          </div>

          <h2 style="margin:10px 0 4px;font-size:17px;line-height:1.25;font-weight:900;color:#0f172a;">
            Síguenos en <span style="color:#c026d3;">@wappy_ia</span> para abrir <span style="color:#0f766e;">WAPPY Apps</span>
          </h2>

          <p style="margin:0;font-size:12px;color:#475569;">
            Completa estos 2 pasos para desbloquear el acceso gratuito:
          </p>

          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">
            <!-- Paso 1 -->
            <div style="padding:10px 12px;border-radius:12px;background:rgba(217,70,239,0.1);border:1px solid rgba(217,70,239,0.3);">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                  <span style="width:26px;height:26px;flex-shrink:0;border-radius:8px;background:rgba(217,70,239,0.2);border:1px solid rgba(217,70,239,0.4);color:#86198f;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;">1</span>
                  <div style="min-width:0;">
                    <div style="font-size:13px;font-weight:800;color:#0f172a;">Seguir a @wappy_ia</div>
                    <div style="font-size:11px;color:#64748b;">Abre el perfil y pulsa "Seguir"</div>
                  </div>
                </div>
                <a id="btnFollowWappyIg" href="https://www.instagram.com/wappy_ia/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;flex-shrink:0;padding:6px 12px;border-radius:10px;background:#ffffff;border:1px solid rgba(217,70,239,0.35);color:#a21caf;font-size:12px;font-weight:800;">
                  Seguir ↗
                </a>
              </div>
              <div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(217,70,239,0.15);font-size:10.5px;line-height:1.35;color:#475569;">
                💡 <b>¿Ya nos seguías?</b> En Instagram toca <b>Siguiendo → Dejar de seguir</b>, espera 2 seg y vuelve a pulsar <b>Seguir</b> para registrar tu alta en vivo.
              </div>
            </div>

            <!-- Paso 2 con código integrado -->
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                <span style="width:26px;height:26px;flex-shrink:0;border-radius:8px;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);color:#065f46;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;">2</span>
                <div style="min-width:0;">
                  <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
                    <span style="font-size:13px;font-weight:800;color:#0f172a;">Enviar código:</span>
                    <button type="button" id="btnCopyWappyIgCode" title="Copiar código" style="cursor:pointer;padding:2px 8px;border-radius:7px;background:#ffffff;border:1px solid rgba(20,184,166,0.4);color:#0f766e;font-family:monospace;font-size:12px;font-weight:900;">
                      ${gateCode} 📋
                    </button>
                  </div>
                  <div id="wappyIgCopyHint" style="font-size:11px;color:#64748b;">Se copia solo al abrir el DM</div>
                </div>
              </div>
              <button type="button" id="btnSendDmWappyIg" style="cursor:pointer;flex-shrink:0;padding:6px 12px;border-radius:10px;background:#ffffff;border:1px solid rgba(16,185,129,0.35);color:#047857;font-size:12px;font-weight:800;">
                Enviar DM 💬
              </button>
            </div>
          </div>

          <div id="wappyIgGateStatusBox" style="display:none;margin-top:10px;padding:8px 11px;border-radius:10px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.3);color:#0369a1;font-size:11px;line-height:1.4;"></div>

          <button type="button" id="btnVerifyWappyIgNow" style="cursor:pointer;margin-top:12px;width:100%;height:38px;border-radius:12px;border:1px solid rgba(20,184,166,0.35);background:rgba(20,184,166,0.12);color:#0f766e;font-size:12px;font-weight:800;">
            🛡️ Ya seguí a @wappy_ia — Entrar ahora
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const btnCopy = document.getElementById('btnCopyWappyIgCode');
    const copyHint = document.getElementById('wappyIgCopyHint');
    const btnFollow = document.getElementById('btnFollowWappyIg');
    const btnDm = document.getElementById('btnSendDmWappyIg');
    const btnVerify = document.getElementById('btnVerifyWappyIgNow');
    const statusBox = document.getElementById('wappyIgGateStatusBox');

    function showStatus(msg, tone) {
      if (!statusBox) return;
      statusBox.style.display = 'block';
      if (tone === 'warn') {
        statusBox.style.background = 'rgba(245,158,11,0.12)';
        statusBox.style.borderColor = 'rgba(245,158,11,0.4)';
        statusBox.style.color = '#92400e';
      } else {
        statusBox.style.background = 'rgba(14,165,233,0.1)';
        statusBox.style.borderColor = 'rgba(14,165,233,0.3)';
        statusBox.style.color = '#0369a1';
      }
      statusBox.textContent = msg;
    }

    let actionClicked = false;

    function markActionStarted() {
      actionClicked = true;
      try {
        localStorage.setItem('wappy_ig_action_started', String(Date.now()));
      } catch (e) {}
    }

    function hasStartedActionReady() {
      if (actionClicked) return true;
      try {
        const ts = Number(localStorage.getItem('wappy_ig_action_started') || '0');
        return ts > 0 && Date.now() - ts <= 24 * 60 * 60 * 1000;
      } catch (e) {
        return false;
      }
    }

    function copyCode() {
      try {
        navigator.clipboard.writeText(gateCode);
        if (btnCopy) {
          btnCopy.textContent = gateCode + ' ✓';
          if (copyHint) copyHint.textContent = '¡Código copiado al portapapeles!';
          setTimeout(() => {
            btnCopy.textContent = gateCode + ' 📋';
            if (copyHint) copyHint.textContent = 'Se copia solo al abrir el DM';
          }, 2000);
        }
      } catch (e) {}
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', copyCode);
    }

    if (btnFollow) {
      btnFollow.addEventListener('click', function () {
        markActionStarted();
      });
    }

    if (btnDm) {
      btnDm.addEventListener('click', function () {
        markActionStarted();
        copyCode();
        showStatus('Código "' + gateCode + '" copiado. Pégalo en el DM de @wappy_ia.', 'info');
        window.open('https://ig.me/m/wappy_ia', '_blank', 'noopener,noreferrer');
      });
    }

    async function checkNow(silent) {
      if (!silent && btnVerify) {
        btnVerify.textContent = '⏳ Verificando seguimiento en @wappy_ia...';
        btnVerify.disabled = true;
      }
      try {
        const isConfirmed = hasStartedActionReady();
        const url =
          '/api/comunidad/ig-follow/verify?code=' +
          encodeURIComponent(gateCode) +
          (!silent ? '&explicit=1' : '') +
          (isConfirmed ? '&confirmed=1' : '');
        const resp = await fetch(url, { credentials: 'include' });
        const data = await resp.json();
        if (data && data.verified && data.passToken) {
          savePass(data.passToken, data.username);
          removeGateModal();
          if (typeof window.showToast === 'function') {
            window.showToast(
              data.message || '✅ ¡Verificado en @wappy_ia! Bienvenido a WAPPY Apps.',
              'success'
            );
          }
          return;
        }
        if (data && data.status === 'UNFOLLOW_DETECTED_NOW_FOLLOW') {
          showStatus(data.message, 'info');
        } else if (
          data &&
          (data.status === 'DM_RECEIVED_NOT_FOLLOWING' || data.status === 'NOT_FOLLOWING_YET')
        ) {
          if (!silent || data.status === 'DM_RECEIVED_NOT_FOLLOWING') {
            showStatus(data.message, 'warn');
          }
        } else if (!silent && data && data.message) {
          showStatus(data.message, 'info');
        }
      } catch (e) {
      } finally {
        if (!silent && btnVerify) {
          btnVerify.textContent = '🛡️ Ya seguí a @wappy_ia — Entrar ahora';
          btnVerify.disabled = false;
        }
      }
    }

    if (btnVerify) {
      btnVerify.addEventListener('click', function () {
        checkNow(false);
      });
    }

    checkNow(true);
    pollTimer = setInterval(function () {
      checkNow(true);
    }, 2000);
  }

  async function verifyInitialStatus() {
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlPass = sp.get('ig_pass') || getStoredPass() || '';
      const urlVerified = sp.get('ig_verified') || '';
      const gateCode = getOrCreateGateCode();

      const q = new URLSearchParams();
      if (urlPass) q.set('ig_pass', urlPass);
      if (urlVerified) q.set('ig_verified', urlVerified);
      if (gateCode) q.set('code', gateCode);

      const resp = await fetch('/api/comunidad/ig-follow/status?' + q.toString(), {
        credentials: 'include',
      });
      const data = await resp.json();
      if (data && data.verified && data.passToken) {
        savePass(data.passToken, data.username);
        if (sp.has('ig_pass') || sp.has('ig_verified')) {
          sp.delete('ig_pass');
          sp.delete('ig_verified');
          const cleanSearch = sp.toString();
          const cleanUrl =
            window.location.pathname +
            (cleanSearch ? '?' + cleanSearch : '') +
            window.location.hash;
          window.history.replaceState({}, '', cleanUrl);
        }
        return;
      }
    } catch (e) {}

    renderGateModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyInitialStatus);
  } else {
    verifyInitialStatus();
  }
})();
