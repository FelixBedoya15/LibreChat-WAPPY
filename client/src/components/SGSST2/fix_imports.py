import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'

for file in os.listdir(sgsst_dir):
    if not file.endswith('.tsx'): continue
    
    path = os.path.join(sgsst_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    changed = False

    if 'Download' in code and 'Download' not in code.split('lucide-react')[0]:
        if re.search(r'import \{[^}]*Download[^}]*\} from [\'"]lucide-react[\'"]', code) is None:
            code = re.sub(r'(import \{[^}]*)( \}( |\n)*from [\'"]lucide-react[\'"])', r'\1, Download\2', code)
            changed = True
            
    if 'Bot' in code and 'Bot' not in code.split('lucide-react')[0]:
        if re.search(r'import \{[^}]*Bot[^}]*\} from [\'"]lucide-react[\'"]', code) is None:
            code = re.sub(r'(import \{[^}]*)( \}( |\n)*from [\'"]lucide-react[\'"])', r'\1, Bot\2', code)
            changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"[{file}] Fixed missing imports")
