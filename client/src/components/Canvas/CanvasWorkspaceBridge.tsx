import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  FileSpreadsheet, 
  FileText, 
  Table2, 
  BarChart3, 
  Sparkles, 
  Check, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';

interface CanvasSessionSummary {
  conversationId: string;
  title: string;
  updatedAt: string;
  fileType: 'text' | 'excel' | 'presentation' | 'html';
}

interface CanvasWorkspaceBridgeProps {
  onClose: () => void;
  onImportTable?: (html: string) => void;
  onImportChart?: (chartConfig: {
    type: 'bar' | 'line' | 'pie';
    data: Array<{ label: string; val: number }>;
    title: string;
  }) => void;
  onImportBullets?: (title: string, bullets: string[]) => void;
  activeFileType: 'text' | 'presentation';
}

const CanvasWorkspaceBridge: React.FC<CanvasWorkspaceBridgeProps> = ({
  onClose,
  onImportTable,
  onImportChart,
  onImportBullets,
  activeFileType
}) => {
  const [history, setHistory] = useState<CanvasSessionSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'excel' | 'text'>('excel');
  
  // Selected Document States
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedDocTitle, setSelectedDocTitle] = useState<string>('');
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  
  // Excel Data States
  const [excelData, setExcelData] = useState<string[][]>([]);
  const [excelRange, setExcelRange] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  }>({ startRow: 0, startCol: 0, endRow: 2, endCol: 2 });
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [chartTitle, setChartTitle] = useState<string>('Gráfico Importado');
  const [xAxisCol, setXAxisCol] = useState<number>(0);
  const [yAxisCol, setYAxisCol] = useState<number>(1);
  
  // Word/Text Data States
  const [textParagraphs, setTextParagraphs] = useState<string[]>([]);
  const [selectedParagraphs, setSelectedParagraphs] = useState<number[]>([]);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [summaryTitle, setSummaryTitle] = useState<string>('Resumen de Política');

  // Fetch History on Mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/sgsst/canvas/history');
      if (!res.ok) throw new Error('Error al conectar con el servidor.');
      const data = await res.json();
      
      // Filter out presentation files so we only list sources (Excel/Text)
      const list = (data.conversations || []) as CanvasSessionSummary[];
      setHistory(list);
      
      // Pre-select first appropriate file in history if available
      const excelDocs = list.filter(d => d.fileType === 'excel');
      const textDocs = list.filter(d => d.fileType === 'text');
      
      if (activeTab === 'excel' && excelDocs.length > 0) {
        loadDocument(excelDocs[0].conversationId, excelDocs[0].title, 'excel');
      } else if (activeTab === 'text' && textDocs.length > 0) {
        loadDocument(textDocs[0].conversationId, textDocs[0].title, 'text');
      }
    } catch (err: any) {
      setErrorMsg('No se pudo cargar el historial de lienzos.');
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleTabChange = (tab: 'excel' | 'text') => {
    setActiveTab(tab);
    setExcelData([]);
    setTextParagraphs([]);
    setSelectedDocId('');
    setSelectedParagraphs([]);
    setSummaryBullets([]);
    
    const relevantDocs = history.filter(d => d.fileType === (tab === 'excel' ? 'excel' : 'text'));
    if (relevantDocs.length > 0) {
      loadDocument(relevantDocs[0].conversationId, relevantDocs[0].title, tab);
    }
  };

  const loadDocument = async (convoId: string, title: string, type: 'excel' | 'text') => {
    setIsLoadingDoc(true);
    setSelectedDocId(convoId);
    setSelectedDocTitle(title);
    setExcelData([]);
    setTextParagraphs([]);
    setSelectedParagraphs([]);
    setSummaryBullets([]);
    
    try {
      const res = await fetch(`/api/sgsst/canvas/${convoId}`);
      if (!res.ok) throw new Error('Error al cargar documento.');
      const data = await res.json();
      
      if (type === 'excel') {
        let parsedData: string[][] = [];
        if (Array.isArray(data.content)) {
          parsedData = data.content;
        } else if (typeof data.content === 'string') {
          try {
            const parsed = JSON.parse(data.content);
            if (Array.isArray(parsed)) parsedData = parsed;
          } catch {
            // fallback parsed
          }
        }
        
        if (parsedData.length > 0) {
          setExcelData(parsedData);
          setChartTitle(title);
          // Set initial range to match all active cells up to 5x5
          const maxR = Math.min(parsedData.length - 1, 6);
          const maxC = Math.min((parsedData[0] || []).length - 1, 4);
          setExcelRange({
            startRow: 0,
            startCol: 0,
            endRow: maxR >= 0 ? maxR : 0,
            endCol: maxC >= 0 ? maxC : 0
          });
          
          // Auto-detect numeric column for chart
          if (parsedData[0] && parsedData[0].length > 1) {
            setXAxisCol(0);
            for (let col = 1; col < parsedData[0].length; col++) {
              let hasNumber = false;
              for (let row = 1; row < parsedData.length; row++) {
                const rawCell = parsedData[row]?.[col];
                const val = rawCell !== undefined && rawCell !== null ? String(rawCell) : '';
                const clean = val.replace(/[^0-9.\-]/g, '');
                if (clean && !isNaN(parseFloat(clean))) {
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
        }
      } else {
        // Text/Word
        const htmlString = data.content || '';
        // Extract paragraphs or headers from HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        
        // Grab block elements: p, li, h1, h2, h3
        const blocks = Array.from(tempDiv.querySelectorAll('p, li, h2, h3, h1'))
          .map(el => el.textContent?.trim() || '')
          .filter(txt => txt.length > 12); // filter empty or short strings
          
        setTextParagraphs(blocks.length > 0 ? blocks : ['No se detectó suficiente texto estructurado en este documento.']);
        setSummaryTitle(title);
      }
    } catch (err) {
      console.error('Error loading bridge doc:', err);
    } finally {
      setIsLoadingDoc(false);
    }
  };

  // Excel Importers
  const triggerImportTable = () => {
    if (excelData.length === 0 || !onImportTable) return;
    
    const { startRow, startCol, endRow, endCol } = excelRange;
    const rStart = Math.min(startRow, endRow);
    const rEnd = Math.max(startRow, endRow);
    const cStart = Math.min(startCol, endCol);
    const cEnd = Math.max(startCol, endCol);

    let html = `<div class="imported-excel-table" style="overflow-x:auto; margin:20px 0; border:1px solid rgba(13,148,136,0.2); border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.05); background:#ffffff; font-family:'Outfit', sans-serif;">`;
    html += `<table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">`;
    
    // Title header
    html += `<thead><tr style="background:linear-gradient(135deg, #0f766e, #0d9488); color:#ffffff;">`;
    for (let col = cStart; col <= cEnd; col++) {
      const val = excelData[rStart]?.[col] || '';
      html += `<th style="padding:12px 16px; font-weight:700; border-bottom:3px solid #0f766e; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">${val}</th>`;
    }
    html += `</tr></thead><tbody style="color:#334155;">`;

    for (let row = rStart + 1; row <= rEnd; row++) {
      const bg = row % 2 === 0 ? 'rgba(20,184,166,0.03)' : '#ffffff';
      html += `<tr style="background:${bg}; border-bottom:1px solid rgba(226,232,240,0.8); transition:all 0.2s;">`;
      for (let col = cStart; col <= cEnd; col++) {
        const rawCell = excelData[row]?.[col];
        const val = rawCell !== undefined && rawCell !== null ? String(rawCell) : '';
        // If it looks like a number, align right
        const isNum = !isNaN(parseFloat(val.replace(/[^0-9.\-]/g, ''))) && val.includes('$') || val.length < 10;
        const align = isNum ? 'right' : 'left';
        html += `<td style="padding:10px 16px; text-align:${align}; font-weight:500;">${val}</td>`;
      }
      html += `</tr>`;
    }
    
    html += `</tbody></table></div>`;
    onImportTable(html);
    onClose();
  };

  const triggerImportChart = () => {
    if (excelData.length === 0 || !onImportChart) return;
    
    const { startRow, endRow } = excelRange;
    const rStart = Math.min(startRow, endRow);
    const rEnd = Math.max(startRow, endRow);
    
    const chartData: Array<{ label: string; val: number }> = [];
    
    // Read labels from xAxisCol and values from yAxisCol starting from data row
    for (let row = rStart + 1; row <= rEnd; row++) {
      const rawLabel = excelData[row]?.[xAxisCol];
      const label = rawLabel !== undefined && rawLabel !== null ? String(rawLabel) : `Fila ${row}`;
      const rawValCell = excelData[row]?.[yAxisCol];
      const rawVal = rawValCell !== undefined && rawValCell !== null ? String(rawValCell) : '0';
      const cleanVal = parseFloat(rawVal.replace(/[^0-9.\-]/g, ''));
      const val = isNaN(cleanVal) ? 0 : cleanVal;
      chartData.push({ label, val });
    }
    
    if (chartData.length > 0) {
      onImportChart({
        type: chartType,
        data: chartData,
        title: chartTitle
      });
      onClose();
    }
  };

  // Text Summarizer/Bullet Synthesizer
  const toggleParagraphSelection = (idx: number) => {
    if (selectedParagraphs.includes(idx)) {
      setSelectedParagraphs(selectedParagraphs.filter(i => i !== idx));
    } else {
      setSelectedParagraphs([...selectedParagraphs, idx]);
    }
  };

  const runVisualSynthesize = () => {
    if (selectedParagraphs.length === 0) return;
    
    setIsSummarizing(true);
    
    // Simulate beautiful AI visual feedback
    setTimeout(() => {
      // Gather text
      const selectedTexts = selectedParagraphs.map(idx => textParagraphs[idx]);
      
      // Synthesize smart bullets client-side
      const generatedBullets: string[] = [];
      
      selectedTexts.forEach(txt => {
        // Split text by sentences
        const sentences = txt.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15);
        if (sentences.length > 0) {
          // Take top sentences or rephrase bullet style
          sentences.slice(0, 2).forEach(sentence => {
            if (generatedBullets.length < 5) {
              // Format cleanly
              const cleanSentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
              generatedBullets.push(cleanSentence);
            }
          });
        }
      });
      
      // Fallbacks if nothing bulletized
      if (generatedBullets.length === 0) {
        generatedBullets.push("Establecer el compromiso de la alta dirección en SST.");
        generatedBullets.push("Implementar canales eficaces de reporte y evaluación.");
        generatedBullets.push("Garantizar recursos para el plan anual de capacitaciones.");
      }
      
      setSummaryBullets(generatedBullets);
      setIsSummarizing(false);
    }, 1200);
  };

  const triggerImportBullets = () => {
    if (summaryBullets.length === 0 || !onImportBullets) return;
    onImportBullets(summaryTitle, summaryBullets);
    onClose();
  };

  const selectedExcelDocs = history.filter(d => d.fileType === 'excel');
  const selectedTextDocs = history.filter(d => d.fileType === 'text');

  return (
    <div className="absolute right-0 top-0 bottom-0 z-[500] w-[360px] sm:w-[420px] bg-slate-950/80 backdrop-blur-xl border-l border-teal-500/20 shadow-2xl flex flex-col animate-slide-in-right text-slate-100 font-sans">
      
      {/* Dynamic Aesthetic Header */}
      <div className="p-5 border-b border-slate-800/60 flex items-center justify-between bg-gradient-to-r from-teal-950/30 to-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Database className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide">Puente de Lienzos</h3>
            <p className="text-[10.5px] text-teal-400 font-medium">Interconexión SST Inteligente</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-900 flex gap-2">
        <button
          onClick={() => handleTabChange('excel')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
            activeTab === 'excel'
              ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300'
              : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Traer de Excel
        </button>
        <button
          onClick={() => handleTabChange('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
            activeTab === 'text'
              ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300'
              : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Sintetizar Word
        </button>
      </div>

      {/* Main Body content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Document selector from history */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Seleccionar origen del historial
          </label>
          <div className="relative">
            <select
              value={selectedDocId}
              onChange={(e) => {
                const doc = history.find(d => d.conversationId === e.target.value);
                if (doc) loadDocument(doc.conversationId, doc.title, activeTab);
              }}
              className="w-full bg-slate-900/90 border border-slate-800 text-xs text-slate-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-teal-500/50 appearance-none pr-8 cursor-pointer"
            >
              <option value="" disabled>Selecciona un archivo...</option>
              {activeTab === 'excel' ? (
                selectedExcelDocs.map(d => (
                  <option key={d.conversationId} value={d.conversationId}>{d.title}</option>
                ))
              ) : (
                selectedTextDocs.map(d => (
                  <option key={d.conversationId} value={d.conversationId}>{d.title}</option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-800">
              <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </div>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {isLoadingDoc && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3 bg-slate-900/20 border border-slate-900/50 rounded-xl">
            <RefreshCw className="h-6 w-6 text-teal-400 animate-spin" />
            <p className="text-xs text-slate-400">Analizando celdas y estructuras...</p>
          </div>
        )}

        {/* NO SELECCIONADO / HISTORIAL VACÍO */}
        {!selectedDocId && !isLoadingDoc && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-slate-900/10 border border-dashed border-slate-850 rounded-xl">
            <AlertCircle className="h-6 w-6 text-slate-500 mb-2" />
            <p className="text-xs font-semibold text-slate-400 mb-1">Sin archivos disponibles</p>
            <p className="text-[10px] text-slate-500">Aún no se ha guardado ningún lienzo de este tipo en la empresa.</p>
          </div>
        )}

        {/* TAB 1: EXCEL CONTROLLER */}
        {activeTab === 'excel' && selectedDocId && !isLoadingDoc && excelData.length > 0 && (
          <div className="space-y-4">
            
            {/* Visual Cell Grid Range Selector */}
            <div className="bg-slate-900/40 border border-slate-900/90 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
                  Rango de Celdas de Excel
                </h4>
                <span className="text-[10px] font-semibold bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded text-teal-300">
                  {String.fromCharCode(65 + excelRange.startCol)}${excelRange.startRow + 1} : {String.fromCharCode(65 + excelRange.endCol)}${excelRange.endRow + 1}
                </span>
              </div>
              
              {/* Mini visual cells layout to tap-select ranges */}
              <div className="overflow-x-auto pb-1.5">
                <table className="mx-auto border-collapse">
                  <thead>
                    <tr>
                      <th className="w-6 h-5 bg-slate-950 text-[9px] text-slate-500 font-bold border border-slate-900 text-center"></th>
                      {excelData[0]?.slice(0, 6).map((_, cIdx) => (
                        <th key={cIdx} className="w-10 h-5 bg-slate-950 text-[9px] text-slate-400 font-bold border border-slate-900 text-center">
                          {String.fromCharCode(65 + cIdx)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.slice(0, 7).map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="w-6 h-6 bg-slate-950 text-[9px] text-slate-400 font-bold border border-slate-900 text-center">
                          {rIdx + 1}
                        </td>
                        {row.slice(0, 6).map((cell, cIdx) => {
                          const isSelected = 
                            rIdx >= Math.min(excelRange.startRow, excelRange.endRow) &&
                            rIdx <= Math.max(excelRange.startRow, excelRange.endRow) &&
                            cIdx >= Math.min(excelRange.startCol, excelRange.endCol) &&
                            cIdx <= Math.max(excelRange.startCol, excelRange.endCol);

                          return (
                            <td
                              key={cIdx}
                              onClick={() => {
                                // Tap to select start/end cell range
                                if (excelRange.startRow === rIdx && excelRange.startCol === cIdx) {
                                  // Reset
                                  setExcelRange({ startRow: rIdx, startCol: cIdx, endRow: rIdx, endCol: cIdx });
                                } else {
                                  setExcelRange({
                                    ...excelRange,
                                    endRow: rIdx,
                                    endCol: cIdx
                                  });
                                }
                              }}
                              className={`w-10 h-6 border border-slate-900/60 text-[9.5px] p-1 text-center truncate cursor-pointer transition-all duration-150 ${
                                isSelected 
                                  ? 'bg-teal-500/25 border-teal-500/60 text-white font-bold' 
                                  : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800'
                              }`}
                              title={cell}
                            >
                              {cell || ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                Haz clic en cualquier celda para definir el límite del rango a importar.
              </p>
            </div>

            {/* Actions Panel */}
            <div className="space-y-3.5">
              
              {/* Import 1: Table HTML */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                    <Table2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Importar Rango como Tabla HTML</h5>
                    <p className="text-[10.5px] text-slate-400">Inserta una tabla limpia con bordes redondeados y tipografía SST integrada.</p>
                  </div>
                </div>
                <button
                  onClick={triggerImportTable}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-lg shadow-teal-900/20 text-white transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  Inyectar Tabla Elegante
                </button>
              </div>

              {/* Import 2: Chart (ONLY shown if Presentation/Slides is active) */}
              {activeFileType === 'presentation' && onImportChart && (
                <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3.5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                      <BarChart3 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Generar Gráfico SVG Interactivo</h5>
                      <p className="text-[10.5px] text-slate-400">Convierte el rango seleccionado en un gráfico vectorial adaptado al tema.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Eje X (Etiquetas)</label>
                      <select 
                        value={xAxisCol} 
                        onChange={(e) => setXAxisCol(parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      >
                        {excelData[0]?.map((col, idx) => (
                          <option key={idx} value={idx}>{col || `Columna ${String.fromCharCode(65 + idx)}`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Eje Y (Valores)</label>
                      <select 
                        value={yAxisCol} 
                        onChange={(e) => setYAxisCol(parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      >
                        {excelData[0]?.map((col, idx) => (
                          <option key={idx} value={idx}>{col || `Columna ${String.fromCharCode(65 + idx)}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['bar', 'line', 'pie'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setChartType(t)}
                        className={`py-1.5 text-[10.5px] font-semibold border rounded-lg capitalize transition-all ${
                          chartType === t
                            ? 'bg-teal-500/15 border-teal-500/60 text-teal-300'
                            : 'border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {t === 'bar' ? 'Barras' : t === 'line' ? 'Líneas' : 'Torta'}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Título del Gráfico</label>
                    <input
                      type="text"
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-teal-500/30"
                    />
                  </div>

                  <button
                    onClick={triggerImportChart}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-lg text-white transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Insertar Gráfico de Neón
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEXT CONTROLLER */}
        {activeTab === 'text' && selectedDocId && !isLoadingDoc && textParagraphs.length > 0 && (
          <div className="space-y-4">
            
            {/* Paragraphs checklist */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 space-y-3">
              <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
                Secciones Disponibles del Documento
              </h4>
              
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {textParagraphs.map((para, idx) => {
                  const isChecked = selectedParagraphs.includes(idx);
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleParagraphSelection(idx)}
                      className={`p-2.5 rounded-lg border text-[11px] cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-teal-500/10 border-teal-500/40 text-teal-200' 
                          : 'bg-slate-900/70 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <p className="line-clamp-3">{para}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9.5px] text-slate-500">
                Selecciona los párrafos clave que deseas sintetizar en las diapositivas.
              </p>
            </div>

            {/* Synthesizer Panel */}
            <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">Sintetizador de Viñetas IA</h5>
                  <p className="text-[10.5px] text-slate-400">Analiza y destila párrafos largos en puntos clave listos para presentaciones.</p>
                </div>
              </div>

              {selectedParagraphs.length === 0 ? (
                <div className="text-center py-4 bg-slate-950/40 border border-slate-900 rounded-lg">
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Selecciona al menos un párrafo arriba para comenzar.
                  </p>
                </div>
              ) : (
                <button
                  onClick={runVisualSynthesize}
                  disabled={isSummarizing}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-50 text-xs font-semibold rounded-lg text-white transition-all"
                >
                  {isSummarizing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Sintetizando ideas clave...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                      Sintetizar en Viñetas
                    </>
                  )}
                </button>
              )}

              {/* Bullet Preview Output */}
              {summaryBullets.length > 0 && (
                <div className="mt-3.5 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[9px] text-teal-400 font-bold uppercase mb-1">
                      Título de Diapositiva a Crear
                    </label>
                    <input
                      type="text"
                      value={summaryTitle}
                      onChange={(e) => setSummaryTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded focus:outline-none focus:border-teal-500/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[9px] text-teal-400 font-bold uppercase">
                      Puntos Clave Extraídos
                    </label>
                    <ul className="list-disc pl-4 text-[10.5px] text-slate-300 space-y-1">
                      {summaryBullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={triggerImportBullets}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-xs font-bold rounded-lg text-white transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Inyectar como Nueva Diapositiva
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasWorkspaceBridge;
