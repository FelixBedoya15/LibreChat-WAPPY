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
      'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,23,0.82);backdrop-filter:blur(10px);font-family:Inter,Plus Jakarta Sans,system-ui,sans-serif;';

    overlay.innerHTML = `
      <div style="width:100%;max-width:510px;border-radius:24px;overflow:hidden;background:#ffffff;color:#0f172a;border:1px solid rgba(148,163,184,0.35);box-shadow:0 25px 60px -15px rgba(0,0,0,0.55);">
        <div style="height:8px;width:100%;background:linear-gradient(90deg,#f09433 0%,#dc2743 50%,#c7f303 100%);"></div>
        <div style="padding:22px 24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:10px;background:rgba(217,70,239,0.12);border:1px solid rgba(217,70,239,0.35);color:#a21caf;font-size:11px;font-weight:800;letter-spacing:0.03em;">
              🔒 ACCESO COMUNIDAD @WAPPY_IA
            </span>
            <a href="/portal" style="text-decoration:none;padding:5px 10px;border-radius:10px;background:rgba(100,116,139,0.12);border:1px solid rgba(148,163,184,0.4);color:#475569;font-size:11px;font-weight:700;">
              ← Volver al Portal
            </a>
          </div>

          <h2 style="margin:12px 0 6px;font-size:21px;line-height:1.2;font-weight:900;color:#0f172a;">
            Síguenos en <span style="color:#c026d3;">@wappy_ia</span> para usar WAPPY Apps
          </h2>

          <p style="margin:0;font-size:13px;line-height:1.5;color:#475569;">
            Para ingresar a <strong>los aplicativos de WAPPY Apps</strong>, todos los usuarios deben seguir nuestra cuenta oficial de Instagram <strong style="color:#c026d3;">@wappy_ia</strong>. Nuestro sistema verifica tu seguimiento en vivo:
          </p>

          <div style="margin-top:14px;padding:13px 15px;border-radius:16px;background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.35);">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <div>
                <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#0f766e;">
                  TU CÓDIGO DE ACTIVACIÓN EN VIVO
                </div>
                <div id="wappyIgGateCodeText" style="margin-top:2px;font-family:monospace;font-size:22px;font-weight:900;letter-spacing:0.12em;color:#0f172a;">
                  ${gateCode}
                </div>
              </div>
              <button type="button" id="btnCopyWappyIgCode" style="cursor:pointer;padding:8px 13px;border-radius:12px;border:1px solid rgba(20,184,166,0.4);background:#ffffff;color:#0f766e;font-size:12px;font-weight:800;">
                📋 Copiar código
              </button>
            </div>
            <div style="margin-top:6px;font-size:11px;color:#475569;">
              Envía este código por DM a <strong>@wappy_ia</strong> desde tu celular o computador y esta pantalla se desbloqueará automáticamente.
            </div>
          </div>

          <div style="margin-top:14px;display:flex;flex-direction:column;gap:9px;">
            <a id="btnFollowWappyIg" href="https://www.instagram.com/wappy_ia/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:16px;background:rgba(217,70,239,0.1);border:1px solid rgba(217,70,239,0.35);color:#86198f;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:28px;height:28px;border-radius:9px;background:#c026d3;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;">1</span>
                <div>
                  <div style="font-size:13px;font-weight:800;color:#701a75;">Seguir a @wappy_ia en Instagram</div>
                  <div style="font-size:11px;color:#64748b;">Abre nuestro perfil y toca el botón "Seguir"</div>
                </div>
              </div>
              <span style="padding:6px 11px;border-radius:10px;background:#c026d3;color:#fff;font-size:11px;font-weight:800;">Seguir ↗</span>
            </a>

            <button type="button" id="btnSendDmWappyIg" style="cursor:pointer;width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:16px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.35);text-align:left;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:28px;height:28px;border-radius:9px;background:#059669;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;">2</span>
                <div>
                  <div style="font-size:13px;font-weight:800;color:#065f46;">Enviar "${gateCode}" por DM a @wappy_ia</div>
                  <div style="font-size:11px;color:#64748b;">Copia el código y abre el chat de verificación</div>
                </div>
              </div>
              <span style="padding:6px 11px;border-radius:10px;background:#059669;color:#fff;font-size:11px;font-weight:800;">Enviar DM 💬</span>
            </button>
          </div>

          <div id="wappyIgGateStatusBox" style="margin-top:14px;padding:11px 13px;border-radius:14px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.3);color:#0369a1;font-size:12px;line-height:1.45;">
            🔄 Verificación automática activa: en cuanto sigas a <strong>@wappy_ia</strong> y envíes <strong>${gateCode}</strong> por DM, entrarás al aplicativo inmediatamente.
          </div>

          <button type="button" id="btnVerifyWappyIgNow" style="cursor:pointer;margin-top:14px;width:100%;height:44px;border-radius:14px;border:1px solid rgba(13,148,136,0.4);background:#c7f303;color:#0e1300;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.04em;">
            ✅ Ya seguí y envié el DM — Verificar ahora
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const btnCopy = document.getElementById('btnCopyWappyIgCode');
    const btnFollow = document.getElementById('btnFollowWappyIg');
    const btnDm = document.getElementById('btnSendDmWappyIg');
    const btnVerify = document.getElementById('btnVerifyWappyIgNow');
    const statusBox = document.getElementById('wappyIgGateStatusBox');

    function markActionStarted() {
      try {
        localStorage.setItem('wappy_ig_action_started', String(Date.now()));
      } catch (e) {}
    }

    function hasStartedActionReady() {
      try {
        const ts = Number(localStorage.getItem('wappy_ig_action_started') || '0');
        return ts > 0 && Date.now() - ts >= 4500;
      } catch (e) {
        return false;
      }
    }

    function copyCode() {
      try {
        navigator.clipboard.writeText(gateCode);
        if (btnCopy) {
          btnCopy.textContent = '✅ ¡Copiado!';
          setTimeout(() => {
            btnCopy.textContent = '📋 Copiar código';
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
        if (statusBox) {
          statusBox.textContent =
            '📋 Código "' +
            gateCode +
            '" copiado al portapapeles. Pégalo y envíalo en el DM de @wappy_ia.';
        }
        window.open('https://ig.me/m/wappy_ia', '_blank', 'noopener,noreferrer');
      });
    }

    async function checkNow(silent) {
      if (!silent && btnVerify) {
        btnVerify.textContent = '⏳ Verificando con Instagram (@wappy_ia)...';
        btnVerify.disabled = true;
      }
      try {
        const isConfirmed = !silent || hasStartedActionReady();
        const url =
          '/api/comunidad/ig-follow/verify?code=' +
          encodeURIComponent(gateCode) +
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
        if (
          data &&
          (data.status === 'DM_RECEIVED_NOT_FOLLOWING' || data.status === 'NOT_FOLLOWING_YET') &&
          statusBox
        ) {
          if (!silent || data.status === 'DM_RECEIVED_NOT_FOLLOWING') {
            statusBox.style.background = 'rgba(245,158,11,0.14)';
            statusBox.style.borderColor = 'rgba(245,158,11,0.45)';
            statusBox.style.color = '#92400e';
            statusBox.textContent = data.message;
          }
        } else if (!silent && data && data.message && statusBox) {
          statusBox.textContent = 'ℹ️ ' + data.message;
        }
      } catch (e) {
      } finally {
        if (!silent && btnVerify) {
          btnVerify.textContent = '✅ Ya seguí y envié el DM — Verificar ahora';
          btnVerify.disabled = false;
        }
      }
    }

    if (btnVerify) {
      btnVerify.addEventListener('click', function () {
        markActionStarted();
        checkNow(false);
      });
    }

    pollTimer = setInterval(function () {
      checkNow(true);
    }, 3500);
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
