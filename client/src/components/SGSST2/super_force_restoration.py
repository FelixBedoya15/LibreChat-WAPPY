import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'

def super_replace(code):
    # 1. Historial
    def repl_hist(m):
        onclick = m.group(1)
        return f'<button onClick={{{onclick}}} title="Historial" className={{`group flex items-center px-4 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer ${{isHistoryOpen ? \'bg-teal-100 text-teal-700\' : \'bg-surface-primary text-text-primary hover:bg-surface-hover\'}}`}}>\n                    <AnimatedIcon name="history" size={{20}} />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Historial</span>\n                </button>'
    code = re.sub(r'<button[^>]*onClick=\{([^}]+)\}[^>]*title="Historial"[^>]*>.*?</button>', repl_hist, code, flags=re.DOTALL)

    # 2. Generar IA
    def repl_gen(m):
        onclick = m.group(1)
        disabled = m.group(2)
        title = m.group(3)
        inner = m.group(4)
        return f'<button onClick={{{onclick}}} disabled={{{disabled}}} title="{title}" className="group flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">\n                    {inner.strip()}\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">{title}</span>\n                </button>'
    code = re.sub(r'<button[^>]*onClick=\{([^}]+)\}[^>]*disabled=\{([^}]+)\}[^>]*title="(Generar[^"]+)"[^>]*>(.*?)</button>', repl_gen, code, flags=re.DOTALL)

    # 3. Guardar Datos
    def repl_data(m):
        onclick = m.group(1)
        return f'<button onClick={{{onclick}}} title="Guardar Datos" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 cursor-pointer">\n                    <AnimatedIcon name="database" size={{20}} className="text-gray-500" />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Guardar Datos</span>\n                </button>'
    code = re.sub(r'<button[^>]*onClick=\{([^}]+)\}[^>]*title="Guardar Datos"[^>]*>.*?</button>', repl_data, code, flags=re.DOTALL)

    # 4. Guardar Informe
    def repl_save(m):
        onclick = m.group(1)
        disabled = m.group(2)
        return f'<button onClick={{{onclick}}} disabled={{{disabled}}} title="Guardar Informe" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">\n                    <AnimatedIcon name="save" size={{20}} className="text-indigo-600" />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Guardar Informe</span>\n                </button>'
    code = re.sub(r'<button[^>]*onClick=\{([^}]+)\}[^>]*disabled=\{([^}]+)\}[^>]*title="Guardar Informe"[^>]*>.*?</button>', repl_save, code, flags=re.DOTALL)

    # 5. Exportar disabled fallback
    def repl_export(m):
        return f'<button disabled title="Exportar" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium text-text-primary rounded-full opacity-50 shadow-sm shrink-0 cursor-not-allowed">\n                        <Download className="h-5 w-5" />\n                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Exportar</span>\n                    </button>'
    code = re.sub(r'<button[^>]*disabled[^>]*title="Exportar"[^>]*>.*?</button>', repl_export, code, flags=re.DOTALL)

    # Let's fix missing ones like "Generar Peligros IA" or "Bandeja de Entrada" etc if they were affected?
    # No, only standard toolbars. But let's check custom buttons in ReporteActosCondiciones that were W-10
    
    # Reportes (Bandeja de Entrada)
    def repl_bandeja(m):
        return f'<button onClick={{() => setIsHistoryOpen(!isHistoryOpen)}} title="Bandeja de Entrada" className={{`group flex items-center px-4 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer ${{isHistoryOpen ? \'bg-orange-100 text-orange-700 dark:bg-orange-900/30\' : \'bg-surface-primary text-text-primary hover:bg-surface-hover\'}}`}}>\n                    <AnimatedIcon name="history" size={{20}} />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Bandeja de Entrada</span>\n                </button>'
    code = re.sub(r'<button[^>]*onClick=\{[^}]*\}[^>]*title="Bandeja de Entrada"[^>]*>.*?</button>', repl_bandeja, code, flags=re.DOTALL)

    # Portal Publico
    def repl_portal(m):
        onclick = m.group(1)
        return f'<button onClick={{{onclick}}} title="Portal Público" className="group relative flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer">\n                    <div className="relative">\n                        <AnimatedIcon name="history" size={{20}} />\n                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">\n                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>\n                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>\n                        </span>\n                    </div>\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Portal Público</span>\n                </button>'
    code = re.sub(r'<button[^>]*onClick=\{([^}]+)\}[^>]*title="Portal P.blico"[^>]*>.*?</button>', repl_portal, code, flags=re.DOTALL)

    # PerfilesCargo IA Dummy style
    def repl_perfiles_ia(m):
        onclick = m.group(1)
        return f'<button onClick={{{onclick}}} title="IA Dummy" className="group flex items-center px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer">\n                    <Bot className="h-5 w-5" />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">IA Dummy</span>\n                </button>'
    code = re.sub(r'<button[^>]*onClick=\{([^}]+)\}[^>]*title="IA Dummy"[^>]*>.*?</button>', repl_perfiles_ia, code, flags=re.DOTALL)

    # Exportar Excel
    def repl_export_excel(m):
        onclick = m.group(1)
        disabled = m.group(2)
        return f'<button onClick={{{onclick}}} disabled={{{disabled}}} title="Exportar Excel" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">\n                    <Download className="h-5 w-5" />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Exportar Excel</span>\n                </button>'
    code = re.sub(r'<button[^>]*onClick=\{([^}]+)\}[^>]*disabled=\{([^}]+)\}[^>]*title="Exportar Excel"[^>]*>.*?</button>', repl_export_excel, code, flags=re.DOTALL)

    return code

for file in os.listdir(sgsst_dir):
    if not file.endswith('.tsx'): continue
    path = os.path.join(sgsst_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    modified = super_replace(original)

    # Also we must fix the `hideText` on ModelSelector/DummyGenerateButton/ExportDropdown if they still exist!
    modified = modified.replace(' hideText />', ' />')
    modified = modified.replace(' hideText>', '>')
    
    # Some instances might be hideText={true} etc
    modified = modified.replace('hideText={true}', '')

    if modified != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Super-fixed {file}")

