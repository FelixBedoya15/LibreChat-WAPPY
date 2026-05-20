import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, FileSpreadsheet, Download, RefreshCw, Grid } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface CanvasExcelEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  title: string;
}

const CanvasExcelEditor: React.FC<CanvasExcelEditorProps> = ({ initialContent, onUpdate, title }) => {
  const [data, setData] = useState<string[][]>([['', '', ''], ['', '', ''], ['', '', '']]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaValue, setFormulaValue] = useState<string>('');
  const gridRef = useRef<HTMLDivElement>(null);

  // Load initial content
  useEffect(() => {
    if (initialContent) {
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
      worksheet.addRow(row);
      const wsRow = worksheet.getRow(rowIndex + 1);

      // Styling: alternate row backgrounds, headers, border styles
      row.forEach((_, colIndex) => {
        const cell = wsRow.getCell(colIndex + 1);
        
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
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-surface-primary border border-border-medium hover:bg-surface-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-green-500" />
              <span>Fila</span>
            </button>
            <button
              onClick={deleteRow}
              disabled={data.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-surface-primary border border-border-medium hover:bg-surface-hover disabled:opacity-40 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Quitar Fila</span>
            </button>
            <div className="h-4 w-px bg-border-medium" />
            <button
              onClick={addColumn}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-surface-primary border border-border-medium hover:bg-surface-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-green-500" />
              <span>Columna</span>
            </button>
            <button
              onClick={deleteColumn}
              disabled={data[0]?.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-surface-primary border border-border-medium hover:bg-surface-hover disabled:opacity-40 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Quitar Col</span>
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar Excel</span>
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
                          value={cellVal}
                          onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
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
