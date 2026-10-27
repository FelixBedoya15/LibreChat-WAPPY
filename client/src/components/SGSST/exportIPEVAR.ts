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

  // ============================================================================
  // HOJA 1: DASHBOARD ANALÍTICO (POWERBI INTERACTIVE STYLE + 4 CHARTS)
  // ============================================================================
  const wsDash = wb.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  // Light Theme Background
  for (let r = 1; r <= 80; r++) {
    for (let c = 1; c <= 14; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // Slate 50
    }
  }

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 45;
  wsDash.getColumn('C').width = 25;
  wsDash.getColumn('D').width = 40;
  wsDash.getColumn('E').width = 4;
  
  // Hero Header
  wsDash.mergeCells('A1:N4');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   ⚡ DASHBOARD INTERACTIVO — IPEVR GTC-45';
  heroCell.font = { size: 28, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal (Matches Table Header)
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };
  for (let c = 1; c <= 14; c++) {
    wsDash.getCell(4, c).border = { bottom: { style: 'thick', color: { argb: 'FF042F2E' } } }; // Very Dark Teal
  }

  const chartsBase64 = renderDashboardChartsCanvasBase64(matrixRows);
  if (chartsBase64) {
    const imgId = wb.addImage({
      base64: chartsBase64,
      extension: 'png',
    });
    wsDash.addImage(imgId, {
      tl: { col: 5.2, row: 5.2 },
      ext: { width: 920, height: 654 },
    });
  }

  // --- INTERACTIVE SLICER (DROPDOWN) ---
  const procesos = [...new Set(matrixRows.map(r => r.proceso).filter(Boolean))];
  if (procesos.length === 0) procesos.push('Sin Datos');

  // Hidden Column Z for Data Validation Source (to avoid 255 char limit)
  wsDash.getColumn('Z').hidden = true;
  wsDash.getCell('Z1').value = 'TODOS';
  procesos.forEach((p, i) => wsDash.getCell(`Z${i+2}`).value = p);
  const numProcesos = procesos.length + 1;

  wsDash.getCell('B6').value = ' 🔍 FILTRO MAESTRO (PROCESO):';
  wsDash.getCell('B6').font = { size: 14, bold: true, color: { argb: 'FF334155' }, name: 'Book Antiqua' }; // Slate 700
  wsDash.getCell('B6').alignment = { vertical: 'middle', horizontal: 'right' };

  const filterCell = wsDash.getCell('C6');
  filterCell.value = 'TODOS';
  filterCell.font = { size: 14, bold: true, color: { argb: 'FF0F766E' }, name: 'Book Antiqua' }; // Teal Text
  filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White
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

  // --- KPI CARDS (ROW 8-9) ---
  const kpiHeaders = [
    { col: 'B', title: 'Total Riesgos Evaluados' },
    { col: 'C', title: 'Riesgos Críticos (No Aceptable)' },
    { col: 'D', title: '% Criticidad Global' }
  ];

  kpiHeaders.forEach(kpi => {
    const headerCell = wsDash.getCell(`${kpi.col}8`);
    headerCell.value = kpi.title;
    headerCell.font = { size: 12, bold: true, color: { argb: 'FF334155' }, name: 'Book Antiqua' }; // Slate 700
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate 100
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    const valueCell = wsDash.getCell(`${kpi.col}9`);
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White
    valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valueCell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });

  // KPI Formulas (Dynamic with C6)
  wsDash.getCell('B9').value = { formula: `IF($C$6="TODOS", COUNTA('Matriz IPEVR'!A2:A${totalRows}), COUNTIF('Matriz IPEVR'!A2:A${totalRows}, $C$6))` };
  wsDash.getCell('B9').font = { size: 24, bold: true, color: { argb: 'FF0F172A' }, name: 'Book Antiqua' }; // Slate 900

  wsDash.getCell('C9').value = { formula: `IF($C$6="TODOS", COUNTIF('Matriz IPEVR'!T2:T${totalRows}, "No Aceptable"), COUNTIFS('Matriz IPEVR'!T2:T${totalRows}, "No Aceptable", 'Matriz IPEVR'!A2:A${totalRows}, $C$6))` };
  wsDash.getCell('C9').font = { size: 24, bold: true, color: { argb: 'FFEF4444' }, name: 'Book Antiqua' }; // Rojo

  wsDash.getCell('D9').value = { formula: `IF(B9=0, 0, C9/B9)` };
  wsDash.getCell('D9').font = { size: 24, bold: true, color: { argb: 'FFF97316' }, name: 'Book Antiqua' }; // Naranja
  wsDash.getCell('D9').numFmt = '0.00%';
  wsDash.getRow(9).height = 40;


  // --- DYNAMIC CARD GENERATOR ---
  const getInteractiveFormula = (colTarget: string, valTarget: string) => {
    return `IF($C$6="TODOS", COUNTIF('Matriz IPEVR'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}"), COUNTIFS('Matriz IPEVR'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}", 'Matriz IPEVR'!A2:A${totalRows}, $C$6))`;
  };

  const createCardHeader = (row: number, title: string) => {
    wsDash.getCell(`B${row}`).value = title;
    wsDash.getCell(`B${row}`).font = { size: 16, bold: true, color: { argb: 'FF0F172A' }, name: 'Book Antiqua' }; // Slate 900
    
    const hRow = row + 1;
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${hRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate 100
      cell.font = { bold: true, color: { argb: 'FF475569' }, name: 'Book Antiqua' }; // Slate 600
      cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      if (col === 'B') cell.border.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') cell.border.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    });
    wsDash.getCell(`B${hRow}`).value = ' Categoría';
    wsDash.getCell(`C${hRow}`).value = 'Cantidad';
    wsDash.getCell(`D${hRow}`).value = ' Tendencia Interactiva';
    return hRow + 1;
  };

  const addCardRow = (row: number, label: string, countFormula: string, isLast: boolean, colorArgb: string) => {
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${row}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White
      let borders: any = {};
      if (col === 'B') borders.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') borders.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (isLast) borders.bottom = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      cell.border = { ...(cell.border || {}), ...borders };
    });

    wsDash.getCell(`B${row}`).value = ` ${label}`;
    wsDash.getCell(`B${row}`).font = { name: 'Book Antiqua', color: { argb: 'FF334155' } }; // Slate 700
    
    wsDash.getCell(`C${row}`).value = { formula: countFormula };
    wsDash.getCell(`C${row}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`C${row}`).font = { bold: true, size: 12, color: { argb: colorArgb }, name: 'Book Antiqua' };
    
    wsDash.getCell(`D${row}`).value = { formula: countFormula };
    wsDash.getCell(`D${row}`).font = { color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' }; // Hide text (blend with white background)
  };


  let dashRow = 12;
  dashRow = createCardHeader(dashRow, 'Riesgos por Aceptabilidad GTC-45');
  const aceptabilidades = [
    { name: 'No Aceptable', color: 'FFEF4444' }, // Rojo
    { name: 'No Aceptable o Aceptable con Control Específico', color: 'FFF97316' }, // Naranja
    { name: 'Mejorable', color: 'FF22C55E' }, // Verde
    { name: 'Aceptable', color: 'FFEAB308' } // Amarillo
  ];
  const startCard1 = dashRow;

  aceptabilidades.forEach((ac, idx) => {
    addCardRow(dashRow, ac.name, getInteractiveFormula('T', ac.name), idx === aceptabilidades.length - 1, ac.color);
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard1}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF3B82F6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }] // Blue bar
  });


  dashRow += 3;
  dashRow = createCardHeader(dashRow, 'Top Riesgos por Proceso');
  const startCard2 = dashRow;

  procesos.forEach((proc, idx) => {
    addCardRow(dashRow, proc, getInteractiveFormula('A', proc), idx === procesos.length - 1, 'FF14B8A6'); // Teal neon
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard2}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF14B8A6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });


  dashRow += 3;
  dashRow = createCardHeader(dashRow, 'Riesgos por Clasificación de Peligro');
  const clasificaciones = [...new Set(matrixRows.map(r => r.peligro_clasificacion).filter(Boolean))];
  if (clasificaciones.length === 0) clasificaciones.push('Sin Datos');
  const startCard3 = dashRow;

  clasificaciones.forEach((clasif, idx) => {
    addCardRow(dashRow, clasif, getInteractiveFormula('H', clasif), idx === clasificaciones.length - 1, 'FF8B5CF6'); // Violet neon
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard3}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF8B5CF6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });


  // ============================================================================
  // HOJA 2: MATRIZ GTC-45 (DATOS)
  // ============================================================================
  const wsMatriz = wb.addWorksheet('Matriz IPEVR', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2, showGridLines: false }]
  });

  // Activar Filtros Automáticos sin usar addTable para no perder control del color de cabecera
  wsMatriz.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: 30 }
  };

  wsMatriz.columns = [
    { header: 'Proceso', key: 'proceso', width: 28 },
    { header: 'Cargo / Puesto de Trabajo', key: 'cargo', width: 26 },
    { header: 'Zona / Lugar', key: 'zona', width: 22 },
    { header: 'Actividad', key: 'actividad', width: 28 },
    { header: 'Tareas', key: 'tareas', width: 35 },
    { header: 'Rutinaria', key: 'rutinaria', width: 12 },
    { header: 'Descripción del Peligro', key: 'peligro_descripcion', width: 50 },
    { header: 'Clasificación', key: 'peligro_clasificacion', width: 22 },
    { header: 'Efectos Posibles', key: 'efectos_posibles', width: 35 },
    { header: 'Ctrl. Fuente', key: 'controles_fuente', width: 22 },
    { header: 'Ctrl. Medio', key: 'controles_medio', width: 22 },
    { header: 'Ctrl. Individuo', key: 'controles_individuo', width: 22 },
    { header: 'ND', key: 'nd', width: 10 },
    { header: 'NE', key: 'ne', width: 10 },
    { header: 'NP', key: 'np', width: 10 },
    { header: 'Interpretación NP', key: 'interpretacion_np', width: 18 },
    { header: 'NC', key: 'nc', width: 10 },
    { header: 'NR (Nivel)', key: 'nr', width: 12 },
    { header: 'Interpretación NR', key: 'interpretacion_nr', width: 22 },
    { header: 'Aceptabilidad del Riesgo', key: 'aceptabilidad', width: 40 },
    { header: 'Nro. Expuestos', key: 'nro_expuestos', width: 15 },
    { header: 'Peor Consecuencia', key: 'peor_consecuencia', width: 30 },
    { header: 'Requisito Legal', key: 'requisito_legal', width: 15 },
    { header: 'Eliminación', key: 'medida_eliminacion', width: 25 },
    { header: 'Sustitución', key: 'medida_sustitucion', width: 25 },
    { header: 'Ctrl. Ingeniería', key: 'medida_ingenieria', width: 25 },
    { header: 'Ctrl. Administrativos', key: 'medida_administrativa', width: 30 },
    { header: 'Equipos/EPP', key: 'medida_eppu', width: 30 },
    { header: 'Factores de Reducción', key: 'factores_reduccion', width: 65 }, // Mucho más ancho
    { header: 'Origen / Aporte Colaborador', key: 'origen_reporte', width: 45 },
  ];

  wsMatriz.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua', size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Darker elegant Teal
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } } 
    };
  });
  wsMatriz.getRow(1).height = 55;

  matrixRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const addedRow = wsMatriz.addRow({
      proceso: row.proceso,
      cargo: row.cargo || '',
      zona: row.zona,
      actividad: row.actividad,
      tareas: row.tareas,
      rutinaria: row.rutinaria,
      peligro_descripcion: row.peligro_descripcion,
      peligro_clasificacion: row.peligro_clasificacion,
      efectos_posibles: row.efectos_posibles,
      controles_fuente: row.controles_fuente,
      controles_medio: row.controles_medio,
      controles_individuo: row.controles_individuo,
      nd: Number(row.nd) || 0,
      ne: Number(row.ne) || 0,
      np: { formula: `M${rowNumber}*N${rowNumber}`, result: row.np },
      interpretacion_np: { formula: `IF(O${rowNumber}>=24,"Muy Alto",IF(O${rowNumber}>=10,"Alto",IF(O${rowNumber}>=6,"Medio","Bajo")))`, result: getInterpretacionNP(row.np) },
      nc: Number(row.nc) || 0,
      nr: { formula: `O${rowNumber}*Q${rowNumber}`, result: row.nr },
      interpretacion_nr: { formula: `IF(R${rowNumber}>=600,"I",IF(R${rowNumber}>=150,"II",IF(R${rowNumber}>=40,"III","IV")))`, result: row.interpretacion_nr },
      aceptabilidad: { formula: `IF(S${rowNumber}="I","No Aceptable",IF(S${rowNumber}="II","No Aceptable o Aceptable con Control Específico",IF(S${rowNumber}="III","Mejorable","Aceptable")))`, result: row.aceptabilidad },
      nro_expuestos: row.nro_expuestos !== undefined ? row.nro_expuestos : 1,
      peor_consecuencia: row.peor_consecuencia || '',
      requisito_legal: row.requisito_legal || '',
      medida_eliminacion: row.medida_eliminacion,
      medida_sustitucion: row.medida_sustitucion,
      medida_ingenieria: row.medida_ingenieria,
      medida_administrativa: row.medida_administrativa,
      medida_eppu: row.medida_eppu,
      factores_reduccion: row.factores_reduccion,
      origen_reporte: row.origen_reporte || 'Matriz Base SG-SST',
    });

    addedRow.height = 40; // Fila muy alta para respirar (Card style)
    const isEven = rowNumber % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Blanco y Slate 50 (Gris hiper suave)

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Book Antiqua', size: 11, color: { argb: 'FF334155' } }; // Gris oscuro elegante
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'top', wrapText: true, indent: 1 }; // Indentación ligera
      
      if (colNumber === 6 || (colNumber >= 13 && colNumber <= 19)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; 
      }
      
      // SOLO borde inferior muy tenue (Estilo Web)
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // -- Formato Condicional (Semaforización Nativa a Medida) --
  const finalTotalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // NP (Columna O)
  wsMatriz.addConditionalFormatting({
    ref: `O2:O${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['24', '40'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'between', formulae: ['10', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Naranja
      { type: 'cellIs', operator: 'between', formulae: ['6', '8'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
      { type: 'cellIs', operator: 'between', formulae: ['2', '4'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Verde
    ]
  });

  // NR (Columna R)
  wsMatriz.addConditionalFormatting({
    ref: `R2:R${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['600', '4000'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'between', formulae: ['150', '500'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Naranja
      { type: 'cellIs', operator: 'between', formulae: ['40', '120'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Verde
      { type: 'cellIs', operator: 'between', formulae: ['0', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } } // Amarillo
    ]
  });

  // Interpretación NR (Columna S)
  wsMatriz.addConditionalFormatting({
    ref: `S2:S${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"I"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'equal', formulae: ['"II"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Naranja
      { type: 'cellIs', operator: 'equal', formulae: ['"III"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Verde
      { type: 'cellIs', operator: 'equal', formulae: ['"IV"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
    ]
  });

  // Aceptabilidad (Columna T)
  wsMatriz.addConditionalFormatting({
    ref: `T2:T${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"No Aceptable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'equal', formulae: ['"No Aceptable o Aceptable con Control Específico"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Naranja
      { type: 'cellIs', operator: 'equal', formulae: ['"Mejorable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Verde
      { type: 'cellIs', operator: 'equal', formulae: ['"Aceptable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
    ]
  });

  // Lista Desplegable (Data Validation) para Rutinaria (Columna F)
  const validationRows = Math.max(finalTotalRows + 50, 100); // Aplicar a más filas por si el usuario añade nuevas
  for (let r = 2; r <= validationRows; r++) {
    wsMatriz.getCell(`F${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Sí,No"'],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Valor inválido',
      error: 'Por favor, seleccione "Sí" o "No" de la lista desplegable.'
    };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_IPEVR_GTC45_PRO_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
