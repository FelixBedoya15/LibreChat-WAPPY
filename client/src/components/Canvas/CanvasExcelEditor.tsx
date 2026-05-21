import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, FileSpreadsheet, Download, RefreshCw, Grid, BarChart2, TrendingUp, Sparkles, Copy, X, PieChart, Info } from 'lucide-react';
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

function getCellValue(row: number, col: number, gridData: string[][], visited: Set<string> = new Set()): number {
  const cellKey = `${row},${col}`;
  if (visited.has(cellKey)) {
    return 0; // circular dependency protection
  }
  visited.add(cellKey);
  
  const rawVal = gridData[row]?.[col] || '';
  if (rawVal.startsWith('=')) {
    const evaluated = evaluateFormula(rawVal, gridData, visited);
    const parsed = parseFloat(evaluated);
    visited.delete(cellKey);
    return isNaN(parsed) ? 0 : parsed;
  }
  visited.delete(cellKey);
  const parsed = parseFloat(rawVal);
  return isNaN(parsed) ? 0 : parsed;
}

function evaluateFormula(formula: string, gridData: string[][], visited: Set<string> = new Set()): string {
  if (!formula || !formula.startsWith('=')) return formula;

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

const CanvasExcelEditor: React.FC<CanvasExcelEditorProps> = ({ initialContent, onUpdate, title, onRegisterDownload }) => {
  const [data, setData] = useState<string[][]>([['', '', ''], ['', '', ''], ['', '', '']]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaValue, setFormulaValue] = useState<string>('');
  const gridRef = useRef<HTMLDivElement>(null);

  // Estados para el panel de análisis gráfico
  const [isChartPanelOpen, setIsChartPanelOpen] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
  const [xAxisCol, setXAxisCol] = useState<number>(0);
  const [yAxisCol, setYAxisCol] = useState<number>(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showHtmlCopiedToast, setShowHtmlCopiedToast] = useState<boolean>(false);

  // Auto-detectar la primera columna numérica cuando cambie la data
  useEffect(() => {
    if (data && data[0] && data[0].length > 1) {
      for (let col = 1; col < data[0].length; col++) {
        let hasNumber = false;
        for (let row = 1; row < data.length; row++) {
          const val = data[row]?.[col] || '';
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

  // Load initial content
  useEffect(() => {
    if (initialContent) {
      if (Array.isArray(initialContent)) {
        setData(initialContent);
        return;
      }
      try {
        const parsed = JSON.parse(initialContent);
        if (Array.isArray(parsed) && parsed.every(row => Array.isArray(row))) {
          setData(parsed);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse excel content JSON, using fallback', e);
      }
    }
    // Fallback default grid
    setData([
      ['Indicador', 'Meta', 'Resultado', 'Cumplimiento'],
      ['Capacitaciones Realizadas', '12', '10', '83.3%'],
      ['Simulacros de Emergencia', '2', '2', '100%'],
      ['Inspecciones de Seguridad', '24', '18', '75%'],
    ]);
  }, [initialContent]);

  const updateCell = (row: number, col: number, value: string) => {
    const updated = data.map((r, rIdx) => 
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? value : c))
    );
    setData(updated);
    onUpdate(JSON.stringify(updated));
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setFormulaValue(data[row][col] || '');
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
    setData(updated);
    onUpdate(JSON.stringify(updated));
  };

  const deleteRow = () => {
    if (data.length <= 1) return;
    const updated = data.slice(0, -1);
    setData(updated);
    onUpdate(JSON.stringify(updated));
    setSelectedCell(null);
  };

  const addColumn = () => {
    const updated = data.map(row => [...row, '']);
    setData(updated);
    onUpdate(JSON.stringify(updated));
  };

  const deleteColumn = () => {
    if (data[0]?.length <= 1) return;
    const updated = data.map(row => row.slice(0, -1));
    setData(updated);
    onUpdate(JSON.stringify(updated));
    setSelectedCell(null);
  };

  const getColumnLabel = (index: number): string => {
    let label = '';
    let temp = index;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 65) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
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
        const displayVal = cellVal.startsWith('=') ? evaluateFormula(cellVal, data) : cellVal;
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

  useEffect(() => {
    if (onRegisterDownload) {
      onRegisterDownload(handleExportExcel);
    }
  }, [onRegisterDownload, data, title]);

  return (
    <div className="flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden">
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
        {/* Spreadsheet Grid Container */}
        <div className="flex-1 overflow-auto p-4 bg-surface-secondary/40" ref={gridRef}>
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
                            type="text"
                            value={displayVal}
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

        {/* Analytics Sidebar */}
        {isChartPanelOpen && (
          <div className="w-[420px] border-l border-border-medium bg-surface-secondary flex flex-col h-full overflow-hidden shrink-0 animate-in slide-in-from-right duration-300">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border-medium flex items-center justify-between bg-surface-primary">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-600 animate-pulse" />
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  Análisis de Datos <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </h3>
              </div>
              <button
                onClick={() => setIsChartPanelOpen(false)}
                className="p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-text-tertiary transition-colors"
                aria-label="Cerrar panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sidebar Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(() => {
                const colHeaders = data[0] || [];
                const columnsList = colHeaders.map((h, i) => ({
                  index: i,
                  label: h || `Columna ${getColumnLabel(i)}`
                }));

                const chartData = data.slice(1).map((row, idx) => {
                  const labelVal = row[xAxisCol] || `Fila ${idx + 1}`;
                  const label = labelVal.startsWith('=') ? evaluateFormula(labelVal, data) : labelVal;
                  
                  const rawVal = row[yAxisCol] || '0';
                  const evaluatedVal = rawVal.startsWith('=') ? evaluateFormula(rawVal, data) : rawVal;
                  
                  const cleanedVal = parseFloat(evaluatedVal.replace(/[^0-9.\-]/g, ''));
                  const val = isNaN(cleanedVal) ? 0 : cleanedVal;
                  return { label, val, raw: evaluatedVal };
                }).filter(item => item.label || item.val > 0);

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

                return (
                  <>
                    {/* Dimension selectors */}
                    <div className="bg-surface-primary border border-border-medium rounded-xl p-3.5 space-y-3 shadow-sm">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Eje X (Etiqueta)</label>
                          <select
                            value={xAxisCol}
                            onChange={(e) => setXAxisCol(parseInt(e.target.value))}
                            className="w-full text-xs bg-surface-secondary border border-border-medium rounded-lg p-1.5 outline-none focus:border-teal-500 transition-colors"
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
                            className="w-full text-xs bg-surface-secondary border border-border-medium rounded-lg p-1.5 outline-none focus:border-teal-500 transition-colors"
                          >
                            {columnsList.map((col) => (
                              <option key={col.index} value={col.index}>{col.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Chart format buttons */}
                    <div className="flex bg-surface-primary border border-border-medium rounded-xl p-1 shadow-sm">
                      {(['bar', 'line', 'area', 'pie'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setChartType(t)}
                          className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                            chartType === t
                              ? 'bg-teal-500 text-white shadow-sm'
                              : 'text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          {t === 'bar' ? 'Barras' : t === 'line' ? 'Líneas' : t === 'area' ? 'Área' : 'Torta'}
                        </button>
                      ))}
                    </div>

                    {/* SVG Graphic engine with Zero dependencies */}
                    <div className="bg-surface-primary border border-border-medium rounded-xl p-4 shadow-sm flex items-center justify-center relative min-h-[220px]">
                      {conteo === 0 ? (
                        <div className="text-center py-8 text-text-tertiary">
                          <Info className="h-8 w-8 mx-auto mb-2 text-text-tertiary/50" />
                          <p className="text-xs">No hay datos numéricos para graficar.</p>
                        </div>
                      ) : (
                        <svg
                          width="350"
                          height="200"
                          viewBox="0 0 350 200"
                          className="overflow-visible"
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
                            const graphWidth = 290;
                            const graphHeight = 150;
                            const xOffset = 45;
                            const yOffset = 15;
                            const barW = Math.min(30, (graphWidth / conteo) * 0.7);
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
                                    className="transition-all duration-300 cursor-pointer"
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
                                  {conteo <= 10 && (
                                    <text
                                      x={x + barW / 2}
                                      y={graphHeight + yOffset + 15}
                                      textAnchor="middle"
                                      fill="currentColor"
                                      className="text-[9px] font-mono text-text-tertiary select-none"
                                    >
                                      {d.label.length > 8 ? `${d.label.slice(0, 7)}.` : d.label}
                                    </text>
                                  )}
                                </g>
                              );
                            });
                          })()}

                          {/* Renderizar Gráfico de Línea o Área */}
                          {(chartType === 'line' || chartType === 'area') && (() => {
                            const graphWidth = 290;
                            const graphHeight = 150;
                            const xOffset = 45;
                            const yOffset = 15;
                            const spacing = conteo > 1 ? graphWidth / (conteo - 1) : graphWidth;

                            const points = chartData.map((d, i) => {
                              const x = xOffset + i * spacing;
                              const y = yOffset + graphHeight - (maxVal > 0 ? (d.val / maxVal) * graphHeight : 0);
                              return { x, y };
                            });

                            const lineD = points.reduce((acc, p, i) => 
                              i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
                            );

                            const areaD = points.length > 0 
                              ? `${lineD} L ${points[points.length - 1].x} ${yOffset + graphHeight} L ${points[0].x} ${yOffset + graphHeight} Z`
                              : '';

                            return (
                              <g>
                                {chartType === 'area' && points.length > 0 && (
                                  <path d={areaD} fill="url(#areaGradient)" className="transition-all duration-500" />
                                )}

                                <path
                                  d={lineD}
                                  fill="none"
                                  stroke="url(#lineGradient)"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="transition-all duration-500"
                                  style={{ filter: 'url(#shadow)' }}
                                />

                                {points.map((p, i) => {
                                  const isHovered = hoveredIndex === i;
                                  return (
                                    <circle
                                      key={i}
                                      cx={p.x}
                                      cy={p.y}
                                      r={isHovered ? 6 : 4}
                                      fill={isHovered ? '#ec4899' : '#8b5cf6'}
                                      stroke="#ffffff"
                                      strokeWidth="1.5"
                                      className="transition-all duration-200 cursor-pointer"
                                      style={{ filter: isHovered ? 'url(#shadow)' : 'none' }}
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

                                {conteo <= 10 && points.map((p, i) => (
                                  <text
                                    key={i}
                                    x={p.x}
                                    y={graphHeight + yOffset + 15}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    className="text-[9px] font-mono text-text-tertiary select-none"
                                  >
                                    {chartData[i].label.length > 8 ? `${chartData[i].label.slice(0, 7)}.` : chartData[i].label}
                                  </text>
                                ))}
                              </g>
                            );
                          })()}

                          {/* Renderizar Gráfico de Torta (Pie) */}
                          {chartType === 'pie' && (() => {
                            const cx = 175;
                            const cy = 100;
                            const r = 75;
                            let accumulatedAngle = -Math.PI / 2;

                            const colors = [
                              '#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', 
                              '#f59e0b', '#ef4444', '#10b981', '#6366f1'
                            ];

                            return chartData.map((d, i) => {
                              if (suma === 0) return null;
                              const angle = (d.val / suma) * Math.PI * 2;
                              
                              const x1 = cx + Math.cos(accumulatedAngle) * r;
                              const y1 = cy + Math.sin(accumulatedAngle) * r;
                              const x2 = cx + Math.cos(accumulatedAngle + angle) * r;
                              const y2 = cy + Math.sin(accumulatedAngle + angle) * r;
                              
                              const largeArcFlag = angle > Math.PI ? 1 : 0;
                              const pathD = `
                                M ${cx} ${cy}
                                L ${x1} ${y1}
                                A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
                                Z
                              `;

                              const midAngle = accumulatedAngle + angle / 2;
                              const isHovered = hoveredIndex === i;
                              const offset = isHovered ? 6 : 0;
                              const dx = Math.cos(midAngle) * offset;
                              const dy = Math.sin(midAngle) * offset;

                              accumulatedAngle += angle;
                              const color = colors[i % colors.length];

                              return (
                                <path
                                  key={i}
                                  d={pathD}
                                  fill={color}
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                  className="transition-all duration-300 cursor-pointer"
                                  style={{
                                    transform: `translate(${dx}px, ${dy}px)`,
                                    filter: isHovered ? 'url(#shadow)' : 'none',
                                    opacity: hoveredIndex === null || isHovered ? 1 : 0.8
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

                          {chartType !== 'pie' && (
                            <g>
                              <line x1="45" y1="15" x2="45" y2="165" stroke="currentColor" className="text-border-medium" strokeWidth="1" />
                              <line x1="45" y1="165" x2="335" y2="165" stroke="currentColor" className="text-border-medium" strokeWidth="1" />
                              <line x1="45" y1="90" x2="335" y2="90" stroke="currentColor" className="text-border-medium/30" strokeDasharray="3,3" />
                              <line x1="45" y1="15" x2="335" y2="15" stroke="currentColor" className="text-border-medium/30" strokeDasharray="3,3" />

                              <text x="40" y="20" textAnchor="end" className="text-[8px] font-mono text-text-tertiary select-none">{maxVal.toLocaleString()}</text>
                              <text x="40" y="93" textAnchor="end" className="text-[8px] font-mono text-text-tertiary select-none">{(maxVal / 2).toLocaleString()}</text>
                              <text x="40" y="168" textAnchor="end" className="text-[8px] font-mono text-text-tertiary select-none">0</text>
                            </g>
                          )}
                        </svg>
                      )}
                    </div>

                    {/* Quick statistical metrics */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Estadísticas de la Columna</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between">
                          <span className="text-[10px] text-text-tertiary font-semibold uppercase">Total Suma</span>
                          <span className="text-sm font-bold text-text-primary mt-1 font-mono">{suma.toLocaleString()}</span>
                        </div>
                        <div className="bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between">
                          <span className="text-[10px] text-text-tertiary font-semibold uppercase">Promedio</span>
                          <span className="text-sm font-bold text-teal-600 mt-1 font-mono">{(Math.round(promedio * 100) / 100).toLocaleString()}</span>
                        </div>
                        <div className="bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between col-span-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-text-tertiary font-semibold uppercase">Límites Máx/Mín</span>
                            <span className="text-[9px] bg-teal-500/10 text-teal-600 px-1.5 py-0.5 rounded-full font-mono font-semibold">Regs: {conteo}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-medium/30">
                            <div>
                              <span className="text-[9px] text-text-tertiary block">Máx: <strong className="text-text-secondary">{maxLabel}</strong></span>
                              <span className="text-xs font-bold text-green-600 font-mono">{maxVal.toLocaleString()}</span>
                            </div>
                            <div className="border-l border-border-medium/30 pl-2">
                              <span className="text-[9px] text-text-tertiary block">Mín: <strong className="text-text-secondary">{minLabel}</strong></span>
                              <span className="text-xs font-bold text-red-500 font-mono">{minVal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Copy Table to Premium HTML */}
                    <div className="pt-2">
                      <button
                        onClick={copyTableAsHtml}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 font-bold text-xs tracking-wide uppercase transition-all shadow-sm"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar Tabla como HTML Premium
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Reactive floating tooltip */}
      {hoveredIndex !== null && isChartPanelOpen && (() => {
        const colHeaders = data[0] || [];
        const chartData = data.slice(1).map((row, idx) => {
          const labelVal = row[xAxisCol] || `Fila ${idx + 1}`;
          const label = labelVal.startsWith('=') ? evaluateFormula(labelVal, data) : labelVal;
          const rawVal = row[yAxisCol] || '0';
          const evaluatedVal = rawVal.startsWith('=') ? evaluateFormula(rawVal, data) : rawVal;
          const cleanedVal = parseFloat(evaluatedVal.replace(/[^0-9.\-]/g, ''));
          const val = isNaN(cleanedVal) ? 0 : cleanedVal;
          return { label, val };
        }).filter(item => item.label || item.val > 0);

        if (!chartData[hoveredIndex]) return null;

        return (
          <div
            className="fixed z-[99999] pointer-events-none backdrop-blur-md bg-surface-primary/95 border border-border-medium rounded-xl p-2.5 shadow-xl text-xs font-sans text-text-primary flex flex-col gap-1"
            style={{ left: tooltipPos.x + 15, top: tooltipPos.y - 10 }}
          >
            <span className="font-bold text-text-secondary">{chartData[hoveredIndex].label}</span>
            <span className="text-teal-600 dark:text-teal-400 font-mono text-sm font-semibold">
              Valor: {chartData[hoveredIndex].val.toLocaleString()}
            </span>
          </div>
        );
      })()}

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
