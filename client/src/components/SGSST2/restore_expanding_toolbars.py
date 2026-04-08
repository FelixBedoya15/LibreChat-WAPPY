import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'

def replace_toolbar(code):
    # Fix ModelSelector, ExportDropdown, DummyGenerateButton by removing hideText
    code = code.replace(' hideText />', ' />')
    code = code.replace(' hideText>', '>')

    # 1. Historial
    code = re.sub(
        r'<button onClick=\{([^}]+)\}\s*title="Historial"\s*className="flex items-center justify-center w-10 h-10 border border-border-medium rounded-full transition-all duration-300 shadow-sm shrink-0 [^"]+">\s*<AnimatedIcon name="history" size=\{20\}\s*/>\s*</button>',
        r'''<button onClick={\1} title="Historial" className={`group flex items-center px-4 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer ${isHistoryOpen ? 'bg-teal-100 text-teal-700' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}>
                    <AnimatedIcon name="history" size={20} />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">
                        Historial
                    </span>
                </button>''',
        code
    )

    # 2. Generar IA
    code = re.sub(
        r'<button onClick=\{([^}]+)\}\s*disabled=\{([^}]+)\}\s*title="Generar Informe IA"\s*className="flex items-center justify-center w-10 h-10 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">\s*(.*?)\s*</button>',
        r'''<button onClick={\1} disabled={\2} title="Generar Informe IA" className="group flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    \3
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">
                        Generar IA
                    </span>
                </button>''',
        code,
        flags=re.DOTALL
    )

    # Generar Análisis (Multi) for AnalisisVulnerabilidad
    code = re.sub(
        r'<button onClick=\{([^}]+)\}\s*disabled=\{([^}]+)\}\s*title="Generar Análisis \(Multi\)"\s*className="flex items-center justify-center w-10 h-10 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">\s*(.*?)\s*</button>',
        r'''<button onClick={\1} disabled={\2} title="Generar Análisis (Multi)" className="group flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 text-white rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    \3
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">
                        Generar Análisis (Multi)
                    </span>
                </button>''',
        code,
        flags=re.DOTALL
    )

    # 4. Guardar Datos
    code = re.sub(
        r'<button onClick=\{([^}]+)\}\s*title="Guardar Datos"\s*className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50">\s*<AnimatedIcon name="database"[^>]*/>\s*</button>',
        r'''<button onClick={\1} title="Guardar Datos" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 cursor-pointer">
                    <AnimatedIcon name="database" size={20} className="text-gray-500" />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">
                        Guardar Datos
                    </span>
                </button>''',
        code
    )

    # 5. Guardar Informe
    code = re.sub(
        r'<button onClick=\{([^}]+)\}\s*disabled=\{([^}]+)\}\s*title="Guardar Informe"\s*className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">\s*<AnimatedIcon name="save"[^>]*/>\s*</button>',
        r'''<button onClick={\1} disabled={\2} title="Guardar Informe" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    <AnimatedIcon name="save" size={20} className="text-indigo-600" />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">
                        Guardar Informe
                    </span>
                </button>''',
        code
    )
    
    # 6. Fallback Exportar Icon replacement (disabled state)
    code = re.sub(
        r'<button disabled title="Exportar" className="flex items-center justify-center w-10 h-10 bg-surface-primary border border-border-medium text-text-primary rounded-full opacity-50 shadow-sm shrink-0 cursor-not-allowed">\s*<Download className="h-5 w-5" />\s*</button>',
        r'''<button disabled title="Exportar" className="group flex items-center px-4 py-2 bg-surface-primary border border-border-medium text-text-primary rounded-full opacity-50 shadow-sm shrink-0 cursor-not-allowed">
                        <Download className="h-5 w-5" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">
                            Exportar
                        </span>
                    </button>''',
        code
    )

    return code

for file in os.listdir(sgsst_dir):
    if not file.endswith('.tsx'): continue
    path = os.path.join(sgsst_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    modified = replace_toolbar(original)

    if modified != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Restored expanding buttons in {file}")

