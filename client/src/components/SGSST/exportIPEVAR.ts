import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MatrixRow, getInterpretacionNP } from './MatrizIPEVARConstants';

function renderDashboardChartsCanvasBase64(rows: MatrixRow[]): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    const W = 1520;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    const total = rows.length || 1;
    const catMap: Record<string, { count: number; sumNR: number; maxNR: number }> = {};
    const heatmap: Record<string, number> = {
      '100_MA': 0, '100_A': 0, '100_M': 0, '100_B': 0,
      '60_MA': 0,  '60_A': 0,  '60_M': 0,  '60_B': 0,
      '25_MA': 0,  '25_A': 0,  '25_M': 0,  '25_B': 0,
      '10_MA': 0,  '10_A': 0,  '10_M': 0,  '10_B': 0,
    };

    const emptyVal = (v?: string) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', 'n/a', ''].includes(String(v).toLowerCase().trim());
    let ctrlFuente = 0, ctrlMedio = 0, ctrlIndividuo = 0;
    let sumNRInicial = 0, sumNRResidual = 0;

    rows.forEach((r) => {
      const cat = (r.peligro_clasificacion || 'Condiciones de seguridad').trim();
      if (!catMap[cat]) catMap[cat] = { count: 0, sumNR: 0, maxNR: 0 };
      const nr = Number(r.nr) || 0;
      catMap[cat].count++;
      catMap[cat].sumNR += nr;
      if (nr > catMap[cat].maxNR) catMap[cat].maxNR = nr;

      const np = Number(r.np) || 0;
      const ncRaw = Number(r.nc) || 10;
      const ncKey = ncRaw >= 100 ? '100' : ncRaw >= 60 ? '60' : ncRaw >= 25 ? '25' : '10';
      const npKey = np >= 24 ? 'MA' : np >= 10 ? 'A' : np >= 6 ? 'M' : 'B';
      const hmKey = `${ncKey}_${npKey}`;
      if (heatmap[hmKey] !== undefined) heatmap[hmKey]++;

      if (!emptyVal(r.controles_fuente) || !emptyVal(r.medida_eliminacion) || !emptyVal(r.medida_sustitucion)) ctrlFuente++;
      if (!emptyVal(r.controles_medio) || !emptyVal(r.medida_ingenieria)) ctrlMedio++;
      if (!emptyVal(r.controles_individuo) || !emptyVal(r.medida_administrativa) || !emptyVal(r.medida_eppu)) ctrlIndividuo++;

      sumNRInicial += nr;
      const frMatch = String(r.factores_reduccion || '').match(/(\d{1,3})\s*%/);
      const frPct = frMatch ? Math.min(98, Math.max(10, parseInt(frMatch[1], 10))) : 75;
      sumNRResidual += Math.max(10, Math.round(nr * (1 - frPct / 100)));
    });

    const catList = Object.entries(catMap)
      .map(([name, d]) => ({ name, count: d.count, avgNR: Math.round(d.sumNR / d.count), maxNR: d.maxNR, pct: Math.round((d.count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    const palette = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1'];

    const cards = [
      { x: 20, y: 20, w: 730, h: 510, title: '1. DISTRIBUCIÓN DE PELIGROS POR CLASIFICACIÓN (GTC 45)', subtitle: 'Proporción porcentual y número de registros por familia de peligro' },
      { x: 770, y: 20, w: 730, h: 510, title: '2. MATRIZ TÉRMICA GTC 45 (MAPA DE CALOR NC × NP)', subtitle: 'Ubicación de riesgos según Nivel de Consecuencia y Probabilidad' },
      { x: 20, y: 550, w: 730, h: 510, title: '3. PERFIL DE SEVERIDAD (NR PROMEDIO POR TIPO DE PELIGRO)', subtitle: 'Nivel de Riesgo promedio (NR = NP × NC) semaforizado según GTC 45' },
      { x: 770, y: 550, w: 730, h: 510, title: '4. COBERTURA DE CONTROLES Y MITIGACIÓN RESIDUAL (ANEXO E)', subtitle: 'Jerarquía de barreras (Art. 2.2.4.6.24) y reducción NR Inicial vs Residual' },
    ];

    cards.forEach((c) => {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      roundRect(c.x, c.y, c.w, c.h, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f766e';
      roundRect(c.x, c.y, c.w, 58, 20);
      ctx.fill();
      ctx.fillRect(c.x, c.y + 38, c.w, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(c.title, c.x + 22, c.y + 28);
      ctx.fillStyle = '#ccfbf1';
      ctx.font = '13px sans-serif';
      ctx.fillText(c.subtitle, c.x + 22, c.y + 48);
      ctx.restore();
    });

    // CARD 1: DONUT
    const cx = 215, cy = 295, radius = 135, innerR = 78;
    let startAngle = -Math.PI / 2;
    catList.forEach((item, idx) => {
      const sliceAngle = (item.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = palette[idx % palette.length];
      ctx.fill();
      startAngle += sliceAngle;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(rows.length), cx, cy + 4);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('PELIGROS', cx, cy + 26);
    ctx.textAlign = 'left';

    let legY = 115;
    catList.slice(0, 7).forEach((item, idx) => {
      const color = palette[idx % palette.length];
      ctx.fillStyle = color;
      roundRect(385, legY, 18, 18, 5);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px sans-serif';
      const shortName = item.name.length > 26 ? item.name.slice(0, 25) + '…' : item.name;
      ctx.fillText(shortName, 412, legY + 14);

      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.count} (${item.pct}%)`, 725, legY + 14);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#e2e8f0';
      roundRect(412, legY + 22, 313, 8, 4);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(412, legY + 22, Math.max(8, Math.round((item.pct / 100) * 313)), 8, 4);
      ctx.fill();
      legY += 52;
    });

    // CARD 2: HEATMAP 4x4
    const hmX = 795, hmY = 105;
    const colW = 132, rowH = 74, labelW = 145;
    const npHeaders = ['MA (40-24)', 'A (20-10)', 'M (8-6)', 'B (4-2)'];
    const ncRows = [
      { key: '100', label: 'NC 100 (Mortal)', cells: ['I', 'I', 'I', 'II'] },
      { key: '60',  label: 'NC 60 (Muy Grave)', cells: ['I', 'I', 'II', 'II'] },
      { key: '25',  label: 'NC 25 (Grave)', cells: ['I', 'II', 'II', 'III'] },
      { key: '10',  label: 'NC 10 (Leve)', cells: ['II', 'III', 'III', 'IV'] },
    ];
    const npKeys = ['MA', 'A', 'M', 'B'];

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(hmX, hmY, labelW, 42);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(hmX, hmY, labelW, 42);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Consecuencia \\ NP', hmX + 12, hmY + 26);

    npHeaders.forEach((h, cIdx) => {
      const x = hmX + labelW + cIdx * colW;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x, hmY, colW, 42);
      ctx.strokeRect(x, hmY, colW, 42);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(h, x + colW / 2, hmY + 26);
    });

    ncRows.forEach((rObj, rIdx) => {
      const y = hmY + 42 + rIdx * rowH;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(hmX, y, labelW, rowH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(hmX, y, labelW, rowH);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(rObj.label, hmX + 10, y + rowH / 2 + 5);

      rObj.cells.forEach((lvl, cIdx) => {
        const x = hmX + labelW + cIdx * colW;
        const count = heatmap[`${rObj.key}_${npKeys[cIdx]}`] || 0;
        const bg = lvl === 'I' ? '#fecaca' : lvl === 'II' ? '#fed7aa' : lvl === 'III' ? '#fef08a' : '#bbf7d0';
        const fg = lvl === 'I' ? '#991b1b' : lvl === 'II' ? '#9a3412' : lvl === 'III' ? '#854d0e' : '#166534';
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, colW, rowH);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(x, y, colW, rowH);

        ctx.fillStyle = fg;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Nivel ${lvl}`, x + colW / 2, y + 30);
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`[ ${count} riesgos ]`, x + colW / 2, y + 55);
      });
    });
    ctx.textAlign = 'left';

    // CARD 3: HORIZONTAL BARS
    const sortedByNR = [...catList].sort((a, b) => b.avgNR - a.avgNR).slice(0, 7);
    const maxAvgNR = Math.max(...sortedByNR.map(d => d.avgNR), 600);
    let barY = 635;
    sortedByNR.forEach((item) => {
      const color = item.avgNR >= 600 ? '#dc2626' : item.avgNR >= 150 ? '#ea580c' : item.avgNR >= 40 ? '#ca8a04' : '#16a34a';
      const lvlTxt = item.avgNR >= 600 ? 'Nivel I' : item.avgNR >= 150 ? 'Nivel II' : item.avgNR >= 40 ? 'Nivel III' : 'Nivel IV';

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px sans-serif';
      const label = item.name.length > 28 ? item.name.slice(0, 27) + '…' : item.name;
      ctx.fillText(`${label} (${item.count})`, 42, barY + 15);

      ctx.fillStyle = color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`NR Prom: ${item.avgNR} (${lvlTxt})`, 725, barY + 15);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#e2e8f0';
      roundRect(42, barY + 23, 683, 18, 9);
      ctx.fill();

      const fillW = Math.max(24, Math.min(683, Math.round((item.avgNR / maxAvgNR) * 683)));
      ctx.fillStyle = color;
      roundRect(42, barY + 23, fillW, 18, 9);
      ctx.fill();
      barY += 56;
    });

    // CARD 4: HIERARCHY & ANEXO E
    const pctF = Math.round((ctrlFuente / total) * 100);
    const pctM = Math.round((ctrlMedio / total) * 100);
    const pctI = Math.round((ctrlIndividuo / total) * 100);
    const avgNRIni = Math.round(sumNRInicial / total);
    const avgNRRes = Math.round(sumNRResidual / total);
    const avgRedPct = avgNRIni > 0 ? Math.round(((avgNRIni - avgNRRes) / avgNRIni) * 100) : 0;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('A. COBERTURA DE LA JERARQUÍA DE CONTROLES (EXISTENTES + PROPUESTOS)', 795, 642);

    const barsCtrl = [
      { label: 'Controles en la Fuente (Eliminación / Sustitución)', count: ctrlFuente, pct: pctF, color: '#0d9488' },
      { label: 'Controles en el Medio (Ingeniería / Aislamiento)', count: ctrlMedio, pct: pctM, color: '#0284c7' },
      { label: 'Controles en el Individuo (Administrativos / EPP)', count: ctrlIndividuo, pct: pctI, color: '#7c3aed' },
    ];

    let ctrlY = 662;
    barsCtrl.forEach((b) => {
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 13.5px sans-serif';
      ctx.fillText(b.label, 795, ctrlY + 14);
      ctx.fillStyle = b.color;
      ctx.textAlign = 'right';
      ctx.fillText(`${b.pct}% (${b.count}/${rows.length})`, 1475, ctrlY + 14);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#e2e8f0';
      roundRect(795, ctrlY + 22, 680, 16, 8);
      ctx.fill();
      ctx.fillStyle = b.color;
      roundRect(795, ctrlY + 22, Math.max(14, Math.round((b.pct / 100) * 680)), 16, 8);
      ctx.fill();
      ctrlY += 54;
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('B. IMPACTO DE MITIGACIÓN PROYECTADO (ANEXO E: NR INICIAL VS RESIDUAL)', 795, 870);

    const boxes = [
      { x: 795, w: 215, bg: '#fef2f2', border: '#fecaca', title: 'NR PROMEDIO INICIAL', val: String(avgNRIni), sub: 'Antes de Medidas Propuestas', color: '#dc2626' },
      { x: 1027, w: 215, bg: '#f0fdf4', border: '#bbf7d0', title: 'NR PROMEDIO RESIDUAL', val: String(avgNRRes), sub: 'Después de Controles Anexo E', color: '#16a34a' },
      { x: 1260, w: 215, bg: '#eff6ff', border: '#bfdbfe', title: 'FACTOR REDUCCIÓN PROM.', val: `${avgRedPct}%`, sub: 'Mitigación Efectiva Global', color: '#1d4ed8' },
    ];
    boxes.forEach((bx) => {
      ctx.fillStyle = bx.bg;
      ctx.strokeStyle = bx.border;
      ctx.lineWidth = 2;
      roundRect(bx.x, 890, bx.w, 135, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = bx.color;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bx.title, bx.x + bx.w / 2, 918);
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(bx.val, bx.x + bx.w / 2, 968);
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(bx.sub, bx.x + bx.w / 2, 1002);
    });
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('Error rendering dashboard canvas:', e);
    return null;
  }
}

export const exportMatrizIPEVARToExcel = async (matrixRows: MatrixRow[]) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();
  
  const totalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;
  const emptyVal = (v?: string) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', 'n/a', ''].includes(String(v).toLowerCase().trim());

  // ============================================================================
  // HOJA 1: DASHBOARD ANALÍTICO (POWERBI INTERACTIVE STYLE + 4 CHARTS + HEATMAP)
  // ============================================================================
  const wsDash = wb.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  for (let r = 1; r <= 95; r++) {
    for (let c = 1; c <= 18; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  }

  wsDash.getColumn('A').width = 3;
  wsDash.getColumn('B').width = 42;
  wsDash.getColumn('C').width = 18;
  wsDash.getColumn('D').width = 36;
  wsDash.getColumn('E').width = 3;
  for (let c = 6; c <= 17; c++) wsDash.getColumn(c).width = 14;

  // Hero Header
  wsDash.mergeCells('A1:Q3');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   ⚡ DASHBOARD ANALÍTICO E INTERACTIVO — MATRIZ IPEVR GTC-45:2012';
  heroCell.font = { size: 22, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };

  wsDash.mergeCells('A4:Q4');
  const subCell = wsDash.getCell('A4');
  subCell.value = `   📊 Total Peligros Evaluados: ${matrixRows.length}   |   📅 Fecha de Exportación: ${new Date().toLocaleDateString('es-CO')}   |   ⚙️ Fórmulas Vivas y Slicer Interactivo`;
  subCell.font = { size: 11, bold: true, color: { argb: 'FFCCFBF1' }, name: 'Calibri' };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF115E59' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left' };
  wsDash.getRow(4).height = 24;

  const chartsBase64 = renderDashboardChartsCanvasBase64(matrixRows);
  if (chartsBase64) {
    const imgId = wb.addImage({
      base64: chartsBase64,
      extension: 'png',
    });
    wsDash.addImage(imgId, {
      tl: { col: 5.1, row: 10.2 },
      ext: { width: 960, height: 682 },
    });
  }

  // --- INTERACTIVE SLICER (DROPDOWN) ---
  const procesos = [...new Set(matrixRows.map(r => (r.proceso || 'General').trim()).filter(Boolean))];
  if (procesos.length === 0) procesos.push('General');

  wsDash.getColumn('Z').hidden = true;
  wsDash.getCell('Z1').value = 'TODOS';
  procesos.forEach((p, i) => { wsDash.getCell(`Z${i + 2}`).value = p; });
  const numProcesos = procesos.length + 1;

  wsDash.getCell('B6').value = ' 🔍 FILTRO MAESTRO (PROCESO):';
  wsDash.getCell('B6').font = { size: 12, bold: true, color: { argb: 'FF0F172A' }, name: 'Calibri' };
  wsDash.getCell('B6').alignment = { vertical: 'middle', horizontal: 'right' };

  const filterCell = wsDash.getCell('C6');
  filterCell.value = 'TODOS';
  filterCell.font = { size: 13, bold: true, color: { argb: 'FF0F766E' }, name: 'Calibri' };
  filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  filterCell.border = {
    top: { style: 'medium', color: { argb: 'FF0D9488' } }, left: { style: 'medium', color: { argb: 'FF0D9488' } },
    bottom: { style: 'medium', color: { argb: 'FF0D9488' } }, right: { style: 'medium', color: { argb: 'FF0D9488' } }
  };
  filterCell.alignment = { vertical: 'middle', horizontal: 'center' };
  filterCell.dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: [`'Dashboard Analítico'!$Z$1:$Z$${numProcesos}`]
  };
  wsDash.getCell('D6').value = '⬅ Cambie el proceso para recalcular todo el tablero en vivo';
  wsDash.getCell('D6').font = { size: 10, italic: true, color: { argb: 'FF475569' }, name: 'Calibri' };
  wsDash.getCell('D6').alignment = { vertical: 'middle', horizontal: 'left' };
  wsDash.getRow(6).height = 28;

  // --- 4 KPI CARDS (ROW 8-9) ---
  const kpiDefs = [
    { startCol: 'B', endCol: 'B', title: 'TOTAL PELIGROS EVALUADOS', formula: `IF($C$6="TODOS", COUNTA('Matriz IPEVR'!A2:A${totalRows}), COUNTIF('Matriz IPEVR'!A2:A${totalRows}, $C$6))`, resultVal: matrixRows.length, color: 'FF0F766E', bg: 'FFF0FDFA' },
    { startCol: 'C', endCol: 'C', title: 'CRÍTICOS NIVEL I (NO ACEPTABLE)', formula: `IF($C$6="TODOS", COUNTIF('Matriz IPEVR'!S2:S${totalRows}, "I"), COUNTIFS('Matriz IPEVR'!S2:S${totalRows}, "I", 'Matriz IPEVR'!A2:A${totalRows}, $C$6))`, resultVal: matrixRows.filter(r => r.interpretacion_nr === 'I').length, color: 'FFDC2626', bg: 'FFFEF2F2' },
    { startCol: 'D', endCol: 'D', title: 'INTERVENCIÓN URGENTE (NIVEL I + II)', formula: `IF($C$6="TODOS", COUNTIF('Matriz IPEVR'!S2:S${totalRows}, "I")+COUNTIF('Matriz IPEVR'!S2:S${totalRows}, "II"), COUNTIFS('Matriz IPEVR'!S2:S${totalRows}, "I", 'Matriz IPEVR'!A2:A${totalRows}, $C$6)+COUNTIFS('Matriz IPEVR'!S2:S${totalRows}, "II", 'Matriz IPEVR'!A2:A${totalRows}, $C$6))`, resultVal: matrixRows.filter(r => r.interpretacion_nr === 'I' || r.interpretacion_nr === 'II').length, color: 'FFEA580C', bg: 'FFFFF7ED' },
    { startCol: 'F', endCol: 'I', title: '% ÍNDICE DE CRITICIDAD GLOBAL (I+II)', formula: `IF(B9=0, 0, D9/B9)`, resultVal: matrixRows.length ? matrixRows.filter(r => r.interpretacion_nr === 'I' || r.interpretacion_nr === 'II').length / matrixRows.length : 0, color: 'FF7C3AED', bg: 'FFF5F3FF', isPct: true },
  ];

  wsDash.getRow(8).height = 22;
  wsDash.getRow(9).height = 38;

  kpiDefs.forEach(k => {
    if (k.startCol !== k.endCol) {
      wsDash.mergeCells(`${k.startCol}8:${k.endCol}8`);
      wsDash.mergeCells(`${k.startCol}9:${k.endCol}9`);
    }
    const hCell = wsDash.getCell(`${k.startCol}8`);
    hCell.value = k.title;
    hCell.font = { size: 10, bold: true, color: { argb: 'FF334155' }, name: 'Calibri' };
    hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    hCell.alignment = { horizontal: 'center', vertical: 'middle' };
    hCell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    const vCell = wsDash.getCell(`${k.startCol}9`);
    vCell.value = { formula: k.formula, result: k.resultVal };
    vCell.font = { size: 22, bold: true, color: { argb: k.color }, name: 'Calibri' };
    vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.bg } };
    vCell.alignment = { horizontal: 'center', vertical: 'middle' };
    vCell.border = { bottom: { style: 'medium', color: { argb: k.color } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    if (k.isPct) vCell.numFmt = '0.0%';
  });

  // --- DYNAMIC CARD GENERATOR ---
  const getInteractiveFormula = (colTarget: string, valTarget: string) => {
    const safeVal = String(valTarget).replace(/"/g, '""');
    return `IF($C$6="TODOS", COUNTIF('Matriz IPEVR'!${colTarget}2:${colTarget}${totalRows}, "${safeVal}"), COUNTIFS('Matriz IPEVR'!${colTarget}2:${colTarget}${totalRows}, "${safeVal}", 'Matriz IPEVR'!A2:A${totalRows}, $C$6))`;
  };

  const createCardHeader = (row: number, title: string) => {
    wsDash.getCell(`B${row}`).value = title;
    wsDash.getCell(`B${row}`).font = { size: 13, bold: true, color: { argb: 'FF0F172A' }, name: 'Calibri' };
    wsDash.getRow(row).height = 24;

    const hRow = row + 1;
    wsDash.getRow(hRow).height = 22;
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${hRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
      cell.alignment = { vertical: 'middle', horizontal: col === 'C' ? 'center' : 'left' };
      cell.border = { top: { style: 'thin', color: { argb: 'FF042F2E' } }, bottom: { style: 'thin', color: { argb: 'FF042F2E' } } };
    });
    wsDash.getCell(`B${hRow}`).value = ' Categoría / Dimensión';
    wsDash.getCell(`C${hRow}`).value = 'Riesgos';
    wsDash.getCell(`D${hRow}`).value = ' Barra de Tendencia Viva';
    return hRow + 1;
  };

  const addCardRow = (row: number, label: string, countFormula: string, resultCount: number, isLast: boolean, colorArgb: string) => {
    wsDash.getRow(row).height = 21;
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${row}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      const borders: any = { bottom: { style: isLast ? 'medium' : 'thin', color: { argb: 'FFE2E8F0' } } };
      if (col === 'B') borders.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') borders.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      cell.border = borders;
    });

    wsDash.getCell(`B${row}`).value = ` ${label}`;
    wsDash.getCell(`B${row}`).font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF334155' } };
    wsDash.getCell(`B${row}`).alignment = { vertical: 'middle' };

    wsDash.getCell(`C${row}`).value = { formula: countFormula, result: resultCount };
    wsDash.getCell(`C${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
    wsDash.getCell(`C${row}`).font = { bold: true, size: 11, color: { argb: colorArgb }, name: 'Calibri' };

    wsDash.getCell(`D${row}`).value = { formula: countFormula, result: resultCount };
    wsDash.getCell(`D${row}`).font = { color: { argb: 'FF64748B' }, size: 9, name: 'Calibri' };
    wsDash.getCell(`D${row}`).alignment = { vertical: 'middle', horizontal: 'right' };
  };

  // TABLA INTERACTIVA 1: NIVEL DE RIESGO Y ACEPTABILIDAD
  let dashRow = 11;
  dashRow = createCardHeader(dashRow, '1. Valoración y Aceptabilidad GTC-45');
  const nivelesInfo = [
    { code: 'I', label: 'Nivel I — No Aceptable (Crítico)', color: 'FFDC2626', count: matrixRows.filter(r => r.interpretacion_nr === 'I').length },
    { code: 'II', label: 'Nivel II — Control Específico (Alto)', color: 'FFEA580C', count: matrixRows.filter(r => r.interpretacion_nr === 'II').length },
    { code: 'III', label: 'Nivel III — Mejorable (Medio)', color: 'FFCA8A04', count: matrixRows.filter(r => r.interpretacion_nr === 'III').length },
    { code: 'IV', label: 'Nivel IV — Aceptable (Bajo)', color: 'FF16A34A', count: matrixRows.filter(r => r.interpretacion_nr === 'IV').length },
  ];
  const startCard1 = dashRow;
  nivelesInfo.forEach((nv, idx) => {
    addCardRow(dashRow, nv.label, getInteractiveFormula('S', nv.code), nv.count, idx === nivelesInfo.length - 1, nv.color);
    dashRow++;
  });
  wsDash.addConditionalFormatting({
    ref: `D${startCard1}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF0D9488' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  // TABLA INTERACTIVA 2: MATRIZ TÉRMICA EN CELDAS CON FÓRMULAS VIVAS (4x4)
  dashRow += 2;
  wsDash.getCell(`B${dashRow}`).value = '2. Mapa de Calor GTC-45 en Vivo (Fórmulas)';
  wsDash.getCell(`B${dashRow}`).font = { size: 13, bold: true, color: { argb: 'FF0F172A' }, name: 'Calibri' };
  wsDash.getRow(dashRow).height = 24;
  dashRow++;

  wsDash.getCell(`B${dashRow}`).value = ' Consecuencia (NC) \\ Probabilidad (NP)';
  wsDash.getCell(`B${dashRow}`).font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  wsDash.getCell(`B${dashRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  wsDash.getCell(`C${dashRow}`).value = 'MA / A (Crítico)';
  wsDash.getCell(`C${dashRow}`).font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  wsDash.getCell(`C${dashRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
  wsDash.getCell(`C${dashRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell(`D${dashRow}`).value = 'Medio / Bajo (Moderado)';
  wsDash.getCell(`D${dashRow}`).font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  wsDash.getCell(`D${dashRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCA8A04' } };
  wsDash.getCell(`D${dashRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getRow(dashRow).height = 22;
  dashRow++;

  const ncLevels = [
    { nc: 100, label: 'NC 100 — Mortal / Catastrófico', bgHigh: 'FFFECACA', fgHigh: 'FF991B1B', bgLow: 'FFFED7AA', fgLow: 'FF9A3412' },
    { nc: 60,  label: 'NC 60 — Muy Grave (Invalidez)', bgHigh: 'FFFECACA', fgHigh: 'FF991B1B', bgLow: 'FFFED7AA', fgLow: 'FF9A3412' },
    { nc: 25,  label: 'NC 25 — Grave (Incapacidad)',   bgHigh: 'FFFED7AA', fgHigh: 'FF9A3412', bgLow: 'FFFEF08A', fgLow: 'FF854D0E' },
    { nc: 10,  label: 'NC 10 — Leve (Molestias)',      bgHigh: 'FFFEF08A', fgHigh: 'FF854D0E', bgLow: 'FFBBF7D0', fgLow: 'FF166534' },
  ];
  ncLevels.forEach((rowDef) => {
    wsDash.getRow(dashRow).height = 22;
    const cB = wsDash.getCell(`B${dashRow}`);
    cB.value = ` ${rowDef.label}`;
    cB.font = { size: 10, bold: true, color: { argb: 'FF1E293B' }, name: 'Calibri' };
    cB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cB.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    const cC = wsDash.getCell(`C${dashRow}`);
    const fHigh = `IF($C$6="TODOS", COUNTIFS('Matriz IPEVR'!Q2:Q${totalRows}, ${rowDef.nc}, 'Matriz IPEVR'!O2:O${totalRows}, ">=10"), COUNTIFS('Matriz IPEVR'!Q2:Q${totalRows}, ${rowDef.nc}, 'Matriz IPEVR'!O2:O${totalRows}, ">=10", 'Matriz IPEVR'!A2:A${totalRows}, $C$6))`;
    const resHigh = matrixRows.filter(r => Number(r.nc) === rowDef.nc && Number(r.np) >= 10).length;
    cC.value = { formula: fHigh, result: resHigh };
    cC.font = { size: 11, bold: true, color: { argb: rowDef.fgHigh }, name: 'Calibri' };
    cC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowDef.bgHigh } };
    cC.alignment = { horizontal: 'center', vertical: 'middle' };
    cC.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    const cD = wsDash.getCell(`D${dashRow}`);
    const fLow = `IF($C$6="TODOS", COUNTIFS('Matriz IPEVR'!Q2:Q${totalRows}, ${rowDef.nc}, 'Matriz IPEVR'!O2:O${totalRows}, "<10"), COUNTIFS('Matriz IPEVR'!Q2:Q${totalRows}, ${rowDef.nc}, 'Matriz IPEVR'!O2:O${totalRows}, "<10", 'Matriz IPEVR'!A2:A${totalRows}, $C$6))`;
    const resLow = matrixRows.filter(r => Number(r.nc) === rowDef.nc && Number(r.np) < 10).length;
    cD.value = { formula: fLow, result: resLow };
    cD.font = { size: 11, bold: true, color: { argb: rowDef.fgLow }, name: 'Calibri' };
    cD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowDef.bgLow } };
    cD.alignment = { horizontal: 'center', vertical: 'middle' };
    cD.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    dashRow++;
  });

  // TABLA INTERACTIVA 3: PELIGROS POR CLASIFICACIÓN
  dashRow += 2;
  dashRow = createCardHeader(dashRow, '3. Peligros por Clasificación GTC-45');
  const clasificaciones = [...new Set(matrixRows.map(r => (r.peligro_clasificacion || 'Condiciones de seguridad').trim()).filter(Boolean))];
  if (clasificaciones.length === 0) clasificaciones.push('Sin Datos');
  const startCard3 = dashRow;
  clasificaciones.forEach((clasif, idx) => {
    const cnt = matrixRows.filter(r => (r.peligro_clasificacion || 'Condiciones de seguridad').trim() === clasif).length;
    addCardRow(dashRow, clasif, getInteractiveFormula('H', clasif), cnt, idx === clasificaciones.length - 1, 'FF7C3AED');
    dashRow++;
  });
  wsDash.addConditionalFormatting({
    ref: `D${startCard3}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF8B5CF6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  // TABLA INTERACTIVA 4: PELIGROS POR PROCESO
  dashRow += 2;
  dashRow = createCardHeader(dashRow, '4. Distribución de Peligros por Proceso');
  const startCard2 = dashRow;
  procesos.forEach((proc, idx) => {
    const cnt = matrixRows.filter(r => (r.proceso || 'General').trim() === proc).length;
    addCardRow(dashRow, proc, getInteractiveFormula('A', proc), cnt, idx === procesos.length - 1, 'FF0284C7');
    dashRow++;
  });
  wsDash.addConditionalFormatting({
    ref: `D${startCard2}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF0EA5E9' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  // ============================================================================
  // HOJA 2: MATRIZ IPEVR (DATOS + FÓRMULAS VIVAS + ANEXO E)
  // ============================================================================
  const wsMatriz = wb.addWorksheet('Matriz IPEVR', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2, showGridLines: true }]
  });

  wsMatriz.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: 34 }
  };

  wsMatriz.columns = [
    { header: 'Proceso', key: 'proceso', width: 26 },
    { header: 'Cargo / Puesto de Trabajo', key: 'cargo', width: 26 },
    { header: 'Zona / Lugar', key: 'zona', width: 22 },
    { header: 'Actividad', key: 'actividad', width: 28 },
    { header: 'Tareas', key: 'tareas', width: 34 },
    { header: 'Rutinaria (Sí/No)', key: 'rutinaria', width: 15 },
    { header: 'Descripción del Peligro', key: 'peligro_descripcion', width: 45 },
    { header: 'Clasificación GTC-45', key: 'peligro_clasificacion', width: 26 },
    { header: 'Efectos Posibles en la Salud', key: 'efectos_posibles', width: 36 },
    { header: 'Ctrl. Existente Fuente', key: 'controles_fuente', width: 24 },
    { header: 'Ctrl. Existente Medio', key: 'controles_medio', width: 24 },
    { header: 'Ctrl. Existente Individuo', key: 'controles_individuo', width: 24 },
    { header: 'ND (Deficiencia)', key: 'nd', width: 14 },
    { header: 'NE (Exposición)', key: 'ne', width: 14 },
    { header: 'NP (=ND×NE)', key: 'np', width: 14 },
    { header: 'Interpretación NP', key: 'interpretacion_np', width: 20 },
    { header: 'NC (Consecuencia)', key: 'nc', width: 16 },
    { header: 'NR (=NP×NC)', key: 'nr', width: 15 },
    { header: 'Nivel de Riesgo', key: 'interpretacion_nr', width: 16 },
    { header: 'Aceptabilidad del Riesgo', key: 'aceptabilidad', width: 38 },
    { header: 'Nro. Expuestos', key: 'nro_expuestos', width: 15 },
    { header: 'Peor Consecuencia', key: 'peor_consecuencia', width: 32 },
    { header: 'Requisito Legal', key: 'requisito_legal', width: 16 },
    { header: 'Medida: Eliminación', key: 'medida_eliminacion', width: 26 },
    { header: 'Medida: Sustitución', key: 'medida_sustitucion', width: 26 },
    { header: 'Ctrl. Ingeniería', key: 'medida_ingenieria', width: 30 },
    { header: 'Ctrl. Administrativos / Señalización', key: 'medida_administrativa', width: 34 },
    { header: 'Equipos / EPP Propuestos', key: 'medida_eppu', width: 32 },
    { header: 'Justificación Costo/Beneficio (Anexo E)', key: 'factores_reduccion', width: 65 },
    { header: 'Origen / Aporte Colaborador', key: 'origen_reporte', width: 38 },
    { header: '% Reducción (FR)', key: 'fr_pct', width: 18 },
    { header: 'NR Residual (Anexo E)', key: 'nr_residual', width: 20 },
    { header: 'Nivel Residual', key: 'nivel_residual', width: 18 },
    { header: 'Factor Justificación (J)', key: 'justificacion_j', width: 20 },
  ];

  // Colores semánticos por bloque de columnas en la Cabecera (Fila 1)
  wsMatriz.getRow(1).eachCell((cell, colNumber) => {
    let headerBg = 'FF0F766E'; // 1-6 Contexto (Teal)
    if (colNumber >= 7 && colNumber <= 9) headerBg = 'FF1E3A8A'; // 7-9 Peligros (Indigo)
    else if (colNumber >= 10 && colNumber <= 12) headerBg = 'FF0369A1'; // 10-12 Controles Existentes (Sky)
    else if (colNumber >= 13 && colNumber <= 20) headerBg = 'FF0F172A'; // 13-20 Evaluación GTC-45 (Slate 900)
    else if (colNumber >= 21 && colNumber <= 23) headerBg = 'FF78350F'; // 21-23 Criterios (Amber 900)
    else if (colNumber >= 24 && colNumber <= 28) headerBg = 'FF581C87'; // 24-28 Medidas Intervención (Purple 900)
    else if (colNumber >= 29) headerBg = 'FF065F46'; // 29-34 Anexo E (Emerald 800)

    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF042F2E' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  });
  wsMatriz.getRow(1).height = 46;

  matrixRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const ndVal = Number(row.nd) || 0;
    const neVal = Number(row.ne) || 0;
    const npVal = ndVal * neVal;
    const ncVal = Number(row.nc) || 0;
    const nrVal = npVal * ncVal;

    const frMatch = String(row.factores_reduccion || '').match(/(\d{1,3})\s*%/);
    const defaultFr = frMatch ? Math.min(98, Math.max(10, parseInt(frMatch[1], 10))) : (!emptyVal(row.medida_eliminacion) || !emptyVal(row.medida_sustitucion) ? 85 : !emptyVal(row.medida_ingenieria) ? 75 : 55);
    const nrResVal = Math.max(10, Math.round(nrVal * (1 - defaultFr / 100)));
    const nivResVal = nrResVal >= 600 ? 'I (Crítico)' : nrResVal >= 150 ? 'II (Alto)' : nrResVal >= 40 ? 'III (Mejorable)' : 'IV (Aceptable)';
    const jVal = Math.round(((nrVal * defaultFr) / 20) * 10) / 10;

    const addedRow = wsMatriz.addRow({
      proceso: (row.proceso || 'General').trim(),
      cargo: row.cargo || '',
      zona: row.zona || '',
      actividad: row.actividad || '',
      tareas: row.tareas || '',
      rutinaria: row.rutinaria || 'Sí',
      peligro_descripcion: row.peligro_descripcion || '',
      peligro_clasificacion: (row.peligro_clasificacion || 'Condiciones de seguridad').trim(),
      efectos_posibles: row.efectos_posibles || '',
      controles_fuente: row.controles_fuente || 'Ninguno',
      controles_medio: row.controles_medio || 'Ninguno',
      controles_individuo: row.controles_individuo || 'Ninguno',
      nd: ndVal,
      ne: neVal,
      np: { formula: `M${rowNumber}*N${rowNumber}`, result: npVal },
      interpretacion_np: { formula: `IF(O${rowNumber}>=24,"Muy Alto",IF(O${rowNumber}>=10,"Alto",IF(O${rowNumber}>=6,"Medio","Bajo")))`, result: getInterpretacionNP(npVal) },
      nc: ncVal,
      nr: { formula: `O${rowNumber}*Q${rowNumber}`, result: nrVal },
      interpretacion_nr: { formula: `IF(R${rowNumber}>=600,"I",IF(R${rowNumber}>=150,"II",IF(R${rowNumber}>=40,"III","IV")))`, result: row.interpretacion_nr || 'IV' },
      aceptabilidad: { formula: `IF(S${rowNumber}="I","No Aceptable",IF(S${rowNumber}="II","No Aceptable o Aceptable con Control Específico",IF(S${rowNumber}="III","Mejorable","Aceptable")))`, result: row.aceptabilidad || 'Aceptable' },
      nro_expuestos: Number(row.nro_expuestos) || 1,
      peor_consecuencia: row.peor_consecuencia || '',
      requisito_legal: row.requisito_legal || 'Sí',
      medida_eliminacion: row.medida_eliminacion || 'No aplica',
      medida_sustitucion: row.medida_sustitucion || 'No aplica',
      medida_ingenieria: row.medida_ingenieria || 'No aplica',
      medida_administrativa: row.medida_administrativa || 'No aplica',
      medida_eppu: row.medida_eppu || 'No aplica',
      factores_reduccion: row.factores_reduccion || '',
      origen_reporte: row.origen_reporte || 'Matriz Base SG-SST',
      fr_pct: defaultFr,
      nr_residual: { formula: `ROUND(R${rowNumber}*(1-(AE${rowNumber}/100)),0)`, result: nrResVal },
      nivel_residual: { formula: `IF(AF${rowNumber}>=600,"I (Crítico)",IF(AF${rowNumber}>=150,"II (Alto)",IF(AF${rowNumber}>=40,"III (Mejorable)","IV (Aceptable)")))`, result: nivResVal },
      justificacion_j: { formula: `ROUND((R${rowNumber}*AE${rowNumber})/20,1)`, result: jVal },
    });

    addedRow.height = 44;
    const isEven = rowNumber % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'top', wrapText: true };

      if (colNumber === 6 || (colNumber >= 13 && colNumber <= 21) || colNumber === 23 || colNumber >= 31) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      }
      if (colNumber === 15 || colNumber === 18 || colNumber === 32 || colNumber === 34) {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      }
      if (colNumber === 31) {
        cell.numFmt = '0"%"';
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F766E' } };
      }

      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFF1F5F9' } }
      };
    });
  });

  // -- Formato Condicional (Semaforización Nativa a Medida) --
  const finalTotalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // NP (Columna O)
  wsMatriz.addConditionalFormatting({
    ref: `O2:O${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['24', '40'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['10', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['6', '8'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['0', '4'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }
    ]
  });

  // NR (Columna R)
  wsMatriz.addConditionalFormatting({
    ref: `R2:R${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['600', '4000'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['150', '500'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['40', '120'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['0', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }
    ]
  });

  // Interpretación NR (Columna S)
  wsMatriz.addConditionalFormatting({
    ref: `S2:S${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"I"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"II"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"III"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"IV"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
    ]
  });

  // Aceptabilidad (Columna T)
  wsMatriz.addConditionalFormatting({
    ref: `T2:T${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"No Aceptable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"No Aceptable o Aceptable con Control Específico"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Mejorable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Aceptable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
    ]
  });

  // Nivel Residual (Columna AG)
  wsMatriz.addConditionalFormatting({
    ref: `AG2:AG${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"IV (Aceptable)"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFBBF7D0' } }, font: { color: { argb: 'FF166534' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"III (Mejorable)"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEF08A' } }, font: { color: { argb: 'FF854D0E' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"II (Alto)"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFED7AA' } }, font: { color: { argb: 'FF9A3412' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"I (Crítico)"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFECACA' } }, font: { color: { argb: 'FF991B1B' }, bold: true } } },
    ]
  });

  // Validaciones desplegables en filas de la matriz
  const validationRows = Math.max(finalTotalRows + 50, 100);
  for (let r = 2; r <= validationRows; r++) {
    wsMatriz.getCell(`F${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Sí,No"'] };
    wsMatriz.getCell(`M${r}`).dataValidation = { type: 'list', allowBlank: false, formulae: ['"10,6,2,0"'] };
    wsMatriz.getCell(`N${r}`).dataValidation = { type: 'list', allowBlank: false, formulae: ['"4,3,2,1"'] };
    wsMatriz.getCell(`Q${r}`).dataValidation = { type: 'list', allowBlank: false, formulae: ['"100,60,25,10"'] };
    wsMatriz.getCell(`W${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Sí,No"'] };
  }

  // ============================================================================
  // HOJA 3: TABLAS OFICIALES DE REFERENCIA GTC-45:2012
  // ============================================================================
  const wsRef = wb.addWorksheet('Tablas Oficiales GTC-45', {
    views: [{ showGridLines: true }]
  });
  wsRef.columns = [
    { width: 22 },
    { width: 16 },
    { width: 78 },
  ];
  wsRef.mergeCells('A1:C2');
  const refTitle = wsRef.getCell('A1');
  refTitle.value = '📚 TABLAS DE REFERENCIA METODOLÓGICA OFICIAL — GTC 45:2012 (ICONTEC)';
  refTitle.font = { size: 15, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
  refTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  refTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  const refBlocks: Array<{ title: string; rows: string[][] }> = [
    {
      title: 'TABLA 2 — DETERMINACIÓN DEL NIVEL DE DEFICIENCIA (ND)',
      rows: [
        ['Muy Alto (MA)', '10', 'Se ha(n) detectado peligro(s) que determina(n) como posible la generación de incidentes o consecuencias muy significativas, o la eficacia del conjunto de medidas preventivas existentes respecto al riesgo es nula o no existe.'],
        ['Alto (A)', '6', 'Se ha(n) detectado algún(os) peligro(s) que pueden dar lugar a consecuencias significativa(s), o la eficacia del conjunto de medidas preventivas existentes es baja.'],
        ['Medio (M)', '2', 'Se han detectado peligros que pueden dar lugar a consecuencias poco significativas o de menor importancia, o la eficacia del conjunto de medidas preventivas existentes es moderada.'],
        ['Bajo (B)', '0', 'No se ha detectado consecuencia alguna, o la eficacia del conjunto de medidas preventivas existentes es alta, o ambos. El riesgo está controlado.'],
      ]
    },
    {
      title: 'TABLA 3 — DETERMINACIÓN DEL NIVEL DE EXPOSICIÓN (NE)',
      rows: [
        ['Continua (EC)', '4', 'La situación de exposición se presenta sin interrupción o varias veces con tiempo prolongado durante la jornada laboral.'],
        ['Frecuente (EF)', '3', 'La situación de exposición se presenta varias veces durante la jornada laboral por tiempos cortos.'],
        ['Ocasional (EO)', '2', 'La situación de exposición se presenta alguna vez durante la jornada laboral y por un período de tiempo corto.'],
        ['Esporádica (EE)', '1', 'La situación de exposición se presenta de manera eventual.'],
      ]
    },
    {
      title: 'TABLA 5 — SIGNIFICADO DE LOS DIFERENTES NIVELES DE PROBABILIDAD (NP = ND × NE)',
      rows: [
        ['Muy Alto (MA)', 'Entre 40 y 24', 'Situación deficiente con exposición continua, o muy deficiente con exposición frecuente. Normalmente la materialización del riesgo ocurre con frecuencia.'],
        ['Alto (A)', 'Entre 20 y 10', 'Situación deficiente con exposición frecuente u ocasional, o bien situación muy deficiente con exposición ocasional o esporádica.'],
        ['Medio (M)', 'Entre 8 y 6', 'Situación deficiente con exposición esporádica, o bien situación mejorable con exposición continuada o frecuente.'],
        ['Bajo (B)', 'Entre 4 y 2', 'Situación mejorable con exposición ocasional o esporádica, o situación sin anomalía destacable con cualquier nivel de exposición.'],
      ]
    },
    {
      title: 'TABLA 6 — DETERMINACIÓN DEL NIVEL DE CONSECUENCIAS (NC)',
      rows: [
        ['Mortal o Catastrófico (M)', '100', 'Muerte(s).'],
        ['Muy Grave (MG)', '60', 'Lesiones o enfermedades graves irreparables (Incapacidad permanente parcial o invalidez).'],
        ['Grave (G)', '25', 'Lesiones o enfermedades con incapacidad laboral temporal (ILT).'],
        ['Leve (L)', '10', 'Lesiones o enfermedades que no requieren incapacidad.'],
      ]
    },
    {
      title: 'TABLA 7 Y 8 — SIGNIFICADO DEL NIVEL DE RIESGO (NR = NP × NC) Y ACEPTABILIDAD',
      rows: [
        ['Nivel I', '4000 – 600', 'NO ACEPTABLE: Situación crítica. Suspender actividades hasta que el riesgo esté bajo control. Intervención urgente.'],
        ['Nivel II', '500 – 150', 'NO ACEPTABLE O ACEPTABLE CON CONTROL ESPECÍFICO: Corregir y adoptar medidas de control de inmediato.'],
        ['Nivel III', '120 – 40', 'MEJORABLE: Mejorar si es posible. Sería conveniente justificar la intervención y su rentabilidad (Anexo E).'],
        ['Nivel IV', '20', 'ACEPTABLE: Mantener las medidas de control existentes, pero se deberían considerar soluciones o mejoras y hacer comprobaciones periódicas.'],
      ]
    },
  ];

  let refR = 4;
  refBlocks.forEach(b => {
    wsRef.mergeCells(`A${refR}:C${refR}`);
    const bh = wsRef.getCell(`A${refR}`);
    bh.value = ` ${b.title}`;
    bh.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    bh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    wsRef.getRow(refR).height = 24;
    refR++;

    b.rows.forEach(rArr => {
      const rowObj = wsRef.getRow(refR);
      rowObj.values = [rArr[0], rArr[1], rArr[2]];
      rowObj.height = 32;
      rowObj.eachCell((cell, colN) => {
        cell.font = { name: 'Calibri', size: 10.5, bold: colN <= 2, color: { argb: colN === 2 ? 'FF0F766E' : 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: colN === 2 ? 'center' : 'left', wrapText: true };
        cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      });
      refR++;
    });
    refR++;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_IPEVR_GTC45_PRO_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
