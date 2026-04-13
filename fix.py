import os
import re

dir_path = 'client/src/components/SGSST'

for filename in os.listdir(dir_path):
    if not filename.endswith('.tsx'):
        continue
        
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix the TAG in CondicionesSalud
    if filename == 'CondicionesSalud.tsx':
        content = content.replace("tags: ['sgsst-perfil-sociodemografico']", "tags: ['sgsst-condiciones-salud']")
        content = content.replace("tags={['sgsst-perfil-sociodemografico']}", "tags={['sgsst-condiciones-salud']}")

    # Find all setEditorContent calls that are NOT part of onUpdate
    # They look like `setEditorContent(...)`
    # We will replace `setEditorContent(var)` with `setEditorContent(var); setEditorKey(Date.now().toString())`
    # BUT we string-match to ensure we don't duplicate setEditorKey if it's already there
    # AND we skip lines containing `onUpdate=` or `(html) =>` or `(content) =>` 
    
    lines = content.split('\n')
    new_lines = []
    modified = False
    
    for line in lines:
        if 'setEditorContent(' in line and 'onUpdate' not in line and '=>' not in line:
            if 'setEditorKey' not in line:
                # Add setEditorKey(Date.now().toString()); after setEditorContent(...);
                # Find the end of setEditorContent(...)
                line = re.sub(r'(setEditorContent\([^)]+\);?)', r'\1 setEditorKey(Date.now().toString());', line)
                modified = True
        new_lines.append(line)
        
    if modified or filename == 'CondicionesSalud.tsx':
        with open(filepath, 'w') as f:
            f.write('\n'.join(new_lines))
        print(f"Fixed {filename}")

