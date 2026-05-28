import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'
span_pattern = r'(<span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">\s*[^<]*?\s*</span>\s*)'

def deduplicate(code):
    # Find all sequences of 2 or more of these spans
    # It's easier to just match the span pattern and if we find duplicates in a single button, keep the last one.
    
    def repl_button(m):
        button_content = m.group(0)
        spans = re.findall(span_pattern, button_content)
        if len(spans) > 1:
            # Remove all but the LAST span (the most recently added one by super_force_restoration)
            for s in spans[:-1]:
                button_content = button_content.replace(s, '')
        return button_content

    # Fix buttons
    code = re.sub(r'<button[^>]*>.*?</button>', repl_button, code, flags=re.DOTALL)
    return code

# Fix PerfilesCargo.tsx syntax error directly
def fix_perfiles_cargo(code):
    bad_syntax = '''                        } title="IA Dummy" className="group flex items-center px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer">
                    <Bot className="h-5 w-5" />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">IA Dummy</span>
                </button>'''
                
    good_syntax = '''                        };
                        setFormData(dummy);
                        showToast({ message: 'Ejemplo cargado', status: 'success' });
                    }}
                    title="IA Dummy"
                    className="group flex items-center px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer"
                >
                    <Bot className="h-5 w-5" />
                    <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">IA Dummy</span>
                </button>'''
    
    return code.replace(bad_syntax, good_syntax)

for file in os.listdir(sgsst_dir):
    if not file.endswith('.tsx'): continue
    path = os.path.join(sgsst_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    modified = deduplicate(original)
    
    if file == 'PerfilesCargo.tsx':
        modified = fix_perfiles_cargo(modified)

    if modified != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Fixed duplicates in {file}")

