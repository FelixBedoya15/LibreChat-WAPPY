import os
import re

sgsst_dir = '/Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/SGSST'

for file in os.listdir(sgsst_dir):
    if not file.endswith('.tsx'): continue
    
    path = os.path.join(sgsst_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    changed = False

    if 'onClick={handleSave}' in code:
        code = code.replace('onClick={handleSave}', 'onClick={() => handleSave()}')
        changed = True

    if 'onClick={handleSaveData}' in code:
        code = code.replace('onClick={handleSaveData}', 'onClick={() => handleSaveData()}')
        changed = True

    if 'onClick={handleGenerate}' in code:
        code = code.replace('onClick={handleGenerate}', 'onClick={() => handleGenerate()}')
        changed = True

    if file == 'PerfilesCargo.tsx':
        code = code.replace('\n, Download , Bot }', ',\n    Download,\n    Bot\n}')
        changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Fixed {file}")

