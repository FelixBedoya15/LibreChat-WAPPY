const fs = require('fs');
const path = require('path');

const sgsstDir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST';
const filesToProcess = [
  'ResponsableSGSST.tsx', 'ReglamentoInterno.tsx', 'ObjetivosSST.tsx',
  'AnalisisTrabajoSeguro.tsx', 'PoliticaSST.tsx', 'PermisoAlturas.tsx',
  'PerfilesCargo.tsx', 'MatrizLegal.tsx', 'EstadisticasATEL.tsx',
  'ReglamentoHigiene.tsx', 'AuditoriaChecklist.tsx', 'DiagnosticoChecklist.tsx',
  'MetodoOwas.tsx', 'InvestigacionATEL.tsx'
];

for (const file of filesToProcess) {
  const filePath = path.join(sgsstDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Extract key info, e.g. fileName
  const fileNameMatch = code.match(/fileName=["']([^"']+)["']/);
  const fileName = fileNameMatch ? fileNameMatch[1] : file.replace('.tsx', '');
  
  const generateMatch = code.match(/onClick=\{([a-zA-Z]+)\}[^>]+>.*?Generar/si);
  let generateFn = 'handleAnalyze';
  if (generateMatch) generateFn = generateMatch[1];
  else if (code.includes('handleGenerate')) generateFn = 'handleGenerate';
  else if (code.includes('handleAnalyze')) generateFn = 'handleAnalyze';
  
  const genDisableMatch = code.match(/disabled=\{([a-zA-Z]+)\}[^>]*?>.*?Generar/si);
  let genDisabled = 'isAnalyzing';
  if (genDisableMatch) genDisabled = genDisableMatch[1];
  else if (code.includes('isGenerating')) genDisabled = 'isGenerating';
  else if (code.includes('isAnalyzing')) genDisabled = 'isAnalyzing';
  
  const saveReportMatch = code.match(/onClick=\{([a-zA-Z]+)\}[^>]+>.*?Guardar (Informe|Reporte)/si);
  const saveReportFn = saveReportMatch ? saveReportMatch[1] : (code.includes('handleSaveReport') ? 'handleSaveReport' : 'handleSave');
  
  const saveDataMatch = code.match(/onClick=\{[\(\)\s=>]*([a-zA-Z]+)(\(\S*\))?\}[^>]+>.*?Guardar Datos/si);
  const saveDataFnCall = saveDataMatch ? (saveDataMatch[2] ? `() => ${saveDataMatch[1]}${saveDataMatch[2]}` : saveDataMatch[1]) : 'handleSaveData';
  
  let theName = code.match(/<h[123].*?>([^<]*)<\/h[123]>/);
  theName = theName ? theName[1].trim() : file;

  // Now locate the Toolbar container
  // Usually it includes <DummyGenerateButton
  const parts = code.split(/<DummyGenerateButton[^>]*\/>/);
  if (parts.length < 2) {
    console.log(`Skipping ${file}: Data extraction failed.`);
    continue;
  }
  
  console.log(`\n=== File: ${file} ===`);
  console.log(`Generate fn: ${generateFn}, disabled: ${genDisabled}, save report: ${saveReportFn}, save data: ${saveDataFnCall}, file name: ${fileName}`);
}
