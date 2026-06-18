import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, FileSpreadsheet, Download, RefreshCw, Grid, BarChart2, TrendingUp, Sparkles, Copy, X, PieChart, Info, Maximize, Minimize } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface CanvasExcelEditorProps {
  initialContent: string | any[][];
  onUpdate: (content: string) => void;
  title: string;
  onRegisterDownload?: (fn: () => void) => void;
}

function refToCoords(ref: string): { row: number; col: number } | null {
  const match = ref.toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  const colStr = match[1];
  const rowStr = match[2];
  
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  col = col - 1; // 0-indexed
  const row = parseInt(rowStr, 10) - 1; // 0-indexed
  return { row, col };
}

function getCellValue(row: number, col: number, gridData: any[][], visited: Set<string> = new Set()): number {
  const cellKey = `${row},${col}`;
  if (visited.has(cellKey)) {
    return 0; // circular dependency protection
  }
  visited.add(cellKey);
  
  const rawVal = gridData[row]?.[col];
  const rawValStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
  if (rawValStr.startsWith('=')) {
    const evaluated = evaluateFormula(rawValStr, gridData, visited);
    const parsed = parseFloat(evaluated);
    visited.delete(cellKey);
    return isNaN(parsed) ? 0 : parsed;
  }
  visited.delete(cellKey);
  const parsed = parseFloat(rawValStr);
  return isNaN(parsed) ? 0 : parsed;
}

function evaluateFormula(formula: any, gridData: any[][], visited: Set<string> = new Set()): string {
  const formulaStr = formula !== undefined && formula !== null ? String(formula) : '';
  if (!formulaStr || !formulaStr.startsWith('=')) return formulaStr;

  const upperFormula = formula.toUpperCase().trim();
  
  // 1. Check for functions: SUM, SUMA, AVERAGE, PROMEDIO
  const funcMatch = upperFormula.match(/^=(SUM|SUMA|AVERAGE|PROMEDIO)\((.+?)\)$/);
  if (funcMatch) {
    const funcName = funcMatch[1];
    const argsStr = funcMatch[2];
    
    // Split arguments by commas or semicolons
    const args = argsStr.split(/[,;]/);
    const values: number[] = [];
    
    for (const arg of args) {
      const trimmedArg = arg.trim();
      
      // Check if argument is a range like A1:B3
      const rangeMatch = trimmedArg.match(/^([A-Z]+[0-9]+):([A-Z]+[0-9]+)$/);
      if (rangeMatch) {
        const start = refToCoords(rangeMatch[1]);
        const end = refToCoords(rangeMatch[2]);
        if (start && end) {
          const minRow = Math.min(start.row, end.row);
          const maxRow = Math.max(start.row, end.row);
          const minCol = Math.min(start.col, end.col);
          const maxCol = Math.max(start.col, end.col);
          
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              values.push(getCellValue(r, c, gridData, visited));
            }
          }
        }
      } else {
        // Individual cell reference or numeric literal
        const coords = refToCoords(trimmedArg);
        if (coords) {
          values.push(getCellValue(coords.row, coords.col, gridData, visited));
        } else {
          const num = parseFloat(trimmedArg);
          if (!isNaN(num)) {
            values.push(num);
          }
        }
      }
    }
    
    if (funcName === 'SUM' || funcName === 'SUMA') {
      const sum = values.reduce((acc, v) => acc + v, 0);
      return sum.toString();
    } else if (funcName === 'AVERAGE' || funcName === 'PROMEDIO') {
      if (values.length === 0) return '0';
      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = sum / values.length;
      return (Math.round(avg * 10000) / 10000).toString();
    }
  }
  
  // 2. Regular math expression / cell reference arithmetic (e.g. =A1+B2)
  let expr = upperFormula.slice(1); // remove '='
  
  // Replace cell references (like A1, B2) with their evaluated values
  expr = expr.replace(/([A-Z]+[0-9]+)/g, (ref) => {
    const coords = refToCoords(ref);
    if (coords) {
      return getCellValue(coords.row, coords.col, gridData, visited).toString();
    }
    return ref;
  });
  
  // Sanitize the expression to keep only safe math characters
  const clean = expr.replace(/[^0-9+\-*/().\s]/g, '');
  try {
    const result = new Function(`return (${clean})`)();
    if (typeof result === 'number' && !isNaN(result)) {
      return (Math.round(result * 10000) / 10000).toString();
    }
    return '0';
  } catch (e) {
    return '0';
  }
}

function getColumnLabel(index: number): string {
  let label = '';
  let temp = index;
  while (temp >= 0) {
    label = String.fromCharCode((temp % 26) + 65) + label;
    temp = Math.floor(temp / 26) - 1;
  }
  return label;
}

