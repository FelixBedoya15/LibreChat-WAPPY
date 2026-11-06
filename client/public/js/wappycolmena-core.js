/**
 * WAPPY IA — Wappy ARL Colmena Core Engine (CPS-A-26 V16 · 2026)
 * Exclusivo para Administradores de WAPPY LTDA (Intermediación de Seguros ARL)
 */
(function () {
  window.COLMENA_STATE = {
    isAdmin: false,
    user: null,
    token: null,
    showGuide: true,
    activeTab: 'calificador', // 'calificador' | 'simulador' | 'radar' | 'crm' | 'documentos'
    calificadorMode: 'empresas', // 'empresas' (1104 Dec 768) | 'independientes' (322 CIUO)
    searchQuery: '',
    filterAuth: 'ALL',
    filterRisk: 'ALL',
    filterNicho: 'ALL',
    filterSpecial: 'ALL', // 'ALL' | 'TWIN_PLENA' | 'MIN_PRIMA'
    dataset: {
      summary: { totalActivities: 1104, totalVolunteerOccupations: 322, totalTwinCiiuWithPlenaAlternate: 115 },
      ventaProactiva: [],
      ocupacionesVoluntarios: [],
      byCode768: {},
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
      code768: '1620101',
      comisionPct: 10,
      reinversionPct: 30,
      centros: [
        { id: 1, nombre: 'Administrativo / Sede Principal', clase: 1, trabajadores: 15, ibc: 2200000 },
        { id: 2, nombre: 'Operativo / Campo', clase: 3, trabajadores: 25, ibc: 1800000 },
      ],
    },
    docBuilder: {
      docType: 'propuesta_comercial',
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
      window.COLMENA_STATE.dataset.byCode768[sim.code768] ||
      window.COLMENA_STATE.dataset.ventaProactiva[0] ||
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
    var authStatus = act ? act.authorization : 'Autorización Plena';
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
        if (d) d.innerHTML = 'Tu sesión actual no tiene privilegios <b>ADMIN</b>. Inicia sesión con la cuenta administradora de <b>WAPPY LTDA</b>.';
        if (a) a.classList.remove('hidden');
        return;
      }

      window.COLMENA_STATE.isAdmin = true;
      var gate = document.getElementById('adminGateOverlay');
      var root = document.getElementById('wappyColmenaRoot');
      if (gate) gate.classList.add('hidden');
      if (root) root.classList.remove('hidden');

      var results = await Promise.allSettled([
        fetch('/api/comunidad/wappycolmena/dataset', { credentials: 'include', headers: window.colmenaAuthHeaders() }).then(function (r) { return r.json(); }),
        fetch('/api/comunidad/wappycolmena/radar', { credentials: 'include', headers: window.colmenaAuthHeaders() }).then(function (r) { return r.json(); }),
        fetch('/api/comunidad/wappycolmena/deals', { credentials: 'include', headers: window.colmenaAuthHeaders() }).then(function (r) { return r.json(); }),
      ]);

      // Normalize Dataset (supports both { success: true, activities, occupations } and { ok: true, ventaProactiva })
      if (results[0].status === 'fulfilled' && results[0].value && (results[0].value.success || results[0].value.ok)) {
        var rawDs = results[0].value;
        var rawActs = rawDs.activities || rawDs.ventaProactiva || [];
        var rawOccs = rawDs.occupations || rawDs.ocupacionesVoluntarios || [];
        var byCode = {};

        var normActs = rawActs.map(function (a) {
          var item = {
            code768: String(a.cod768 || a.code768 || ''),
            ciiuCode: String(a.ciiu || a.ciiuCode || ''),
            riskClass: Number(a.clase || a.riskClass || 1),
            sector: a.sector || '',
            division: a.division || '',
            grupo: a.grupo || '',
            description768: a.descripcion || a.description768 || '',
            exceptionRule: a.excepcion || a.exceptionRule || '',
            minPrimaRequired: Number(a.minPrima != null ? a.minPrima : (a.minPrimaRequired || 0)),
            nicho2026: a.nicho || a.nicho2026 || 'Otras Actividades',
            authorization: a.nivel || a.authorization || 'Autorización Plena',
            rawTwinCodes: a.plenaAlternatesInCiiu || [],
            plenaAlternatesInCiiu: [],
          };
          byCode[item.code768] = item;
          return item;
        });

        normActs.forEach(function (item) {
          item.plenaAlternatesInCiiu = (item.rawTwinCodes || []).map(function (c) {
            return typeof c === 'string' ? (byCode[c] || { code768: c, riskClass: item.riskClass, description768: 'Subactividad con Autorización Plena en el mismo CIIU ' + item.ciiuCode }) : c;
          });
        });

        var normOccs = rawOccs.map(function (o) {
          return {
            code768: String(o.cod768 || o.code768 || ''),
            ciuoCode: String(o.codOcupacion || o.ciuoCode || ''),
            riskClass: Number(o.clase || o.riskClass || 1),
            occupation: o.ocupacion || o.occupation || '',
            activityDescription: o.descripcionActividad || '',
            authorization: o.nivel || o.authorization || 'AUTORIZACIÓN PLENA',
            desconcentracion: o.desconcentracion || 'SI',
            nicho2026: o.nicho || 'GENERAL',
          };
        });

        window.COLMENA_STATE.dataset = {
          summary: {
            totalActivities: normActs.length || 1104,
            totalVolunteerOccupations: normOccs.length || 322,
            totalTwinCiiuWithPlenaAlternate: 115,
          },
          ventaProactiva: normActs,
          ocupacionesVoluntarios: normOccs,
          byCode768: byCode,
        };
        window.COLMENA_STATE.selectedActivity = byCode['1620101'] || normActs.find(function (x) { return x.authorization === 'Autorización Plena'; }) || normActs[0] || null;
        if (window.COLMENA_STATE.selectedActivity) {
          window.COLMENA_STATE.simulator.code768 = window.COLMENA_STATE.selectedActivity.code768;
        }
      }

      // Normalize Radar
      if (results[1].status === 'fulfilled' && results[1].value && (results[1].value.success || results[1].value.ok)) {
        var rawRd = results[1].value;
        var normProspects = (rawRd.prospects || []).map(function (p) {
          var m = p.cpsMatch || {};
          return {
            companyName: p.companyName || '',
            nit: p.nit || '',
            city: p.city || 'Colombia',
            responsableSst: p.responsibleSST || p.legalRepresentative || '',
            source: p.origin || p.source || 'Somos SST',
            sector: p.rawEconomicActivity || m.descripcion || 'General',
            workersCount: Number(p.workerCount || p.workersCount || 1),
            riskLevel: m.clase || 1,
            matchedCode768: m.cod768 || p.matchedCode768 || '',
            nicho2026: m.nicho || p.nicho2026 || 'General',
            authorizationLevel: m.nivel || p.authorizationLevel || 'Autorización Plena',
            estimatedAnnualPrima: Number(p.annualPrima || p.estimatedAnnualPrima || 0),
            estimatedAnnualCommission: Number(p.estimatedAnnualCommission10 || p.estimatedAnnualCommission || 0),
          };
        });
        window.COLMENA_STATE.radarData = {
          totalProspects: normProspects.length,
          plenaCount: normProspects.filter(function (x) { return x.authorizationLevel.indexOf('Plena') !== -1; }).length,
          condicionadaCount: normProspects.filter(function (x) { return x.authorizationLevel.indexOf('Condicionada') !== -1; }).length,
          especialCount: normProspects.filter(function (x) { return x.authorizationLevel.indexOf('Especial') !== -1; }).length,
          prospects: normProspects,
        };
      }

      // Normalize CRM Deals
      if (results[2].status === 'fulfilled' && results[2].value && (results[2].value.success || results[2].value.ok)) {
        window.COLMENA_STATE.deals = (results[2].value.deals || []).map(function (d) {
          return {
            _id: d._id,
            companyName: d.companyName || '',
            nit: d.nit || '',
            city: d.city || '',
            code768: d.cod768 || d.code768 || '',
            riskClass: d.claseRiesgo || d.riskClass || 1,
            authorizationLevel: d.nivelAutorizacion || d.authorizationLevel || 'Autorización Plena',
            estimatedAnnualPrima: d.annualPrimaColmena || d.estimatedAnnualPrima || 0,
            estimatedAnnualCommission: d.estimatedAnnualCommission || 0,
            stage: d.stage || 'prospeccion',
          };
        });
      }

      if (typeof window.renderColmenaApp === 'function') {
        window.renderColmenaApp();
      }
    } catch (err) {
      console.error('[WappyColmena] Init error:', err);
    }
  };
})();
