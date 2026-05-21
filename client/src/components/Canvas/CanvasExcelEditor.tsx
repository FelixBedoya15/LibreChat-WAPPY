import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, FileSpreadsheet, Download, RefreshCw, Grid } from 'lucide-react';
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
    </div>
  );
};

export default CanvasExcelEditor;
