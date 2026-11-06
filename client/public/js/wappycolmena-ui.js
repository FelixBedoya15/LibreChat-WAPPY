/**
 * WAPPY IA — Wappy ARL Colmena UI Renderer (CPS-A-26 V16 · 2026)
 */
(function () {
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function authBadgeHtml(auth) {
    var a = String(auth || '');
    if (a.indexOf('Plena') !== -1 || a.indexOf('PLENA') !== -1) {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">🟢 ' + esc(a) + '</span>';
    }
    if (a.indexOf('Condicionada') !== -1) {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-700 border border-amber-500/30">🟡 ' + esc(a) + '</span>';
    }
    if (a.indexOf('Especial') !== -1) {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-500/15 text-orange-700 border border-orange-500/30">🟠 ' + esc(a) + '</span>';
    }
    return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-700 border border-rose-500/30">🔴 ' + esc(a || 'No Autorizado') + '</span>';
  }

  function riskBadgeHtml(rc) {
    var colors = {
      1: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
      2: 'bg-teal-500/15 text-teal-700 border-teal-500/30',
      3: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
      4: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
      5: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
    };
    var r = window.ARL_RATES[rc] || window.ARL_RATES[1];
    return '<span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-black border ' + (colors[rc] || colors[1]) + '">Clase ' + r.clase + ' (' + r.pctText + ')</span>';
  }

  window.switchColmenaTab = function (tab) {
    window.COLMENA_STATE.activeTab = tab;
    window.renderColmenaApp();
  };

  window.selectActivityForSim = function (code768, goSim) {
    var act = window.COLMENA_STATE.dataset.ventaProactiva.find(function (r) { return r.code768 === String(code768); });
    if (!act) return;
    window.COLMENA_STATE.selectedActivity = act;
    window.COLMENA_STATE.simulator.code768 = act.code768;
    if (window.COLMENA_STATE.simulator.centros && window.COLMENA_STATE.simulator.centros.length > 0) {
      window.COLMENA_STATE.simulator.centros[window.COLMENA_STATE.simulator.centros.length - 1].clase = act.riskClass;
    }
    window.showColmenaToast('Código Decreto 768 ' + act.code768 + ' cargado en el Simulador', 'ok');
    if (goSim) {
      window.COLMENA_STATE.activeTab = 'simulador';
    }
    window.renderColmenaApp();
  };

  window.loadRadarProspectToSim = function (idx, targetTab) {
    var p = (window.COLMENA_STATE.radarData.prospects || [])[idx];
    if (!p) return;
    var sim = window.COLMENA_STATE.simulator;
    sim.companyName = p.companyName || '';
    sim.companyNit = p.nit || '';
    sim.city = p.city || 'Medellín';
    sim.contactName = p.responsableSst || '';
    var workers = Math.max(1, Number(p.workersCount) || 10);
    if (p.matchedCode768) {
      var act = window.COLMENA_STATE.dataset.ventaProactiva.find(function (r) { return r.code768 === p.matchedCode768; });
      if (act) {
        window.COLMENA_STATE.selectedActivity = act;
        sim.code768 = act.code768;
      }
    }
    var mainRisk = (window.COLMENA_STATE.selectedActivity && window.COLMENA_STATE.selectedActivity.riskClass) || Number(String(p.riskLevel || '1').replace(/\D/g, '')) || 1;
    var adminW = Math.max(1, Math.round(workers * 0.3));
    var opW = Math.max(0, workers - adminW);
    sim.centros = [
      { id: 1, nombre: 'Administración Principal', clase: 1, trabajadores: adminW, ibc: 2200000 },
    ];
    if (opW > 0) {
      sim.centros.push({ id: 2, nombre: 'Operación Principal (' + (p.sector || 'General') + ')', clase: Math.min(5, Math.max(1, mainRisk)), trabajadores: opW, ibc: 1850000 });
    }
    window.COLMENA_STATE.activeTab = targetTab || 'simulador';
    window.showColmenaToast('Empresa "' + sim.companyName + '" cargada desde el Radar Interno', 'ok');
    window.renderColmenaApp();
  };

  window.saveCurrentSimToCrm = async function (stage) {
    var sim = window.COLMENA_STATE.simulator;
    var calc = window.computeColmenaSimulation();
    var act = calc.activity || {};
    if (!sim.companyName || !sim.companyName.trim()) {
      window.showColmenaToast('Escribe el nombre de la empresa en el Simulador antes de guardar en el CRM', 'warn');
      return;
    }
    var payload = {
      companyName: sim.companyName.trim(),
      nit: sim.companyNit || '',
      city: sim.city || 'Medellín',
      phone: sim.contactPhone || '',
      responsibleSST: sim.contactName || '',
      currentArl: sim.currentArl || 'Otra ARL',
      cod768: act.code768 || sim.code768 || '',
      code768: act.code768 || sim.code768 || '',
      claseRiesgo: act.riskClass || 1,
      riskClass: act.riskClass || 1,
      ciiu: act.ciiuCode || '',
      descripcionActividad: act.description768 || '',
      nicho2026: act.nicho2026 || 'Otras Actividades',
      nivelAutorizacion: calc.effectiveAuth || act.authorization || 'Autorización Plena',
      excepcionPrima: act.exceptionRule || 'No Aplica',
      workerCount: calc.totalWorkers,
      avgIbc: sim.ibcPromedio || 2000000,
      monthlyPrimaColmena: calc.primaMensual,
      annualPrimaColmena: calc.primaAnual,
      meetsMinPrimaRule: calc.minRequired > 0 ? calc.primaMensual >= calc.minRequired : true,
      commissionPct: calc.comisionPct,
      estimatedAnnualCommission: calc.comisionAnualWappy,
      reinvestmentSstPct: calc.reinversionPct,
      estimatedReinvestmentSst: calc.bolsaSstCliente,
      stage: stage || 'cotizacion',
    };
    try {
      var res = await fetch('/api/comunidad/wappycolmena/deals', {
        method: 'POST',
        credentials: 'include',
        headers: window.colmenaAuthHeaders(),
        body: JSON.stringify(payload),
      });
      var data = await res.json();
      if (data && (data.success || data.ok) && data.deal) {
        var d = data.deal;
        window.COLMENA_STATE.deals.unshift({
          _id: d._id,
          companyName: d.companyName,
          nit: d.nit,
          city: d.city,
          code768: d.cod768 || d.code768,
          riskClass: d.claseRiesgo || d.riskClass || 1,
          authorizationLevel: d.nivelAutorizacion || d.authorizationLevel,
          estimatedAnnualPrima: d.annualPrimaColmena || d.estimatedAnnualPrima || 0,
          estimatedAnnualCommission: d.estimatedAnnualCommission || 0,
          stage: d.stage || 'cotizacion',
        });
        window.showColmenaToast('Negocio guardado en el Pipeline CRM de WAPPY LTDA', 'ok');
        window.COLMENA_STATE.activeTab = 'crm';
        window.renderColmenaApp();
      } else {
        window.showColmenaToast('Error al guardar en CRM: ' + (data.error || 'Desconocido'), 'error');
      }
    } catch (e) {
      window.showColmenaToast('Error de red guardando negocio', 'error');
    }
  };

  window.updateDealStage = async function (dealId, newStage) {
    var deal = window.COLMENA_STATE.deals.find(function (d) { return d._id === dealId; });
    if (!deal) return;
    deal.stage = newStage;
    try {
      await fetch('/api/comunidad/wappycolmena/deals', {
        method: 'POST',
        credentials: 'include',
        headers: window.colmenaAuthHeaders(),
        body: JSON.stringify(deal),
      });
      window.showColmenaToast('Estado actualizado a: ' + newStage.toUpperCase(), 'ok');
      window.renderColmenaApp();
    } catch (e) {}
  };

  window.deleteColmenaDeal = async function (dealId) {
    try {
      await fetch('/api/comunidad/wappycolmena/deals/' + encodeURIComponent(dealId), {
        method: 'DELETE',
        credentials: 'include',
        headers: window.colmenaAuthHeaders(),
      });
      window.COLMENA_STATE.deals = window.COLMENA_STATE.deals.filter(function (d) { return d._id !== dealId; });
      window.showColmenaToast('Prospecto eliminado del CRM', 'ok');
      window.renderColmenaApp();
    } catch (e) {}
  };

  window.generateAiExecutiveText = async function () {
    var sim = window.COLMENA_STATE.simulator;
    var calc = window.computeColmenaSimulation();
    var act = calc.activity || {};
    window.COLMENA_STATE.docBuilder.isGeneratingAi = true;
    window.renderColmenaApp();
    try {
      var res = await fetch('/api/comunidad/wappycolmena/ai-generate', {
        method: 'POST',
        credentials: 'include',
        headers: window.colmenaAuthHeaders(),
        body: JSON.stringify({
          docType: window.COLMENA_STATE.docBuilder.docType === 'ficha_suscripcion' ? 'ficha_suscripcion' : 'propuesta',
          dealData: {
            companyName: sim.companyName || 'Empresa Prospecto',
            nit: sim.companyNit || '900.000.000-1',
            city: sim.city || 'Medellín',
            currentArl: sim.currentArl || 'Otra ARL',
            cod768: act.code768 || sim.code768,
            ciiu: act.ciiuCode || '',
            claseRiesgo: act.riskClass || 1,
            descripcionActividad: act.description768 || '',
            nicho2026: act.nicho2026 || 'General',
            nivelAutorizacion: calc.effectiveAuth,
            excepcionPrima: act.exceptionRule || 'No Aplica',
            meetsMinPrimaRule: calc.minRequired > 0 ? calc.primaMensual >= calc.minRequired : true,
            workerCount: calc.totalWorkers,
            monthlyPrimaColmena: calc.primaMensual,
            annualPrimaColmena: calc.primaAnual,
            estimatedAnnualCommission: calc.comisionAnualWappy,
            estimatedReinvestmentSst: calc.bolsaSstCliente,
          },
        }),
      });
      var data = await res.json();
      window.COLMENA_STATE.docBuilder.isGeneratingAi = false;
      var txt = (data && (data.html || data.text) || '').replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      if (data && (data.success || data.ok) && txt) {
        window.COLMENA_STATE.docBuilder.aiObservation = txt;
        window.showColmenaToast('Sustentación técnica generada con IA (' + (data.modelUsed || data.model || 'Gemini') + ')', 'ok');
      } else {
        window.showColmenaToast(data.message || data.error || 'Usando plantilla base de alta precisión', 'warn');
      }
      window.renderColmenaApp();
    } catch (e) {
      window.COLMENA_STATE.docBuilder.isGeneratingAi = false;
      window.showColmenaToast('Error conectando con motor IA', 'error');
      window.renderColmenaApp();
    }
  };

  window.__colmenaHelpers = { esc: esc, authBadgeHtml: authBadgeHtml, riskBadgeHtml: riskBadgeHtml };
})();
(function () {
  var h = window.__colmenaHelpers;
  var esc = h.esc;
  var authBadgeHtml = h.authBadgeHtml;
  var riskBadgeHtml = h.riskBadgeHtml;

  function renderCalificadorTab() {
    var st = window.COLMENA_STATE;
    var mode = st.calificadorMode;
    var q = (st.searchQuery || '').trim().toLowerCase();

    if (mode === 'independientes') {
      var listVol = (st.dataset.ocupacionesVoluntarios || []).filter(function (r) {
        if (st.filterAuth !== 'ALL' && r.authorization.indexOf(st.filterAuth.toUpperCase()) === -1) return false;
        if (st.filterRisk !== 'ALL' && String(r.riskClass) !== String(st.filterRisk)) return false;
        if (q) {
          var hay = (r.code768 + ' ' + r.ciuoCode + ' ' + r.occupation + ' ' + r.authorization).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      var rowsVolHtml = listVol.slice(0, 120).map(function (r) {
        return '<tr class="border-b border-slate-100 hover:bg-amber-50/40 transition-colors">' +
          '<td class="p-3 font-mono font-black text-xs text-teal-700">' + esc(r.code768) + '</td>' +
          '<td class="p-3 font-mono font-bold text-xs text-slate-600">' + esc(r.ciuoCode) + '</td>' +
          '<td class="p-3">' + riskBadgeHtml(r.riskClass) + '</td>' +
          '<td class="p-3 text-xs font-bold text-slate-800">' + esc(r.occupation) + '</td>' +
          '<td class="p-3">' + authBadgeHtml(r.authorization) + '</td>' +
          '<td class="p-3 text-xs font-black ' + (r.desconcentracion === 'SI' ? 'text-emerald-700' : 'text-rose-600') + '">' + (r.desconcentracion === 'SI' ? '✅ SÍ (Inmediata)' : '⛔ NO') + '</td>' +
        '</tr>';
      }).join('');
      return '<div class="wappy-card-surface bg-white/95 rounded-3xl border border-slate-200/80 shadow-xl p-5 sm:p-6">' +
        '<div class="flex flex-wrap items-center justify-between gap-3 mb-4">' +
          '<div class="flex items-center gap-2">' +
            '<button onclick="window.COLMENA_STATE.calificadorMode=\'empresas\';window.renderColmenaApp()" class="px-4 py-2 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">🏢 Empresas Decreto 768 (1.104)</button>' +
            '<button onclick="window.COLMENA_STATE.calificadorMode=\'independientes\';window.renderColmenaApp()" class="px-4 py-2 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 shadow-sm cursor-pointer">👷 Independientes / Voluntarios CIUO (322)</button>' +
          '</div>' +
          '<span class="text-xs font-bold text-slate-500">Mostrando ' + Math.min(120, listVol.length) + ' de ' + listVol.length + ' ocupaciones</span>' +
        '</div>' +
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">' +
          '<input type="text" value="' + esc(st.searchQuery) + '" oninput="window.COLMENA_STATE.searchQuery=this.value;window.renderColmenaApp()" placeholder="Buscar profesión, CIUO o código 768..." class="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold" />' +
          '<select onchange="window.COLMENA_STATE.filterAuth=this.value;window.renderColmenaApp()" class="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold">' +
            '<option value="ALL">Todas las Autorizaciones (322)</option>' +
            '<option value="PLENA" ' + (st.filterAuth === 'PLENA' ? 'selected' : '') + '>🟢 Autorización Plena / Desconcentración SÍ (151)</option>' +
            '<option value="NO AUTORIZADO" ' + (st.filterAuth === 'NO AUTORIZADO' ? 'selected' : '') + '>🔴 No Autorizado (171)</option>' +
          '</select>' +
          '<select onchange="window.COLMENA_STATE.filterRisk=this.value;window.renderColmenaApp()" class="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold">' +
            '<option value="ALL">Todas las Clases de Riesgo (I - V)</option>' +
            '<option value="1" ' + (st.filterRisk === '1' ? 'selected' : '') + '>Clase I (0,522%)</option>' +
            '<option value="2" ' + (st.filterRisk === '2' ? 'selected' : '') + '>Clase II (1,044%)</option>' +
            '<option value="3" ' + (st.filterRisk === '3' ? 'selected' : '') + '>Clase III (2,436%)</option>' +
            '<option value="4" ' + (st.filterRisk === '4' ? 'selected' : '') + '>Clase IV (4,350%)</option>' +
            '<option value="5" ' + (st.filterRisk === '5' ? 'selected' : '') + '>Clase V (6,960%)</option>' +
          '</select>' +
        '</div>' +
        '<div class="overflow-x-auto rounded-2xl border border-slate-200">' +
          '<table class="w-full text-left border-collapse">' +
            '<thead><tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500">' +
              '<th class="p-3">Cód. 768</th><th class="p-3">CIUO</th><th class="p-3">Riesgo</th><th class="p-3">Ocupación Homologada</th><th class="p-3">Nivel Autorización</th><th class="p-3">Desconcentración</th>' +
            '</tr></thead>' +
            '<tbody>' + rowsVolHtml + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
    }

    var listEmp = (st.dataset.ventaProactiva || []).filter(function (r) {
      if (st.filterAuth !== 'ALL' && r.authorization.indexOf(st.filterAuth) === -1) return false;
      if (st.filterRisk !== 'ALL' && String(r.riskClass) !== String(st.filterRisk)) return false;
      if (st.filterNicho !== 'ALL' && r.nicho2026 !== st.filterNicho) return false;
      if (st.filterSpecial === 'TWIN_PLENA' && (!r.plenaAlternatesInCiiu || r.plenaAlternatesInCiiu.length === 0)) return false;
      if (st.filterSpecial === 'MIN_PRIMA' && (!r.minPrimaRequired || r.minPrimaRequired <= 0)) return false;
      if (q) {
        var hay = (r.code768 + ' ' + r.ciiuCode + ' ' + r.description768 + ' ' + r.nicho2026 + ' ' + r.authorization).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var rowsEmpHtml = listEmp.slice(0, 100).map(function (r) {
      var twinHtml = '';
      if (r.plenaAlternatesInCiiu && r.plenaAlternatesInCiiu.length > 0 && r.authorization.indexOf('Plena') === -1) {
        var alt = r.plenaAlternatesInCiiu[0];
        twinHtml = '<div class="mt-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-800 font-semibold">' +
          '💡 <b>CIIU Mellizo con Autorización Plena:</b> El mismo CIIU ' + esc(r.ciiuCode) + ' tiene el código <b>' + esc(alt.code768) + '</b> (Clase ' + alt.riskClass + ') en <b>Autorización Plena</b>: ' + esc(alt.description768.slice(0, 95)) + '...' +
          ' <button onclick="window.selectActivityForSim(\'' + esc(alt.code768) + '\', true)" class="ml-1 underline font-black text-emerald-700 cursor-pointer">Usar ' + esc(alt.code768) + ' →</button>' +
        '</div>';
      }
      var excHtml = r.minPrimaRequired > 0
        ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 border border-amber-500/40">⚡ Tope: ' + window.formatCOP(r.minPrimaRequired) + '</span>'
        : '<span class="text-[11px] text-slate-400">Sin tope</span>';

      return '<tr class="border-b border-slate-100 hover:bg-teal-50/30 transition-colors">' +
        '<td class="p-3 font-mono font-black text-xs text-teal-700">' + esc(r.code768) + '<div class="text-[10px] text-slate-400">CIIU ' + esc(r.ciiuCode) + '</div></td>' +
        '<td class="p-3">' + riskBadgeHtml(r.riskClass) + '</td>' +
        '<td class="p-3 text-xs font-semibold text-slate-800 max-w-md">' + esc(r.description768) + twinHtml + '</td>' +
        '<td class="p-3"><span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">' + esc(r.nicho2026) + '</span></td>' +
        '<td class="p-3">' + authBadgeHtml(r.authorization) + '</td>' +
        '<td class="p-3">' + excHtml + '</td>' +
        '<td class="p-3 text-right">' +
          '<button onclick="window.selectActivityForSim(\'' + esc(r.code768) + '\', true)" class="px-3 py-1.5 rounded-full bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-extrabold text-[11px] shadow-2xs cursor-pointer whitespace-nowrap">Cotizar Prima →</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    return '<div class="wappy-card-surface bg-white/95 rounded-3xl border border-slate-200/80 shadow-xl p-5 sm:p-6">' +
      '<div class="flex flex-wrap items-center justify-between gap-3 mb-4">' +
        '<div class="flex flex-wrap items-center gap-2">' +
          '<button onclick="window.COLMENA_STATE.calificadorMode=\'empresas\';window.renderColmenaApp()" class="px-4 py-2 rounded-full text-xs font-extrabold bg-teal-600 text-white shadow-sm cursor-pointer">🏢 Empresas Decreto 768 (1.104)</button>' +
          '<button onclick="window.COLMENA_STATE.calificadorMode=\'independientes\';window.renderColmenaApp()" class="px-4 py-2 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">👷 Independientes / Voluntarios CIUO (322)</button>' +
          '<button onclick="window.COLMENA_STATE.filterSpecial=(window.COLMENA_STATE.filterSpecial===\'TWIN_PLENA\'?\'ALL\':\'TWIN_PLENA\');window.renderColmenaApp()" class="px-3.5 py-2 rounded-full text-xs font-extrabold border cursor-pointer ' + (st.filterSpecial === 'TWIN_PLENA' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30') + '">💡 Detector CIIU Mellizos con Plena (115)</button>' +
          '<button onclick="window.COLMENA_STATE.filterSpecial=(window.COLMENA_STATE.filterSpecial===\'MIN_PRIMA\'?\'ALL\':\'MIN_PRIMA\');window.renderColmenaApp()" class="px-3.5 py-2 rounded-full text-xs font-extrabold border cursor-pointer ' + (st.filterSpecial === 'MIN_PRIMA' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-amber-500/10 text-amber-800 border-amber-500/30') + '">⚡ Excepciones Prima $3M / $40M (23)</button>' +
        '</div>' +
        '<span class="text-xs font-bold text-slate-500">Mostrando ' + Math.min(100, listEmp.length) + ' de ' + listEmp.length + ' códigos</span>' +
      '</div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">' +
        '<input type="text" value="' + esc(st.searchQuery) + '" oninput="window.COLMENA_STATE.searchQuery=this.value;window.renderColmenaApp()" placeholder="Buscar código 768, CIIU 4 dígitos o actividad..." class="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold" />' +
        '<select onchange="window.COLMENA_STATE.filterAuth=this.value;window.renderColmenaApp()" class="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold">' +
          '<option value="ALL">Todos los Niveles CPS-A-26 (1.104)</option>' +
          '<option value="Plena" ' + (st.filterAuth === 'Plena' ? 'selected' : '') + '>🟢 Autorización Plena (425)</option>' +
          '<option value="Condicionada" ' + (st.filterAuth === 'Condicionada' ? 'selected' : '') + '>🟡 Autorización Condicionada (37)</option>' +
          '<option value="Especial" ' + (st.filterAuth === 'Especial' ? 'selected' : '') + '>🟠 Autorización Especial (129)</option>' +
          '<option value="Alta Siniestralidad" ' + (st.filterAuth === 'Alta Siniestralidad' ? 'selected' : '') + '>🔴 Alta Siniestralidad (513)</option>' +
        '</select>' +
        '<select onchange="window.COLMENA_STATE.filterRisk=this.value;window.renderColmenaApp()" class="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold">' +
          '<option value="ALL">Todas las Clases de Riesgo (I - V)</option>' +
          '<option value="1" ' + (st.filterRisk === '1' ? 'selected' : '') + '>Clase I — 0,522% (175)</option>' +
          '<option value="2" ' + (st.filterRisk === '2' ? 'selected' : '') + '>Clase II — 1,044% (239)</option>' +
          '<option value="3" ' + (st.filterRisk === '3' ? 'selected' : '') + '>Clase III — 2,436% (299)</option>' +
          '<option value="4" ' + (st.filterRisk === '4' ? 'selected' : '') + '>Clase IV — 4,350% (202)</option>' +
          '<option value="5" ' + (st.filterRisk === '5' ? 'selected' : '') + '>Clase V — 6,960% (189)</option>' +
        '</select>' +
        '<select onchange="window.COLMENA_STATE.filterNicho=this.value;window.renderColmenaApp()" class="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold">' +
          '<option value="ALL">Todos los Nichos Colmena 2026</option>' +
          '<option value="Manufacturas" ' + (st.filterNicho === 'Manufacturas' ? 'selected' : '') + '>Manufacturas (46)</option>' +
          '<option value="Actividades Inmobiliarias" ' + (st.filterNicho === 'Actividades Inmobiliarias' ? 'selected' : '') + '>Actividades Inmobiliarias (35)</option>' +
          '<option value="Logístico" ' + (st.filterNicho === 'Logístico' ? 'selected' : '') + '>Logístico (31)</option>' +
          '<option value="Comercio" ' + (st.filterNicho === 'Comercio' ? 'selected' : '') + '>Comercio (22)</option>' +
          '<option value="Hidrocarburos" ' + (st.filterNicho === 'Hidrocarburos' ? 'selected' : '') + '>Hidrocarburos (22)</option>' +
          '<option value="Construcción" ' + (st.filterNicho === 'Construcción' ? 'selected' : '') + '>Construcción (16)</option>' +
          '<option value="Educación" ' + (st.filterNicho === 'Educación' ? 'selected' : '') + '>Educación (12)</option>' +
          '<option value="Salud" ' + (st.filterNicho === 'Salud' ? 'selected' : '') + '>Salud (9)</option>' +
          '<option value="Intermediación Financiera" ' + (st.filterNicho === 'Intermediación Financiera' ? 'selected' : '') + '>Intermediación Financiera (8)</option>' +
          '<option value="Farmacéutico" ' + (st.filterNicho === 'Farmacéutico' ? 'selected' : '') + '>Farmacéutico (3)</option>' +
          '<option value="Otras Actividades" ' + (st.filterNicho === 'Otras Actividades' ? 'selected' : '') + '>Otras Actividades (900)</option>' +
        '</select>' +
      '</div>' +
      '<div class="overflow-x-auto rounded-2xl border border-slate-200">' +
        '<table class="w-full text-left border-collapse">' +
          '<thead><tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500">' +
            '<th class="p-3">Código 768</th><th class="p-3">Riesgo / Tasa</th><th class="p-3">Actividad Económica Decreto 768</th><th class="p-3">Nicho 2026</th><th class="p-3">Autorización Colmena</th><th class="p-3">Excepción Prima</th><th class="p-3 text-right">Acción</th>' +
          '</tr></thead>' +
          '<tbody>' + rowsEmpHtml + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  }

  window.__renderCalificadorTab = renderCalificadorTab;
})();
(function () {
  var h = window.__colmenaHelpers;
  var esc = h.esc;
  var authBadgeHtml = h.authBadgeHtml;
  var riskBadgeHtml = h.riskBadgeHtml;

  window.addSimCentro = function () {
    var sim = window.COLMENA_STATE.simulator;
    sim.centros.push({ id: Date.now(), nombre: 'Nuevo Centro Operativo', clase: 2, trabajadores: 10, ibc: 1800000 });
    window.renderColmenaApp();
  };

  window.removeSimCentro = function (idx) {
    var sim = window.COLMENA_STATE.simulator;
    if (sim.centros.length <= 1) return;
    sim.centros.splice(idx, 1);
    window.renderColmenaApp();
  };

  window.updateSimCentro = function (idx, field, val) {
    var c = window.COLMENA_STATE.simulator.centros[idx];
    if (!c) return;
    c[field] = field === 'nombre' ? val : Number(val) || 0;
    window.renderColmenaApp();
  };

  function renderSimuladorTab() {
    var sim = window.COLMENA_STATE.simulator;
    var calc = window.computeColmenaSimulation();
    var act = calc.activity || {};

    var centrosHtml = (sim.centros || []).map(function (c, i) {
      var rObj = window.ARL_RATES[c.clase] || window.ARL_RATES[1];
      var subPrima = Math.round((Number(c.trabajadores) || 0) * (Number(c.ibc) || 0) * rObj.rate);
      return '<div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-2">' +
        '<div class="sm:col-span-4"><label class="text-[10px] font-black text-slate-400 uppercase block">Centro de Trabajo</label>' +
          '<input type="text" value="' + esc(c.nombre) + '" onchange="window.updateSimCentro(' + i + ',\'nombre\',this.value)" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold" /></div>' +
        '<div class="sm:col-span-3"><label class="text-[10px] font-black text-slate-400 uppercase block">Clase de Riesgo ARL</label>' +
          '<select onchange="window.updateSimCentro(' + i + ',\'clase\',this.value)" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">' +
            '<option value="1" ' + (Number(c.clase) === 1 ? 'selected' : '') + '>Clase I (0,522%)</option>' +
            '<option value="2" ' + (Number(c.clase) === 2 ? 'selected' : '') + '>Clase II (1,044%)</option>' +
            '<option value="3" ' + (Number(c.clase) === 3 ? 'selected' : '') + '>Clase III (2,436%)</option>' +
            '<option value="4" ' + (Number(c.clase) === 4 ? 'selected' : '') + '>Clase IV (4,350%)</option>' +
            '<option value="5" ' + (Number(c.clase) === 5 ? 'selected' : '') + '>Clase V (6,960%)</option>' +
          '</select></div>' +
        '<div class="sm:col-span-2"><label class="text-[10px] font-black text-slate-400 uppercase block">N° Trabajadores</label>' +
          '<input type="number" min="1" value="' + esc(c.trabajadores) + '" onchange="window.updateSimCentro(' + i + ',\'trabajadores\',this.value)" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black" /></div>' +
        '<div class="sm:col-span-2"><label class="text-[10px] font-black text-slate-400 uppercase block">IBC Promedio ($)</label>' +
          '<input type="number" step="50000" value="' + esc(c.ibc) + '" onchange="window.updateSimCentro(' + i + ',\'ibc\',this.value)" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold" /></div>' +
        '<div class="sm:col-span-1 text-right"><label class="text-[10px] font-black text-slate-400 uppercase block">Prima/Mes</label>' +
          '<div class="text-xs font-black text-teal-700">' + window.formatCOP(subPrima) + '</div>' +
          (sim.centros.length > 1 ? '<button onclick="window.removeSimCentro(' + i + ')" class="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer">Quitar</button>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="grid grid-cols-1 lg:grid-cols-12 gap-5">' +
      '<div class="lg:col-span-7 wappy-card-surface bg-white/95 rounded-3xl border border-slate-200/80 shadow-xl p-5 sm:p-6">' +
        '<h3 class="font-display font-black text-lg text-slate-900 mb-1">1. Datos de la Empresa Prospecto & Centros de Trabajo</h3>' +
        '<p class="text-xs text-slate-500 mb-4">Cotiza aportes ARL por centro de trabajo y valida los topes de excepción CPS-A-26 V16 ($3M Construcción/Vigilancia y $40M Aéreo).</p>' +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">' +
          '<div><label class="text-[10px] font-black uppercase text-slate-500">Razón Social Empresa</label>' +
            '<input type="text" value="' + esc(sim.companyName) + '" onchange="window.COLMENA_STATE.simulator.companyName=this.value;window.renderColmenaApp()" placeholder="Ej: Constructora Antioquia SAS" class="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold" /></div>' +
          '<div><label class="text-[10px] font-black uppercase text-slate-500">NIT</label>' +
            '<input type="text" value="' + esc(sim.companyNit) + '" onchange="window.COLMENA_STATE.simulator.companyNit=this.value;window.renderColmenaApp()" placeholder="900.123.456-7" class="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold" /></div>' +
          '<div><label class="text-[10px] font-black uppercase text-slate-500">ARL Actual / Ciudad</label>' +
            '<input type="text" value="' + esc(sim.currentArl) + '" onchange="window.COLMENA_STATE.simulator.currentArl=this.value;window.renderColmenaApp()" placeholder="SURA / Positiva / Bolívar" class="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold" /></div>' +
        '</div>' +
        '<div class="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 mb-4 flex flex-wrap items-center justify-between gap-2">' +
          '<div>' +
            '<div class="text-[10px] font-black uppercase text-teal-700">Actividad Principal Decreto 768 Seleccionada</div>' +
            '<div class="text-xs font-black text-slate-900">' + esc(act.code768 || sim.code768) + ' — ' + esc((act.description768 || '').slice(0, 95)) + '</div>' +
            '<div class="mt-1 flex flex-wrap items-center gap-2">' + authBadgeHtml(calc.effectiveAuth) + ' <span class="text-[11px] font-bold text-slate-600">Nicho: ' + esc(act.nicho2026 || 'General') + '</span></div>' +
          '</div>' +
          '<button onclick="window.switchColmenaTab(\'calificador\')" class="px-3 py-1.5 rounded-full bg-white text-teal-800 border border-teal-300 text-[11px] font-extrabold cursor-pointer">Cambiar Código 768</button>' +
        '</div>' +
        (calc.complianceAlert ? '<div class="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs font-bold text-amber-900 mb-4">⚡ ' + esc(calc.complianceAlert) + '</div>' : '') +
        '<div class="flex items-center justify-between mb-2">' +
          '<span class="text-xs font-black uppercase text-slate-600">Desglose por Centros de Trabajo</span>' +
          '<button onclick="window.addSimCentro()" class="px-3 py-1 rounded-full bg-teal-600 text-white text-[11px] font-extrabold cursor-pointer">+ Agregar Centro</button>' +
        '</div>' +
        centrosHtml +
      '</div>' +
      '<div class="lg:col-span-5 wappy-card-surface bg-white/95 rounded-3xl border border-slate-200/80 shadow-xl p-5 sm:p-6 flex flex-col justify-between">' +
        '<div>' +
          '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[10px] font-black uppercase mb-2">💰 Rentabilidad WAPPY LTDA · Intermediación ARL</span>' +
          '<h3 class="font-display font-black text-xl text-slate-900 mb-4">Resumen Financiero & Retorno SST</h3>' +
          '<div class="grid grid-cols-2 gap-3 mb-4">' +
            '<div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200"><div class="text-[10px] font-black uppercase text-slate-400">Trabajadores Totales</div><div class="font-display font-black text-2xl text-slate-900">' + calc.totalWorkers + '</div></div>' +
            '<div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200"><div class="text-[10px] font-black uppercase text-slate-400">IBC Nómina Mensual</div><div class="font-display font-black text-lg text-slate-900">' + window.formatCOP(calc.totalNominaMensual) + '</div></div>' +
            '<div class="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30"><div class="text-[10px] font-black uppercase text-teal-700">Prima ARL Mensual</div><div class="font-display font-black text-xl text-teal-800">' + window.formatCOP(calc.primaMensual) + '</div></div>' +
            '<div class="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30"><div class="text-[10px] font-black uppercase text-teal-700">Prima ARL Anual</div><div class="font-display font-black text-xl text-teal-800">' + window.formatCOP(calc.primaAnual) + '</div></div>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-3 mb-4">' +
            '<div><label class="text-[10px] font-black uppercase text-slate-500">% Comisión Intermediación WAPPY</label>' +
              '<input type="number" min="1" max="25" value="' + esc(sim.comisionPct) + '" onchange="window.COLMENA_STATE.simulator.comisionPct=this.value;window.renderColmenaApp()" class="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-black" /></div>' +
            '<div><label class="text-[10px] font-black uppercase text-slate-500">% Reinversión SST / Licencia WAPPY</label>' +
              '<input type="number" min="0" max="80" value="' + esc(sim.reinversionPct) + '" onchange="window.COLMENA_STATE.simulator.reinversionPct=this.value;window.renderColmenaApp()" class="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-black" /></div>' +
          '</div>' +
          '<div class="p-4 rounded-2xl bg-slate-900 text-white space-y-2 mb-4">' +
            '<div class="flex justify-between text-xs"><span class="text-slate-300">Comisión Anual Bruta WAPPY LTDA:</span><span class="font-black text-[#c7f303]">' + window.formatCOP(calc.comisionAnualWappy) + '/año</span></div>' +
            '<div class="flex justify-between text-xs"><span class="text-slate-300">Bolsa Reinversión SST / Wappy IA Cliente:</span><span class="font-black text-teal-300">' + window.formatCOP(calc.bolsaSstCliente) + '/año</span></div>' +
            '<div class="border-t border-slate-700 pt-2 flex justify-between text-sm"><span class="font-bold">Margen Neto WAPPY LTDA:</span><span class="font-display font-black text-amber-300">' + window.formatCOP(calc.utilidadNetaWappy) + '/año</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="flex flex-wrap gap-2.5">' +
          '<button onclick="window.saveCurrentSimToCrm(\'cotizacion\')" class="flex-1 px-4 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-display font-extrabold text-xs cursor-pointer">📥 Guardar en Pipeline CRM</button>' +
          '<button onclick="window.switchColmenaTab(\'documentos\')" class="flex-1 px-4 py-2.5 rounded-full bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-extrabold text-xs cursor-pointer">📄 Generar Propuesta / Ficha A4 →</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  window.__renderSimuladorTab = renderSimuladorTab;
})();
(function () {
  var h = window.__colmenaHelpers;
  var esc = h.esc;
  var authBadgeHtml = h.authBadgeHtml;

  function renderRadarTab() {
    var rd = window.COLMENA_STATE.radarData || {};
    var prospects = rd.prospects || [];
    var rows = prospects.map(function (p, i) {
      return '<tr class="border-b border-slate-100 hover:bg-teal-50/30">' +
        '<td class="p-3"><div class="font-bold text-xs text-slate-900">' + esc(p.companyName) + '</div><div class="text-[10px] text-slate-400">NIT: ' + esc(p.nit || 'S/N') + ' · ' + esc(p.city || 'Colombia') + '</div></td>' +
        '<td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-700 border border-indigo-500/30">' + esc(p.source) + '</span></td>' +
        '<td class="p-3 text-xs font-semibold text-slate-700">' + esc(p.sector || p.economicActivity || 'General') + '</td>' +
        '<td class="p-3 font-black text-xs text-slate-800">' + (p.workersCount || 0) + '</td>' +
        '<td class="p-3 font-mono text-xs font-bold text-teal-700">' + esc(p.matchedCode768 || 'Pendiente') + '<div class="text-[10px] text-slate-500">' + esc(p.nicho2026 || '') + '</div></td>' +
        '<td class="p-3">' + authBadgeHtml(p.authorizationLevel || 'Por calificar') + '</td>' +
        '<td class="p-3 font-black text-xs text-emerald-700">' + window.formatCOP(p.estimatedAnnualCommission || 0) + '/año</td>' +
        '<td class="p-3 text-right">' +
          '<button onclick="window.loadRadarProspectToSim(' + i + ',\'simulador\')" class="px-3 py-1.5 rounded-full bg-[#c7f303] text-[#0e1300] font-display font-extrabold text-[11px] cursor-pointer">Simular & Cotizar →</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    return '<div class="wappy-card-surface bg-white/95 rounded-3xl border border-slate-200/80 shadow-xl p-5 sm:p-6">' +
      '<div class="flex flex-wrap items-center justify-between gap-3 mb-4">' +
        '<div>' +
          '<h3 class="font-display font-black text-lg text-slate-900">📡 Radar Interno: Empresas en Somos SST + Matriz IPVR + Wappy Studio</h3>' +
          '<p class="text-xs text-slate-500">Cruza automáticamente todas las empresas creadas en el ecosistema WAPPY contra el archivo CPS-A-26 V16 de ARL Colmena.</p>' +
        '</div>' +
        '<div class="flex flex-wrap gap-2 text-xs font-black">' +
          '<span class="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">🟢 Plena: ' + (rd.plenaCount || 0) + '</span>' +
          '<span class="px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30">🟡 Condicionada: ' + (rd.condicionadaCount || 0) + '</span>' +
          '<span class="px-3 py-1.5 rounded-full bg-orange-500/15 text-orange-800 border border-orange-500/30">🟠 Especial: ' + (rd.especialCount || 0) + '</span>' +
        '</div>' +
      '</div>' +
      (prospects.length === 0
        ? '<div class="p-8 text-center text-xs text-slate-500 font-semibold">No se encontraron empresas registradas aún o usa el Simulador para agregar un prospecto directo.</div>'
        : '<div class="overflow-x-auto rounded-2xl border border-slate-200"><table class="w-full text-left border-collapse">' +
            '<thead><tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500">' +
              '<th class="p-3">Empresa / NIT</th><th class="p-3">Origen WAPPY</th><th class="p-3">Sector / Actividad</th><th class="p-3">Trab.</th><th class="p-3">Cód. 768 Sugerido</th><th class="p-3">Estado Colmena</th><th class="p-3">Comisión Est. WAPPY</th><th class="p-3 text-right">Acción</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>') +
    '</div>';
  }

  function renderCrmTab() {
    var deals = window.COLMENA_STATE.deals || [];
    var stages = [
      { id: 'prospeccion', title: '1. Prospección', badge: 'bg-slate-200 text-slate-800' },
      { id: 'cotizacion', title: '2. En Cotización', badge: 'bg-sky-500/20 text-sky-800' },
      { id: 'radicado_colmena', title: '3. Radicado Colmena', badge: 'bg-amber-500/20 text-amber-800' },
      { id: 'aprobado_afiliado', title: '4. Afiliado Ganado', badge: 'bg-emerald-500/20 text-emerald-800' },
      { id: 'requiere_especial', title: '5. Autorización Especial', badge: 'bg-orange-500/20 text-orange-800' },
    ];
    var colsHtml = stages.map(function (stObj) {
      var items = deals.filter(function (d) { return (d.stage || 'prospeccion') === stObj.id; });
      var cards = items.map(function (d) {
        return '<div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs mb-2.5">' +
          '<div class="flex items-start justify-between gap-2">' +
            '<div class="font-bold text-xs text-slate-900">' + esc(d.companyName) + '</div>' +
            '<button onclick="window.deleteColmenaDeal(\'' + esc(d._id) + '\')" class="text-[11px] text-rose-500 hover:underline cursor-pointer">✕</button>' +
          '</div>' +
          '<div class="text-[10px] text-slate-500 mt-0.5">NIT: ' + esc(d.nit || 'S/N') + ' · Cód 768: <b>' + esc(d.code768 || '-') + '</b> (Riesgo ' + (d.riskClass || 1) + ')</div>' +
          '<div class="mt-2">' + authBadgeHtml(d.authorizationLevel) + '</div>' +
          '<div class="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[11px]">' +
            '<span class="text-slate-500">Prima Anual:</span><span class="font-black text-slate-800">' + window.formatCOP(d.estimatedAnnualPrima || 0) + '</span>' +
          '</div>' +
          '<div class="flex justify-between text-[11px]">' +
            '<span class="text-slate-500">Comisión WAPPY:</span><span class="font-black text-emerald-700">' + window.formatCOP(d.estimatedAnnualCommission || 0) + '</span>' +
          '</div>' +
          '<select onchange="window.updateDealStage(\'' + esc(d._id) + '\', this.value)" class="mt-2 w-full px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold">' +
            stages.map(function (s2) { return '<option value="' + s2.id + '" ' + (s2.id === d.stage ? 'selected' : '') + '>Mover a: ' + esc(s2.title) + '</option>'; }).join('') +
          '</select>' +
        '</div>';
      }).join('');
      return '<div class="p-3.5 rounded-3xl bg-slate-50/90 border border-slate-200/80">' +
        '<div class="flex items-center justify-between mb-3">' +
          '<span class="font-display font-black text-xs text-slate-800">' + esc(stObj.title) + '</span>' +
          '<span class="px-2 py-0.5 rounded-full text-[10px] font-black ' + stObj.badge + '">' + items.length + '</span>' +
        '</div>' +
        (cards || '<div class="p-4 text-center text-[11px] text-slate-400">Sin negocios en esta etapa</div>') +
      '</div>';
    }).join('');

    return '<div class="wappy-card-surface bg-white/95 rounded-3xl border border-slate-200/80 shadow-xl p-5 sm:p-6">' +
      '<div class="flex flex-wrap items-center justify-between gap-3 mb-4">' +
        '<div><h3 class="font-display font-black text-lg text-slate-900">🗂️ Pipeline CRM de Intermediación WAPPY LTDA × ARL Colmena</h3>' +
        '<p class="text-xs text-slate-500">Control de negocios en curso, primas proyectadas y comisiones de intermediación.</p></div>' +
        '<button onclick="window.switchColmenaTab(\'simulador\')" class="px-4 py-2 rounded-full bg-[#c7f303] text-[#0e1300] font-display font-extrabold text-xs cursor-pointer">+ Nuevo Prospecto desde Simulador</button>' +
      '</div>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">' + colsHtml + '</div>' +
    '</div>';
  }

  function renderDocumentosTab() {
    var sim = window.COLMENA_STATE.simulator;
    var db = window.COLMENA_STATE.docBuilder;
    var calc = window.computeColmenaSimulation();
    var act = calc.activity || {};
    var today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    var titleMap = {
      propuesta_comercial: 'PROPUESTA EJECUTIVA DE INTERMEDIACIÓN ARL COLMENA + ECOSISTEMA WAPPY IA',
      ficha_suscripcion: 'FICHA TÉCNICA DE SUSCRIPCIÓN PROACTIVA CPS-A-26 V16 — ARL COLMENA',
      carta_intermediacion: 'CARTA DE NOMBRAMIENTO DE INTERMEDIARIO DE SEGUROS ARL — WAPPY LTDA',
    };

    return '<div class="space-y-4">' +
      '<div class="no-print wappy-card-surface bg-white/95 rounded-3xl border border-slate-200/80 shadow-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">' +
        '<div class="flex flex-wrap items-center gap-2">' +
          '<button onclick="window.COLMENA_STATE.docBuilder.docType=\'propuesta_comercial\';window.renderColmenaApp()" class="px-3.5 py-2 rounded-full text-xs font-extrabold cursor-pointer ' + (db.docType === 'propuesta_comercial' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700') + '">1. Propuesta Comercial WAPPY×Colmena</button>' +
          '<button onclick="window.COLMENA_STATE.docBuilder.docType=\'ficha_suscripcion\';window.renderColmenaApp()" class="px-3.5 py-2 rounded-full text-xs font-extrabold cursor-pointer ' + (db.docType === 'ficha_suscripcion' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700') + '">2. Ficha Técnica Suscripción CPS-A-26 V16</button>' +
          '<button onclick="window.COLMENA_STATE.docBuilder.docType=\'carta_intermediacion\';window.renderColmenaApp()" class="px-3.5 py-2 rounded-full text-xs font-extrabold cursor-pointer ' + (db.docType === 'carta_intermediacion' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700') + '">3. Carta Designación Intermediario WAPPY LTDA</button>' +
        '</div>' +
        '<div class="flex flex-wrap items-center gap-2">' +
          '<button onclick="window.generateAiExecutiveText()" class="px-4 py-2 rounded-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-display font-extrabold text-xs cursor-pointer">' + (db.isGeneratingAi ? '⏳ Redactando con IA...' : '✨ Redactar Sustentación con IA') + '</button>' +
          '<button onclick="window.print()" class="px-4 py-2 rounded-full bg-[#c7f303] text-[#0e1300] font-display font-extrabold text-xs cursor-pointer">🖨️ Imprimir / Guardar PDF A4</button>' +
        '</div>' +
      '</div>' +
      '<div id="a4DocumentPaper" class="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl max-w-4xl mx-auto p-8 sm:p-12">' +
        '<div class="flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-6">' +
          '<div>' +
            '<div class="text-[11px] font-black uppercase tracking-widest text-teal-700">WAPPY LTDA · NIT 901.437.310-3 · ÁREA DE INTERMEDIACIÓN ARL</div>' +
            '<h2 class="font-display font-black text-xl text-slate-900 mt-1">' + esc(titleMap[db.docType]) + '</h2>' +
          '</div>' +
          '<div class="text-right text-xs text-slate-500 font-semibold"><div>Fecha: ' + esc(today) + '</div><div>Anexo: CPS-A-26 V16 (2026)</div></div>' +
        '</div>' +
        '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-xs">' +
          '<div class="p-3 rounded-xl bg-slate-50 border border-slate-200"><div class="text-[10px] font-bold text-slate-400 uppercase">Razón Social</div><div class="font-black text-slate-900">' + esc(sim.companyName || 'Empresa Prospecto') + '</div></div>' +
          '<div class="p-3 rounded-xl bg-slate-50 border border-slate-200"><div class="text-[10px] font-bold text-slate-400 uppercase">NIT / Ciudad</div><div class="font-black text-slate-900">' + esc(sim.companyNit || 'Por definir') + ' · ' + esc(sim.city) + '</div></div>' +
          '<div class="p-3 rounded-xl bg-slate-50 border border-slate-200"><div class="text-[10px] font-bold text-slate-400 uppercase">Código Decreto 768</div><div class="font-black text-teal-700">' + esc(act.code768 || sim.code768) + ' (Riesgo ' + (act.riskClass || 1) + ')</div></div>' +
          '<div class="p-3 rounded-xl bg-slate-50 border border-slate-200"><div class="text-[10px] font-bold text-slate-400 uppercase">Calificación CPS-A-26</div><div class="font-black text-emerald-700">' + esc(calc.effectiveAuth) + '</div></div>' +
        '</div>' +
        '<div class="mb-6 p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs leading-relaxed">' +
          '<div class="font-black text-teal-900 uppercase mb-1">Actividad Económica Decreto 768 & Nicho Colmena 2026</div>' +
          '<div><b>Descripción Oficial:</b> ' + esc(act.description768 || 'Actividad empresarial registrada.') + '</div>' +
          '<div class="mt-1"><b>Nicho Estratégico 2026:</b> ' + esc(act.nicho2026 || 'General') + ' · <b>Trabajadores Cotizados:</b> ' + calc.totalWorkers + ' · <b>Prima ARL Mensual:</b> ' + window.formatCOP(calc.primaMensual) + ' (' + window.formatCOP(calc.primaAnual) + '/año).</div>' +
        '</div>' +
        '<div class="mb-6">' +
          '<div class="text-xs font-black uppercase text-slate-700 mb-2">Sustentación Técnica & Propuesta de Valor (WAPPY LTDA × ARL Colmena)</div>' +
          '<div class="p-4 rounded-2xl border border-slate-200 bg-white text-xs leading-relaxed whitespace-pre-line text-slate-800">' +
            esc(db.aiObservation || (
              db.docType === 'carta_intermediacion'
                ? 'Señores\nCOLMENA SEGUROS RIESGOS LABORALES S.A.\nCiudad\n\nPor medio de la presente, en calidad de Representante Legal de ' + (sim.companyName || 'LA EMPRESA') + ' identificada con NIT ' + (sim.companyNit || '________') + ', designamos formalmente a WAPPY LTDA (NIT 901.437.310-3) como nuestro Intermediario de Seguros de Riesgos Laborales ante ARL Colmena.\n\nEsta designación incluye el acompañamiento técnico en prevención de riesgos laborales, implementación del ecosistema WAPPY IA (+20 agentes especialistas SG-SST, Matriz IPEVR GTC-45 y gestión preventiva Decreto 1072 de 2015).'
                : '1. VIABILIDAD DE SUSCRIPCIÓN (CPS-A-26 V16): La empresa ' + (sim.companyName || 'Prospecto') + ' se clasifica bajo el código Decreto 768 ' + (act.code768 || sim.code768) + ' con nivel "' + calc.effectiveAuth + '" y prima anual proyectada de ' + window.formatCOP(calc.primaAnual) + '.\n\n2. VALOR AGREGADO WAPPY LTDA (INTERMEDIACIÓN + TECNOLOGÍA IA): Al afiliarse o trasladarse a ARL Colmena con la intermediación de WAPPY LTDA, la empresa recibe sin costo adicional el acceso al ecosistema tecnológico WAPPY IA (Somos SST, Matriz IPEVR GTC-45, Tenshi Voice y control de accidentalidad), respaldado con un presupuesto estimado de reinversión preventiva de ' + window.formatCOP(calc.bolsaSstCliente) + '/año.'
            )) +
          '</div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-slate-200 text-xs">' +
          '<div><div class="font-black text-slate-900">WAPPY LTDA · Área de Intermediación ARL</div><div class="text-slate-500">NIT 901.437.310-3 · Medellín, Colombia</div></div>' +
          '<div><div class="font-black text-slate-900">Aceptación Representante Legal Cliente</div><div class="text-slate-500">' + esc(sim.companyName || 'Firma y Sello Empresa') + '</div></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  window.renderColmenaApp = function () {
    var root = document.getElementById('wappyColmenaRoot');
    if (!root) return;
    var st = window.COLMENA_STATE;
    var sum = st.dataset.summary || { totalActivities: 1104, totalVolunteerOccupations: 322, totalTwinCiiuWithPlenaAlternate: 115 };
    var user = st.user || {};
    var firstName = (user.name || user.username || 'Admin').split(' ')[0];

    var tabContent = '';
    if (st.activeTab === 'calificador') tabContent = window.__renderCalificadorTab();
    else if (st.activeTab === 'simulador') tabContent = window.__renderSimuladorTab();
    else if (st.activeTab === 'radar') tabContent = renderRadarTab();
    else if (st.activeTab === 'crm') tabContent = renderCrmTab();
    else tabContent = renderDocumentosTab();

    root.innerHTML =
      '<header class="no-print sticky top-2 sm:top-3 z-50 px-2.5 sm:px-6 mb-4">' +
        '<div class="max-w-7xl mx-auto bg-white/95 backdrop-blur-md border border-white/80 shadow-md rounded-full px-3 sm:px-6 py-2 flex items-center justify-between gap-3 h-[58px]">' +
          '<a href="/" class="flex items-center gap-2.5 shrink-0">' +
            '<img src="' + (window.__WAPPY_LOGO_B64__ || '/assets/logo.svg') + '" alt="WAPPY" class="w-9 h-9 rounded-full object-cover shadow-xs" />' +
            '<div><div class="font-display font-black text-base sm:text-lg leading-none text-slate-900">WAPPY <span class="text-amber-600">COLMENA</span></div>' +
            '<span class="text-[9px] font-black uppercase tracking-wider text-amber-700">🔒 EXCLUSIVO ADMIN · CPS-A-26 V16</span></div>' +
          '</a>' +
          '<nav class="hidden lg:flex items-center gap-1 text-xs font-bold">' +
            '<button onclick="window.switchColmenaTab(\'calificador\')" class="px-3.5 py-1.5 rounded-full cursor-pointer ' + (st.activeTab === 'calificador' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100') + '">🔍 Calificador 768 (' + sum.totalActivities + ')</button>' +
            '<button onclick="window.switchColmenaTab(\'simulador\')" class="px-3.5 py-1.5 rounded-full cursor-pointer ' + (st.activeTab === 'simulador' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100') + '">💰 Simulador Prima & Comisión</button>' +
            '<button onclick="window.switchColmenaTab(\'radar\')" class="px-3.5 py-1.5 rounded-full cursor-pointer ' + (st.activeTab === 'radar' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100') + '">📡 Radar Somos SST (' + (st.radarData.totalProspects || 0) + ')</button>' +
            '<button onclick="window.switchColmenaTab(\'crm\')" class="px-3.5 py-1.5 rounded-full cursor-pointer ' + (st.activeTab === 'crm' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100') + '">🗂️ Pipeline CRM (' + (st.deals.length || 0) + ')</button>' +
            '<button onclick="window.switchColmenaTab(\'documentos\')" class="px-3.5 py-1.5 rounded-full cursor-pointer ' + (st.activeTab === 'documentos' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100') + '">📄 Propuestas & Cartas A4</button>' +
          '</nav>' +
          '<div class="flex items-center gap-2 shrink-0">' +
            '<button onclick="window.toggleWappyDarkMode()" class="w-9 h-9 rounded-full bg-slate-500/10 border border-slate-300/60 flex items-center justify-center cursor-pointer"><span id="themeToggleIconNav">🌙</span></button>' +
            '<a id="navCtaEnterWappy" href="/c/new" class="inline-flex items-center gap-2 bg-[#c7f303] hover:bg-[#b8e202] text-[#0e1300] font-display font-extrabold text-xs px-4 py-2 rounded-full shadow-xs cursor-pointer"><span>Entrar a WAPPY (' + esc(firstName) + ') →</span></a>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<main class="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-12">' +
        '<section class="no-print wappy-card-surface bg-white/90 backdrop-blur-xl rounded-3xl border border-white/80 shadow-xl p-5 sm:p-7 mb-5">' +
          '<div class="flex flex-wrap items-center justify-between gap-4">' +
            '<div>' +
              '<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[11px] font-black uppercase mb-2">🛡️ Consola Ejecutiva de Intermediación · WAPPY LTDA × ARL Colmena (Venta Proactiva 2026)</div>' +
              '<h1 class="font-display font-black text-2xl sm:text-4xl tracking-tight"><span class="wappy-hero-gradient-text">Motor de Suscripción & Venta Proactiva ARL Colmena</span></h1>' +
              '<p class="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">Automatiza la calificación de las <b>1.104 actividades Decreto 768</b> y <b>322 ocupaciones independientes</b> del archivo oficial <b>CPS-A-26 V16</b>, detecta códigos CIIU mellizos con Autorización Plena y calcula la comisión de intermediación de WAPPY LTDA.</p>' +
            '</div>' +
            '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">' +
              '<div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center"><div class="text-[10px] font-black uppercase text-emerald-700">Autorización Plena</div><div class="font-display font-black text-xl text-emerald-800">425</div></div>' +
              '<div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center"><div class="text-[10px] font-black uppercase text-amber-800">CIIU Mellizos Plena</div><div class="font-display font-black text-xl text-amber-800">115</div></div>' +
              '<div class="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center"><div class="text-[10px] font-black uppercase text-teal-700">Independientes SÍ</div><div class="font-display font-black text-xl text-teal-800">151 / 322</div></div>' +
              '<div class="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center"><div class="text-[10px] font-black uppercase text-indigo-700">Radar Somos SST</div><div class="font-display font-black text-xl text-indigo-800">' + (st.radarData.totalProspects || 0) + '</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">' +
            '<div onclick="window.switchColmenaTab(\'calificador\')" class="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 cursor-pointer transition-all">' +
              '<div class="text-[10px] font-black uppercase text-teal-700">Paso 1 · Calificar Actividad</div>' +
              '<div class="text-xs font-bold text-slate-900 mt-0.5">Busca el CIIU o código 768 y mira si tiene 🟢 Autorización Plena o código mellizo.</div>' +
            '</div>' +
            '<div onclick="window.switchColmenaTab(\'radar\')" class="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 cursor-pointer transition-all">' +
              '<div class="text-[10px] font-black uppercase text-indigo-700">Paso 2 · Radar Clientes WAPPY</div>' +
              '<div class="text-xs font-bold text-slate-900 mt-0.5">Mira las ' + (st.radarData.totalProspects || 0) + ' empresas de Somos SST / Matriz IPVR ya calificadas para Colmena.</div>' +
            '</div>' +
            '<div onclick="window.switchColmenaTab(\'simulador\')" class="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 cursor-pointer transition-all">' +
              '<div class="text-[10px] font-black uppercase text-amber-700">Paso 3 · Cotizar Prima & Comisión</div>' +
              '<div class="text-xs font-bold text-slate-900 mt-0.5">Calcula aporte ARL mensual/anual, topes ($3M/$40M) y comisión para WAPPY LTDA.</div>' +
            '</div>' +
            '<div onclick="window.switchColmenaTab(\'documentos\')" class="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 cursor-pointer transition-all">' +
              '<div class="text-[10px] font-black uppercase text-emerald-700">Paso 4 · Propuesta & Carta A4</div>' +
              '<div class="text-xs font-bold text-slate-900 mt-0.5">Genera con IA la Propuesta Comercial, Ficha CPS-A-26 o Carta de Intermediario.</div>' +
            '</div>' +
          '</div>' +
          '<div class="flex lg:hidden flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-200">' +
            '<button onclick="window.switchColmenaTab(\'calificador\')" class="px-3 py-1.5 rounded-full text-xs font-bold ' + (st.activeTab === 'calificador' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700') + '">🔍 Calificador</button>' +
            '<button onclick="window.switchColmenaTab(\'simulador\')" class="px-3 py-1.5 rounded-full text-xs font-bold ' + (st.activeTab === 'simulador' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700') + '">💰 Simulador</button>' +
            '<button onclick="window.switchColmenaTab(\'radar\')" class="px-3 py-1.5 rounded-full text-xs font-bold ' + (st.activeTab === 'radar' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700') + '">📡 Radar SST</button>' +
            '<button onclick="window.switchColmenaTab(\'crm\')" class="px-3 py-1.5 rounded-full text-xs font-bold ' + (st.activeTab === 'crm' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700') + '">🗂️ CRM</button>' +
            '<button onclick="window.switchColmenaTab(\'documentos\')" class="px-3 py-1.5 rounded-full text-xs font-bold ' + (st.activeTab === 'documentos' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700') + '">📄 Documentos A4</button>' +
          '</div>' +
        '</section>' +
        tabContent +
      '</main>' +
      '<footer class="no-print wappy-home-footer">' +
        '<div class="foot-wrap"><div class="foot-top"><div class="foot-brand">' +
          '<div class="font-display font-black text-2xl text-slate-900">WAPPY<span class="text-emerald-600">IA</span> · <span class="text-amber-700">ARL COLMENA</span></div>' +
          '<p class="foot-desc">Plataforma Interna de Intermediación ARL y Venta Proactiva CPS-A-26 V16 (2026) — Exclusivo Administradores WAPPY LTDA.</p>' +
        '</div></div><div class="foot-word">WAPPY</div>' +
        '<div class="foot-bottom"><span>© 2026 WAPPY LTDA · NIT 901437310-3 · Medellín, Colombia.</span><div class="foot-legal"><a href="/">Inicio</a><a href="/aplicaciones">Wappy Apps</a></div></div></div>' +
      '</footer>';
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.initColmenaApp();
  });
})();