const CanvasExcelEditor: React.FC<CanvasExcelEditorProps> = ({ initialContent, onUpdate, title, onRegisterDownload }) => {
  const [sheets, setSheets] = useState<{ [sheetName: string]: string[][] }>({ 'Hoja 1': [['', '', ''], ['', '', ''], ['', '', '']] });
  const [activeSheet, setActiveSheet] = useState<string>('Hoja 1');
  const data = sheets[activeSheet] || [['', '', ''], ['', '', ''], ['', '', '']];
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaValue, setFormulaValue] = useState<string>('');
  const gridRef = useRef<HTMLDivElement>(null);
  const excelWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = excelWrapperRef.current;
    if (!document.fullscreenElement) {
      try {
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
      } catch (err) {
        console.error('Fullscreen request failed:', err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (err) {
        console.error('Exit fullscreen failed:', err);
      }
    }
  };

  // Estados para el panel de análisis gráfico
  const [isChartPanelOpen, setIsChartPanelOpen] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
  const [xAxisCol, setXAxisCol] = useState<number>(0);
  const [yAxisCol, setYAxisCol] = useState<number>(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showHtmlCopiedToast, setShowHtmlCopiedToast] = useState<boolean>(false);
  const [aggMethod, setAggMethod] = useState<'sum' | 'avg' | 'count'>('sum');

  // --- Advanced Data Analyzer Calculations ---
  const colCount = (() => {
    let maxCols = 0;
    if (Array.isArray(data)) {
      data.forEach(row => {
        if (Array.isArray(row) && row.length > maxCols) maxCols = row.length;
      });
    }
    return maxCols || 3;
  })();

  const headerRowIdx = (() => {
    let bestRowIdx = 0;
    let maxCols = 0;
    if (Array.isArray(data)) {
      const scanLimit = Math.min(10, data.length);
      for (let r = 0; r < scanLimit; r++) {
        const row = data[r] || [];
        const nonEmpties = row.filter(cell => cell && String(cell).trim() !== '').length;
        if (nonEmpties > maxCols) {
          maxCols = nonEmpties;
          bestRowIdx = r;
        }
      }
    }
    return bestRowIdx;
  })();

  const headerRow = data[headerRowIdx] || [];

  const columnsList = Array.from({ length: colCount }).map((_, i) => {
    const label = headerRow[i] ? String(headerRow[i]).trim() : '';
    return {
      index: i,
      label: label || `Columna ${getColumnLabel(i)}`
    };
  });

  const dataRows = Array.isArray(data)
    ? data.slice(headerRowIdx + 1).filter(row => {
        return Array.isArray(row) && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
      })
    : [];

  const groups: { [key: string]: number[] } = {};

  dataRows.forEach((row, idx) => {
    const xValRaw = row[xAxisCol];
    const xValStr = xValRaw !== undefined && xValRaw !== null ? String(xValRaw) : '';
    const xVal = xValStr.startsWith('=') ? evaluateFormula(xValStr, data) : xValStr;
    const cleanX = xVal.trim() || `Fila ${idx + 1 + headerRowIdx + 1}`;

    const upperX = cleanX.toUpperCase();
    if (upperX.includes('TOTAL') || upperX.includes('CÁLCULO') || upperX.includes('PROMEDIO') || upperX.includes('SUMA') || upperX.includes('CONCEPTO')) {
      return;
    }

    const yValRaw = row[yAxisCol];
    const yValStr = yValRaw !== undefined && yValRaw !== null ? String(yValRaw) : '';
    const yValEvaluated = yValStr.startsWith('=') ? evaluateFormula(yValStr, data) : yValStr;
    const parsedY = parseFloat(String(yValEvaluated || '').replace(/[^0-9.\-]/g, ''));
    const yValue = isNaN(parsedY) ? 0 : parsedY;

    if (!groups[cleanX]) {
      groups[cleanX] = [];
    }
    groups[cleanX].push(yValue);
  });

  const chartData = Object.keys(groups).map(key => {
    const vals = groups[key];
    let val = 0;
    if (aggMethod === 'sum') {
      val = vals.reduce((acc, v) => acc + v, 0);
    } else if (aggMethod === 'avg') {
      val = vals.reduce((acc, v) => acc + v, 0) / vals.length;
    } else if (aggMethod === 'count') {
      val = vals.length;
    }
    return {
      label: key,
      val: Math.round(val * 100) / 100,
      count: vals.length
    };
  }).filter(item => item.label && (item.val > 0 || aggMethod === 'count'));

  const conteo = chartData.length;
  const values = chartData.map(d => d.val);
  const suma = values.reduce((acc, v) => acc + v, 0);
  const promedio = conteo > 0 ? (suma / conteo) : 0;
  const maxVal = conteo > 0 ? Math.max(...values) : 0;
  const minVal = conteo > 0 ? Math.min(...values) : 0;

  const maxIdx = values.indexOf(maxVal);
  const minIdx = values.indexOf(minVal);
  
  const maxLabel = maxIdx !== -1 ? chartData[maxIdx].label : '---';
  const minLabel = minIdx !== -1 ? chartData[minIdx].label : '---';
  // ---------------------------------------------

  // Auto-detectar la primera columna numérica cuando cambie la data
  useEffect(() => {
    if (data && data[0] && data[0].length > 1) {
      for (let col = 1; col < data[0].length; col++) {
        let hasNumber = false;
        for (let row = 1; row < data.length; row++) {
          const rawCell = data[row]?.[col];
          const val = rawCell !== undefined && rawCell !== null ? String(rawCell) : '';
          const cleaned = val.replace(/[^0-9.\-]/g, '');
          if (cleaned && !isNaN(parseFloat(cleaned))) {
            hasNumber = true;
            break;
          }
        }
        if (hasNumber) {
          setYAxisCol(col);
          break;
        }
      }
    }
  }, [data]);

  // Actualización centralizada de hojas y backend
  const updateSheets = (updatedGrid: string[][]) => {
    const updatedSheets = {
      ...sheets,
      [activeSheet]: updatedGrid
    };
    setSheets(updatedSheets);

    // Notificar al backend
    const keys = Object.keys(updatedSheets);
    const hasMultipleSheets = keys.length > 1 || keys[0] !== 'Hoja 1';
    if (hasMultipleSheets) {
      onUpdate(JSON.stringify(updatedSheets));
    } else {
      onUpdate(JSON.stringify(updatedGrid));
    }
  };

  // Load initial content
  useEffect(() => {
    if (initialContent) {
      if (Array.isArray(initialContent)) {
        setSheets({ 'Hoja 1': initialContent });
        setActiveSheet('Hoja 1');
        return;
      }
      try {
        const parsed = JSON.parse(initialContent);
        
        // 1. Si es un array de arrays (grilla plana)
        if (Array.isArray(parsed) && parsed.every(row => Array.isArray(row))) {
          setSheets({ 'Hoja 1': parsed });
          setActiveSheet('Hoja 1');
          return;
        }

        // 2. Si es un objeto que representa múltiples pestañas (sheets)
        if (typeof parsed === 'object' && parsed !== null) {
          const keys = Object.keys(parsed);
          const isMultipleSheets = keys.length > 0 && keys.every(key => Array.isArray(parsed[key]) && parsed[key].every((row: any) => Array.isArray(row)));
          if (isMultipleSheets) {
            setSheets(parsed);
            if (!parsed[activeSheet]) {
              setActiveSheet(keys[0]);
            }
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to parse excel content JSON, using fallback', e);
      }
    }
    // Fallback default grid (only if we don't have valid grid data loaded already)
    setSheets(prev => {
      const keys = Object.keys(prev);
      const isPrevEmpty = !prev || keys.length === 0 || (keys.length === 1 && (prev['Hoja 1']?.length <= 1 || (prev['Hoja 1']?.length === 3 && prev['Hoja 1']?.[0]?.every(c => c === ''))));
      if (isPrevEmpty) {
        return {
          'Hoja 1': [
            ['Indicador', 'Meta', 'Resultado', 'Cumplimiento'],
            ['Capacitaciones Realizadas', '12', '10', '83.3%'],
            ['Simulacros de Emergencia', '2', '2', '100%'],
            ['Inspecciones de Seguridad', '24', '18', '75%'],
          ]
        };
      }
      return prev;
    });
  }, [initialContent]);

  const updateCell = (row: number, col: number, value: string) => {
    const updated = data.map((r, rIdx) => 
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? value : c))
    );
    updateSheets(updated);
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setFormulaValue(data[row]?.[col] || '');
  };

  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormulaValue(val);
    if (selectedCell) {
      updateCell(selectedCell.row, selectedCell.col, val);
    }
  };

  const addRow = () => {
    const colCount = data[0]?.length || 3;
    const newRow = Array(colCount).fill('');
    const updated = [...data, newRow];
    updateSheets(updated);
  };

  const deleteRow = () => {
    if (data.length <= 1) return;
    const updated = data.slice(0, -1);
    updateSheets(updated);
    setSelectedCell(null);
  };

  const addColumn = () => {
    const updated = data.map(row => [...row, '']);
    updateSheets(updated);
  };

  const deleteColumn = () => {
    if (data[0]?.length <= 1) return;
    const updated = data.map(row => row.slice(0, -1));
    updateSheets(updated);
    setSelectedCell(null);
  };

  // Professional spreadsheet export using exceljs
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Canvas');

    // Enable grid lines
    worksheet.views = [{ showGridLines: true }];

    // Populate data
    data.forEach((row, rowIndex) => {
      const wsRow = worksheet.getRow(rowIndex + 1);

      // Styling: alternate row backgrounds, headers, border styles
      row.forEach((cellVal, colIndex) => {
        const cell = wsRow.getCell(colIndex + 1);
        
        if (cellVal && String(cellVal).startsWith('=')) {
          const formulaStr = String(cellVal).slice(1).trim().toUpperCase();
          cell.value = { formula: formulaStr };
        } else {
          const num = Number(cellVal);
          if (cellVal !== '' && !isNaN(num)) {
            cell.value = num;
          } else {
            cell.value = cellVal;
          }
        }

        // Borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };

        // Header Styling
        if (rowIndex === 0) {
          cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0D9488' } // Teal-600 header
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          // Body Styling
          cell.font = { name: 'Segoe UI', size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          
          // Alternate rows coloration
          if (rowIndex % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9FAFB' }
            };
          }
        }
      });
    });

    // Auto-fit column widths
    worksheet.columns?.forEach(column => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, cell => {
        const value = cell.value ? String(cell.value) : '';
        if (value.length > maxLen) maxLen = value.length;
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${title}.xlsx`);
  };

  const copyTableAsHtml = () => {
    if (!data || data.length === 0) return;

    let html = `<table style="width: 100%; max-width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1f2937; margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">`;
    
    // Header
    html += `<thead style="background-color: #0d9488; color: #ffffff; text-align: left; font-weight: bold;"><tr>`;
    data[0].forEach((header) => {
      html += `<th style="padding: 12px 16px; border-bottom: 2px solid #0f766e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${header || ''}</th>`;
    });
    html += `</tr></thead>`;
    
    // Body
    html += `<tbody>`;
    data.slice(1).forEach((row, rowIdx) => {
      const bgColor = rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb';
      html += `<tr style="background-color: ${bgColor}; border-bottom: 1px solid #e5e7eb;">`;
      row.forEach((cellVal) => {
        const displayVal = cellVal && String(cellVal).startsWith('=') ? evaluateFormula(String(cellVal), data) : cellVal;
        html += `<td style="padding: 10px 16px; vertical-align: middle;">${displayVal || ''}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table>`;

    navigator.clipboard.writeText(html).then(() => {
      setShowHtmlCopiedToast(true);
      setTimeout(() => setShowHtmlCopiedToast(false), 2500);
    }).catch(err => {
      console.error('No se pudo copiar el HTML al portapapeles:', err);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    let nextRow = r;
    let nextCol = c;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextRow = Math.max(0, r - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextRow = Math.min(data.length - 1, r + 1);
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.selectionEnd === 0) {
        e.preventDefault();
        nextCol = Math.max(0, c - 1);
      } else {
        return;
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
        e.preventDefault();
        nextCol = Math.min(data[0].length - 1, c + 1);
      } else {
        return;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      nextRow = Math.min(data.length - 1, r + 1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        nextCol = Math.max(0, c - 1);
      } else {
        nextCol = Math.min(data[0].length - 1, c + 1);
      }
    } else {
      return;
    }

    if (nextRow !== r || nextCol !== c) {
      setSelectedCell({ row: nextRow, col: nextCol });
      setFormulaValue(data[nextRow][nextCol] || '');
      setTimeout(() => {
        const cellInput = document.getElementById(`cell-${nextRow}-${nextCol}`) as HTMLInputElement | null;
        if (cellInput) {
          cellInput.focus();
          cellInput.select();
        }
      }, 10);
    }
  };

  useEffect(() => {
    if (onRegisterDownload) {
      onRegisterDownload(handleExportExcel);
    }
  }, [onRegisterDownload, data, title]);

  return (
    <div ref={excelWrapperRef} className="flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden">
      {/* Excel Formula & Controls Bar */}
      <div className="flex flex-col gap-2 p-3 border-b border-border-medium bg-surface-secondary">
        <div className="flex items-center gap-2">
          {/* Cell selector indicator */}
          <div className="flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-mono text-xs font-bold h-8 w-12 rounded-lg border border-teal-500/20">
            {selectedCell ? `${getColumnLabel(selectedCell.col)}${selectedCell.row + 1}` : '---'}
          </div>
          {/* Formula Bar */}
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-2.5 text-text-tertiary font-serif text-sm select-none">ƒ<sub>x</sub></span>
            <input
              type="text"
              value={formulaValue}
              onChange={handleFormulaChange}
              disabled={!selectedCell}
              placeholder={selectedCell ? "Introduce datos o fórmula..." : "Selecciona una celda para editar"}
              className="w-full h-8 pl-8 pr-3 text-xs bg-surface-primary border border-border-medium rounded-lg outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={addRow}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
              aria-label="Agregar Fila"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <Plus className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide">Fila</span>
              </div>
            </button>
            <button
              onClick={deleteRow}
              disabled={data.length <= 1}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-red-500/20 hover:bg-red-50 text-red-600 disabled:hover:bg-surface-primary disabled:border-red-500/20 disabled:text-red-600"
              aria-label="Quitar Fila"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide">Quitar Fila</span>
              </div>
            </button>
            <div className="h-6 w-px bg-border-medium" />
            <button
              onClick={addColumn}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
              aria-label="Agregar Columna"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <Plus className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide">Columna</span>
              </div>
            </button>
            <button
              onClick={deleteColumn}
              disabled={data[0]?.length <= 1}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-red-500/20 hover:bg-red-50 text-red-600 disabled:hover:bg-surface-primary disabled:border-red-500/20 disabled:text-red-600"
              aria-label="Quitar Columna"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide">Quitar Col</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsChartPanelOpen(!isChartPanelOpen)}
              className={`group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 ${
                isChartPanelOpen
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-600'
                  : 'bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary'
              }`}
              aria-label="Analizar datos"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <BarChart2 className={`h-4 w-4 ${isChartPanelOpen ? 'text-teal-600' : 'text-teal-500'}`} />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide">
                  Analizar
                </span>
              </div>
            </button>

            <button
              onClick={toggleFullscreen}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
              title={isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
            >
              <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                {isFullscreen ? <Minimize className="h-4 w-4 text-text-primary" /> : <Maximize className="h-4 w-4 text-text-primary" />}
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide text-text-primary">
                  {isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
                </span>
              </div>
            </button>

            <button
              onClick={handleExportExcel}
              className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary"
              aria-label="Descargar Excel"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                <Download className="h-4 w-4 text-text-primary" />
              </div>
              <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-sm font-bold tracking-wide text-text-primary">
                  Descargar Excel
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame (Grid + Analytics Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Spreadsheet Left Side: Grid + Tabs */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-secondary/40">
          {/* Spreadsheet Grid Container */}
          <div className="flex-1 overflow-auto p-4" ref={gridRef}>
            <div className="inline-block min-w-full align-middle border border-border-medium rounded-xl shadow-sm overflow-hidden bg-surface-primary">
              <table className="min-w-full border-collapse text-left font-sans text-xs">
                <thead>
                  <tr className="bg-surface-secondary select-none">
                    {/* Index Column */}
                    <th className="w-10 border-r border-b border-border-medium text-center font-mono font-bold text-text-tertiary p-1.5"></th>
                    {data[0]?.map((_, colIdx) => (
                      <th
                        key={colIdx}
                        className="border-r border-b border-border-medium text-center font-mono font-bold text-text-secondary px-3 py-1.5 min-w-[120px]"
                      >
                        {getColumnLabel(colIdx)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-surface-hover/30 transition-colors">
                      {/* Index Row Cell */}
                      <td className="border-r border-b border-border-medium text-center font-mono font-bold bg-surface-secondary text-text-tertiary select-none p-1.5">
                        {rowIdx + 1}
                      </td>
                      {row.map((cellVal, colIdx) => {
                        const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                        const displayVal = isSelected ? cellVal : evaluateFormula(cellVal, data);
                        return (
                          <td
                            key={colIdx}
                            onClick={() => handleCellClick(rowIdx, colIdx)}
                            className={`border-r border-b border-border-medium px-3 py-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-teal-500/10 outline outline-2 outline-teal-500 z-10'
                                : 'hover:bg-teal-500/5'
                            }`}
                          >
                            <input
                              id={`cell-${rowIdx}-${colIdx}`}
                              type="text"
                              value={displayVal}
                              onFocus={() => handleCellClick(rowIdx, colIdx)}
                              onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                              onChange={(e) => {
                                updateCell(rowIdx, colIdx, e.target.value);
                                setFormulaValue(e.target.value);
                              }}
                              className="w-full bg-transparent border-none outline-none text-text-primary cursor-pointer focus:cursor-text"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pestañas (Hojas) del Excel con Estilo WAPPY Premium */}
          <div className="flex items-center justify-between border-t border-border-medium bg-surface-secondary px-4 py-2 mt-auto select-none">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[80%] pr-2 scrollbar-none">
              {Object.keys(sheets).map((sheetName) => {
                const isActive = activeSheet === sheetName;
                return (
                  <button
                    key={sheetName}
                    onClick={() => {
                      setActiveSheet(sheetName);
                      setSelectedCell(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                        : 'bg-transparent border border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <FileSpreadsheet className={`h-3.5 w-3.5 ${isActive ? 'text-teal-500' : 'text-text-secondary'}`} />
                    <span>{sheetName}</span>
                  </button>
                );
              })}
            </div>

            {/* Controles de hojas */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const newSheetName = `Hoja ${Object.keys(sheets).length + 1}`;
                  const newSheets = {
                    ...sheets,
                    [newSheetName]: [['', '', ''], ['', '', ''], ['', '', '']]
                  };
                  setSheets(newSheets);
                  setActiveSheet(newSheetName);
                  setSelectedCell(null);
                  onUpdate(JSON.stringify(newSheets));
                }}
                title="Añadir nueva pestaña"
                className="p-1.5 rounded-lg text-text-secondary hover:text-teal-500 dark:hover:text-teal-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
              
              {Object.keys(sheets).length > 1 && (
                <button
                  onClick={() => {
                    const keys = Object.keys(sheets);
                    const currentIndex = keys.indexOf(activeSheet);
                    const updatedSheets = { ...sheets };
                    delete updatedSheets[activeSheet];
                    
                    const nextActiveSheet = keys[currentIndex - 1] || keys[currentIndex + 1] || Object.keys(updatedSheets)[0];
                    setSheets(updatedSheets);
                    setActiveSheet(nextActiveSheet);
                    setSelectedCell(null);
                    
                    const nextKeys = Object.keys(updatedSheets);
                    const hasMultipleSheets = nextKeys.length > 1 || nextKeys[0] !== 'Hoja 1';
                    if (hasMultipleSheets) {
                      onUpdate(JSON.stringify(updatedSheets));
                    } else {
                      onUpdate(JSON.stringify(updatedSheets[nextActiveSheet]));
                    }
                  }}
                  title="Eliminar pestaña actual"
                  className="p-1.5 rounded-lg text-text-secondary hover:text-rose-500 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Modal Overlay */}
        {isChartPanelOpen && createPortal(
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 font-sans">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setIsChartPanelOpen(false)} 
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl h-[85vh] bg-surface-primary border border-border-light rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border-light bg-surface-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-[14px]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-text-primary tracking-tight flex items-center gap-1.5">
                      Análisis de Datos <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5 font-medium">
                      Análisis estadístico, indicadores en tiempo real y gráficos interactivos
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChartPanelOpen(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Modal Body - 2 Column Split Grid */}
              <div className="flex-1 overflow-y-auto p-6 bg-surface-primary grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Left Column - Controls & Stats (lg:col-span-4) */}
                <div className="lg:col-span-4 flex flex-col space-y-4 max-h-full overflow-y-auto pr-1">
                  {/* Dimension Selectors Card */}
                  <div className="bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3.5 shadow-sm">
                    <span className="text-xs font-bold text-text-primary tracking-tight block">Dimensiones de Gráfico</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Eje X (Etiqueta)</label>
                        <select
                          value={xAxisCol}
                          onChange={(e) => setXAxisCol(parseInt(e.target.value))}
                          className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg p-2 outline-none focus:border-teal-500 transition-colors cursor-pointer"
                        >
                          {columnsList.map((col) => (
                            <option key={col.index} value={col.index}>{col.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Eje Y (Valor)</label>
                        <select
                          value={yAxisCol}
                          onChange={(e) => setYAxisCol(parseInt(e.target.value))}
                          className="w-full text-xs bg-surface-primary border border-border-medium rounded-lg p-2 outline-none focus:border-teal-500 transition-colors cursor-pointer"
                        >
                          {columnsList.map((col) => (
                            <option key={col.index} value={col.index}>{col.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Operación / Agregación de Datos */}
                  <div className="bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm">
                    <span className="text-xs font-bold text-text-primary tracking-tight block">Operación de Análisis</span>
                    <div className="flex bg-surface-primary border border-border-medium rounded-xl p-1 shadow-sm shrink-0">
                      {(['sum', 'avg', 'count'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setAggMethod(m)}
                          className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer ${
                            aggMethod === m
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          {m === 'sum' ? 'Suma' : m === 'avg' ? 'Promedio' : 'Frecuencia'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart Format Buttons */}
                  <div className="flex bg-surface-secondary border border-border-medium rounded-xl p-1 shadow-sm shrink-0">
                    {(['bar', 'line', 'area', 'pie'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setChartType(t)}
                        className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                          chartType === t
                            ? 'bg-teal-500 text-white shadow-sm'
                            : 'text-text-secondary hover:bg-surface-hover'
                        }`}
                      >
                        {t === 'bar' ? 'Barras' : t === 'line' ? 'Líneas' : t === 'area' ? 'Área' : 'Torta'}
                      </button>
                    ))}
                  </div>

                  {/* Quick Statistics Card */}
                  <div className="bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm">
                    <span className="text-xs font-bold text-text-primary tracking-tight block">Indicadores del Eje Y</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between">
                        <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wide">Total Suma</span>
                        <span className="text-sm font-bold text-text-primary mt-1 font-mono">{suma.toLocaleString()}</span>
                      </div>
                      <div className="bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between">
                        <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wide">Promedio</span>
                        <span className="text-sm font-bold text-teal-600 mt-1 font-mono">{(Math.round(promedio * 100) / 100).toLocaleString()}</span>
                      </div>
                      <div className="bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wide">Límites Máx/Mín</span>
                          <span className="text-[9px] bg-teal-500/10 text-teal-600 px-1.5 py-0.5 rounded-full font-mono font-semibold">Regs: {conteo}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-medium/30">
                          <div>
                            <span className="text-[9px] text-text-tertiary block">Máx: <strong className="text-text-secondary truncate block max-w-[80px]">{maxLabel}</strong></span>
                            <span className="text-xs font-bold text-green-600 font-mono">{maxVal.toLocaleString()}</span>
                          </div>
                          <div className="border-l border-border-medium/30 pl-2">
                            <span className="text-[9px] text-text-tertiary block">Mín: <strong className="text-text-secondary truncate block max-w-[80px]">{minLabel}</strong></span>
                            <span className="text-xs font-bold text-red-500 font-mono">{minVal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Breakdown Table Card */}
                  <div className="bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm flex flex-col min-h-[160px]">
                    <span className="text-xs font-bold text-text-primary tracking-tight block">Tabla de Distribución</span>
                    <div className="flex-1 overflow-y-auto border border-border-medium rounded-xl bg-surface-primary shadow-sm max-h-[180px]">
                      <table className="w-full text-left font-sans text-[11px] border-collapse">
                        <thead className="bg-surface-secondary sticky top-0 font-bold text-text-secondary select-none border-b border-border-medium z-10">
                          <tr>
                            <th className="p-2">Categoría</th>
                            <th className="p-2 text-right">Valor</th>
                            <th className="p-2 text-right">% Part.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((d, i) => {
                            const pct = suma > 0 ? (d.val / suma) * 100 : 0;
                            return (
                              <tr key={i} className="border-b border-border-medium hover:bg-surface-hover/20">
                                <td className="p-2 font-medium text-text-primary max-w-[120px] truncate" title={d.label}>{d.label}</td>
                                <td className="p-2 text-right font-mono text-text-secondary">{d.val.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono text-teal-600 font-semibold">{Math.round(pct)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Copy HTML Table Button */}
                  <button
                    onClick={copyTableAsHtml}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 font-bold text-xs tracking-wide uppercase transition-all shadow-sm cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Tabla como HTML Premium
                  </button>
                </div>

                {/* Right Column - SVG Interactive Chart Canvas (lg:col-span-8) */}
                <div className="lg:col-span-8 bg-surface-secondary/40 border border-border-light rounded-2xl p-5 flex flex-col items-center justify-center min-h-[350px] relative shadow-sm overflow-hidden">
                  {conteo === 0 ? (
                    <div className="text-center py-8 text-text-tertiary">
                      <Info className="h-8 w-8 mx-auto mb-2 text-text-tertiary/50" />
                      <p className="text-xs">No hay datos válidos para graficar con la operación seleccionada.</p>
                    </div>
                  ) : (
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 500 280"
                      className="overflow-visible w-full max-h-[380px]"
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
                        </filter>
                      </defs>

                      {/* Renderizar Gráfico de Barras */}
                      {chartType === 'bar' && (() => {
                        const graphWidth = 430;
                        const graphHeight = 220;
                        const xOffset = 45;
                        const yOffset = 15;
                        const barW = Math.min(36, (graphWidth / conteo) * 0.7);
                        const spacing = (graphWidth / conteo);
                        
                        return chartData.map((d, i) => {
                          const barHeight = maxVal > 0 ? (d.val / maxVal) * graphHeight : 0;
                          const x = xOffset + i * spacing + (spacing - barW) / 2;
                          const y = yOffset + graphHeight - barHeight;
                          const isHovered = hoveredIndex === i;

                          return (
                            <g key={i}>
                              <rect
                                x={x}
                                y={y}
                                width={barW}
                                height={Math.max(2, barHeight)}
                                fill="url(#barGradient)"
                                rx="4"
                                className="transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-5 duration-500"
                                style={{
                                  transformOrigin: `${x + barW/2}px ${y + barHeight}px`,
                                  opacity: hoveredIndex === null || isHovered ? 1 : 0.6,
                                  filter: isHovered ? 'url(#shadow)' : 'none',
                                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                                }}
                                onMouseEnter={(e) => {
                                  setHoveredIndex(i);
                                  setTooltipPos({ x: e.clientX, y: e.clientY });
                                }}
                                onMouseMove={(e) => {
                                  setTooltipPos({ x: e.clientX, y: e.clientY });
                                }}
                              />
                              {conteo <= 15 && (
                                <text
                                  x={x + barW / 2}
                                  y={graphHeight + yOffset + 16}
                                  textAnchor="middle"
                                  fill="currentColor"
                                  className="text-[9px] font-mono text-text-tertiary select-none"
                                >
                                  {d.label.length > 9 ? `${d.label.slice(0, 8)}.` : d.label}
                                </text>
                              )}
                            </g>
                          );
                        });
                      })()}

                      {/* Renderizar Gráfico de Línea o Área */}
                      {(chartType === 'line' || chartType === 'area') && (() => {
                        const graphWidth = 430;
                        const graphHeight = 220;
                        const xOffset = 45;
                        const yOffset = 15;
                        const spacing = conteo > 1 ? graphWidth / (conteo - 1) : graphWidth;

                        const points = chartData.map((d, i) => {
                          const x = xOffset + i * spacing;
                          const y = yOffset + graphHeight - (maxVal > 0 ? (d.val / maxVal) * graphHeight : 0);
                          return { x, y };
                        });

                        let pathD = '';
                        if (points.length > 0) {
                          pathD = `M ${points[0].x} ${points[0].y}`;
                          for (let i = 1; i < points.length; i++) {
                            const p0 = points[i - 1];
                            const p = points[i];
                            const cpX1 = p0.x + spacing / 3;
                            const cpY1 = p0.y;
                            const cpX2 = p.x - spacing / 3;
                            const cpY2 = p.y;
                            pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
                          }
                        }

                        const areaPathD = points.length > 0
                          ? `${pathD} L ${points[points.length - 1].x} ${graphHeight + yOffset} L ${points[0].x} ${graphHeight + yOffset} Z`
                          : '';

                        return (
                          <g>
                            {chartType === 'area' && points.length > 0 && (
                              <path
                                d={areaPathD}
                                fill="url(#areaGradient)"
                                className="transition-all duration-500 animate-in fade-in duration-500"
                              />
                            )}
                            {points.length > 0 && (
                              <path
                                d={pathD}
                                fill="none"
                                stroke="url(#lineGradient)"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                className="transition-all duration-500 animate-in fade-in duration-500"
                              />
                            )}
                            {points.map((p, i) => {
                              const isHovered = hoveredIndex === i;
                              return (
                                <circle
                                  key={i}
                                  cx={p.x}
                                  cy={p.y}
                                  r={isHovered ? 6 : 4}
                                  fill={isHovered ? '#ec4899' : '#8b5cf6'}
                                  stroke="white"
                                  strokeWidth="1.5"
                                  className="transition-all duration-150 cursor-pointer shadow-sm"
                                  style={{
                                    filter: isHovered ? 'url(#shadow)' : 'none'
                                  }}
                                  onMouseEnter={(e) => {
                                    setHoveredIndex(i);
                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                  }}
                                  onMouseMove={(e) => {
                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                  }}
                                />
                              );
                            })}
                            {conteo <= 15 && points.map((p, i) => (
                              <text
                                key={`lbl-${i}`}
                                x={p.x}
                                y={graphHeight + yOffset + 16}
                                textAnchor="middle"
                                fill="currentColor"
                                className="text-[9px] font-mono text-text-tertiary select-none"
                              >
                                {chartData[i].label.length > 9 ? `${chartData[i].label.slice(0, 8)}.` : chartData[i].label}
                              </text>
                            ))}
                          </g>
                        );
                      })()}

                      {/* Renderizar Gráfico de Torta (Pie Chart) */}
                      {chartType === 'pie' && (() => {
                        const centerX = 240;
                        const centerY = 125;
                        const radius = 100;
                        let accumulatedAngle = 0;

                        return chartData.map((d, i) => {
                          if (suma === 0) return null;
                          const percentage = d.val / suma;
                          const angle = percentage * 360;
                          
                          const x1 = centerX + radius * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
                          const y1 = centerY + radius * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
                          
                          accumulatedAngle += angle;
                          
                          const x2 = centerX + radius * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
                          const y2 = centerY + radius * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
                          
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          const pathData = `
                            M ${centerX} ${centerY}
                            L ${x1} ${y1}
                            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                            Z
                          `;

                          const sliceColors = [
                            '#0d9488', '#06b6d4', '#3b82f6', '#6366f1', 
                            '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', 
                            '#10b981', '#14b8a6'
                          ];
                          const color = sliceColors[i % sliceColors.length];
                          const isHovered = hoveredIndex === i;

                          const midAngle = accumulatedAngle - angle / 2 - 90;
                          const moveDist = isHovered ? 8 : 0;
                          const translate = `translate(${moveDist * Math.cos(midAngle * Math.PI / 180)}px, ${moveDist * Math.sin(midAngle * Math.PI / 180)}px)`;

                          return (
                            <path
                              key={i}
                              d={pathData}
                              fill={color}
                              stroke="white"
                              strokeWidth="1.5"
                              className="transition-all duration-300 cursor-pointer animate-in fade-in duration-500"
                              style={{
                                transform: translate,
                                opacity: hoveredIndex === null || isHovered ? 1 : 0.7,
                                filter: isHovered ? 'url(#shadow)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                setHoveredIndex(i);
                                setTooltipPos({ x: e.clientX, y: e.clientY });
                              }}
                              onMouseMove={(e) => {
                                setTooltipPos({ x: e.clientX, y: e.clientY });
                              }}
                            />
                          );
                        });
                      })()}
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Reactive floating tooltip */}
      {hoveredIndex !== null && isChartPanelOpen && chartData[hoveredIndex] && (
        <div
          className="fixed z-[99999999] pointer-events-none backdrop-blur-md bg-surface-primary/95 border border-border-medium rounded-xl p-2.5 shadow-xl text-xs font-sans text-text-primary flex flex-col gap-1"
          style={{ left: tooltipPos.x + 15, top: tooltipPos.y - 10 }}
        >
          <span className="font-bold text-text-secondary">{chartData[hoveredIndex].label}</span>
          <span className="text-teal-600 dark:text-teal-400 font-mono text-sm font-semibold">
            Valor: {chartData[hoveredIndex].val.toLocaleString()}
          </span>
        </div>
      )}

      {/* Floating HTML Copied notification */}
      {showHtmlCopiedToast && (
        <div className="fixed bottom-5 right-5 z-[99999] bg-emerald-600 text-white rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2.5 border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans">
          <Sparkles className="h-4 w-4 text-emerald-300 animate-spin" />
          <span className="text-xs font-bold">¡Tabla HTML copiada al portapapeles con éxito!</span>
        </div>
      )}
    </div>
  );
};

export default CanvasExcelEditor;
