import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'

for file in os.listdir(sgsst_dir):
    if not file.endswith('.tsx'): continue
    path = os.path.join(sgsst_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    changed = False

    # 1. Historial
    def repl_history(m):
        return f'<button onClick={{() => setIsHistoryOpen(!isHistoryOpen)}} title="Historial" className={{`group flex items-center px-4 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer ${{isHistoryOpen ? \'bg-teal-100 text-teal-700\' : \'bg-surface-primary text-text-primary hover:bg-surface-hover\'}}`}}>\n                    <AnimatedIcon name="history" size={{20}} />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Historial</span>\n                </button>'

    new_code = re.sub(r'<button\s+onClick=\{[^}]*\}\s*title="Historial".*?</button>', repl_history, code, flags=re.DOTALL)
    if new_code != code: code = new_code; changed = True

    # 2. Generar IA
    # Match button with "Generar Informe IA" or similar, capture onClick and disabled, and inner icon
    def repl_gen(m):
        onclick = m.group(1)
        disabled = m.group(2)
        title = m.group(3)
        inner = m.group(4).strip()
        # Keep inner exactly as it is (it contains Loader + AnimatedIcon)
        return f'<button onClick={{{onclick}}} disabled={{{disabled}}} title="{title}" className="group flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">\n                    {inner}\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">{title}</span>\n                </button>'

    new_code = re.sub(r'<button\s+onClick=\{([^}]+)\}\s*disabled=\{([^}]+)\}\s*title="(Generar[^"]+)"[^>]*>(.*?)</button>', repl_gen, code, flags=re.DOTALL)
    if new_code != code: code = new_code; changed = True


    # 3. Guardar Datos
    def repl_data(m):
        onclick = m.group(1)
        return f'<button onClick={{{onclick}}} title="Guardar Datos" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 cursor-pointer">\n                    <AnimatedIcon name="database" size={{20}} className="text-gray-500" />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Guardar Datos</span>\n                </button>'
    
    new_code = re.sub(r'<button\s+onClick=\{([^}]+)\}\s*title="Guardar Datos".*?</button>', repl_data, code, flags=re.DOTALL)
    if new_code != code: code = new_code; changed = True


    # 4. Guardar Informe
    def repl_save(m):
        onclick = m.group(1)
        disabled = m.group(2)
        return f'<button onClick={{{onclick}}} disabled={{{disabled}}} title="Guardar Informe" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">\n                    <AnimatedIcon name="save" size={{20}} className="text-indigo-600" />\n                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Guardar Informe</span>\n                </button>'

    new_code = re.sub(r'<button\s+onClick=\{([^}]+)\}\s*disabled=\{([^}]+)\}\s*title="Guardar Informe".*?</button>', repl_save, code, flags=re.DOTALL)
    if new_code != code: code = new_code; changed = True


    # 5. Exportar disabled fallback
    def repl_export(m):
        return f'<button disabled title="Exportar" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium text-text-primary rounded-full opacity-50 shadow-sm shrink-0 cursor-not-allowed">\n                        <Download className="h-5 w-5" />\n                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">Exportar</span>\n                    </button>'
    
    new_code = re.sub(r'<button\s+disabled(?:="[^"]*")?\s+title="Exportar"[\s\S]*?</button>', repl_export, code)
    if new_code != code: code = new_code; changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Force-fixed {file}")

