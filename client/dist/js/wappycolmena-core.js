/**
 * WAPPY IA — Wappy ARL Colmena Core Engine (CPS-A-26 V16 · 2026)
 * Exclusivo para Administradores de WAPPY LTDA (Intermediación de Seguros ARL)
 */
(function () {
  window.COLMENA_STATE = {
    isAdmin: false,
    user: null,
    token: null,
    activeTab: 'calificador', // 'calificador' | 'simulador' | 'radar' | 'crm' | 'documentos'
    calificadorMode: 'empresas', // 'empresas' (1104 Dec 768) | 'independientes' (322 CIUO)
    searchQuery: '',
    filterAuth: 'ALL',
    filterRisk: 'ALL',
    filterNicho: 'ALL',
    filterSpecial: 'ALL', // 'ALL' | 'TWIN_PLENA' | 'MIN_PRIMA'
    dataset: {
      summary: null,
      ventaProactiva: [],
      ocupacionesVoluntarios: [],
    },
    radarData: {
      totalProspects: 0,
      plenaCount: 0,
      condicionadaCount: 0,
      especialCount: 0,
      altaSiniestralidadCount: 0,
      prospects: [],
    },
    deals: [],
    companies: [],
    selectedActivity: null,
    simulator: {
      companyName: '',
      companyNit: '',
      city: 'Medellín',
      contactName: '',
      contactPhone: '',
      currentArl: 'SURA',
      smlmv: 1423500,
      ibcPromedio: 2200000,
      code768: '1821901',
      comisionPct: 10,
      reinversionPct: 30,
      centros: [
        { id: 1, nombre: 'Administrativo / Sede Principal', clase: 1, trabajadores: 15, ibc: 2200000 },
        { id: 2, nombre: 'Operativo / Campo', clase: 3, trabajadores: 25, ibc: 1800000 },
      ],
    },
    docBuilder: {
      docType: 'propuesta_comercial', // 'propuesta_comercial' | 'ficha_suscripcion' | 'carta_intermediacion'
      aiObservation: '',
      isGeneratingAi: false,
    },
  };

  window.ARL_RATES = {
    1: { clase: 'I', label: 'Riesgo I (Mínimo)', rate: 0.00522, pctText: '0,522%' },
    2: { clase: 'II', label: 'Riesgo II (Bajo)', rate: 0.01044, pctText: '1,044%' },
    3: { clase: 'III', label: 'Riesgo III (Medio)', rate: 0.02436, pctText: '2,436%' },
    4: { clase: 'IV', label: 'Riesgo IV (Alto)', rate: 0.04350, pctText: '4,350%' },
    5: { clase: 'V', label: 'Riesgo V (Máximo)', rate: 0.06960, pctText: '6,960%' },
  };

  window.formatCOP = function (val) {
    var n = Math.round(Number(val) || 0);
    return '$' + n.toLocaleString('es-CO');
  };

  window.showColmenaToast = function (msg, type) {
    var c = document.getElementById('toastContainer');
    if (!c) return;
    var el = document.createElement('div');
    var bg = type === 'error' ? 'bg-rose-600 text-white' : type === 'warn' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white';
    el.className = 'px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 transition-all ' + bg;
    el.innerHTML = '<span>' + (type === 'error' ? '⚠️' : type === 'warn' ? '⚡' : '✅') + '</span><span>' + msg + '</span>';
    c.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 300);
    }, 3600);
  };

  window.toggleWappyDarkMode = function () {
    var html = document.documentElement;
    var isDark = html.classList.toggle('dark');
    try { localStorage.setItem('wappy_theme_mode', isDark ? 'dark' : 'light'); } catch (e) {}
    var icon = document.getElementById('themeToggleIconNav');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  };

  window.colmenaAuthHeaders = function () {
    var h = { 'Content-Type': 'application/json' };
    if (window.COLMENA_STATE.token) {
      h['Authorization'] = 'Bearer ' + window.COLMENA_STATE.token;
    }
    return h;
  };

  window.computeColmenaSimulation = function () {
    var sim = window.COLMENA_STATE.simulator;
    var act = window.COLMENA_STATE.selectedActivity ||
      window.COLMENA_STATE.dataset.ventaProactiva.find(function (r) { return r.code768 === sim.code768; }) ||
      null;

    var totalWorkers = 0;
    var totalNominaMensual = 0;
    var primaMensual = 0;

    (sim.centros || []).forEach(function (c) {
      var w = Math.max(0, Number(c.trabajadores) || 0);
      var ibc = Math.max(0, Number(c.ibc) || 0);
      var rObj = window.ARL_RATES[c.clase] || window.ARL_RATES[1];
      var nomina = w * ibc;
      var primaCentro = nomina * rObj.rate;
      totalWorkers += w;
      totalNominaMensual += nomina;
      primaMensual += primaCentro;
    });

    var primaAnual = primaMensual * 12;
    var minRequired = act ? Number(act.minPrimaRequired || 0) : 0;
    var authStatus = act ? act.authorization : 'Sin seleccionar';
    var effectiveAuth = authStatus;
    var complianceAlert = '';

    if (minRequired > 0) {
      if (primaMensual >= minRequired || primaAnual >= minRequired) {
        effectiveAuth = 'Autorización Plena (Cumple Tope Excepción CPS-A-26)';
        complianceAlert = 'Cumple la excepción del Anexo CPS-A-26 V16 (' + window.formatCOP(minRequired) + '). Pasa directamente a Autorización Plena.';
      } else {
        var faltante = Math.max(0, minRequired - primaMensual);
        effectiveAuth = 'Autorización Especial (Bajo Tope ' + window.formatCOP(minRequired) + ')';
        complianceAlert = 'Este código (' + (act ? act.code768 : '') + ') exige prima >= ' + window.formatCOP(minRequired) + ' para Autorización Plena. Faltan ' + window.formatCOP(faltante) + '/mes; requiere Autorización Especial de Suscripción.';
      }
    }

    var comisionPct = Number(sim.comisionPct) || 10;
    var reinversionPct = Number(sim.reinversionPct) || 30;
    var comisionAnualWappy = primaAnual * (comisionPct / 100);
    var comisionMensualWappy = primaMensual * (comisionPct / 100);
    var bolsaSstCliente = comisionAnualWappy * (reinversionPct / 100);
    var utilidadNetaWappy = comisionAnualWappy - bolsaSstCliente;

    return {
      activity: act,
      totalWorkers: totalWorkers,
      totalNominaMensual: totalNominaMensual,
      primaMensual: Math.round(primaMensual),
      primaAnual: Math.round(primaAnual),
      minRequired: minRequired,
      authStatus: authStatus,
      effectiveAuth: effectiveAuth,
      complianceAlert: complianceAlert,
      comisionPct: comisionPct,
      reinversionPct: reinversionPct,
      comisionMensualWappy: Math.round(comisionMensualWappy),
      comisionAnualWappy: Math.round(comisionAnualWappy),
      bolsaSstCliente: Math.round(bolsaSstCliente),
      utilidadNetaWappy: Math.round(utilidadNetaWappy),
    };
  };

  window.initColmenaApp = async function () {
    try {
      // 1. Refresh session & verify ADMIN role
      var refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        var refreshData = await refreshRes.json();
        if (refreshData && refreshData.token) {
          window.COLMENA_STATE.token = refreshData.token;
          window.COLMENA_STATE.user = refreshData.user || null;
          window.platformUser = refreshData.user || null;
          window.platformUserToken = refreshData.token;
          window.isPlatformLoggedIn = true;
        }
      }

      var adminCheck = await fetch('/api/comunidad/is-admin', {
        credentials: 'include',
        headers: window.colmenaAuthHeaders(),
      });
      var adminJson = adminCheck.ok ? await adminCheck.json() : { isAdmin: false };
      var isRoleAdmin = (window.COLMENA_STATE.user && window.COLMENA_STATE.user.role === 'ADMIN') || !!adminJson.isAdmin;

      if (!isRoleAdmin) {
        var t = document.getElementById('adminGateTitle');
        var d = document.getElementById('adminGateDesc');
        var a = document.getElementById('adminGateActions');
        if (t) t.textContent = 'Acceso Restringido · Solo Administradores';
        if (d) d.innerHTML = 'Tu sesión actual no tiene privilegios <b>ADMIN</b>. Inicia sesión con la cuenta administradora de <b>WAPPY LTDA</b> para usar el motor de Intermediación ARL Colmena.';
        if (a) a.classList.remove('hidden');
        return;
      }

      window.COLMENA_STATE.isAdmin = true;
      var gate = document.getElementById('adminGateOverlay');
      var root = document.getElementById('wappyColmenaRoot');
      if (gate) gate.classList.add('hidden');
      if (root) root.classList.remove('hidden');

      // 2. Load dataset + radar + deals in parallel
      var results = await Promise.allSettled([
        fetch('/api/comunidad/wappycolmena/dataset', { credentials: 'include', headers: window.colmenaAuthHeaders() }).then(function (r) { return r.json(); }),
        fetch('/api/comunidad/wappycolmena/radar', { credentials: 'include', headers: window.colmenaAuthHeaders() }).then(function (r) { return r.json(); }),
        fetch('/api/comunidad/wappycolmena/deals', { credentials: 'include', headers: window.colmenaAuthHeaders() }).then(function (r) { return r.json(); }),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value && results[0].value.ok) {
        window.COLMENA_STATE.dataset = {
          summary: results[0].value.summary,
          ventaProactiva: results[0].value.ventaProactiva || [],
          ocupacionesVoluntarios: results[0].value.ocupacionesVoluntarios || [],
        };
        window.COLMENA_STATE.selectedActivity = window.COLMENA_STATE.dataset.ventaProactiva.find(function (x) { return x.code768 === '1821901'; }) || window.COLMENA_STATE.dataset.ventaProactiva[0] || null;
      }
      if (results[1].status === 'fulfilled' && results[1].value && results[1].value.ok) {
        window.COLMENA_STATE.radarData = results[1].value;
      }
      if (results[2].status === 'fulfilled' && results[2].value && results[2].value.ok) {
        window.COLMENA_STATE.deals = results[2].value.deals || [];
      }

      if (typeof window.renderColmenaApp === 'function') {
        window.renderColmenaApp();
      }
    } catch (err) {
      console.error('[WappyColmena] Init error:', err);
    }
  };
})();
