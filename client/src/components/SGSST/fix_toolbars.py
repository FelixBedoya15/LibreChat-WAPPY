import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'
files = [
  'ResponsableSGSST.tsx', 'ReglamentoInterno.tsx', 'ObjetivosSST.tsx',
  'AnalisisTrabajoSeguro.tsx', 'PoliticaSST.tsx', 'PermisoAlturas.tsx',
  'PerfilesCargo.tsx', 'MatrizLegal.tsx', 'EstadisticasATEL.tsx',
  'ReglamentoHigiene.tsx', 'AuditoriaChecklist.tsx', 'DiagnosticoChecklist.tsx',
  'MetodoOwas.tsx', 'InvestigacionATEL.tsx'
]

template = """            {/* ═══ Toolbar ═══ */}
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide py-1 w-full border border-border-medium p-2 rounded-xl bg-surface-secondary shadow-sm">
                {/* Historial */}
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} title="Historial" className={`flex items-center justify-center w-10 h-10 border border-border-medium rounded-full transition-all duration-300 shadow-sm shrink-0 ${isHistoryOpen ? 'bg-teal-100 text-teal-700' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}>
                    <AnimatedIcon name="history" size={20} />
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Generar IA */}
                <button onClick={{GEN_FN}} disabled={{GEN_DISABLED}} title="Generar Informe IA" className="flex items-center justify-center w-10 h-10 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{GEN_DISABLED} ? <Loader2 className="h-5 w-5 animate-spin" /> : <AnimatedIcon name="sparkles" size={20} />}
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Modelo */}
                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={{GEN_DISABLED}} hideText />
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Guardar Datos */}
                <button onClick={{SAVE_DATA_FN}} title="Guardar Datos" className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50">
                    <AnimatedIcon name="database" size={20} className="text-gray-500" />
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Guardar Informe */}
                <button onClick={{SAVE_REPORT_FN}} disabled={!editorContent && !generatedReport} title="Guardar Informe" className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    <AnimatedIcon name="save" size={20} className="text-indigo-600" />
                </button>
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* Exportar */}
                {(editorContent || generatedReport) ? (
                    <ExportDropdown content={editorContent || generatedReport || ''} fileName={{FILE_NAME}} hideText />
                ) : (
                    <button disabled title="Exportar" className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium text-text-primary rounded-full opacity-50 shadow-sm shrink-0 cursor-not-allowed">
                        <Download className="h-5 w-5" />
                    </button>
                )}
                <div className="w-px h-6 bg-border-medium shrink-0 mx-1" />

                {/* IA Dummy */}
                <DummyGenerateButton onClick={handleDummyData} hideText text="IA Dummy" />
            </div>"""

def find_closing_div(code, start_idx):
    stack = 0
    i = start_idx
    while i < len(code):
        if code[i:i+4] == '<div':
            stack += 1
            i += 4
        elif code[i:i+6] == '</div>':
            stack -= 1
            if stack == 0:
                return i + 6
            i += 6
        else:
            i += 1
    return -1

for file in files:
    path = os.path.join(sgsst_dir, file)
    if not os.path.exists(path): continue
    
    with open(path, 'r', encoding='utf-8') as f: code = f.read()

    m_fileName = re.search(r'fileName=["\']([^"\']+)["\']', code)
    if m_fileName:
        file_name = f'"{m_fileName.group(1)}"'
    else:
        m_fileName2 = re.search(r'fileName=\{([^}]+)\}', code)
        file_name = f'{{{m_fileName2.group(1)}}}' if m_fileName2 else f'"{file.replace(".tsx", "")}"'

    m_gen = re.search(r'onClick=\{([a-zA-Z]+)\}[^>]+>.*?Generar', code, re.IGNORECASE)
    gen_fn = m_gen.group(1) if m_gen else ('handleGenerate' if 'handleGenerate' in code else 'handleAnalyze')

    m_gen_dis = re.search(r'disabled=\{([^}]+)\}[^>]*?>.*?Generar', code, re.IGNORECASE)
    gen_disabled = m_gen_dis.group(1) if m_gen_dis else ('isGenerating' if 'isGenerating' in code else 'isAnalyzing')

    m_save_rep = re.search(r'onClick=\{([a-zA-Z]+)\}[^>]+>.*?Guardar (Informe|Reporte|Matriz|Perfil)', code, re.IGNORECASE)
    save_report_fn = m_save_rep.group(1) if m_save_rep else ('handleSaveReport' if 'handleSaveReport' in code else 'handleSave')

    m_save_data = re.search(r'onClick=\{([\(\)\s=>]*[a-zA-Z]+(\([^\)]*\))?)\}[^>]+>.*?Guardar (Datos|Plantilla)', code, re.IGNORECASE)
    save_data_fn = m_save_data.group(1).strip() if m_save_data else '() => handleSaveData(false)'
    if not m_save_data and 'handleSaveData' in code:
        save_data_fn = 'handleSaveData'

    toolbar_code = template \
        .replace('{GEN_FN}', '{' + gen_fn + '}') \
        .replace('{GEN_DISABLED}', gen_disabled) \
        .replace('{SAVE_DATA_FN}', '{' + save_data_fn + '}') \
        .replace('{SAVE_REPORT_FN}', '{' + save_report_fn + '}') \
        .replace('{FILE_NAME}', file_name)

    # Missing Download import handling
    if 'Download' not in code and 'lucide-react' in code:
        code = re.sub(r'(import \{[^}]*)( \}( |\n)*from [\'"]lucide-react[\'"])', r'\1, Download\2', code)

    # Find the dummy generate button
    dummy_idx = code.find('<DummyGenerateButton')
    if dummy_idx == -1: 
        print(f"[{file}] No DummyGenerateButton found")
        continue
    
    # Trace back to the parent `<div`
    div_idx = code.rfind('<div', 0, dummy_idx)
    # Validate the div looks like the toolbar parent
    parent_div_text = code[div_idx:dummy_idx]
    if 'flex' not in parent_div_text or 'gap-2' not in parent_div_text:
        # maybe there's a wrapper, keep tracing back
        div_idx = code.rfind('<div', 0, div_idx)
        parent_div_text = code[div_idx:dummy_idx]
        if 'flex' not in parent_div_text:
            print(f"[{file}] Error finding parent div")
            continue

    end_idx = find_closing_div(code, div_idx)
    if end_idx == -1:
        print(f"[{file}] Error finding closing div")
        continue

    # Identify if `{/* Toolbar */}` precedes it
    pre_toolbar = code.rfind('{/* Toolbar */}', max(0, div_idx - 100), div_idx)
    if pre_toolbar != -1:
        div_idx = pre_toolbar
        
    # Identificar `{/* ═══ Toolbar ═══ */}`
    pre_toolbar_2 = code.rfind('{/* ═══ Toolbar ═══ */}', max(0, div_idx - 100), div_idx)
    if pre_toolbar_2 != -1:
        div_idx = pre_toolbar_2

    new_code = code[:div_idx] + toolbar_code + code[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_code)
    
    print(f"[{file}] Toolbar updated successfully")
