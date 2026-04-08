import re
import os

files_with_errors = [
    'MatrizLegal.tsx', 'MetodoOwas.tsx', 'ObjetivosSST.tsx', 'PerfilesCargo.tsx',
    'PermisoAlturas.tsx', 'PoliticaSST.tsx', 'ReglamentoHigiene.tsx',
    'ReglamentoInterno.tsx', 'ResponsableSGSST.tsx'
]

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'

for file_name in files_with_errors:
    path = os.path.join(sgsst_dir, file_name)
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    changed = False

    # Fix imports robustly
    if '<Download' in code and 'Download' not in re.findall(r'import\s+\{[^}]*\}\s+from\s+[\'"]lucide-react[\'"]', code)[0]:
        new_code = re.sub(r'(import\s+\{[^}]*)(?=\}\s+from\s+[\'"]lucide-react[\'"])', r'\1, Download ', code)
        if new_code != code:
            code = new_code
            changed = True

    if '<Bot' in code and 'Bot' not in re.findall(r'import\s+\{[^}]*\}\s+from\s+[\'"]lucide-react[\'"]', code)[0]:
        new_code = re.sub(r'(import\s+\{[^}]*)(?=\}\s+from\s+[\'"]lucide-react[\'"])', r'\1, Bot ', code)
        if new_code != code:
            code = new_code
            changed = True

    # Fix handleSaveData definition missing
    if 'handleSaveData' in code and 'const handleSaveData' not in code and 'function handleSaveData' not in code:
        # It's an undefined function call. Often the form just uses handleSave for everything or doesn't have partial saves.
        # We can either hide the Guardar Datos button or map it to handleSave without arguments
        # Actually mapping handleSaveData to handleSave might cause dual-saving.
        # Better: remove the Guardar Datos button if it wasn't there before, or replace it with handleSave.
        # Actually handleSave usually saves both content and form.
        # Let's map it to handleSave 
        new_code = code.replace('() => handleSaveData(false)', 'handleSave')
        if new_code != code:
            code = new_code
            changed = True

    # Fix generatedReport missing
    if 'generatedReport' in code and 'const [generatedReport' not in code:
        # replace `!editorContent && !generatedReport` -> `!editorContent`
        new_code = code.replace('!editorContent && !generatedReport', '!editorContent')
        # replace `editorContent || generatedReport || ''` -> `editorContent || ''`
        new_code = new_code.replace('editorContent || generatedReport || \'\'', 'editorContent || \'\'')
        if new_code != code:
            code = new_code
            changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Fixed {file_name}")

